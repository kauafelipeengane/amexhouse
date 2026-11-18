import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql = readFileSync(
    new URL(
      "../supabase/archive/AMEX_HOUSE_V1_7_1_VIDEOS_AVATAR_CORRIGIDO.sql",
      import.meta.url,
    ),
    "utf8",
  ),
  pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("função antiga é substituída", () =>
  assert.match(
    sql,
    /create or replace function public\.validate_unique_video_source\(\)/,
  ));
test("reuso entre aulas não é bloqueado", () =>
  assert.doesNotMatch(sql, /já pertence a outra aula/));
test("principal e alternativo da mesma aula não podem ser iguais", () =>
  assert.match(sql, /vídeo alternativo deve ser diferente/));
test("IDs continuam validados", () =>
  assert.equal(
    (sql.match(/\^\[A-Za-z0-9_-\]\{11\}\$/g) || []).length >= 3,
    true,
  ));
test("transação valida aulas sem vídeo", () => {
  assert.match(sql, /^begin;$/m);
  assert.match(sql, /^commit;$/m);
  assert.match(sql, /aulas publicadas sem vídeo válido/);
});
