import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
const logo = readFileSync(
    new URL("../src/assets/logo-static.webp", import.meta.url),
  ),
  favicon = readFileSync(new URL("../public/favicon.webp", import.meta.url)),
  pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
test("logo estático possui assinatura WebP", () =>
  assert.equal(logo.subarray(8, 12).toString("ascii"), "WEBP"));
test("favicon usa o mesmo ativo otimizado", () =>
  assert.deepEqual(logo, favicon));
test("marca possui orçamento leve", () =>
  assert.ok(
    statSync(new URL("../src/assets/logo-static.webp", import.meta.url)).size <
      50_000,
  ));
test("gif pesado foi removido", () => {
  assert.equal(
    existsSync(new URL("../src/assets/logo.gif", import.meta.url)),
    false,
  );
  assert.equal(
    existsSync(new URL("../public/favicon.gif", import.meta.url)),
    false,
  );
});
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
