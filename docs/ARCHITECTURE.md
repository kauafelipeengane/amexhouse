# Arquitetura

## Camadas

- `src/pages`: composição de páginas e fluxos.
- `src/components`: componentes reutilizáveis.
- `src/hooks`: sessão, navegação e carregamento.
- `src/lib`: regras utilitárias, segurança e preferências.
- `src/services`: acesso ao Supabase e regras de persistência.
- `supabase`: expansão idempotente do banco.
- `tests`: verificações automatizadas do produto.

## Sistemas externos

- Supabase Auth: identidade e sessão.
- Supabase PostgreSQL: persistência e RLS.
- YouTube IFrame API: reprodução de vídeo.
- Vercel: hospedagem e cabeçalhos de segurança.

## Regra de confiança

O cliente valida para UX. O banco, as RPCs e as políticas RLS devem validar segurança e autorização.
