import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const lesson = read("../src/pages/Lesson.jsx"),
  workspace = read("../src/pages/Workspace.jsx"),
  utils = read("../src/lib/utils.js");
test("ações da aula bloqueiam concorrência", () =>
  assert.match(lesson, /if\(savingAction\)return/));
test("itens salvos informam origem", () =>
  assert.match(workspace, /Favorito.*Assistir depois/s));
test("atividades são ordenadas", () =>
  assert.match(workspace, /\.sort\(\(a,b\)=>b\.date-a\.date\)/));
test("rascunho vazio é removido", () =>
  assert.match(workspace, /storage\.remove\(draftKey\)/));
test("objetivos vazios têm fallback", () =>
  assert.match(lesson, /objetivos específicos desta aula/));
test("texto revisão não permanece no roteiro", () =>
  assert.doesNotMatch(lesson, /Avaliação e revisão/));
test("percentual possui normalização", () =>
  assert.match(utils, /safePercent/));
test("data possui validação reutilizável", () =>
  assert.match(utils, /validDate/));
