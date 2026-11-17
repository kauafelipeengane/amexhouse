import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  main = read('src/main.jsx'),
  css = read('src/styles/production-fixes.css'),
  e2e = read('e2e/catalog-geometry.spec.js');
test('correções carregam após CSS legado', () => {
  assert.ok(main.indexOf('./styles/production-fixes.css') > main.indexOf('./style.css'));
});
test('catálogo força escrita horizontal', () => {
  assert.match(css, /\.workspace \.course-title-line strong[\s\S]*writing-mode:\s*horizontal-tb/);
  assert.match(css, /word-break:\s*normal/);
});
test('título preserva coluna flexível sem colapso', () =>
  assert.match(css, /\.workspace \.course-title-line[\s\S]*minmax\(0,\s*1fr\)/));
test('número e título usam mesma linha', () =>
  assert.match(css, /\.course-title-line\s*\{[\s\S]*align-items:\s*center/));
test('metas usam grade equilibrada', () =>
  assert.match(css, /\.workspace \.goal-academy\s*\{[\s\S]*grid-template-columns/));
test('store usa duas colunas', () =>
  assert.match(css, /\.separate-shell \.store-hero\s*\{[\s\S]*grid-template-columns/));
test('Playwright mede geometria real', () => {
  for (const x of [
    'boundingBox',
    'título estreito/vertical',
    'número fora da linha do título',
    'writingMode',
  ])
    assert.match(e2e, new RegExp(x));
});
