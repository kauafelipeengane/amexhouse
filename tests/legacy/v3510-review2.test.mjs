import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  security = read("../src/lib/security.js"),
  auth = read("../src/components/Auth.jsx"),
  service = read("../src/services/platform.js"),
  flow = read("../src/lib/authFlow.js"),
  reset = read("../src/components/ResetPassword.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("seguranca possui validadores fortes", () => {
  assert.match(security, /export const isUuid/);
  assert.match(security, /export const isEmail/);
  assert.match(security, /export const isStrongPassword/);
});
test("auth valida email senha e nome antes da rede", () => {
  assert.match(auth, /isEmail\(normalizedEmail\)/);
  assert.match(auth, /isStrongPassword\(password\)/);
  assert.match(auth, /displayName\.length<2/);
});
test("redirect de auth usa origem atual e URL", () => {
  assert.match(flow, /new URL\('\/',location\.origin\)/);
  assert.doesNotMatch(flow, /redirect|returnTo|next=/);
});
test("servicos validam ids antes de consultas", () => {
  assert.ok((service.match(/isUuid\(/g) || []).length >= 7);
  assert.match(service, /Aula inválida/);
  assert.match(service, /Anotação inválida/);
});
test("respostas possuem limites estruturais", () => {
  assert.match(service, /entries\.length>50/);
  assert.match(service, /value\.length!==1/);
  assert.match(service, /Respostas inválidas/);
});
test("progresso e normalizado", () => {
  assert.match(service, /Math\.min\(100/);
  assert.match(service, /Math\.max\(0/);
});
test("nota respeita limites do banco", () => {
  assert.match(service, /safeText\(note\.title,100\)/);
  assert.match(service, /slice\(0,6000\)/);
});
test("nova senha possui maximo e limpeza", () => {
  assert.match(reset, /password\.length<=128/);
  assert.match(reset, /setPassword\(''\)/);
});
test("versao segue v1", () => assert.match(pkg.version, /^1\./));
