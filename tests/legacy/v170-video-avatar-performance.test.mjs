import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  profile = read("../src/components/Profile.jsx"),
  portal = read("../src/pages/Portal.jsx"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_7_0_VIDEOS_AVATAR.sql"),
  audit = read("../supabase/archive/AMEX_HOUSE_V1_7_0_AUDITORIA_CURSOS.sql"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("avatar seguro de 1 MB", () => {
  assert.match(profile, /1024\*1024/);
  assert.match(sql, /1048576/);
  assert.match(sql, /values\('avatars','avatars',false/);
  assert.match(sql, /storage\.foldername/);
});
test("toda aula publicada exige vídeo", () => {
  assert.match(sql, /aulas publicadas sem vídeo válido/);
  assert.match(audit, /aula sem vídeo/);
});
test("WebP animado otimizado", () => {
  for (const f of [
    "javascript-exato.webp",
    "data-exato.webp",
    "devops-exato.webp",
  ]) {
    assert.match(portal, new RegExp(f.replace(".", "\\.")));
    assert.ok(
      statSync(new URL(`../src/assets/portal/${f}`, import.meta.url)).size <
        2_000_000,
    );
  }
});
test("GIFs antigos removidos", () => {
  for (const f of [
    "AMEX_JAVASCRIPT_REVISADO_V3.gif",
    "AMEX_DATA_REVISADO_V3.gif",
    "AMEX_OPS_REVISADO_V3.gif",
    "AMEX_JAVASCRIPT_X.gif",
    "AMEX_DEVOPS_X.gif",
  ])
    assert.equal(
      existsSync(new URL(`../src/assets/portal/${f}`, import.meta.url)),
      false,
    );
});
test("auditoria estrutural completa", () => {
  for (const x of [
    "curso sem módulos",
    "módulo sem aulas",
    "posição de módulo duplicada",
    "posição de aula duplicada",
  ])
    assert.match(audit, new RegExp(x));
});
