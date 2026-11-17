import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  pkg = JSON.parse(read('package.json'));
const cases = [
  ['release', () => assert.equal(pkg.version, '1.27.1')],
  ['node 22', () => assert.equal(pkg.engines.node, '22.x')],
  ['sem eval', () => assert.doesNotMatch(read('src/App.jsx'), /\beval\(/)],
  ['sem Function dinâmica', () => assert.doesNotMatch(read('src/App.jsx'), /new Function/)],
  ['sem HTML inseguro', () => assert.doesNotMatch(read('src/App.jsx'), /dangerouslySetInnerHTML/)],
  ['CSP default', () => assert.match(read('vercel.json'), /default-src 'self'/)],
  ['CSP object', () => assert.match(read('vercel.json'), /object-src 'none'/)],
  ['CSP frame ancestors', () => assert.match(read('vercel.json'), /frame-ancestors 'none'/)],
  ['CSP Supabase', () => assert.match(read('vercel.json'), /https:\/\/\*\.supabase\.co/)],
  ['erro sanitizado', () => assert.match(read('src/lib/errorReporter.js'), /allowedCode/)],
  [
    'erro sem mensagem',
    () => assert.doesNotMatch(read('src/lib/errorReporter.js'), /error\.message/),
  ],
  [
    'telemetria HTTPS',
    () => assert.match(read('src/lib/errorReporter.js'), /protocol\s*!==\s*['"]https:/),
  ],
  ['telemetria limitada', () => assert.match(read('src/lib/errorReporter.js'), /count\s*>=\s*5/)],
  [
    'telemetria sem credenciais',
    () => assert.match(read('src/lib/errorReporter.js'), /credentials\s*:\s*['"]omit/),
  ],
  ['erros globais', () => assert.match(read('src/main.jsx'), /addEventListener\(['"]error/)],
  ['promises globais', () => assert.match(read('src/main.jsx'), /unhandledrejection/)],
  ['sem env real', () => assert.equal(exists('.env'), false)],
  ['sem env local', () => assert.equal(exists('.env.local'), false)],
  ['env example', () => assert.equal(exists('.env.example'), true)],
  ['endpoint opcional', () => assert.match(read('.env.example'), /VITE_ERROR_ENDPOINT=/)],
];
for (const [name, fn] of cases) test(name, fn);
function exists(name) {
  try {
    return statSync(new URL(name, root)).isFile();
  } catch {
    return false;
  }
}
