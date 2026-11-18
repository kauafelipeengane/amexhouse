import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8"),
  sql = read("../supabase/archive/AMEX_HOUSE_V1_5_1_THREE_ACADEMIES.sql"),
  academy = read("../src/lib/academy.js"),
  portal = read("../src/pages/Portal.jsx"),
  nav = read("../src/hooks/useNavigation.js"),
  pkg = JSON.parse(read("../package.json"));
test("versao 1.10.0", () => assert.equal(pkg.version, "1.10.0"));
test("três novas academias integradas", () => {
  for (const x of ["javascript", "data", "devops"]) {
    assert.match(academy, new RegExp(`${x}:`));
    assert.match(nav, new RegExp(`'${x}'`));
    assert.match(portal, new RegExp(`academy/${x}/courses`));
  }
});
test("cada formação possui nove cursos de quarenta horas", () => {
  for (const prefix of ["javascript", "data", "devops"])
    assert.equal(
      (
        academy
          .match(
            new RegExp(
              `title:'AMEX ${prefix === "javascript" ? "JAVASCRIPT" : prefix === "devops" ? "OPS" : prefix.toUpperCase()}'[\\s\\S]*?courseSlugs:\\[([^\\]]+)\\]`,
            ),
          )?.[1]
          .match(/'/g) || []
      ).length / 2,
      9,
    );
  assert.equal(
    (sql.match(/workload_hours,status,position\) values/g) || []).length,
    27,
  );
  assert.equal((sql.match(/,40,'published'/g) || []).length, 27);
});
test("conteúdo tem 108 módulos e 540 aulas", () => {
  assert.equal(
    (sql.match(/insert into public\.course_modules/g) || []).length,
    108,
  );
  assert.equal((sql.match(/insert into public\.lessons/g) || []).length, 540);
});
test("carga total é 360 horas por formação", () => {
  const hours = (sql.match(/,2,'\[/g) || []).length * 2;
  assert.equal(hours, 1080);
});
test("certificados e metas aceitam novas formações", () => {
  assert.match(sql, /study_goals_academy_check/);
  assert.match(sql, /certificates_academy_check/);
  assert.match(sql, /amex_admin_issue_certificate/);
  assert.match(
    sql,
    /target_academy not in\('pentest','python','javascript','data','devops'\)/,
  );
});
test("insights suportam cinco formações", () =>
  assert.match(sql, /amex_my_learning_insights/));
