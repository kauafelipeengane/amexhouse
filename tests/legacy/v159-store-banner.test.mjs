import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url)),
  portal = read("../src/pages/Portal.jsx").toString(),
  store = read("../src/assets/portal/AMEX_STORE_X.webp"),
  pkg = JSON.parse(read("../package.json").toString());
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("portal mantém a bandeira AMEX Store", () => {
  assert.match(portal, /AMEX_STORE_X\.webp/);
  assert.match(portal, /route:'store'[\s\S]*?image:storeArt/);
});
test("arquivo animado da Store está íntegro", () => {
  assert.equal(store.subarray(0, 4).toString(), "RIFF");
  assert.equal(store.subarray(8, 12).toString(), "WEBP");
  assert.ok(store.length > 2_000_000);
});
