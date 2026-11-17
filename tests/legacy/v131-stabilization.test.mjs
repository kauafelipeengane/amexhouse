import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_3_1.sql"),
  admin = read("../src/admin/AdminPage.jsx"),
  dialog = read("../src/admin/ConfirmDialog.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("schema de videos e normalizado", () => {
  assert.match(sql, /create table if not exists public\.lesson_videos/);
  assert.match(sql, /add column if not exists alternative_youtube_id/);
});
test("quiz publico nao retorna is_correct", () => {
  const part = sql.slice(
    sql.indexOf("get_quiz_public"),
    sql.indexOf("submit_quiz"),
  );
  assert.doesNotMatch(part, /is_correct/);
});
test("submissao e atomica e limitada", () => {
  assert.match(sql, /interval '15 seconds'/);
  assert.match(sql, /max_attempts/);
  assert.match(sql, /insert into public\.quiz_attempts/);
  assert.match(sql, /quiz_passed=public\.lesson_progress\.quiz_passed or/);
});
test("alternativas tem interface e rpc", () => {
  assert.match(admin, /Alternativas/);
  assert.match(sql, /entity_name='alternatives'/);
});
test("confirmacao acessivel substitui confirm nativo", () => {
  assert.match(dialog, /role="alertdialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.doesNotMatch(admin, /\bconfirm\(/);
});
test("edicao e reordenacao visuais existem", () => {
  assert.match(admin, /EDITAR/);
  assert.match(admin, /Cancelar EDIÇÃO/);
  assert.match(sql, /entity_name='questions'/);
  assert.match(sql, /entity_name='alternatives'/);
});
test("notificacoes automaticas de publicacao", () => {
  assert.match(sql, /amex_notify_publication/);
  assert.match(sql, /amex_courses_notify/);
  assert.match(sql, /amex_lessons_notify/);
});
test("pastas pessoais possuem rpcs", () => {
  assert.match(sql, /amex_saved_folders/);
  assert.match(sql, /amex_save_folder/);
});
