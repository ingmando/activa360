const SESSION_KEY = 'activa360_session';

export const getSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
};

export async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) return null;
  const data = await response.json();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function logout() {
  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch {}
  sessionStorage.removeItem(SESSION_KEY);
}

export async function validateSession() {
  const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (!response.ok) { sessionStorage.removeItem(SESSION_KEY); return null; }
  const data = await response.json();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No fue posible cambiar la contraseña.');
  return true;
}

// El cambio arbitrario de usuario estaba disponible en el prototipo local.
// En la versión Cloud/D1 cada usuario debe autenticarse con sus propias credenciales.
export async function switchDemoUser() { return null; }
