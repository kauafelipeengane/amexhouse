import test from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),css=read('../src/style.css'),layout=read('../src/components/Layout.jsx'),pkg=JSON.parse(read('../package.json'));
test('intervalo ficou menor',()=>{const final=css.slice(css.lastIndexOf('V35.11.9'));assert.match(final,/min-height:58px!important/);assert.match(final,/margin:0 auto \.3rem!important/)});
test('atalho k nao existe',()=>assert.doesNotMatch(layout,/⌘K|Control K|key\.toLowerCase\(\)==='k'/));
test('componente morto removido',()=>assert.equal(existsSync(new URL('../src/components/LiveRegion.jsx',import.meta.url)),false));
test('versao segue v1',()=>assert.match(pkg.version,/^1\./));
