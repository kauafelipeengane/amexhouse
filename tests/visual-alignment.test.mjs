import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  css = read('src/styles/alignment.css'),
  tokens = read('src/styles/tokens.css'),
  style = read('src/style.css'),
  portal = read('src/pages/portal.css');
const rules = [
  ['grade de métricas', /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(150px,\s*1fr\)\)/],
  ['centralização', /place-items:\s*center/],
  ['texto central', /text-align:\s*center/],
  ['números tabulares', /font-variant-numeric:\s*tabular-nums lining-nums/],
  ['altura uniforme', /--metric-min-height/],
  ['conteúdo centralizado', /margin-inline:\s*auto/],
  ['mobile duas colunas', /repeat\(2,\s*minmax\(0,\s*1fr\)\)/],
  ['mobile estreito uma coluna', /@media\s*\(max-width:\s*380px\)/],
  ['fatos em grid', /progress-course-facts/],
  ['tabelas numéricas', /td\[data-number\]/],
];
for (const [name, regex] of rules) test(name, () => assert.match(css, regex));
test('tokens de espaçamento', () => assert.match(tokens, /--space-7:\s*48px/));
test('tokens de raio', () => assert.match(tokens, /--radius-lg:\s*14px/));
test('tokens de sombra', () => assert.match(tokens, /--shadow-panel/));
test('imports alinhamento', () => assert.match(style, /alignment\.css/));
test('sem important', () => assert.doesNotMatch(style + css + portal, /!important/));
for (const name of ['pentest', 'python', 'javascript', 'data', 'devops', 'store'])
  test(`poster ${name} leve`, () =>
    assert.ok(statSync(new URL(`src/assets/posters/${name}.webp`, root)).size < 180000));
test('banner usa fonte animada direta', () => assert.match(read('src/components/LazyAnimatedArtwork.jsx'), /src=\{src\}/));
test('banner não troca animação por poster', () =>
  assert.doesNotMatch(read('src/components/LazyAnimatedArtwork.jsx'), /poster/));
