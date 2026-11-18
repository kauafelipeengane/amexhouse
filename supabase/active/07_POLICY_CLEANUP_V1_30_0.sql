-- AMEX HOUSE V1.30.0
-- Consolida policies SELECT duplicadas de vídeos, recursos e exercícios.
-- A transação remove todas as policies SELECT dessas três tabelas e recria uma policy canônica por tabela.
begin;

alter table public.lesson_videos enable row level security;
alter table public.lesson_videos force row level security;
alter table public.lesson_resources enable row level security;
alter table public.lesson_resources force row level security;
alter table public.lesson_exercises enable row level security;
alter table public.lesson_exercises force row level security;

-- Elimina policies SELECT históricas independentemente do nome.
do $policy_cleanup$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in ('lesson_videos','lesson_resources','lesson_exercises')
      and cmd='SELECT'
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end;
$policy_cleanup$;

-- Privilégio de tabela mínimo: somente leitura autenticada.
revoke all on table public.lesson_videos from anon, authenticated;
revoke all on table public.lesson_resources from anon, authenticated;
revoke all on table public.lesson_exercises from anon, authenticated;
grant select on table public.lesson_videos to authenticated;
grant select on table public.lesson_resources to authenticated;
grant select on table public.lesson_exercises to authenticated;

-- O estudante lê apenas conteúdo de aulas publicadas; equipe também pode revisar rascunhos.
create policy lesson_videos_published_read
on public.lesson_videos for select to authenticated
using (
  exists (
    select 1 from public.lessons l
    where l.id=lesson_videos.lesson_id and l.status='published'
  )
  or public.amex_is_staff(array['admin','instructor'])
);

create policy lesson_resources_published_read
on public.lesson_resources for select to authenticated
using (
  exists (
    select 1 from public.lessons l
    where l.id=lesson_resources.lesson_id and l.status='published'
  )
  or public.amex_is_staff(array['admin','instructor'])
);

create policy lesson_exercises_published_read
on public.lesson_exercises for select to authenticated
using (
  exists (
    select 1 from public.lessons l
    where l.id=lesson_exercises.lesson_id and l.status='published'
  )
  or public.amex_is_staff(array['admin','instructor'])
);

commit;

select tablename,policyname,cmd,roles,qual
from pg_policies
where schemaname='public'
  and tablename in ('lesson_videos','lesson_resources','lesson_exercises')
order by tablename,policyname;
