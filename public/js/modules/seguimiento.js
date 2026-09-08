import { getAll, getOne, putOne, nextId } from '../database.js';
import { go } from '../router.js';

const PIPELINE = ['Nuevo','Contactado','En seguimiento','Integrado','Consolidado'];
const ACTION_TYPES = ['Llamada','WhatsApp','Visita','Oración','Conversación','Consejería','Invitación a célula'];

function esc(v=''){return String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmtDate(v){if(!v)return 'Sin fecha'; const d=new Date(v+'T12:00:00'); return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',year:'numeric'}).format(d);}
function today(){return new Date().toISOString().slice(0,10);}
function canManage(user){return ['superadmin','pastor','leader12','cellLeader'].includes(user.role);}
function initials(name=''){return name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'NP';}
function sourceLabel(c,cells,generalMeetings,cellMeetings){
  if(c.sourceType==='general'){
    const m=generalMeetings.find(x=>x.id===c.sourceId);
    return m?`${m.title} · ${fmtDate(m.date)}`:'Reunión general';
  }
  if(c.sourceType==='cell'){
    const m=cellMeetings.find(x=>x.id===c.sourceId); const cell=cells.find(x=>x.id===m?.cellId);
    return cell?`${cell.name} · ${fmtDate(m?.date)}`:'Reunión de célula';
  }
  return c.sourceLabel||'Registro manual';
}
function stateClass(s){return s==='Consolidado'?'success':s==='Integrado'?'info':s==='En seguimiento'?'warn':s==='Contactado'?'blue':'neutral';}
function isOverdue(c){return c.nextActionDate && c.nextActionDate < today() && !['Integrado','Consolidado'].includes(c.status);}

export async function syncConsolidationSources(){
  const [attendance,generalGuests,cases,cellMeetings,generalMeetings,cells]=await Promise.all([
    getAll('attendance'),getAll('generalGuests'),getAll('consolidationCases'),getAll('meetings'),getAll('generalMeetings'),getAll('cells')
  ]);
  const sourceKeys=new Set(cases.map(c=>c.sourceKey).filter(Boolean));
  for(const a of attendance.filter(x=>x.isGuest)){
    const key=`cell:${a.id}`; if(sourceKeys.has(key))continue;
    const m=cellMeetings.find(x=>x.id===a.meetingId); const cell=cells.find(x=>x.id===m?.cellId);
    await putOne('consolidationCases',{
      id:await nextId('consolidationCases'),sourceKey:key,sourceType:'cell',sourceId:a.meetingId,sourceRecordId:a.id,
      name:a.guestName||'Invitado de célula',phone:a.phone||'',email:'',invitedBy:a.invitedBy||'',cellId:m?.cellId||null,
      firstVisitDate:m?.date||today(),status:'Nuevo',responsibleId:cell?.leaderId||null,nextActionType:'WhatsApp',nextActionDate:m?.date||today(),
      notes:'Ingreso automático desde invitado registrado en reunión de célula.',personId:null,createdAt:new Date().toISOString()
    });
    sourceKeys.add(key);
  }
  for(const g of generalGuests){
    const key=`general:${g.id}`; if(sourceKeys.has(key))continue;
    const m=generalMeetings.find(x=>x.id===g.generalMeetingId);
    await putOne('consolidationCases',{
      id:await nextId('consolidationCases'),sourceKey:key,sourceType:'general',sourceId:g.generalMeetingId,sourceRecordId:g.id,
      name:g.name,phone:g.phone||'',email:g.email||'',invitedBy:g.invitedBy||'',cellId:null,firstVisitDate:m?.date||today(),
      status:'Nuevo',responsibleId:g.responsibleId||null,nextActionType:'Llamada',nextActionDate:m?.date||today(),
      notes:'Ingreso automático desde reunión general.',personId:null,createdAt:new Date().toISOString()
    });
    sourceKeys.add(key);
  }
}

export async function renderFollowupList(user){
  await syncConsolidationSources();
  const [cases,followups,people,cells,generalMeetings,cellMeetings]=await Promise.all([
    getAll('consolidationCases'),getAll('followups'),getAll('people'),getAll('cells'),getAll('generalMeetings'),getAll('meetings')
  ]);
  const visible=user.role==='cellLeader'?cases.filter(c=>c.cellId && cells.some(x=>x.id===c.cellId&&(x.leaderId===user.personId||x.traineeLeaderId===user.personId))):cases;
  const sorted=[...visible].sort((a,b)=>String(b.createdAt||b.firstVisitDate||'').localeCompare(String(a.createdAt||a.firstVisitDate||'')));
  const overdue=sorted.filter(isOverdue).length;
  const pending=sorted.filter(c=>['Nuevo','Contactado','En seguimiento'].includes(c.status)).length;
  const integrated=sorted.filter(c=>c.status==='Integrado').length;
  const consolidated=sorted.filter(c=>c.status==='Consolidado').length;
  return `<div class="page-head"><div><div class="eyebrow">Ganar → Consolidar</div><h1>Seguimiento + Consolidación</h1><p>Convierte cada nuevo registro de reunión en una ruta pastoral con responsable, próxima acción e historial.</p></div>${canManage(user)?'<button class="btn btn-primary" id="newCaseBtn">+ Nuevo seguimiento</button>':''}</div>
  <div class="grid kpi-grid"><div class="card kpi"><div class="kpi-label">Por gestionar</div><div class="kpi-value">${pending}</div><div class="kpi-delta">Nuevo / contactado / seguimiento</div></div><div class="card kpi"><div class="kpi-label">Vencidos</div><div class="kpi-value">${overdue}</div><div class="kpi-delta">Próxima acción atrasada</div></div><div class="card kpi"><div class="kpi-label">Integrados</div><div class="kpi-value">${integrated}</div><div class="kpi-delta">Ya conectados a célula</div></div><div class="card kpi"><div class="kpi-label">Consolidados</div><div class="kpi-value">${consolidated}</div><div class="kpi-delta">Proceso completado</div></div></div>
  <section class="card toolbar-card"><div class="filter-grid followup-filters"><div class="field compact"><label>Buscar</label><input id="followupSearch" placeholder="Nombre, teléfono o responsable"></div><div class="field compact"><label>Estado</label><select id="followupStatus"><option value="">Todos</option>${PIPELINE.map(s=>`<option>${s}</option>`).join('')}</select></div><div class="field compact"><label>Origen</label><select id="followupSource"><option value="">Todos</option><option value="general">Reunión general</option><option value="cell">Reunión de célula</option><option value="manual">Manual</option></select></div><div class="field compact"><label>Prioridad</label><select id="followupPriority"><option value="">Todas</option><option value="overdue">Vencidos</option><option value="today">Para hoy</option></select></div></div></section>
  <section class="card section-card pipeline-section"><div class="section-title"><div><h3>Pipeline pastoral</h3><p class="muted">Una vista operativa desde primer contacto hasta consolidación.</p></div><span class="badge">${sorted.length} casos</span></div><div id="pipelineBoard" class="pipeline-board"></div></section>
  <section class="card section-card"><div class="section-title"><h3>Todos los seguimientos</h3><span class="badge">${followups.length} interacciones históricas</span></div><div id="followupResults"></div></section><div id="followupModalRoot"></div>`;
}

export async function bindFollowupList(user){
  await syncConsolidationSources();
  const [cases,followups,people,cells,generalMeetings,cellMeetings]=await Promise.all([getAll('consolidationCases'),getAll('followups'),getAll('people'),getAll('cells'),getAll('generalMeetings'),getAll('meetings')]);
  const visible=user.role==='cellLeader'?cases.filter(c=>c.cellId && cells.some(x=>x.id===c.cellId&&(x.leaderId===user.personId||x.traineeLeaderId===user.personId))):cases;
  const peopleMap=new Map(people.map(p=>[p.id,p]));
  const presetCell=Number(sessionStorage.getItem('activa360_followup_cell_filter')||0); if(presetCell) sessionStorage.removeItem('activa360_followup_cell_filter');
  const presetPerson=Number(sessionStorage.getItem('activa360_followup_person_filter')||0); if(presetPerson) sessionStorage.removeItem('activa360_followup_person_filter');
  const interactionsByCase=new Map(); followups.filter(f=>f.caseId).forEach(f=>{if(!interactionsByCase.has(f.caseId))interactionsByCase.set(f.caseId,[]);interactionsByCase.get(f.caseId).push(f);});
  const filtered=()=>{
    const q=(document.querySelector('#followupSearch')?.value||'').toLowerCase(); const st=document.querySelector('#followupStatus')?.value||''; const src=document.querySelector('#followupSource')?.value||''; const pri=document.querySelector('#followupPriority')?.value||'';
    return visible.filter(c=>{const resp=peopleMap.get(c.responsibleId)?.name||'';const hay=`${c.name} ${c.phone||''} ${resp}`.toLowerCase().includes(q);const pOk=!pri||(pri==='overdue'?isOverdue(c):c.nextActionDate===today());const cellOk=!presetCell||c.cellId===presetCell;const personOk=!presetPerson||c.personId===presetPerson;return hay&&cellOk&&personOk&&(!st||c.status===st)&&(!src||c.sourceType===src)&&pOk;}).sort((a,b)=>String(a.nextActionDate||'9999').localeCompare(String(b.nextActionDate||'9999')));
  };
  const draw=()=>{
    const list=filtered(); const board=document.querySelector('#pipelineBoard'); const results=document.querySelector('#followupResults');
    board.innerHTML=PIPELINE.map(status=>{const arr=list.filter(c=>c.status===status);return `<div class="pipeline-col"><div class="pipeline-col-head"><strong>${status}</strong><span>${arr.length}</span></div><div class="pipeline-stack">${arr.slice(0,8).map(c=>caseCard(c,true)).join('')||'<div class="pipeline-empty">Sin casos</div>'}</div></div>`;}).join('');
    results.innerHTML=`<div class="followup-list">${list.map(c=>{const resp=peopleMap.get(c.responsibleId);const its=interactionsByCase.get(c.id)||[];return `<article class="followup-card ${isOverdue(c)?'overdue':''}"><div class="followup-person"><div class="mini-avatar">${initials(c.name)}</div><div><div class="followup-title-row"><strong>${esc(c.name)}</strong><span class="badge ${stateClass(c.status)}">${esc(c.status)}</span>${isOverdue(c)?'<span class="badge danger">Vencido</span>':''}</div><small>${esc(sourceLabel(c,cells,generalMeetings,cellMeetings))}</small></div></div><div class="followup-meta"><span>☎ ${esc(c.phone||'Sin teléfono')}</span><span>◎ ${esc(resp?.name||'Sin asignar')}</span><span>→ ${esc(c.nextActionType||'Próxima acción')} · ${fmtDate(c.nextActionDate)}</span><span>↺ ${its.length} interacciones</span></div><div class="followup-actions"><button class="btn btn-soft btn-sm" data-case="${c.id}">Abrir seguimiento</button></div></article>`;}).join('')||'<div class="empty-state">No hay casos para los filtros seleccionados.</div>'}</div>`;
    document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>go(`seguimiento/${b.dataset.case}`));
  };
  function caseCard(c){const resp=peopleMap.get(c.responsibleId);return `<button class="pipeline-card ${isOverdue(c)?'overdue':''}" data-case="${c.id}"><strong>${esc(c.name)}</strong><small>${esc(c.phone||'Sin teléfono')}</small><span>${esc(resp?.name||'Sin asignar')}</span><em>${fmtDate(c.nextActionDate)}</em></button>`;}
  ['followupSearch','followupStatus','followupSource','followupPriority'].forEach(id=>document.querySelector('#'+id)?.addEventListener('input',draw));
  document.querySelector('#newCaseBtn')?.addEventListener('click',()=>openCaseModal(null,user)); draw();
}

export async function renderFollowupDetail(id,user){
  await syncConsolidationSources();
  const [c,followups,people,cells,generalMeetings,cellMeetings]=await Promise.all([getOne('consolidationCases',id),getAll('followups'),getAll('people'),getAll('cells'),getAll('generalMeetings'),getAll('meetings')]);
  if(!c)return `<div class="card empty-state">Seguimiento no encontrado.</div>`;
  const interactions=followups.filter(f=>f.caseId===c.id).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))); const resp=people.find(p=>p.id===c.responsibleId); const person=people.find(p=>p.id===c.personId); const cell=cells.find(x=>x.id===c.cellId);
  const pipelineIndex=PIPELINE.indexOf(c.status);
  return `<div class="page-head"><div><button class="link-btn" data-back-followups>← Seguimiento + Consolidación</button><div class="eyebrow">Caso pastoral</div><h1>${esc(c.name)}</h1><p>${esc(sourceLabel(c,cells,generalMeetings,cellMeetings))}</p></div><div class="action-row">${person?`<button class="btn btn-soft" data-open-person="${person.id}">Ver Persona 360</button>`:''}${canManage(user)?'<button class="btn btn-primary" id="newInteractionBtn">+ Registrar seguimiento</button>':''}</div></div>
  <section class="card section-card"><div class="section-title"><div><h3>Ruta de consolidación</h3><p class="muted">Avance pastoral del nuevo desde su primer registro.</p></div><span class="badge ${stateClass(c.status)}">${esc(c.status)}</span></div><div class="journey-steps">${PIPELINE.map((s,i)=>`<div class="journey-step ${i<pipelineIndex?'done':i===pipelineIndex?'active':''}"><span>${i<pipelineIndex?'✓':i+1}</span><strong>${s}</strong></div>`).join('')}</div></section>
  <div class="grid two-col"><section class="card section-card"><div class="section-title"><h3>Información pastoral</h3>${canManage(user)?'<button class="btn btn-soft btn-sm" id="editCaseBtn">Editar</button>':''}</div><div class="info-grid"><div><span>Teléfono</span><strong>${esc(c.phone||'Sin registrar')}</strong></div><div><span>Correo</span><strong>${esc(c.email||'Sin registrar')}</strong></div><div><span>Responsable</span><strong>${esc(resp?.name||'Sin asignar')}</strong></div><div><span>Próxima acción</span><strong>${esc(c.nextActionType||'Por definir')} · ${fmtDate(c.nextActionDate)}</strong></div><div><span>Célula</span><strong>${esc(cell?.name||'Aún sin asignar')}</strong></div><div><span>Invitado por</span><strong>${esc(c.invitedBy||'Sin registrar')}</strong></div><div class="wide"><span>Notas</span><strong class="normal-weight">${esc(c.notes||'Sin notas.')}</strong></div></div></section><section class="card section-card"><div class="section-title"><h3>Acciones rápidas</h3></div><div class="quick-actions">${canManage(user)?`<button class="btn btn-soft" id="quickWhatsApp">WhatsApp</button><button class="btn btn-soft" id="quickCall">Llamada</button><button class="btn btn-soft" id="assignCellBtn">Asignar célula</button>${!person?'<button class="btn btn-primary" id="convertPersonBtn">Crear Persona 360</button>':''}`:'<p class="muted">Consulta del proceso pastoral.</p>'}</div></section></div>
  <section class="card section-card"><div class="section-title"><div><h3>Historial de seguimiento</h3><p class="muted">Cada contacto queda registrado para dar continuidad pastoral.</p></div><span class="badge">${interactions.length}</span></div><div class="timeline followup-timeline">${interactions.map(f=>`<div class="timeline-item"><div class="timeline-dot"></div><div><strong>${esc(f.type||'Seguimiento')} · ${fmtDate(f.date)}</strong><p>${esc(f.notes||f.reason||'Sin observación')}</p><small>${esc(f.result||f.status||'Registrado')}${f.nextActionDate?` · Próxima: ${fmtDate(f.nextActionDate)}`:''}</small></div></div>`).join('')||'<div class="empty-state">Aún no hay interacciones registradas.</div>'}</div></section><div id="followupModalRoot"></div>`;
}

export async function bindFollowupDetail(id,user){
  const c=await getOne('consolidationCases',id); if(!c)return;
  document.querySelector('[data-back-followups]')?.addEventListener('click',()=>go('seguimiento'));
  document.querySelector('[data-open-person]')?.addEventListener('click',e=>go(`personas/${e.currentTarget.dataset.openPerson}`));
  document.querySelector('#newInteractionBtn')?.addEventListener('click',()=>openInteractionModal(c,user));
  document.querySelector('#editCaseBtn')?.addEventListener('click',()=>openCaseModal(c,user));
  document.querySelector('#quickWhatsApp')?.addEventListener('click',()=>openInteractionModal(c,user,'WhatsApp'));
  document.querySelector('#quickCall')?.addEventListener('click',()=>openInteractionModal(c,user,'Llamada'));
  document.querySelector('#assignCellBtn')?.addEventListener('click',()=>openAssignCellModal(c));
  document.querySelector('#convertPersonBtn')?.addEventListener('click',()=>convertToPerson(c));
}

async function openCaseModal(existing,user){
  const [people,cells]=await Promise.all([getAll('people'),getAll('cells')]); const leaders=people.filter(p=>p.active!==false&&(p.leadershipLevel??99)<=3); const root=document.querySelector('#followupModalRoot')||document.querySelector('#globalModal');
  root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">Consolidación</div><h2>${existing?'Editar caso':'Nuevo seguimiento manual'}</h2></div><button class="icon-btn" id="closeCaseModal">×</button></div><form id="caseForm"><div class="form-grid"><div class="field"><label>Nombre *</label><input name="name" required value="${esc(existing?.name||'')}"></div><div class="field"><label>Teléfono</label><input name="phone" value="${esc(existing?.phone||'')}"></div><div class="field"><label>Correo</label><input type="email" name="email" value="${esc(existing?.email||'')}"></div><div class="field"><label>Estado</label><select name="status">${PIPELINE.map(s=>`<option ${existing?.status===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="field"><label>Responsable</label><select name="responsibleId"><option value="">Sin asignar</option>${leaders.map(p=>`<option value="${p.id}" ${existing?.responsibleId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Célula</label><select name="cellId"><option value="">Sin asignar</option>${cells.map(c=>`<option value="${c.id}" ${existing?.cellId===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Próxima acción</label><select name="nextActionType">${ACTION_TYPES.map(s=>`<option ${existing?.nextActionType===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="field"><label>Fecha próxima acción</label><input type="date" name="nextActionDate" value="${esc(existing?.nextActionDate||today())}"></div><div class="field form-span"><label>Notas</label><textarea name="notes" rows="3">${esc(existing?.notes||'')}</textarea></div></div><div class="modal-actions"><button type="button" class="btn" id="cancelCaseModal">Cancelar</button><button class="btn btn-primary">Guardar seguimiento</button></div></form></div></div>`;
  const close=()=>root.innerHTML='';document.querySelector('#closeCaseModal').onclick=close;document.querySelector('#cancelCaseModal').onclick=close;
  document.querySelector('#caseForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const id=existing?.id||await nextId('consolidationCases');await putOne('consolidationCases',{...existing,id,sourceType:existing?.sourceType||'manual',sourceKey:existing?.sourceKey||`manual:${id}`,sourceId:existing?.sourceId||null,name:f.get('name').trim(),phone:f.get('phone').trim(),email:f.get('email').trim(),status:f.get('status'),responsibleId:Number(f.get('responsibleId'))||null,cellId:Number(f.get('cellId'))||null,nextActionType:f.get('nextActionType'),nextActionDate:f.get('nextActionDate'),notes:f.get('notes').trim(),firstVisitDate:existing?.firstVisitDate||today(),createdAt:existing?.createdAt||new Date().toISOString(),personId:existing?.personId||null});close();existing?location.reload():go(`seguimiento/${id}`);};
}

async function openInteractionModal(c,user,preferred){
  const root=document.querySelector('#followupModalRoot'); root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">Seguimiento pastoral</div><h2>Registrar interacción</h2><p class="muted">${esc(c.name)}</p></div><button class="icon-btn" id="closeInteraction">×</button></div><form id="interactionForm"><div class="form-grid"><div class="field"><label>Tipo</label><select name="type">${ACTION_TYPES.map(s=>`<option ${preferred===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="field"><label>Resultado</label><select name="result"><option>Contactado</option><option>Sin respuesta</option><option>Conversación realizada</option><option>Visita realizada</option><option>Compromiso de asistir</option><option>Requiere nueva acción</option></select></div><div class="field"><label>Actualizar estado</label><select name="status">${PIPELINE.map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="field"><label>Próxima acción</label><select name="nextActionType">${ACTION_TYPES.map(s=>`<option ${c.nextActionType===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="field"><label>Fecha próxima acción</label><input type="date" name="nextActionDate" value="${esc(c.nextActionDate||today())}"></div><div class="field form-span"><label>Notas *</label><textarea name="notes" rows="4" required placeholder="Qué ocurrió, necesidad, acuerdo o siguiente paso"></textarea></div></div><div class="modal-actions"><button type="button" class="btn" id="cancelInteraction">Cancelar</button><button class="btn btn-primary">Guardar interacción</button></div></form></div></div>`;
  const close=()=>root.innerHTML='';document.querySelector('#closeInteraction').onclick=close;document.querySelector('#cancelInteraction').onclick=close;
  document.querySelector('#interactionForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);await putOne('followups',{id:await nextId('followups'),caseId:c.id,personId:c.personId||null,type:f.get('type'),date:today(),status:'Realizado',result:f.get('result'),notes:f.get('notes').trim(),nextActionDate:f.get('nextActionDate'),createdBy:user.personId});await putOne('consolidationCases',{...c,status:f.get('status'),nextActionType:f.get('nextActionType'),nextActionDate:f.get('nextActionDate'),lastContactDate:today()});close();location.reload();};
}

async function openAssignCellModal(c){
  const [cells,people]=await Promise.all([getAll('cells'),getAll('people')]); const root=document.querySelector('#followupModalRoot');
  root.innerHTML=`<div class="modal-backdrop"><div class="modal compact-modal"><div class="modal-head"><div><div class="eyebrow">Integración</div><h2>Asignar célula</h2></div><button class="icon-btn" id="closeAssignCell">×</button></div><form id="assignCellForm"><div class="field"><label>Célula</label><select name="cellId" required>${cells.map(x=>`<option value="${x.id}" ${c.cellId===x.id?'selected':''}>${esc(x.name)} · ${esc(x.leader)}</option>`).join('')}</select></div><div class="modal-actions"><button class="btn btn-primary">Asignar e integrar</button></div></form></div></div>`;
  document.querySelector('#closeAssignCell').onclick=()=>root.innerHTML='';document.querySelector('#assignCellForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);await putOne('consolidationCases',{...c,cellId:Number(f.get('cellId')),status:c.status==='Consolidado'?'Consolidado':'Integrado'});root.innerHTML='';location.reload();};
}

async function convertToPerson(c){
  if(!confirm(`¿Crear la Persona 360 de ${c.name} con los datos disponibles?`))return;
  const id=await nextId('people'); await putOne('people',{id,name:c.name,phone:c.phone||'',email:c.email||'',state:'Consolidación',cellId:c.cellId||null,trainingLevel:1,active:true,ministryRole:'Miembro',mentorId:c.responsibleId||null,leadershipLevel:4,origin:'Consolidación'}); await putOne('consolidationCases',{...c,personId:id,status:c.cellId?'Integrado':'En seguimiento'}); go(`personas/${id}`);
}
