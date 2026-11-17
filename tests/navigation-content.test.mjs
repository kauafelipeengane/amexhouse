import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  app = read('src/App.jsx'),
  portal = read('src/pages/Portal.jsx'),
  service = read('src/services/platform.js');
for (const route of ['privacy', 'terms', 'verify', 'portal', 'profile', 'store'])
  test(`rota ${route}`, () => assert.match(app, new RegExp(route)));
for (const area of ['pentest', 'python', 'javascript', 'data', 'devops', 'store'])
  test(`portal ${area}`, () => assert.match(portal, new RegExp(`route: ['"]${area}['"]`)));
for (const rpc of ['get_quiz_public', 'amex_start_quiz', 'amex_submit_quiz'])
  test(`RPC ${rpc}`, () => assert.match(service, new RegExp(rpc)));
for (const table of [
  'lesson_videos',
  'lesson_resources',
  'lesson_exercises',
  'lesson_progress',
  'favorites',
  'watch_later',
])
  test(`fonte ${table}`, () => assert.match(service, new RegExp(table)));
test('identidade pentest', () => assert.match(portal, /pentestArt/));
test('identidade python', () => assert.match(portal, /pythonArt/));
test('identidade javascript', () => assert.match(portal, /javascriptArt/));
test('identidade data', () => assert.match(portal, /dataArt/));
test('identidade devops', () => assert.match(portal, /devopsArt/));
