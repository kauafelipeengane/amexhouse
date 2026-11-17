import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  portal = read("../src/pages/Portal.jsx"),
  pkg = JSON.parse(read("../package.json"));
const gif = (p) => readFileSync(new URL(p, import.meta.url));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
for (const [name, file, ref] of [
  ["JavaScript", "javascript-exato.webp", "javascriptArt"],
  ["Data", "data-exato.webp", "dataArt"],
  ["Ops", "devops-exato.webp", "devopsArt"],
])
  test(`${name} usa arte animada revisada`, () => {
    assert.match(portal, new RegExp(file.replace(".", "\\.")));
    assert.match(portal, new RegExp(`image:${ref}`));
    const b = gif(`../src/assets/portal/${file}`);
    assert.equal(b.subarray(0, 4).toString(), "RIFF");
    assert.ok(b.length > 100_000);
  });
test("nenhum CSS ou layout experimental foi recriado", () =>
  assert.doesNotMatch(
    portal,
    /academy-card__content|portal-welcome|design-slot/,
  ));
