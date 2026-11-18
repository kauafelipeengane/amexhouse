-- AMEX HOUSE V1.6.0 - revisão editorial das aulas já cadastradas
begin;

with target_lessons as (
 select l.id from public.lessons l
 join public.course_modules m on m.id=l.module_id
 join public.courses c on c.id=m.course_id
 where c.slug = any(array['javascript-fundamentos','javascript-web-moderno','typescript-arquitetura','react-interfaces','node-backend','bancos-javascript','testes-javascript','fullstack-producao','javascript-projeto-senior','dados-fundamentos','sql-profissional','postgresql-modelagem','python-analise-dados','visualizacao-dados','estatistica-aplicada','machine-learning-fundamentos','engenharia-dados','bi-storytelling','linux-administracao','redes-devops','git-colaboracao','ci-cd','docker-containers','cloud-fundamentos','terraform-iac','kubernetes-orquestracao','sre-observabilidade'])
)
update public.lessons set
 title=case
  when title like 'Conceitos e vocabulário essenciais — %' then 'Fundamentos de '||split_part(title,'— ',2)
  when title like 'Configuração do ambiente profissional — %' then 'Preparação do ambiente: '||split_part(title,'— ',2)
  when title like 'Prática guiada e validação — %' then 'Implementação guiada: '||split_part(title,'— ',2)
  when title like 'Falhas comuns e diagnóstico — %' then 'Diagnóstico e correção: '||split_part(title,'— ',2)
  when title like 'Laboratório e entrega do módulo — %' then 'Desafio prático: '||split_part(title,'— ',2)
  else title end,
 summary=replace(replace(replace(replace(replace(coalesce(summary,''),
  ': conceitos e vocabulário essenciais, com aplicação prática, critérios de qualidade, segurança e exercício orientado.',': princípios, decisões técnicas e um exercício de verificação.'),
  ': configuração do ambiente profissional, com aplicação prática, critérios de qualidade, segurança e exercício orientado.',': preparação das ferramentas, conferência da instalação e primeiro teste.'),
  ': prática guiada e validação, com aplicação prática, critérios de qualidade, segurança e exercício orientado.',': implementação passo a passo, teste do resultado e revisão das decisões.'),
  ': falhas comuns e diagnóstico, com aplicação prática, critérios de qualidade, segurança e exercício orientado.',': análise de falhas recorrentes, leitura de evidências e correção controlada.'),
  ': laboratório e entrega do módulo, com aplicação prática, critérios de qualidade, segurança e exercício orientado.',': desafio de fechamento com evidências, critérios de aceite e registro da solução.'),
 objectives=replace(replace(replace(replace(replace(replace(objectives::text,
  'Aplicar conceitos e vocabulário essenciais','Explicar as decisões técnicas do tema'),
  'Aplicar configuração do ambiente profissional','Preparar e conferir o ambiente'),
  'Aplicar prática guiada e validação','Implementar e testar a solução'),
  'Aplicar falhas comuns e diagnóstico','Diagnosticar e corrigir falhas'),
  'Aplicar laboratório e entrega do módulo','Concluir o desafio do módulo'),
  'Validar a entrega com critérios profissionais','Revisar o resultado com critérios definidos')::jsonb
where id in(select id from target_lessons) and title like any(array[
 'Conceitos e vocabulário essenciais — %','Configuração do ambiente profissional — %','Prática guiada e validação — %','Falhas comuns e diagnóstico — %','Laboratório e entrega do módulo — %'
]);

-- A migração deve tratar exatamente as aulas das três academias adicionadas.
do $$ declare remaining integer; begin
 select count(*) into remaining from public.lessons l join public.course_modules m on m.id=l.module_id join public.courses c on c.id=m.course_id where c.slug = any(array['javascript-fundamentos','javascript-web-moderno','typescript-arquitetura','react-interfaces','node-backend','bancos-javascript','testes-javascript','fullstack-producao','javascript-projeto-senior','dados-fundamentos','sql-profissional','postgresql-modelagem','python-analise-dados','visualizacao-dados','estatistica-aplicada','machine-learning-fundamentos','engenharia-dados','bi-storytelling','linux-administracao','redes-devops','git-colaboracao','ci-cd','docker-containers','cloud-fundamentos','terraform-iac','kubernetes-orquestracao','sre-observabilidade']) and l.title like any(array[
  'Conceitos e vocabulário essenciais — %','Configuração do ambiente profissional — %','Prática guiada e validação — %','Falhas comuns e diagnóstico — %','Laboratório e entrega do módulo — %'
 ]);
 if remaining<>0 then raise exception 'Revisão editorial incompleta: % títulos genéricos restantes',remaining; end if;
end $$;

commit;
