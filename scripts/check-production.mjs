import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
const root = new URL("..", import.meta.url).pathname,
  config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")),
  env = readFileSync(join(root, ".env.example"), "utf8"),
  requiredHeaders = [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Cross-Origin-Opener-Policy",
    "Cross-Origin-Resource-Policy",
  ],
  headers =
    config.headers?.find((item) => item.source === "/(.*)")?.headers ?? [],
  names = new Set(headers.map((item) => item.key));
for (const name of requiredHeaders)
  if (!names.has(name)) throw new Error(`Header obrigatório ausente: ${name}`);
const csp =
  headers.find((item) => item.key === "Content-Security-Policy")?.value ?? "";
for (const directive of [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "worker-src 'none'",
])
  if (!csp.includes(directive)) throw new Error(`CSP incompleta: ${directive}`);
if (
  !config.rewrites?.some(
    (item) => item.source === "/(.*)" && item.destination === "/index.html",
  )
)
  throw new Error("Fallback SPA ausente");
if (
  !/VITE_SUPABASE_URL=/.test(env) ||
  !/VITE_SUPABASE_PUBLISHABLE_KEY=/.test(env)
)
  throw new Error("Exemplo de ambiente incompleto");
if (/sb_secret_|service_role|eyJ[A-Za-z0-9_-]{20,}/i.test(env))
  throw new Error("Credencial privada no exemplo de ambiente");
const forbiddenNames = new Set([
    ".env",
    ".env.local",
    ".env.production",
    ".env.staging",
  ]),
  walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (
        ["node_modules", "dist", ".git"].includes(entry.name) ||
        entry.name.endsWith(".zip") ||
        entry.name.endsWith(".bundle")
      )
        return [];
      return entry.isDirectory() ? walk(path) : [path];
    });
for (const path of walk(root)) {
  if (forbiddenNames.has(path.split("/").at(-1)))
    throw new Error(`Arquivo sensível: ${relative(root, path)}`);
  if (
    statSync(path).size >
      (path.endsWith(".gif") ? 8 * 1024 * 1024 : 5 * 1024 * 1024) &&
    ![".zip"].includes(extname(path))
  )
    throw new Error(`Ativo excessivo: ${relative(root, path)}`);
}
console.log(
  "[OK] produção validada: headers, CSP, SPA, ambiente e arquivos sensíveis",
);
