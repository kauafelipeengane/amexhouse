import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),quiz=read('../src/components/Quiz.jsx'),lesson=read('../src/pages/Lesson.jsx'),css=read('../src/style.css'),pkg=JSON.parse(read('../package.json'));
test('quiz diferencia atual respondida e pendente',()=>{assert.match(quiz,/currentQuestion/);assert.match(quiz,/aria-current=\{current\?'step'/);assert.match(quiz,/answered.*current/s)});
test('questao recebe foco ao navegar',()=>{assert.match(quiz,/querySelector\('input:not\(:disabled\)'\)\?\.focus/);assert.doesNotMatch(quiz,/CSS\.escape/)});
test('curriculo possui cabecalho estruturado',()=>{assert.match(lesson,/curriculum-header/);assert.match(lesson,/curriculum-heading/);assert.match(lesson,/curriculum-list/)});
test('curriculo trata singular e plural',()=>assert.match(lesson,/courseLessons\.length===1\?'aula':'aulas'/));
test('linha vertical antiga foi neutralizada',()=>assert.match(css,/question\.correct,.question\.incorrect\{border-left-width:0\}/));
test('trilha usa circulos e estado atual',()=>{assert.match(css,/border-radius:50%/);assert.match(css,/nav button\.current/);assert.match(css,/scroll-snap-type:x proximity/)});
test('versao segue v1',()=>assert.match(pkg.version,/^1\./));
