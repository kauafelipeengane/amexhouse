import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const root = new URL("..", import.meta.url).pathname,
  read = (path) => readFileSync(join(root, path), "utf8"),
  app = read("src/App.jsx"),
  academy = read("src/lib/academy.js"),
  nav = read("src/hooks/useNavigation.js"),
  service = read("src/services/platform.js"),
  vercel = read("vercel.json");
const required = [
  "home",
  "courses",
  "notes",
  "saved",
  "progress",
  "activities",
  "goals",
  "certificate",
  "lesson",
];
for (const route of required)
  if (!new RegExp(`[\"']${route}[\"']`).test(nav))
    throw new Error(`Rota ausente: ${route}`);
for (const slug of [
  "python-do-basico-ao-avancado",
  "apis-identidade",
  "seguranca-web",
  "redes-protocolos",
  "projeto-final",
])
  if (!academy.includes(slug))
    throw new Error(`Slug acadêmico ausente: ${slug}`);
for (const component of [
  "Home",
  "Courses",
  "Lesson",
  "Notes",
  "Saved",
  "Progress",
  "Activities",
  "Goals",
  "Certificate",
])
  if (!app.includes(`<${component}`))
    throw new Error(`Componente não conectado: ${component}`);
if (!/\.eq\([\"']user_id[\"']\s*,\s*user\.id\)/.test(service))
  throw new Error("Defesa por usuário ausente");
if (!vercel.includes("Content-Security-Policy")) throw new Error("CSP ausente");
const names = new Set(readdirSync(root));
if (!names.has("README.md")) throw new Error("README ausente");
if (!names.has("docs")) throw new Error("Documentação ausente");
function listSql(dir) {
  const values = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) values.push(...listSql(path));
    else if (entry.name.endsWith(".sql")) values.push(entry.name);
  }
  return values;
}
const sqlFiles = existsSync(join(root, "supabase"))
  ? listSql(join(root, "supabase"))
  : [];
for (const requiredSql of [
  "EXPANSAO_PYTHON_01.sql",
  "AMEX_HOUSE_V1_0_1.sql",
  "AMEX_HOUSE_V1_1_0.sql",
  "AMEX_HOUSE_V1_2_0.sql",
  "AMEX_HOUSE_V1_3_0.sql",
  "AMEX_HOUSE_V1_3_1.sql",
  "AMEX_HOUSE_V1_4_0.sql",
  "AMEX_HOUSE_V1_4_1_SECURITY.sql",
  "AMEX_HOUSE_V1_5_0.sql",
  "AMEX_HOUSE_V1_5_1_THREE_ACADEMIES.sql",
  "AMEX_HOUSE_V1_5_2_THREE_ACADEMIES_FIXED.sql",
  "AMEX_HOUSE_V1_5_3_THREE_ACADEMIES_FIXED.sql",
  "AMEX_HOUSE_V1_5_4_THREE_ACADEMIES_FIXED.sql",
])
  if (!sqlFiles.includes(requiredSql))
    throw new Error(`SQL obrigatório ausente: ${requiredSql}`);
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (["node_modules", "dist", ".git"].includes(entry.name)) return [];
    return entry.isDirectory() ? walk(path) : [path];
  });
for (const path of walk(root)) {
  const rel = relative(root, path);
  if (/(^|\/)\.env(\.|$)/.test(rel) && rel !== ".env.example")
    throw new Error(`Ambiente sensível: ${rel}`);
  if (
    statSync(path).size >
    (rel.endsWith(".gif") ? 8 * 1024 * 1024 : 5 * 1024 * 1024)
  )
    throw new Error(`Arquivo excessivo: ${rel}`);
}
console.log(
  "[OK] revisão final: rotas, academias, componentes, segurança e limpeza",
);
