import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const dialog=readFileSync(new URL('../src/components/QuizResultDialog.jsx',import.meta.url),'utf8'),css=readFileSync(new URL('../src/components/quiz-result-dialog.css',import.meta.url),'utf8');
test('modal mantém partículas em ambos os resultados',()=>{assert.match(dialog,/Array\.from\(\{ length: 18 \}/);assert.doesNotMatch(dialog,/passed && Array\.from/);});
test('animações ambiente são explicitamente infinitas',()=>{for(const marker of ['quiz-ambient-gradient','quiz-symbol-float','quiz-track-spin','quiz-meter-shimmer','quiz-particle-loop','quiz-primary-breathe','quiz-sheen-loop'])assert.match(css,new RegExp(`${marker}[^}]*infinite`));});
test('loop infinito tem fallback de movimento reduzido',()=>{assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*quiz-particle-loop|@media\(prefers-reduced-motion:reduce\)[\s\S]*quiz-result-atmosphere i/);});
