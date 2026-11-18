import test from "node:test";
import assert from "node:assert/strict";
const { sanitizeYoutubeId } = await import("../src/lib/utils.js");
test("aceita id valido do YouTube", () =>
  assert.equal(sanitizeYoutubeId("dQw4w9WgXcQ"), "dQw4w9WgXcQ"));
test("rejeita URL completa", () =>
  assert.equal(
    sanitizeYoutubeId("https://youtube.com/watch?v=dQw4w9WgXcQ"),
    "",
  ));
test("rejeita caracteres inseguros", () =>
  assert.equal(sanitizeYoutubeId("<script>x</script>"), ""));
