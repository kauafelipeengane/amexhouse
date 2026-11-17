# Auditoria visual com Playwright

## Escopo
- Chromium em desktop 1440 x 900, mobile 390 x 844 e tablet 834 x 1194.
- Revisão geométrica adicional em 1920 x 1080.
- Fluxos públicos: login, cadastro, recuperação, privacidade, termos e validação de certificado.
- Verificações: overflow horizontal, elementos fora da viewport, largura uniforme de controles, alvos de toque de 44 px, teclado, WCAG A/AA com axe e regressão por screenshot.

## Baselines
Gere os baselines em Linux/CI e revise cada PNG antes de versionar:

```bash
npx playwright install --with-deps chromium
npm run test:visual:update
npm run test:e2e
```

Baselines devem ser criados e comparados no mesmo sistema operacional para evitar diferenças de fontes e antialiasing.

## Rotas autenticadas
Os testes públicos são determinísticos e não usam credenciais reais. Para testar portal, aulas, avaliações e administração, configure uma base de homologação isolada, usuários descartáveis e `E2E_BASE_URL`. Nunca coloque credenciais em arquivos versionados.

## Critérios de aprovação
- zero overflow horizontal;
- zero elemento interativo fora da viewport;
- alvos de toque com pelo menos 44 x 44 px;
- diferença visual máxima de 0,2% dos pixels;
- zero violação axe `critical` ou `serious`;
- métricas centralizadas com desvio máximo de 3 px;
- artefatos de falha: screenshot, vídeo e trace.
