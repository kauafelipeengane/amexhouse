import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  layout = read("../src/components/Layout.jsx"),
  css = read("../src/style.css"),
  pkg = JSON.parse(read("../package.json"));
test("barra inferior foi removida do JSX", () =>
  assert.doesNotMatch(layout, /bottom-nav/));
test("modal mais e estado foram removidos", () =>
  assert.doesNotMatch(layout, /mobile-more|setMore|dialogRef/));
test("menu lateral preserva todos os itens", () => {
  assert.match(layout, /items\.map/);
  assert.match(layout, /id="main-menu"/);
});
test("css removido nao deixa seletores orfaos", () =>
  assert.doesNotMatch(css, /\.bottom-nav|\.mobile-more/));
test("mobile usa padding inferior natural", () =>
  assert.match(
    css,
    /padding-bottom:max\(2rem,calc\(env\(safe-area-inset-bottom\) \+ 1\.5rem\)\)/,
  ));
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
