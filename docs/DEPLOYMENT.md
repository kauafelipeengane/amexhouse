# Implantação

## Vercel

1. Importe o repositório.
2. Configure as duas variáveis públicas do Supabase.
3. Use `npm ci --include=dev --no-audit --no-fund`.
4. Use `npm run build`.
5. Publique `dist/`.

## Validações obrigatórias

- HTTPS ativo
- fallback SPA
- CSP carregada
- nenhum `.env` no artefato
- login, logout e recuperação testados
- RLS verificada com duas contas distintas
