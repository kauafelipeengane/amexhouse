-- AMEX HOUSE V1.4.1 - hardening defensivo, grants explícitos e observabilidade
-- Execute após V1.4.0. Idempotente e transacional.
begin;

-- Bloqueia privilégios automáticos para novos objetos do schema public.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- Mídias e materiais: deny by default e leitura apenas de aula publicada ou staff.
alter table public.lesson_videos enable row level security;
alter table public.lesson_videos force row level security;
alter table public.lesson_resources enable row level security;
alter table public.lesson_resources force row level security;
alter table public.lesson_exercises enable row level security;
alter table public.lesson_exercises force row level security;

revoke all on public.lesson_videos from anon, authenticated;
revoke all on public.lesson_resources from anon, authenticated;
revoke all on public.lesson_exercises from anon, authenticated;
grant select on public.lesson_videos,public.lesson_resources,public.lesson_exercises to authenticated;

drop policy if exists lesson_videos_published_read on public.lesson_videos;
create policy lesson_videos_published_read on public.lesson_videos for select to authenticated
using(exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published') or public.amex_is_staff(array['admin','instructor']));
drop policy if exists lesson_resources_published_read on public.lesson_resources;
create policy lesson_resources_published_read on public.lesson_resources for select to authenticated
using(exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published') or public.amex_is_staff(array['admin','instructor']));
drop policy if exists lesson_exercises_published_read on public.lesson_exercises;
create policy lesson_exercises_published_read on public.lesson_exercises for select to authenticated
using(exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published') or public.amex_is_staff(array['admin','instructor']));

-- Funções internas de trigger não devem ser chamadas pelo Data API.
revoke all on function public.amex_notify_publication() from public,anon,authenticated;

-- Leitura de quiz exige sessão explícita e retorna o mínimo necessário.
create or replace function public.get_quiz_public(target_lesson_id uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare value jsonb;begin
 if auth.uid() is null then raise exception 'Sessão inválida' using errcode='42501';end if;
 select jsonb_build_object('id',q.id,'title',q.title,'questions',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'prompt',x.prompt,'alternatives',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'text',a.text) order by a.position) from public.amex_alternatives a where a.question_id=x.id),'[]'::jsonb)) order by x.position) from public.amex_questions x where x.quiz_id=q.id and x.status='published'),'[]'::jsonb)) into value
 from public.amex_quiz_settings q where q.lesson_id=target_lesson_id and q.status='published' limit 1;
 return value;
end$$;
revoke all on function public.get_quiz_public(uuid) from public,anon;grant execute on function public.get_quiz_public(uuid) to authenticated;

-- Eventos de segurança sem conteúdo acadêmico sensível.
create table if not exists public.security_events(
 id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id) on delete set null,
 event_type text not null check(length(event_type) between 3 and 80),severity text not null check(severity in('info','warning','high','critical')),
 public_code text not null unique default ('SEC-'||upper(substr(encode(gen_random_bytes(10),'hex'),1,16))),
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
alter table public.security_events enable row level security;alter table public.security_events force row level security;
revoke all on public.security_events from anon,authenticated;
grant select on public.security_events to authenticated;
drop policy if exists security_events_admin_read on public.security_events;
create policy security_events_admin_read on public.security_events for select to authenticated using(public.amex_is_staff(array['admin']));

-- Painel de postura de segurança calculado no banco.
create or replace function public.amex_security_posture() returns jsonb language plpgsql stable security definer set search_path=public as $$
declare exposed integer;rls_missing integer;recent_high integer;begin
 if not public.amex_is_staff(array['admin']) then raise exception 'Acesso negado' using errcode='42501';end if;
 select count(*) into exposed from information_schema.role_table_grants where table_schema='public' and grantee='anon' and privilege_type not in('SELECT');
 select count(*) into rls_missing from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;
 select count(*) into recent_high from public.security_events where severity in('high','critical') and created_at>now()-interval '7 days';
 return jsonb_build_object('unsafe_anon_grants',exposed,'tables_without_rls',rls_missing,'high_events_7d',recent_high,'checked_at',now());
end$$;
revoke all on function public.amex_security_posture() from public,anon;grant execute on function public.amex_security_posture() to authenticated;

-- Limpeza automática de sessões de quiz antigas, acionável apenas por admin.
create or replace function public.amex_admin_cleanup_security_data() returns jsonb language plpgsql security definer set search_path=public as $$
declare sessions_deleted integer;events_deleted integer;begin
 if not public.amex_is_staff(array['admin']) then raise exception 'Acesso negado' using errcode='42501';end if;
 delete from public.quiz_attempt_sessions where expires_at<now()-interval '7 days';get diagnostics sessions_deleted=row_count;
 delete from public.security_events where created_at<now()-interval '180 days' and severity in('info','warning');get diagnostics events_deleted=row_count;
 insert into public.admin_audit_log(actor_id,action,entity_type,details) values(auth.uid(),'security.cleanup','security',jsonb_build_object('sessions',sessions_deleted,'events',events_deleted));
 return jsonb_build_object('sessions_deleted',sessions_deleted,'events_deleted',events_deleted);
end$$;
revoke all on function public.amex_admin_cleanup_security_data() from public,anon;grant execute on function public.amex_admin_cleanup_security_data() to authenticated;

commit;
