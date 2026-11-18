import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  profile = read("../src/components/Profile.jsx"),
  vercel = read("../vercel.json"),
  sql = read("../supabase/active/01_AVALIACOES_TECNICAS_V1_8_3.sql"),
  audit = read("../supabase/audits/AMEX_HOUSE_V1_7_4_AUDITORIA_FINAL.sql"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("CSP permite imagem do Supabase", () =>
  assert.match(vercel, /img-src[^;]*https:\/\/\*\.supabase\.co/));
test("avatar renova URL assinada no carregamento", () => {
  assert.match(profile, /avatar_path/);
  assert.match(profile, /createSignedUrl\(path,3600\)/);
  assert.doesNotMatch(profile, /avatar_url:url/);
});
test("migração técnica cobre questões e alternativas", () => {
  for (const x of [
    "amex_questions",
    "amex_alternatives",
    "jsonb_array_elements_text",
    "Auditoria editorial falhou",
  ])
    assert.match(sql, new RegExp(x));
});
test("migração é idempotente e transacional", () => {
  assert.match(sql, /on conflict\(quiz_id,position\)/);
  assert.match(sql, /on conflict\(question_id,position\)/);
  assert.match(sql, /^begin;$/m);
  assert.match(sql, /^commit;$/m);
});
test("auditoria final cobre toda a estrutura", () => {
  for (const x of [
    "sem vídeo válido",
    "sem avaliação",
    "menos de 3 questões",
    "sem 4 alternativas",
    "exatamente 1 resposta correta",
    "Módulo sem aula",
  ])
    assert.match(audit, new RegExp(x));
});
