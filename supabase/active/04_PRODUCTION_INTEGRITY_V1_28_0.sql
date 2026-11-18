-- AMEX HOUSE V1.28.0
-- Reparo consolidado e idempotente: cadastro, metas, quizzes e progresso.
-- Execute integralmente no SQL Editor do Supabase.
begin;

-- 1) Integridade exigida pelos UPSERTs usados pelo produto.
create unique index if not exists study_goals_user_academy_uidx
  on public.study_goals (user_id, academy);
create unique index if not exists lesson_progress_user_lesson_uidx
  on public.lesson_progress (user_id, lesson_id);
create unique index if not exists quiz_attempts_user_quiz_number_uidx
  on public.quiz_attempts (user_id, quiz_id, attempt_number);

-- 2) A tentativa pertence ao catálogo atual, não à tabela legada public.quizzes.
alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_quiz_id_fkey;
alter table public.quiz_attempts
  add constraint quiz_attempts_quiz_id_fkey
  foreign key (quiz_id)
  references public.amex_quiz_settings (id)
  on update cascade
  on delete restrict;

-- 3) Cadastro cria apenas perfil. Metas exigem academia e são criadas depois.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $handle_new_user$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Estudante'
  );

  insert into public.profiles (id, display_name)
  values (new.id, left(v_name, 80))
  on conflict (id) do update
  set display_name = case
    when public.profiles.display_name is null
      or trim(public.profiles.display_name) = ''
    then excluded.display_name
    else public.profiles.display_name
  end;
  return new;
end;
$handle_new_user$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4) Metas: usuário autenticado, academia válida e valores oferecidos pela interface.
create or replace function public.amex_save_study_goal(
  target_academy text,
  target_minutes integer
)
returns public.study_goals
language plpgsql
security invoker
set search_path = ''
as $amex_save_study_goal$
declare
  v_academy text := lower(trim(target_academy));
  v_saved public.study_goals;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Autenticação obrigatória.';
  end if;
  if v_academy not in ('pentest','python','javascript','data','devops') then
    raise exception using errcode = '22023', message = 'Formação inválida.';
  end if;
  if target_minutes not in (120,300,600) then
    raise exception using errcode = '22023', message = 'Meta semanal inválida.';
  end if;

  insert into public.study_goals (user_id, academy, weekly_minutes, updated_at)
  values (auth.uid(), v_academy, target_minutes, now())
  on conflict (user_id, academy) do update
  set weekly_minutes = excluded.weekly_minutes,
      updated_at = now()
  returning * into v_saved;
  return v_saved;
end;
$amex_save_study_goal$;

-- 5) Correção segura do quiz. O gabarito permanece no banco.
create or replace function public.amex_submit_quiz(
  attempt_token uuid,
  submitted_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $amex_submit_quiz$
declare
  v_user_id uuid := auth.uid();
  v_session public.quiz_attempt_sessions%rowtype;
  v_settings public.amex_quiz_settings%rowtype;
  v_attempt integer;
  v_total integer;
  v_answer_count integer;
  v_correct integer;
  v_score numeric(5,2);
  v_passed boolean;
  v_duration integer;
begin
  if v_user_id is null then
    raise exception using errcode='42501', message='Sessão inválida ou expirada.';
  end if;
  if attempt_token is null or submitted_answers is null
     or jsonb_typeof(submitted_answers) <> 'object' then
    raise exception using errcode='22023', message='Respostas inválidas.';
  end if;

  select count(*)::integer into v_answer_count
  from jsonb_object_keys(submitted_answers);
  if v_answer_count < 1 or v_answer_count > 100 then
    raise exception using errcode='22023', message='Quantidade de respostas inválida.';
  end if;

  select s.* into v_session
  from public.quiz_attempt_sessions s
  where s.token = attempt_token and s.user_id = v_user_id
  for update;
  if not found or v_session.submitted_at is not null
     or v_session.expires_at is null or v_session.expires_at <= now() then
    raise exception using errcode='22023', message='Tentativa inválida ou expirada.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || v_session.quiz_id::text, 0)
  );

  select s.* into v_settings
  from public.amex_quiz_settings s
  where s.id = v_session.quiz_id and s.status = 'published'
  for update;
  if not found or v_settings.lesson_id is null then
    raise exception using errcode='22023', message='Avaliação indisponível.';
  end if;

  select coalesce(max(a.attempt_number),0)+1 into v_attempt
  from public.quiz_attempts a
  where a.user_id=v_user_id and a.quiz_id=v_session.quiz_id;
  if v_attempt > v_settings.max_attempts then
    return jsonb_build_object('ok',false,'message','Limite de tentativas atingido.','attempt_number',v_attempt-1);
  end if;

  select count(*)::integer into v_total
  from public.amex_questions q
  where q.quiz_id=v_session.quiz_id and q.status='published';
  if v_total < 1 or v_answer_count > v_total then
    raise exception using errcode='22023', message='Avaliação sem perguntas válidas.';
  end if;

  select count(*)::integer into v_correct
  from public.amex_questions q
  join public.amex_alternatives a
    on a.question_id=q.id and a.is_correct=true
  where q.quiz_id=v_session.quiz_id and q.status='published'
    and coalesce(submitted_answers -> q.id::text, '[]'::jsonb)
        @> jsonb_build_array(a.id::text);

  v_score := round(v_correct::numeric * 100 / nullif(v_total,0), 2);
  v_passed := v_score >= v_settings.passing_score;
  v_duration := greatest(0, extract(epoch from (now()-v_session.started_at))::integer);

  insert into public.quiz_attempts(
    user_id,quiz_id,attempt_number,score,passed,answers,started_at,submitted_at,created_at
  ) values (
    v_user_id,v_session.quiz_id,v_attempt,v_score,v_passed,submitted_answers,
    v_session.started_at,now(),now()
  );

  update public.quiz_attempt_sessions
  set submitted_at=now()
  where token=attempt_token and user_id=v_user_id and submitted_at is null;
  if not found then
    raise exception using errcode='40001', message='Tentativa alterada durante a correção.';
  end if;

  insert into public.lesson_progress(
    user_id,lesson_id,video_percent,quiz_passed,status,updated_at
  ) values (
    v_user_id,v_settings.lesson_id,0,v_passed,'in_progress',now()
  )
  on conflict(user_id,lesson_id) do update
  set quiz_passed=coalesce(public.lesson_progress.quiz_passed,false) or excluded.quiz_passed,
      video_percent=greatest(coalesce(public.lesson_progress.video_percent,0),excluded.video_percent),
      status=case when public.lesson_progress.status='completed' then 'completed'
                  else coalesce(public.lesson_progress.status,'in_progress') end,
      updated_at=now();

  return jsonb_build_object(
    'ok',true,'score',v_score,'passed',v_passed,'correct',v_correct,'total',v_total,
    'attempt_number',v_attempt,'duration_seconds',v_duration,
    'message',case when v_passed then 'Avaliação aprovada.' else 'Revise o conteúdo e tente novamente.' end
  );
end;
$amex_submit_quiz$;

-- 6) Políticas canônicas de study_goals, removendo duplicações históricas.
alter table public.study_goals enable row level security;
drop policy if exists amex_owner_select on public.study_goals;
drop policy if exists amex_owner_insert on public.study_goals;
drop policy if exists amex_owner_update on public.study_goals;
drop policy if exists amex_owner_delete on public.study_goals;
drop policy if exists study_goals_select_own on public.study_goals;
drop policy if exists study_goals_insert_own on public.study_goals;
drop policy if exists study_goals_update_own on public.study_goals;
drop policy if exists study_goals_delete_own on public.study_goals;
create policy study_goals_select_own on public.study_goals for select to authenticated
  using ((select auth.uid())=user_id);
create policy study_goals_insert_own on public.study_goals for insert to authenticated
  with check ((select auth.uid())=user_id);
create policy study_goals_update_own on public.study_goals for update to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy study_goals_delete_own on public.study_goals for delete to authenticated
  using ((select auth.uid())=user_id);

-- 7) Privilégios mínimos das funções expostas.
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
revoke all on function public.amex_save_study_goal(text,integer) from public, anon;
grant execute on function public.amex_save_study_goal(text,integer) to authenticated, service_role;
revoke all on function public.amex_submit_quiz(uuid,jsonb) from public, anon;
grant execute on function public.amex_submit_quiz(uuid,jsonb) to authenticated, service_role;

analyze public.profiles;
analyze public.study_goals;
analyze public.lesson_progress;
analyze public.quiz_attempt_sessions;
analyze public.quiz_attempts;
commit;
