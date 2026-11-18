import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  layout = read("../src/components/Layout.jsx"),
  profile = read("../src/components/Profile.jsx"),
  prefs = read("../src/lib/preferences.js"),
  session = read("../src/hooks/useSession.js"),
  css = read("../src/style.css"),
  pkg = JSON.parse(read("../package.json"));
test("v32 usa preferencias centralizadas", () => {
  assert.ok(existsSync(new URL("../src/lib/preferences.js", import.meta.url)));
  assert.match(prefs, /theme-color/);
});
test("mobile acessa destinos pelo menu lateral", () => {
  assert.match(layout, /id="main-menu"/);
  assert.match(layout, /items\.map/);
  assert.doesNotMatch(layout, /bottom-nav|mobile-more/);
});
test("busca pode ser limpa e e semantica", () => {
  assert.match(layout, /type="search"/);
  assert.match(layout, /Limpar busca/);
});
test("sidebar recolhe com persistencia", () => {
  assert.match(layout, /amex-sidebar/);
  assert.match(layout, /is-collapsed/);
});
test("perfil oferece tema sem paineis removidos", () => {
  assert.match(profile, /SISTEMA/);
  for (const x of ["ESPAÇOSA", "Reduzir movimentos", "Animar logo"])
    assert.doesNotMatch(profile, new RegExp(x));
});
test("recuperacao usa PKCE e tela dedicada", () => {
  assert.match(read("../src/lib/supabase.js"), /flowType:'pkce'/);
  assert.match(session, /PASSWORD_RECOVERY/);
  assert.ok(
    existsSync(new URL("../src/components/ResetPassword.jsx", import.meta.url)),
  );
});
test("meta possui progressbar real", () =>
  assert.match(read("../src/pages/Workspace.jsx"), /role="progressbar"/));
test("tema claro cobre areas principais", () => {
  for (const x of [
    "course-cover",
    "lesson-entry",
    "alternatives label",
    "quiz-footer",
    "auth-flow",
  ])
    assert.match(css, new RegExp(x));
});
test("versao do produto foi elevada", () =>
  assert.equal(pkg.version, "1.10.0"));
