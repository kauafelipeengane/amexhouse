import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  academy = read("../src/lib/academy.js"),
  courses = read("../src/pages/Courses.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("cada formação possui título de catálogo próprio", () => {
  for (const title of [
    "Pentest e Segurança Ofensiva",
    "Python: Fundamentos e Produção",
    "JavaScript Full Stack",
    "Dados e Analytics",
    "Operações, Cloud e SRE",
  ])
    assert.match(academy, new RegExp(title));
});
test("cada formação possui rótulo de trilha próprio", () => {
  for (const label of [
    "TRILHA PENTEST",
    "TRILHA PYTHON",
    "TRILHA JAVASCRIPT",
    "TRILHA DATA",
    "TRILHA OPS",
  ])
    assert.match(academy, new RegExp(label));
});
test("Courses não possui fallback binário Python ou Pentest", () => {
  assert.doesNotMatch(courses, /courseKind==='python'/);
  assert.match(courses, /academyConfig\[courseKind\]/);
  assert.match(courses, /academy\.catalogTitle/);
  assert.match(courses, /academy\.trackLabel/);
});
test("Course usa identidade da formação corrente", () =>
  assert.match(courses, /<Page eyebrow=\{academy\.title\}/));
