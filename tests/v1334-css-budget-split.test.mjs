import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync,statSync}from'node:fs';
const component=readFileSync(new URL('../src/components/QuizResultDialog.jsx',import.meta.url),'utf8'),popup=readFileSync(new URL('../src/components/quiz-result-dialog.css',import.meta.url),'utf8'),global=readFileSync(new URL('../src/styles/rigorous-rebuild.css',import.meta.url),'utf8');
test('CSS do popup fica no chunk da funcionalidade',()=>{assert.match(component,/import '.\/quiz-result-dialog\.css'/);assert.match(popup,/quiz-result-backdrop/);assert.doesNotMatch(global,/quiz-result-backdrop/);});
test('folha isolada permanece pequena',()=>assert.ok(statSync(new URL('../src/components/quiz-result-dialog.css',import.meta.url)).size<20*1024));
test('orçamento principal não foi artificialmente aumentado',()=>{const check=readFileSync(new URL('../scripts/check-build.mjs',import.meta.url),'utf8');assert.match(check,/"\.css": 232\*1024/);});
