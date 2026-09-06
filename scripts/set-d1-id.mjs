import fs from 'node:fs';
const id=process.argv[2];
if(!id || !/^[0-9a-f-]{30,}$/i.test(id)){console.error('Uso: node scripts/set-d1-id.mjs <DATABASE_ID>');process.exit(1);}
const file='wrangler.jsonc';
let text=fs.readFileSync(file,'utf8');
text=text.replace('REEMPLAZAR_CON_DATABASE_ID',id);
fs.writeFileSync(file,text);
console.log('database_id actualizado en wrangler.jsonc');
