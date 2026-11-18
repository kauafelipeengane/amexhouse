import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
const root = new URL("..", import.meta.url).pathname,
  skip = new Set([
    ".git",
    "node_modules",
    "dist",
    ".vercel",
    "coverage",
    "tests",
  ]),
  textExt = new Set([
    ".js",
    ".jsx",
    ".mjs",
    ".json",
    ".sql",
    ".md",
    ".css",
    ".yml",
    ".yaml",
    ".html",
    ".example",
  ]),
  issues = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (
      textExt.has(extname(entry.name)) ||
      entry.name === ".env.example"
    ) {
      const s = readFileSync(p, "utf8");
      if (
        /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}/.test(
          s,
        )
      )
        issues.push(`segredo potencial: ${p}`);
      if (
        /dangerouslySetInnerHTML|document\.write\(|\beval\(|new Function\(/.test(
          s,
        ) &&
        !p.includes("/scripts/")
      )
        issues.push(`sink perigoso: ${p}`);
    }
  }
}
walk(root);
function collectSql(dir) {
  const values = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) values.push(...collectSql(path));
    else if (entry.name.endsWith(".sql"))
      values.push(readFileSync(path, "utf8"));
  }
  return values;
}
const sql = collectSql(join(root, "supabase")).join("\n");
for (const table of [
  "lesson_videos",
  "lesson_resources",
  "lesson_exercises",
  "quiz_attempt_sessions",
  "security_events",
]) {
  if (
    !new RegExp(
      `alter table public\\.${table} enable row level security`,
      "i",
    ).test(sql)
  )
    issues.push(`RLS ausente: ${table}`);
  if (
    !new RegExp(
      `alter table public\\.${table} force row level security`,
      "i",
    ).test(sql)
  )
    issues.push(`FORCE RLS ausente: ${table}`);
}
if (
  !/alter default privileges[\s\S]*revoke all on tables from anon, authenticated/i.test(
    sql,
  )
)
  issues.push("default privileges de tabelas não endurecidos");
if (issues.length) throw new Error(issues.join("\n"));
console.log(
  "[OK] security audit: segredos, sinks, RLS, FORCE RLS e default privileges verificados",
);
