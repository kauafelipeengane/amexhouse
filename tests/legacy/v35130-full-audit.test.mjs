import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  app = read("../src/App.jsx"),
  legal = read("../src/pages/Legal.jsx"),
  auth = read("../src/components/Auth.jsx"),
  profile = read("../src/components/Profile.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("paginas legais existem novamente", () =>
  assert.ok(existsSync(new URL("../src/pages/Legal.jsx", import.meta.url))));
test("rotas legais sao publicas", () => {
  assert.match(app, /legal==='privacy'/);
  assert.match(app, /PrivacyPolicy/);
  assert.match(app, /TermsOfUse/);
});
test("login e perfil possuem acesso legal", () => {
  assert.match(auth, /#\/privacy/);
  assert.match(auth, /#\/terms/);
  assert.match(profile, /profile-legal/);
});
test("controlador e contato permanecem preenchidos", () => {
  assert.match(legal, /Kauã Felipe Engane/);
  assert.match(legal, /Quauaeng@gmail\.com/);
});
test("politica cobre direitos retencao e armazenamento local", () => {
  for (const x of [
    "Direitos",
    "Retenção",
    "Armazenamento local",
    "Compartilhamento",
  ])
    assert.match(legal, new RegExp(x));
});
test("termos cobrem conta uso conteúdo e disponibilidade", () => {
  for (const x of [
    "Conta e segurança",
    "Uso permitido",
    "Conteúdo e propriedade intelectual",
    "Disponibilidade",
  ])
    assert.match(legal, new RegExp(x));
});
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
