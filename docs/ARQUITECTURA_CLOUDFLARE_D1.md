# Arquitectura Cloudflare — Activa 360 v1.2

## Componentes

### Cloudflare Workers Static Assets
Sirve `public/` (HTML, CSS, JS, imágenes, manifest y service worker) desde la red de Cloudflare.

### Cloudflare Worker
`src/worker.js` actúa como backend y expone:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/data/:store`
- `/api/admin/export`
- `/api/admin/import`
- `/api/admin/reset-demo`

### Cloudflare D1
Base SQL administrada compatible con sintaxis SQLite.

## Modelo de persistencia

Para minimizar riesgo en la migración del prototipo, esta primera entrega usa una capa de compatibilidad:

```text
app_records
--------------------------------
store_name   módulo lógico
id           ID del registro
data         JSON validado
updated_at   fecha de actualización
```

Ejemplos de `store_name`:

- people
- cells
- meetings
- attendance
- training
- encounters
- twelveMeetings
- twelveMeetingReports

No existe un archivo JSON en el servidor ni una base por navegador: los datos están centralizados en D1 y varios usuarios consultan los mismos registros.

## Autenticación

- Contraseñas con PBKDF2-SHA256 y salt individual.
- Token de sesión aleatorio.
- Solo el hash del token se almacena en D1.
- Cookie `HttpOnly`, `Secure`, `SameSite=Strict`.
- Sesión de 7 días.

## Autorización MVP

El backend aplica permisos de escritura por rol. El frontend además limita módulos visibles.

Para datos pastorales reales a escala, el siguiente hardening debe agregar filtrado server-side por cobertura: un Líder de 12 no debería poder consultar registros fuera de su árbol aunque intente llamar directamente la API.

## Siguiente normalización recomendada

Después del piloto, normalizar en este orden:

1. people / roles / mentorías
2. cells
3. meetings / attendance
4. training / sessions
5. consolidation / followups
6. encounters / participants / payments
7. twelve_meetings / reports

El frontend no necesita reescribirse de una vez: el Worker puede mantener la misma API mientras internamente migra a tablas relacionales.
