import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
const root=new URL('../',import.meta.url).pathname,src=join(root,'src'),files=[];
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else if(['.js','.jsx'].includes(extname(e.name)))files.push(p)}}
walk(src);
const contents=new Map(files.map(p=>[p,readFileSync(p,'utf8')]));
const combined=[...contents.values()].join('\n');
const issues=[];
for(const p of files){
  const name=basename(p,extname(p));
  if(['main','App'].includes(name)) continue;
  const rel=relative(src,p).replaceAll('\\','/').replace(/\.(jsx|js)$/,'');
  const referenced=[...contents].some(([q,s])=>q!==p&&(s.includes(`/${name}'`)||s.includes(`/${name}"`)||s.includes(`./${rel}`)));
  if(!referenced && !p.includes('/pages/Legal.jsx')) issues.push(`módulo possivelmente morto: ${relative(root,p)}`);
}
for(const pattern of ['dangerouslySetInnerHTML','document.write(','eval(','new Function(']) if(combined.includes(pattern)) issues.push(`sink proibido: ${pattern}`);
if(issues.length) throw new Error(issues.join('\n'));
console.log(`[OK] higiene de fonte: ${files.length} módulos, sem sinks ou módulos mortos detectados`);
