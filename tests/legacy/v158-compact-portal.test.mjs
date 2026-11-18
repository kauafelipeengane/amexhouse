import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  css = read("../src/pages/portal.css"),
  portal = read("../src/pages/Portal.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("desktop usa três colunas fluidas", () => {
  assert.match(css, /--portal-width:1480px/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /aspect-ratio:3\/2/);
});
test("portal permite rolagem e não força altura", () => {
  assert.match(css, /min-height:100dvh/);
  assert.match(css, /overflow-x:hidden/);
  assert.doesNotMatch(css, /(^|[;{])height:100dvh/);
});
test("tablet usa duas colunas e celular uma", () => {
  assert.match(
    css,
    /@media\(max-width:980px\)[\s\S]*grid-template-columns:repeat\(2/,
  );
  assert.match(
    css,
    /@media\(max-width:620px\)[\s\S]*grid-template-columns:1fr/,
  );
});
test("seis destinos permanecem", () => {
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
