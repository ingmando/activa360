import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=process.cwd();
const required=['public/index.html','public/js/app.js','public/js/database.js','public/js/auth.js','src/worker.js','migrations/0001_schema.sql','migrations/0002_seed_demo.sql','wrangler.jsonc'];
let ok=true;
for(const f of required){ if(!fs.existsSync(path.join(root,f))){ console.error('FALTA',f); ok=false; } }
const js=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory())walk(p); else if(p.endsWith('.js')||p.endsWith('.mjs'))js.push(p);}}
walk(path.join(root,'public/js')); walk(path.join(root,'src')); walk(path.join(root,'scripts'));
for(const file of js){ const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'}); if(r.status!==0){console.error('JS ERROR',file,r.stderr);ok=false;} }
for(const file of js){
  const text=fs.readFileSync(file,'utf8');
  for(const m of text.matchAll(/from\s+['\"](\.[^'\"]+)['\"]/g)){
    let target=path.resolve(path.dirname(file),m[1]);
    if(!path.extname(target)) target+='.js';
    if(!fs.existsSync(target)){console.error('IMPORT FALTANTE',file,'->',m[1]);ok=false;}
  }
}
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)=['\"]([^'\"]+)['\"]/g)){
  const ref=m[1]; if(ref.startsWith('http')||ref.startsWith('#')||ref.startsWith('data:')) continue;
  const clean=ref.replace(/^\.\//,'').split('?')[0];
  if(clean && !fs.existsSync(path.join(root,'public',clean))){console.error('ASSET FALTANTE',ref);ok=false;}
}
console.log(`Archivos JS verificados: ${js.length}`);
if(!ok) process.exit(1);
console.log('OK: estructura y sintaxis base correctas.');
