import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const check = readFileSync(
  new URL("../scripts/check-build.mjs", import.meta.url),
  "utf8",
);
test("orcamento CSS comporta o bundle atual sem ficar ilimitado", () => {
  assert.match(check, /'.css':190\*1024/);
  assert.doesNotMatch(check, /'.css':(?:[3-9]\d\d|\d{4,})\*1024/);
});
