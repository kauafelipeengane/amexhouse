# Deploy direto sem GitHub

## Ordem obrigatória

1. Faça backup do banco no Supabase.
2. Execute `supabase/AMEX_HOUSE_V1_0_1.sql` no SQL Editor.
3. Confirme que o script terminou sem erro.
4. Teste com duas contas diferentes para validar o isolamento por RLS.
5. Execute localmente:

```bash
npm ci
npm test
npm run build
```

6. Envie a pasta `dist/` diretamente para a Vercel ou use a Vercel CLI:

```bash
npx vercel login
npx vercel --prod
```

7. Na Vercel, configure somente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

Nunca envie `.env`, `.env.local`, service role, senha do banco ou token da Vercel dentro do ZIP.

## Versionamento

- Produto: AMEX HOUSE V1.0.1
- Versão atual: `1.0.1`
- Correção: `1.0.1`
- Melhoria compatível: `1.1.0`
- Mudança incompatível: `2.0.0`

O Git é usado apenas localmente. O projeto não depende de GitHub.
