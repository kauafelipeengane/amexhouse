import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const root = new URL('../', import.meta.url),
  read = (p) => readFileSync(new URL(p, root), 'utf8'),
  allSql = ['active', 'archive', 'audits']
    .flatMap((dir) =>
      readdirSync(new URL(`supabase/${dir}/`, root))
        .filter((x) => x.endsWith('.sql'))
        .map((x) => read(`supabase/${dir}/${x}`)),
    )
    .join('\n'),
  audit = read('supabase/audits/AMEX_HOUSE_V1_7_4_AUDITORIA_FINAL.sql');
for (const table of [
  'lesson_videos',
  'lesson_resources',
  'lesson_exercises',
  'quiz_attempt_sessions',
  'security_events',
]) {
  test(`RLS ${table}`, () =>
    assert.match(
      allSql,
      new RegExp(`alter table public\\.${table} enable row level security`, 'i'),
    ));
  test(`FORCE RLS ${table}`, () =>
    assert.match(
      allSql,
      new RegExp(`alter table public\\.${table} force row level security`, 'i'),
    ));
}
test('default privileges', () =>
  assert.match(
    allSql,
    /alter default privileges[\s\S]*revoke all on tables from anon, authenticated/i,
  ));
for (const issue of [
  'sem vídeo válido',
  'sem avaliação',
  'menos de 3 questões',
  'sem 4 alternativas',
  'exatamente 1 resposta correta',
  'Módulo sem aula',
])
  test(`auditoria ${issue}`, () => assert.match(audit, new RegExp(issue)));
test('SQL raiz vazio', () =>
  assert.equal(
    readdirSync(new URL('supabase/', root)).filter((x) => x.endsWith('.sql')).length,
    0,
  ));
test('guia do banco', () => assert.match(read('supabase/README.md'), /Não execute novamente/));
