import { getAll, getOne, putOne, nextId } from '../database.js';
function esc(v=''){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmt(d=''){if(!d)return '—';return new Date(`${d}T12:00:00`).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'});}
function mondayOf(dateStr){const d=new Date(`${dateStr}T12:00:00`);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10);}
function sundayOf(dateStr){const d=new Date(`${mondayOf(dateStr)}T12:00:00`);d.setDate(d.getDate()+6);return d.toISOString().slice(0,10);}
function inRange(d,a,b){return d && d>=a && d<=b;}
function boolBadge(v){return v===true?'<span class="badge success">Sí</span>':v===false?'<span class="badge danger">No</span>':'<span class="badge">Pendiente</span>';}
function canManage(user){return ['pastor','leader12'].includes(user.role);}

async function leaders12(){const people=await getAll('people');return people.filter(p=>Number(p.leadershipLevel)===1 && p.active!==false).slice(0,12);}
async function activeEncounter(){const es=await getAll('encounters');return es.find(e=>['Inscripciones','Preparación','En ejecución'].includes(e.status))||es[0]||null;}
async function autoMetrics(leader,meeting){
  const [cells,cellMeetings,people,training,encParts]=await Promise.all([getAll('cells'),getAll('meetings'),getAll('people'),getAll('training'),getAll('encounterParticipants')]);
  const start=mondayOf(meeting.date),end=sundayOf(meeting.date);
  const coverageIds=new Set([Number(leader.id)]);
  const walk=id=>people.filter(p=>Number(p.mentorId)===Number(id)).forEach(p=>{if(!coverageIds.has(Number(p.id))){coverageIds.add(Number(p.id));walk(p.id);}});
  walk(leader.id);
  const coverageCells=cells.filter(c=>coverageIds.has(Number(c.leaderId)));
  const cellIds=new Set(coverageCells.map(c=>c.id));
  const meetingsDone=cellMeetings.filter(m=>cellIds.has(m.cellId)&&inRange(m.date,start,end)&&m.reported!==false).length;
  const peopleInCoverage=new Set(people.filter(p=>coverageIds.has(Number(p.id)) || cellIds.has(Number(p.cellId))).map(p=>Number(p.id)));
  const schoolPeople=new Set(training.filter(t=>peopleInCoverage.has(Number(t.personId)) && (t.status||'En curso')==='En curso').map(t=>Number(t.personId))).size;
  const enc=await activeEncounter();
  const encounterPeople=enc?encParts.filter(p=>Number(p.encounterId)===Number(enc.id)&&Number(p.leaderId)===Number(leader.id)&&!['Prospecto','No asistió'].includes(p.status)).length:0;
  return {cells:coverageCells.length,meetingsDone,schoolPeople,encounterPeople,encounterTitle:enc?.title||'Sin encuentro activo'};
}

export async function renderTwelveMeetings(user){
  const meetings=(await getAll('twelveMeetings')).sort((a,b)=>b.date.localeCompare(a.date));
  const leaders=await leaders12();
  const latest=meetings[0];
  return `<div class="page-head"><div><div class="eyebrow">Equipo pastoral · liderazgo</div><h1>Reunión de 12</h1><p>Tablero semanal para revisar hábitos, metas y resultados ministeriales del Equipo de 12.</p></div>${user.role==='pastor'?'<button class="btn btn-primary" id="newTwelveMeeting">+ Nueva reunión semanal</button>':''}</div>
  <section class="kpi-grid"><article class="kpi-card"><span>Equipo de 12</span><strong>${leaders.length}/12</strong><small>Líderes activos</small></article><article class="kpi-card"><span>Reuniones registradas</span><strong>${meetings.length}</strong><small>Histórico semanal</small></article><article class="kpi-card"><span>Última reunión</span><strong>${latest?fmt(latest.date):'—'}</strong><small>${latest?.status||'Sin registros'}</small></article><article class="kpi-card"><span>Próxima</span><strong>Martes</strong><small>Revisión semanal del equipo</small></article></section>
  <section class="card section-card"><div class="section-title"><div><div class="eyebrow">Histórico</div><h3>Reuniones semanales</h3></div></div><div class="twelve-meeting-list">${meetings.map(m=>`<button class="twelve-meeting-row" data-twelve="${m.id}"><div><strong>${esc(m.title||'Reunión de 12')}</strong><span>${fmt(m.date)} · ${esc(m.time||'18:30')}</span></div><div><span class="badge">${esc(m.status||'Borrador')}</span><b>Abrir tablero →</b></div></button>`).join('')||'<div class="empty-state">Aún no hay reuniones de 12 registradas.</div>'}</div></section>`;
}

export async function bindTwelveMeetings(user){
  document.querySelectorAll('[data-twelve]').forEach(b=>b.onclick=()=>location.hash=`#/reunion-doce/${b.dataset.twelve}`);
  document.querySelector('#newTwelveMeeting')?.addEventListener('click',()=>openMeetingModal());
}

async function openMeetingModal(){
  const modal=document.querySelector('#globalModal'); const today=new Date().toISOString().slice(0,10);
  modal.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">Reunión semanal</div><h2>Nueva Reunión de 12</h2></div><button class="icon-btn" id="xTwelve">×</button></div><form id="twelveMeetingForm"><div class="form-grid"><div class="field"><label>Fecha</label><input type="date" name="date" value="${today}" required></div><div class="field"><label>Hora</label><input type="time" name="time" value="18:30"></div><div class="field form-span"><label>Tema / enfoque</label><input name="title" value="Reunión semanal del Equipo de 12"></div><div class="field"><label>Estado</label><select name="status"><option>Borrador</option><option>Abierta</option><option>Cerrada</option></select></div><div class="field"><label>Coordinación</label><input name="coordinator" value="Pastores principales"></div><div class="field form-span"><label>Observaciones generales</label><textarea name="notes" rows="3"></textarea></div></div><div class="modal-actions"><button class="btn btn-primary">Crear reunión</button></div></form></div></div>`;
  const close=()=>modal.innerHTML='';document.querySelector('#xTwelve').onclick=close;
  document.querySelector('#twelveMeetingForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const id=await nextId('twelveMeetings');await putOne('twelveMeetings',{id,date:f.get('date'),time:f.get('time'),title:f.get('title'),status:f.get('status'),coordinator:f.get('coordinator'),notes:f.get('notes'),createdAt:new Date().toISOString()});close();location.hash=`#/reunion-doce/${id}`;};
}

export async function renderTwelveMeetingDetail(id,user){
  const meeting=await getOne('twelveMeetings',id);if(!meeting)return '<div class="empty-state">Reunión no encontrada.</div>';
  const leaders=await leaders12(),reports=await getAll('twelveMeetingReports');const mine=reports.filter(r=>Number(r.meetingId)===Number(meeting.id));
  const rows=[];for(const leader of leaders){const report=mine.find(r=>Number(r.leaderId)===Number(leader.id))||{};rows.push({leader,report,auto:await autoMetrics(leader,meeting)});}
  const completed=rows.filter(x=>['devotional','tithe','offering','familyAltar'].every(k=>x.report[k]!==undefined)).length;
  const habitYes=rows.reduce((n,x)=>n+['devotional','tithe','offering','familyAltar'].filter(k=>x.report[k]===true).length,0),habitTotal=rows.length*4;
  const cells=rows.reduce((n,x)=>n+x.auto.cells,0),done=rows.reduce((n,x)=>n+x.auto.meetingsDone,0),enc=rows.reduce((n,x)=>n+x.auto.encounterPeople,0),school=rows.reduce((n,x)=>n+x.auto.schoolPeople,0);
  return `<div class="page-head"><div><button class="link-back" id="backTwelve">← Reuniones de 12</button><div class="eyebrow">Tablero semanal</div><h1>${esc(meeting.title)}</h1><p>${fmt(meeting.date)} · ${esc(meeting.time||'18:30')} · ${esc(meeting.coordinator||'Pastores principales')}</p></div><span class="badge">${esc(meeting.status||'Borrador')}</span></div>
  <section class="twelve-summary-grid" aria-label="Resumen de la reunión">
    <article class="twelve-summary-card"><span>Reportes completos</span><strong>${completed}/${rows.length}</strong><small>Hábitos diligenciados</small></article>
    <article class="twelve-summary-card"><span>Cumplimiento de hábitos</span><strong>${habitTotal?Math.round(habitYes/habitTotal*100):0}%</strong><small>Devocional, diezmo, ofrenda y altar</small></article>
    <article class="twelve-summary-card"><span>Células realizadas</span><strong>${done}/${cells}</strong><small>Calculado desde Células</small></article>
    <article class="twelve-summary-card"><span>Para Encuentro 180°</span><strong>${enc}</strong><small>Inscripciones reportadas</small></article>
  </section>
  <section class="card section-card"><div class="section-title"><div><div class="eyebrow">Matriz de liderazgo</div><h3>Reporte semanal del Equipo de 12</h3><p class="muted">Las métricas ministeriales se calculan desde los módulos del sistema; los hábitos y observaciones se diligencian semanalmente.</p></div></div><div class="table-wrap twelve-table-wrap desktop-twelve"><table class="twelve-table"><thead><tr><th>Líder</th><th>Devocional</th><th>Diezmo</th><th>Ofrenda</th><th>Altar familiar</th><th class="auto-col">Células</th><th class="auto-col">Realizadas</th><th class="auto-col">En escuela</th><th class="auto-col">Encuentro</th><th>Observación</th><th></th></tr></thead><tbody>${rows.map(({leader,report,auto})=>`<tr data-row-leader="${leader.id}"><td><strong>${esc(leader.name)}</strong><small class="table-sub">Equipo de 12</small></td><td>${boolBadge(report.devotional)}</td><td>${boolBadge(report.tithe)}</td><td>${boolBadge(report.offering)}</td><td>${boolBadge(report.familyAltar)}</td><td class="auto-col"><strong>${auto.cells}</strong></td><td class="auto-col"><strong>${auto.meetingsDone}</strong></td><td class="auto-col"><strong>${auto.schoolPeople}</strong></td><td class="auto-col"><strong>${auto.encounterPeople}</strong></td><td>${esc(report.notes||'—')}</td><td>${(user.role==='pastor'||Number(user.personId)===Number(leader.id))?`<button class="btn btn-soft btn-sm" data-edit-report="${leader.id}">${report.id?'Editar':'Reportar'}</button>`:''}</td></tr>`).join('')}</tbody></table></div><div class="twelve-mobile-list">${rows.map(({leader,report,auto})=>`<article class="twelve-leader-card"><div class="twelve-card-head"><div><strong>${esc(leader.name)}</strong><small>Equipo de 12</small></div>${report.id?'<span class="badge success">Reporte registrado</span>':'<span class="badge warn">Pendiente</span>'}</div><div class="habit-grid"><div><span>Devocional</span>${boolBadge(report.devotional)}</div><div><span>Diezmo</span>${boolBadge(report.tithe)}</div><div><span>Ofrenda</span>${boolBadge(report.offering)}</div><div><span>Altar familiar</span>${boolBadge(report.familyAltar)}</div></div><div class="twelve-auto-mobile"><div><strong>${auto.cells}</strong><span>Células</span></div><div><strong>${auto.meetingsDone}</strong><span>Realizadas</span></div><div><strong>${auto.schoolPeople}</strong><span>En escuela</span></div><div><strong>${auto.encounterPeople}</strong><span>Encuentro</span></div></div>${report.notes?`<p class="twelve-note">${esc(report.notes)}</p>`:''}${(user.role==='pastor'||Number(user.personId)===Number(leader.id))?`<button class="btn btn-primary twelve-report-btn" data-edit-report="${leader.id}">${report.id?'Editar reporte':'Completar reporte'}</button>`:''}</article>`).join('')}</div></section>
  <section class="grid two-col"><article class="card section-card"><div class="eyebrow">Lectura automática</div><h3>Indicadores ministeriales</h3><div class="metric-list"><div><span>Células activas del Equipo de 12</span><strong>${cells}</strong></div><div><span>Reuniones de célula reportadas esta semana</span><strong>${done}</strong></div><div><span>Personas en escuela</span><strong>${school}</strong></div><div><span>Personas reportadas para Encuentro 180°</span><strong>${enc}</strong></div></div></article><article class="card section-card"><div class="eyebrow">Notas pastorales</div><h3>Conclusiones de la semana</h3><textarea id="twelveGeneralNotes" rows="7" placeholder="Acuerdos, llamados de atención, oración, prioridades y próximos pasos...">${esc(meeting.notes||'')}</textarea>${user.role==='pastor'?'<button class="btn btn-primary" id="saveTwelveNotes" style="margin-top:12px">Guardar conclusiones</button>':''}</article></section>`;
}

export async function bindTwelveMeetingDetail(id,user){
  document.querySelector('#backTwelve')?.addEventListener('click',()=>location.hash='#/reunion-doce');
  document.querySelectorAll('[data-edit-report]').forEach(b=>b.onclick=()=>openReportModal(Number(id),Number(b.dataset.editReport),user));
  document.querySelector('#saveTwelveNotes')?.addEventListener('click',async()=>{const m=await getOne('twelveMeetings',id);await putOne('twelveMeetings',{...m,notes:document.querySelector('#twelveGeneralNotes').value});alert('Conclusiones guardadas.');});
}

async function openReportModal(meetingId,leaderId,user){
  const [meeting,leader,reports]=await Promise.all([getOne('twelveMeetings',meetingId),getOne('people',leaderId),getAll('twelveMeetingReports')]);
  const r=reports.find(x=>Number(x.meetingId)===Number(meetingId)&&Number(x.leaderId)===Number(leaderId))||{};const auto=await autoMetrics(leader,meeting);const modal=document.querySelector('#globalModal');
  const yesNo=(name,val)=>`<select name="${name}" required><option value="">Seleccionar</option><option value="true" ${val===true?'selected':''}>Sí</option><option value="false" ${val===false?'selected':''}>No</option></select>`;
  modal.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">Reporte semanal</div><h2>${esc(leader.name)}</h2><p class="muted">${fmt(meeting.date)}</p></div><button class="icon-btn" id="xReport12">×</button></div><form id="report12Form"><div class="form-grid"><div class="field"><label>¿Hizo devocional esta semana?</label>${yesNo('devotional',r.devotional)}</div><div class="field"><label>¿Está diezmando?</label>${yesNo('tithe',r.tithe)}</div><div class="field"><label>¿Dio ofrenda?</label>${yesNo('offering',r.offering)}</div><div class="field"><label>¿Realizó altar familiar?</label>${yesNo('familyAltar',r.familyAltar)}</div><div class="field form-span"><div class="auto-summary"><div><span>Células</span><strong>${auto.cells}</strong></div><div><span>Realizadas</span><strong>${auto.meetingsDone}</strong></div><div><span>En escuela</span><strong>${auto.schoolPeople}</strong></div><div><span>Encuentro</span><strong>${auto.encounterPeople}</strong></div></div></div><div class="field form-span"><label>Observaciones / compromisos</label><textarea name="notes" rows="4">${esc(r.notes||'')}</textarea></div></div><div class="modal-actions"><button class="btn btn-primary">Guardar reporte</button></div></form></div></div>`;
  const close=()=>modal.innerHTML='';document.querySelector('#xReport12').onclick=close;
  document.querySelector('#report12Form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);await putOne('twelveMeetingReports',{id:r.id||await nextId('twelveMeetingReports'),meetingId:Number(meetingId),leaderId:Number(leaderId),devotional:f.get('devotional')==='true',tithe:f.get('tithe')==='true',offering:f.get('offering')==='true',familyAltar:f.get('familyAltar')==='true',notes:f.get('notes').trim(),updatedAt:new Date().toISOString()});close();location.hash=`#/reunion-doce/${meetingId}`;window.dispatchEvent(new HashChangeEvent('hashchange'));};
}
