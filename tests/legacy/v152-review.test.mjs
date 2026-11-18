import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_5_2_THREE_ACADEMIES_FIXED.sql"),
  platform = read("../src/services/platform.js"),
  admin = read("../src/admin/AdminPage.jsx"),
  insights = read("../src/pages/Insights.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("metas aceitam as cinco formações no cliente", () =>
  assert.match(
    platform,
    /\['pentest','python','javascript','data','devops'\]\.includes\(academy\)/,
  ));
test("certificado administrativo lista as cinco formações", () => {
  for (const x of ["pentest", "python", "javascript", "data", "devops"])
    assert.match(admin, new RegExp(`<option value="${x}">`));
});
test("desempenho identifica todas as formações", () => {
  for (const x of [
    "AMEX PYTHON",
    "AMEX PENTEST",
    "AMEX JAVASCRIPT",
    "AMEX DATA",
    "AMEX OPS",
  ])
    assert.match(insights, new RegExp(x));
});
test("sql possui validação de pré-requisitos", () =>
  assert.match(sql, /Pré-requisito ausente/));
test("sql valida exatamente 9 cursos 36 módulos 180 aulas e 360 horas", () => {
  assert.match(sql, /course_count<>9/);
  assert.match(sql, /module_count<>36/);
  assert.match(sql, /lesson_count<>180/);
  assert.match(sql, /hour_count<>360/);
});
test("migração continua atômica", () => {
  assert.equal((sql.match(/^begin;$/gim) || []).length, 1);
  assert.equal((sql.match(/^commit;$/gim) || []).length, 1);
});
test("conteúdo completo permanece presente", () => {
  assert.equal((sql.match(/insert into public\.courses/g) || []).length, 27);
  assert.equal(
    (sql.match(/insert into public\.course_modules/g) || []).length,
    108,
  );
  assert.equal((sql.match(/insert into public\.lessons/g) || []).length, 540);
});
