import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  portal = read("../src/pages/Portal.jsx"),
  layout = read("../src/components/Layout.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("banners exatos em seus cards", () => {
  for (const f of [
    "javascript-exato.webp",
    "data-exato.webp",
    "devops-exato.webp",
  ])
    assert.match(portal, new RegExp(f.replace(".", "\\.")));
});
test("ícones das academias no menu interno", () => {
  for (const f of [
    "academies/javascript.webp",
    "academies/data.webp",
    "academies/devops.webp",
  ])
    assert.match(layout, new RegExp(f.replace(".", "\\.")));
  assert.match(layout, /academy==='javascript'\?javascriptLogo/);
  assert.match(layout, /academy==='data'\?dataLogo/);
  assert.match(layout, /academy==='devops'\?devopsLogo/);
});
test("seis animações otimizadas", () => {
  for (const f of [
    "portal/javascript-exato.webp",
    "portal/data-exato.webp",
    "portal/devops-exato.webp",
    "academies/javascript.webp",
    "academies/data.webp",
    "academies/devops.webp",
  ]) {
    const b = readFileSync(new URL(`../src/assets/${f}`, import.meta.url));
    assert.equal(b.subarray(0, 4).toString(), "RIFF");
    assert.ok(
      statSync(new URL(`../src/assets/${f}`, import.meta.url)).size < 2_500_000,
    );
  }
});
