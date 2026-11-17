import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  page = read("../src/admin/AdminPage.jsx"),
  service = read("../src/admin/adminService.js"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_2_0.sql"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.2.0", () => assert.equal(pkg.version, "1.10.0"));
test("painel cobre dominios administrativos", () => {
  for (const x of [
    "dashboard",
    "courses",
    "modules",
    "lessons",
    "quizzes",
    "users",
    "certificates",
    "audit",
  ])
    assert.match(page, new RegExp(x));
});
test("cliente usa somente RPCs administrativas", () => {
  assert.match(service, /amex_admin_list/);
  assert.match(service, /amex_admin_save/);
  assert.match(service, /amex_admin_set_role/);
});
test("servidor valida papel", () => {
  assert.ok((sql.match(/amex_is_staff/g) || []).length >= 5);
  assert.match(sql, /auth\.uid\(\)/);
});
test("listas possuem limite e paginação", () => {
  assert.match(sql, /limit 25 offset off/);
  assert.match(page, /Página \{page\}/);
});
test("instrutor recebe email mascarado", () =>
  assert.match(sql, /regexp_replace\(u\.email/));
test("ultimo admin e protegido", () =>
  assert.match(sql, /último administrador não pode remover/));
test("alteracoes geram auditoria", () => {
  assert.match(sql, /entity\.save/);
  assert.match(sql, /entity\.archive/);
  assert.match(sql, /role\.change/);
});
test("nenhuma renderizacao html insegura", () =>
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|innerHTML|eval\(/));
