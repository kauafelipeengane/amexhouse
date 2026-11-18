-- AMEX HOUSE V1.29.0 - varredura estrutural somente leitura.
-- O resultado esperado é zero em todas as linhas com severity CRITICAL ou HIGH.
with findings as (
  -- Tabelas essenciais ausentes.
  select 'CRITICAL'::text severity, 'missing_table'::text check_name, required.name object_name
  from (values
    ('profiles'),('courses'),('course_modules'),('lessons'),('lesson_progress'),
    ('notes'),('favorites'),('watch_later'),('study_goals'),('activities'),
    ('amex_quiz_settings'),('amex_questions'),('amex_alternatives'),
    ('quiz_attempt_sessions'),('quiz_attempts')
  ) required(name)
  where to_regclass('public.'||required.name) is null

  union all
  -- RLS ausente em tabelas de usuário expostas.
  select 'CRITICAL','rls_disabled',c.relname
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in (
    'profiles','lesson_progress','notes','favorites','watch_later','study_goals',
    'activities','quiz_attempt_sessions','quiz_attempts','notifications','certificates','user_roles'
  ) and c.relkind='r' and not c.relrowsecurity

  union all
  -- Funções críticas ausentes.
  select 'CRITICAL','missing_function',required.signature
  from (values
    ('handle_new_user()'),('amex_save_study_goal(text,integer)'),
    ('get_quiz_public(uuid)'),('amex_start_quiz(uuid)'),('amex_submit_quiz(uuid,jsonb)'),
    ('amex_save_video_progress(uuid,integer,integer,integer)')
  ) required(signature)
  where to_regprocedure('public.'||required.signature) is null

  union all
  -- SECURITY DEFINER com search_path mutável.
  select 'HIGH','mutable_search_path',n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and not coalesce(array_to_string(p.proconfig,','),'') ilike '%search_path=%'

  union all
  -- Funções sensíveis executáveis anonimamente.
  select 'CRITICAL','anon_execute',routine_name
  from information_schema.routine_privileges
  where routine_schema='public' and grantee in ('PUBLIC','anon')
    and routine_name in (
      'handle_new_user','amex_save_study_goal','amex_submit_quiz','submit_quiz',
      'amex_admin_set_role','amex_admin_archive','amex_admin_issue_certificate',
      'amex_admin_revoke_certificate','amex_admin_reorder'
    )

  union all
  -- Políticas permissivas duplicadas por tabela/operação/papel.
  select 'HIGH','duplicate_permissive_policies',tablename||':'||cmd||':'||array_to_string(roles,',')
  from pg_policies
  where schemaname='public' and permissive='PERMISSIVE'
  group by tablename,cmd,roles
  having count(*)>1

  union all
  -- Integridade dos dados principais.
  select 'CRITICAL','duplicate_study_goal',user_id::text||':'||academy
  from public.study_goals group by user_id,academy having count(*)>1

  union all
  select 'CRITICAL','duplicate_lesson_progress',user_id::text||':'||lesson_id::text
  from public.lesson_progress group by user_id,lesson_id having count(*)>1

  union all
  select 'CRITICAL','duplicate_quiz_attempt',user_id::text||':'||quiz_id::text||':'||attempt_number::text
  from public.quiz_attempts group by user_id,quiz_id,attempt_number having count(*)>1

  union all
  select 'CRITICAL','orphan_quiz_attempt',a.id::text
  from public.quiz_attempts a left join public.amex_quiz_settings s on s.id=a.quiz_id
  where s.id is null

  union all
  select 'HIGH','published_quiz_without_questions',s.id::text
  from public.amex_quiz_settings s
  where s.status='published' and not exists (
    select 1 from public.amex_questions q where q.quiz_id=s.id and q.status='published'
  )

  union all
  select 'CRITICAL','question_without_exactly_one_correct_answer',q.id::text
  from public.amex_questions q
  left join public.amex_alternatives a on a.question_id=q.id
  where q.status='published'
  group by q.id
  having count(*) filter(where a.is_correct=true)<>1

  union all
  -- Constraints/índices contratuais ausentes.
  select 'CRITICAL','missing_unique_index','study_goals(user_id,academy)'
  where not exists (
    select 1 from pg_index i
    where i.indrelid='public.study_goals'::regclass and i.indisunique
      and pg_get_indexdef(i.indexrelid) ilike '%(user_id, academy)%'
  )

  union all
  select 'CRITICAL','missing_unique_index','lesson_progress(user_id,lesson_id)'
  where not exists (
    select 1 from pg_index i
    where i.indrelid='public.lesson_progress'::regclass and i.indisunique
      and pg_get_indexdef(i.indexrelid) ilike '%(user_id, lesson_id)%'
  )
)
select severity,check_name,object_name
from findings
order by case severity when 'CRITICAL' then 1 when 'HIGH' then 2 else 3 end,check_name,object_name;
