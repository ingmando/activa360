import { getAll } from '../database.js';

const fmt = new Intl.NumberFormat('es-CO');
const money = new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});
const today = () => new Date().toISOString().slice(0,10);

function descendants(people, rootId){
  const out=new Set([Number(rootId)]); let changed=true;
  while(changed){changed=false; for(const p of people){if(p.mentorId && out.has(Number(p.mentorId))&&!out.has(Number(p.id))){out.add(Number(p.id));changed=true;}}}
  return out;
}
function scopeData(user, people, cells){
  if(user.role==='pastor') return {personIds:new Set(people.map(p=>Number(p.id))),cells};
  if(user.role==='leader12'){
    const ids=descendants(people,user.personId); return {personIds:ids,cells:cells.filter(c=>ids.has(Number(c.leaderId)))};
  }
  if(user.role==='cellLeader'){
    const mine=cells.filter(c=>Number(c.leaderId)===Number(user.personId)); const ids=new Set(people.filter(p=>mine.some(c=>Number(c.id)===Number(p.cellId))).map(p=>Number(p.id))); ids.add(Number(user.personId)); return {personIds:ids,cells:mine};
  }
  return {personIds:new Set([Number(user.personId)]),cells:[]};
}
function pct(a,b){return b?Math.round(a/b*100):0}
function sparkBars(values,maxValue=Math.max(...values,1)){return `<div class="spark-bars">${values.map(v=>`<span style="height:${Math.max(8,Math.round(v/maxValue*100))}%" title="${v}"></span>`).join('')}</div>`}
function progressRow(label,value,total,help=''){const p=pct(value,total);return `<div class="analytics-row"><div><strong>${label}</strong><small>${help}</small></div><div class="analytics-progress"><span style="width:${p}%"></span></div><b>${p}%</b></div>`}

async function loadReportData(user){
  const [people,cells,meetings,attendance,cases,training,levels,generalMeetings,generalGuests,finances,leadership,ministryMembers,ministryServices,ministries]=await Promise.all([
    getAll('people'),getAll('cells'),getAll('meetings'),getAll('attendance'),getAll('consolidationCases'),getAll('training'),getAll('trainingLevels'),getAll('generalMeetings'),getAll('generalGuests'),getAll('meetingFinances'),getAll('leadershipDevelopment'),getAll('ministryMembers'),getAll('ministryServices'),getAll('ministries')
  ]);
  const scope=scopeData(user,people,cells); const cellIds=new Set(scope.cells.map(c=>Number(c.id)));
  const scopedPeople=people.filter(p=>scope.personIds.has(Number(p.id)));
  const scopedMeetings=user.role==='pastor'?meetings:meetings.filter(m=>cellIds.has(Number(m.cellId)));
  const meetingIds=new Set(scopedMeetings.map(m=>Number(m.id)));
  const scopedAttendance=attendance.filter(a=>meetingIds.has(Number(a.meetingId)));
  const scopedCases=user.role==='pastor'?cases:cases.filter(c=>(c.cellId&&cellIds.has(Number(c.cellId)))||(c.responsibleId&&scope.personIds.has(Number(c.responsibleId))));
  const scopedTraining=training.filter(t=>scope.personIds.has(Number(t.personId)));
  const scopedLeadership=leadership.filter(l=>scope.personIds.has(Number(l.personId))||scope.personIds.has(Number(l.mentorId)));
  return {people,cells,meetings,attendance,cases,training,levels,generalMeetings,generalGuests,finances,leadership,ministryMembers,ministryServices,ministries,scope,scopedPeople,scopedMeetings,scopedAttendance,scopedCases,scopedTraining,scopedLeadership};
}

function summaryTab(d){
  const active=d.scopedPeople.filter(p=>p.active!==false).length;
  const present=d.scopedAttendance.filter(a=>a.status==='Presente').length;
  const registered=d.scopedAttendance.filter(a=>!a.isGuest).length;
  const consolidated=d.scopedCases.filter(c=>c.status==='Consolidado').length;
  const approved=d.scopedTraining.filter(t=>t.status==='Aprobado').length;
  const sent=d.scopedLeadership.filter(l=>l.status==='Enviado').length;
  const weekly=[...d.scopedMeetings].sort((a,b)=>a.date.localeCompare(b.date)).slice(-10).map(m=>Number(m.attendees)||0);
  const pipeline=['Nuevo','Contactado','En seguimiento','Integrado','Consolidado'].map(s=>[s,d.scopedCases.filter(c=>c.status===s).length]);
  return `<div class="report-kpis grid kpi-grid">
    <div class="card kpi"><div class="kpi-label">Personas activas</div><div class="kpi-value">${fmt.format(active)}</div><div class="kpi-delta">${d.scopedPeople.length} bajo alcance</div></div>
    <div class="card kpi"><div class="kpi-label">Células</div><div class="kpi-value">${d.scope.cells.length}</div><div class="kpi-delta">${d.scope.cells.filter(c=>c.status==='Sin reporte').length} requieren atención</div></div>
    <div class="card kpi"><div class="kpi-label">Asistencia celular</div><div class="kpi-value">${pct(present,registered)}%</div><div class="kpi-delta">${present} presentes registrados</div></div>
    <div class="card kpi"><div class="kpi-label">Consolidación</div><div class="kpi-value">${pct(consolidated,d.scopedCases.length)}%</div><div class="kpi-delta">${consolidated} de ${d.scopedCases.length} casos</div></div>
  </div>
  <div class="grid two-col report-grid-gap"><section class="card section-card"><div class="section-title"><div><h3>Actividad de células</h3><p class="muted">Asistentes reportados en los últimos encuentros.</p></div><span class="badge">${weekly.length} registros</span></div>${sparkBars(weekly.length?weekly:[0])}<div class="chart-foot"><span>Menor ${weekly.length?Math.min(...weekly):0}</span><strong>Promedio ${weekly.length?Math.round(weekly.reduce((a,b)=>a+b,0)/weekly.length):0}</strong><span>Mayor ${weekly.length?Math.max(...weekly):0}</span></div></section>
  <section class="card section-card"><div class="section-title"><div><h3>Embudo Ganar → Consolidar</h3><p class="muted">Situación actual de nuevos e invitados.</p></div></div><div class="funnel-list">${pipeline.map(([s,v])=>`<div><span>${s}</span><b>${v}</b><i style="width:${pct(v,Math.max(...pipeline.map(x=>x[1]),1))}%"></i></div>`).join('')}</div></section></div>
  <section class="card section-card"><div class="section-title"><div><h3>Salud del proceso ministerial</h3><p class="muted">Indicadores calculados a partir de la operación registrada.</p></div></div>
  ${progressRow('Ganar',d.scopedCases.length,d.scopedPeople.length,'Nuevos/casos registrados frente al alcance actual')}
  ${progressRow('Consolidar',consolidated,d.scopedCases.length,'Casos que completaron consolidación')}
  ${progressRow('Discipular',approved,d.scopedTraining.length,'Matrículas aprobadas en formación')}
  ${progressRow('Enviar',sent,d.scopedLeadership.length,'Líderes marcados como enviados')}
  </section>`;
}

function cellsTab(d){
  const rows=[...d.scope.cells].sort((a,b)=>(b.attendanceRate||0)-(a.attendanceRate||0));
  return `<section class="card section-card"><div class="section-title"><div><h3>Analítica de células</h3><p class="muted">Cobertura, asistencia y estado de reporte.</p></div><span class="badge">${rows.length} células</span></div><div class="table-wrap"><table><thead><tr><th>Célula</th><th>Líder</th><th>Red</th><th>Localidad</th><th>Miembros</th><th>Asistencia</th><th>Estado</th></tr></thead><tbody>${rows.map(c=>`<tr><td><a href="#/celulas/${c.id}"><strong>${c.name}</strong></a></td><td>${c.leader}</td><td>${c.network}</td><td>${c.locality||'—'}</td><td>${c.members||0}</td><td><div class="mini-bar"><span style="width:${c.attendanceRate||0}%"></span></div><small>${c.attendanceRate||0}%</small></td><td><span class="badge ${c.status==='Sin reporte'?'danger':'success'}">${c.status}</span></td></tr>`).join('')}</tbody></table></div></section>`;
}
function consolidationTab(d){
  const stages=['Nuevo','Contactado','En seguimiento','Integrado','Consolidado'];
  return `<div class="grid two-col report-grid-gap"><section class="card section-card"><div class="section-title"><h3>Conversión por etapa</h3></div>${stages.map(s=>progressRow(s,d.scopedCases.filter(c=>c.status===s).length,d.scopedCases.length,`${d.scopedCases.filter(c=>c.status===s).length} personas`)).join('')}</section><section class="card section-card"><div class="section-title"><h3>Origen de nuevos</h3></div>${['general','cell'].map(type=>{const v=d.scopedCases.filter(c=>c.sourceType===type).length;return progressRow(type==='general'?'Reuniones generales':'Reuniones de célula',v,d.scopedCases.length,`${v} registros`) }).join('')}</section></div>`;
}
function trainingTab(d){
  const sorted=[...d.levels].sort((a,b)=>a.order-b.order);
  return `<div class="training-level-grid">${sorted.map(l=>{const es=d.scopedTraining.filter(t=>(t.levelId||t.level)===l.id);const approved=es.filter(t=>t.status==='Aprobado').length;const avg=es.length?Math.round(es.reduce((s,t)=>s+(Number(t.progress)||0),0)/es.length):0;return `<div class="card training-level-card compact-report"><div class="training-level-top"><span class="level-number">${l.order}</span><span class="badge">${es.length} personas</span></div><h2>${l.name}</h2><p>${l.description||''}</p><div class="training-progress"><div><span>Avance promedio</span><strong>${avg}%</strong></div><div class="progress-track"><span style="width:${avg}%"></span></div></div><div class="mini-stats"><div><strong>${approved}</strong><span>Aprobados</span></div><div><strong>${es.filter(t=>t.status==='En curso').length}</strong><span>En curso</span></div><div><strong>${es.filter(t=>t.status==='Pausado').length}</strong><span>Pausados</span></div></div></div>`}).join('')}</div>`;
}
function leadershipTab(d){
  const stages=['Identificado','Formación','Asistente','Aprobado','Enviado'];
  return `<section class="card section-card"><div class="section-title"><div><h3>Pipeline de liderazgo</h3><p class="muted">Preparación para el envío y multiplicación.</p></div></div><div class="leadership-report-grid">${stages.map(s=>{const v=d.scopedLeadership.filter(l=>l.status===s).length;return `<div><span>${s}</span><strong>${v}</strong><div class="mini-bar"><span style="width:${pct(v,Math.max(...stages.map(x=>d.scopedLeadership.filter(l=>l.status===x).length),1))}%"></span></div></div>`}).join('')}</div></section>`;
}
function generalTab(d){
  const closed=d.generalMeetings.filter(g=>g.status==='Cerrada'); const attend=closed.map(g=>Number(g.attendance)||0); const totalFin=d.finances.reduce((s,f)=>s+(Number(f.amount)||0),0);
  return `<div class="grid kpi-grid"><div class="card kpi"><div class="kpi-label">Reuniones cerradas</div><div class="kpi-value">${closed.length}</div><div class="kpi-delta">Histórico demo</div></div><div class="card kpi"><div class="kpi-label">Asistencia promedio</div><div class="kpi-value">${attend.length?Math.round(attend.reduce((a,b)=>a+b,0)/attend.length):0}</div><div class="kpi-delta">Reuniones generales</div></div><div class="card kpi"><div class="kpi-label">Nuevos registrados</div><div class="kpi-value">${d.generalGuests.length}</div><div class="kpi-delta">Identificados nominalmente</div></div><div class="card kpi"><div class="kpi-label">Movimientos registrados</div><div class="kpi-value kpi-money">${money.format(totalFin)}</div><div class="kpi-delta">Ofrendas + diezmos demo</div></div></div><section class="card section-card report-grid-gap"><div class="section-title"><h3>Tendencia de asistencia general</h3></div>${sparkBars(attend.length?attend:[0])}<div class="chart-foot"><span>${closed.at(-1)?.date||''}</span><strong>${closed.length} reuniones</strong><span>${closed[0]?.date||''}</span></div></section>`;
}
function ministryTab(d){
  return `<section class="card section-card"><div class="section-title"><div><h3>Participación ministerial</h3><p class="muted">Servidores activos y programación.</p></div></div><div class="leadership-report-grid">${d.ministries.map(m=>{const members=d.ministryMembers.filter(x=>x.ministryId===m.id&&x.status!=='Inactivo').length;const services=d.ministryServices.filter(x=>x.ministryId===m.id).length;return `<div><span>${m.name}</span><strong>${members}</strong><small>${services} servicios programados</small><div class="mini-bar"><span style="width:${pct(members,Math.max(...d.ministries.map(mm=>d.ministryMembers.filter(x=>x.ministryId===mm.id&&x.status!=='Inactivo').length),1))}%"></span></div></div>`}).join('')}</div></section>`;
}

function tabContent(tab,d){
  return ({resumen:summaryTab,celulas:cellsTab,consolidacion:consolidationTab,formacion:trainingTab,liderazgo:leadershipTab,reuniones:generalTab,ministerios:ministryTab}[tab]||summaryTab)(d);
}

export async function renderReports(user){
  const d=await loadReportData(user); const defaultTab='resumen';
  return `<div class="page-head"><div><div class="eyebrow">Inteligencia pastoral</div><h1>Reportes y analítica</h1><p>Convierte la operación de Activa 360 en indicadores para acompañar, decidir y multiplicar.</p></div><div class="action-row"><button class="btn btn-soft" id="printReport">Imprimir</button><button class="btn btn-primary" id="exportReport">Exportar CSV</button></div></div>
  <div class="report-toolbar card"><div class="report-tabs">${[['resumen','Resumen'],['celulas','Células'],['consolidacion','Consolidación'],['formacion','Formación'],['liderazgo','Liderazgo'],['reuniones','Reuniones generales'],['ministerios','Ministerios']].map(([k,l])=>`<button data-report-tab="${k}" class="${k===defaultTab?'active':''}">${l}</button>`).join('')}</div><span class="badge scope-badge">${user.scope}</span></div>
  <div id="reportBody">${tabContent(defaultTab,d)}</div>`;
}

export async function bindReports(user){
  const d=await loadReportData(user);
  document.querySelectorAll('[data-report-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-report-tab]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelector('#reportBody').innerHTML=tabContent(btn.dataset.reportTab,d);});
  document.querySelector('#printReport')?.addEventListener('click',()=>window.print());
  document.querySelector('#exportReport')?.addEventListener('click',()=>{
    const rows=[['Indicador','Valor'],['Personas bajo alcance',d.scopedPeople.length],['Células',d.scope.cells.length],['Reuniones de célula',d.scopedMeetings.length],['Casos de consolidación',d.scopedCases.length],['Formación',d.scopedTraining.length],['Liderazgo',d.scopedLeadership.length]];
    const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'); const blob=new Blob([`\ufeff${csv}`],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`activa360-reporte-${today()}.csv`;a.click();URL.revokeObjectURL(a.href);
  });
}
