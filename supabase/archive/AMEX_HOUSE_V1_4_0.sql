-- AMEX HOUSE V1.4.0 - concorrência, duração real e edição administrativa completa
begin;
create table if not exists public.quiz_attempt_sessions(
 token uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 quiz_id uuid not null references public.amex_quiz_settings(id) on delete cascade,
 started_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '2 hours',submitted_at timestamptz,
 unique(user_id,quiz_id,token)
);
alter table public.quiz_attempt_sessions enable row level security;alter table public.quiz_attempt_sessions force row level security;
drop policy if exists attempt_sessions_owner on public.quiz_attempt_sessions;
create policy attempt_sessions_owner on public.quiz_attempt_sessions for select to authenticated using(user_id=auth.uid());

create or replace function public.amex_start_quiz(target_quiz_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();settings public.amex_quiz_settings%rowtype;token_value uuid;used integer;begin
 if actor is null then raise exception 'Sessão inválida' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||target_quiz_id::text,0));
 select * into settings from public.amex_quiz_settings where id=target_quiz_id and status='published';if not found then raise exception 'Avaliação indisponível';end if;
 select count(*) into used from public.quiz_attempts where user_id=actor and quiz_id=target_quiz_id;
 if used>=settings.max_attempts then return jsonb_build_object('ok',false,'message','Limite de tentativas atingido.','attempts_used',used,'attempts_left',0);end if;
 delete from public.quiz_attempt_sessions where user_id=actor and quiz_id=target_quiz_id and submitted_at is null and expires_at<now();
 select token into token_value from public.quiz_attempt_sessions where user_id=actor and quiz_id=target_quiz_id and submitted_at is null and expires_at>now() order by started_at desc limit 1;
 if token_value is null then insert into public.quiz_attempt_sessions(user_id,quiz_id) values(actor,target_quiz_id) returning token into token_value;end if;
 return jsonb_build_object('ok',true,'attempt_token',token_value,'attempts_used',used,'attempts_left',settings.max_attempts-used);
end$$;
revoke all on function public.amex_start_quiz(uuid) from public,anon;grant execute on function public.amex_start_quiz(uuid) to authenticated;

create or replace function public.amex_submit_quiz(attempt_token uuid,submitted_answers jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();session_row public.quiz_attempt_sessions%rowtype;settings public.amex_quiz_settings%rowtype;attempt_no integer;total integer;correct integer;score_value numeric(5,2);passed_value boolean;begin
 if actor is null or jsonb_typeof(submitted_answers)<>'object' or jsonb_object_length(submitted_answers)>100 then raise exception 'Solicitação inválida' using errcode='22023';end if;
 select * into session_row from public.quiz_attempt_sessions where token=attempt_token and user_id=actor for update;
 if not found or session_row.submitted_at is not null or session_row.expires_at<now() then raise exception 'Tentativa inválida ou expirada' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||session_row.quiz_id::text,0));
 select * into settings from public.amex_quiz_settings where id=session_row.quiz_id and status='published' for update;if not found then raise exception 'Avaliação indisponível';end if;
 select coalesce(max(attempt_number),0)+1 into attempt_no from public.quiz_attempts where user_id=actor and quiz_id=session_row.quiz_id;
 if attempt_no>settings.max_attempts then raise exception 'Limite de tentativas atingido' using errcode='22023';end if;
 select count(*) into total from public.amex_questions where quiz_id=session_row.quiz_id and status='published';
 select count(*) into correct from public.amex_questions q join public.amex_alternatives a on a.question_id=q.id and a.is_correct where q.quiz_id=session_row.quiz_id and q.status='published' and submitted_answers->q.id::text @> jsonb_build_array(a.id::text);
 score_value:=round(correct::numeric*100/nullif(total,0),2);passed_value:=score_value>=settings.passing_score;
 insert into public.quiz_attempts(user_id,quiz_id,attempt_number,score,passed,answers,started_at,submitted_at,created_at) values(actor,session_row.quiz_id,attempt_no,score_value,passed_value,submitted_answers,session_row.started_at,now(),now());
 update public.quiz_attempt_sessions set submitted_at=now() where token=attempt_token;
 insert into public.lesson_progress(user_id,lesson_id,video_percent,quiz_passed,status,updated_at) values(actor,settings.lesson_id,0,passed_value,'in_progress',now()) on conflict(user_id,lesson_id) do update set quiz_passed=public.lesson_progress.quiz_passed or excluded.quiz_passed,updated_at=now();
 return jsonb_build_object('ok',true,'score',score_value,'passed',passed_value,'correct',correct,'total',total,'attempt_number',attempt_no,'duration_seconds',greatest(0,extract(epoch from(now()-session_row.started_at))::integer),'message',case when passed_value then 'Avaliação aprovada.' else 'Revise o conteúdo e tente novamente.' end);
end$$;
revoke all on function public.amex_submit_quiz(uuid,jsonb) from public,anon;grant execute on function public.amex_submit_quiz(uuid,jsonb) to authenticated;

create or replace function public.amex_admin_get_entity(entity_name text,target_id uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$declare value jsonb;begin
 if not public.amex_is_staff(array['admin','instructor']) then raise exception 'Acesso negado' using errcode='42501';end if;
 if entity_name='courses' then select to_jsonb(x) into value from(select id,title,slug,description,workload_hours,status,position,updated_at from public.courses where id=target_id)x;
 elsif entity_name='modules' then select to_jsonb(x) into value from(select id,course_id,title,position from public.course_modules where id=target_id)x;
 elsif entity_name='lessons' then select to_jsonb(x) into value from(select id,module_id,title,summary,position,workload_hours,status,updated_at from public.lessons where id=target_id)x;
 elsif entity_name='quizzes' then select to_jsonb(x) into value from(select * from public.amex_quiz_settings where id=target_id)x;
 elsif entity_name='questions' then select to_jsonb(x) into value from(select * from public.amex_questions where id=target_id)x;
 elsif entity_name='alternatives' then select jsonb_build_object('id',id,'question_id',question_id,'text',text,'is_correct',is_correct,'position',position) into value from public.amex_alternatives where id=target_id;
 elsif entity_name='resources' then select to_jsonb(x) into value from(select * from public.lesson_resources where id=target_id)x;
 elsif entity_name='exercises' then select to_jsonb(x) into value from(select id,lesson_id,title,instructions,difficulty,position from public.lesson_exercises where id=target_id)x;
 else raise exception 'Entidade não editável';end if;return value;
end$$;
revoke all on function public.amex_admin_get_entity(text,uuid) from public,anon;grant execute on function public.amex_admin_get_entity(text,uuid) to authenticated;
commit;
