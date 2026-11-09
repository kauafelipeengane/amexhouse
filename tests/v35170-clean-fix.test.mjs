import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),css=read('../src/style.css'),nav=read('../src/hooks/useNavigation.js'),main=read('../src/main.jsx'),search=read('../src/components/SearchResults.jsx'),workspace=read('../src/pages/Workspace.jsx'),pkg=JSON.parse(read('../package.json'));
test('seletores de componentes removidos sairam do css',()=>{for(const x of ['.lesson-jump','[data-current','.course-progress','.pager','.auth-brand{'])assert.equal(css.includes(x),false,x)});
test('scroll usa sintaxe moderna e limite visivel',()=>{assert.doesNotMatch(nav,/scrollTo\(0,0\)/);assert.match(nav,/scrollHeight-innerHeight/)});
test('bootstrap valida elemento root',()=>{assert.match(main,/if\(!root\)throw new Error/);assert.match(main,/createRoot\(root\)/)});
test('busca tolera propriedades ausentes',()=>{assert.match(search,/query='',results=\[\]/);assert.match(search,/const term=String\(query\)\.trim/)});
test('curso vazio tem rotulo acessivel correto',()=>assert.match(workspace,/sem aulas publicadas/));
test('versao segue v1',()=>assert.match(pkg.version,/^1\./));
