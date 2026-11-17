import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
const root = new URL("..", import.meta.url).pathname,
  skip = new Set(["node_modules", "dist", ".git"]),
  files = [];
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = join(dir, e.name);
    e.isDirectory() ? walk(p) : files.push(p);
  }
}
walk(root);
const textFiles = files.filter((p) =>
  [
    ".js",
    ".jsx",
    ".mjs",
    ".css",
    ".json",
    ".html",
    ".example",
    ".sql",
  ].includes(extname(p)),
);
for (const p of textFiles) {
  const t = readFileSync(p, "utf8");
  if (t.includes("\0")) throw new Error(`NUL em ${relative(root, p)}`);
  if (
    p !== new URL(import.meta.url).pathname &&
    new RegExp(["<".repeat(7), "=".repeat(7), ">".repeat(7)].join("|")).test(t)
  )
    throw new Error(`Conflito Git em ${relative(root, p)}`);
}
for (const p of files.filter((p) =>
  [".js", ".jsx", ".mjs"].includes(extname(p)),
)) {
  const t = readFileSync(p, "utf8");
  for (const m of t.matchAll(/from\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const base = resolve(dirname(p), m[1]),
      candidates = [
        base,
        base + ".js",
        base + ".jsx",
        base + ".mjs",
        join(base, "index.js"),
        join(base, "index.jsx"),
      ];
    if (!candidates.some(existsSync))
      throw new Error(`Import ausente em ${relative(root, p)}: ${m[1]}`);
  }
}
const portal = readFileSync(join(root, "src/pages/Portal.jsx"), "utf8"),
  pcss = readFileSync(join(root, "src/pages/portal.css"), "utf8");
for (const href of [
  "#/academy/pentest/courses",
  "#/academy/python/courses",
  "#/store",
])
  if (!portal.includes(href)) throw new Error(`Destino ausente: ${href}`);
if (/preventDefault\(\).*navigate\(a\.route\)/s.test(portal))
  throw new Error("Link nativo das bandeiras foi cancelado");
if (!/\.portal-card\s*\{[^}]*display\s*:\s*block/.test(pcss))
  throw new Error("Clique da bandeira não garantido");
if (!/portal-flag-cloth\s*>\s*i[^}]*pointer-events\s*:\s*none/.test(pcss))
  throw new Error("Camada decorativa pode interceptar clique");
const platform = readFileSync(join(root, "src/hooks/usePlatform.js"), "utf8"),
  field = readFileSync(join(root, "src/components/AuthField.jsx"), "utf8"),
  app = readFileSync(join(root, "src/App.jsx"), "utf8");
if (
  !/mounted\.current\s*=\s*true;[\s\S]*return\s*\(\)\s*=>\s*\{\s*mounted\.current\s*=\s*false/.test(
    platform,
  )
)
  throw new Error("Ciclo mounted incompatível com StrictMode");
if (/aria-invalid="false"/.test(field))
  throw new Error("Validade acessível estática e enganosa");
if (/sessionEvent==='SIGNED_IN'.*location\.hash='#\/portal'/s.test(app))
  throw new Error("Evento recorrente de sessão força navegação");
const prod = readFileSync(join(root, "scripts/check-production.mjs"), "utf8");
if (
  !(
    prod.includes('path.endsWith(".gif")') &&
    prod.includes("8 * 1024 * 1024") &&
    prod.includes("5 * 1024 * 1024")
  )
)
  throw new Error("Limite de ativos não-GIF enfraquecido");
console.log(
  `[OK] auditoria profunda: ${files.length} arquivos, ${textFiles.length} textos, imports relativos e destinos verificados`,
);
