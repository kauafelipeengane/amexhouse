# AMEX HOUSE V1.22.0 - revisão rigorosa

## Problemas tratados

1. Login comprimido, com rolagem interna e conteúdo sobreposto.
2. Índices 01, 02 e 03 cortados ou deformados nos cards de cursos.
3. Botão de curso sobreposto ao conteúdo no mobile.
4. Notificações abaixo de outros elementos.
5. Conflito de build entre página Progress e componente Progress.
6. Orçamento de CSS incompatível com o tamanho transferido por gzip.

## Decisões

- `auth.css` foi reescrito integralmente. Nenhuma regra incremental da versão anterior foi reaproveitada.
- O efeito 3D Aceternity foi removido somente do catálogo de cursos porque criava transformação, perspectiva e novo contexto de recorte.
- Os índices usam fonte monoespaçada, largura intrínseca `max-content`, mínimo de `2.2ch`, espaçamento zero e sem transformações.
- Notificações usam React Portal no `document.body`.

## Validação

- 166 testes automatizados aprovados.
- Auditoria de código, segurança, produção e revisão final aprovadas.
- ZIP sem `.env`, `.env.local`, `node_modules`, `dist` ou credenciais.
