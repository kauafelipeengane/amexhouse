import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  auth = read("../src/components/Auth.jsx"),
  errors = read("../src/lib/authErrors.js"),
  css = read("../src/components/auth.css");
test("auth usa tradutor centralizado", () => {
  assert.match(auth, /authErrorMessage/);
  assert.match(auth, /catch\(error\)/);
});
test("login não enumera conta", () => {
  assert.match(errors, /E-mail ou senha incorretos/);
  assert.doesNotMatch(errors, /E-mail não encontrado|conta não encontrada/i);
});
test("erros conhecidos possuem mensagens específicas", () => {
  for (const x of [
    "Confirme seu e-mail",
    "Muitas tentativas",
    "Já existe uma conta",
    "senha não atende",
    "cadastros estão temporariamente",
  ])
    assert.match(errors, new RegExp(x, "i"));
});
test("recuperação preserva resposta anti-enumeração", () =>
  assert.match(errors, /Se a conta existir, as instruções serão enviadas/));
test("rede e serviço possuem feedback próprio", () => {
  assert.match(errors, /Sem conexão/);
  assert.match(errors, /serviço de acesso está indisponível/);
});
test("mensagem possui apresentação legível", () => {
  const v = css.slice(css.lastIndexOf("V36"));
  assert.match(v, /border-left:3px solid var\(--danger\)/);
  assert.match(v, /line-height:1\.5/);
  assert.match(v, /:empty\{display:none/);
});
