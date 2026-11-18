-- AMEX HOUSE V1.5.0 - desempenho acadêmico, competências e recomendações
begin;

create table if not exists public.competencies(
 id uuid primary key default gen_random_uuid(),academy text not null check(academy in('pentest','python')),
 slug text not null check(slug~'^[a-z0-9-]{2,80}$'),title text not null check(length(title) between 2 and 120),
 description text not null default '' check(length(description)<=500),position integer not null default 1 check(position>0),
 created_at timestamptz not null default now(),unique(academy,slug)
);
create table if not exists public.lesson_competencies(
 lesson_id uuid not null references public.lessons(id) on delete cascade,competency_id uuid not null references public.competencies(id) on delete cascade,
 weight numeric(4,2) not null default 1 check(weight>0 and weight<=10),primary key(lesson_id,competency_id)
);
alter table public.competencies enable row level security;alter table public.competencies force row level security;
alter table public.lesson_competencies enable row level security;alter table public.lesson_competencies force row level security;
revoke all on public.competencies,public.lesson_competencies from anon,authenticated;
grant select on public.competencies,public.lesson_competencies to authenticated;
create policy competencies_authenticated_read on public.competencies for select to authenticated using(true);
create policy lesson_competencies_authenticated_read on public.lesson_competencies for select to authenticated using(true);

insert into public.competencies(academy,slug,title,description,position) values
 ('pentest','fundamentos-seguranca','Fundamentos de segurança','Conceitos essenciais, superfície de ataque e avaliação de risco.',1),
 ('pentest','web-security','Segurança web','Autenticação, autorização, sessões, injeções e validação.',2),
 ('pentest','reconhecimento','Reconhecimento','Coleta, enumeração e organização de evidências.',3),
 ('python','fundamentos-python','Fundamentos Python','Sintaxe, tipos, controle de fluxo e funções.',1),
 ('python','estruturas-dados','Estruturas de dados','Coleções, transformação e organização de dados.',2),
 ('python','automacao','Automação','Scripts confiáveis, arquivos, APIs e tratamento de erros.',3)
on conflict(academy,slug) do update set title=excluded.title,description=excluded.description,position=excluded.position;

-- Associa inicialmente por formação. O painel poderá refinar por aula depois.
insert into public.lesson_competencies(lesson_id,competency_id,weight)
select l.id,c.id,1 from public.lessons l join public.course_modules m on m.id=l.module_id join public.courses cr on cr.id=m.course_id join public.competencies c on c.academy=case when lower(cr.slug) like '%python%' then 'python' else 'pentest' end
where c.position=1 on conflict do nothing;

create or replace function public.amex_my_learning_insights(target_academy text) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare actor uuid:=auth.uid();attempts jsonb;skills jsonb;summary jsonb;recommendations jsonb;begin
 if actor is null or target_academy not in('pentest','python') then raise exception 'Solicitação inválida' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.submitted_at desc),'[]'::jsonb) into attempts from(
  select qa.attempt_number,qa.score,qa.passed,qa.started_at,qa.submitted_at,greatest(0,extract(epoch from(qa.submitted_at-qa.started_at))::integer) duration_seconds,
   qs.title quiz_title,l.title lesson_title,cr.title course_title
  from public.quiz_attempts qa join public.amex_quiz_settings qs on qs.id=qa.quiz_id join public.lessons l on l.id=qs.lesson_id join public.course_modules m on m.id=l.module_id join public.courses cr on cr.id=m.course_id
  where qa.user_id=actor and (case when lower(cr.slug) like '%python%' then 'python' else 'pentest' end)=target_academy limit 50
 )x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.position),'[]'::jsonb) into skills from(
  select c.id,c.slug,c.title,c.description,c.position,count(distinct lc.lesson_id) lessons_total,
   count(distinct lp.lesson_id) filter(where lp.status='completed') lessons_completed,
   case when count(distinct lc.lesson_id)=0 then 0 else round(count(distinct lp.lesson_id) filter(where lp.status='completed')::numeric*100/count(distinct lc.lesson_id)) end percent
  from public.competencies c left join public.lesson_competencies lc on lc.competency_id=c.id left join public.lesson_progress lp on lp.lesson_id=lc.lesson_id and lp.user_id=actor
  where c.academy=target_academy group by c.id
 )x;
 select jsonb_build_object('attempts',count(*),'average_score',coalesce(round(avg(score),1),0),'approved',count(*) filter(where passed),'study_seconds',coalesce(sum((extract(epoch from(submitted_at-started_at))::integer)),0)) into summary
 from public.quiz_attempts qa join public.amex_quiz_settings qs on qs.id=qa.quiz_id join public.lessons l on l.id=qs.lesson_id join public.course_modules m on m.id=l.module_id join public.courses cr on cr.id=m.course_id
 where qa.user_id=actor and (case when lower(cr.slug) like '%python%' then 'python' else 'pentest' end)=target_academy;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.priority,x.title),'[]'::jsonb) into recommendations from(
  select 1 priority,'Reforce '||c.title title,'Conclua as aulas pendentes desta competência.' reason,c.slug reference from public.competencies c left join public.lesson_competencies lc on lc.competency_id=c.id left join public.lesson_progress lp on lp.lesson_id=lc.lesson_id and lp.user_id=actor where c.academy=target_academy group by c.id having count(distinct lp.lesson_id) filter(where lp.status='completed')<count(distinct lc.lesson_id)
  union all select 2,'Revise a última avaliação','Use seu histórico para identificar evolução entre tentativas.','quiz-history' where jsonb_array_length(attempts)>0
  limit 6
 )x;
 return jsonb_build_object('summary',summary,'attempts',attempts,'competencies',skills,'recommendations',recommendations,'generated_at',now());
end$$;
revoke all on function public.amex_my_learning_insights(text) from public,anon;grant execute on function public.amex_my_learning_insights(text) to authenticated;
commit;
