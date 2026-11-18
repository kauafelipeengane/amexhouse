import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  app = read("../src/App.jsx"),
  home = read("../src/pages/Home.jsx"),
  auth = read("../src/components/Auth.jsx"),
  prefs = read("../src/lib/preferences.js"),
  main = read("../src/main.jsx"),
  video = read("../src/components/VideoPlayer.jsx"),
  service = read("../src/services/platform.js"),
  workspace = read("../src/pages/Workspace.jsx"),
  flow = read("../src/lib/authFlow.js"),
  pkg = JSON.parse(read("../package.json"));
test("rotas publicas reagem ao hash", () => {
  assert.match(app, /publicRoute,setPublicRoute/);
  assert.match(app, /addEventListener\('hashchange',sync\)/);
});
test("home prioriza aula em andamento ou nao concluida", () => {
  assert.match(home, /status==='in_progress'/);
  assert.match(home, /status==='completed'/);
});
test("cadastro usa nome ja validado", () => {
  assert.match(auth, /display_name:displayName/);
  assert.doesNotMatch(auth, /display_name:safeText/);
});
test("tema do sistema acompanha mudancas", () => {
  assert.match(prefs, /watchSystemTheme/);
  assert.match(prefs, /addEventListener\?\.\('change'/);
  assert.match(main, /watchSystemTheme\(\)/);
});
test("preferencias rejeitam array armazenado", () =>
  assert.match(prefs, /!Array\.isArray\(parsed\)/));
test("video usa allowlist de url", () => {
  assert.match(video, /safeExternalUrl/);
  assert.match(video, /primaryUrl&&<a href=\{primaryUrl\}/);
});
test("nota valida id em edicao", () =>
  assert.match(service, /note\.id&&!isUuid\(note\.id\)/));
test("nota sempre libera busy", () =>
  assert.match(workspace, /finally\{setBusy\(''\)\}/));
test("erro de auth e retirado da url", () => {
  assert.match(flow, /delete\('error_description'\)/);
  assert.match(flow, /history\.replaceState/);
});
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
