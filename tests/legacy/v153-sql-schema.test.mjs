import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_5_3_THREE_ACADEMIES_FIXED.sql"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("insert de courses respeita schema real sem position", () => {
  assert.doesNotMatch(sql, /public\.courses\([^)]*\bposition\b/);
  assert.equal((sql.match(/insert into public\.courses/g) || []).length, 27);
});
test("todos os cursos usam somente as sete colunas reais", () => {
  const rows = [
    ...sql.matchAll(
      /insert into public\.courses\(([^)]+)\) values\(([^;]+?)\) on conflict\(slug\)/g,
    ),
  ];
  assert.equal(rows.length, 27);
  for (const row of rows)
    assert.equal(
      row[1],
      "id,slug,title,description,level,workload_hours,status",
    );
});
test("migração exige slug e índice unique", () => {
  assert.match(sql, /Coluna obrigatória ausente: public\.courses\.slug/);
  assert.match(sql, /Índice UNIQUE obrigatório ausente/);
});
test("currículo completo continua intacto", () => {
  assert.equal(
    (sql.match(/insert into public\.course_modules/g) || []).length,
    108,
  );
  assert.equal((sql.match(/insert into public\.lessons/g) || []).length, 540);
  assert.equal(
    (sql.match(/insert into public\.lesson_competencies/g) || []).length,
    540,
  );
});
test("migração é atômica", () => {
  assert.equal((sql.match(/^begin;$/gim) || []).length, 1);
  assert.equal((sql.match(/^commit;$/gim) || []).length, 1);
});
