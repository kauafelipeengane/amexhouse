import test from "node:test";
import assert from "node:assert/strict";
global.localStorage = {
  data: new Map(),
  getItem(k) {
    return this.data.has(k) ? this.data.get(k) : null;
  },
  setItem(k, v) {
    this.data.set(k, String(v));
  },
  removeItem(k) {
    this.data.delete(k);
  },
};
const { asArray, sanitizeYoutubeId, formatDate, formatTime, clamp, storage } =
  await import("../src/lib/utils.js");
test("asArray protege valores nulos", () =>
  assert.deepEqual(asArray(null), []));
test("youtube id invalido e rejeitado", () =>
  assert.equal(sanitizeYoutubeId("abc\\"), ""));
test("data inválida possui fallback", () =>
  assert.equal(formatDate("inválida"), "Data não disponível"));
test("tempo é formatado", () => assert.equal(formatTime(65), "1:05"));
test("clamp limita percentual", () => assert.equal(clamp(110), 100));
test("storage persiste e remove", () => {
  assert.equal(storage.set("x", "1"), true);
  assert.equal(storage.get("x"), "1");
  assert.equal(storage.remove("x"), true);
});
