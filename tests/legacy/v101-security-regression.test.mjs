import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const service = read("../src/services/platform.js"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_0_1.sql"),
  pkg = JSON.parse(read("../package.json"));
test("progresso usa somente a RPC segura", () => {
  assert.match(service, /amex_save_video_progress/);
  assert.doesNotMatch(service, /new_quiz_passed|rpc\('save_video_progress'/);
});
test("rpc deriva usuario da sessao", () => {
  assert.match(sql, /actor uuid := auth\.uid\(\)/);
  assert.doesNotMatch(sql, /target_user_id/);
});
test("rpc nao recebe aprovacao do quiz", () =>
  assert.doesNotMatch(sql, /amex_save_video_progress\([^)]*quiz_passed/s));
test("migracao remove politicas anteriores", () =>
  assert.match(sql, /select policyname from pg_policies/));
test("rls e forcada nas tabelas pessoais", () =>
  assert.match(sql, /force row level security/));
test("migracao possui pre validacao", () => {
  assert.match(sql, /tabela obrigatória ausente/);
  assert.match(sql, /coluna obrigatória ausente/);
});
test("versao e 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("ativos animados respeitam 3 MB", () => {
  for (const p of [
    "../src/assets/AMEX_HOUSE.webp",
    "../src/assets/AMEX_HOUSE_LOGIN_COVER.webp",
    "../src/assets/portal/AMEX_PENTEST.webp",
    "../src/assets/portal/AMEX_PYTHON.webp",
    "../src/assets/portal/AMEX_STORE.webp",
    "../src/assets/portal/AMEX_PENTEST_BANNER.webp",
    "../src/assets/portal/AMEX_PYTHON_BANNER.webp",
    "../src/assets/portal/AMEX_STORE_X.webp",
  ])
    assert.ok(statSync(new URL(p, import.meta.url)).size < 3 * 1024 * 1024, p);
});

test("meta remove chave primaria antiga antes de duplicar", () => {
  const drop = sql.indexOf("rel.relname='study_goals'"),
    copy = sql.indexOf("select user_id,'python'");
  assert.ok(drop > -1 && copy > drop);
  assert.match(sql, /primary key\(user_id,academy\)/);
});
