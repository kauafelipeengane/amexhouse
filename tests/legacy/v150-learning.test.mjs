import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_5_0.sql"),
  app = read("../src/App.jsx"),
  nav = read("../src/hooks/useNavigation.js"),
  layout = read("../src/components/Layout.jsx"),
  insights = read("../src/pages/Insights.jsx"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("competencias possuem RLS forçada", () => {
  for (const t of ["competencies", "lesson_competencies"]) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${t} enable row level security`),
    );
    assert.match(
      sql,
      new RegExp(`alter table public\\.${t} force row level security`),
    );
  }
});
test("insights pertencem ao usuário autenticado", () => {
  assert.match(sql, /actor uuid:=auth\.uid\(\)/);
  assert.match(sql, /qa\.user_id=actor/);
  assert.match(sql, /lp\.user_id=actor/);
});
test("rpc limita histórico", () => assert.match(sql, /limit 50/));
test("rota desempenho está integrada", () => {
  assert.match(nav, /'insights'/);
  assert.match(layout, /DESEMPENHO/);
  assert.match(app, /section==='insights'/);
});
test("tela possui estados loading error vazio e sucesso", () => {
  for (const x of [
    "'loading'",
    "'error'",
    "Nenhuma avaliação realizada",
    "MAPA DE COMPETÊNCIAS",
    "Recomendações personalizadas",
  ])
    assert.match(insights, new RegExp(x));
});
test("rpc não revela respostas nem gabarito", () => {
  const fn = sql.slice(sql.indexOf("amex_my_learning_insights"));
  assert.doesNotMatch(fn, /answers|is_correct|submitted_answers/);
});
