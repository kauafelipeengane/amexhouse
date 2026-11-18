-- AMEX HOUSE V1.31.0
-- Endurecimento de grants e índices de foreign keys encontrados pela terceira varredura.
begin;

-- Privilégios de DDL/DML perigosos nunca são necessários ao navegador.
do $revoke_dangerous$
declare
  t record;
begin
  for t in select schemaname,tablename from pg_tables where schemaname='public'
  loop
    execute format(
      'revoke truncate, references, trigger on table %I.%I from anon, authenticated',
      t.schemaname,t.tablename
    );
  end loop;
end;
$revoke_dangerous$;

-- Tabelas privadas não devem ser alcançadas por sessão anônima.
revoke select,insert,update,delete on table public.admin_audit_log from anon;
revoke select,insert,update,delete on table public.certificates from anon;
revoke select,insert,update,delete on table public.notifications from anon;
revoke select,insert,update,delete on table public.profiles from anon;
revoke select,insert,update,delete on table public.quiz_attempt_sessions from anon;
revoke select,insert,update,delete on table public.quiz_attempts from anon;
revoke select,insert,update,delete on table public.user_roles from anon;

-- Índices correspondentes às FKs detectadas. IF NOT EXISTS torna o reparo reaplicável.
create index if not exists amex_quiz_attempts_quiz_id_idx on public.amex_quiz_attempts(quiz_id);
create index if not exists courses_created_by_idx on public.courses(created_by);
create index if not exists favorites_lesson_id_idx on public.favorites(lesson_id);
create index if not exists lesson_competencies_competency_id_idx on public.lesson_competencies(competency_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);
create index if not exists notes_lesson_id_idx on public.notes(lesson_id);
create index if not exists quiz_answers_question_id_idx on public.quiz_answers(question_id);
create index if not exists quiz_attempt_sessions_quiz_id_idx on public.quiz_attempt_sessions(quiz_id);
create index if not exists review_schedule_lesson_id_idx on public.review_schedule(lesson_id);
create index if not exists saved_folder_items_lesson_id_idx on public.saved_folder_items(lesson_id);
create index if not exists security_events_actor_id_idx on public.security_events(actor_id);
create index if not exists task_progress_task_id_idx on public.task_progress(task_id);
create index if not exists watch_later_lesson_id_idx on public.watch_later(lesson_id);

commit;
