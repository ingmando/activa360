# Mapa funcional de Activa 360 v1.3.5

## 1. Arquitectura en una frase

Activa 360 es una SPA (HTML/CSS/JS) servida como Assets por Cloudflare Workers. La interfaz llama al Worker mediante API HTTP; el Worker valida sesión/permisos y persiste los módulos funcionales en Cloudflare D1.

```text
Navegador / PWA
   ↓ rutas #/...
public/js/app.js + módulos
   ↓ fetch
/api/auth/* | /api/data/* | /api/admin/* | /api/r12/*
   ↓
src/worker.js
   ↓ binding env.DB
Cloudflare D1
   ├─ app_users
   ├─ app_sessions
   ├─ app_records
   ├─ app_seed_records
   └─ audit_log
```

Los stores funcionales no son tablas SQL independientes. Se guardan en `app_records`:

```text
store_name = people, cells, training, twelveMeetings, ...
id         = ID del objeto
data       = JSON completo del registro
updated_at = fecha técnica
```

## 2. Flujo común de lectura y escritura

Los módulos importan funciones de `public/js/database.js`.

| Operación UI | Endpoint | D1 |
|---|---|---|
| Listar store | `GET /api/data/{store}` | `SELECT data FROM app_records WHERE store_name=?` |
| Obtener registro | `GET /api/data/{store}/{id}` | `SELECT ... WHERE store_name=? AND id=?` |
| Guardar/editar | `PUT /api/data/{store}/{id}` | UPSERT en `app_records` |
| Guardar lote | `PUT /api/data/{store}/bulk` | batch UPSERT en `app_records` |
| Eliminar | `DELETE /api/data/{store}/{id}` | DELETE en `app_records` |
| Próximo ID | `GET /api/data/{store}/next-id` | `MAX(id)+1` |
| Contar | `GET /api/data/{store}/count` | `COUNT(*)` |

## 3. Menú → vista → módulo → stores → D1

### Dashboard — `#/dashboard`
- Vista: `renderDashboard()`.
- Archivo: `public/js/modules/dashboard.js`.
- Lee: `people`, `cells`, `meetings`, `attendance`, `followups`, `training`, `trainingLevels`, `ministries`, `ministryMembers`, `ministryServices`, `generalMeetings`, `events`, `encounters`, `encounterParticipants`, `consolidationCases`.
- Endpoint: principalmente `GET /api/data/{store}`.
- D1: lectura de múltiples grupos JSON en `app_records`; no crea un store propio de dashboard.

### Personas — `#/personas` y `#/personas/:id`
- Archivos: `personas.js`.
- Stores principales: `people`.
- Stores relacionados: `cells`, `meetings`, `followups`, `training`, `ministries`, `ministryMembers`.
- Escritura: altas/ediciones/bajas en `people`.
- D1: `app_records` con `store_name='people'`.

### Células — `#/celulas` y `#/celulas/:id`
- Archivo: `celulas.js`.
- Stores: `cells`, `people`, `meetings`.
- Escritura principal: `cells`.
- D1: `app_records` con `store_name='cells'`.

### Reuniones de célula — `#/reuniones` y `#/reuniones/:id`
- Archivo: `reuniones.js`.
- Stores: `meetings`, `attendance`, `cells`, `people`, `consolidationCases`.
- D1: reuniones y asistencias se guardan como JSON separados en `app_records`.

### Seguimiento / Consolidación — `#/seguimiento`
- Archivo: `seguimiento.js`.
- Stores: `consolidationCases`, `followups`, `people`.
- Cruza además: `attendance`, `cells`, `meetings`, `generalMeetings`, `generalGuests`.
- D1: seguimiento e interacciones quedan en los stores respectivos dentro de `app_records`.

### Reuniones generales — `#/reuniones-generales`
- Archivo: `reuniones-generales.js`.
- Stores: `generalMeetings`, `generalGuests`, `meetingAssignments`, `meetingFinances`, `notifications`, `consolidationCases`, `people`.
- D1: planeación, invitados, tareas y finanzas se mantienen en stores separados de `app_records`.

### Eventos — `#/eventos`
- Archivo: `eventos.js`.
- Stores: `events`, `eventTasks`, `eventParticipants`.
- D1: cada entidad se persiste en su store JSON.

### Encuentros 180° — `#/encuentros` y `#/encuentros/:id`
- Archivo: `encuentros.js`.
- Stores: `encounters`, `encounterGoals`, `encounterParticipants`, `encounterTasks`, `encounterUpdates`, `encounterFinances`, `encounterPhaseReports`, `encounterIncidents`, `consolidationCases`, `people`.
- D1: todos terminan en `app_records` diferenciados por `store_name`.

### Formación — `#/formacion` y `#/formacion/:nivel`
- Archivo: `formacion.js`.
- Stores: `trainingLevels`, `training`, `trainingSessions`, `trainingAttendance`, `people`.
- D1: niveles, matrículas, sesiones y asistencias son registros JSON independientes.

### Equipos de doce — `#/doce` y `#/doce/:id`
- Archivo: `liderazgo.js`.
- Stores: `people`, `cells`, `leadershipDevelopment`.
- Complemento estructural: `ministry-units.js` utiliza `ministryUnits` + `people` para parejas/individuales.
- D1: personas y relaciones ministeriales permanecen en `app_records`.

### Reunión de 12 — `#/reunion-doce` y `#/reunion-doce/:id`
- Archivo autenticado: `public/js/modules/reunion-doce.js`.
- Backend/enlace público: `src/worker.js`.
- Stores: `twelveMeetings`, `twelveMeetingReports`, `ministryUnits`, `twelveMeetingInvites`.
- Calcula información desde: `people`, `cells`, `meetings`, `training`, `encounters`, `encounterParticipants`.
- D1: reunión, reportes y links se guardan en `app_records`.
- Excepción importante: el enlace público no usa sesión del usuario; usa un token seguro cuyo hash se guarda en `twelveMeetingInvites`.

### Árbol ministerial — `#/arbol`
- Archivo: `ministerial.js` + apoyo de `ministry-units.js`.
- Fuente estructural principal: `people` (`mentorId`, `leadershipLevel`) y `ministryUnits`.
- No crea un store de árbol: es una visualización calculada de la estructura existente.

### Ministerios — `#/ministerios`
- Archivo: `ministerios.js`.
- Stores: `ministries`, `ministryMembers`, `ministryServices`, `people`, `generalMeetings`.
- D1: equipos de servicio, miembros y turnos quedan en `app_records`.

### Reportes — `#/reportes`
- Archivo: `reportes.js`.
- Lee transversalmente: `people`, `cells`, `meetings`, `attendance`, `training`, `trainingLevels`, `ministries`, `ministryMembers`, `ministryServices`, `generalMeetings`, `generalGuests`, `meetingFinances`, `leadershipDevelopment`, `consolidationCases`.
- No crea un store de reporte general: agrega y calcula información de otros stores.

### Centro de alertas — `#/alertas`
- Archivo: `alertas.js`.
- Lee múltiples stores operativos.
- Store propio de estado: `alertStates` para registrar gestión/resolución de alertas.
- D1: los estados de alerta se guardan en `app_records`.

### Configuración — `#/configuracion`
- Archivo: `configuracion.js`.
- Store: `settings`.
- API administrativa adicional:
  - `GET /api/admin/export`
  - `POST /api/admin/import`
  - `POST /api/admin/reset-demo`
- D1: configuración normal va a `app_records`; import/export actúa sobre el conjunto de `app_records`.

## 4. Autenticación

Archivo frontend: `public/js/auth.js`.
Backend: `src/worker.js`.

| Acción | Endpoint | Tabla D1 |
|---|---|---|
| Login | `POST /api/auth/login` | `app_users`, `app_sessions` |
| Usuario actual | `GET /api/auth/me` | `app_sessions` + `app_users` |
| Cambiar contraseña | `POST /api/auth/change-password` | `app_users`; invalida `app_sessions` |
| Logout | `POST /api/auth/logout` | elimina sesión en `app_sessions` |

La cookie `a360_session` es `HttpOnly`, `Secure`, `SameSite=Strict`.

## 5. Caso especial: Reunión de 12 v1.3.5

### A. Vista del pastor / administrador

Ruta:
`#/reunion-doce/:meetingId`

Archivo:
`public/js/modules/reunion-doce.js`

Flujo:
1. Lee `twelveMeetings`.
2. Obtiene `ministryUnits` y miembros desde `people`.
3. Lee `twelveMeetingReports`.
4. Calcula sugerencias automáticas desde células, reuniones, formación y Encuentro.
5. Si el reporte contiene `manualMetrics`, usa esos valores como dato efectivo.
6. Guardar desde el modal hace `PUT /api/data/twelveMeetingReports/{id}`.
7. El Worker realiza UPSERT en `app_records` con `store_name='twelveMeetingReports'`.

### B. Enlace del líder por WhatsApp

Ruta pública:
`/r12/:token`

Archivos:
- HTML/formulario generado en `src/worker.js` (`publicHtml()`).
- API pública en `src/worker.js` (`handleR12Public()`).

Endpoints:
- `GET /api/public/r12/:token`: carga reunión, equipo, miembros, reporte y cálculo automático.
- `POST /api/public/r12/:token`: guarda el reporte.
- `POST /api/r12/invites`: el pastor genera el enlace seguro.

Stores D1:
- `twelveMeetingInvites`: token hash, reunión, equipo, vencimiento.
- `twelveMeetingReports`: devocionales, diezmo, ofrenda, altar, notas y métricas manuales.

### C. Estructura nueva del reporte

```json
{
  "id": 1,
  "meetingId": 4,
  "unitId": 2,
  "devotionals": {"3": true},
  "tithe": true,
  "offering": true,
  "familyAltar": true,
  "manualMetrics": {
    "cells": 1,
    "meetingsDone": 1,
    "schoolPeople": 2,
    "encounterPeople": 3
  },
  "metricSource": "manual",
  "notes": "..."
}
```

No hay migración SQL porque `data` es JSON dentro de `app_records`.

## 6. Archivos modificados específicamente en v1.3.5

### `src/worker.js`
Cambios funcionales del enlace público:
- etiquetas `Diezmo` y `Ofrenda`;
- edición numérica de las cuatro métricas;
- precarga del cálculo automático;
- guardado de `manualMetrics` y `metricSource`;
- estilo del formulario público para inputs numéricos.

### `public/js/modules/reunion-doce.js`
Cambios del tablero autenticado:
- modal del reporte con métricas editables;
- guardado de `manualMetrics`;
- función `effectiveMetrics()` para preferir manual sobre automático;
- tablero desktop/móvil y totales pastorales leen el valor efectivo.

### Archivos de versión/caché
- `public/index.html`
- `public/js/app.js`
- `public/service-worker.js`
- `public/manifest.webmanifest`
- `package.json`

Se actualizan a v1.3.5 para evitar que la PWA mantenga assets de la versión anterior.

## 7. Qué NO se modificó

- `migrations/0001_schema.sql`: no es necesario.
- Estructura física de D1: no cambia.
- Lógica de autenticación: no cambia.
- Generación de tokens de WhatsApp: no cambia.
- Datos ya existentes: siguen siendo compatibles.
