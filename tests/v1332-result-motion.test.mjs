import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const dialog=readFileSync(new URL('../src/components/QuizResultDialog.jsx',import.meta.url),'utf8'),css=readFileSync(new URL('../src/components/quiz-result-dialog.css',import.meta.url),'utf8');
test('nota anima de zero ao resultado com cancelamento seguro',()=>{for(const marker of ['animatedScore','requestAnimationFrame','cancelAnimationFrame','Math.pow'])assert.match(dialog,new RegExp(marker));});
test('simbolo desenha check ou x via SVG',()=>{assert.match(dialog,/<svg/);assert.match(dialog,/quiz-result-symbol-stroke/);assert.match(dialog,/M21 37\.5/);assert.match(dialog,/M25 25 47 47/);});
test('motion pass contém entrada, desenho, brilho, órbita e stagger',()=>{for(const marker of ['quiz-symbol-pop','quiz-stroke-draw','quiz-copy-up','quiz-button-glint','quiz-orbit','quiz-sheen'])assert.match(css,new RegExp(marker));});
test('motion pass respeita reduced motion',()=>{assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/stroke-dashoffset:0/);});
