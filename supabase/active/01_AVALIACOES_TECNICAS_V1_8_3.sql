-- AMEX HOUSE V1.8.3
-- Sem tabela temporária, permanente, view ou função auxiliar.
-- Cada operação usa CTE própria e funciona em uma única execução no Supabase SQL Editor.
begin;
select pg_advisory_xact_lock(hashtext('amex_house_v182_avaliacoes'));

-- Remove alternativas das perguntas mecânicas nas academias abrangidas.
delete from public.amex_alternatives a
using public.amex_questions q,public.amex_quiz_settings s,public.lessons l,public.course_modules m,public.courses c
where a.question_id=q.id and q.quiz_id=s.id and s.lesson_id=l.id and l.module_id=m.id and m.course_id=c.id
 and (c.slug like 'javascript%' or c.slug like 'typescript%' or c.slug like 'react%' or c.slug like 'node%' or c.slug like '%web-moderno%' or c.slug like '%bancos-javascript%' or c.slug like '%testes-javascript%' or c.slug like '%fullstack%' or c.slug like '%javascript-projeto%' or c.slug like '%dados%' or c.slug like 'sql%' or c.slug like 'postgresql%' or c.slug like '%python-analise%' or c.slug like '%visualizacao%' or c.slug like '%estatistica%' or c.slug like '%engenharia-dados%' or c.slug like '%analytics%' or c.slug like '%devops%' or c.slug like '%linux%' or c.slug like '%git%' or c.slug like '%ci-cd%' or c.slug like '%docker%' or c.slug like '%containers%' or c.slug like '%cloud%' or c.slug like '%infraestrutura%' or c.slug like '%kubernetes%' or c.slug like '%sre%') and (q.prompt like 'Qual é o foco principal abordado em %' or q.prompt like 'Qual prática demonstra melhor domínio do conteúdo %' or q.prompt like 'Antes de concluir %, qual verificação deve ser realizada?');

-- Remove somente as perguntas mecânicas antigas.
delete from public.amex_questions q
using public.amex_quiz_settings s,public.lessons l,public.course_modules m,public.courses c
where q.quiz_id=s.id and s.lesson_id=l.id and l.module_id=m.id and m.course_id=c.id
 and (c.slug like 'javascript%' or c.slug like 'typescript%' or c.slug like 'react%' or c.slug like 'node%' or c.slug like '%web-moderno%' or c.slug like '%bancos-javascript%' or c.slug like '%testes-javascript%' or c.slug like '%fullstack%' or c.slug like '%javascript-projeto%' or c.slug like '%dados%' or c.slug like 'sql%' or c.slug like 'postgresql%' or c.slug like '%python-analise%' or c.slug like '%visualizacao%' or c.slug like '%estatistica%' or c.slug like '%engenharia-dados%' or c.slug like '%analytics%' or c.slug like '%devops%' or c.slug like '%linux%' or c.slug like '%git%' or c.slug like '%ci-cd%' or c.slug like '%docker%' or c.slug like '%containers%' or c.slug like '%cloud%' or c.slug like '%infraestrutura%' or c.slug like '%kubernetes%' or c.slug like '%sre%') and (q.prompt like 'Qual é o foco principal abordado em %' or q.prompt like 'Qual prática demonstra melhor domínio do conteúdo %' or q.prompt like 'Antes de concluir %, qual verificação deve ser realizada?');

-- Insere três perguntas técnicas por avaliação.
with base(pattern,qpos,prompt,explanation,options) as (values
('javascript%',1,'Qual declaração cria uma variável com escopo de bloco e permite reatribuição?','let possui escopo de bloco e permite reatribuição.','["let","const","var global","function"]'),
('javascript%',2,'Qual operador compara valor e tipo sem coerção em JavaScript?','O operador === realiza comparação estrita.','["===","==","=","!="]'),
('javascript%',3,'Qual método transforma cada item de um array e devolve um novo array?','map executa a função para cada item e devolve um novo array.','["map","forEach","find","some"]'),
('typescript%',1,'Qual recurso do TypeScript descreve a estrutura esperada de um objeto?','Uma interface define contratos estruturais.','["interface","namespace","enum numérico","decorator"]'),
('typescript%',2,'Qual tipo representa um valor ainda desconhecido sem liberar operações inseguras?','unknown exige refinamento antes do uso.','["unknown","any","never","void"]'),
('typescript%',3,'Qual mecanismo reduz um union type após uma verificação em tempo de execução?','Type narrowing refina o tipo conforme as verificações.','["type narrowing","type erasure","hoisting","tree shaking"]'),
('react%',1,'Qual hook armazena estado local em um componente funcional?','useState registra estado local e sua função de atualização.','["useState","useMemo","useRef","useId"]'),
('react%',2,'Quando um efeito sincroniza com um sistema externo, onde deve ficar a limpeza?','A função retornada por useEffect executa a limpeza.','["Na função retornada por useEffect","No corpo do componente após o return","Dentro de useMemo","No arquivo CSS"]'),
('react%',3,'Qual propriedade fornece identidade estável aos itens renderizados com map?','key permite ao React reconciliar a lista de forma previsível.','["key","name","index global","aria-label"]'),
('node%',1,'Qual objeto do Express representa a resposta HTTP enviada ao cliente?','res expõe status, headers e corpo da resposta.','["res","req","next","app.locals"]'),
('node%',2,'Qual código HTTP representa criação bem-sucedida de um recurso?','201 Created indica que o recurso foi criado.','["201","200","204","304"]'),
('node%',3,'Qual prática impede que segredos sejam versionados com o código?','Segredos devem ficar em variáveis de ambiente e fora do repositório.','["Variáveis de ambiente e .env ignorado","Constantes no bundle","Comentários no código","LocalStorage público"]'),
('sql%',1,'Qual cláusula filtra grupos depois de GROUP BY?','HAVING filtra resultados agregados.','["HAVING","WHERE","ORDER BY","LIMIT"]'),
('sql%',2,'Qual JOIN mantém todas as linhas da tabela à esquerda?','LEFT JOIN preserva as linhas da origem esquerda.','["LEFT JOIN","INNER JOIN","CROSS JOIN","NATURAL JOIN"]'),
('sql%',3,'Qual construção garante atomicidade entre várias alterações?','Uma transação com BEGIN e COMMIT trata o conjunto como uma unidade.','["BEGIN e COMMIT","SELECT DISTINCT","CREATE VIEW","ANALYZE"]'),
('postgresql%',1,'Qual índice é a escolha padrão para igualdade e ordenação em PostgreSQL?','B-tree atende igualdade, intervalos e ordenação.','["B-tree","GIN apenas","BRIN apenas","Hash distribuído"]'),
('postgresql%',2,'Qual comando mostra o plano de execução de uma consulta?','EXPLAIN apresenta o plano escolhido pelo otimizador.','["EXPLAIN","DESCRIBE","SHOW PLAN CACHE","TRACE"]'),
('postgresql%',3,'Qual restrição garante que uma coluna não aceite valores nulos?','NOT NULL impede a gravação de NULL.','["NOT NULL","UNIQUE","CHECK TRUE","DEFAULT"]'),
('%dados%',1,'Qual medida é menos sensível a valores extremos?','A mediana é mais robusta a outliers que a média.','["Mediana","Média aritmética","Amplitude total","Soma"]'),
('%dados%',2,'Qual etapa deve ocorrer antes de interpretar um conjunto de dados?','A qualidade, origem e tipos precisam ser verificados antes da análise.','["Validar qualidade, origem e tipos","Escolher cores do gráfico","Publicar o dashboard","Excluir valores divergentes sem análise"]'),
('%dados%',3,'Qual gráfico é apropriado para observar uma série ao longo do tempo?','O gráfico de linhas evidencia a evolução temporal.','["Gráfico de linhas","Gráfico de pizza","Nuvem de palavras","Treemap sem eixo temporal"]'),
('%docker%',1,'Qual arquivo descreve as etapas de construção de uma imagem Docker?','Dockerfile contém as instruções usadas no build.','["Dockerfile","compose.lock","package.json","kubeconfig"]'),
('%docker%',2,'Qual recurso mantém dados além do ciclo de vida do container?','Volumes persistem dados fora da camada gravável do container.','["Volume","Tag","Label","Healthcheck"]'),
('%docker%',3,'Qual comando cria uma imagem a partir de um Dockerfile?','docker build processa o contexto e as instruções do Dockerfile.','["docker build","docker pull","docker inspect","docker logs"]'),
('%kubernetes%',1,'Qual objeto mantém a quantidade desejada de réplicas de uma aplicação stateless?','Deployment gerencia ReplicaSets e atualizações declarativas.','["Deployment","ConfigMap","Secret","IngressClass"]'),
('%kubernetes%',2,'Qual comando lista os pods do namespace atual?','kubectl get pods consulta os pods visíveis no namespace.','["kubectl get pods","kubectl build pods","docker ps pods","helm inspect nodes"]'),
('%kubernetes%',3,'Qual probe determina se o container deve receber tráfego?','readinessProbe controla a prontidão para receber requisições.','["readinessProbe","livenessProbe","startup command","resource limit"]'),
('%linux%',1,'Qual comando altera permissões de arquivos no Linux?','chmod modifica os bits de permissão.','["chmod","chown","grep","ps"]'),
('%linux%',2,'Qual arquivo costuma definir variáveis de ambiente para um serviço systemd?','EnvironmentFile pode carregar variáveis no unit file.','["EnvironmentFile referenciado pela unit","/etc/passwd","/proc/cpuinfo","known_hosts"]'),
('%linux%',3,'Qual comando acompanha as últimas linhas de um log em tempo real?','tail -f continua acompanhando o crescimento do arquivo.','["tail -f","head -n 1","cat -b","wc -l"]'),
('%sre%',1,'Qual indicador mede a parcela de requisições bem-sucedidas?','Um SLI de sucesso compara eventos válidos com o total.','["Taxa de sucesso","Número de commits","Quantidade de dashboards","Tamanho do backlog"]'),
('%sre%',2,'O que um error budget representa?','É a margem de falha permitida pelo SLO em uma janela.','["A margem de indisponibilidade permitida pelo SLO","O custo mensal da nuvem","A quantidade de alertas","O número de desenvolvedores"]'),
('%sre%',3,'Qual alerta tende a ser mais acionável?','Alertas baseados em impacto e burn rate se relacionam ao consumo do SLO.','["Alerta de burn rate do SLO","Alerta para todo log informativo","Alerta sem responsável","Alerta sem janela temporal"]'),
('%ci-cd%',1,'Qual etapa deve bloquear a publicação quando os testes falham?','O pipeline deve encerrar antes do deploy se a validação falhar.','["A etapa de validação anterior ao deploy","A limpeza de cache posterior","A documentação opcional","O anúncio de release"]'),
('%ci-cd%',2,'Onde credenciais de deploy devem ser armazenadas?','Secrets do provedor evitam expor credenciais no repositório.','["No cofre de secrets do provedor","No arquivo versionado","No código do workflow","Em comentário no README"]'),
('%ci-cd%',3,'Qual estratégia reduz risco ao liberar uma nova versão gradualmente?','Canary direciona uma parcela do tráfego à nova versão.','["Canary release","Big bang sem rollback","Deploy manual sem histórico","Alteração direta no servidor"]')
), base_typed as (select pattern,qpos,prompt,explanation,options::jsonb options from base), aliases(pattern,source) as (values
('%web-moderno%','javascript%'),('%bancos-javascript%','sql%'),('%testes-javascript%','javascript%'),('%fullstack%','node%'),('%javascript-projeto%','javascript%'),
('%python-analise%','%dados%'),('%visualizacao%','%dados%'),('%estatistica%','%dados%'),('%engenharia-dados%','sql%'),('%analytics%','%dados%'),('%dados-projeto%','%dados%'),
('%devops-fundamentos%','%ci-cd%'),('%git%','%ci-cd%'),('%cloud%','%sre%'),('%infraestrutura%','%linux%'),('%devops-projeto%','%sre%')
), bank as (
 select * from base_typed
 union all
 select a.pattern,b.qpos,b.prompt,b.explanation,b.options from aliases a join base_typed b on b.pattern=a.source
)
insert into public.amex_questions(quiz_id,prompt,explanation,position,status)
select s.id,b.prompt,b.explanation,b.qpos,'published'
from public.amex_quiz_settings s
join public.lessons l on l.id=s.lesson_id
join public.course_modules m on m.id=l.module_id
join public.courses c on c.id=m.course_id
join lateral(select * from bank b where c.slug like b.pattern order by length(b.pattern) desc,b.qpos limit 3) b on true
where l.status='published'
on conflict(quiz_id,position) do update set prompt=excluded.prompt,explanation=excluded.explanation,status='published',updated_at=now();

-- Insere quatro alternativas e exatamente uma correta por questão.
with base(pattern,qpos,prompt,explanation,options) as (values
('javascript%',1,'Qual declaração cria uma variável com escopo de bloco e permite reatribuição?','let possui escopo de bloco e permite reatribuição.','["let","const","var global","function"]'),
('javascript%',2,'Qual operador compara valor e tipo sem coerção em JavaScript?','O operador === realiza comparação estrita.','["===","==","=","!="]'),
('javascript%',3,'Qual método transforma cada item de um array e devolve um novo array?','map executa a função para cada item e devolve um novo array.','["map","forEach","find","some"]'),
('typescript%',1,'Qual recurso do TypeScript descreve a estrutura esperada de um objeto?','Uma interface define contratos estruturais.','["interface","namespace","enum numérico","decorator"]'),
('typescript%',2,'Qual tipo representa um valor ainda desconhecido sem liberar operações inseguras?','unknown exige refinamento antes do uso.','["unknown","any","never","void"]'),
('typescript%',3,'Qual mecanismo reduz um union type após uma verificação em tempo de execução?','Type narrowing refina o tipo conforme as verificações.','["type narrowing","type erasure","hoisting","tree shaking"]'),
('react%',1,'Qual hook armazena estado local em um componente funcional?','useState registra estado local e sua função de atualização.','["useState","useMemo","useRef","useId"]'),
('react%',2,'Quando um efeito sincroniza com um sistema externo, onde deve ficar a limpeza?','A função retornada por useEffect executa a limpeza.','["Na função retornada por useEffect","No corpo do componente após o return","Dentro de useMemo","No arquivo CSS"]'),
('react%',3,'Qual propriedade fornece identidade estável aos itens renderizados com map?','key permite ao React reconciliar a lista de forma previsível.','["key","name","index global","aria-label"]'),
('node%',1,'Qual objeto do Express representa a resposta HTTP enviada ao cliente?','res expõe status, headers e corpo da resposta.','["res","req","next","app.locals"]'),
('node%',2,'Qual código HTTP representa criação bem-sucedida de um recurso?','201 Created indica que o recurso foi criado.','["201","200","204","304"]'),
('node%',3,'Qual prática impede que segredos sejam versionados com o código?','Segredos devem ficar em variáveis de ambiente e fora do repositório.','["Variáveis de ambiente e .env ignorado","Constantes no bundle","Comentários no código","LocalStorage público"]'),
('sql%',1,'Qual cláusula filtra grupos depois de GROUP BY?','HAVING filtra resultados agregados.','["HAVING","WHERE","ORDER BY","LIMIT"]'),
('sql%',2,'Qual JOIN mantém todas as linhas da tabela à esquerda?','LEFT JOIN preserva as linhas da origem esquerda.','["LEFT JOIN","INNER JOIN","CROSS JOIN","NATURAL JOIN"]'),
('sql%',3,'Qual construção garante atomicidade entre várias alterações?','Uma transação com BEGIN e COMMIT trata o conjunto como uma unidade.','["BEGIN e COMMIT","SELECT DISTINCT","CREATE VIEW","ANALYZE"]'),
('postgresql%',1,'Qual índice é a escolha padrão para igualdade e ordenação em PostgreSQL?','B-tree atende igualdade, intervalos e ordenação.','["B-tree","GIN apenas","BRIN apenas","Hash distribuído"]'),
('postgresql%',2,'Qual comando mostra o plano de execução de uma consulta?','EXPLAIN apresenta o plano escolhido pelo otimizador.','["EXPLAIN","DESCRIBE","SHOW PLAN CACHE","TRACE"]'),
('postgresql%',3,'Qual restrição garante que uma coluna não aceite valores nulos?','NOT NULL impede a gravação de NULL.','["NOT NULL","UNIQUE","CHECK TRUE","DEFAULT"]'),
('%dados%',1,'Qual medida é menos sensível a valores extremos?','A mediana é mais robusta a outliers que a média.','["Mediana","Média aritmética","Amplitude total","Soma"]'),
('%dados%',2,'Qual etapa deve ocorrer antes de interpretar um conjunto de dados?','A qualidade, origem e tipos precisam ser verificados antes da análise.','["Validar qualidade, origem e tipos","Escolher cores do gráfico","Publicar o dashboard","Excluir valores divergentes sem análise"]'),
('%dados%',3,'Qual gráfico é apropriado para observar uma série ao longo do tempo?','O gráfico de linhas evidencia a evolução temporal.','["Gráfico de linhas","Gráfico de pizza","Nuvem de palavras","Treemap sem eixo temporal"]'),
('%docker%',1,'Qual arquivo descreve as etapas de construção de uma imagem Docker?','Dockerfile contém as instruções usadas no build.','["Dockerfile","compose.lock","package.json","kubeconfig"]'),
('%docker%',2,'Qual recurso mantém dados além do ciclo de vida do container?','Volumes persistem dados fora da camada gravável do container.','["Volume","Tag","Label","Healthcheck"]'),
('%docker%',3,'Qual comando cria uma imagem a partir de um Dockerfile?','docker build processa o contexto e as instruções do Dockerfile.','["docker build","docker pull","docker inspect","docker logs"]'),
('%kubernetes%',1,'Qual objeto mantém a quantidade desejada de réplicas de uma aplicação stateless?','Deployment gerencia ReplicaSets e atualizações declarativas.','["Deployment","ConfigMap","Secret","IngressClass"]'),
('%kubernetes%',2,'Qual comando lista os pods do namespace atual?','kubectl get pods consulta os pods visíveis no namespace.','["kubectl get pods","kubectl build pods","docker ps pods","helm inspect nodes"]'),
('%kubernetes%',3,'Qual probe determina se o container deve receber tráfego?','readinessProbe controla a prontidão para receber requisições.','["readinessProbe","livenessProbe","startup command","resource limit"]'),
('%linux%',1,'Qual comando altera permissões de arquivos no Linux?','chmod modifica os bits de permissão.','["chmod","chown","grep","ps"]'),
('%linux%',2,'Qual arquivo costuma definir variáveis de ambiente para um serviço systemd?','EnvironmentFile pode carregar variáveis no unit file.','["EnvironmentFile referenciado pela unit","/etc/passwd","/proc/cpuinfo","known_hosts"]'),
('%linux%',3,'Qual comando acompanha as últimas linhas de um log em tempo real?','tail -f continua acompanhando o crescimento do arquivo.','["tail -f","head -n 1","cat -b","wc -l"]'),
('%sre%',1,'Qual indicador mede a parcela de requisições bem-sucedidas?','Um SLI de sucesso compara eventos válidos com o total.','["Taxa de sucesso","Número de commits","Quantidade de dashboards","Tamanho do backlog"]'),
('%sre%',2,'O que um error budget representa?','É a margem de falha permitida pelo SLO em uma janela.','["A margem de indisponibilidade permitida pelo SLO","O custo mensal da nuvem","A quantidade de alertas","O número de desenvolvedores"]'),
('%sre%',3,'Qual alerta tende a ser mais acionável?','Alertas baseados em impacto e burn rate se relacionam ao consumo do SLO.','["Alerta de burn rate do SLO","Alerta para todo log informativo","Alerta sem responsável","Alerta sem janela temporal"]'),
('%ci-cd%',1,'Qual etapa deve bloquear a publicação quando os testes falham?','O pipeline deve encerrar antes do deploy se a validação falhar.','["A etapa de validação anterior ao deploy","A limpeza de cache posterior","A documentação opcional","O anúncio de release"]'),
('%ci-cd%',2,'Onde credenciais de deploy devem ser armazenadas?','Secrets do provedor evitam expor credenciais no repositório.','["No cofre de secrets do provedor","No arquivo versionado","No código do workflow","Em comentário no README"]'),
('%ci-cd%',3,'Qual estratégia reduz risco ao liberar uma nova versão gradualmente?','Canary direciona uma parcela do tráfego à nova versão.','["Canary release","Big bang sem rollback","Deploy manual sem histórico","Alteração direta no servidor"]')
), base_typed as (select pattern,qpos,prompt,explanation,options::jsonb options from base), aliases(pattern,source) as (values
('%web-moderno%','javascript%'),('%bancos-javascript%','sql%'),('%testes-javascript%','javascript%'),('%fullstack%','node%'),('%javascript-projeto%','javascript%'),
('%python-analise%','%dados%'),('%visualizacao%','%dados%'),('%estatistica%','%dados%'),('%engenharia-dados%','sql%'),('%analytics%','%dados%'),('%dados-projeto%','%dados%'),
('%devops-fundamentos%','%ci-cd%'),('%git%','%ci-cd%'),('%cloud%','%sre%'),('%infraestrutura%','%linux%'),('%devops-projeto%','%sre%')
), bank as (
 select * from base_typed
 union all
 select a.pattern,b.qpos,b.prompt,b.explanation,b.options from aliases a join base_typed b on b.pattern=a.source
)
insert into public.amex_alternatives(question_id,text,is_correct,position)
select q.id,opt.value,opt.ordinality=1,opt.ordinality
from public.amex_questions q
join public.amex_quiz_settings s on s.id=q.quiz_id
join public.lessons l on l.id=s.lesson_id
join public.course_modules m on m.id=l.module_id
join public.courses c on c.id=m.course_id
join lateral(select * from bank b where c.slug like b.pattern and b.qpos=q.position order by length(b.pattern) desc limit 1) b on true
cross join lateral jsonb_array_elements_text(b.options::jsonb) with ordinality opt(value,ordinality)
where l.status='published'
on conflict(question_id,position) do update set text=excluded.text,is_correct=excluded.is_correct;

-- Validação final, sem depender de relação auxiliar.
do $$ declare generic_count int;bad_count int;begin
 select count(*) into generic_count
 from public.amex_questions q
 join public.amex_quiz_settings s on s.id=q.quiz_id
 join public.lessons l on l.id=s.lesson_id
 join public.course_modules m on m.id=l.module_id
 join public.courses c on c.id=m.course_id
 where (c.slug like 'javascript%' or c.slug like 'typescript%' or c.slug like 'react%' or c.slug like 'node%' or c.slug like '%web-moderno%' or c.slug like '%bancos-javascript%' or c.slug like '%testes-javascript%' or c.slug like '%fullstack%' or c.slug like '%javascript-projeto%' or c.slug like '%dados%' or c.slug like 'sql%' or c.slug like 'postgresql%' or c.slug like '%python-analise%' or c.slug like '%visualizacao%' or c.slug like '%estatistica%' or c.slug like '%engenharia-dados%' or c.slug like '%analytics%' or c.slug like '%devops%' or c.slug like '%linux%' or c.slug like '%git%' or c.slug like '%ci-cd%' or c.slug like '%docker%' or c.slug like '%containers%' or c.slug like '%cloud%' or c.slug like '%infraestrutura%' or c.slug like '%kubernetes%' or c.slug like '%sre%') and (q.prompt like 'Qual é o foco principal abordado em %' or q.prompt like 'Qual prática demonstra melhor domínio do conteúdo %' or q.prompt like 'Antes de concluir %, qual verificação deve ser realizada?');

 select count(*) into bad_count
 from public.amex_questions q
 join public.amex_quiz_settings s on s.id=q.quiz_id
 join public.lessons l on l.id=s.lesson_id
 join public.course_modules m on m.id=l.module_id
 join public.courses c on c.id=m.course_id
 where q.status='published' and (c.slug like 'javascript%' or c.slug like 'typescript%' or c.slug like 'react%' or c.slug like 'node%' or c.slug like '%web-moderno%' or c.slug like '%bancos-javascript%' or c.slug like '%testes-javascript%' or c.slug like '%fullstack%' or c.slug like '%javascript-projeto%' or c.slug like '%dados%' or c.slug like 'sql%' or c.slug like 'postgresql%' or c.slug like '%python-analise%' or c.slug like '%visualizacao%' or c.slug like '%estatistica%' or c.slug like '%engenharia-dados%' or c.slug like '%analytics%' or c.slug like '%devops%' or c.slug like '%linux%' or c.slug like '%git%' or c.slug like '%ci-cd%' or c.slug like '%docker%' or c.slug like '%containers%' or c.slug like '%cloud%' or c.slug like '%infraestrutura%' or c.slug like '%kubernetes%' or c.slug like '%sre%')
 and ((select count(*) from public.amex_alternatives a where a.question_id=q.id)<>4
   or (select count(*) from public.amex_alternatives a where a.question_id=q.id and a.is_correct)<>1);

 if generic_count<>0 or bad_count<>0 then
  raise exception 'Auditoria editorial falhou: perguntas genéricas %, questões inválidas %',generic_count,bad_count;
 end if;
end $$;
commit;
