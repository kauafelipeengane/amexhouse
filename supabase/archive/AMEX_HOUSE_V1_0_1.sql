-- AMEX HOUSE V1.0.1
-- Migração consolidada de integridade, progresso, metas e RLS.
-- Execute uma única vez no SQL Editor do Supabase após fazer backup.

begin;

-- 1. Pré-validação explícita. A migração para se a estrutura obrigatória não existir.
do $$
declare
  required_table text;
  required_column record;
begin
  foreach required_table in array array[
    'courses','course_modules','lessons','lesson_progress','notes',
    'favorites','watch_later','activities','study_goals'
  ] loop
    if to_regclass('public.' || required_table) is null then
      raise exception 'AMEX V1.0.1: tabela obrigatória ausente: public.%', required_table;
    end if;
  end loop;

  for required_column in
    select * from (values
      ('lesson_progress','user_id'),('lesson_progress','lesson_id'),
      ('lesson_progress','video_percent'),('lesson_progress','quiz_passed'),
      ('lesson_progress','status'),('lesson_progress','updated_at'),
      ('lesson_progress','last_position_seconds'),('lesson_progress','video_duration_seconds'),
      ('notes','user_id'),('favorites','user_id'),('favorites','lesson_id'),
      ('watch_later','user_id'),('watch_later','lesson_id'),
      ('activities','user_id'),('study_goals','user_id'),('study_goals','weekly_minutes')
    ) as expected(table_name,column_name)
  loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema='public'
        and table_name=required_column.table_name
        and column_name=required_column.column_name
    ) then
      raise exception 'AMEX V1.0.1: coluna obrigatória ausente: public.%.%',
        required_column.table_name, required_column.column_name;
    end if;
  end loop;
end $$;

-- 2. Metas por formação. A meta antiga é preservada no Pentest e copiada para Python.
alter table public.study_goals add column if not exists academy text;
update public.study_goals set academy='pentest' where academy is null;

-- O schema antigo usa user_id como chave primária. Ela precisa ser removida
-- antes de copiar a meta para a segunda formação.
do $$
declare primary_key_name text;
begin
  select con.conname into primary_key_name
  from pg_constraint con
  join pg_class rel on rel.oid=con.conrelid
  join pg_namespace nsp on nsp.oid=rel.relnamespace
  where nsp.nspname='public'
    and rel.relname='study_goals'
    and con.contype='p';
  if primary_key_name is not null then
    execute format('alter table public.study_goals drop constraint %I',primary_key_name);
  end if;
end $$;

alter table public.study_goals drop constraint if exists study_goals_user_id_key;
drop index if exists public.study_goals_user_id_key;
drop index if exists public.study_goals_user_academy_uidx;

delete from public.study_goals a
using public.study_goals b
where a.ctid < b.ctid
  and a.user_id=b.user_id
  and a.academy=b.academy;

insert into public.study_goals(user_id,academy,weekly_minutes,updated_at)
select user_id,'python',weekly_minutes,coalesce(updated_at,now())
from public.study_goals source
where source.academy='pentest'
  and not exists (
    select 1 from public.study_goals target
    where target.user_id=source.user_id and target.academy='python'
  );

alter table public.study_goals alter column academy set not null;
alter table public.study_goals drop constraint if exists study_goals_academy_check;
alter table public.study_goals
  add constraint study_goals_academy_check check (academy in ('pentest','python'));
alter table public.study_goals
  add constraint study_goals_pkey primary key(user_id,academy);

-- 3. Remove duplicidades e garante operações idempotentes.
delete from public.favorites a using public.favorites b
where a.ctid < b.ctid and a.user_id=b.user_id and a.lesson_id=b.lesson_id;
delete from public.watch_later a using public.watch_later b
where a.ctid < b.ctid and a.user_id=b.user_id and a.lesson_id=b.lesson_id;
delete from public.lesson_progress a using public.lesson_progress b
where a.ctid < b.ctid and a.user_id=b.user_id and a.lesson_id=b.lesson_id;

create unique index if not exists favorites_user_lesson_uidx
  on public.favorites(user_id,lesson_id);
create unique index if not exists watch_later_user_lesson_uidx
  on public.watch_later(user_id,lesson_id);
create unique index if not exists lesson_progress_user_lesson_uidx
  on public.lesson_progress(user_id,lesson_id);

-- 4. RLS fechada. Todas as políticas anteriores dessas tabelas são removidas.
do $$
declare
  target_table text;
  old_policy record;
begin
  foreach target_table in array array[
    'lesson_progress','notes','favorites','watch_later','activities','study_goals'
  ] loop
    execute format('alter table public.%I enable row level security',target_table);
    execute format('alter table public.%I force row level security',target_table);

    for old_policy in
      select policyname from pg_policies
      where schemaname='public' and tablename=target_table
    loop
      execute format('drop policy if exists %I on public.%I',old_policy.policyname,target_table);
    end loop;

    execute format('create policy %I on public.%I for select to authenticated using (user_id=auth.uid())',
      'amex_owner_select',target_table);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id=auth.uid())',
      'amex_owner_insert',target_table);
    execute format('create policy %I on public.%I for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid())',
      'amex_owner_update',target_table);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id=auth.uid())',
      'amex_owner_delete',target_table);
  end loop;
end $$;

-- 5. Requisitos de avaliação publicados. Ausência de tabela de quizzes retorna lista vazia.
create or replace function public.get_quiz_requirements()
returns table(lesson_id uuid, quiz_required boolean)
language plpgsql
security invoker
set search_path=public
as $$
begin
  if to_regclass('public.quizzes') is null then return; end if;
  begin
    return query execute
      'select distinct q.lesson_id, true from public.quizzes q where q.status=''published''';
  exception when undefined_column then
    return query execute 'select distinct q.lesson_id, true from public.quizzes q';
  end;
end;
$$;
revoke all on function public.get_quiz_requirements() from public,anon;
grant execute on function public.get_quiz_requirements() to authenticated;

-- 6. Progresso seguro. A aprovação do quiz nunca é recebida do cliente.
create or replace function public.amex_save_video_progress(
  target_lesson_id uuid,
  current_seconds integer,
  duration_seconds integer,
  reported_percent integer
)
returns table(video_percent integer,status text,last_position_seconds integer,video_duration_seconds integer)
language plpgsql
security definer
set search_path=public
as $$
declare
  actor uuid := auth.uid();
  existing public.lesson_progress%rowtype;
  safe_duration integer;
  safe_current integer;
  calculated integer;
  accepted integer;
begin
  if actor is null then raise exception 'Sessão inválida.' using errcode='42501'; end if;
  if target_lesson_id is null then raise exception 'Aula inválida.' using errcode='22023'; end if;
  if not exists (
    select 1 from public.lessons l
    where l.id=target_lesson_id and l.status='published'
  ) then raise exception 'Aula indisponível.' using errcode='22023'; end if;

  safe_duration := greatest(0,least(coalesce(duration_seconds,0),86400));
  safe_current := greatest(0,least(coalesce(current_seconds,0),safe_duration));
  calculated := case when safe_duration>0
    then floor(safe_current::numeric*100/safe_duration)::integer else 0 end;
  calculated := greatest(0,least(calculated,least(coalesce(reported_percent,0),100)));

  select * into existing from public.lesson_progress
  where user_id=actor and lesson_id=target_lesson_id for update;

  -- Cada chamada pode avançar no máximo 20 pontos. O player envia a cada 12 segundos.
  accepted := least(calculated,coalesce(existing.video_percent,0)+20);
  accepted := greatest(coalesce(existing.video_percent,0),accepted);

  insert into public.lesson_progress(
    user_id,lesson_id,video_percent,quiz_passed,status,updated_at,
    last_position_seconds,video_duration_seconds
  ) values (
    actor,target_lesson_id,accepted,false,
    case when accepted>=90 then 'completed' else 'in_progress' end,
    now(),safe_current,safe_duration
  )
  on conflict(user_id,lesson_id) do update set
    video_percent=greatest(coalesce(public.lesson_progress.video_percent,0),excluded.video_percent),
    status=case
      when greatest(coalesce(public.lesson_progress.video_percent,0),excluded.video_percent)>=90 then 'completed'
      when greatest(coalesce(public.lesson_progress.video_percent,0),excluded.video_percent)>0 then 'in_progress'
      else public.lesson_progress.status end,
    updated_at=now(),
    last_position_seconds=greatest(coalesce(public.lesson_progress.last_position_seconds,0),excluded.last_position_seconds),
    video_duration_seconds=greatest(coalesce(public.lesson_progress.video_duration_seconds,0),excluded.video_duration_seconds)
  returning lesson_progress.video_percent,lesson_progress.status,
    lesson_progress.last_position_seconds,lesson_progress.video_duration_seconds
  into video_percent,status,last_position_seconds,video_duration_seconds;
  return next;
end;
$$;
revoke all on function public.amex_save_video_progress(uuid,integer,integer,integer) from public,anon;
grant execute on function public.amex_save_video_progress(uuid,integer,integer,integer) to authenticated;

-- Bloqueia a RPC legada que aceitava aprovação de quiz pelo cliente, quando existir.
do $$
begin
  if to_regprocedure('public.update_lesson_progress(uuid,integer,boolean)') is not null then
    execute 'revoke all on function public.update_lesson_progress(uuid,integer,boolean) from public,anon,authenticated';
  end if;
end $$;

commit;

-- Validação final. Deve retornar seis linhas com RLS e quatro políticas por tabela.
select c.relname as tabela,c.relrowsecurity as rls,c.relforcerowsecurity as rls_forcada,
       count(p.policyname) as politicas
from pg_class c
join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
left join pg_policies p on p.schemaname='public' and p.tablename=c.relname
where c.relname in ('lesson_progress','notes','favorites','watch_later','activities','study_goals')
group by c.relname,c.relrowsecurity,c.relforcerowsecurity
order by c.relname;
