# Configuração local

## Requisitos

- Node.js 22.x
- npm 10 ou superior
- projeto Supabase configurado

## Variáveis

Copie `.env.example` para `.env.local` e substitua apenas os valores públicos.

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_exemplo
```

## Comandos

```bash
npm ci
npm run dev
npm test
npm run build
```
