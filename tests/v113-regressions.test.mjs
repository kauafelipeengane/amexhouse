import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  lazy = read('src/components/LazyAnimatedArtwork.jsx'),
  profile = read('src/components/Profile.jsx'),
  insights = read('src/pages/Insights.jsx'),
  css = read('src/styles/alignment.css'),
  sql = read('supabase/active/03_AVATAR_STORAGE_V1_13_0.sql');
test('assets de banner continuam animados', () => assert.match(lazy, /active\?src/));
test('avatar renderiza imagem assinada', () => {
  assert.match(profile, /avatarUrl \?/);
  assert.match(profile, /alt="Foto de perfil"/);
  assert.match(profile, /setAvatarVersion/);
});
test('avatar informa bloqueio RLS', () => assert.match(profile, /política de armazenamento/));
test('SQL cria bucket privado', () => assert.match(sql, /values\s*\(\s*'avatars'[\s\S]*false\s*,\s*1048576/));
test('SQL possui quatro políticas próprias', () => {
  for (const action of ['select', 'insert', 'update', 'delete'])
    assert.match(sql, new RegExp(`for ${action}`));
});
test('curso alinha número e conteúdo na mesma linha', () =>
  assert.match(css, /grid-template-areas:\s*["']number content percent["']/));
test('histórico vazio é compacto', () => {
  assert.match(insights, /history-empty/);
  assert.match(css, /min-height:\s*150px/);
});
test('resumo usa grade coerente', () =>
  assert.match(css, /\.catalog-summary\s*\{[\s\S]*grid-template-columns/));
