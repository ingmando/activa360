import { demoUsers } from './seed.js';
import { login, logout, getSession, switchDemoUser, changePassword, validateSession } from './auth.js';
import { routes, currentRoute, baseRoute, routeParam, go } from './router.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderModule } from './modules/placeholders.js';
import { renderPeopleList, bindPeopleList, renderPersonDetail, bindPersonDetail } from './modules/personas.js';
import { renderCellsList, bindCellsList, renderCellDetail, bindCellDetail } from './modules/celulas.js';
import { renderMinisterialTree, bindMinisterialTree } from './modules/ministerial.js';
import { renderTeamsHome, bindTeamsHome, renderTeamDetail, bindTeamDetail } from './modules/liderazgo.js';
import { renderMeetingsList, bindMeetingsList, renderMeetingDetail, bindMeetingDetail } from './modules/reuniones.js';
import { renderGeneralMeetingsList, bindGeneralMeetingsList, renderGeneralMeetingDetail, bindGeneralMeetingDetail } from './modules/reuniones-generales.js';
import { renderEventsList, bindEventsList, renderEventDetail, bindEventDetail } from './modules/eventos.js';
import { renderEncountersList, bindEncountersList, renderEncounterDetail, bindEncounterDetail } from './modules/encuentros.js';
import { renderFollowupList, bindFollowupList, renderFollowupDetail, bindFollowupDetail } from './modules/seguimiento.js';
import { renderTrainingHome, bindTrainingHome, renderTrainingLevel, bindTrainingLevel } from './modules/formacion.js';
import { renderMinistriesHome, bindMinistriesHome, renderMinistryDetail, bindMinistryDetail } from './modules/ministerios.js';
import { renderReports, bindReports } from './modules/reportes.js';
import { renderAlerts, bindAlerts, activeAlertCount } from './modules/alertas.js';
import { renderSettings, bindSettings } from './modules/configuracion.js';
import { renderTwelveMeetings, bindTwelveMeetings, renderTwelveMeetingDetail, bindTwelveMeetingDetail } from './modules/reunion-doce.js';

const root=document.querySelector('#app');
const PRESENTATION_KEY='activa360_presentation';
function initials(name='A 360'){return name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function presentationOn(){return sessionStorage.getItem(PRESENTATION_KEY)==='1';}
function setPresentation(on){sessionStorage.setItem(PRESENTATION_KEY,on?'1':'0');}

function loginView(){
  root.innerHTML=`<div class="login-shell"><section class="login-hero"><div class="login-hero-inner"><div class="official-logo-wrap login-logo"><img src="assets/images/logo-activa-horizontal-white.png" alt="Activa Tu Corazón · Iglesia Cristiana"></div><div class="login-product"><div class="eyebrow login-eyebrow">Plataforma pastoral integral</div><h1>Activa <span>360</span></h1><p class="login-lead">Un solo lugar para acompañar personas, células, liderazgo, formación y ministerios.</p><div class="login-purpose"><span class="purpose-line"></span><p>Del primer contacto al liderazgo: cuidado, crecimiento y multiplicación.</p></div></div></div></section><section class="login-panel"><form id="loginForm" class="login-card"><div class="version-pill">v1.2.1 Stable · D1</div><h2>Bienvenido</h2><p>Ingresa con tu cuenta de Activa 360. Los datos se almacenan de forma centralizada en Cloudflare D1.</p><div class="field"><label>Correo</label><input id="email" type="email" autocomplete="username" placeholder="tu@correo.com" required></div><div class="field"><label>Contraseña</label><input id="password" type="password" autocomplete="current-password" required></div><div class="login-actions"><button class="btn btn-primary" style="flex:1">Entrar a Activa 360</button></div><div class="demo-help">Acceso protegido por sesión de servidor. Usa la cuenta asignada por el administrador y cambia la contraseña inicial antes de ingresar datos reales.</div></form></section></div>`;
  document.querySelector('#loginForm').onsubmit=async e=>{
    e.preventDefault();
    const btn=e.currentTarget.querySelector('button'); btn.disabled=true; btn.textContent='Ingresando…';
    try{
      const user=await login(document.querySelector('#email').value.trim(),document.querySelector('#password').value);
      if(!user){ alert('Credenciales inválidas'); return; }
      go('dashboard'); await renderApp();
    } finally { btn.disabled=false; btn.textContent='Entrar a Activa 360'; }
  };
}

function allowedRoutes(role){
  const all=Object.keys(routes);
  if(role==='pastor')return all;
  if(role==='leader12')return all.filter(r=>r!=='configuracion');
  if(role==='cellLeader')return ['dashboard','personas','celulas','reuniones-generales','eventos','reuniones','seguimiento','formacion','doce','arbol','ministerios','reportes','alertas'];
  if(role==='server')return ['dashboard','reuniones-generales','eventos','formacion','ministerios','alertas'];
  return ['dashboard','reuniones-generales','eventos','formacion','alertas'];
}

async function renderContent(user){
  const route=currentRoute(),base=baseRoute(route),param=routeParam(route),allowed=allowedRoutes(user.role);
  const view=document.querySelector('#view');
  if(!allowed.includes(base)){
    view.innerHTML=`<div class="page-head"><div><div class="eyebrow">Permisos</div><h1>${routes[base]?.label||'Módulo restringido'}</h1><p>Este módulo no está habilitado para el perfil activo.</p></div></div><section class="card section-card access-denied"><div class="access-denied-icon">🔒</div><div><h2>Acceso restringido</h2><p>El módulo <strong>${routes[base]?.label||base}</strong> requiere un perfil con permisos administrativos. Para la demostración, cambia al perfil <strong>Pastor principal</strong> desde el menú superior.</p><button class="btn btn-primary" id="backDashboardDenied">Volver al Dashboard</button></div></section>`;
    document.querySelector('#pageTitle').textContent=routes[base]?.label||'Activa 360';
    document.querySelector('#backDashboardDenied')?.addEventListener('click',()=>go('dashboard'));
    document.querySelectorAll('[data-route]').forEach(b=>b.classList.remove('active'));
    return;
  }
  if(base==='dashboard')view.innerHTML=await renderDashboard(user);
  else if(base==='personas'&&param){view.innerHTML=await renderPersonDetail(param,user);await bindPersonDetail(param,user);}
  else if(base==='personas'){view.innerHTML=await renderPeopleList(user);await bindPeopleList(user);}
  else if(base==='celulas'&&param){view.innerHTML=await renderCellDetail(param,user);await bindCellDetail(param,user);}
  else if(base==='celulas'){view.innerHTML=await renderCellsList(user);await bindCellsList(user);}
  else if(base==='reuniones-generales'&&param){view.innerHTML=await renderGeneralMeetingDetail(param,user);await bindGeneralMeetingDetail(param,user);}
  else if(base==='reuniones-generales'){view.innerHTML=await renderGeneralMeetingsList(user);await bindGeneralMeetingsList(user);}
  else if(base==='eventos'&&param){view.innerHTML=await renderEventDetail(param,user);await bindEventDetail(param,user);}
  else if(base==='eventos'){view.innerHTML=await renderEventsList(user);await bindEventsList(user);}
  else if(base==='encuentros'&&param){view.innerHTML=await renderEncounterDetail(param,user);await bindEncounterDetail(param,user);}
  else if(base==='encuentros'){view.innerHTML=await renderEncountersList(user);await bindEncountersList(user);}
  else if(base==='reuniones'&&param){view.innerHTML=await renderMeetingDetail(param,user);await bindMeetingDetail(param,user);}
  else if(base==='reuniones'){view.innerHTML=await renderMeetingsList(user);await bindMeetingsList(user);}
  else if(base==='seguimiento'&&param){view.innerHTML=await renderFollowupDetail(param,user);await bindFollowupDetail(param,user);}
  else if(base==='seguimiento'){view.innerHTML=await renderFollowupList(user);await bindFollowupList(user);}
  else if(base==='formacion'&&param){view.innerHTML=await renderTrainingLevel(param,user);await bindTrainingLevel(param,user);}
  else if(base==='formacion'){view.innerHTML=await renderTrainingHome(user);await bindTrainingHome(user);}
  else if(base==='doce'&&param){view.innerHTML=await renderTeamDetail(param,user);await bindTeamDetail(param,user);}
  else if(base==='doce'){view.innerHTML=await renderTeamsHome(user);await bindTeamsHome(user);}
  else if(base==='reunion-doce'&&param){view.innerHTML=await renderTwelveMeetingDetail(param,user);await bindTwelveMeetingDetail(param,user);}
  else if(base==='reunion-doce'){view.innerHTML=await renderTwelveMeetings(user);await bindTwelveMeetings(user);}
  else if(base==='arbol'){view.innerHTML=await renderMinisterialTree(user);await bindMinisterialTree(user);}
  else if(base==='ministerios'&&param){view.innerHTML=await renderMinistryDetail(param,user);await bindMinistryDetail(param,user);}
  else if(base==='ministerios'){view.innerHTML=await renderMinistriesHome(user);await bindMinistriesHome(user);}
  else if(base==='reportes'){view.innerHTML=await renderReports(user);await bindReports(user);}
  else if(base==='alertas'){view.innerHTML=await renderAlerts(user);await bindAlerts(user);}
  else if(base==='configuracion'){view.innerHTML=await renderSettings(user);await bindSettings(user);}
  else view.innerHTML=await renderModule(base);
  document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===base));
  document.querySelector('#pageTitle').textContent=routes[base]?.label||'Activa 360';
}

function layout(user){
  const allowed=allowedRoutes(user.role);
  return `<div class="app-shell ${presentationOn()?'presentation-mode':''}">
  <aside class="sidebar"><div class="sidebar-brand"><div class="sidebar-logo"><img src="assets/images/isotipo-activa-white.png" alt="Activa Tu Corazón"></div><div><strong>Activa 360</strong><small>Plataforma pastoral · v1.2.1 Stable</small></div></div><nav class="nav">${allowed.map(r=>`<button class="nav-btn" data-route="${r}"><span class="nav-icon">${routes[r].icon}</span><span class="nav-label">${routes[r].label}</span></button>`).join('')}</nav><div class="sidebar-footer"><div class="mini-brand">Activa Tu Corazón · Bogotá Norte</div></div></aside>
  <main class="main"><header class="topbar"><div><div class="eyebrow desktop-title">Activa Tu Corazón</div><h2 id="pageTitle">Dashboard</h2></div><div class="top-actions"><button id="presentationBtn" class="presentation-toggle ${presentationOn()?'active':''}" title="Modo presentación"><span>▶</span><span class="hide-mobile">Presentación</span></button><button id="notificationBtn" class="icon-btn notification-btn" title="Centro de alertas">!<span class="notification-dot" id="alertCount">0</span></button><div class="user-menu-wrap"><button id="userMenuBtn" class="user-menu-btn"><div class="avatar top-avatar">${initials(user.name)}</div><div class="user-menu-copy"><strong>${user.name}</strong><small>${user.roleName}</small></div><span class="chevron">⌄</span></button><div id="userDropdown" class="user-dropdown" hidden><button id="profileBtn">◉ Mi perfil</button><button id="changePasswordBtn">🔑 Cambiar contraseña</button><div class="dropdown-sep"></div><button id="logoutBtn" class="danger-action">↪ Cerrar sesión</button></div></div></div></header>${presentationOn()?'<div class="presentation-strip"><strong>Modo presentación activo</strong><span>Datos centralizados · Recorrido guiado del sistema</span><div class="presentation-strip-actions"><button id="tourBtn">Recorrido demo</button></div></div>':''}<section id="view" class="content"></section></main>
  <nav class="mobile-bottom">${['dashboard','personas','celulas','reuniones-generales','arbol'].filter(r=>allowed.includes(r)).map(r=>`<button data-route="${r}"><span class="mi">${routes[r].icon}</span><span>${routes[r].label.replace('Árbol ministerial','Árbol').replace('Reuniones generales','Reuniones')}</span></button>`).join('')}</nav><div id="globalModal"></div></div>`;
}



function openPresentationTour(){
  const modal=document.querySelector('#globalModal');
  const steps=[
    ['dashboard','Dashboard pastoral','Presenta visión general, KPIs y alcance por rol.'],
    ['reuniones-generales','Reuniones generales','Muestra planeación, operación, asistentes, finanzas y mejoras.'],
    ['encuentros','Encuentros 180°','Presenta metas, Equipo de 12, inscripciones, logística y seguimiento.'],
    ['reunion-doce','Reunión de 12','Muestra el tablero semanal, hábitos personales y métricas calculadas automáticamente.'],
    ['eventos','Eventos','Muestra planificación abierta de congresos, lanzamientos y actividades especiales.'],
    ['celulas','Células','Abre una Ficha Célula 360 y sus reuniones semanales.'],
    ['seguimiento','Seguimiento + Consolidación','Explica cómo un nuevo pasa del primer contacto a integración.'],
    ['formacion','Formación','Revisa niveles, sesiones, asistencia y progreso.'],
    ['arbol','Árbol ministerial','Explica Pastores → 12 → 144 → 1728 y navegación por cobertura.'],
    ['ministerios','Ministerios','Presenta servidores, funciones y programación por reunión.'],
    ['reportes','Reportes y alertas','Cierra con analítica pastoral y acciones prioritarias.']
  ];
  modal.innerHTML=`<div class="modal-backdrop role-backdrop"><div class="modal tour-modal"><div class="modal-head"><div><div class="eyebrow">Modo presentación</div><h2>Recorrido sugerido de Activa 360</h2><p class="muted">Una demostración ejecutiva de 10–15 minutos, de la visión a la operación.</p></div><button class="icon-btn" id="closeTour">×</button></div><div class="tour-list">${steps.map((s,i)=>`<button class="tour-step" data-tour-route="${s[0]}"><b>${i+1}</b><span><strong>${s[1]}</strong><small>${s[2]}</small></span><em>Ir →</em></button>`).join('')}</div></div></div>`;
  const close=()=>modal.innerHTML='';document.querySelector('#closeTour').onclick=close;
  modal.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)close();});
  modal.querySelectorAll('[data-tour-route]').forEach(b=>b.onclick=()=>{go(b.dataset.tourRoute);close();});
}

function openRoleModal(currentUser){
  const modal=document.querySelector('#globalModal');
  modal.innerHTML=`<div class="modal-backdrop role-backdrop"><div class="modal role-modal"><div class="modal-head"><div><div class="eyebrow">Demostración</div><h2>Seleccionar experiencia por rol</h2><p class="muted">Cada perfil visualiza sus módulos, alcance, alertas y acciones autorizadas.</p></div><button class="icon-btn" id="closeRoleModal">×</button></div><div class="role-grid">${demoUsers.map(u=>`<button class="role-card ${u.id===currentUser.id?'active':''}" data-demo-user="${u.id}"><div class="role-avatar role-${u.role}">${initials(u.name)}</div><div class="role-copy"><strong>${u.roleName}</strong><span>${u.description}</span><small>${u.name}</small></div><b>${u.id===currentUser.id?'Activo':'Seleccionar'}</b></button>`).join('')}</div></div></div>`;
  const close=()=>modal.innerHTML='';
  document.querySelector('#closeRoleModal').onclick=close;
  modal.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)close();});
  modal.querySelectorAll('[data-demo-user]').forEach(btn=>btn.onclick=async()=>{await switchDemoUser(btn.dataset.demoUser);go('dashboard');close();renderApp();});
}

function openProfile(user){
  const modal=document.querySelector('#globalModal');
  modal.innerHTML=`<div class="modal-backdrop"><div class="modal profile-modal"><div class="modal-head"><div><div class="eyebrow">Mi perfil</div><h2>${user.name}</h2></div><button class="icon-btn" id="closeProfile">×</button></div><div class="profile-hero compact"><div class="profile-avatar">${initials(user.name)}</div><div><span class="badge">${user.roleName}</span><h3>${user.scope}</h3><p class="muted">${user.description||''}</p></div></div></div></div>`;
  document.querySelector('#closeProfile').onclick=()=>modal.innerHTML='';
}


function openChangePassword(){
  const modal=document.querySelector('#globalModal');
  modal.innerHTML=`<div class="modal-backdrop"><div class="modal profile-modal"><div class="modal-head"><div><div class="eyebrow">Seguridad</div><h2>Cambiar contraseña</h2><p class="muted">Usa una contraseña de al menos 10 caracteres.</p></div><button class="icon-btn" id="closePassword">×</button></div><form id="passwordForm" class="form-grid"><div class="field"><label>Contraseña actual</label><input id="currentPassword" type="password" autocomplete="current-password" required></div><div class="field"><label>Nueva contraseña</label><input id="newPassword" type="password" minlength="10" autocomplete="new-password" required></div><div class="field"><label>Confirmar nueva contraseña</label><input id="confirmPassword" type="password" minlength="10" autocomplete="new-password" required></div><div class="form-actions"><button class="btn btn-primary">Actualizar contraseña</button></div></form></div></div>`;
  const close=()=>modal.innerHTML='';
  document.querySelector('#closePassword').onclick=close;
  document.querySelector('#passwordForm').onsubmit=async e=>{
    e.preventDefault(); const current=document.querySelector('#currentPassword').value; const next=document.querySelector('#newPassword').value; const confirm=document.querySelector('#confirmPassword').value;
    if(next!==confirm){alert('Las nuevas contraseñas no coinciden.');return;}
    try{await changePassword(current,next);alert('Contraseña actualizada. Debes iniciar sesión nuevamente.');await logout();close();loginView();}
    catch(err){alert(err.message||'No fue posible cambiar la contraseña.');}
  };
}
async function renderApp(){
  const user=getSession();if(!user)return loginView();
  root.innerHTML=layout(user);
  root.querySelectorAll('[data-route]').forEach(btn=>btn.onclick=()=>go(btn.dataset.route));
  const menu=document.querySelector('#userDropdown');
  document.querySelector('#userMenuBtn').onclick=e=>{e.stopPropagation();menu.hidden=!menu.hidden;};
  document.addEventListener('click',()=>{if(menu)menu.hidden=true;},{once:true});
  document.querySelector('#switchRoleBtn')?.addEventListener('click',()=>openRoleModal(user));
  
  document.querySelector('#tourBtn')?.addEventListener('click',()=>openPresentationTour());
  document.querySelector('#profileBtn').onclick=()=>openProfile(user);
  document.querySelector('#changePasswordBtn')?.addEventListener('click',()=>openChangePassword());
  document.querySelector('#logoutBtn').onclick=async()=>{await logout();history.replaceState(null,'',location.pathname);loginView();};
  document.querySelector('#presentationBtn').onclick=()=>{setPresentation(!presentationOn());renderApp();};
  document.querySelector('#notificationBtn').onclick=()=>go('alertas');
  const refreshAlertBadge=async()=>{const n=await activeAlertCount(user);const badge=document.querySelector('#alertCount');if(badge){badge.textContent=n>99?'99+':String(n);badge.style.display=n?'grid':'none';}document.querySelector('#notificationBtn')?.classList.toggle('has-critical',n>0);};
  window.addEventListener('activa-alerts-changed',refreshAlertBadge,{once:true});
  await refreshAlertBadge();
  await renderContent(user);
}
window.addEventListener('activa-open-tour',()=>openPresentationTour());
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}


window.addEventListener('activa-auth-expired',()=>{history.replaceState(null,'',location.pathname);loginView();});
window.addEventListener('hashchange',()=>{const u=getSession();if(u)renderContent(u);});
await validateSession().catch(()=>null);
renderApp();
