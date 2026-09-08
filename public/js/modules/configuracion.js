import { getAll, getOne, putOne, exportDatabase, importDatabase, resetDatabase } from '../database.js';

const DEFAULT_SETTINGS={
  id:1,
  churchName:'Activa Tu Corazón',
  campus:'Bogotá Norte',
  city:'Bogotá D.C.',
  generalMeetingSunday:'09:00',
  generalMeetingTuesday:'18:30',
  contactEmail:'',
  contactPhone:'',
  demoMode:true,
  updatedAt:new Date().toISOString()
};

function downloadText(filename,text,type='application/json'){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}

export async function renderSettings(user){
  let s=await getOne('settings',1); if(!s){s=DEFAULT_SETTINGS;await putOne('settings',s);}
  return `<div class="page-head"><div><div class="eyebrow">Administración</div><h1>Configuración</h1><p>Parámetros generales, respaldo remoto y herramientas administrativas del MVP Cloud.</p></div><span class="badge presentation-badge">Activa 360 v1.3.3 Cloud</span></div>
  <div class="grid settings-grid">
    <section class="card section-card"><div class="section-title"><div><h2>Datos de la iglesia</h2><p class="muted">Información básica de la sede y operación pastoral.</p></div></div>
      <form id="settingsForm" class="form-grid two-col-form">
        <div class="field"><label>Nombre de la iglesia</label><input id="churchName" value="${s.churchName||''}"></div>
        <div class="field"><label>Sede</label><input id="campus" value="${s.campus||''}"></div>
        <div class="field"><label>Ciudad</label><input id="city" value="${s.city||''}"></div>
        <div class="field"><label>Correo institucional</label><input id="contactEmail" type="email" value="${s.contactEmail||''}" placeholder="correo@iglesia.org"></div>
        <div class="field"><label>Teléfono</label><input id="contactPhone" value="${s.contactPhone||''}" placeholder="+57 ..."></div>
        <div class="field"><label>Reunión principal domingo</label><input id="generalMeetingSunday" type="time" value="${s.generalMeetingSunday||'09:00'}"></div>
        <div class="field"><label>Reunión martes</label><input id="generalMeetingTuesday" type="time" value="${s.generalMeetingTuesday||'18:30'}"></div>
        <div class="form-actions"><button class="btn btn-primary">Guardar configuración</button></div>
      </form>
    </section>
    <section class="card section-card"><div class="section-title"><div><h2>Respaldo de Cloudflare D1</h2><p class="muted">Exporta o restaura la información centralizada almacenada en Cloudflare D1.</p></div></div>
      <div class="utility-stack">
        <button id="exportBackup" class="utility-card"><span class="utility-icon">⇩</span><span><strong>Exportar respaldo JSON</strong><small>Descarga personas, células, reuniones, formación, ministerios y demás datos desde D1.</small></span></button>
        <label class="utility-card file-utility"><span class="utility-icon">⇧</span><span><strong>Importar respaldo JSON</strong><small>Reemplaza los datos centrales por un respaldo previamente exportado.</small></span><input id="importBackup" type="file" accept="application/json,.json" hidden></label>
        <button id="resetDemo" class="utility-card danger-utility"><span class="utility-icon">↻</span><span><strong>Restaurar datos demo</strong><small>Restaura en D1 el dataset oficial de presentación incluido en la versión.</small></span></button>
      </div>
    </section>
  </div>
  <section class="card section-card presentation-checklist"><div class="section-title"><div><h2>Checklist para presentar Activa 360</h2><p class="muted">Recorrido recomendado para una demostración de 10–15 minutos.</p></div><button id="startTour" class="btn btn-secondary">▶ Abrir recorrido</button></div>
    <div class="checklist-grid">
      ${['Dashboard pastoral y cambio de rol','Reuniones generales: antes, durante y después','Células y reuniones de célula','Seguimiento + Consolidación','Formación y escuelas','Equipos de doce + árbol ministerial','Ministerios + programación de servidores','Reportes + Centro de alertas'].map((x,i)=>`<div class="check-item"><b>${i+1}</b><span>${x}</span></div>`).join('')}
    </div>
  </section>`;
}

export async function bindSettings(user){
  document.querySelector('#settingsForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const old=await getOne('settings',1)||{};
    const val=id=>document.querySelector('#'+id)?.value||'';
    await putOne('settings',{...old,id:1,churchName:val('churchName').trim(),campus:val('campus').trim(),city:val('city').trim(),contactEmail:val('contactEmail').trim(),contactPhone:val('contactPhone').trim(),generalMeetingSunday:val('generalMeetingSunday'),generalMeetingTuesday:val('generalMeetingTuesday'),updatedAt:new Date().toISOString()});
    alert('Configuración guardada.');
  });
  document.querySelector('#exportBackup')?.addEventListener('click',async()=>{
    const data=await exportDatabase();
    const stamp=new Date().toISOString().slice(0,10);
    downloadText(`activa360-respaldo-${stamp}.json`,JSON.stringify(data,null,2));
  });
  document.querySelector('#importBackup')?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(!confirm('La importación reemplazará la información central actual en D1. ¿Continuar?'))return;
    try{const data=JSON.parse(await file.text());await importDatabase(data);alert('Respaldo importado correctamente. La aplicación se recargará.');location.reload();}
    catch(err){console.error(err);alert('No fue posible importar el respaldo. Verifica que sea un archivo válido de Activa 360.');}
  });
  document.querySelector('#resetDemo')?.addEventListener('click',async()=>{
    if(!confirm('Esto reemplazará los datos actuales de D1 por el dataset demo inicial. ¿Continuar?'))return;
    await resetDatabase();sessionStorage.removeItem('activa360_session');alert('Datos demo restaurados.');location.reload();
  });
  document.querySelector('#startTour')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('activa-open-tour')));
}
