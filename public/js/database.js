export const STORES = ['users','people','cells','meetings','attendance','followups','training','ministries','settings','generalMeetings','meetingAssignments','meetingFinances','notifications','generalGuests','consolidationCases','trainingLevels','trainingSessions','trainingAttendance','leadershipDevelopment','ministryMembers','ministryServices','alertStates','events','eventTasks','eventParticipants','encounters','encounterGoals','encounterParticipants','encounterTasks','encounterUpdates','encounterFinances','encounterPhaseReports','encounterIncidents','twelveMeetings','twelveMeetingReports','ministryUnits','twelveMeetingInvites'];

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (response.status === 401) {
    sessionStorage.removeItem('activa360_session');
    window.dispatchEvent(new CustomEvent('activa-auth-expired'));
    throw new Error('Sesión expirada. Inicia sesión nuevamente.');
  }
  if (!response.ok) {
    let message = `Error ${response.status}`;
    try { const body = await response.json(); message = body.error || body.message || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function getAll(storeName) {
  return api(`/api/data/${encodeURIComponent(storeName)}`);
}

export async function getOne(storeName, id) {
  const response = await fetch(`/api/data/${encodeURIComponent(storeName)}/${encodeURIComponent(id)}`, { credentials:'same-origin' });
  if (response.status === 404) return null;
  if (response.status === 401) { sessionStorage.removeItem('activa360_session'); window.dispatchEvent(new CustomEvent('activa-auth-expired')); throw new Error('Sesión expirada.'); }
  if (!response.ok) { const body=await response.json().catch(()=>({})); throw new Error(body.error||`Error ${response.status}`); }
  return response.json();
}

export async function putOne(storeName, item) {
  return api(`/api/data/${encodeURIComponent(storeName)}/${encodeURIComponent(item.id)}`, {
    method: 'PUT', body: JSON.stringify(item)
  });
}

export async function putMany(storeName, items) {
  return api(`/api/data/${encodeURIComponent(storeName)}/bulk`, {
    method: 'PUT', body: JSON.stringify({ items })
  });
}

export async function deleteOne(storeName, id) {
  await api(`/api/data/${encodeURIComponent(storeName)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return true;
}

export async function count(storeName) {
  const result = await api(`/api/data/${encodeURIComponent(storeName)}/count`);
  return Number(result.count || 0);
}

export async function nextId(storeName) {
  const result = await api(`/api/data/${encodeURIComponent(storeName)}/next-id`);
  return Number(result.id || 1);
}

export async function clearStore(storeName) {
  await api(`/api/data/${encodeURIComponent(storeName)}/clear`, { method: 'DELETE' });
  return true;
}

export async function exportDatabase() {
  return api('/api/admin/export');
}

export async function importDatabase(payload) {
  await api('/api/admin/import', { method: 'POST', body: JSON.stringify(payload) });
  return true;
}

export async function resetDatabase() {
  await api('/api/admin/reset-demo', { method: 'POST' });
  return true;
}
