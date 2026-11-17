import { existsSync, readdirSync, readFileSync } from "node:fs";
const required = [
  "README.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  ".env.example",
  ".gitignore",
  "docs",
];
for (const name of required)
  if (!existsSync(new URL(`../${name}`, import.meta.url)))
    throw new Error(`Arquivo obrigatório ausente: ${name}`);
const ignored = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
for (const pattern of ["node_modules/", "dist/", ".env", "coverage/"])
  if (!ignored.includes(pattern))
    throw new Error(`Padrão ausente no gitignore: ${pattern}`);
for (const name of readdirSync(new URL("..", import.meta.url)))
  if (/^\.env\./.test(name) && name !== ".env.example")
    throw new Error(`Ambiente sensível encontrado: ${name}`);
console.log("[OK] repositório preparado para publicação");
