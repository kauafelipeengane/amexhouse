import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  portal = read('src/pages/Portal.jsx'),
  notice = read('src/components/NotificationCenter.jsx'),
  profile = read('src/components/Profile.jsx'),
  courses = read('src/pages/Courses.jsx'),
  css = read('src/pages/portal.css'),
  align = read('src/styles/alignment.css');
test('barra possui cinco ações e conta', () => {
  for (const x of ['Início', 'Perfil', 'Notificações', 'Ajustes', 'Tema'])
    assert.match(portal + notice, new RegExp(x));
  assert.match(portal, /AccountMenu/);
});
test('tema usa preferências existentes', () => {
  assert.match(portal, /readPreferences/);
  assert.match(portal, /savePreferences/);
});
test('sino usa SVG fornecido', () => {
  assert.match(notice, /M18 8A6 6 0 0 0 6 8/);
  assert.match(notice, /M13\.73 21/);
});
test('avatar sincroniza em todo portal', () => {
  assert.match(portal, /createSignedUrl/);
  assert.match(portal, /amex:avatar-updated/);
  assert.match(profile, /amex:avatar-updated/);
});
test('numero e título no mesmo contêiner', () => {
  assert.match(courses, /course-title-line[\s\S]*course-index[\s\S]*strong/);
  assert.match(align, /\.course-title-line/);
});
test('mobile preserva alvos 42px ou maiores', () => assert.match(css, /min-width:\s*42px/));
