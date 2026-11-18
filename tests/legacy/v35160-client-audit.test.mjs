import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  main = read("../src/main.jsx"),
  profile = read("../src/components/Profile.jsx"),
  session = read("../src/hooks/useSession.js"),
  ui = read("../src/components/ui.jsx"),
  workspace = read("../src/pages/Workspace.jsx"),
  nav = read("../src/hooks/useNavigation.js"),
  pkg = JSON.parse(read("../package.json"));
test("listener de tema possui limpeza em HMR", () => {
  assert.match(main, /const stopSystemTheme=watchSystemTheme\(\)/);
  assert.match(main, /import\.meta\.hot\.dispose\(stopSystemTheme\)/);
});
test("perfil sincroniza nome quando sessao muda", () => {
  assert.match(profile, /useEffect/);
  assert.match(profile, /if\(!editing\)setName/);
  assert.match(profile, /user\.user_metadata\?\.display_name/);
});
test("sessao inicial nao sobrescreve evento novo", () => {
  assert.match(session, /authEventSeen=false/);
  assert.match(session, /!authEventSeen/);
  assert.match(session, /authEventSeen=true/);
});
test("skeleton e decorativo para leitor de tela", () => {
  assert.match(ui, /loading-title" aria-hidden="true"/);
  assert.match(ui, /loading-grid" aria-hidden="true"/);
});
test("curso vazio nao aparece como nao iniciado", () =>
  assert.match(workspace, /SEM AULAS PUBLICADAS/));
test("scroll restaurado possui limite seguro", () =>
  assert.match(nav, /Math\.min\(Math\.max\(0,Number/));
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
