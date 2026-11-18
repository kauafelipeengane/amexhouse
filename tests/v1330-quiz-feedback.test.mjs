import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const dialog=readFileSync(new URL('../src/components/QuizResultDialog.jsx',import.meta.url),'utf8');
const quiz=readFileSync(new URL('../src/components/Quiz.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/components/quiz-result-dialog.css',import.meta.url),'utf8');
test('resultado abre modal central acessível após correção do servidor',()=>{
  assert.match(quiz,/visibleResult\?\.ok \&\& !visibleResult\.dialogDismissed/);
  assert.match(quiz,/<QuizResultDialog/);
  assert.match(dialog,/createPortal/);
  assert.match(dialog,/document\.body/);
  assert.match(dialog,/role="dialog"/);
  assert.match(dialog,/aria-modal="true"/);
  assert.match(dialog,/aria-live="assertive"/);
});
test('feedback diferencia aprovação e revisão sem depender apenas de cor',()=>{
  assert.match(dialog,/Você acertou!/);
  assert.match(dialog,/Ainda não foi dessa vez/);
  assert.match(dialog,/REVISAR RESPOSTAS/);
  assert.match(dialog,/correct/);
  assert.match(dialog,/total/);
});
test('animação respeita movimento reduzido e modal é responsivo',()=>{
  assert.match(css,/@keyframes quiz-result-in/);
  assert.match(css,/@keyframes quiz-result-wrong-in/);
  assert.match(css,/@keyframes quiz-particle/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/@media\(max-width:560px\)/);
});
