import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, extname } from "node:path";
const root = new URL("../dist", import.meta.url).pathname;
const raw = { ".js": 230*1024, ".css": 232*1024, ".png": 500*1024, ".jpg": 350*1024, ".jpeg": 350*1024, ".webp": 3*1024*1024, ".gif": 8*1024*1024 };
const gzip = { ".css": 45*1024, ".js": 65*1024 };
let largest={path:"",size:0};
for(const name of readdirSync(join(root,"assets"))){const path=join(root,"assets",name),size=statSync(path).size,ext=extname(name).toLowerCase();if(size>largest.size)largest={path:name,size};if(raw[ext]&&size>raw[ext])throw new Error(`Orçamento bruto excedido: ${name} (${size} bytes)`);if(gzip[ext]){const packed=gzipSync(readFileSync(path),{level:9}).byteLength;if(packed>gzip[ext])throw new Error(`Orçamento gzip excedido: ${name} (${packed} bytes)`);}}
console.log(`[OK] orçamento bruto e gzip; maior arquivo: ${largest.path} (${largest.size} bytes)`);
