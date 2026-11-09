-- AMEX PYTHON - EXPANSAO 01
-- 8 cursos, 40 modulos, 40 aulas, recursos e exercicios. Idempotente.
-- Execute uma vez no SQL Editor do Supabase.
begin;

create table if not exists public.lesson_resources (
  id uuid primary key,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  url text not null check (url ~ '^https://'),
  resource_type text not null check (resource_type in ('official_docs','video','article','repository')),
  position integer not null default 1 check (position > 0),
  created_at timestamptz not null default now(),
  unique (lesson_id, url)
);
create table if not exists public.lesson_exercises (
  id uuid primary key,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  instructions text not null check (char_length(instructions) between 20 and 6000),
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  acceptance_criteria jsonb not null default '[]'::jsonb check (jsonb_typeof(acceptance_criteria)='array'),
  position integer not null default 1 check (position > 0),
  created_at timestamptz not null default now(),
  unique (lesson_id, title)
);

alter table public.lesson_resources enable row level security;
alter table public.lesson_exercises enable row level security;
drop policy if exists "published lesson resources readable" on public.lesson_resources;
create policy "published lesson resources readable" on public.lesson_resources for select to authenticated using (exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published'));
drop policy if exists "published lesson exercises readable" on public.lesson_exercises;
create policy "published lesson exercises readable" on public.lesson_exercises for select to authenticated using (exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published'));

do $$
declare
  v_level text;
begin
  select c.level::text into v_level
  from public.courses c
  where c.slug = 'python-do-basico-ao-avancado' and c.level is not null
  limit 1;

  if v_level is null then
    select c.level::text into v_level
    from public.courses c
    where c.level is not null
    order by c.created_at
    limit 1;
  end if;

  if v_level is null then
    raise exception 'Nenhum valor de level aceito foi encontrado em public.courses. Nenhuma alteração foi aplicada.';
  end if;

  insert into public.courses(id,slug,title,description,level,workload_hours,status)
  select
    ('00000000-0000-4000-8000-'||substr(md5('course:'||seed.slug),1,12))::uuid,
    seed.slug,seed.title,seed.description,v_level,seed.hours,'published'
  from (values
    ('python-fundamentos','Python Fundamentos Profissionais','Ambiente, sintaxe, tipos, controle de fluxo e resolução de problemas.',30),
    ('python-colecoes-funcoes','Coleções, Funções e Organização','Estruturas de dados, funções, módulos, erros e arquivos.',30),
    ('python-orientacao-objetos','Python Orientado a Objetos','Modelagem, composição, herança, protocolos e design orientado a objetos.',32),
    ('python-testes-qualidade','Testes e Qualidade de Código','Pytest, mocks, cobertura, tipagem, lint e refatoração.',30),
    ('python-apis-bancos','APIs e Bancos de Dados com Python','HTTP, FastAPI, PostgreSQL, migrações e autenticação.',36),
    ('python-async-performance','Concorrência e Performance','Asyncio, filas, paralelismo, profiling, cache e resiliência.',28),
    ('python-devops-producao','Python em Produção','Empacotamento, Docker, CI/CD, observabilidade e segurança.',30),
    ('python-projeto-senior','Projeto Profissional Python','Arquitetura, entrega incremental, revisão e operação de um serviço real.',36)
  ) as seed(slug,title,description,hours)
  on conflict(slug) do update set
    title=excluded.title,
    description=excluded.description,
    workload_hours=excluded.workload_hours,
    status='published';
end $$;

with course_seed(slug,course_position) as (values
 ('python-fundamentos',1),('python-colecoes-funcoes',2),('python-orientacao-objetos',3),('python-testes-qualidade',4),('python-apis-bancos',5),('python-async-performance',6),('python-devops-producao',7),('python-projeto-senior',8)
), module_names(course_position,module_position,title) as (values
 (1,1,'Ambiente profissional e terminal'),(1,2,'Tipos, valores e expressões'),(1,3,'Decisões e repetição'),(1,4,'Strings e entrada de dados'),(1,5,'Projeto: utilitário de terminal'),
 (2,1,'Listas, tuplas, conjuntos e dicionários'),(2,2,'Funções e contratos'),(2,3,'Módulos, pacotes e escopo'),(2,4,'Erros, arquivos, JSON e CSV'),(2,5,'Projeto: controle de despesas'),
 (3,1,'Classes, objetos e invariantes'),(3,2,'Composição e encapsulamento'),(3,3,'Herança, polimorfismo e protocolos'),(3,4,'Dataclasses e modelagem'),(3,5,'Projeto: sistema de estoque'),
 (4,1,'Testes unitários com pytest'),(4,2,'Fixtures, mocks e testes parametrizados'),(4,3,'Cobertura e testes de integração'),(4,4,'Type hints, lint e formatação'),(4,5,'Projeto: pacote Python confiável'),
 (5,1,'HTTP, REST e contratos de API'),(5,2,'FastAPI e validação'),(5,3,'PostgreSQL, ORM e migrações'),(5,4,'Autenticação, autorização e segurança'),(5,5,'Projeto: API operacional'),
 (6,1,'Asyncio e modelo assíncrono'),(6,2,'Filas, tarefas e concorrência'),(6,3,'Processos e paralelismo'),(6,4,'Profiling, cache e otimização'),(6,5,'Projeto: pipeline assíncrono'),
 (7,1,'Pyproject, dependências e distribuição'),(7,2,'Docker e ambientes reproduzíveis'),(7,3,'CI/CD e qualidade automatizada'),(7,4,'Logs, métricas e tracing'),(7,5,'Segurança e operação em produção'),
 (8,1,'Arquitetura e decisões técnicas'),(8,2,'Domínio, camadas e persistência'),(8,3,'Entrega incremental e revisão de código'),(8,4,'Observabilidade, incidentes e evolução'),(8,5,'Projeto final e defesa técnica')
), rows as (
 select ('00000000-0000-4000-8000-'||substr(md5('module:'||c.slug||':'||m.module_position),1,12))::uuid id,c.id course_id,m.title,m.module_position position,c.slug,m.course_position
 from course_seed s join public.courses c on c.slug=s.slug join module_names m on m.course_position=s.course_position
)
insert into public.course_modules(id,course_id,title,position)
select id,course_id,title,position from rows
on conflict(id) do update set title=excluded.title,position=excluded.position,course_id=excluded.course_id;

with definitions(course_slug,module_position,title,summary,difficulty) as (values
 ('python-fundamentos',1,'Prepare um ambiente Python reproduzível','Instale Python, configure editor, terminal, ambiente virtual e execute programas com entendimento do fluxo.','beginner'),
 ('python-fundamentos',2,'Domine tipos, operadores e conversões','Modele valores com tipos adequados, valide conversões e reconheça erros comuns.','beginner'),
 ('python-fundamentos',3,'Controle decisões e repetições','Use condicionais, loops, range, break, continue e match com clareza.','beginner'),
 ('python-fundamentos',4,'Trabalhe com texto e dados de entrada','Normalize strings, formate saídas e valide entradas sem confiar no usuário.','beginner'),
 ('python-fundamentos',5,'Construa um utilitário de terminal','Integre fundamentos em uma aplicação de linha de comando pequena e testável.','beginner'),
 ('python-colecoes-funcoes',1,'Escolha a coleção correta','Compare listas, tuplas, conjuntos e dicionários por semântica e custo.','beginner'),
 ('python-colecoes-funcoes',2,'Escreva funções coesas','Defina contratos, parâmetros, retornos e evite efeitos colaterais desnecessários.','beginner'),
 ('python-colecoes-funcoes',3,'Organize código em módulos e pacotes','Separe responsabilidades, imports e pontos de entrada.','beginner'),
 ('python-colecoes-funcoes',4,'Persista dados e trate falhas','Leia e escreva arquivos, JSON e CSV com context managers e erros públicos seguros.','intermediate'),
 ('python-colecoes-funcoes',5,'Projeto de controle de despesas','Crie CRUD em arquivos com validação, relatórios e testes básicos.','intermediate'),
 ('python-orientacao-objetos',1,'Modele classes com invariantes','Transforme regras de negócio em objetos válidos desde a construção.','intermediate'),
 ('python-orientacao-objetos',2,'Prefira composição consciente','Encapsule estado e combine objetos sem acoplamento excessivo.','intermediate'),
 ('python-orientacao-objetos',3,'Use polimorfismo e protocolos','Projete interfaces pequenas e substituíveis sem hierarquias frágeis.','intermediate'),
 ('python-orientacao-objetos',4,'Aplique dataclasses na modelagem','Reduza código repetitivo mantendo validação e semântica.','intermediate'),
 ('python-orientacao-objetos',5,'Projeto de estoque orientado a objetos','Modele produtos, movimentações e regras de saldo com testes.','intermediate'),
 ('python-testes-qualidade',1,'Teste comportamento com pytest','Escreva testes rápidos, legíveis e independentes.','intermediate'),
 ('python-testes-qualidade',2,'Domine fixtures, mocks e parametrização','Isole dependências e cubra variações sem duplicação.','intermediate'),
 ('python-testes-qualidade',3,'Crie testes de integração confiáveis','Teste fronteiras reais com banco temporário e limpeza determinística.','advanced'),
 ('python-testes-qualidade',4,'Aplique tipagem e análise estática','Use annotations, protocolos, lint e formatação como ferramentas de feedback.','advanced'),
 ('python-testes-qualidade',5,'Publique um pacote confiável','Estruture biblioteca, documentação de API, testes e versionamento.','advanced'),
 ('python-apis-bancos',1,'Projete contratos HTTP e REST','Modele recursos, status, paginação, erros e idempotência.','advanced'),
 ('python-apis-bancos',2,'Construa APIs com FastAPI','Implemente rotas, schemas, dependências e documentação OpenAPI.','advanced'),
 ('python-apis-bancos',3,'Persista com PostgreSQL e migrações','Modele dados, transações, índices e evolução de schema.','advanced'),
 ('python-apis-bancos',4,'Implemente autenticação e autorização','Proteja identidade, permissões, segredos e ações sensíveis no servidor.','advanced'),
 ('python-apis-bancos',5,'Entregue uma API operacional','Integre API, banco, testes, autenticação e documentação.','advanced'),
 ('python-async-performance',1,'Entenda asyncio de verdade','Use corrotinas, tasks, cancelamento e timeouts sem bloquear o event loop.','advanced'),
 ('python-async-performance',2,'Coordene filas e tarefas','Implemente produtores, consumidores, backpressure e encerramento seguro.','advanced'),
 ('python-async-performance',3,'Escolha threads ou processos','Compare I/O bound e CPU bound e meça antes de otimizar.','advanced'),
 ('python-async-performance',4,'Meça e otimize gargalos','Use profiling, cache e limites com evidência.','advanced'),
 ('python-async-performance',5,'Projeto de pipeline assíncrono','Construa processamento concorrente com retries, métricas e idempotência.','advanced'),
 ('python-devops-producao',1,'Empacote aplicações modernas','Use pyproject, lock de dependências e builds reproduzíveis.','advanced'),
 ('python-devops-producao',2,'Containerize com Docker','Crie imagens mínimas, sem root e com configuração externa.','advanced'),
 ('python-devops-producao',3,'Automatize CI e entrega','Execute testes, lint, build e verificações de segurança.','advanced'),
 ('python-devops-producao',4,'Observe sistemas Python','Adote logs estruturados, métricas, tracing e correlação.','advanced'),
 ('python-devops-producao',5,'Opere com segurança','Aplique least privilege, rate limiting, health checks e resposta a falhas.','advanced'),
 ('python-projeto-senior',1,'Registre decisões de arquitetura','Compare alternativas e documente consequências técnicas e de negócio.','advanced'),
 ('python-projeto-senior',2,'Separe domínio e infraestrutura','Implemente camadas com dependências direcionadas e testes.','advanced'),
 ('python-projeto-senior',3,'Entregue e revise incrementos','Trabalhe com branches curtas, pull requests e revisão objetiva.','advanced'),
 ('python-projeto-senior',4,'Investigue incidentes e evolua','Use telemetria, post-mortem sem culpa e melhoria contínua.','advanced'),
 ('python-projeto-senior',5,'Defenda o projeto profissional','Apresente arquitetura, riscos, métricas, testes e plano de evolução.','advanced')
), rows as (
 select ('00000000-0000-4000-8000-'||substr(md5('lesson:'||d.course_slug||':'||d.module_position),1,12))::uuid id,m.id module_id,d.title,d.summary,d.difficulty,d.module_position
 from definitions d join public.courses c on c.slug=d.course_slug join public.course_modules m on m.course_id=c.id and m.position=d.module_position
)
insert into public.lessons(id,module_id,title,summary,position,workload_hours,objectives,status)
select id,module_id,title,summary,1,6,jsonb_build_array('Compreender os conceitos','Aplicar em código executável','Validar a solução com testes','Explicar decisões e limitações'),'published' from rows
on conflict(id) do update set title=excluded.title,summary=excluded.summary,workload_hours=excluded.workload_hours,objectives=excluded.objectives,status='published';

-- Libera fontes que ja estejam vinculadas a aulas Python antigas.
-- Nenhum video de Pentest ou de outra formacao e removido.
with candidate_ids(youtube_id) as (values
 ('JR0wo66XlhM'),('dpIdtin0zD0'),('vosGfm_D0Hc'),('75xui4-Roc8'),('7fdnDdBiW2M'),
 ('2grWEP96zgs'),('akcckPyDYaM'),('yM4PY5Ni8jE'),('jGASrwG9br8'),('GNqttKsaFZA'),
 ('Yrd70EHi_Zo'),('UA4OSVMOKX4'),('OhYnHhkw3E8'),('JgfYn9vCo7k'),('2evVrAotw10'),
 ('dtd-WHxAtUk'),('KnAxlOZl4-I'),('rUaR-65pevo'),('d9UxTvEF-yA'),('ImhYlISeWPQ'),
 ('f6bkf67lXLo'),('JFJErxis_ZM'),('bi6kzV21ucs'),('I7IrmN7jMqE'),('bm7_rA7NOB4'),
 ('wGZzEoO7e9s'),('6ErWbtr8Cqk'),('VtUspH9n6-o'),('eynaelPPwI4'),('8cczMbmlBEY'),
 ('faf7jhti5tg'),('n4EBcc1Mafo'),('pZxOSOHmDtg'),('SDwocgA_Siw'),('BQsv_BkoBCU'),
 ('Mim6nnkdOto'),('IeyO3TnHcaw'),('oQswZbBxDvw'),('YlEh4I2QU7g'),('FW-mYXr2M8w')
), conflicting_python_videos as (
 select distinct lv.lesson_id
 from public.lesson_videos lv
 join candidate_ids candidate on candidate.youtube_id=lv.youtube_id or candidate.youtube_id=lv.alternative_youtube_id
 join public.lessons l on l.id=lv.lesson_id
 join public.course_modules m on m.id=l.module_id
 join public.courses c on c.id=m.course_id
 where c.slug='python-do-basico-ao-avancado' or c.slug like 'python-%'
)
delete from public.lesson_videos lv
using conflicting_python_videos conflict
where lv.lesson_id=conflict.lesson_id;

-- Se uma fonte candidata pertencer a uma formacao nao Python, interrompe sem tocar nela.
do $$
declare v_conflicts text;
begin
 select string_agg(distinct lv.youtube_id, ', ' order by lv.youtube_id) into v_conflicts
 from public.lesson_videos lv
 join public.lessons l on l.id=lv.lesson_id
 join public.course_modules m on m.id=l.module_id
 join public.courses c on c.id=m.course_id
 where (lv.youtube_id in ('JR0wo66XlhM','dpIdtin0zD0','vosGfm_D0Hc','75xui4-Roc8','7fdnDdBiW2M','2grWEP96zgs','akcckPyDYaM','yM4PY5Ni8jE','jGASrwG9br8','GNqttKsaFZA','Yrd70EHi_Zo','UA4OSVMOKX4','OhYnHhkw3E8','JgfYn9vCo7k','2evVrAotw10','dtd-WHxAtUk','KnAxlOZl4-I','rUaR-65pevo','d9UxTvEF-yA','ImhYlISeWPQ','f6bkf67lXLo','JFJErxis_ZM','bi6kzV21ucs','I7IrmN7jMqE','bm7_rA7NOB4','wGZzEoO7e9s','6ErWbtr8Cqk','VtUspH9n6-o','eynaelPPwI4','8cczMbmlBEY','faf7jhti5tg','n4EBcc1Mafo','pZxOSOHmDtg','SDwocgA_Siw','BQsv_BkoBCU','Mim6nnkdOto','IeyO3TnHcaw','oQswZbBxDvw','YlEh4I2QU7g','FW-mYXr2M8w')
    or lv.alternative_youtube_id in ('JR0wo66XlhM','dpIdtin0zD0','vosGfm_D0Hc','75xui4-Roc8','7fdnDdBiW2M','2grWEP96zgs','akcckPyDYaM','yM4PY5Ni8jE','jGASrwG9br8','GNqttKsaFZA','Yrd70EHi_Zo','UA4OSVMOKX4','OhYnHhkw3E8','JgfYn9vCo7k','2evVrAotw10','dtd-WHxAtUk','KnAxlOZl4-I','rUaR-65pevo','d9UxTvEF-yA','ImhYlISeWPQ','f6bkf67lXLo','JFJErxis_ZM','bi6kzV21ucs','I7IrmN7jMqE','bm7_rA7NOB4','wGZzEoO7e9s','6ErWbtr8Cqk','VtUspH9n6-o','eynaelPPwI4','8cczMbmlBEY','faf7jhti5tg','n4EBcc1Mafo','pZxOSOHmDtg','SDwocgA_Siw','BQsv_BkoBCU','Mim6nnkdOto','IeyO3TnHcaw','oQswZbBxDvw','YlEh4I2QU7g','FW-mYXr2M8w'))
   and not (c.slug='python-do-basico-ao-avancado' or c.slug like 'python-%');
 if v_conflicts is not null then
  raise exception 'Fontes de video reservadas por outra formacao: %. Nenhum registro foi alterado.',v_conflicts;
 end if;
end $$;

with videos(course_slug,module_position,youtube_id,title,channel) as (values
 ('python-fundamentos',1,'JR0wo66XlhM','Videoaula complementar do módulo','Code Academy BR'),
 ('python-fundamentos',2,'dpIdtin0zD0','Videoaula complementar do módulo','Code Academy BR'),
 ('python-fundamentos',3,'vosGfm_D0Hc','Videoaula complementar do módulo','Code Academy BR'),
 ('python-fundamentos',4,'75xui4-Roc8','Videoaula complementar do módulo','Code Academy BR'),
 ('python-fundamentos',5,'7fdnDdBiW2M','Videoaula complementar do módulo','Code Academy BR'),
 ('python-colecoes-funcoes',1,'2grWEP96zgs','Videoaula complementar do módulo','Code Academy BR'),
 ('python-colecoes-funcoes',2,'akcckPyDYaM','Videoaula complementar do módulo','Code Academy BR'),
 ('python-colecoes-funcoes',3,'yM4PY5Ni8jE','Videoaula complementar do módulo','Code Academy BR'),
 ('python-colecoes-funcoes',4,'jGASrwG9br8','Videoaula complementar do módulo','Code Academy BR'),
 ('python-colecoes-funcoes',5,'GNqttKsaFZA','Videoaula complementar do módulo','Code Academy BR'),
 ('python-orientacao-objetos',1,'Yrd70EHi_Zo','Videoaula complementar do módulo','Code Academy BR'),
 ('python-orientacao-objetos',2,'UA4OSVMOKX4','Videoaula complementar do módulo','Code Academy BR'),
 ('python-orientacao-objetos',3,'OhYnHhkw3E8','Videoaula complementar do módulo','Code Academy BR'),
 ('python-orientacao-objetos',4,'JgfYn9vCo7k','Videoaula complementar do módulo','Code Academy BR'),
 ('python-orientacao-objetos',5,'2evVrAotw10','Videoaula complementar do módulo','Code Academy BR'),
 ('python-testes-qualidade',1,'dtd-WHxAtUk','Videoaula complementar do módulo','Code Academy BR'),
 ('python-testes-qualidade',2,'KnAxlOZl4-I','Videoaula complementar do módulo','Code Academy BR'),
 ('python-testes-qualidade',3,'rUaR-65pevo','Videoaula complementar do módulo','Code Academy BR'),
 ('python-testes-qualidade',4,'d9UxTvEF-yA','Videoaula complementar do módulo','Code Academy BR'),
 ('python-testes-qualidade',5,'ImhYlISeWPQ','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-apis-bancos',1,'f6bkf67lXLo','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-apis-bancos',2,'JFJErxis_ZM','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-apis-bancos',3,'bi6kzV21ucs','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-apis-bancos',4,'I7IrmN7jMqE','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-apis-bancos',5,'bm7_rA7NOB4','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-async-performance',1,'wGZzEoO7e9s','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-async-performance',2,'6ErWbtr8Cqk','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-async-performance',3,'VtUspH9n6-o','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-async-performance',4,'eynaelPPwI4','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-async-performance',5,'8cczMbmlBEY','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-devops-producao',1,'faf7jhti5tg','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-devops-producao',2,'n4EBcc1Mafo','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-devops-producao',3,'pZxOSOHmDtg','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-devops-producao',4,'SDwocgA_Siw','Videoaula complementar do módulo','Eduardo Mendes'),
 ('python-devops-producao',5,'BQsv_BkoBCU','Videoaula complementar do módulo','Curso em Vídeo'),
 ('python-projeto-senior',1,'Mim6nnkdOto','Videoaula complementar do módulo','Curso em Vídeo'),
 ('python-projeto-senior',2,'IeyO3TnHcaw','Videoaula complementar do módulo','Otávio Miranda'),
 ('python-projeto-senior',3,'oQswZbBxDvw','Videoaula complementar do módulo','Conteúdo Python em português'),
 ('python-projeto-senior',4,'YlEh4I2QU7g','Videoaula complementar do módulo','Conteúdo Python em português'),
 ('python-projeto-senior',5,'FW-mYXr2M8w','Videoaula complementar do módulo','Conteúdo Python em português')
), rows as (
 select l.id lesson_id,v.youtube_id,v.title||' · '||m.title title,v.channel,true allowed
 from videos v
 join public.courses c on c.slug=v.course_slug
 join public.course_modules m on m.course_id=c.id and m.position=v.module_position
 join public.lessons l on l.module_id=m.id and l.position=1
)
insert into public.lesson_videos(lesson_id,youtube_id,title,channel,is_embed_allowed,reviewed_at)
select lesson_id,youtube_id,title,channel,allowed,now() from rows
on conflict(lesson_id) do update set youtube_id=excluded.youtube_id,title=excluded.title,channel=excluded.channel,is_embed_allowed=excluded.is_embed_allowed,reviewed_at=excluded.reviewed_at;

with refs(course_slug,module_position,title,url,resource_type,position) as (values
 ('python-fundamentos',1,'Tutorial oficial do Python','https://docs.python.org/3/tutorial/','official_docs',1),
 ('python-testes-qualidade',4,'Referência oficial de typing','https://docs.python.org/3/library/typing.html','official_docs',1),
 ('python-async-performance',1,'Referência oficial de asyncio','https://docs.python.org/3/library/asyncio.html','official_docs',1),
 ('python-devops-producao',1,'Python Packaging User Guide','https://packaging.python.org/','official_docs',1),
 ('python-apis-bancos',2,'Tutorial oficial do FastAPI','https://fastapi.tiangolo.com/tutorial/','official_docs',1)
), rows as (
 select ('00000000-0000-4000-8000-'||substr(md5('resource:'||r.course_slug||':'||r.module_position||':'||r.url),1,12))::uuid id,l.id lesson_id,r.title,r.url,r.resource_type,r.position from refs r join public.courses c on c.slug=r.course_slug join public.course_modules m on m.course_id=c.id and m.position=r.module_position join public.lessons l on l.module_id=m.id and l.position=1
)
insert into public.lesson_resources(id,lesson_id,title,url,resource_type,position) select * from rows on conflict(lesson_id,url) do update set title=excluded.title,resource_type=excluded.resource_type,position=excluded.position;

insert into public.lesson_exercises(id,lesson_id,title,instructions,difficulty,acceptance_criteria,position)
select ('00000000-0000-4000-8000-'||substr(md5('exercise:'||l.id::text),1,12))::uuid,l.id,'Entrega prática: '||l.title,'Implemente uma solução própria para o tema da aula. Inclua validação de entradas, tratamento de erros, testes automatizados e uma explicação curta das decisões técnicas.',case when c.slug in ('python-fundamentos','python-colecoes-funcoes') then 'beginner' when c.slug in ('python-orientacao-objetos','python-testes-qualidade') then 'intermediate' else 'advanced' end,jsonb_build_array('Código executável','Entradas validadas','Erros tratados','Testes automatizados','Decisões documentadas'),1
from public.lessons l join public.course_modules m on m.id=l.module_id join public.courses c on c.id=m.course_id
where c.slug like 'python-%'
on conflict(lesson_id,title) do update set instructions=excluded.instructions,difficulty=excluded.difficulty,acceptance_criteria=excluded.acceptance_criteria;


do $$
declare
 v_lessons integer;
 v_videos integer;
begin
 select count(*) into v_lessons
 from public.lessons l join public.course_modules m on m.id=l.module_id join public.courses c on c.id=m.course_id
 where c.slug in ('python-fundamentos','python-colecoes-funcoes','python-orientacao-objetos','python-testes-qualidade','python-apis-bancos','python-async-performance','python-devops-producao','python-projeto-senior');
 select count(distinct v.lesson_id) into v_videos
 from public.lesson_videos v join public.lessons l on l.id=v.lesson_id join public.course_modules m on m.id=l.module_id join public.courses c on c.id=m.course_id
 where c.slug in ('python-fundamentos','python-colecoes-funcoes','python-orientacao-objetos','python-testes-qualidade','python-apis-bancos','python-async-performance','python-devops-producao','python-projeto-senior');
 if v_lessons <> 40 or v_videos <> v_lessons then
  raise exception 'Validação de vídeos falhou: % aulas e % vídeos. A transação foi revertida.',v_lessons,v_videos;
 end if;
end $$;

commit;

select c.slug,c.title,count(distinct m.id) modules,count(distinct l.id) lessons,sum(distinct c.workload_hours) course_hours,count(distinct v.lesson_id) videos,count(distinct e.id) exercises
from public.courses c left join public.course_modules m on m.course_id=c.id left join public.lessons l on l.module_id=m.id left join public.lesson_videos v on v.lesson_id=l.id left join public.lesson_exercises e on e.lesson_id=l.id
where c.slug like 'python-%' group by c.id,c.slug,c.title order by c.slug;
