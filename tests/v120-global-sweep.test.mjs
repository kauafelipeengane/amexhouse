import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/styles/production-fixes.css', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('versao 1.33.4', () => assert.equal(pkg.version, '1.33.4'));
test('fluxo de texto horizontal protegido', () => {
  assert.match(css, /writing-mode:\s*horizontal-tb/);
  assert.match(css, /word-break:\s*normal/);
});
test('conteudo principal nao colapsa largura', () => {
  assert.match(css, /min-inline-size:\s*0/);
  assert.match(css, /grid-template-columns:\s*minmax\(360px, 1fr\)/);
});
