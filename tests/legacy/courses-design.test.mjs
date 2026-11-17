import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const course = readFileSync(
    new URL("../src/pages/Courses.jsx", import.meta.url),
    "utf8",
  ),
  academy = readFileSync(
    new URL("../src/lib/academy.js", import.meta.url),
    "utf8",
  ),
  css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");
test("cursos não usam emojis genéricos", () =>
  assert.doesNotMatch(course, /✓|▶|▤/));
test("cursos usam linguagem editorial", () =>
  assert.match(academy, /Pentest e Segurança Ofensiva/));
test("módulos são capítulos", () => assert.match(course, /MÓDULO/));
test("estados possuem texto próprio", () =>
  assert.match(course, /CONCLUÍDA.*EM ANDAMENTO.*VIDEOAULA.*CONTEÚDO/s));
test("curso possui expansão acessível", () =>
  assert.match(course, /aria-expanded/));
test("design editorial possui ledger", () =>
  assert.match(css, /course-ledger/));
test("mobile possui composição própria", () =>
  assert.match(css, /@media\(max-width:600px\).*course-cover/s));
