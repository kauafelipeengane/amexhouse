import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const sql=readFileSync(new URL('../supabase/active/09_GRANTS_AND_INDEXES_V1_31_0.sql',import.meta.url),'utf8');
test('hardening revoga grants perigosos e acesso anon privado',()=>{
  assert.match(sql,/revoke truncate, references, trigger/);
  for(const table of ['admin_audit_log','certificates','notifications','profiles','quiz_attempt_sessions','quiz_attempts','user_roles']) assert.match(sql,new RegExp(`table public\\.${table} from anon`));
});
test('FKs reportadas recebem índices',()=>{
  for(const idx of ['amex_quiz_attempts_quiz_id_idx','lesson_progress_lesson_id_idx','quiz_attempt_sessions_quiz_id_idx','watch_later_lesson_id_idx']) assert.match(sql,new RegExp(idx));
});
test('hook morto foi removido',()=>assert.equal(existsSync(new URL('../src/hooks/useFocusReturn.js',import.meta.url)),false));
