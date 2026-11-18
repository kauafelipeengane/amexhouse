import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_5_4_THREE_ACADEMIES_FIXED.sql"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("não usa level textual inventado", () =>
  assert.doesNotMatch(sql, /do básico ao avançado/));
test("reutiliza level já aceito pelo banco", () => {
  assert.equal(
    (
      sql.match(
        /select c\.level from public\.courses c where c\.level is not null order by c\.created_at nulls last limit 1/g,
      ) || []
    ).length,
    27,
  );
  assert.match(sql, /Nenhum valor válido de level foi encontrado/);
});
test("course insert não usa position", () =>
  assert.doesNotMatch(sql, /public\.courses\([^)]*position/));
test("currículo permanece completo", () => {
  assert.equal((sql.match(/insert into public\.courses/g) || []).length, 27);
  assert.equal(
    (sql.match(/insert into public\.course_modules/g) || []).length,
    108,
  );
  assert.equal((sql.match(/insert into public\.lessons/g) || []).length, 540);
});
test("migração é transacional", () => {
  assert.equal((sql.match(/^begin;$/gim) || []).length, 1);
  assert.equal((sql.match(/^commit;$/gim) || []).length, 1);
});
