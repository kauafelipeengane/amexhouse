import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  layout = read("../src/components/Layout.jsx"),
  css = read("../src/style.css"),
  pkg = JSON.parse(read("../package.json")),
  final = css.slice(css.lastIndexOf("V35.12.1"));
test("controle fica dentro do cabecalho", () => {
  assert.match(layout, /sidebar-header-actions/);
  assert.match(layout, /sidebar-toggle-icon/);
  assert.match(layout, /drawer-close[^<]*<\/button><\/div><\/header>/);
});
test("controle nao usa setas", () =>
  assert.doesNotMatch(layout, /collapsed\?'→':'←'|collapsed\?'›':'‹'/));
test("icone representa painel", () => {
  assert.match(final, /grid-template-columns:6px 1fr/);
  assert.match(final, /aria-pressed="true"/);
});
test("botao nao fica absoluto ou externo", () => {
  assert.match(final, /position:static/);
  assert.doesNotMatch(final, /right:-/);
});
test("estado recolhido permanece visivel", () => {
  assert.match(final, /shell\.is-collapsed \.brand\{display:none/);
  assert.match(final, /shell\.is-collapsed \.collapse-button/);
});
test("mobile usa drawer close", () =>
  assert.match(
    final,
    /@media\(max-width:850px\)[^{]*\{\.collapse-button\{display:none\}/,
  ));
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
