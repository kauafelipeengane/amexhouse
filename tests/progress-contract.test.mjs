import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const service=readFileSync(new URL('../src/services/platform.js',import.meta.url),'utf8');
test('posicao e limitada pela duracao conhecida',()=>assert.match(service,/if\(duration>0\)current=Math\.min\(current,duration\)/));
test('percentual permanece entre zero e cem',()=>assert.match(service,/Math\.min\(100,Math\.max\(0/));
