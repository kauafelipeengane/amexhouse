import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const audit=readFileSync(new URL('../supabase/active/06_FULL_AUDIT_V1_29_0.sql',import.meta.url),'utf8');
const platform=readFileSync(new URL('../src/services/platform.js',import.meta.url),'utf8');
test('auditoria cobre RLS, privilégios, integridade, quizzes e índices',()=>{
  for(const marker of ['rls_disabled','anon_execute','duplicate_permissive_policies','orphan_quiz_attempt','question_without_exactly_one_correct_answer','missing_unique_index']) assert.match(audit,new RegExp(marker));
});
test('mensagem de limite tem precedência sobre tentativa genérica',()=>{
  assert.ok(platform.indexOf("message.includes('limite')") < platform.indexOf("message.includes('tentativa')"));
});
