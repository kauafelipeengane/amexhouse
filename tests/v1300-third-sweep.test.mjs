import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const cleanup=readFileSync(new URL('../supabase/active/07_POLICY_CLEANUP_V1_30_0.sql',import.meta.url),'utf8');
const audit=readFileSync(new URL('../supabase/active/08_DEEP_AUDIT_V1_30_0.sql',import.meta.url),'utf8');
test('limpeza remove qualquer policy SELECT histórica antes das canônicas',()=>{
  assert.match(cleanup,/from pg_policies[\s\S]*cmd='SELECT'/);
  for(const table of ['lesson_videos','lesson_resources','lesson_exercises']) assert.match(cleanup,new RegExp(`create policy ${table}_published_read`));
  assert.match(cleanup,/revoke all on table public\.lesson_videos from anon, authenticated/);
});
test('terceira varredura cobre grants, FKs, search_path e órfãos',()=>{
  for(const marker of ['dangerous_table_grant','anon_private_table_grant','unindexed_foreign_key','mutable_function_search_path','user_without_profile','orphan_lesson_video']) assert.match(audit,new RegExp(marker));
});
