-- AMEX HOUSE V1.1.0 - Administração, tentativas e certificados verificáveis
-- Pré-requisito: AMEX_HOUSE_V1_0_1.sql aplicado com sucesso.
begin;
do $$ begin if to_regclass('public.courses') is null then raise exception 'Tabela public.courses ausente'; end if; end $$;
create extension if not exists pgcrypto;

create table if not exists public.user_roles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in('student','instructor','admin')) default 'student',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.admin_audit_log(
 id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id),
 action text not null check(length(action) between 3 and 80),entity_type text not null,
 entity_id uuid,details jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists public.quiz_attempts(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 quiz_id uuid not null,attempt_number integer not null check(attempt_number between 1 and 1000),
 score numeric(5,2) not null check(score between 0 and 100),passed boolean not null,
 answers jsonb not null default '{}'::jsonb,started_at timestamptz not null,submitted_at timestamptz not null default now(),
 unique(user_id,quiz_id,attempt_number)
);
create table if not exists public.certificates(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 academy text not null check(academy in('pentest','python')),public_code text not null unique,
 student_name text not null check(length(student_name) between 2 and 120),workload_hours integer not null check(workload_hours between 1 and 10000),
 curriculum_version text not null default '1.1.0',status text not null check(status in('valid','revoked')) default 'valid',
 issued_at timestamptz not null default now(),revoked_at timestamptz,created_at timestamptz not null default now(),unique(user_id,academy,curriculum_version)
);
create index if not exists quiz_attempts_user_quiz_idx on public.quiz_attempts(user_id,quiz_id,submitted_at desc);
create index if not exists audit_actor_created_idx on public.admin_audit_log(actor_id,created_at desc);
insert into public.user_roles(user_id,role) values('fe8ec230-0b00-4669-8fa0-ae163369f4d6','admin') on conflict(user_id) do update set role='admin',updated_at=now();

create index if not exists certificates_user_idx on public.certificates(user_id,issued_at desc);

create or replace function public.amex_my_role() returns text language sql stable security definer set search_path=public as $$
 select coalesce((select role from public.user_roles where user_id=auth.uid()),'student')
$$;
revoke all on function public.amex_my_role() from public,anon;grant execute on function public.amex_my_role() to authenticated;

create or replace function public.amex_is_staff(required_roles text[] default array['admin','instructor']) returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and exists(select 1 from public.user_roles where user_id=auth.uid() and role=any(required_roles))
$$;
revoke all on function public.amex_is_staff(text[]) from public,anon;grant execute on function public.amex_is_staff(text[]) to authenticated;

alter table public.user_roles enable row level security;alter table public.user_roles force row level security;
alter table public.admin_audit_log enable row level security;alter table public.admin_audit_log force row level security;
alter table public.quiz_attempts enable row level security;alter table public.quiz_attempts force row level security;
alter table public.certificates enable row level security;alter table public.certificates force row level security;

do $$ declare t text;p record;begin
 foreach t in array array['user_roles','admin_audit_log','quiz_attempts','certificates'] loop
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy if exists %I on public.%I',p.policyname,t);end loop;
 end loop;
end $$;
create policy roles_self_read on public.user_roles for select to authenticated using(user_id=auth.uid() or public.amex_is_staff(array['admin']));
create policy roles_admin_all on public.user_roles for all to authenticated using(public.amex_is_staff(array['admin'])) with check(public.amex_is_staff(array['admin']));
create policy audit_staff_read on public.admin_audit_log for select to authenticated using(public.amex_is_staff(array['admin','instructor']));
create policy attempts_owner_read on public.quiz_attempts for select to authenticated using(user_id=auth.uid() or public.amex_is_staff(array['admin','instructor']));
create policy certificates_owner_read on public.certificates for select to authenticated using(user_id=auth.uid() or public.amex_is_staff(array['admin','instructor']));

create or replace function public.amex_admin_save_course(payload jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();rid uuid;v_title text:=trim(payload->>'title');v_slug text:=lower(trim(payload->>'slug'));v_description text:=trim(payload->>'description');v_status text:=coalesce(payload->>'status','draft');v_hours int:=coalesce((payload->>'workload_hours')::int,1);
begin
 if not public.amex_is_staff(array['admin','instructor']) then raise exception 'Acesso negado' using errcode='42501';end if;
 if length(v_title) not between 2 and 120 or v_slug!~'^[a-z0-9-]{2,80}$' or length(v_description) not between 10 and 1200 or v_hours not between 1 and 1000 or v_status not in('draft','published','archived') then raise exception 'Dados inválidos' using errcode='22023';end if;
 insert into public.courses(title,slug,description,workload_hours,status,position) values(v_title,v_slug,v_description,v_hours,v_status,coalesce((select max(position)+1 from public.courses),1))
 on conflict(slug) do update set title=excluded.title,description=excluded.description,workload_hours=excluded.workload_hours,status=excluded.status returning id into rid;
 insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(actor,'course.save','course',rid,jsonb_build_object('slug',v_slug,'status',v_status));return rid;
end$$;
revoke all on function public.amex_admin_save_course(jsonb) from public,anon;grant execute on function public.amex_admin_save_course(jsonb) to authenticated;

create or replace function public.amex_verify_certificate(code text) returns table(student_name text,academy text,workload_hours integer,curriculum_version text,status text,issued_at timestamptz) language sql stable security definer set search_path=public as $$
 select c.student_name,c.academy,c.workload_hours,c.curriculum_version,c.status,c.issued_at from public.certificates c where c.public_code=upper(trim(code)) limit 1
$$;
revoke all on function public.amex_verify_certificate(text) from public;grant execute on function public.amex_verify_certificate(text) to anon,authenticated;


create or replace function public.amex_admin_issue_certificate(target_user uuid,target_academy text,target_name text,target_hours integer)
returns text language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();code text;begin
 if not public.amex_is_staff(array['admin']) then raise exception 'Acesso negado' using errcode='42501';end if;
 if target_academy not in('pentest','python') or length(trim(target_name)) not between 2 and 120 or target_hours not between 1 and 10000 then raise exception 'Dados inválidos' using errcode='22023';end if;
 code:='AMEX-'||to_char(now(),'YYYY')||'-'||upper(substr(encode(gen_random_bytes(8),'hex'),1,12));
 insert into public.certificates(user_id,academy,public_code,student_name,workload_hours,curriculum_version) values(target_user,target_academy,code,trim(target_name),target_hours,'1.1.0')
 on conflict(user_id,academy,curriculum_version) do update set public_code=excluded.public_code,student_name=excluded.student_name,workload_hours=excluded.workload_hours,status='valid',issued_at=now(),revoked_at=null returning public_code into code;
 insert into public.admin_audit_log(actor_id,action,entity_type,details) values(actor,'certificate.issue','certificate',jsonb_build_object('target_user',target_user,'academy',target_academy));return code;end$$;
revoke all on function public.amex_admin_issue_certificate(uuid,text,text,integer) from public,anon;grant execute on function public.amex_admin_issue_certificate(uuid,text,text,integer) to authenticated;

create or replace function public.amex_admin_revoke_certificate(target_code text)
returns boolean language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();affected integer;begin if not public.amex_is_staff(array['admin']) then raise exception 'Acesso negado' using errcode='42501';end if;update public.certificates set status='revoked',revoked_at=now() where public_code=upper(trim(target_code)) and status='valid';get diagnostics affected=row_count;insert into public.admin_audit_log(actor_id,action,entity_type,details) values(actor,'certificate.revoke','certificate',jsonb_build_object('code',upper(trim(target_code))));return affected=1;end$$;
revoke all on function public.amex_admin_revoke_certificate(text) from public,anon;grant execute on function public.amex_admin_revoke_certificate(text) to authenticated;

-- O primeiro administrador desta instalação foi definido pelo UUID conhecido do projeto.
-- Defina o primeiro administrador manualmente substituindo o UUID abaixo depois da execução:
-- insert into public.user_roles(user_id,role) values('UUID-DO-USUARIO','admin') on conflict(user_id) do update set role='admin';
commit;
