# Auditoria final do frontend AMEX HOUSE V1.32.0

## Escopo
Performance adaptativa, acessibilidade WCAG 2.1 AA, responsividade entre 320 px e 1920 px, alinhamento, estados destrutivos, código morto, segurança do cliente e consistência visual.

## Correções aplicadas
- Artes animadas fora da dobra agora exibem posters leves e somente carregam a animação ao se aproximar 180 px do viewport.
- `prefers-reduced-motion` e `navigator.connection.saveData` mantêm posters estáticos.
- O conteúdo prioritário preserva carregamento eager e `fetchPriority=high`; demais artes usam lazy/low.
- `window.confirm` foi removido dos fluxos de quiz e anotações.
- Novo `ConfirmDialog` usa `role=alertdialog`, `aria-modal`, descrição associada, foco inicial, Escape e retorno de foco.
- Diálogo responsivo: duas ações no desktop, uma coluna em telas até 520 px, alvos de 48 px.
- A suíte de regressão foi atualizada para refletir a estratégia adaptativa de mídia.

## Resultados automatizados
- 188 testes unitários e de regressão aprovados, 0 falhas.
- 55 módulos ativos, sem módulos mortos ou sinks proibidos.
- 254 arquivos e 203 textos verificados em imports e destinos.
- 221 arquivos analisados pela auditoria principal.
- Headers, CSP, SPA, ambiente, rotas e limpeza aprovados.

## Limitação do ambiente
O build e a execução do Playwright em navegador não foram concluídos neste ambiente porque a instalação local do Vite terminou incompleta após timeout e a máquina executa Node 24, enquanto o projeto exige Node 22.x. A suíte estrutural e de regressão passou integralmente. Execute `npm ci && npm run build && npm run test:e2e` em Node 22 antes do deploy definitivo.
