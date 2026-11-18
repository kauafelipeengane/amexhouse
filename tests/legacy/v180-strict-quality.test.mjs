import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  portal = read("../src/pages/Portal.jsx"),
  portalCss = read("../src/pages/portal.css"),
  lazy = read("../src/components/LazyAnimatedArtwork.jsx"),
  sql = read("../supabase/active/01_AVALIACOES_TECNICAS_V1_8_3.sql"),
  legacy = read("../supabase/archive/AMEX_HOUSE_V1_7_4_CONTEUDO_COMPLETO.sql"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("portal carrega animações quando entram no viewport", () => {
  assert.match(portal, /LazyAnimatedArtwork/);
  assert.match(lazy, /IntersectionObserver/);
  assert.match(lazy, /rootMargin:'180px 0px'/);
});
test("movimento reduzido é respeitado", () => {
  assert.match(lazy, /prefers-reduced-motion/);
  assert.match(portalCss, /@media\(prefers-reduced-motion:reduce\)/);
});
test("CSS do portal não depende de important", () =>
  assert.doesNotMatch(portalCss, /!important/));
test("portal possui uma única grade responsiva", () => {
  assert.equal((portalCss.match(/\.portal-flags\{/g) || []).length, 3);
  assert.match(portalCss, /grid-template-columns:repeat\(3/);
  assert.match(portalCss, /grid-template-columns:repeat\(2/);
  assert.match(portalCss, /grid-template-columns:1fr/);
});
test("banco de questões contém conteúdo técnico verificável", () => {
  for (const x of [
    "useState",
    "GROUP BY",
    "Dockerfile",
    "kubectl get pods",
    "error budget",
    "Canary release",
  ])
    assert.match(sql, new RegExp(x));
  assert.match(sql, /Auditoria editorial falhou/);
});
test("migração genérica anterior está bloqueada", () => {
  assert.match(legacy, /MIGRAÇÃO SUPERADA/);
  assert.doesNotMatch(legacy, /generate_series/);
});
test("cabeçalho usa identidade da academia", () => {
  for (const x of [
    "area==='javascript'?javascriptArt",
    "area==='data'?dataArt",
    "area==='devops'?devopsArt",
  ])
    assert.match(portal, new RegExp(x.replace(/[?]/g, "\\?")));
});
