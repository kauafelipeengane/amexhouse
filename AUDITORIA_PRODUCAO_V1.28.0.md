# Auditoria de produção AMEX HOUSE V1.28.0

## Defeitos críticos encontrados e reparados

1. `handle_new_user()` tentava criar `study_goals` sem `academy` e usava `ON CONFLICT (user_id)` sem unicidade compatível.
2. `quiz_attempts.quiz_id` apontava para a tabela legada `quizzes`, enquanto o fluxo ativo usa `amex_quiz_settings`.
3. `amex_submit_quiz()` chamava `jsonb_object_length(jsonb)`, inexistente no PostgreSQL do projeto.
4. `lesson_progress` e `quiz_attempts` dependiam de UPSERT/numeração sem índices únicos versionados no repositório.
5. Políticas antigas e novas de `study_goals` coexistiam, criando regras permissivas duplicadas.
6. O frontend salvava metas diretamente na tabela, duplicando regra de negócio e permitindo valores fora dos três presets.
7. Erros do backend eram substituídos por uma única mensagem genérica, ocultando sessão expirada, migração ausente e referência inconsistente.
8. A versão visível e o release de telemetria permaneciam em `1.19.0` apesar do pacote estar em `1.27.1`.
9. O repositório não continha uma migração ativa consolidada correspondente aos reparos feitos manualmente em produção.
10. Não havia teste pgTAP versionado para provar a presença das funções e índices críticos.

## Alterações

- Migração transacional `04_PRODUCTION_INTEGRITY_V1_28_0.sql`.
- Diagnóstico somente leitura `05_PRODUCTION_DIAGNOSTICS_V1_28_0.sql`.
- Teste pgTAP de integridade.
- Metas migradas para `amex_save_study_goal` com `auth.uid()` e allowlist.
- Quiz mantém o gabarito no banco e preserva progresso anterior.
- Mensagens operacionais específicas sem expor SQL ou detalhes internos.

## Limites da auditoria

A auditoria do código não substitui a execução dos Advisors e Logs no projeto Supabase real. Após aplicar a migração, execute Security Advisor, Performance Advisor e Health Advisor e corrija qualquer finding remanescente conforme o modelo de acesso pretendido.
