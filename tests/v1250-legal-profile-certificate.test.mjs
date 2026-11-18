import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const legal=readFileSync(new URL('../src/pages/Legal.jsx',import.meta.url),'utf8');
const profile=readFileSync(new URL('../src/components/Profile.jsx',import.meta.url),'utf8');
const workspace=readFileSync(new URL('../src/pages/Workspace.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/rigorous-rebuild.css',import.meta.url),'utf8');
test('politica e termos possuem estrutura juridica ampla',()=>{
  assert.match(legal,/Direitos do titular/); assert.match(legal,/Infraestrutura, compartilhamento e localização/);
  assert.match(legal,/Segurança ofensiva e uso autorizado/); assert.match(legal,/Não é diploma reconhecido pelo[\s\S]*MEC/);
  assert.match(legal,/Nada nestes Termos exclui responsabilidade/);
});
test('certificado e perfil tem nova hierarquia',()=>{
  assert.match(workspace,/certificate-progress/); assert.match(workspace,/certificate-gate/);
  assert.match(profile,/privacy-data-map/); assert.match(profile,/Exercer seus direitos/);
  assert.match(css,/grid-template-columns: minmax\(0, 1\.25fr\) minmax\(280px, \.75fr\)/);
});
