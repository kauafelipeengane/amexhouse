import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),lesson=read('../src/pages/Lesson.jsx'),layout=read('../src/components/Layout.jsx'),css=read('../src/style.css'),pkg=JSON.parse(read('../package.json'));
test('aula define lista usada pelo curriculo',()=>{assert.match(lesson,/buildLessonSequence/);assert.match(lesson,/courseLessons/)});
test('fonte virou componente editorial',()=>{assert.match(lesson,/source-card/);assert.match(lesson,/FONTE DO CONTEÚDO/);assert.doesNotMatch(lesson,/className="source"/)});
test('pager nao renderiza botoes vazios',()=>{assert.match(lesson,/lesson-pagination/);assert.match(lesson,/previous&&/);assert.match(lesson,/next&&/);assert.doesNotMatch(lesson,/className="pager"/)});
test('drawer possui cabecalho e rodape',()=>{assert.match(layout,/drawer-header/);assert.match(layout,/drawer-close/);assert.match(layout,/drawer-footer/)});
test('css remove texto visual de nova guia',()=>assert.match(css,/source a\[target="_blank"\]:after\{content:none!important\}/));
test('versao segue v1',()=>assert.match(pkg.version,/^1\./));
