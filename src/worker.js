const STORES = new Set(['people','cells','meetings','attendance','followups','training','ministries','settings','generalMeetings','meetingAssignments','meetingFinances','notifications','generalGuests','consolidationCases','trainingLevels','trainingSessions','trainingAttendance','leadershipDevelopment','ministryMembers','ministryServices','alertStates','events','eventTasks','eventParticipants','encounters','encounterGoals','encounterParticipants','encounterTasks','encounterUpdates','encounterFinances','encounterPhaseReports','encounterIncidents','twelveMeetings','twelveMeetingReports']);

const WRITE_BY_ROLE = {
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
    if(user.role!=='pastor') return json({error:'Solo el pastor principal puede limpiar datos.'},403);
    await env.DB.prepare('DELETE FROM app_records WHERE store_name=?').bind(store).run(); return new Response(null,{status:204});
  }
  if(request.method==='DELETE' && action) {
    const id=Number(action); await env.DB.prepare('DELETE FROM app_records WHERE store_name=? AND id=?').bind(store,id).run(); return new Response(null,{status:204});
  }
  return json({error:'Operación no soportada'},405);
}

async function handleAdmin(request, env, path, user) {
  if(user.role!=='pastor') return json({error:'Solo el Pastor principal puede ejecutar esta operación.'},403);
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

export default {
  async fetch(request, env) {
    const url=new URL(request.url); const path=url.pathname;
    try {
      if(path.startsWith('/api/auth/')) return handleAuth(request,env,path);
      if(path.startsWith('/api/')) {
        const user=await authUser(request,env); if(!user) return json({error:'No autenticado'},401);
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
