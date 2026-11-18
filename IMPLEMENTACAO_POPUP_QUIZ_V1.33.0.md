# AMEX HOUSE V1.33.0 — popup animado de avaliação

## Implementado
- Modal central após a RPC concluir a correção.
- Fundo escurecido e desfocado.
- Estado aprovado: verde, check, pulso e partículas.
- Estado de revisão: coral, X e impacto lateral controlado.
- Acertos, total e nota recebidos do servidor.
- Ações Continuar, Entendi e Revisar respostas.
- Acessibilidade: dialog modal, live assertive, trap de foco, Escape, retorno de foco e reduced motion.

## WebP animados
Todos os sete assets animados foram verificados com webpmux. Logos possuem 167 frames; banners possuem 48 frames; todos possuem loop infinito. O comando `npm run audit:animation` mantém essa validação reproduzível.

## Referências de UX
A direção combina feedback explícito de answer states, apresentação da correção e ação seguinte clara, alinhada a padrões observados em Duolingo, HubSpot, Mobbin e galerias de Quiz Result Modal do Dribbble. A implementação visual e as animações são autorais e não copiam assets de terceiros.
