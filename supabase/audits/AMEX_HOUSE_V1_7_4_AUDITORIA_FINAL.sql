-- Resultado esperado: zero linhas.
with issues as(
 select 'Aula publicada sem vídeo válido' issue,l.id::text reference from public.lessons l where l.status='published' and not exists(select 1 from public.lesson_videos v where v.lesson_id=l.id and v.youtube_id~'^[A-Za-z0-9_-]{11}$')
 union all select 'Aula publicada sem avaliação',l.id::text from public.lessons l where l.status='published' and not exists(select 1 from public.amex_quiz_settings q where q.lesson_id=l.id and q.status='published')
 union all select 'Avaliação com menos de 3 questões',q.id::text from public.amex_quiz_settings q join public.lessons l on l.id=q.lesson_id where l.status='published' and (select count(*) from public.amex_questions x where x.quiz_id=q.id and x.status='published')<3
 union all select 'Questão sem 4 alternativas',x.id::text from public.amex_questions x join public.amex_quiz_settings q on q.id=x.quiz_id join public.lessons l on l.id=q.lesson_id where l.status='published' and (select count(*) from public.amex_alternatives a where a.question_id=x.id)<>4
 union all select 'Questão sem exatamente 1 resposta correta',x.id::text from public.amex_questions x join public.amex_quiz_settings q on q.id=x.quiz_id join public.lessons l on l.id=q.lesson_id where l.status='published' and (select count(*) from public.amex_alternatives a where a.question_id=x.id and a.is_correct)<>1
 union all select 'Módulo sem aula publicada',m.id::text from public.course_modules m join public.courses c on c.id=m.course_id where c.status='published' and not exists(select 1 from public.lessons l where l.module_id=m.id and l.status='published')
) select * from issues order by issue,reference;
