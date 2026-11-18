import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  portal = read("../src/pages/Portal.jsx"),
  academy = read("../src/lib/academy.js"),
  css = read("../src/style.css"),
  courses = read("../src/pages/Courses.jsx"),
  seed = read(
    "../supabase/archive/AMEX_HOUSE_V1_5_4_THREE_ACADEMIES_FIXED.sql",
  ),
  patch = read("../supabase/archive/AMEX_HOUSE_V1_6_0_COPY_REVIEW.sql"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("três GIFs V3 estão vinculados", () => {
  for (const x of [
    "javascript-exato.webp",
    "data-exato.webp",
    "devops-exato.webp",
  ])
    assert.match(portal, new RegExp(x));
});
test("cada nova academia possui sua cor", () => {
  assert.match(css, /data-area="javascript"[^}]*#ffd600/);
  assert.match(css, /data-area="data"[^}]*#f50074/);
  assert.match(css, /data-area="devops"[^}]*#c4c8d0/);
});
test("marca Ops é consistente", () => {
  assert.match(portal, /title:'AMEX OPS'/);
  assert.match(academy, /title:'AMEX OPS'/);
  assert.doesNotMatch(portal, /AMEX DEVOPS/);
});
test("status do catálogo inclui as cinco academias", () =>
  assert.match(academy, /Object\.keys\(academyConfig\)/));
test("interface remove rótulo genérico", () =>
  assert.doesNotMatch(courses, /CONTEÚDO ORIENTADO/));
test("seed não mantém cinco títulos repetitivos", () => {
  for (const x of [
    "Conceitos e vocabulário essenciais —",
    "Configuração do ambiente profissional —",
    "Prática guiada e validação —",
    "Falhas comuns e diagnóstico —",
    "Laboratório e entrega do módulo —",
  ])
    assert.doesNotMatch(seed, new RegExp(x));
});
test("patch é transacional e valida resíduos", () => {
  assert.match(patch, /^begin;$/m);
  assert.match(patch, /^commit;$/m);
  assert.match(patch, /Revisão editorial incompleta/);
});
