import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const migration=readFileSync(new URL('../supabase/active/04_PRODUCTION_INTEGRITY_V1_28_0.sql',import.meta.url),'utf8');
const platform=readFileSync(new URL('../src/services/platform.js',import.meta.url),'utf8');
const reporter=readFileSync(new URL('../src/lib/errorReporter.js',import.meta.url),'utf8');
test('migração consolida os quatro defeitos observados em produção',()=>{
  assert.match(migration,/unique index if not exists study_goals_user_academy_uidx/);
  assert.match(migration,/references public\.amex_quiz_settings \(id\)/);
  assert.doesNotMatch(migration,/jsonb_object_length/);
  assert.match(migration,/from jsonb_object_keys\(submitted_answers\)/);
  assert.doesNotMatch(migration,/insert into public\.study_goals \(user_id\)\s*values/);
});
test('frontend usa RPC protegida e mensagens operacionais seguras',()=>{
  assert.match(platform,/supabase\.rpc\('amex_save_study_goal'/);
  assert.match(platform,/safeBackendMessage/);
  assert.match(platform,/action: 'submitQuiz'/);
  assert.match(reporter,/RELEASE = '1\.33\.4'/);
});
