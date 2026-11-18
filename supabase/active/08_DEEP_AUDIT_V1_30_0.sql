-- AMEX HOUSE V1.30.0 - terceira varredura somente leitura.
with findings as (
  -- Privilégios de alto risco não necessários ao Data API.
  select 'CRITICAL'::text severity,'dangerous_table_grant'::text check_name,
         table_name||':'||grantee||':'||privilege_type object_name
  from information_schema.role_table_grants
  where table_schema='public'
    and grantee in ('anon','authenticated')
    and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER')

  union all
  -- Acesso anônimo aos dados pessoais/operacionais.
  select 'CRITICAL','anon_private_table_grant',table_name||':'||privilege_type
  from information_schema.role_table_grants
  where table_schema='public' and grantee='anon'
    and table_name in (
      'profiles','lesson_progress','notes','favorites','watch_later','study_goals','activities',
      'quiz_attempt_sessions','quiz_attempts','notifications','certificates','user_roles','admin_audit_log'
    ) and privilege_type in ('SELECT','INSERT','UPDATE','DELETE')

  union all
  -- Policies duplicadas por tabela/operação/papel.
  select 'HIGH','duplicate_permissive_policies',tablename||':'||cmd||':'||array_to_string(roles,',')
  from pg_policies
  where schemaname='public' and permissive='PERMISSIVE'
  group by tablename,cmd,roles
  having count(*)>1

  union all
  -- Tabelas RLS sem policy para authenticated (pode indicar funcionalidade quebrada).
  select 'HIGH','rls_without_authenticated_policy',c.relname
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and c.relrowsecurity
    and c.relname in (
      'profiles','lesson_progress','notes','favorites','watch_later','study_goals','activities',
      'quiz_attempt_sessions','quiz_attempts','notifications','certificates','user_roles'
    )
    and not exists (
      select 1 from pg_policies p
      where p.schemaname='public' and p.tablename=c.relname
        and 'authenticated'=any(p.roles)
    )

  union all
  -- Foreign keys sem índice iniciando pelas colunas da FK.
  select 'MEDIUM','unindexed_foreign_key',n.nspname||'.'||t.relname||':'||con.conname
  from pg_constraint con
  join pg_class t on t.oid=con.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  where con.contype='f' and n.nspname='public'
    and not exists (
      select 1 from pg_index i
      where i.indrelid=con.conrelid
        and i.indisvalid
        and (i.indkey::smallint[])[0:cardinality(con.conkey)-1]=con.conkey
    )

  union all
  -- Funções públicas com search_path mutável.
  select case when p.prosecdef then 'HIGH' else 'MEDIUM' end,
         'mutable_function_search_path',n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and not coalesce(array_to_string(p.proconfig,','),'') ilike '%search_path=%'
    and p.prokind='f'

  union all
  -- Perfis sem usuário e usuários sem perfil.
  select 'HIGH','orphan_profile',p.id::text
  from public.profiles p left join auth.users u on u.id=p.id where u.id is null

  union all
  select 'HIGH','user_without_profile',u.id::text
  from auth.users u left join public.profiles p on p.id=u.id where p.id is null

  union all
  -- Conteúdo órfão.
  select 'HIGH','orphan_lesson_video',v.lesson_id::text
  from public.lesson_videos v left join public.lessons l on l.id=v.lesson_id where l.id is null
  union all
  select 'HIGH','orphan_lesson_resource',r.id::text
  from public.lesson_resources r left join public.lessons l on l.id=r.lesson_id where l.id is null
  union all
  select 'HIGH','orphan_lesson_exercise',e.id::text
  from public.lesson_exercises e left join public.lessons l on l.id=e.lesson_id where l.id is null
)
select severity,check_name,object_name
from findings
order by case severity when 'CRITICAL' then 1 when 'HIGH' then 2 else 3 end,check_name,object_name;
