import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),layout=read('../src/components/Layout.jsx'),profile=read('../src/components/Profile.jsx'),css=read('../src/style.css'),prefs=read('../src/lib/preferences.js'),pkg=JSON.parse(read('../package.json'));
test('tema continua funcional no toque',()=>{assert.doesNotMatch(profile,/label className="setting-row"/);assert.match(profile,/changePreference\('theme'/);assert.doesNotMatch(profile,/changePreference\('reduceMotion'|changePreference\('logoMotion'/)});
test('preferencias persistem',()=>{assert.match(prefs,/storage\.set\('amex-preferences'/);assert.match(prefs,/root\.dataset\.motion/)});
test('barra inferior e modal mais foram removidos',()=>{assert.doesNotMatch(layout,/bottom-nav|mobile-more|setMore|dialogRef/);assert.doesNotMatch(css,/\.bottom-nav|\.mobile-more/)});
test('menu lateral mantem todos os destinos',()=>{assert.match(layout,/id="main-menu"/);assert.match(layout,/items\.map/);assert.match(layout,/aria-label="Menu principal"/)});
test('conteudo nao reserva espaco para barra removida',()=>assert.match(css,/V35\.19\.1[^]*padding-bottom:max\(2rem/));
test('versao segue v1',()=>assert.match(pkg.version,/^1\./));
