import { getAll } from '../database.js';

export async function renderModule(route) {
  if (route === 'personas') {
    const people = (await getAll('people')).slice(0,12);
    return `<div class="page-head"><div><div class="eyebrow">Núcleo pastoral</div><h1>Personas</h1><p>Listado inicial de personas centralizadas en Cloudflare D1.</p></div><button class="btn btn-primary">+ Nueva persona</button></div><div class="card section-card table-wrap"><table><thead><tr><th>Nombre</th><th>Estado</th><th>Nivel</th><th>Activo</th></tr></thead><tbody>${people.map(p=>`<tr><td><strong>${p.name}</strong><div class="muted">${p.email}</div></td><td><span class="badge">${p.state}</span></td><td>Nivel ${p.trainingLevel}</td><td>${p.active?'Sí':'No'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  if (route === 'celulas') {
    const cells = await getAll('cells');
    return `<div class="page-head"><div><div class="eyebrow">Comunidad</div><h1>Células</h1><p>Vista general de células del dataset demo.</p></div><button class="btn btn-primary">+ Nueva célula</button></div><div class="grid kpi-grid">${cells.slice(0,8).map(c=>`<div class="card kpi"><div class="kpi-label">${c.network}</div><div style="font-weight:800;font-size:1.08rem;margin:8px 0">${c.name}</div><div class="muted">${c.leader}</div><div style="margin-top:12px"><span class="badge ${c.status==='Sin reporte'?'danger':''}">${c.status}</span></div></div>`).join('')}</div>`;
  }
  const meta = {
    reuniones:['Reuniones','Registro de encuentros, temas y reportes semanales.'],
    seguimiento:['Seguimiento pastoral','Alertas, contactos y trazabilidad de cuidado pastoral.'],
    formacion:['Formación','Escuelas y tres niveles configurables.'],
    doce:['Equipos de doce','Estructura de liderazgo y cobertura ministerial.'],
    ministerios:['Ministerios','Equipos de servicio y responsables.'],
    reportes:['Reportes','Indicadores, tendencias y análisis pastoral.'],
    configuracion:['Configuración','Roles, estados, niveles y parámetros del sistema.']
  }[route] || ['Módulo','Contenido pendiente'];
  return `<div class="card module-placeholder"><div><div class="icon">◈</div><h2>${meta[0]}</h2><p>${meta[1]}</p><span class="badge">Estructura preparada para Iteración 2+</span></div></div>`;
}
