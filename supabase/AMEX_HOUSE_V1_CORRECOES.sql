-- AMEX HOUSE V1 - correcoes de integridade e RLS
-- Execute no SQL Editor do Supabase depois de revisar em ambiente de teste.
begin;

-- Metas independentes por formacao.
alter table if exists public.study_goals
  add column if not exists academy text;
update public.study_goals set academy='pentest' where academy is null;
alter table if exists public.study_goals
  alter column academy set not null;
alter table if exists public.study_goals
  drop constraint if exists study_goals_academy_check;
alter table if exists public.study_goals
  add constraint study_goals_academy_check check (academy in ('pentest','python'));
alter table if exists public.study_goals
  drop constraint if exists study_goals_user_id_key;
create unique index if not exists study_goals_user_academy_uidx
  on public.study_goals(user_id,academy);

-- Unicidade e idempotencia para listas pessoais.
create unique index if not exists favorites_user_lesson_uidx
  on public.favorites(user_id,lesson_id);
create unique index if not exists watch_later_user_lesson_uidx
  on public.watch_later(user_id,lesson_id);

-- RLS das entidades pessoais. O cliente nunca define a autorizacao.
alter table public.lesson_progress enable row level security;
alter table public.notes enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_later enable row level security;
alter table public.activities enable row level security;
alter table public.study_goals enable row level security;

do $$
declare t text;
begin
  foreach t in array array['lesson_progress','notes','favorites','watch_later','activities','study_goals'] loop
    execute format('drop policy if exists "amex owner select" on public.%I',t);
    execute format('drop policy if exists "amex owner insert" on public.%I',t);
    execute format('drop policy if exists "amex owner update" on public.%I',t);
    execute format('drop policy if exists "amex owner delete" on public.%I',t);
    execute format('create policy "amex owner select" on public.%I for select to authenticated using (user_id=auth.uid())',t);
    execute format('create policy "amex owner insert" on public.%I for insert to authenticated with check (user_id=auth.uid())',t);
    execute format('create policy "amex owner update" on public.%I for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid())',t);
    execute format('create policy "amex owner delete" on public.%I for delete to authenticated using (user_id=auth.uid())',t);
  end loop;
end $$;

-- O certificado consulta somente quizzes publicados/obrigatorios.
-- A funcao e defensiva: se a tabela de quizzes nao existir, retorna lista vazia.
create or replace function public.get_quiz_requirements()
returns table(lesson_id uuid, quiz_required boolean)
language plpgsql
security invoker
set search_path=public
as $$
begin
  if to_regclass('public.quizzes') is null then return; end if;
  return query execute
    'select distinct q.lesson_id, true from public.quizzes q where coalesce(q.status,''published'')=''published''';
exception when undefined_column then
  return query execute 'select distinct q.lesson_id, true from public.quizzes q';
end;
$$;
grant execute on function public.get_quiz_requirements() to authenticated;

-- Nao permita que o progresso de video altere aprovacao de quiz.
-- A funcao update_lesson_progress deve aceitar apenas os dois argumentos abaixo.
do $$
begin
  if to_regprocedure('public.update_lesson_progress(uuid,integer,boolean)') is not null then
    revoke execute on function public.update_lesson_progress(uuid,integer,boolean) from anon,authenticated;
  end if;
end $$;

commit;
