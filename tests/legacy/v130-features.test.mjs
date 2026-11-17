import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_3_0.sql"),
  admin = read("../src/admin/AdminPage.jsx"),
  service = read("../src/admin/adminService.js"),
  portal = read("../src/pages/Portal.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("novos dominios administrativos", () => {
  for (const x of [
    "questions",
    "videos",
    "resources",
    "exercises",
    "integrity",
  ])
    assert.match(admin, new RegExp(x));
});
test("resposta correta nao possui policy estudantil", () => {
  assert.match(sql, /create policy alternatives_staff/);
  assert.doesNotMatch(sql, /alternatives_owner|alternatives_student/);
});
test("notificacoes isoladas por auth uid", () => {
  assert.match(sql, /notifications_owner_read/);
  assert.match(sql, /user_id=auth\.uid\(\)/);
  assert.match(portal, /NotificationCenter/);
});
test("integridade detecta cinco classes de falha", () => {
  for (const x of [
    "Curso sem módulo",
    "Módulo sem aula",
    "Aula sem vídeo",
    "Avaliação sem perguntas",
    "Pergunta sem resposta correta",
  ])
    assert.match(sql, new RegExp(x));
});
test("midia e url sao validadas no servidor", () => {
  assert.match(sql, /\^\[A-Za-z0-9_-\]\{11\}\$/);
  assert.match(sql, /URL deve usar HTTPS/);
});
test("acao avancada e auditada sem solution", () => {
  assert.match(sql, /advanced\.save/);
  assert.match(sql, /payload-'solution'/);
});
test("cliente envia dominios avancados por rpc dedicada", () =>
  assert.match(service, /amex_admin_save_advanced/));
