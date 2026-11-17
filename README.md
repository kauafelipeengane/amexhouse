# AMEX HOUSE

Plataforma web acadêmica para as formações AMEX Pentest e AMEX Python, com autenticação, catálogo, aulas em vídeo, questionários, progresso, anotações, favoritos, metas e certificado interno.

## Autor

Kauã Felipe Engane

## Disciplina

Análise e Projeto de Sistemas - Ciência da Computação - UNIFRAN

## Tecnologias

- React 19
- Vite 8
- Supabase Auth e PostgreSQL
- YouTube IFrame API
- Vercel (deploy direto, sem dependência de GitHub)

## Execução local

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Qualidade

```bash
npm test
npm run audit
npm run check:production
npm run check:final
npm run build
```

## Segurança

Nunca publique `.env`, service role, tokens, senhas ou chaves privadas. Use somente a chave pública do Supabase no cliente.

## Documentação

Consulte a pasta `docs/` para arquitetura, configuração, testes, implantação e modelo de dados.


### Versionamento local

A linha pública começa em **AMEX HOUSE V1.0.1** (`1.0.1`). Cada melhoria aprovada incrementa a versão seguindo SemVer. O Git é usado localmente para commits e histórico; o deploy pode ser enviado diretamente à Vercel e ao Supabase, sem GitHub.
