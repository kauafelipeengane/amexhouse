# Changelog

## 1.33.4 - Hotfix do orçamento CSS de produção

- Move todo o CSS do popup de resultado para uma folha local da funcionalidade.
- Mantém o limite real de 232 KiB do bundle CSS principal, sem afrouxar o orçamento.
- O Vite pode gerar o CSS do popup junto ao chunk de Lesson, reduzindo o CSS inicial.
- Preserva integralmente as animações infinitas e a acessibilidade.

## 1.33.2 - Motion design avançado do resultado

- Adiciona desenho progressivo do check e do X em SVG.
- Nota e barra contam de zero até o valor retornado pelo servidor.
- Entrada sequencial do selo, título, descrição, métrica e ações.
- Adiciona brilho de superfície, órbita de luz, partículas, pulso e microinteração dos botões.
- Mantém fallback integral para `prefers-reduced-motion`.

## 1.33.0 - Feedback animado de avaliação

- Adiciona modal central autoral para resultado aprovado ou reprovado, com fundo escurecido.
- Exibe acertos, total, nota e ação contextual de revisão.
- Animação positiva com partículas e pulso; erro com impacto controlado e sem depender apenas de cor.
- Implementa foco inicial, trap de Tab, Escape, retorno de foco, `aria-live` e bloqueio de scroll.
- Confirma que todos os WebP animados possuem múltiplos frames e loop infinito.

## 1.32.0 - Auditoria final de performance, acessibilidade e responsividade

- Artes animadas fora da dobra carregam primeiro posters leves e só ativam ao se aproximar do viewport.
- `prefers-reduced-motion` e `Save-Data` impedem download de animações não prioritárias.
- Confirmações nativas foram substituídas por `alertdialog` responsivo com foco inicial, Escape e devolução de foco.
- Adiciona regressões automatizadas para performance adaptativa e operações destrutivas acessíveis.

## 1.31.0 - Grants mínimos, índices e código morto

- Revoga TRUNCATE, REFERENCES e TRIGGER de anon/authenticated em todas as tabelas públicas.
- Remove CRUD anônimo de tabelas privadas e administrativas.
- Adiciona índices às foreign keys apontadas pela auditoria aprofundada.
- Remove o hook `useFocusReturn`, comprovadamente sem consumidor.
- Adiciona auditoria automatizada de módulos mortos e sinks perigosos.

## 1.30.0 - Terceira varredura e consolidação de policies

- Remove policies SELECT históricas duplicadas de vídeos, recursos e exercícios.
- Recria uma policy canônica por tabela, limitada a aulas publicadas ou equipe autorizada.
- Revoga grants excessivos e mantém somente SELECT para authenticated nessas tabelas.
- Adiciona auditoria de grants perigosos, FKs sem índice, funções com search_path mutável e registros órfãos.

## 1.29.0 - Segunda varredura de produção

- Adiciona auditoria SQL ampla de RLS, privilégios anônimos, funções, índices e integridade referencial.
- Detecta políticas permissivas duplicadas, tentativas órfãs e quizzes pedagogicamente inconsistentes.
- Detecta funções `SECURITY DEFINER` sem `search_path` fixado.
- Corrige a precedência da mensagem de limite de tentativas no frontend.
- Mantém a migração consolidada V1.28.0 como reparo base do banco.

## 1.28.0 - Varredura de integridade de produção

- Consolida cadastro, metas, quiz, tentativas e progresso em uma migração idempotente.
- Corrige FK de `quiz_attempts` para `amex_quiz_settings`.
- Remove `jsonb_object_length`, incompatível com o banco de produção.
- Padroniza índices únicos exigidos por todos os `ON CONFLICT`.
- Frontend passa a salvar metas por RPC validada no servidor.
- Erros de quiz e meta recebem mensagens seguras, específicas e acionáveis.
- Adiciona diagnóstico de integridade e estrutura inicial de testes pgTAP.

## 1.27.1 - Hotfix do orçamento de produção

- Corrige o limite bruto do CSS para 232 KiB, acima do bundle medido de 222.114 bytes.
- Mantém limite gzip de 45 KiB; o bundle medido foi 40,88 KiB.
- Preserva a verificação de desempenho e impede crescimento descontrolado.
- Adiciona teste de regressão para o orçamento final da Vercel.

## 1.27.0 - Revisao final para divulgacao

- Meta semanal reconstruida sem efeito 3D, coluna vazia ou tipografia sobreposta.
- Progresso semanal recebe hierarquia editorial, indicador circular e fatos alinhados.
- Layout especifico para desktop, tablet, mobile e telas de 420px.
- Varredura final de overflow, largura intrinseca, toque e efeitos hover em dispositivos touch.
- Mantidas todas as correcoes de login, perfil, certificado, numeracao, notificacoes e paginas legais.

## 1.26.0 - Perfil corrigido e documentos legais editoriais

- Remove o elemento decorativo que herdava a regra genérica `.profile > div` e gerava o círculo verde.
- Reescreve o perfil com seletores de maior especificidade, avatar de 132px e layout responsivo.
- Política de Privacidade reescrita em linguagem objetiva, com mapa real de dados e operações.
- Termos de Uso reescritos com foco em regras aplicáveis à plataforma e segurança ofensiva autorizada.
- Layout jurídico passa a utilizar coluna editorial, painel lateral e seções contínuas, sem aparência de cards genéricos.

## 1.25.0 - Perfil, certificado e documentos juridicos

- Estado do certificado reestruturado com progresso, indicadores e requisitos claros.
- Perfil redesenhado com hierarquia, avatar, upload, dados e acoes mais consistentes.
- Central de privacidade do perfil passa a explicar categorias, protecao e exercicio de direitos.
- Politica de Privacidade reescrita em 12 secoes, alinhada a LGPD e operacoes reais da plataforma.
- Termos de Uso reescritos em 13 secoes, incluindo seguranca ofensiva, propriedade intelectual, certificados, suspensao e direitos obrigatorios.
- Paginas legais recebem indice fixo, tabela de bases legais e layout responsivo profissional.

## 1.24.0 - Indices de proximos passos e cursos

- Reposiciona os indices de Proximos passos para dentro de uma coluna de 58px com badge de 44px.
- Remove o contador CSS decorativo legado que repetia `01` em todos os cards de curso.
- Mantem exclusivamente o indice real calculado pelo React para cada curso.
- Refina o bloco Proximos passos com borda, superficie, hover e responsividade consistentes.

## 1.23.0 - Correcao definitiva do percurso e refinamento global

- Corrigido o componente real mostrado na captura: `academy-course-map` da pagina inicial.
- Indices do percurso recebem coluna fixa de 96px, padding interno e tipografia monoespacada.
- Eliminado overflow horizontal na raiz, shell, workspace e sidebar.
- Metricas academicas redesenhadas com grid responsivo e hierarquia consistente.
- Sidebar, paineis e cabecalhos internos receberam acabamento e protecao contra corte.
- Mantidas as correcoes de login, catalogo, notificacoes e build da versao anterior.

## 1.22.0 - Reconstrucao rigorosa de autenticacao e catalogo

- CSS da autenticacao reescrito integralmente, sem regras acumuladas e sem rolagem interna.
- Login com grade responsiva, painel de arte controlado e formulario com largura minima real.
- Remocao do efeito 3D dos cards de curso, origem do recorte visual e da compressao.
- Numeros dos cursos usam coluna `max-content`, fonte monoespacada e largura minima de 2.2ch.
- Cards mobile separados em copia, progresso e acao.
- Notificacoes renderizadas em portal acima de todos os contextos de empilhamento.
- Correcao do conflito de identificador `Progress` e orcamento de build com medicao gzip.

## 1.20.0 - Varredura integral e blindagem de layout

- Corrigido o colapso de largura que empilhava textos verticalmente no catálogo.
- Normalizado o fluxo horizontal de títulos, métricas, metas, certificados e conteúdos salvos.
- Adicionadas proteções responsivas contra overflow e regressões em grids aninhados.
- Executadas auditorias de segurança, produção, repositório e a suíte completa de testes.

# Changelog

## AMEX HOUSE V1.4.1

- RLS e FORCE RLS em vídeos, recursos, exercícios e eventos de segurança
- grants explícitos e default privileges endurecidos
- função pública do quiz exige sessão autenticada
- funções internas de trigger removidas do Data API
- postura de segurança e retenção administrativa
- Security CI com build, npm audit e Gitleaks
- auditoria local de segredos, sinks, RLS e privilégios

# Changelog

## AMEX HOUSE V1.4.0

- início e envio de quiz separados por token de tentativa
- duração real, expiração de duas horas e bloqueio de token reutilizado
- trava transacional por estudante e quiz contra submissões concorrentes
- carregamento completo para edição administrativa
- acessibilidade aprimorada nas notificações e controles de ordem
- RPCs críticas autorizadas e respostas mínimas

# Changelog

## AMEX HOUSE V1.3.1

- editor de alternativas com resposta correta protegida
- submissão de quiz atômica, rate limit, limite de tentativas e histórico real
- schema de vídeos normalizado de forma idempotente
- edição visual, cancelamento e reordenação no painel
- diálogo acessível substitui confirmações nativas
- notificações automáticas para cursos e aulas publicados
- RPCs seguras para pastas pessoais
- versão visual sincronizada
- 253 testes de regressão aprovados

# Changelog

## AMEX HOUSE V1.3.0

### Correção de build
- orçamento de CSS ajustado de 180 KiB para 190 KiB, mantendo limite rígido e compatível com o bundle de 184.833 bytes
- teste de regressão para impedir orçamento ilimitado

- gestão de perguntas, vídeos, recursos e exercícios no painel
- notificações pessoais protegidas por RLS
- pastas e etiquetas pessoais para conteúdos salvos
- diagnóstico de cursos, módulos, aulas e avaliações incompletas
- ordenação administrativa auditada
- IDs do YouTube e URLs HTTPS validados no servidor
- respostas corretas isoladas das políticas de estudantes
- auditoria com estado posterior filtrado

# Changelog

## AMEX HOUSE V1.2.0

- painel administrativo com dashboard, paginação, busca e estados responsivos
- gestão de cursos, módulos, aulas e configurações de avaliações
- administração segura de papéis, com proteção do último administrador
- emissão, consulta e revogação de certificados pelo painel
- métricas acadêmicas agregadas e auditoria administrativa
- RPCs protegidas, listas limitadas a 25 registros e e-mail mascarado para instrutores
- arquivamento lógico de conteúdo publicado

# Changelog

## AMEX HOUSE V1.0.1

### Segurança e banco
- migração consolidada com pré-validação de tabelas e colunas
- remoção de todas as políticas RLS antigas nas tabelas pessoais
- quatro políticas de proprietário recriadas por tabela
- nova RPC `amex_save_video_progress`, autorizada por `auth.uid()`
- aprovação de quiz removida completamente do fluxo de vídeo
- RPC legada com `quiz_passed` revogada
- metas antigas preservadas e copiadas para Pentest e Python
- chave primária antiga de `study_goals(user_id)` migrada para `(user_id, academy)` antes da cópia
- duplicidades removidas antes da criação dos índices únicos

### Performance e manutenção
- oito GIFs convertidos para WebP animado
- ativos animados reduzidos de aproximadamente 40 MB para 17 MB
- validador de identificador não utilizado removido
- arquivo de identificação não armazena hash de commit desatualizável

### Validação
- testes de regressão, build, CSP, arquivos sensíveis e orçamento de ativos

## AMEX HOUSE V1 - 1.0.0

### Corrigido
- integridade de progresso e aprovação de quiz delegada ao banco
- metas separadas por formação
- certificado considera somente avaliações obrigatórias publicadas
- avisos para falhas parciais de dados
- histórico de atividades mesclado sem duplicações
- IDs de rotas alinhados a UUID
- tons semânticos nas mensagens de autenticação

### Alterado
- cliente Supabase instalado como dependência local
- versionamento reiniciado em AMEX HOUSE V1
- fluxo documentado para deploy direto sem GitHub
## 1.33.1 - Hotfix do popup geral

- Renderiza o feedback no `document.body` com React Portal, fora de containers com overflow, transform ou stacking context.
- Remove o estado paralelo que podia divergir do resultado retornado pela RPC.
- O modal passa a abrir diretamente quando o resultado vigente possui `ok: true`.
- O fechamento é persistido no próprio objeto de resultado, evitando reabertura acidental.
