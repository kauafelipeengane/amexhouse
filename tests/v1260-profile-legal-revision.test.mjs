import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const profile=readFileSync(new URL('../src/components/Profile.jsx',import.meta.url),'utf8');
const legal=readFileSync(new URL('../src/pages/Legal.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/rigorous-rebuild.css',import.meta.url),'utf8');
test('perfil nao possui div decorativa sujeita a regra generica',()=>{
  assert.doesNotMatch(profile,/profile-hero-accent/);
  assert.match(css,/\.profile\.profile-hero > \.profile-avatar/);
  assert.match(css,/min-width: 132px/);
});
test('documentos legais usam layout editorial e conteudo especifico',()=>{
  assert.match(legal,/legal-layout/); assert.match(legal,/legal-sidebar/);
  assert.match(legal,/Venda de dados/); assert.match(legal,/Segurança ofensiva e uso autorizado/);
  assert.match(css,/grid-template-columns: 240px minmax\(0, 1fr\)/);
});
