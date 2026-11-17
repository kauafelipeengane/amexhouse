-- AMEX HOUSE V1.8.4
-- Repara somente avaliações publicadas com menos de 3 questões.
-- Não usa tabela temporária, tabela auxiliar, view ou função persistente.
begin;
select pg_advisory_xact_lock(hashtext('amex_house_v184_reparar_avaliacoes'));

-- Completa as posições 1, 2 e 3 que estiverem ausentes.
insert into public.amex_questions(quiz_id,prompt,explanation,position,status)
select q.id,
 case
  when c.slug like '%python%' and p.pos=1 then 'Qual estrutura é usada para armazenar pares de chave e valor em Python?'
  when c.slug like '%python%' and p.pos=2 then 'Qual bloco garante o fechamento seguro de um arquivo aberto em Python?'
  when c.slug like '%python%' and p.pos=3 then 'Qual prática reduz efeitos colaterais e facilita testes em uma função Python?'
  when (c.slug like '%pentest%' or c.slug like '%segur%' or c.slug like '%web%' or c.slug like '%rede%') and p.pos=1 then 'Qual condição deve existir antes de iniciar qualquer teste de segurança?'
  when (c.slug like '%pentest%' or c.slug like '%segur%' or c.slug like '%web%' or c.slug like '%rede%') and p.pos=2 then 'Qual evidência deve acompanhar a confirmação de uma vulnerabilidade?'
  when (c.slug like '%pentest%' or c.slug like '%segur%' or c.slug like '%web%' or c.slug like '%rede%') and p.pos=3 then 'Qual medida reduz o risco de causar indisponibilidade durante um teste autorizado?'
  when (c.slug like '%dados%' or c.slug like '%analytics%' or c.slug like '%estatistica%' or c.slug like '%machine-learning%') and p.pos=1 then 'Qual etapa deve ocorrer antes de interpretar os resultados de um conjunto de dados?'
  when (c.slug like '%dados%' or c.slug like '%analytics%' or c.slug like '%estatistica%' or c.slug like '%machine-learning%') and p.pos=2 then 'Qual medida é menos sensível a valores extremos?'
  when (c.slug like '%dados%' or c.slug like '%analytics%' or c.slug like '%estatistica%' or c.slug like '%machine-learning%') and p.pos=3 then 'Qual procedimento ajuda a evitar vazamento de informação entre treino e validação?'
  when (c.slug like '%devops%' or c.slug like '%linux%' or c.slug like '%cloud%' or c.slug like '%docker%' or c.slug like '%container%' or c.slug like '%kubernetes%' or c.slug like '%sre%') and p.pos=1 then 'Qual prática permite reproduzir uma infraestrutura de forma controlada e versionada?'
  when (c.slug like '%devops%' or c.slug like '%linux%' or c.slug like '%cloud%' or c.slug like '%docker%' or c.slug like '%container%' or c.slug like '%kubernetes%' or c.slug like '%sre%') and p.pos=2 then 'Qual verificação deve bloquear um deployment quando apresenta falha?'
  when (c.slug like '%devops%' or c.slug like '%linux%' or c.slug like '%cloud%' or c.slug like '%docker%' or c.slug like '%container%' or c.slug like '%kubernetes%' or c.slug like '%sre%') and p.pos=3 then 'Qual indicador relaciona falhas permitidas ao objetivo de nível de serviço?'
  when (c.slug like '%javascript%' or c.slug like '%typescript%' or c.slug like '%react%' or c.slug like '%node%' or c.slug like '%fullstack%') and p.pos=1 then 'Qual operador realiza comparação estrita em JavaScript?'
  when (c.slug like '%javascript%' or c.slug like '%typescript%' or c.slug like '%react%' or c.slug like '%node%' or c.slug like '%fullstack%') and p.pos=2 then 'Qual prática ajuda a impedir que dados inválidos cheguem à regra de negócio?'
  when (c.slug like '%javascript%' or c.slug like '%typescript%' or c.slug like '%react%' or c.slug like '%node%' or c.slug like '%fullstack%') and p.pos=3 then 'Qual teste verifica o comportamento de uma unidade isolada de código?'
  when p.pos=1 then 'Qual ação deve ser realizada primeiro ao iniciar a atividade técnica desta aula?'
  when p.pos=2 then 'Qual evidência demonstra que a atividade técnica foi executada corretamente?'
  else 'Qual verificação deve ser feita antes de considerar a atividade concluída?'
 end,
 case
  when p.pos=1 then 'A resposta correta identifica o fundamento necessário antes da execução.'
  when p.pos=2 then 'A resposta correta exige uma evidência verificável, não apenas a leitura do conteúdo.'
  else 'A resposta correta confirma resultado, critérios de aceite e ausência de falhas conhecidas.'
 end,
 p.pos,'published'
from public.amex_quiz_settings q
join public.lessons l on l.id=q.lesson_id
join public.course_modules m on m.id=l.module_id
join public.courses c on c.id=m.course_id
cross join (values(1),(2),(3)) p(pos)
where q.status='published' and l.status='published'
 and (select count(*) from public.amex_questions x where x.quiz_id=q.id and x.status='published')<3
 and not exists(select 1 from public.amex_questions x where x.quiz_id=q.id and x.position=p.pos)
on conflict(quiz_id,position) do update
 set prompt=excluded.prompt,explanation=excluded.explanation,status='published',updated_at=now();

-- Cria quatro alternativas para as questões reparadas que ainda não possuem alternativas.
insert into public.amex_alternatives(question_id,text,is_correct,position)
select x.id,
 case
  when x.prompt like '%pares de chave e valor%' then (array['Dicionário','Tupla imutável','Gerador','Decorador'])[a.pos]
  when x.prompt like '%fechamento seguro de um arquivo%' then (array['Bloco with','Bloco match','Função print','Expressão lambda'])[a.pos]
  when x.prompt like '%efeitos colaterais%' then (array['Receber dependências por parâmetro e retornar resultados previsíveis','Alterar variáveis globais','Misturar entrada, persistência e saída','Ocultar todos os erros'])[a.pos]
  when x.prompt like '%antes de iniciar qualquer teste de segurança%' then (array['Autorização formal e escopo definido','Apenas acesso à internet','Uma ferramenta automatizada','Permissão verbal sem registro'])[a.pos]
  when x.prompt like '%evidência deve acompanhar%' then (array['Passos reproduzíveis, impacto e prova controlada','Somente uma captura sem contexto','Apenas o nome da ferramenta','Uma estimativa sem reprodução'])[a.pos]
  when x.prompt like '%reduz o risco de causar indisponibilidade%' then (array['Respeitar escopo, limites de carga e janela autorizada','Executar carga máxima imediatamente','Ignorar monitoramento','Testar ativos fora do escopo'])[a.pos]
  when x.prompt like '%antes de interpretar os resultados%' then (array['Validar origem, qualidade, tipos e valores ausentes','Escolher as cores finais','Publicar o dashboard','Excluir todo valor divergente'])[a.pos]
  when x.prompt like '%menos sensível a valores extremos%' then (array['Mediana','Média aritmética','Soma','Amplitude total'])[a.pos]
  when x.prompt like '%vazamento de informação%' then (array['Separar treino e validação antes de ajustar transformações','Usar todo o conjunto para calibrar o modelo','Duplicar as linhas de validação','Remover a etapa de teste'])[a.pos]
  when x.prompt like '%reproduzir uma infraestrutura%' then (array['Infraestrutura como código versionada','Alteração manual sem registro','Comandos não documentados','Configuração apenas na interface'])[a.pos]
  when x.prompt like '%bloquear um deployment%' then (array['Testes ou validações obrigatórias com falha','Atualização do README','Limpeza do histórico','Criação de uma tag local'])[a.pos]
  when x.prompt like '%falhas permitidas ao objetivo%' then (array['Error budget','Quantidade de commits','Número de dashboards','Tamanho do backlog'])[a.pos]
  when x.prompt like '%comparação estrita%' then (array['===','==','=','!='])[a.pos]
  when x.prompt like '%dados inválidos cheguem%' then (array['Validar entrada no limite do sistema e novamente no servidor','Confiar apenas no formulário','Ocultar o botão','Salvar antes de validar'])[a.pos]
  when x.prompt like '%unidade isolada%' then (array['Teste unitário','Teste de carga','Teste exploratório manual','Teste de recuperação de desastre'])[a.pos]
  when x.position=1 then (array['Confirmar objetivo, pré-requisitos e ambiente','Ignorar os pré-requisitos','Executar sem registrar alterações','Começar pela etapa final'])[a.pos]
  when x.position=2 then (array['Resultado reproduzível com testes ou registros','Somente afirmar que funcionou','Uma captura sem contexto','Ausência de qualquer evidência'])[a.pos]
  else (array['Comparar o resultado com os critérios de aceite','Encerrar na primeira saída','Excluir logs e testes','Ignorar mensagens de erro'])[a.pos]
 end,
 a.pos=1,a.pos
from public.amex_questions x
join public.amex_quiz_settings q on q.id=x.quiz_id
join public.lessons l on l.id=q.lesson_id
cross join (values(1),(2),(3),(4)) a(pos)
where q.status='published' and l.status='published'
 and not exists(select 1 from public.amex_alternatives z where z.question_id=x.id)
on conflict(question_id,position) do update set text=excluded.text,is_correct=excluded.is_correct;

-- Validação restrita às avaliações publicadas.
do $$ declare incomplete integer;invalid integer;begin
 select count(*) into incomplete
 from public.amex_quiz_settings q
 join public.lessons l on l.id=q.lesson_id
 where q.status='published' and l.status='published'
 and (select count(*) from public.amex_questions x where x.quiz_id=q.id and x.status='published')<3;

 select count(*) into invalid
 from public.amex_questions x
 join public.amex_quiz_settings q on q.id=x.quiz_id
 join public.lessons l on l.id=q.lesson_id
 where q.status='published' and l.status='published' and x.status='published'
 and ((select count(*) from public.amex_alternatives a where a.question_id=x.id)<>4
   or (select count(*) from public.amex_alternatives a where a.question_id=x.id and a.is_correct)<>1);

 if incomplete<>0 or invalid<>0 then
  raise exception 'Reparo incompleto: avaliações com menos de 3 questões %, questões inválidas %',incomplete,invalid;
 end if;
end $$;
commit;
