-- AMEX HOUSE V1.3.1 - estabilização completa da V1.3
-- Pré-requisitos: V1.0.1, V1.1.0, V1.2.0 e V1.3.0 aplicadas.
begin;
create extension if not exists pgcrypto;
do $$ declare required_table text; begin
 foreach required_table in array array['lessons','lesson_progress','amex_quiz_settings','amex_questions','amex_alternatives','notifications'] loop
  if to_regclass('public.'||required_table) is null then raise exception 'Tabela obrigatória ausente: public.%',required_table; end if;
 end loop;
end $$;

-- Normaliza a estrutura de vídeos existente sem perder dados.
create table if not exists public.lesson_videos(
 lesson_id uuid primary key references public.lessons(id) on delete cascade,
 youtube_id text not null check(youtube_id~'^[A-Za-z0-9_-]{11}$'),alternative_youtube_id text,
 title text not null default 'Vídeo da aula',channel text not null default 'AMEX HOUSE',
 is_embed_allowed boolean not null default true,reviewed_at timestamptz,created_at timestamptz not null default now()
);
alter table public.lesson_videos add column if not exists alternative_youtube_id text;
alter table public.lesson_videos add column if not exists title text;
alter table public.lesson_videos add column if not exists channel text;
alter table public.lesson_videos add column if not exists is_embed_allowed boolean;
alter table public.lesson_videos add column if not exists reviewed_at timestamptz;
update public.lesson_videos set title=coalesce(nullif(title,''),'Vídeo da aula'),channel=coalesce(nullif(channel,''),'AMEX HOUSE'),is_embed_allowed=coalesce(is_embed_allowed,true);
alter table public.lesson_videos alter column title set default 'Vídeo da aula';alter table public.lesson_videos alter column title set not null;
alter table public.lesson_videos alter column channel set default 'AMEX HOUSE';alter table public.lesson_videos alter column channel set not null;
alter table public.lesson_videos alter column is_embed_allowed set default true;alter table public.lesson_videos alter column is_embed_allowed set not null;

-- Avaliação pública sem gabarito.
create or replace function public.get_quiz_public(target_lesson_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('id',q.id,'title',q.title,'questions',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'prompt',x.prompt,'alternatives',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'text',a.text) order by a.position) from public.amex_alternatives a where a.question_id=x.id),'[]'::jsonb)) order by x.position) from public.amex_questions x where x.quiz_id=q.id and x.status='published'),'[]'::jsonb))
 from public.amex_quiz_settings q where q.lesson_id=target_lesson_id and q.status='published' limit 1
$$;
revoke all on function public.get_quiz_public(uuid) from public,anon;grant execute on function public.get_quiz_public(uuid) to authenticated;

-- Submissão atômica, rate limit, máximo de tentativas e correção no servidor.
create or replace function public.submit_quiz(target_quiz_id uuid,submitted_answers jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();settings public.amex_quiz_settings%rowtype;attempt_no integer;total integer;correct integer;score_value numeric(5,2);passed_value boolean;started timestamptz:=now();lesson uuid;
begin
 if actor is null then raise exception 'Sessão inválida' using errcode='42501';end if;
 if jsonb_typeof(submitted_answers)<>'object' or jsonb_object_length(submitted_answers)>100 then raise exception 'Respostas inválidas' using errcode='22023';end if;
 select * into settings from public.amex_quiz_settings where id=target_quiz_id and status='published' for update;
 if not found then raise exception 'Avaliação indisponível' using errcode='22023';end if;
 if exists(select 1 from public.quiz_attempts where user_id=actor and quiz_id=target_quiz_id and submitted_at>now()-interval '15 seconds') then raise exception 'Aguarde antes de enviar novamente' using errcode='P0001';end if;
 select coalesce(max(attempt_number),0)+1 into attempt_no from public.quiz_attempts where user_id=actor and quiz_id=target_quiz_id;
 if attempt_no>settings.max_attempts then return jsonb_build_object('ok',false,'message','Limite de tentativas atingido.','attempt_number',attempt_no-1);end if;
 select count(*) into total from public.amex_questions where quiz_id=target_quiz_id and status='published';
 if total=0 then raise exception 'Avaliação sem perguntas publicadas' using errcode='22023';end if;
 select count(*) into correct from public.amex_questions q join public.amex_alternatives a on a.question_id=q.id and a.is_correct where q.quiz_id=target_quiz_id and q.status='published' and submitted_answers->q.id::text @> jsonb_build_array(a.id::text);
 score_value:=round(correct::numeric*100/total,2);passed_value:=score_value>=settings.passing_score;lesson:=settings.lesson_id;
 insert into public.quiz_attempts(user_id,quiz_id,attempt_number,score,passed,answers,started_at,submitted_at,created_at) values(actor,target_quiz_id,attempt_no,score_value,passed_value,submitted_answers,started,now(),now());
 insert into public.lesson_progress(user_id,lesson_id,video_percent,quiz_passed,status,updated_at) values(actor,lesson,0,passed_value,'in_progress',now()) on conflict(user_id,lesson_id) do update set quiz_passed=public.lesson_progress.quiz_passed or excluded.quiz_passed,updated_at=now();
 return jsonb_build_object('ok',true,'score',score_value,'passed',passed_value,'correct',correct,'total',total,'attempt_number',attempt_no,'message',case when passed_value then 'Avaliação aprovada.' else 'Revise o conteúdo e tente novamente.' end);
end$$;
revoke all on function public.submit_quiz(uuid,jsonb) from public,anon;grant execute on function public.submit_quiz(uuid,jsonb) to authenticated;

-- Alternativas completas no painel.
create or replace function public.amex_admin_save_advanced(entity_name text,payload jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();rid uuid:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());begin
 if not public.amex_is_staff(array['admin','instructor']) then raise exception 'Acesso negado' using errcode='42501';end if;
 if entity_name='alternatives' then insert into public.amex_alternatives(id,question_id,text,is_correct,position) values(rid,(payload->>'question_id')::uuid,left(trim(payload->>'text'),1000),coalesce((payload->>'is_correct')::boolean,false),greatest(1,(payload->>'position')::int)) on conflict(id) do update set text=excluded.text,is_correct=excluded.is_correct,position=excluded.position;
 elsif entity_name='questions' then insert into public.amex_questions(id,quiz_id,prompt,explanation,position,status) values(rid,(payload->>'quiz_id')::uuid,trim(payload->>'prompt'),left(coalesce(payload->>'explanation',''),2000),greatest(1,(payload->>'position')::int),coalesce(payload->>'status','draft')) on conflict(id) do update set prompt=excluded.prompt,explanation=excluded.explanation,position=excluded.position,status=excluded.status,updated_at=now();
 elsif entity_name='videos' then if coalesce(payload->>'youtube_id','')!~'^[A-Za-z0-9_-]{11}$' then raise exception 'ID do YouTube inválido';end if;insert into public.lesson_videos(lesson_id,youtube_id,alternative_youtube_id,title,channel,is_embed_allowed,reviewed_at) values((payload->>'lesson_id')::uuid,payload->>'youtube_id',nullif(payload->>'alternative_youtube_id',''),left(payload->>'title',160),left(payload->>'channel',120),coalesce((payload->>'is_embed_allowed')::boolean,true),now()) on conflict(lesson_id) do update set youtube_id=excluded.youtube_id,alternative_youtube_id=excluded.alternative_youtube_id,title=excluded.title,channel=excluded.channel,is_embed_allowed=excluded.is_embed_allowed,reviewed_at=now() returning lesson_id into rid;
 elsif entity_name='resources' then if coalesce(payload->>'url','')!~'^https://' then raise exception 'URL deve usar HTTPS';end if;insert into public.lesson_resources(id,lesson_id,title,url,resource_type,position) values(rid,(payload->>'lesson_id')::uuid,left(trim(payload->>'title'),160),left(payload->>'url',2000),payload->>'resource_type',greatest(1,(payload->>'position')::int)) on conflict(id) do update set title=excluded.title,url=excluded.url,resource_type=excluded.resource_type,position=excluded.position;
 elsif entity_name='exercises' then insert into public.lesson_exercises(id,lesson_id,title,instructions,difficulty,acceptance_criteria,position) values(rid,(payload->>'lesson_id')::uuid,left(trim(payload->>'title'),160),left(payload->>'instructions',6000),payload->>'difficulty','[]'::jsonb,greatest(1,(payload->>'position')::int)) on conflict(id) do update set title=excluded.title,instructions=excluded.instructions,difficulty=excluded.difficulty,position=excluded.position;
 else raise exception 'Entidade inválida';end if;
 insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(actor,'advanced.save',entity_name,rid,jsonb_build_object('after',payload-'solution'-'is_correct'));return rid;
end$$;
revoke all on function public.amex_admin_save_advanced(text,jsonb) from public,anon;grant execute on function public.amex_admin_save_advanced(text,jsonb) to authenticated;

-- Geração automática de notificações por publicação e certificados.
create or replace function public.amex_notify_publication() returns trigger language plpgsql security definer set search_path=public as $$begin if new.status='published' and old.status is distinct from 'published' then insert into public.notifications(user_id,type,title,message,reference_id) select id,tg_table_name||'.published',case when tg_table_name='courses' then 'Novo curso publicado' else 'Novo conteúdo publicado' end,left(coalesce(new.title,'Conteúdo AMEX')||' já está disponível.',500),new.id from auth.users;end if;return new;end$$;
drop trigger if exists amex_courses_notify on public.courses;create trigger amex_courses_notify after update of status on public.courses for each row execute function public.amex_notify_publication();
drop trigger if exists amex_lessons_notify on public.lessons;create trigger amex_lessons_notify after update of status on public.lessons for each row execute function public.amex_notify_publication();

-- Pastas pessoais por RPC para uma interface segura e simples.
create or replace function public.amex_saved_folders() returns setof jsonb language sql stable security invoker set search_path=public as $$select jsonb_build_object('id',f.id,'name',f.name,'items',count(i.lesson_id)) from public.saved_folders f left join public.saved_folder_items i on i.folder_id=f.id where f.user_id=auth.uid() group by f.id order by f.name$$;
create or replace function public.amex_save_folder(folder_name text) returns uuid language plpgsql security invoker set search_path=public as $$declare rid uuid;begin if length(trim(folder_name)) not between 1 and 60 then raise exception 'Nome inválido';end if;insert into public.saved_folders(user_id,name) values(auth.uid(),trim(folder_name)) on conflict(user_id,name) do update set name=excluded.name returning id into rid;return rid;end$$;
revoke all on function public.amex_saved_folders() from public,anon;grant execute on function public.amex_saved_folders() to authenticated;
revoke all on function public.amex_save_folder(text) from public,anon;grant execute on function public.amex_save_folder(text) to authenticated;
create or replace function public.amex_admin_list(entity_name text,page_number integer default 1,search_text text default '') returns setof jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare role_value text:=public.amex_my_role();off integer:=greatest(0,(greatest(page_number,1)-1)*25);term text:='%'||lower(left(trim(coalesce(search_text,'')),120))||'%';begin
 if role_value not in('admin','instructor') then raise exception 'Acesso negado' using errcode='42501';end if;
 if entity_name='alternatives' then return query select to_jsonb(x) from(select id,left(text,120) title,question_id,position,case when is_correct then 'correct' else 'option' end status from public.amex_alternatives where lower(text) like term order by question_id,position limit 25 offset off)x;
 elsif entity_name='questions' then return query select to_jsonb(x) from(select id,left(prompt,120) title,quiz_id,position,status from public.amex_questions where lower(prompt) like term order by quiz_id,position limit 25 offset off)x;
 elsif entity_name='videos' then return query select to_jsonb(x) from(select lesson_id id,title,youtube_id slug,channel,'active' status from public.lesson_videos where lower(title) like term order by title limit 25 offset off)x;
 elsif entity_name='resources' then return query select to_jsonb(x) from(select id,title,url slug,resource_type status,lesson_id from public.lesson_resources where lower(title) like term order by lesson_id,position limit 25 offset off)x;
 elsif entity_name='exercises' then return query select to_jsonb(x) from(select id,title,difficulty status,lesson_id,position from public.lesson_exercises where lower(title) like term order by lesson_id,position limit 25 offset off)x;
 elsif entity_name='integrity' then return query select * from public.amex_admin_integrity();
 elsif entity_name='courses' then return query select to_jsonb(x) from(select id,title,slug,status,workload_hours from public.courses where lower(title) like term or lower(slug) like term order by title limit 25 offset off)x;
 elsif entity_name='modules' then return query select to_jsonb(x) from(select m.id,m.title,m.course_id,m.position,c.title course_title,'active' status from public.course_modules m join public.courses c on c.id=m.course_id where lower(m.title) like term order by c.title,m.position limit 25 offset off)x;
 elsif entity_name='lessons' then return query select to_jsonb(x) from(select id,title,module_id,position,status,workload_hours from public.lessons where lower(title) like term order by title limit 25 offset off)x;
 elsif entity_name='quizzes' then return query select to_jsonb(x) from(select * from public.amex_quiz_settings where lower(title) like term order by updated_at desc limit 25 offset off)x;
 elsif entity_name='certificates' then return query select to_jsonb(x) from(select id,public_code,student_name,academy,status,issued_at from public.certificates where lower(student_name) like term or lower(public_code) like term order by issued_at desc limit 25 offset off)x;
 elsif entity_name='audit' then return query select to_jsonb(x) from(select id,action,entity_type,entity_id,created_at from public.admin_audit_log where lower(action) like term order by created_at desc limit 25 offset off)x;
 elsif entity_name='users' then return query select jsonb_build_object('user_id',u.id,'display_name',coalesce(u.raw_user_meta_data->>'display_name','Estudante'),'email_masked',case when role_value='admin' then u.email else regexp_replace(u.email,'(^.).*(@.*$)','\1***\2') end,'role',coalesce(r.role,'student'),'created_at',u.created_at) from auth.users u left join public.user_roles r on r.user_id=u.id where lower(coalesce(u.email,'')) like term order by u.created_at desc limit 25 offset off;
 else raise exception 'Entidade inválida' using errcode='22023';end if;
end$$;



create or replace function public.amex_admin_reorder(entity_name text,target_id uuid,direction text) returns boolean language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();current_position integer;parent_id uuid;other_id uuid;other_position integer;begin
 if not public.amex_is_staff(array['admin','instructor']) or direction not in('up','down','first','last') then raise exception 'Operação inválida' using errcode='42501';end if;
 if entity_name='modules' then select position,course_id into current_position,parent_id from public.course_modules where id=target_id for update;select id,position into other_id,other_position from public.course_modules where course_id=parent_id and id<>target_id and (case when direction in('up','first') then position<current_position else position>current_position end) order by case when direction='up' then -position when direction='first' then position when direction='down' then position else -position end limit 1;
 elsif entity_name='lessons' then select position,module_id into current_position,parent_id from public.lessons where id=target_id for update;select id,position into other_id,other_position from public.lessons where module_id=parent_id and id<>target_id and (case when direction in('up','first') then position<current_position else position>current_position end) order by case when direction='up' then -position when direction='first' then position when direction='down' then position else -position end limit 1;
 elsif entity_name='questions' then select position,quiz_id into current_position,parent_id from public.amex_questions where id=target_id for update;select id,position into other_id,other_position from public.amex_questions where quiz_id=parent_id and id<>target_id and (case when direction in('up','first') then position<current_position else position>current_position end) order by case when direction='up' then -position when direction='first' then position when direction='down' then position else -position end limit 1;
 elsif entity_name='alternatives' then select position,question_id into current_position,parent_id from public.amex_alternatives where id=target_id for update;select id,position into other_id,other_position from public.amex_alternatives where question_id=parent_id and id<>target_id and (case when direction in('up','first') then position<current_position else position>current_position end) order by case when direction='up' then -position when direction='first' then position when direction='down' then position else -position end limit 1;
 else raise exception 'Entidade inválida';end if;
 if other_id is null then return false;end if;
 if entity_name='modules' then update public.course_modules set position=case when id=target_id then other_position else current_position end where id in(target_id,other_id);
 elsif entity_name='lessons' then update public.lessons set position=case when id=target_id then other_position else current_position end where id in(target_id,other_id);
 elsif entity_name='questions' then update public.amex_questions set position=case when id=target_id then other_position else current_position end where id in(target_id,other_id);
 else update public.amex_alternatives set position=case when id=target_id then other_position else current_position end where id in(target_id,other_id);end if;
 insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(actor,'entity.reorder',entity_name,target_id,jsonb_build_object('direction',direction));return true;
end$$;
revoke all on function public.amex_admin_reorder(text,uuid,text) from public,anon;grant execute on function public.amex_admin_reorder(text,uuid,text) to authenticated;
commit;
