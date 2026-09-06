export const routes = {
  dashboard: { label: 'Dashboard', icon: '⌂' },
  personas: { label: 'Personas', icon: '◉' },
  celulas: { label: 'Células', icon: '⌂' },
  'reuniones-generales': { label: 'Reuniones generales', icon: '✦' },
  eventos: { label: 'Eventos', icon: '◈' },
  encuentros: { label: 'Encuentros 180°', icon: '180°' },
  reuniones: { label: 'Reuniones de célula', icon: '◷' },
  seguimiento: { label: 'Seguimiento', icon: '✓' },
  formacion: { label: 'Formación', icon: '▤' },
  doce: { label: 'Equipos de doce', icon: '♢' },
  'reunion-doce': { label: 'Reunión de 12', icon: '12' },
  arbol: { label: 'Árbol ministerial', icon: '⌘' },
  ministerios: { label: 'Ministerios', icon: '✦' },
  reportes: { label: 'Reportes', icon: '▥' },
  alertas: { label: 'Centro de alertas', icon: '!' },
  configuracion: { label: 'Configuración', icon: '⚙' }
};
export function currentRoute() { return location.hash.replace('#/','') || 'dashboard'; }
export function baseRoute(route = currentRoute()) { return (route.split('/')[0] || 'dashboard').split('?')[0]; }
export function routeParam(route = currentRoute(), index = 1) { return route.split('/')[index] || null; }
export function go(route) { location.hash = `#/${route}`; }
