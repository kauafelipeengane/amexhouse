import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  css = read("../src/style.css"),
  lesson = read("../src/pages/Lesson.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("linha vertical de questão foi removida", () => {
  assert.match(css, /border-left:0/);
  assert.match(css, /question:focus-within:before\{display:none\}/);
});
test("questao atual tem texto branco explicito", () => {
  assert.match(
    css,
    /aria-current="step"[^}]*background:#007f4a[^}]*color:#fff/,
  );
  assert.match(css, /aria-current="step"\] span\{color:#fff/);
});
test("tema claro tem contraste dedicado", () => {
  assert.match(css, /data-theme="light"[^}]*quiz-overview nav button\.current/);
  assert.match(css, /background:#006f41/);
  assert.match(css, /color:#102018/);
});
test("navegacao interna redundante foi removida", () => {
  assert.doesNotMatch(css, /lesson-jump/);
  assert.doesNotMatch(lesson, /className="lesson-jump"/);
});
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
