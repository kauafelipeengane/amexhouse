# Política de Segurança

## Dados que não podem ser publicados

- service role do Supabase
- arquivos `.env` reais
- tokens, senhas e chaves privadas
- dados pessoais de estudantes

## Comunicação responsável

Relate vulnerabilidades diretamente ao responsável pelo projeto. Não publique detalhes exploráveis antes da correção.

## Controles do projeto

- autenticação pelo Supabase Auth
- PKCE no cliente
- filtros por usuário
- RLS no banco
- CSP e cabeçalhos de produção
- validação de UUIDs, URLs e entradas
