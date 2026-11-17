import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  auth = read('src/components/Auth.jsx'),
  layout = read('src/components/Layout.jsx'),
  quiz = read('src/components/Quiz.jsx'),
  profile = read('src/components/Profile.jsx');
for (const text of [
  'Continue seu percurso.',
  'Acesse suas aulas.',
  'Esqueci minha senha',
  'Privacidade',
  'Termos de uso',
])
  test(`copy ${text}`, () =>
    assert.match(auth, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
test('skip link', () => assert.match(layout, /skip-link/));
test('aria current', () => assert.match(read('src/components/navigation/AcademyNavigationTree.jsx'), /aria-current/));
test('aria live quiz', () => assert.match(quiz, /aria-live/));
test('fieldset quiz', () => assert.match(quiz, /<fieldset/));
test('avatar assinado', () => assert.match(profile, /createSignedUrl/));
test('avatar path', () => assert.match(profile, /avatar_path/));
test('upload 1MB', () => assert.match(profile, /1024\s*\*\s*1024/));
test('sem slogan antigo', () => assert.doesNotMatch(auth, /FAÇA PARTE DA HOUSE|CONECTE-SE\./));
