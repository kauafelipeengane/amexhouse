import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  design = read("../src/authentic.css"),
  style = read("../src/style.css"),
  db = read("../supabase/README.md"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("direção visual autoral está ativa", () => {
  assert.match(style, /^@import '\.\/authentic\.css'/);
  for (const x of [
    "oficina digital editorial",
    "--amex-grid",
    "--amex-edge",
    "course-ledger",
    "quiz-question",
  ])
    assert.match(design, new RegExp(x));
});
test("CSS não depende de important", () =>
  assert.doesNotMatch(style + design, /!important/));
test("ícones acadêmicos foram reduzidos", () => {
  for (const f of ["javascript", "data", "devops"])
    assert.ok(
      statSync(new URL(`../src/assets/academies/${f}.webp`, import.meta.url))
        .size < 250_000,
    );
});
test("SQLs ativos e históricos estão separados", () => {
  assert.match(db, /active\//);
  assert.match(db, /audits\//);
  assert.match(db, /archive\//);
  assert.match(db, /zero linhas/);
});
