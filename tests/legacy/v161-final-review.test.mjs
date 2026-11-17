import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  academy = read("../src/lib/academy.js"),
  portal = read("../src/pages/Portal.jsx"),
  patch = read("../supabase/archive/AMEX_HOUSE_V1_6_0_COPY_REVIEW.sql"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("textos principais não usam apresentação genérica", () => {
  for (const x of [
    "percurso profissional",
    "projeto aplicado",
    "formação extensiva organizada",
  ])
    assert.doesNotMatch(academy, new RegExp(x, "i"));
});
test("patch editorial é limitado às três novas academias", () => {
  assert.match(patch, /with target_lessons as/);
  assert.match(patch, /where id in\(select id from target_lessons\)/);
  assert.match(patch, /c\.slug = any/);
});
test("patch trata resumo nulo", () =>
  assert.match(patch, /coalesce\(summary,''\)/));
test("portal mantém cinco academias e store", () => {
  for (const x of [
    "route:'pentest'",
    "route:'python'",
    "route:'javascript'",
    "route:'data'",
    "route:'devops'",
    "route:'store'",
  ])
    assert.match(portal, new RegExp(x));
});
