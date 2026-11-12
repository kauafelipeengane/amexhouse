import test from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),css=read('../src/style.css'),layout=read('../src/components/Layout.jsx'),pkg=JSON.parse(read('../package.json'));
test('blocos experimentais foram removidos',()=>{assert.doesNotMatch(css,/V35\.20/);assert.doesNotMatch(css,/mobile universal compacto|rolagem mobile livre/)});
test('desktop aprovado permanece como v35.19.1',()=>assert.match(css,/V35\.19\.1 · navegação inferior removida/));
test('barra inferior continua removida',()=>assert.doesNotMatch(layout,/bottom-nav|mobile-more/));
test('drawer libera bloqueio residual',()=>{assert.match(layout,/classList\.remove\('nav-open'\)/);assert.match(layout,/style\.removeProperty\('overflow'\)/)});
test('testes experimentais foram removidos',()=>{assert.equal(existsSync(new URL('./v35200-mobile-compact.test.mjs',import.meta.url)),false);assert.equal(existsSync(new URL('./v35201-mobile-scroll.test.mjs',import.meta.url)),false)});
test('versao e 1.0.0',()=>assert.equal(pkg.version,'1.0.0'));
