import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_4_0.sql"),
  platform = read("../src/services/platform.js"),
  admin = read("../src/admin/AdminPage.jsx"),
  notifications = read("../src/components/NotificationCenter.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("quiz tem sessao expirada e uso unico", () => {
  assert.match(sql, /quiz_attempt_sessions/);
  assert.match(sql, /expires_at/);
  assert.match(sql, /submitted_at is not null/);
});
test("concorrencia usa advisory lock", () =>
  assert.ok((sql.match(/pg_advisory_xact_lock/g) || []).length >= 2));
test("duracao vem do inicio real", () => {
  assert.match(sql, /session_row\.started_at/);
  assert.match(sql, /duration_seconds/);
});
test("cliente inicia e envia com token", () => {
  assert.match(platform, /amex_start_quiz/);
  assert.match(platform, /amex_submit_quiz/);
  assert.match(platform, /attempt_token:attemptToken/);
});
test("edicao busca entidade completa no servidor", () => {
  assert.match(sql, /amex_admin_get_entity/);
  assert.match(admin, /getEntity\(tab,row\.id\)/);
});
test("ordem e notificacoes sao acessiveis", () => {
  assert.match(admin, /aria-label="Mover registro para cima"/);
  assert.match(notifications, /Notificações, \$\{unread\} não lidas/);
  assert.match(notifications, /Escape/);
});
test("rpcs sensiveis revogam publico e anonimo", () => {
  for (const fn of [
    "amex_start_quiz",
    "amex_submit_quiz",
    "amex_admin_get_entity",
  ])
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}`));
});
