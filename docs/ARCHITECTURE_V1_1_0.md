# AMEX HOUSE V1.1.0

## Estrutura e responsabilidades
- `src/admin`: painel administrativo, autorização e formulários.
- `src/pages/VerifyCertificate.jsx`: validação pública e limitada de certificados.
- `supabase/AMEX_HOUSE_V1_1_0.sql`: papéis, RLS, auditoria, tentativas e certificados.
- `tests/v110-features.test.mjs`: regressões de autorização e segurança.

## Fluxos
1. Estudante entra, consome conteúdo, mantém progresso, notas, metas e avaliações.
2. Instrutor acessa `#/admin`, administra conteúdo permitido e consulta tentativas.
3. Administrador possui as permissões de instrutor, emite/revoga certificados e gerencia papéis pelo banco.
4. Público valida códigos em `#/verify/CODIGO` sem receber `user_id`, e-mail ou dados internos.

## Direção visual
O painel preserva a linguagem editorial escura da AMEX, verde-limão de ação, contraste forte, grid responsivo, foco nativo e estados de carregamento, sucesso, vazio e acesso negado.

## Segurança
- O front-end nunca decide a autorização final.
- Papéis são lidos por RPC e todas as mutações críticas usam funções `security definer` com `search_path` fixo e checagem de `auth.uid()`.
- RLS forçada protege dados acadêmicos.
- Auditoria registra ator, ação, entidade, data e detalhes mínimos.
- Certificados públicos não revelam UUID nem e-mail.
- Formulários têm limites no cliente e validação novamente no PostgreSQL.

## Checklist de deploy
1. Backup do Supabase.
2. Aplicar primeiro V1.0.1 e depois `AMEX_HOUSE_V1_1_0.sql`.
3. Confirmar o papel admin em `user_roles`.
4. Testar estudante, instrutor e admin em contas separadas.
5. Rodar `npm ci`, `npm test`, `npm run build`.
6. Publicar na Vercel com apenas as variáveis públicas do Supabase.
