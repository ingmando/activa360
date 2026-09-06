import { getAll, getOne, putOne, nextId } from '../database.js';
function esc(v=''){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function initials(n=''){return n.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function levelLabel(l){l=Number(l);return l===0?'Pastores generales':l===1?'Equipo de 12':l===2?'Red 144':l===3?'Red 1728':`Nivel ${l}`;}
function leadershipState(d){return d?.status||'Identificado';}

export async function renderTeamsHome(user){
  const people=await getAll('people'), dev=await getAll('leadershipDevelopment'), cells=await getAll('cells');
  const leaders=people.filter(p=>Number(p.leadershipLevel)>=0 && Number(p.leadershipLevel)<=3);
  const teamLeaders=leaders.filter(p=>people.some(x=>Number(x.mentorId)===Number(p.id)));
  const candidates=dev.filter(d=>d.status!=='Enviado');
  const sent=dev.filter(d=>d.status==='Enviado').length;
  return `<div class="page-head"><div><div class="eyebrow">Enviar · multiplicar</div><h1>Equipos de doce</h1><p>Gestiona mentoría, equipos directos, cobertura y formación de nuevos líderes.</p></div><button class="btn btn-primary" id="newLeadershipCandidate">+ Líder en formación</button></div>
  <section class="kpi-grid"><article class="kpi-card"><span>Líderes con equipo</span><strong>${teamLeaders.length}</strong><small>Con discípulos directos</small></article><article class="kpi-card"><span>Equipo de 12</span><strong>${people.filter(p=>p.leadershipLevel===1).length}/12</strong><small>Primera generación</small></article><article class="kpi-card"><span>En formación</span><strong>${candidates.length}</strong><small>Proceso de envío activo</small></article><article class="kpi-card"><span>Enviados</span><strong>${sent}</strong><small>Liderazgo aprobado</small></article></section>
  <section class="card section-card"><div class="section-title"><div><div class="eyebrow">Cobertura</div><h3>Equipos activos</h3></div><input id="teamSearch" class="compact-input" placeholder="Buscar líder..."></div><div class="team-grid" id="teamGrid">${teamLeaders.slice(0,40).map(l=>{const direct=people.filter(p=>Number(p.mentorId)===Number(l.id));const c=cells.filter(x=>Number(x.leaderId)===Number(l.id));return `<button class="team-card" data-team="${l.id}" data-name="${esc(l.name.toLowerCase())}"><div class="mini-avatar">${initials(l.name)}</div><div class="team-card-copy"><strong>${esc(l.name)}</strong><span>${levelLabel(l.leadershipLevel)}</span><small>${direct.length} discípulos directos · ${c.length} célula${c.length===1?'':'s'}</small></div><b>Ver equipo →</b></button>`}).join('')}</div></section>
  <section class="card section-card"><div class="section-title"><div><div class="eyebrow">Pipeline de liderazgo</div><h3>Formación para enviar</h3></div></div><div class="leadership-pipeline">${['Identificado','Formación','Asistente','Aprobado','Enviado'].map(st=>`<div class="leadership-column"><div class="pipeline-head"><strong>${st}</strong><span>${dev.filter(d=>leadershipState(d)===st).length}</span></div>${dev.filter(d=>leadershipState(d)===st).slice(0,8).map(d=>{const p=people.find(x=>x.id===d.personId);return `<button class="pipeline-person" data-person="${d.personId}"><strong>${esc(p?.name||'Persona')}</strong><small>Mentor: ${esc(people.find(x=>x.id===d.mentorId)?.name||'Sin asignar')}</small></button>`}).join('')||'<div class="empty-mini">Sin registros</div>'}</div>`).join('')}</div></section>`;
}

export async function bindTeamsHome(){
  document.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>location.hash=`#/doce/${b.dataset.team}`);
  document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>location.hash=`#/personas/${b.dataset.person}`);
  const q=document.querySelector('#teamSearch'); if(q)q.oninput=()=>document.querySelectorAll('[data-team]').forEach(b=>b.style.display=b.dataset.name.includes(q.value.toLowerCase())?'':'none');
  document.querySelector('#newLeadershipCandidate')?.addEventListener('click',openCandidateModal);
}

async function openCandidateModal(){
  const people=await getAll('people'), dev=await getAll('leadershipDevelopment');
  const enrolled=new Set(dev.map(x=>x.personId)); const options=people.filter(p=>p.active!==false&&!enrolled.has(p.id)&&p.leadershipLevel>0).slice(0,80);
  const modal=document.querySelector('#globalModal');
  modal.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">Formación de líderes</div><h2>Agregar líder en formación</h2></div><button class="icon-btn" id="closeCandidate">×</button></div><form id="candidateForm" class="form-grid"><div class="field span-2"><label>Persona</label><select id="candidatePerson" required>${options.map(p=>`<option value="${p.id}">${esc(p.name)} · ${levelLabel(p.leadershipLevel)}</option>`).join('')}</select></div><div class="field"><label>Mentor</label><select id="candidateMentor" required>${people.filter(p=>p.leadershipLevel<=2).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Estado inicial</label><select id="candidateStatus"><option>Identificado</option><option>Formación</option><option>Asistente</option></select></div><div class="field span-2"><label>Observaciones</label><textarea id="candidateNotes" rows="3" placeholder="Fortalezas, próximos pasos, acompañamiento..."></textarea></div><div class="form-actions span-2"><button type="button" class="btn" id="cancelCandidate">Cancelar</button><button class="btn btn-primary">Guardar proceso</button></div></form></div></div>`;
  const close=()=>modal.innerHTML=''; document.querySelector('#closeCandidate').onclick=close;document.querySelector('#cancelCandidate').onclick=close;
  document.querySelector('#candidateForm').onsubmit=async e=>{e.preventDefault();await putOne('leadershipDevelopment',{id:await nextId('leadershipDevelopment'),personId:Number(document.querySelector('#candidatePerson').value),mentorId:Number(document.querySelector('#candidateMentor').value),status:document.querySelector('#candidateStatus').value,startDate:new Date().toISOString().slice(0,10),notes:document.querySelector('#candidateNotes').value});close();location.hash='#/doce';location.reload();};
}

export async function renderTeamDetail(leaderId){
  const leader=await getOne('people',leaderId); if(!leader)return '<div class="empty-state">Equipo no encontrado.</div>';
  const people=await getAll('people'),cells=await getAll('cells'),dev=await getAll('leadershipDevelopment');
  const direct=people.filter(p=>Number(p.mentorId)===Number(leader.id));
  const descendants=[]; const walk=id=>people.filter(p=>Number(p.mentorId)===Number(id)).forEach(p=>{descendants.push(p);walk(p.id)}); walk(leader.id);
  const ownCells=cells.filter(c=>Number(c.leaderId)===Number(leader.id));
  const coverageCells=cells.filter(c=>descendants.some(p=>p.id===c.leaderId));
  const mentor=people.find(p=>p.id===leader.mentorId);
  return `<div class="page-head"><div><button class="link-back" id="backTeams">← Equipos de doce</button><div class="eyebrow">${levelLabel(leader.leadershipLevel)}</div><h1>${esc(leader.name)}</h1><p>Equipo directo, cobertura, células y proceso de multiplicación.</p></div><button class="btn btn-secondary" id="openLeaderPerson">Ver Persona 360</button></div>
  <section class="leader-hero card"><div class="profile-avatar">${initials(leader.name)}</div><div><span class="badge">${levelLabel(leader.leadershipLevel)}</span><h2>${esc(leader.name)}</h2><p class="muted">Mentor: ${esc(mentor?.name||'Cobertura pastoral general')}</p></div><div class="leader-metrics"><div><strong>${direct.length}</strong><span>Equipo directo</span></div><div><strong>${descendants.length}</strong><span>Cobertura total</span></div><div><strong>${ownCells.length+coverageCells.length}</strong><span>Células en cobertura</span></div></div></section>
  <section class="grid two-col"><div class="card section-card"><div class="section-title"><div><div class="eyebrow">Equipo directo</div><h3>${direct.length}/12 discípulos</h3></div></div><div class="member-stack">${direct.map(p=>{const ld=dev.find(d=>d.personId===p.id);return `<button class="member-row" data-person="${p.id}"><div class="mini-avatar">${initials(p.name)}</div><div><strong>${esc(p.name)}</strong><small>${levelLabel(p.leadershipLevel)} · ${leadershipState(ld)}</small></div><span>→</span></button>`}).join('')||'<div class="empty-state compact">Aún no hay discípulos directos.</div>'}</div></div><div class="card section-card"><div class="eyebrow">Multiplicación</div><h3>Progreso del equipo</h3><div class="progress-big"><div><span style="width:${Math.min(100,direct.length/12*100)}%"></span></div><strong>${Math.round(Math.min(100,direct.length/12*100))}%</strong></div><p class="muted">La meta visual representa la conformación del equipo directo de doce. La cobertura descendente continúa automáticamente hacia 144 y 1728.</p><div class="network-path"><span>${levelLabel(leader.leadershipLevel)}</span><b>→</b><span>${levelLabel(Number(leader.leadershipLevel)+1)}</span></div></div></section>
  <section class="card section-card"><div class="section-title"><div><div class="eyebrow">Células</div><h3>Cobertura celular</h3></div></div><div class="table-wrap"><table><thead><tr><th>Célula</th><th>Líder</th><th>Red</th><th>Localidad</th></tr></thead><tbody>${[...ownCells,...coverageCells].slice(0,30).map(c=>`<tr data-cell="${c.id}" class="clickable-row"><td><strong>${esc(c.name)}</strong></td><td>${esc(c.leader)}</td><td><span class="badge">${esc(c.network)}</span></td><td>${esc(c.locality)}</td></tr>`).join('')||'<tr><td colspan="4">Sin células asociadas.</td></tr>'}</tbody></table></div></section>`;
}
export async function bindTeamDetail(leaderId){
  document.querySelector('#backTeams')?.addEventListener('click',()=>location.hash='#/doce');
  document.querySelector('#openLeaderPerson')?.addEventListener('click',()=>location.hash=`#/personas/${leaderId}`);
  document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>location.hash=`#/personas/${b.dataset.person}`);
  document.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>location.hash=`#/celulas/${b.dataset.cell}`);
}
