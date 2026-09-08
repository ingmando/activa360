import { getAll, getOne, putOne, deleteOne, nextId } from '../database.js';
import { go } from '../router.js';

const states = ['Nuevo','Invitado','Ganado','Consolidación','Discípulo','Activo','Inactivo','Requiere seguimiento'];
const roles = ['Miembro','Servidor','Líder en formación','Líder de célula','Líder de doce'];

function esc(v='') { return String(v).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function initials(name='P') { return name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase(); }

export async function renderPeopleList(user) {
  const [people,cells] = await Promise.all([getAll('people'), getAll('cells')]);
  const canCreate = ['superadmin','pastor','leader12','cellLeader'].includes(user.role);
  return `<div class="page-head"><div><div class="eyebrow">Núcleo pastoral</div><h1>Personas</h1><p>Directorio integral y estado ministerial de las personas.</p></div>${canCreate?'<button class="btn btn-primary" id="newPersonBtn">+ Nueva persona</button>':''}</div>
  <section class="card toolbar-card"><div class="filter-grid"><div class="field compact"><label>Buscar</label><input id="peopleSearch" placeholder="Nombre, correo o teléfono"></div><div class="field compact"><label>Estado</label><select id="peopleState"><option value="">Todos</option>${states.map(s=>`<option>${s}</option>`).join('')}</select></div><div class="field compact"><label>Célula</label><select id="peopleCell"><option value="">Todas</option>${cells.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div></div></section>
  <div id="peopleResults"></div>
  <div id="modalRoot"></div>`;
}

export async function bindPeopleList(user) {
  const [people,cells] = await Promise.all([getAll('people'), getAll('cells')]);
  const cellMap = Object.fromEntries(cells.map(c=>[c.id,c]));
  const results = document.querySelector('#peopleResults');
  const render = () => {
    const q=(document.querySelector('#peopleSearch')?.value||'').toLowerCase();
    const st=document.querySelector('#peopleState')?.value||'';
    const cid=document.querySelector('#peopleCell')?.value||'';
    const filtered=people.filter(p=>(!q||[p.name,p.email,p.phone].some(v=>String(v||'').toLowerCase().includes(q)))&&(!st||p.state===st)&&(!cid||String(p.cellId)===cid));
    results.innerHTML=`<section class="card section-card table-wrap"><div class="section-title"><h3>${filtered.length} personas</h3><span class="badge">Cloud D1</span></div><table class="people-table"><thead><tr><th>Persona</th><th>Estado</th><th>Célula</th><th>Formación</th><th></th></tr></thead><tbody>${filtered.map(p=>`<tr><td><div class="person-cell"><div class="mini-avatar">${initials(p.name)}</div><div><strong>${esc(p.name)}</strong><div class="muted">${esc(p.email)}</div></div></div></td><td><span class="badge ${p.state==='Requiere seguimiento'?'danger':''}">${esc(p.state)}</span></td><td>${esc(cellMap[p.cellId]?.name||'Sin asignar')}</td><td>Nivel ${p.trainingLevel||1}</td><td><button class="btn btn-soft btn-sm" data-view-person="${p.id}">Ver 360</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty-state">No hay resultados.</td></tr>'}</tbody></table></section>`;
    results.querySelectorAll('[data-view-person]').forEach(b=>b.addEventListener('click',()=>go(`personas/${b.dataset.viewPerson}`)));
  };
  ['peopleSearch','peopleState','peopleCell'].forEach(id=>document.querySelector('#'+id)?.addEventListener('input',render));
  document.querySelector('#newPersonBtn')?.addEventListener('click',()=>openPersonModal(null,cells));
  render();
}

async function openPersonModal(person,cells) {
  const allPeople=await getAll('people');
  const modal=document.querySelector('#modalRoot');
  const editing=!!person;
  modal.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">${editing?'Editar':'Crear'}</div><h2>${editing?'Editar persona':'Nueva persona'}</h2></div><button class="icon-btn" id="closeModal">×</button></div><form id="personForm"><div class="form-grid"><div class="field"><label>Nombre completo *</label><input name="name" value="${esc(person?.name||'')}" required></div><div class="field"><label>Teléfono</label><input name="phone" value="${esc(person?.phone||'')}"></div><div class="field"><label>Correo</label><input type="email" name="email" value="${esc(person?.email||'')}"></div><div class="field"><label>Estado ministerial</label><select name="state">${states.map(s=>`<option ${person?.state===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="field"><label>Célula</label><select name="cellId"><option value="">Sin asignar</option>${cells.map(c=>`<option value="${c.id}" ${Number(person?.cellId)===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Nivel de formación</label><select name="trainingLevel">${[1,2,3].map(n=>`<option value="${n}" ${Number(person?.trainingLevel||1)===n?'selected':''}>Nivel ${n}</option>`).join('')}</select></div><div class="field"><label>Rol ministerial</label><select name="ministryRole">${roles.map(r=>`<option ${person?.ministryRole===r?'selected':''}>${r}</option>`).join('')}</select></div><div class="field"><label>Nivel de liderazgo</label><select name="leadershipLevel"><option value="">Sin nivel de red</option>${[[0,'Pastores generales'],[1,'Equipo de 12'],[2,'Red 144'],[3,'Red 1728']].map(([n,l])=>`<option value="${n}" ${Number(person?.leadershipLevel)===n?'selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label>Mentor / cobertura</label><select name="mentorId"><option value="">Cobertura pastoral general / sin asignar</option>${allPeople.filter(p=>Number(p.id)!==Number(person?.id)&&p.active!==false&&p.leadershipLevel!==undefined).map(p=>`<option value="${p.id}" ${Number(person?.mentorId)===Number(p.id)?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Estado registro</label><select name="active"><option value="true" ${person?.active!==false?'selected':''}>Activo</option><option value="false" ${person?.active===false?'selected':''}>Inactivo</option></select></div></div><div class="modal-actions"><button type="button" class="btn" id="cancelModal">Cancelar</button><button class="btn btn-primary">Guardar persona</button></div></form></div></div>`;
  const close=()=>modal.innerHTML='';
  document.querySelector('#closeModal').onclick=close; document.querySelector('#cancelModal').onclick=close;
  document.querySelector('#personForm').onsubmit=async e=>{e.preventDefault(); const f=new FormData(e.target); const id=person?.id||await nextId('people'); await putOne('people',{...person,id,name:f.get('name').trim(),phone:f.get('phone').trim(),email:f.get('email').trim(),state:f.get('state'),cellId:f.get('cellId')?Number(f.get('cellId')):null,trainingLevel:Number(f.get('trainingLevel')),ministryRole:f.get('ministryRole'),leadershipLevel:f.get('leadershipLevel')===''?null:Number(f.get('leadershipLevel')),mentorId:f.get('mentorId')?Number(f.get('mentorId')):null,active:f.get('active')==='true'}); close(); location.hash='#/personas'; window.dispatchEvent(new HashChangeEvent('hashchange'));};
}

export async function renderPersonDetail(id,user) {
  const [p,cells,followups,training,meetings,ministryMembers,ministries] = await Promise.all([getOne('people',id),getAll('cells'),getAll('followups'),getAll('training'),getAll('meetings'),getAll('ministryMembers'),getAll('ministries')]);
  if(!p) return `<div class="card module-placeholder"><div><h2>Persona no encontrada</h2><button class="btn btn-primary" data-back-people>Volver</button></div></div>`;
  const cell=cells.find(c=>c.id===p.cellId); const personFollowups=followups.filter(x=>x.personId===p.id); const tr=training.find(x=>x.personId===p.id); const personMinistries=ministryMembers.filter(x=>x.personId===p.id&&x.status!=='Inactivo').map(x=>({membership:x,ministry:ministries.find(m=>m.id===x.ministryId)})).filter(x=>x.ministry); const canEdit=['superadmin','pastor','leader12','cellLeader'].includes(user.role); const canDelete=['superadmin','pastor','leader12'].includes(user.role);
  const stages=['Ganar','Consolidar','Discipular','Enviar']; const stageIndex = p.state==='Nuevo'||p.state==='Invitado'||p.state==='Ganado'?0:p.state==='Consolidación'?1:p.state==='Discípulo'||p.state==='Activo'?2:2;
  return `<div class="page-head"><div><button class="link-btn" data-back-people>← Personas</button><div class="eyebrow">Ficha Persona 360</div><h1>${esc(p.name)}</h1><p>${esc(p.ministryRole||'Miembro')} · ${esc(cell?.name||'Sin célula')}</p></div><div class="action-row"><button class="btn btn-soft" id="personTrainingBtn">Ver formación</button>${canEdit?'<button class="btn btn-soft" id="editPersonBtn">Editar</button>':''}${canDelete?'<button class="btn btn-danger" id="deletePersonBtn">Eliminar</button>':''}</div></div>
  <div class="profile-hero card"><div class="profile-avatar">${initials(p.name)}</div><div><div class="profile-tags"><span class="badge">${esc(p.state)}</span><span class="badge">Nivel ${p.trainingLevel||1}</span>${p.active?'<span class="badge success">Activo</span>':'<span class="badge danger">Inactivo</span>'}</div><h2>${esc(p.name)}</h2><div class="muted">${esc(p.email||'Sin correo')} · ${esc(p.phone||'Sin teléfono')}</div></div></div>
  <div class="grid two-col detail-grid"><section class="card section-card"><div class="section-title"><h3>Proceso ministerial</h3><span class="badge">Ganar → Enviar</span></div><div class="stage-track">${stages.map((s,i)=>`<div class="stage ${i<=stageIndex?'done':''}"><span>${i<stageIndex?'✓':i===stageIndex?'●':'○'}</span><strong>${s}</strong></div>`).join('')}</div><div class="info-grid"><div><span>Estado actual</span><strong>${esc(p.state)}</strong></div><div><span>Célula</span><strong>${esc(cell?.name||'Sin asignar')}</strong></div><div><span>Formación</span><strong>Nivel ${p.trainingLevel||1}</strong></div><div><span>Rol</span><strong>${esc(p.ministryRole||'Miembro')}</strong></div></div></section>
  <section class="card section-card"><div class="section-title"><h3>Seguimiento</h3><div class="action-row"><span class="badge ${personFollowups.some(x=>x.status==='Pendiente')?'warn':''}">${personFollowups.length}</span><button class="btn btn-soft btn-sm" id="personFollowupBtn">Abrir seguimiento</button></div></div>${personFollowups.length?`<div class="list">${personFollowups.map(f=>`<div class="list-row"><div><strong>${esc(f.type)}</strong><div class="muted">${esc(f.reason)}</div></div><span class="badge ${f.status==='Pendiente'?'warn':''}">${f.status}</span></div>`).join('')}</div>`:'<div class="empty-state">Sin seguimientos registrados.</div>'}</section></div>
  <section class="card section-card"><div class="section-title"><h3>Resumen 360</h3><span class="badge">Prototipo</span></div><div class="tabs-row"><span class="tab active">Resumen</span><span class="tab">Proceso</span><span class="tab">Célula</span><span class="tab">Formación</span><span class="tab">Seguimiento</span><span class="tab">Ministerios</span><span class="tab">Asistencia</span><span class="tab">Historial</span></div><div class="timeline"><div><strong>Formación actual</strong><span>${tr?`${tr.progress}% completado en Nivel ${tr.level}`:'Sin progreso registrado'}</span></div><div><strong>Ministerios</strong><span>${personMinistries.length?personMinistries.map(x=>`${x.ministry.name} · ${x.membership.role}`).join(' · '):'Sin ministerio asignado'}</span></div><div><strong>Actividad demo</strong><span>${meetings.length} reuniones disponibles para relación de asistencia.</span></div></div></section><div id="modalRoot"></div>`;
}

export async function bindPersonDetail(id,user) {
  const [p,cells]=await Promise.all([getOne('people',id),getAll('cells')]);
  document.querySelectorAll('[data-back-people]').forEach(b=>b.onclick=()=>go('personas'));
  document.querySelector('#editPersonBtn')?.addEventListener('click',()=>openPersonModal(p,cells));
  document.querySelector('#personFollowupBtn')?.addEventListener('click',()=>{sessionStorage.setItem('activa360_followup_person_filter',String(p.id));go('seguimiento');});
  document.querySelector('#personTrainingBtn')?.addEventListener('click',()=>{location.hash=`#/formacion?person=${p.id}`; window.dispatchEvent(new HashChangeEvent('hashchange'));});
  document.querySelector('#deletePersonBtn')?.addEventListener('click',async()=>{if(confirm(`¿Eliminar a ${p.name}? Esta acción solo afecta el prototipo local.`)){await deleteOne('people',p.id); go('personas');}});
}
