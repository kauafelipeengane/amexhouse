# Banco de dados AMEX HOUSE

## Produção V1.29.0

Antes de publicar o frontend, execute no SQL Editor do Supabase, nesta ordem:

1. `active/06_FULL_AUDIT_V1_29_0.sql` — auditoria ampla, somente leitura.
2. `active/05_PRODUCTION_DIAGNOSTICS_V1_28_0.sql` — diagnóstico pedagógico e de duplicidades.
3. `active/04_PRODUCTION_INTEGRITY_V1_28_0.sql` — migração transacional e idempotente.
4. Execute novamente os dois diagnósticos e confirme ausência de achados críticos.

Os arquivos `archive/` são históricos. **Não execute novamente** esses arquivos em produção. Os arquivos `active/01`, `02` e `03` permanecem como conteúdo/Storage já implantado.

## Validação recomendada

Com Supabase CLI e ambiente local:

```bash
supabase start
supabase test db
```

O teste `tests/database/integrity_test.sql` valida tabelas, funções e índices necessários aos fluxos de cadastro, metas e avaliações.
