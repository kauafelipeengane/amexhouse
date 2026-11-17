import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  layout = read("../src/components/Layout.jsx"),
  auth = read("../src/components/Auth.jsx"),
  profile = read("../src/components/Profile.jsx"),
  prefs = read("../src/lib/preferences.js"),
  css = read("../src/style.css"),
  pkg = JSON.parse(read("../package.json"));
test("logo usa quadro estatico otimizado", () => {
  assert.match(layout, /logo-static\.webp/);
  assert.match(auth, /logo-static\.webp/);
  assert.ok(
    statSync(new URL("../src/assets/logo-static.webp", import.meta.url)).size <
      50_000,
  );
});
test("movimento da interface continua configuravel", () => {
  assert.match(css, /data-motion="reduced"/);
  assert.match(prefs, /reduceMotion/);
});
test("preferencias sao normalizadas e persistidas", () => {
  assert.match(prefs, /normalizePreferences/);
  assert.match(prefs, /defaultPreferences=Object\.freeze/);
  assert.match(prefs, /return saved/);
});
test("controles removidos não deixam restaurar padrões órfão", () => {
  assert.doesNotMatch(
    profile,
    /resetPreferences|defaultPreferences|Padrões restaurados/,
  );
});
test("falha de armazenamento possui feedback", () =>
  assert.match(profile, /não pôde ser salva neste dispositivo/));
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
