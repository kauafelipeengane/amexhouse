import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../scripts/check-build.mjs',import.meta.url),'utf8');
test('orcamento CSS aceita o bundle validado e preserva limite gzip',()=>{
  assert.match(source,/"\.css": 232\*1024/);
  assert.match(source,/"\.css": 45\*1024/);
  assert.match(source,/gzipSync/);
});
