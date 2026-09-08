const STORES = new Set(['people','cells','meetings','attendance','followups','training','ministries','settings','generalMeetings','meetingAssignments','meetingFinances','notifications','generalGuests','consolidationCases','trainingLevels','trainingSessions','trainingAttendance','leadershipDevelopment','ministryMembers','ministryServices','alertStates','events','eventTasks','eventParticipants','encounters','encounterGoals','encounterParticipants','encounterTasks','encounterUpdates','encounterFinances','encounterPhaseReports','encounterIncidents','twelveMeetings','twelveMeetingReports','ministryUnits','twelveMeetingInvites']);

const WRITE_BY_ROLE = {
  superadmin: '*',
  pastor: '*',
  leader12: new Set([...STORES].filter(x => x !== 'settings')),
  cellLeader: new Set(['people','cells','meetings','attendance','followups','consolidationCases','training','trainingAttendance','encounterParticipants','twelveMeetingReports']),
  server: new Set(['ministryMembers','ministryServices','trainingAttendance','eventTasks','encounterTasks']),
  member: new Set([])
};

const enc = new TextEncoder();
const dec = new TextDecoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}
function cookieValue(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
function bytesToB64(bytes) {
  let s=''; const a=new Uint8Array(bytes); for(let i=0;i<a.length;i++) s+=String.fromCharCode(a[i]); return btoa(s);
}
function b64ToBytes(s) {
  const raw=atob(s); const out=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i); return out;
}
async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return bytesToB64(digest);
}
async function verifyPassword(password, encoded) {
  try {
    const [kind, iterStr, saltB64, hashB64] = encoded.split('$');
    if (kind !== 'pbkdf2_sha256') return false;
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt:b64ToBytes(saltB64), iterations: Math.min(Number(iterStr), 100000) }, key, b64ToBytes(hashB64).length * 8);
    const actual = new Uint8Array(bits), expected = b64ToBytes(hashB64);
    if (actual.length !== expected.length) return false;
    let diff=0; for(let i=0;i<actual.length;i++) diff |= actual[i]^expected[i];
    return diff===0;
  } catch { return false; }
}
async function createPasswordHash(password, iterations = 100000) {
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);
  return `pbkdf2_sha256$${iterations}$${bytesToB64(salt)}$${bytesToB64(bits)}`;
}
async function authUser(request, env) {
  const token=cookieValue(request,'a360_session'); if(!token) return null;
  const tokenHash=await hashToken(token);
  const row=await env.DB.prepare(`SELECT u.id,u.person_id AS personId,u.name,u.email,u.role,u.role_name AS roleName,u.scope,u.description,u.active,s.expires_at AS expiresAt FROM app_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=?`).bind(tokenHash).first();
  if(!row || !row.active || Date.parse(row.expiresAt) < Date.now()) {
    if(row) await env.DB.prepare('DELETE FROM app_sessions WHERE token_hash=?').bind(tokenHash).run();
    return null;
  }
  return row;
}
function canWrite(user, store) {
  const perm=WRITE_BY_ROLE[user.role]; return perm==='*' || perm?.has(store);
}
function sessionCookie(token, maxAge=604800) {
  return `a360_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
async function handleAuth(request, env, path) {
  if(path==='/api/auth/login' && request.method==='POST') {
    const {email,password}=await request.json();
    const user=await env.DB.prepare('SELECT * FROM app_users WHERE lower(email)=lower(?) AND active=1').bind(String(email||'').trim()).first();
    if(!user || !(await verifyPassword(String(password||''), user.password_hash))) return json({error:'Credenciales inválidas'},401);
    const raw=bytesToB64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g,'');
    const tokenHash=await hashToken(raw); const expires=new Date(Date.now()+7*86400000).toISOString();
    await env.DB.prepare('INSERT INTO app_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(tokenHash,user.id,expires,new Date().toISOString()).run();
    const publicUser={id:user.id,personId:user.person_id,name:user.name,email:user.email,role:user.role,roleName:user.role_name,scope:user.scope,description:user.description};
    return json({user:publicUser},200,{'set-cookie':sessionCookie(raw)});
  }
  if(path==='/api/auth/logout' && request.method==='POST') {
    const token=cookieValue(request,'a360_session'); if(token){ const h=await hashToken(token); await env.DB.prepare('DELETE FROM app_sessions WHERE token_hash=?').bind(h).run(); }
    return json({ok:true},200,{'set-cookie':'a360_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
  }
  const user=await authUser(request,env); if(!user) return json({error:'No autenticado'},401);
  if(path==='/api/auth/me' && request.method==='GET') return json({user});
  if(path==='/api/auth/change-password' && request.method==='POST') {
    const {currentPassword,newPassword}=await request.json();
    if(!newPassword || String(newPassword).length<10) return json({error:'La nueva contraseña debe tener al menos 10 caracteres.'},400);
    const row=await env.DB.prepare('SELECT password_hash FROM app_users WHERE id=?').bind(user.id).first();
    if(!row || !(await verifyPassword(String(currentPassword||''), row.password_hash))) return json({error:'La contraseña actual no es correcta.'},400);
    const hash=await createPasswordHash(String(newPassword));
    await env.DB.prepare('UPDATE app_users SET password_hash=?, updated_at=? WHERE id=?').bind(hash,new Date().toISOString(),user.id).run();
    await env.DB.prepare('DELETE FROM app_sessions WHERE user_id=?').bind(user.id).run();
    return json({ok:true},200,{'set-cookie':'a360_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
  }
  return json({error:'Ruta de autenticación no encontrada'},404);
}

async function handleData(request, env, url, user) {
  const parts=url.pathname.split('/').filter(Boolean); // api,data,store,...
  const store=decodeURIComponent(parts[2]||'');
  if(!STORES.has(store)) return json({error:'Colección no válida'},404);
  const action=parts[3];
  if(request.method==='GET' && !action) {
    const {results}=await env.DB.prepare('SELECT data FROM app_records WHERE store_name=? ORDER BY id').bind(store).all();
    return json(results.map(r=>JSON.parse(r.data)));
  }
  if(request.method==='GET' && action==='count') {
    const row=await env.DB.prepare('SELECT COUNT(*) AS count FROM app_records WHERE store_name=?').bind(store).first(); return json({count:row.count});
  }
  if(request.method==='GET' && action==='next-id') {
    const row=await env.DB.prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM app_records WHERE store_name=?').bind(store).first(); return json({id:row.id});
  }
  if(request.method==='GET' && action) {
    const id=Number(action); if(!Number.isFinite(id)) return json({error:'ID inválido'},400);
    const row=await env.DB.prepare('SELECT data FROM app_records WHERE store_name=? AND id=?').bind(store,id).first();
    return row?json(JSON.parse(row.data)):json({error:'Registro no encontrado'},404);
  }
  if(!canWrite(user,store)) return json({error:'No tienes permiso para modificar este módulo.'},403);
  if(request.method==='PUT' && action==='bulk') {
    const body=await request.json(); const items=Array.isArray(body.items)?body.items:[];
    if(items.length>500) return json({error:'Máximo 500 registros por lote.'},400);
    const now=new Date().toISOString();
    const statements=items.map(item=>env.DB.prepare(`INSERT INTO app_records(store_name,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(store_name,id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`).bind(store,Number(item.id),JSON.stringify(item),now));
    for(let i=0;i<statements.length;i+=40) await env.DB.batch(statements.slice(i,i+40));
    return json({ok:true,count:items.length});
  }
  if(request.method==='PUT' && action) {
    const id=Number(action); const item=await request.json(); if(!Number.isFinite(id) || Number(item.id)!==id) return json({error:'El ID del recurso no coincide.'},400);
    await env.DB.prepare(`INSERT INTO app_records(store_name,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(store_name,id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`).bind(store,id,JSON.stringify(item),new Date().toISOString()).run(); return json(item);
  }
  if(request.method==='DELETE' && action==='clear') {
    if(!['pastor','superadmin'].includes(user.role)) return json({error:'Solo administración pastoral puede limpiar datos.'},403);
    await env.DB.prepare('DELETE FROM app_records WHERE store_name=?').bind(store).run(); return new Response(null,{status:204});
  }
  if(request.method==='DELETE' && action) {
    const id=Number(action); await env.DB.prepare('DELETE FROM app_records WHERE store_name=? AND id=?').bind(store,id).run(); return new Response(null,{status:204});
  }
  return json({error:'Operación no soportada'},405);
}

async function handleAdmin(request, env, path, user) {
  if(!['pastor','superadmin'].includes(user.role)) return json({error:'Solo administración pastoral puede ejecutar esta operación.'},403);
  if(path==='/api/admin/export' && request.method==='GET') {
    const {results}=await env.DB.prepare('SELECT store_name,id,data FROM app_records ORDER BY store_name,id').all();
    const stores={}; for(const row of results){ (stores[row.store_name]??=[]).push(JSON.parse(row.data)); }
    return json({app:'Activa 360',version:'1.3-ux-cloud-d1',exportedAt:new Date().toISOString(),stores});
  }
  if(path==='/api/admin/import' && request.method==='POST') {
    const payload=await request.json(); if(!payload?.stores) return json({error:'Formato de respaldo inválido'},400);
    await env.DB.prepare('DELETE FROM app_records').run(); const statements=[]; const now=new Date().toISOString();
    for(const [store,items] of Object.entries(payload.stores)){ if(!STORES.has(store)) continue; for(const item of items||[]) statements.push(env.DB.prepare('INSERT INTO app_records(store_name,id,data,updated_at) VALUES(?,?,?,?)').bind(store,Number(item.id),JSON.stringify(item),now)); }
    for(let i=0;i<statements.length;i+=40) await env.DB.batch(statements.slice(i,i+40));
    return json({ok:true,count:statements.length});
  }
  if(path==='/api/admin/reset-demo' && request.method==='POST') {
    await env.DB.prepare('DELETE FROM app_records').run();
    await env.DB.prepare('INSERT INTO app_records(store_name,id,data,updated_at) SELECT store_name,id,data,? FROM app_seed_records').bind(new Date().toISOString()).run();
    return json({ok:true});
  }
  return json({error:'Ruta administrativa no encontrada'},404);
}


async function loadStore(env, store) {
  const {results}=await env.DB.prepare('SELECT data FROM app_records WHERE store_name=? ORDER BY id').bind(store).all();
  return results.map(r=>JSON.parse(r.data));
}
async function loadRecord(env, store, id) {
  const row=await env.DB.prepare('SELECT data FROM app_records WHERE store_name=? AND id=?').bind(store,Number(id)).first();
  return row?JSON.parse(row.data):null;
}
async function nextStoreId(env, store) {
  const row=await env.DB.prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM app_records WHERE store_name=?').bind(store).first();
  return Number(row?.id||1);
}
async function saveRecord(env, store, item) {
  await env.DB.prepare(`INSERT INTO app_records(store_name,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(store_name,id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`).bind(store,Number(item.id),JSON.stringify(item),new Date().toISOString()).run();
  return item;
}
function secureToken() {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g,'');
}
function firstName(name='') { return String(name||'').trim().split(/\s+/).filter(Boolean)[0]||'Persona'; }
function publicHtml(token) {
  const safe=String(token||'').replace(/[^A-Za-z0-9_-]/g,'');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0c506e"><title>Reporte Reunión de 12 · Activa 360</title><style>
  *{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f3f8fb;color:#0c3444}.wrap{max-width:640px;margin:auto;padding:24px 16px 48px}.brand{font-weight:800;color:#0d8bb6;letter-spacing:.08em;text-transform:uppercase}.card{background:#fff;border:1px solid #dce7ed;border-radius:24px;padding:22px;margin-top:16px;box-shadow:0 12px 30px rgba(12,80,110,.06)}h1{font-size:30px;line-height:1.08;margin:8px 0}h2{font-size:21px;margin:0 0 8px}.muted{color:#6c7f8a}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:flex;flex-direction:column;gap:7px;margin-top:14px}.field label{font-weight:700}.field select,.field textarea{width:100%;min-width:0;border:1px solid #cad9e0;border-radius:14px;padding:13px;font:inherit;background:white}.metric{background:#eef8fc;border-radius:16px;padding:14px}.metric strong{display:block;font-size:24px}.btn{width:100%;border:0;border-radius:16px;padding:15px 18px;background:#0d8bb6;color:#fff;font-size:17px;font-weight:800;margin-top:18px}.btn:disabled{opacity:.55}.status{display:inline-flex;padding:7px 12px;border-radius:999px;background:#eaf7ef;color:#18764d;font-weight:700}.error{background:#fff0f0;color:#a52a2a;padding:14px;border-radius:14px}.done{background:#eaf7ef;color:#18764d;padding:14px;border-radius:14px}@media(max-width:520px){.grid{grid-template-columns:1fr}h1{font-size:26px}}</style></head><body><main class="wrap"><div class="brand">Activa 360 · Reunión de 12</div><div id="app" class="card"><p>Cargando reporte...</p></div></main><script>
const token=${JSON.stringify(safe)}; const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
async function load(){try{const r=await fetch('/api/public/r12/'+encodeURIComponent(token));const d=await r.json();if(!r.ok)throw new Error(d.error||'No disponible');render(d);}catch(e){app.innerHTML='<div class="error"><strong>No fue posible abrir el reporte.</strong><p>'+esc(e.message)+'</p></div>';}}
function yn(name,val,label){return '<div class="field"><label>'+esc(label)+'</label><select name="'+name+'" required><option value="">Seleccionar</option><option value="true" '+(val===true?'selected':'')+'>Sí</option><option value="false" '+(val===false?'selected':'')+'>No</option></select></div>'}
function render(d){const members=d.members||[],dev=d.report?.devotionals||{};app.innerHTML='<span class="status">'+esc(d.meeting.status)+'</span><h1>'+esc(d.unit.displayName)+'</h1><p class="muted">'+esc(d.meeting.title)+' · '+esc(d.meeting.date)+' · '+esc(d.meeting.time||'18:30')+'</p><h2>Reporte semanal</h2><p class="muted">El devocional se registra por persona. Diezmo, ofrenda y altar familiar corresponden a la unidad ministerial.</p><form id="f">'+members.map(m=>yn('dev_'+m.id,dev[String(m.id)],'Devocional · '+m.firstName)).join('')+'<div class="grid">'+yn('tithe',d.report?.tithe,'Diezmo de la unidad')+yn('offering',d.report?.offering,'Ofrenda de la unidad')+yn('familyAltar',d.report?.familyAltar,'Altar familiar')+'</div><h2 style="margin-top:22px">Información automática</h2><div class="grid"><div class="metric"><span>Células</span><strong>'+d.auto.cells+'</strong></div><div class="metric"><span>Realizadas</span><strong>'+d.auto.meetingsDone+'</strong></div><div class="metric"><span>En escuela</span><strong>'+d.auto.schoolPeople+'</strong></div><div class="metric"><span>Encuentro</span><strong>'+d.auto.encounterPeople+'</strong></div></div><div class="field"><label>Observaciones / compromisos</label><textarea name="notes" rows="4">'+esc(d.report?.notes||'')+'</textarea></div><button class="btn">Guardar reporte</button></form>';document.querySelector('#f').onsubmit=submit;}
async function submit(e){e.preventDefault();const f=new FormData(e.target),payload={devotionals:{},tithe:f.get('tithe')==='true',offering:f.get('offering')==='true',familyAltar:f.get('familyAltar')==='true',notes:String(f.get('notes')||'')};for(const [k,v] of f.entries())if(k.startsWith('dev_'))payload.devotionals[k.slice(4)]=v==='true';const b=e.target.querySelector('button');b.disabled=true;b.textContent='Guardando...';try{const r=await fetch('/api/public/r12/'+encodeURIComponent(token),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.error||'No fue posible guardar');app.innerHTML='<div class="done"><strong>Reporte guardado correctamente.</strong><p>Puedes volver a abrir este mismo enlace mientras la reunión permanezca abierta.</p></div>';}catch(err){b.disabled=false;b.textContent='Guardar reporte';alert(err.message)}}load();
</script></body></html>`;
}
async function computeUnitAuto(env, unit, meeting) {
  const [cells,cellMeetings,people,training,encParts,encounters]=await Promise.all(['cells','meetings','people','training','encounterParticipants','encounters'].map(s=>loadStore(env,s)));
  const roots=[unit.primaryPersonId,unit.secondaryPersonId].filter(Boolean).map(Number); const coverage=new Set(roots);
  const walk=id=>people.filter(p=>Number(p.mentorId)===Number(id)).forEach(p=>{if(!coverage.has(Number(p.id))){coverage.add(Number(p.id));walk(p.id)}}); roots.forEach(walk);
  const date=new Date(`${meeting.date}T12:00:00`);const day=(date.getDay()+6)%7;date.setDate(date.getDate()-day);const start=date.toISOString().slice(0,10);date.setDate(date.getDate()+6);const end=date.toISOString().slice(0,10);
  const coverageCells=cells.filter(c=>coverage.has(Number(c.leaderId)));const cellIds=new Set(coverageCells.map(c=>Number(c.id)));
  const meetingsDone=cellMeetings.filter(m=>cellIds.has(Number(m.cellId))&&m.date>=start&&m.date<=end&&m.reported!==false).length;
  const peopleInCoverage=new Set(people.filter(p=>coverage.has(Number(p.id))||cellIds.has(Number(p.cellId))).map(p=>Number(p.id)));
  const schoolPeople=new Set(training.filter(t=>peopleInCoverage.has(Number(t.personId))&&(t.status||'En curso')==='En curso').map(t=>Number(t.personId))).size;
  const enc=encounters.find(e=>['Inscripciones','Preparación','En ejecución'].includes(e.status))||encounters[0];
  const encounterPeople=enc?encParts.filter(p=>Number(p.encounterId)===Number(enc.id)&&roots.includes(Number(p.leaderId))&&!['Prospecto','No asistió'].includes(p.status)).length:0;
  return {cells:coverageCells.length,meetingsDone,schoolPeople,encounterPeople};
}
async function findInviteByToken(env, token) {
  const tokenHash=await hashToken(token);
  const row=await env.DB.prepare("SELECT data FROM app_records WHERE store_name='twelveMeetingInvites' AND json_extract(data,'$.tokenHash')=? LIMIT 1").bind(tokenHash).first();
  return row?JSON.parse(row.data):null;
}
async function handleR12InviteAdmin(request, env, url, user) {
  if(!['pastor','superadmin'].includes(user.role)) return json({error:'Solo administración pastoral puede generar enlaces.'},403);
  if(request.method==='GET') {
    const meetingId=Number(url.searchParams.get('meetingId')); const all=await loadStore(env,'twelveMeetingInvites');
    return json(all.filter(x=>!meetingId||Number(x.meetingId)===meetingId).map(({tokenHash,...x})=>x));
  }
  if(request.method==='POST') {
    const {meetingId,unitId}=await request.json(); const meeting=await loadRecord(env,'twelveMeetings',meetingId); const unit=await loadRecord(env,'ministryUnits',unitId);
    if(!meeting) return json({error:'Reunión no encontrada.'},404);
    if(meeting.status!=='Abierta') return json({error:'Los enlaces solo se habilitan cuando la reunión está Abierta.'},400);
    let resolvedUnit=unit;
    if(!resolvedUnit && Number(unitId)>=900000){const personId=Number(unitId)-900000;const p=await loadRecord(env,'people',personId);if(p)resolvedUnit={id:Number(unitId),type:'individual',primaryPersonId:personId,representativePersonId:personId,displayName:p.name,synthetic:true};}
    if(!resolvedUnit) return json({error:'Unidad ministerial no encontrada.'},404);
    const raw=secureToken(), tokenHash=await hashToken(raw), all=await loadStore(env,'twelveMeetingInvites');
    const old=all.find(x=>Number(x.meetingId)===Number(meetingId)&&Number(x.unitId)===Number(unitId)&&x.status==='active');
    if(old){old.status='replaced';old.updatedAt=new Date().toISOString();await saveRecord(env,'twelveMeetingInvites',old)}
    const id=await nextStoreId(env,'twelveMeetingInvites'); const expires=new Date(Date.parse(`${meeting.date}T23:59:59`)+7*86400000).toISOString();
    const invite={id,meetingId:Number(meetingId),unitId:Number(unitId),representativePersonId:Number(resolvedUnit.representativePersonId||resolvedUnit.primaryPersonId),tokenHash,status:'active',expiresAt:expires,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; await saveRecord(env,'twelveMeetingInvites',invite);
    const base=new URL(request.url).origin; return json({ok:true,id,link:`${base}/r12/${raw}`,expiresAt:expires});
  }
  return json({error:'Operación no soportada'},405);
}
async function handleR12Public(request, env, token) {
  const invite=await findInviteByToken(env,token); if(!invite||invite.status!=='active') return json({error:'Este enlace no es válido o fue reemplazado.'},404);
  if(Date.parse(invite.expiresAt)<Date.now()) return json({error:'Este enlace expiró.'},410);
  const meeting=await loadRecord(env,'twelveMeetings',invite.meetingId); if(!meeting) return json({error:'Reunión no encontrada.'},404);
  if(meeting.status==='Borrador') return json({error:'La reunión todavía está en preparación.'},403);
  if(meeting.status==='Cerrada') return json({error:'Esta reunión ya fue cerrada.'},410);
  let unit=await loadRecord(env,'ministryUnits',invite.unitId); const people=await loadStore(env,'people');
  if(!unit&&Number(invite.unitId)>=900000){const pid=Number(invite.unitId)-900000,p=people.find(x=>Number(x.id)===pid);if(p)unit={id:Number(invite.unitId),type:'individual',primaryPersonId:pid,representativePersonId:pid,displayName:p.name,synthetic:true}}
  if(!unit) return json({error:'Unidad ministerial no encontrada.'},404);
  const memberIds=[unit.primaryPersonId,unit.secondaryPersonId].filter(Boolean).map(Number); const members=people.filter(p=>memberIds.includes(Number(p.id))).map(p=>({id:p.id,name:p.name,firstName:firstName(p.name)}));
  const reports=await loadStore(env,'twelveMeetingReports'); let report=reports.find(r=>Number(r.meetingId)===Number(meeting.id)&&Number(r.unitId)===Number(unit.id));
  if(!report){const legacyIds=new Set(memberIds);report=reports.find(r=>Number(r.meetingId)===Number(meeting.id)&&legacyIds.has(Number(r.leaderId)))||null;}
  if(request.method==='GET') return json({meeting:{id:meeting.id,title:meeting.title,date:meeting.date,time:meeting.time,status:meeting.status},unit:{id:unit.id,displayName:unit.displayName||members.map(x=>x.firstName).join(' y '),type:unit.type},members,report,auto:await computeUnitAuto(env,unit,meeting)});
  if(request.method==='POST') {
    const body=await request.json(); const devotionals=body?.devotionals||{}; for(const id of memberIds) if(typeof devotionals[String(id)]!=='boolean') return json({error:`Falta registrar el devocional de ${firstName(people.find(p=>Number(p.id)===id)?.name)}.`},400);
    for(const k of ['tithe','offering','familyAltar']) if(typeof body[k]!=='boolean') return json({error:'Completa los hábitos de la unidad ministerial.'},400);
    const id=report?.id||await nextStoreId(env,'twelveMeetingReports'); const payload={...(report||{}),id,meetingId:Number(meeting.id),unitId:Number(unit.id),leaderId:Number(unit.primaryPersonId),devotionals,tithe:body.tithe,offering:body.offering,familyAltar:body.familyAltar,notes:String(body.notes||'').trim(),submittedVia:'publicLink',updatedAt:new Date().toISOString()}; await saveRecord(env,'twelveMeetingReports',payload); invite.usedAt=new Date().toISOString();invite.updatedAt=invite.usedAt;await saveRecord(env,'twelveMeetingInvites',invite);return json({ok:true,report:payload});
  }
  return json({error:'Operación no soportada'},405);
}

export default {
  async fetch(request, env) {
    const url=new URL(request.url); const path=url.pathname;
    try {
      if(path.startsWith('/api/auth/')) return handleAuth(request,env,path);
      if(path.startsWith('/api/public/r12/')) return handleR12Public(request,env,decodeURIComponent(path.split('/').pop()||''));
      if(path.startsWith('/r12/')) return new Response(publicHtml(decodeURIComponent(path.split('/').pop()||'')),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
      if(path.startsWith('/api/')) {
        const user=await authUser(request,env); if(!user) return json({error:'No autenticado'},401);
        if(path==='/api/r12/invites') return handleR12InviteAdmin(request,env,url,user);
        if(path.startsWith('/api/data/')) return handleData(request,env,url,user);
        if(path.startsWith('/api/admin/')) return handleAdmin(request,env,path,user);
        return json({error:'API no encontrada'},404);
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error); return json({error:'Error interno del servidor',detail:String(error?.message||error)},500);
    }
  }
};
