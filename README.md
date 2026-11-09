# AMEX HOUSE Supabase Deploy v17

Frontend conectado diretamente ao Supabase Auth e PostgreSQL. Usa apenas variáveis da Vercel.

## Vercel
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Build
```bash
npm install
npm run build
```

## Banco
O banco precisa possuir as tabelas e políticas RLS já instaladas. Cadastre cursos publicados, módulos, aulas e vídeos para aparecerem na academia.
