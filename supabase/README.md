# Banco AMEX HOUSE

A base atual já passou na auditoria com zero linhas. Não execute novamente os reparos.

- `active/`: correções finais usadas para recuperação de uma base V1.8 incompleta.
- `audits/`: consultas somente de diagnóstico.
- `archive/`: histórico. Não execute em produção sem backup e revisão.

Ordem de recuperação: `01_AVALIACOES_TECNICAS_V1_8_3.sql`, `02_REPARO_AVALIACOES_V1_8_4.sql` e a auditoria final.
