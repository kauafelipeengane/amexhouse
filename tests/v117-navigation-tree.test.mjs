import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  tree = read('src/components/navigation/AcademyNavigationTree.jsx'),
  css = read('src/components/navigation/navigation-tree.css'),
  layout = read('src/components/Layout.jsx'),
  app = read('src/App.jsx');
test('árvore é React sem innerHTML', () => {
  assert.match(tree, /export function AcademyNavigationTree/);
  assert.doesNotMatch(tree, /innerHTML|customElements\.define/);
});
test('dados reais de cursos módulos e aulas', () => {
  for (const value of ['data?.courses', 'data?.modules', 'data?.lessons'])
    assert.match(tree, new RegExp(value.replace(/[?.]/g, '\\$&')));
});
test('busca normaliza acentos', () => {
  assert.match(tree, /normalize\('NFD'\)/);
  assert.match(tree, /Filtrar cursos, módulos e aulas/);
});
test('atalho barra e teclado completo', () => {
  for (const value of [
    "event.key === '/'",
    'ArrowDown',
    'ArrowUp',
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
  ])
    assert.match(tree, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
test('sem dependências de demonstração', () =>
  assert.doesNotMatch(tree, /gsap|Draggable|tweakpane|esm\.sh|unpkg/));
test('acessibilidade tree', () => {
  for (const value of [
    'role="tree"',
    'role="treeitem"',
    'role="group"',
    'aria-current',
    'aria-expanded',
    'aria-level',
  ])
    assert.match(tree, new RegExp(value));
});
test('layout integrado', () => assert.match(layout, /AcademyNavigationTree/));
test('app fornece dados e abertura de aula', () => {
  assert.match(app, /data=\{scoped\}/);
  assert.match(app, /openLesson=\{openLesson\}/);
});
test('animação respeita reduced motion', () => assert.match(css, /prefers-reduced-motion/));
test('painel tem rolagem interna', () => assert.match(css, /overflow:\s*auto/));
