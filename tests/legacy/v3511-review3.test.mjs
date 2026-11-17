import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  authResult = read("../src/components/AuthResult.jsx"),
  nav = read("../src/hooks/useNavigation.js"),
  layout = read("../src/components/Layout.jsx"),
  quiz = read("../src/components/Quiz.jsx"),
  css = read("../src/style.css"),
  pkg = JSON.parse(read("../package.json"));
test("botao de auth result nao submete formulario", () =>
  assert.match(authResult, /<button type="button"/));
test("scroll respeita movimento reduzido", () => {
  assert.match(nav, /prefers-reduced-motion/);
  assert.match(layout, /prefers-reduced-motion/);
});
test("modal mais foi removido", () =>
  assert.doesNotMatch(layout, /mobile-more-dialog|dialogRef/));
test("questao atual fica somente no mapa", () =>
  assert.doesNotMatch(quiz, /data-current=/));
test("bordas laterais herdadas foram neutralizadas", () =>
  assert.match(css, /question\.incorrect\{border-left:0\}/));
test("tema claro cobre quiz e curriculo", () => {
  assert.match(css, /data-theme="light"[^}]*alternatives label/);
  assert.match(css, /data-theme="light"[^}]*curriculum-heading/);
});
test("mobile e landscape removem sticky do quiz", () => {
  assert.match(
    css,
    /@media\(max-width:700px\)[^{]*\{[^}]*|quiz-footer\{position:relative;bottom:auto\}/s,
  );
  assert.match(css, /max-height:560px/);
});
test("alternativas longas alinham pelo topo", () =>
  assert.match(css, /alternatives label\{align-items:flex-start\}/));
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
