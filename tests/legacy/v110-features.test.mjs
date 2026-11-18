import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_1_0.sql"),
  app = read("../src/App.jsx"),
  admin =
    read("../src/admin/AdminPage.jsx") + read("../src/admin/adminService.js"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.1.0", () => assert.equal(pkg.version, "1.10.0"));
test("papeis sao validados no banco", () => {
  assert.match(sql, /amex_my_role/);
  assert.match(sql, /amex_is_staff/);
  assert.match(sql, /auth\.uid\(\)/);
});
test("admin nao confia em papel do cliente", () =>
  assert.match(admin, /supabase\.rpc\('amex_my_role'/));
test("rpc administrativa audita mudancas", () => {
  assert.match(sql, /amex_admin_save_course/);
  assert.match(sql, /admin_audit_log/);
});
test("tentativas possuem unicidade", () =>
  assert.match(sql, /unique\(user_id,quiz_id,attempt_number\)/));
test("certificado possui verificacao publica limitada", () => {
  assert.match(sql, /amex_verify_certificate/);
  assert.match(sql, /limit 1/);
  assert.match(app, /VerifyCertificate/);
});
test("paginas administrativas e verificacao nao usam html inseguro", () => {
  assert.doesNotMatch(admin, /dangerouslySetInnerHTML|innerHTML|eval\(/);
  assert.doesNotMatch(
    read("../src/pages/VerifyCertificate.jsx"),
    /dangerouslySetInnerHTML|innerHTML|eval\(/,
  );
});
