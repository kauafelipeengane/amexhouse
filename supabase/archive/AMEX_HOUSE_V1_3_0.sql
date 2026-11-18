-- AMEX HOUSE V1.3.0 - Conteúdo avançado, avaliações, notificações e diagnóstico
-- Pré-requisito: V1.2.0. Execute com backup.
begin;
create extension if not exists pgcrypto;
do $$ begin if to_regclass('public.amex_quiz_settings') is null then raise exception 'Aplique primeiro AMEX HOUSE V1.2.0';end if;end $$;

create table if not exists public.amex_questions(
 id uuid primary key default gen_random_uuid(),quiz_id uuid not null references public.amex_quiz_settings(id) on delete cascade,
 prompt text not null check(length(prompt) between 5 and 1000),explanation text not null default '' check(length(explanation)<=2000),
 position integer not null check(position between 1 and 1000),status text not null default 'draft' check(status in('draft','published','archived')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(quiz_id,position)
);
create table if not exists public.amex_alternatives(
 id uuid primary key default gen_random_uuid(),question_id uuid not null references public.amex_questions(id) on delete cascade,
 text text not null check(length(text) between 1 and 1000),is_correct boolean not null default false,
 position integer not null check(position between 1 and 100),created_at timestamptz not null default now(),unique(question_id,position)
);
create unique index if not exists amex_one_correct_answer on public.amex_alternatives(question_id) where is_correct;
create table if not exists public.notifications(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 type text not null check(length(type) between 2 and 40),title text not null check(length(title) between 2 and 120),
 message text not null check(length(message) between 2 and 500),reference_id uuid,read_at timestamptz,created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
create table if not exists public.saved_folders(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 60),created_at timestamptz not null default now(),unique(user_id,name)
);
create table if not exists public.saved_folder_items(
 folder_id uuid not null references public.saved_folders(id) on delete cascade,lesson_id uuid not null references public.lessons(id) on delete cascade,
 priority smallint not null default 0 check(priority between 0 and 5),tags text[] not null default '{}',created_at timestamptz not null default now(),primary key(folder_id,lesson_id)
);
create table if not exists public.admin_error_log(
 id uuid primary key default gen_random_uuid(),operation text not null,public_code text not null,details jsonb not null default '{}',created_at timestamptz not null default now()
);

alter table public.amex_questions enable row level security;alter table public.amex_questions force row level security;
alter table public.amex_alternatives enable row level security;alter table public.amex_alternatives force row level security;
alter table public.notifications enable row level security;alter table public.notifications force row level security;
alter table public.saved_folders enable row level security;alter table public.saved_folders force row level security;
alter table public.saved_folder_items enable row level security;alter table public.saved_folder_items force row level security;
alter table public.admin_error_log enable row level security;alter table public.admin_error_log force row level security;

do $$ declare t text;p record;begin foreach t in array array['amex_questions','amex_alternatives','notifications','saved_folders','saved_folder_items','admin_error_log'] loop for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy if exists %I on public.%I',p.policyname,t);end loop;end loop;end$$;
create policy questions_staff on public.amex_questions for all to authenticated using(public.amex_is_staff(array['admin','instructor'])) with check(public.amex_is_staff(array['admin','instructor']));
create policy alternatives_staff on public.amex_alternatives for all to authenticated using(public.amex_is_staff(array['admin','instructor'])) with check(public.amex_is_staff(array['admin','instructor']));
create policy notifications_owner_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy notifications_owner_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy folders_owner on public.saved_folders for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy folder_items_owner on public.saved_folder_items for all to authenticated using(exists(select 1 from public.saved_folders f where f.id=folder_id and f.user_id=auth.uid())) with check(exists(select 1 from public.saved_folders f where f.id=folder_id and f.user_id=auth.uid()));
create policy errors_admin_read on public.admin_error_log for select to authenticated using(public.amex_is_staff(array['admin']));

create or replace function public.amex_my_notifications(page_number integer default 1) returns setof public.notifications language sql stable security invoker set search_path=public as $$
 select * from public.notifications where user_id=auth.uid() order by created_at desc limit 25 offset greatest(0,(greatest(page_number,1)-1)*25)
$$;
create or replace function public.amex_mark_notification_read(target_id uuid) returns boolean language plpgsql security invoker set search_path=public as $$declare n integer;begin update public.notifications set read_at=coalesce(read_at,now()) where id=target_id and user_id=auth.uid();get diagnostics n=row_count;return n=1;end$$;
revoke all on function public.amex_my_notifications(integer) from public,anon;grant execute on function public.amex_my_notifications(integer) to authenticated;
revoke all on function public.amex_mark_notification_read(uuid) from public,anon;grant execute on function public.amex_mark_notification_read(uuid) to authenticated;

create or replace function public.amex_admin_integrity() returns setof jsonb language plpgsql stable security definer set search_path=public as $$
begin
 if not public.amex_is_staff(array['admin','instructor']) then raise exception 'Acesso negado' using errcode='42501';end if;
 return query
 select jsonb_build_object('id',gen_random_uuid(),'title',title,'status',severity,'entity_type',kind,'created_at',now()) from(
  select c.title,'warning' severity,'Curso sem módulo' kind from public.courses c where c.status='published' and not exists(select 1 from public.course_modules m where m.course_id=c.id)
  union all select m.title,'warning','Módulo sem aula' from public.course_modules m where not exists(select 1 from public.lessons l where l.module_id=m.id and l.status='published')
  union all select l.title,'warning','Aula sem vídeo' from public.lessons l where l.status='published' and not exists(select 1 from public.lesson_videos v where v.lesson_id=l.id)
  union all select q.title,'error','Avaliação sem perguntas' from public.amex_quiz_settings q where q.status='published' and not exists(select 1 from public.amex_questions x where x.quiz_id=q.id and x.status='published')
  union all select left(x.prompt,120),'error','Pergunta sem resposta correta' from public.amex_questions x where x.status='published' and not exists(select 1 from public.amex_alternatives a where a.question_id=x.id and a.is_correct)
 )issues order by severity desc,title;
end$$;
revoke all on function public.amex_admin_integrity() from public,anon;grant execute on function public.amex_admin_integrity() to authenticated;

create or replace function public.amex_admin_reorder(entity_name text,target_id uuid,direction text) returns boolean language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();current_position integer;parent_id uuid;other_id uuid;other_position integer;begin
 if not public.amex_is_staff(array['admin','instructor']) or direction not in('up','down','first','last') then raise exception 'Operação inválida' using errcode='42501';end if;
 if entity_name='modules' then select position,course_id into current_position,parent_id from public.course_modules where id=target_id for update;select id,position into other_id,other_position from public.course_modules where course_id=parent_id and id<>target_id order by case when direction in('up','first') then position else -position end limit 1;
 elsif entity_name='lessons' then select position,module_id into current_position,parent_id from public.lessons where id=target_id for update;select id,position into other_id,other_position from public.lessons where module_id=parent_id and id<>target_id order by case when direction in('up','first') then position else -position end limit 1;
 else raise exception 'Entidade inválida';end if;
 if other_id is null then return false;end if;
 if entity_name='modules' then update public.course_modules set position=case when id=target_id then other_position else current_position end where id in(target_id,other_id);else update public.lessons set position=case when id=target_id then other_position else current_position end where id in(target_id,other_id);end if;
 insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(actor,'entity.reorder',entity_name,target_id,jsonb_build_object('direction',direction));return true;
end$$;
revoke all on function public.amex_admin_reorder(text,uuid,text) from public,anon;grant execute on function public.amex_admin_reorder(text,uuid,text) to authenticated;

-- Sobrescreve listagem V1.2.0 para incluir novos domínios.
create or replace function public.amex_admin_list(entity_name text,page_number integer default 1,search_text text default '') returns setof jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare role_value text:=public.amex_my_role();off integer:=greatest(0,(greatest(page_number,1)-1)*25);term text:='%'||lower(left(trim(coalesce(search_text,'')),120))||'%';begin
 if role_value not in('admin','instructor') then raise exception 'Acesso negado' using errcode='42501';end if;
 if entity_name='questions' then return query select to_jsonb(x) from(select id,left(prompt,120) title,quiz_id,position,status from public.amex_questions where lower(prompt) like term order by quiz_id,position limit 25 offset off)x;
 elsif entity_name='videos' then return query select to_jsonb(x) from(select lesson_id id,title,youtube_id slug,channel,'active' status from public.lesson_videos where lower(title) like term order by title limit 25 offset off)x;
 elsif entity_name='resources' then return query select to_jsonb(x) from(select id,title,url slug,resource_type status,lesson_id from public.lesson_resources where lower(title) like term order by lesson_id,position limit 25 offset off)x;
 elsif entity_name='exercises' then return query select to_jsonb(x) from(select id,title,difficulty status,lesson_id,position from public.lesson_exercises where lower(title) like term order by lesson_id,position limit 25 offset off)x;
 elsif entity_name='integrity' then return query select * from public.amex_admin_integrity();
 elsif entity_name='courses' then return query select to_jsonb(x) from(select id,title,slug,status,workload_hours from public.courses where lower(title) like term or lower(slug) like term order by title limit 25 offset off)x;
 elsif entity_name='modules' then return query select to_jsonb(x) from(select m.id,m.title,m.course_id,m.position,c.title course_title,'active' status from public.course_modules m join public.courses c on c.id=m.course_id where lower(m.title) like term order by c.title,m.position limit 25 offset off)x;
 elsif entity_name='lessons' then return query select to_jsonb(x) from(select id,title,module_id,position,status,workload_hours from public.lessons where lower(title) like term order by title limit 25 offset off)x;
 elsif entity_name='quizzes' then return query select to_jsonb(x) from(select * from public.amex_quiz_settings where lower(title) like term order by updated_at desc limit 25 offset off)x;
 elsif entity_name='certificates' then return query select to_jsonb(x) from(select id,public_code,student_name,academy,status,issued_at from public.certificates where lower(student_name) like term or lower(public_code) like term order by issued_at desc limit 25 offset off)x;
 elsif entity_name='audit' then return query select to_jsonb(x) from(select id,action,entity_type,entity_id,created_at from public.admin_audit_log where lower(action) like term order by created_at desc limit 25 offset off)x;
 elsif entity_name='users' then return query select jsonb_build_object('user_id',u.id,'display_name',coalesce(u.raw_user_meta_data->>'display_name','Estudante'),'email_masked',case when role_value='admin' then u.email else regexp_replace(u.email,'(^.).*(@.*$)','\1***\2') end,'role',coalesce(r.role,'student'),'created_at',u.created_at) from auth.users u left join public.user_roles r on r.user_id=u.id where lower(coalesce(u.email,'')) like term order by u.created_at desc limit 25 offset off;
 else raise exception 'Entidade inválida' using errcode='22023';end if;
end$$;

-- Salvamento dos novos domínios. Os existentes continuam na função V1.2.0.
create or replace function public.amex_admin_save_advanced(entity_name text,payload jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();rid uuid:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());begin
 if not public.amex_is_staff(array['admin','instructor']) then raise exception 'Acesso negado' using errcode='42501';end if;
 if entity_name='questions' then insert into public.amex_questions(id,quiz_id,prompt,explanation,position,status) values(rid,(payload->>'quiz_id')::uuid,trim(payload->>'prompt'),left(coalesce(payload->>'explanation',''),2000),greatest(1,(payload->>'position')::int),coalesce(payload->>'status','draft')) on conflict(id) do update set prompt=excluded.prompt,explanation=excluded.explanation,position=excluded.position,status=excluded.status,updated_at=now();
 elsif entity_name='videos' then if coalesce(payload->>'youtube_id','')!~'^[A-Za-z0-9_-]{11}$' then raise exception 'ID do YouTube inválido';end if;insert into public.lesson_videos(lesson_id,youtube_id,alternative_youtube_id,title,channel,is_embed_allowed,reviewed_at) values((payload->>'lesson_id')::uuid,payload->>'youtube_id',nullif(payload->>'alternative_youtube_id',''),left(payload->>'title',160),left(payload->>'channel',120),coalesce((payload->>'is_embed_allowed')::boolean,true),now()) on conflict(lesson_id) do update set youtube_id=excluded.youtube_id,alternative_youtube_id=excluded.alternative_youtube_id,title=excluded.title,channel=excluded.channel,is_embed_allowed=excluded.is_embed_allowed,reviewed_at=now() returning lesson_id into rid;
 elsif entity_name='resources' then if coalesce(payload->>'url','')!~'^https://' then raise exception 'URL deve usar HTTPS';end if;insert into public.lesson_resources(id,lesson_id,title,url,resource_type,position) values(rid,(payload->>'lesson_id')::uuid,left(trim(payload->>'title'),160),left(payload->>'url',2000),payload->>'resource_type',greatest(1,(payload->>'position')::int)) on conflict(id) do update set title=excluded.title,url=excluded.url,resource_type=excluded.resource_type,position=excluded.position;
 elsif entity_name='exercises' then insert into public.lesson_exercises(id,lesson_id,title,instructions,difficulty,acceptance_criteria,position) values(rid,(payload->>'lesson_id')::uuid,left(trim(payload->>'title'),160),left(payload->>'instructions',6000),payload->>'difficulty','[]'::jsonb,greatest(1,(payload->>'position')::int)) on conflict(id) do update set title=excluded.title,instructions=excluded.instructions,difficulty=excluded.difficulty,position=excluded.position;
 else raise exception 'Entidade avançada inválida';end if;
 insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(actor,'advanced.save',entity_name,rid,jsonb_build_object('after',payload-'solution'));return rid;
end$$;
revoke all on function public.amex_admin_save_advanced(text,jsonb) from public,anon;grant execute on function public.amex_admin_save_advanced(text,jsonb) to authenticated;

commit;
