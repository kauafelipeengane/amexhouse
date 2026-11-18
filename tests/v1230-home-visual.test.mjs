import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('../src/styles/rigorous-rebuild.css',import.meta.url),'utf8');
test('percurso inicial reserva largura real aos indices',()=>{
  assert.match(css,/\.academy-course-map article \{[\s\S]*grid-template-columns: 96px minmax\(0, 1fr\) 72px/);
  assert.match(css,/\.academy-course-map article > span \{[\s\S]*min-width: 96px/);
  assert.match(css,/font-variant-numeric: tabular-nums lining-nums/);
});
test('pagina impede overflow horizontal e refina metricas',()=>{
  assert.match(css,/html, body, #root \{[\s\S]*overflow-x: clip/);
  assert.match(css,/\.academy-home-metrics \{[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/);
});
