import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_4_1_SECURITY.sql"),
  pkg = JSON.parse(read("../package.json")),
  workflow = read("../.github/workflows/security.yml");
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("midias possuem RLS forçada", () => {
  for (const t of ["lesson_videos", "lesson_resources", "lesson_exercises"]) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${t} enable row level security`),
    );
    assert.match(
      sql,
      new RegExp(`alter table public\\.${t} force row level security`),
    );
  }
});
test("default privileges são deny by default", () => {
  assert.match(
    sql,
    /alter default privileges[\s\S]*revoke all on tables from anon, authenticated/,
  );
  assert.match(sql, /revoke execute on functions from public, anon/);
});
test("trigger não é exposto pelo data api", () =>
  assert.match(
    sql,
    /revoke all on function public\.amex_notify_publication\(\) from public,anon,authenticated/,
  ));
test("quiz público exige sessão", () => {
  assert.match(sql, /get_quiz_public/);
  assert.match(sql, /auth\.uid\(\) is null/);
});
test("eventos de segurança são privados", () => {
  assert.match(sql, /security_events/);
  assert.match(sql, /security_events_admin_read/);
  assert.match(sql, /force row level security/);
});
test("security ci executa build audit e gitleaks", () => {
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.match(workflow, /gitleaks\/gitleaks-action/);
});
