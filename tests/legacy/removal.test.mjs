import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const app = read("../src/App.jsx"),
  layout = read("../src/components/Layout.jsx"),
  service = read("../src/services/platform.js"),
  workspace = read("../src/pages/Workspace.jsx"),
  home = read("../src/pages/Home.jsx"),
  hook = read("../src/hooks/usePlatform.js");
test("revisões removidas do menu", () =>
  assert.doesNotMatch(layout, /REVISÕES|reviews/));
test("rota de revisões removida", () =>
  assert.doesNotMatch(app, /Reviews|reviews/));
test("consulta de revisão removida", () =>
  assert.doesNotMatch(service, /review_schedule|completeReview/));
test("componente de revisão removido", () =>
  assert.doesNotMatch(workspace, /function Reviews/));
test("métrica de revisão removida", () =>
  assert.doesNotMatch(home, /Revisões|data\.reviews/));
test("estado global sem revisões", () => assert.doesNotMatch(hook, /reviews/));
test("meta recebe refresh", () =>
  assert.match(app, /Goals data=\{scoped\} refresh=\{refresh\}/));
test("corrida de requests bloqueada", () =>
  assert.match(hook, /current!==request\.current/));
