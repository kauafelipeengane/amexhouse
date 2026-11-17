import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  lazy = read('src/components/LazyAnimatedArtwork.jsx'),
  notice = read('src/components/NotificationCenter.jsx'),
  portal = read('src/pages/portal.css'),
  align = read('src/styles/alignment.css');
test('arte animada usa o arquivo original', () => {
  assert.match(lazy, /src=\{src\}/);
  assert.doesNotMatch(lazy, /poster\?/);
  assert.doesNotMatch(lazy, /IntersectionObserver/);
});
test('índice do curso é centralizado contra o bloco do título', () => {
  assert.match(align, /\.course-index\s*\{[\s\S]*align-items:\s*center/);
  assert.match(align, /\.course-cover-copy strong\s*\{[\s\S]*min-height:\s*54px/);
});
test('notificação usa sino e não texto visível', () => {
  assert.match(notice, /notification-bell/);
  assert.match(notice, /sr-only/);
  assert.doesNotMatch(notice, />\s*NOTIFICAÇÕES/);
});
test('ferramentas ficam à direita', () => {
  assert.match(portal, /\.portal-tools\s*\{[\s\S]*margin-left:\s*auto/);
  assert.match(portal, /\.notification-trigger/);
});
test('sino é autoral em CSS', () => {
  assert.match(portal, /\.notification-bell-body/);
  assert.match(portal, /amex-bell-ring/);
});
