import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('../src/styles/rigorous-rebuild.css',import.meta.url),'utf8');
const home=readFileSync(new URL('../src/pages/Home.jsx',import.meta.url),'utf8');
const courses=readFileSync(new URL('../src/pages/Courses.jsx',import.meta.url),'utf8');
test('proximos passos reserva coluna interna ao numero',()=>{
  assert.match(css,/\.next-steps > button \{[\s\S]*grid-template-columns: 58px minmax\(0, 1fr\) 32px/);
  assert.match(css,/\.next-steps > button > span:first-child \{[\s\S]*width: 44px/);
  assert.match(home,/String\(index \+ 1\)\.padStart\(2, '0'\)/);
});
test('contador decorativo repetido foi desativado',()=>{
  assert.match(css,/\.course-ledger article::after,[\s\S]*content: none/);
  assert.match(courses,/className="course-index"/);
});
