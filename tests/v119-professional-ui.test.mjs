import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  css = read('src/styles/production-fixes.css'),
  courses = read('src/pages/Courses.jsx'),
  layout = read('src/components/Layout.jsx');
test('curso tem um único índice visual', () => {
  assert.match(css, /\.course-title-line \.course-index/);
  assert.doesNotMatch(css, /\.course-edition::before[\s\S]*content:\s*['\"]0/);
});
test('cards de curso têm superfície e espaçamento', () => {
  assert.match(css, /\.workspace \.course-ledger[\s\S]*gap:\s*14px/);
  assert.match(css, /\.workspace \.course-edition[\s\S]*border-radius:\s*14px/);
});
test('ação abrir curso tem 44px', () =>
  assert.match(css, /\.workspace \.course-disclosure[\s\S]*min-height:\s*44px/));
test('resumo usa uma superfície', () => {
  assert.match(css, /\.workspace \.catalog-summary[\s\S]*background:\s*var\(--panel-1\)/);
  assert.match(css, /catalog-summary dl > div[\s\S]*background:\s*transparent/);
});
test('unidade de carga é separada', () => assert.match(courses, /metric-unit/));
test('online usa estado real do hook', () =>
  assert.match(layout, /online \? 'connection online' : 'connection offline'/));
test('online verde pulsa continuamente', () => {
  assert.match(css, /\.connection\.online::before[\s\S]*animation:\s*amex-online-pulse/);
  assert.match(css, /infinite/);
});
test('movimento reduzido desativa pulso', () =>
  assert.match(css, /prefers-reduced-motion[\s\S]*animation:\s*none/));
test('meta usa escala responsiva controlada', () =>
  assert.match(css, /\.workspace \.goal-summary b[\s\S]*font-size:\s*clamp\(3\.2rem,\s*6vw,\s*5\.8rem\)/));
