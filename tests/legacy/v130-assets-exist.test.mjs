import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const file of ["src/pages/Portal.jsx", "src/pages/Store.jsx"])
  test(`assets importados existem: ${file}`, () => {
    const source = readFileSync(resolve(root, file), "utf8");
    for (const match of source.matchAll(
      /from['"](\.\.\/assets\/[^'"]+)['"]/g,
    )) {
      const asset = resolve(dirname(resolve(root, file)), match[1]);
      assert.ok(
        existsSync(asset),
        `Ativo ausente ou com caixa incorreta: ${match[1]}`,
      );
    }
  });
