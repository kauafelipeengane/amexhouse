-- AMEX HOUSE V1.2.0 - gestão acadêmica completa e segura
-- Execute após AMEX_HOUSE_V1_1_0.sql. Faça backup antes.
begin;
create extension if not exists pgcrypto;

do $$ begin
 if to_regclass('public.user_roles') is null or to_regclass('public.admin_audit_log') is null then raise exception 'Aplique primeiro a migração V1.1.0'; end if;
end $$;

-- Configuração complementar das avaliações, sem interferir no schema legado.
create table if not exists public.amex_quiz_settings(
 id uuid primary key default gen_random_uuid(),lesson_id uuid not null unique references public.lessons(id) on delete cascade,
 title text not null check(length(title) between 2 and 160),passing_score integer not null default 70 check(passing_score between 1 and 100),
 max_attempts integer not null default 3 check(max_attempts between 1 and 100),required boolean not null default true,
 status text not null default 'draft' check(status in('draft','published','archived')),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.amex_quiz_settings enable row level security;alter table public.amex_quiz_settings force row level security;
drop policy if exists quiz_settings_staff_read on public.amex_quiz_settings;
create policy quiz_settings_staff_read on public.amex_quiz_settings for select to authenticated using(public.amex_is_staff(array['admin','instructor']));

create or replace function public.amex_admin_dashboard() returns jsonb language plpgsql stable security definer set search_path=public,auth as $$
begin
 if not public.amex_is_staff(array['admin','instructor']) then raise exception 'Acesso negado' using errcode='42501';end if;
 return jsonb_build_object(
  'students',(select count(*) from auth.users),
  'active_7d',(select count(distinct user_id) from public.activities where created_at>=now()-interval '7 days'),
  'active_30d',(select count(distinct user_id) from public.activities where created_at>=now()-interval '30 days'),
  'published_courses',(select count(*) from public.courses where status='published'),
  'published_lessons',(select count(*) from public.lessons where status='published'),
  'attempts',(select count(*) from public.quiz_attempts),
  'average_score',(select coalesce(round(avg(score)),0) from public.quiz_attempts),
  'certificates',(select count(*) from public.certificates where status='valid'));
end$$;
revoke all on function public.amex_admin_dashboard() from public,anon;grant execute on function public.amex_admin_dashboard() to authenticated;

-- Apenas dados mínimos de usuários. Instrutor recebe e-mail mascarado.
create or replace function public.amex_admin_list(entity_name text,page_number integer default 1,search_text text default '') returns setof jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare actor_role text:=public.amex_my_role();off integer:=greatest(0,(least(greatest(page_number,1),10000)-1)*25);term text:='%'||lower(left(trim(coalesce(search_text,'')),120))||'%';
begin
 if actor_role not in('admin','instructor') then raise exception 'Acesso negado' using errcode='42501';end if;
 if entity_name='courses' then return query select to_jsonb(x) from(select id,title,slug,status,workload_hours from public.courses where lower(title) like term or lower(slug) like term order by title limit 25 offset off)x;
 elsif entity_name='modules' then return query select to_jsonb(x) from(select m.id,m.title,m.course_id,m.position,c.title course_title,'active' status from public.course_modules m join public.courses c on c.id=m.course_id where lower(m.title) like term order by c.title,m.position limit 25 offset off)x;
 elsif entity_name='lessons' then return query select to_jsonb(x) from(select l.id,l.title,l.module_id,l.position,l.status,l.workload_hours from public.lessons l where lower(l.title) like term order by l.title limit 25 offset off)x;
 elsif entity_name='quizzes' then return query select to_jsonb(x) from(select * from public.amex_quiz_settings q where lower(q.title) like term order by q.updated_at desc limit 25 offset off)x;
 elsif entity_name='certificates' then return query select to_jsonb(x) from(select id,public_code,student_name,academy,status,issued_at from public.certificates where lower(student_name) like term or lower(public_code) like term order by issued_at desc limit 25 offset off)x;
 elsif entity_name='audit' then return query select to_jsonb(x) from(select id,action,entity_type,entity_id,created_at from public.admin_audit_log where lower(action) like term or lower(entity_type) like term order by created_at desc limit 25 offset off)x;
 elsif entity_name='users' then return query select jsonb_build_object('user_id',u.id,'display_name',coalesce(u.raw_user_meta_data->>'display_name','Estudante'),'email_masked',case when actor_role='admin' then u.email else regexp_replace(u.email,'(^.).*(@.*$)','\1***\2') end,'role',coalesce(r.role,'student'),'created_at',u.created_at) from auth.users u left join public.user_roles r on r.user_id=u.id where lower(coalesce(u.email,'')) like term or lower(coalesce(u.raw_user_meta_data->>'display_name','')) like term order by u.created_at desc limit 25 offset off;
 else raise exception 'Entidade inválida' using errcode='22023';end if;
end$$;
revoke all on function public.amex_admin_list(text,integer,text) from public,anon;grant execute on function public.amex_admin_list(text,integer,text) to authenticated;

create or replace function public.amex_admin_save(entity_name text,payload jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();rid uuid:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());title text:=trim(payload->>'title');status_value text:=coalesce(payload->>'status','draft');
begin
 if not public.amex_is_staff(array['admin','instructor']) then raise exception 'Acesso negado' using errcode='42501';end if;
 if length(title) not between 2 and 160 then raise exception 'Título inválido' using errcode='22023';end if;
 if entity_name='courses' then
  if (payload->>'slug')!~'^[a-z0-9-]{2,80}$' or length(trim(payload->>'description')) not between 10 and 1200 then raise exception 'Curso inválido';end if;
  insert into public.courses(id,title,slug,description,workload_hours,status,position) values(rid,title,payload->>'slug',trim(payload->>'description'),greatest(1,least(1000,(payload->>'workload_hours')::int)),status_value,coalesce((select max(position)+1 from public.courses),1)) on conflict(id) do update set title=excluded.title,slug=excluded.slug,description=excluded.description,workload_hours=excluded.workload_hours,status=excluded.status;
 elsif entity_name='modules' then insert into public.course_modules(id,course_id,title,position) values(rid,(payload->>'course_id')::uuid,title,greatest(1,(payload->>'position')::int)) on conflict(id) do update set course_id=excluded.course_id,title=excluded.title,position=excluded.position;
 elsif entity_name='lessons' then insert into public.lessons(id,module_id,title,summary,position,workload_hours,objectives,status) values(rid,(payload->>'module_id')::uuid,title,left(coalesce(payload->>'summary',''),1200),greatest(1,(payload->>'position')::int),greatest(1,least(1000,(payload->>'workload_hours')::int)),'[]'::jsonb,status_value) on conflict(id) do update set module_id=excluded.module_id,title=excluded.title,summary=excluded.summary,position=excluded.position,workload_hours=excluded.workload_hours,status=excluded.status;
 elsif entity_name='quizzes' then insert into public.amex_quiz_settings(id,lesson_id,title,passing_score,max_attempts,required,status) values(rid,(payload->>'lesson_id')::uuid,title,greatest(1,least(100,(payload->>'passing_score')::int)),greatest(1,least(100,(payload->>'max_attempts')::int)),coalesce((payload->>'required')::boolean,true),status_value) on conflict(lesson_id) do update set title=excluded.title,passing_score=excluded.passing_score,max_attempts=excluded.max_attempts,required=excluded.required,status=excluded.status,updated_at=now() returning id into rid;
 else raise exception 'Entidade inválida';end if;
 insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(actor,'entity.save',entity_name,rid,jsonb_build_object('status',status_value));return rid;
end$$;
revoke all on function public.amex_admin_save(text,jsonb) from public,anon;grant execute on function public.amex_admin_save(text,jsonb) to authenticated;

create or replace function public.amex_admin_archive(entity_name text,target_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();affected integer;begin
 if not public.amex_is_staff(array['admin','instructor']) then raise exception 'Acesso negado' using errcode='42501';end if;
 if entity_name='courses' then update public.courses set status='archived' where id=target_id;
 elsif entity_name='lessons' then update public.lessons set status='archived' where id=target_id;
 elsif entity_name='quizzes' then update public.amex_quiz_settings set status='archived',updated_at=now() where id=target_id;
 elsif entity_name='modules' then raise exception 'Módulos com conteúdo não podem ser excluídos; arquive as aulas e o curso.';
 else raise exception 'Entidade inválida';end if;get diagnostics affected=row_count;
 insert into public.admin_audit_log(actor_id,action,entity_type,entity_id) values(actor,'entity.archive',entity_name,target_id);return affected=1;
end$$;
revoke all on function public.amex_admin_archive(text,uuid) from public,anon;grant execute on function public.amex_admin_archive(text,uuid) to authenticated;

create or replace function public.amex_admin_set_role(target_user uuid,new_role text) returns boolean language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();admin_count integer;begin
 if not public.amex_is_staff(array['admin']) or new_role not in('student','instructor','admin') then raise exception 'Acesso negado' using errcode='42501';end if;
 if target_user=actor and new_role<>'admin' then select count(*) into admin_count from public.user_roles where role='admin';if admin_count<=1 then raise exception 'O último administrador não pode remover a própria permissão';end if;end if;
 insert into public.user_roles(user_id,role,updated_at) values(target_user,new_role,now()) on conflict(user_id) do update set role=excluded.role,updated_at=now();
 insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(actor,'role.change','user',target_user,jsonb_build_object('role',new_role));return true;
end$$;
revoke all on function public.amex_admin_set_role(uuid,text) from public,anon;grant execute on function public.amex_admin_set_role(uuid,text) to authenticated;

-- Emissão somente após conclusão real da formação e avaliações obrigatórias configuradas.
create or replace function public.amex_admin_issue_certificate(target_user uuid,target_academy text,target_name text,target_hours integer)
returns text language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();code text;lesson_total integer;lesson_done integer;quiz_total integer;quiz_done integer;
begin
 if not public.amex_is_staff(array['admin']) then raise exception 'Acesso negado' using errcode='42501';end if;
 if target_academy not in('pentest','python') or length(trim(target_name)) not between 2 and 120 or target_hours not between 1 and 10000 then raise exception 'Dados inválidos' using errcode='22023';end if;
 select count(*),count(*) filter(where lp.status='completed') into lesson_total,lesson_done
 from public.lessons l join public.course_modules m on m.id=l.module_id join public.courses c on c.id=m.course_id
 left join public.lesson_progress lp on lp.lesson_id=l.id and lp.user_id=target_user
 where l.status='published' and c.status='published' and (case when target_academy='python' then c.slug like 'python-%' else c.slug not like 'python-%' end);
 if lesson_total=0 or lesson_done<>lesson_total then raise exception 'Formação incompleta: % de % aulas concluídas',lesson_done,lesson_total using errcode='22023';end if;
 select count(*),count(*) filter(where lp.quiz_passed=true) into quiz_total,quiz_done
 from public.amex_quiz_settings qs join public.lessons l on l.id=qs.lesson_id join public.course_modules m on m.id=l.module_id join public.courses c on c.id=m.course_id
 left join public.lesson_progress lp on lp.lesson_id=l.id and lp.user_id=target_user
 where qs.required and qs.status='published' and (case when target_academy='python' then c.slug like 'python-%' else c.slug not like 'python-%' end);
 if quiz_done<>quiz_total then raise exception 'Avaliações pendentes: % de % aprovadas',quiz_done,quiz_total using errcode='22023';end if;
 code:='AMEX-'||to_char(now(),'YYYY')||'-'||upper(substr(encode(gen_random_bytes(8),'hex'),1,12));
 insert into public.certificates(user_id,academy,public_code,student_name,workload_hours,curriculum_version) values(target_user,target_academy,code,trim(target_name),target_hours,'1.2.0')
 on conflict(user_id,academy,curriculum_version) do update set public_code=excluded.public_code,student_name=excluded.student_name,workload_hours=excluded.workload_hours,status='valid',issued_at=now(),revoked_at=null returning public_code into code;
 insert into public.admin_audit_log(actor_id,action,entity_type,details) values(actor,'certificate.issue','certificate',jsonb_build_object('target_user',target_user,'academy',target_academy,'lessons',lesson_total,'quizzes',quiz_total));return code;
end$$;
revoke all on function public.amex_admin_issue_certificate(uuid,text,text,integer) from public,anon;grant execute on function public.amex_admin_issue_certificate(uuid,text,text,integer) to authenticated;

commit;
