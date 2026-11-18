-- AMEX HOUSE V1.28.0 - diagnóstico somente leitura.
select 'quizzes_sem_pergunta' as check_name, count(*) as findings
from public.amex_quiz_settings s
where s.status='published' and not exists (
  select 1 from public.amex_questions q where q.quiz_id=s.id and q.status='published'
)
union all
select 'perguntas_sem_unica_correta', count(*)
from (
  select q.id
  from public.amex_questions q
  left join public.amex_alternatives a on a.question_id=q.id
  where q.status='published'
  group by q.id
  having count(*) filter(where a.is_correct=true) <> 1
) x
union all
select 'progresso_duplicado', count(*)
from (
  select user_id,lesson_id from public.lesson_progress
  group by user_id,lesson_id having count(*)>1
) x
union all
select 'metas_duplicadas', count(*)
from (
  select user_id,academy from public.study_goals
  group by user_id,academy having count(*)>1
) x
union all
select 'tentativas_orfas', count(*)
from public.quiz_attempts a
left join public.amex_quiz_settings s on s.id=a.quiz_id
where s.id is null;
