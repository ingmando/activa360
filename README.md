# Activa 360 v1.3.4 — UX Polish + Parejas Ministeriales

> Esta versión consolida el pulido visual de Encuentros 180°, rediseña el resumen de Equipos de doce y habilita la creación de parejas ministeriales desde Equipos de doce y Persona 360. Mantiene Cloudflare Worker + D1 y el modelo lógico `ministryUnits` sin requerir una nueva tabla SQL.

# Activa 360 v1.3.3 — Unidades Ministeriales + Sharing

# Activa 360 v1.3.3 — Unidades Ministeriales + Sharing

> **v1.3.3** incorpora unidades ministeriales (individual/pareja), hábitos personales y de unidad en Reunión de 12, estados Borrador/Abierta/Cerrada funcionales y enlaces seguros por WhatsApp para diligenciamiento sin autenticación.


Versión UX Mobile First construida sobre `v1.2.1 Stable Clean`. Conserva la misma API, binding `DB` y D1; el foco de esta entrega es navegación, responsive, interacción táctil y experiencia PWA.

> **Importante:** la recuperación automática de contraseña por correo y las notificaciones push están preparadas a nivel de interfaz/arquitectura, pero no se consideran activas hasta integrar proveedor de correo/push.

# Activa 360 v1.2.1 — Stable Clean (Cloudflare Workers + D1)

Versión estable y reproducible tomada del despliegue funcional del piloto. Se limpiaron artefactos locales (`node_modules`, `.wrangler`) y se corrigieron los hashes de usuarios demo a PBKDF2-SHA256 con 100.000 iteraciones.

# Activa 360 v1.2 Cloudflare D1

MVP pastoral de Activa Tu Corazón preparado para ejecutarse como una aplicación web full-stack sobre **Cloudflare Workers + Static Assets + D1**.

## Qué cambia frente a la v1.2 local

- El frontend HTML/CSS/JavaScript se conserva.
- Los datos de negocio dejan de depender de IndexedDB/localStorage.
- Todas las operaciones CRUD pasan por `/api/*` y se almacenan en **Cloudflare D1**.
- El login deja de ser simulado: el Worker valida credenciales con hash PBKDF2 y crea una sesión mediante cookie `HttpOnly + Secure + SameSite=Strict`.
- El Worker sirve tanto el frontend estático como la API, por lo que el despliegue queda en un solo proyecto Cloudflare.
- El modo PWA se conserva.

> `localStorage` solo se mantiene para una preferencia visual del modo presentación. La información pastoral, reuniones, células, escuela, Encuentros 180°, etc. vive en D1. La sesión visual usa `sessionStorage`, mientras la sesión real se valida en servidor mediante cookie segura.

## Arquitectura

```text
Navegador / PWA
      │
      ├── HTML + CSS + JS  → Workers Static Assets
      │
      └── /api/*           → Cloudflare Worker
                                  │
                                  └── D1 (SQL/SQLite compatible)
```

## Despliegue rápido

### Requisitos

- Node.js 20+ (recomendado 22 LTS)
- Cuenta gratuita de Cloudflare
- Terminal PowerShell / CMD

### 1. Descomprimir

```bash
cd activa360_v1.2_cloudflare_d1
npm install
```

### 2. Iniciar sesión en Cloudflare

```bash
npx wrangler login
```

### 3. Crear D1

```bash
npx wrangler d1 create activa360-db
```

Copia el `database_id` que devuelve Cloudflare. Si Wrangler pregunta si deseas agregar el binding automáticamente, responde **No**, porque el proyecto ya trae el binding `DB` preparado en `wrangler.jsonc`.

### 4. Configurar el ID

```bash
npm run db:set-id -- TU_DATABASE_ID
```

### 5. Aplicar esquema + dataset demo

```bash
npm run db:migrate:remote
```

Wrangler pedirá confirmación. Acepta las dos migraciones.

### 6. Publicar

```bash
npm run deploy
```

Al final recibirás una URL parecida a:

```text
https://activa360.<tu-subdominio>.workers.dev
```

### 7. Iniciar sesión

Consulta `docs/CREDENCIALES_INICIALES.md` y cambia las contraseñas desde el menú del usuario antes de ingresar información real.

## Probar localmente

Una vez reemplazado el `database_id`:

```bash
npm run db:migrate:local
npm run dev
```

## Comprobación de proyecto

```bash
npm run check
```

Valida estructura, archivos requeridos y sintaxis JavaScript.

## Base de datos

Esta entrega usa un **esquema de compatibilidad** para migrar rápidamente el MVP existente sin reescribir todos los módulos:

- `app_users`: usuarios y roles reales.
- `app_sessions`: sesiones seguras.
- `app_records`: datos de los módulos, centralizados en D1.
- `app_seed_records`: copia del dataset demo para restauración.
- `audit_log`: reservado para trazabilidad posterior.

Cada registro de negocio conserva el objeto de la v1.2 en una columna JSON validada por SQLite. Esto elimina IndexedDB y archivos JSON locales, pero mantiene compatibilidad total con el frontend actual. Antes de una producción institucional de largo plazo se recomienda normalizar gradualmente tablas críticas como Personas, Células, Asistencia y Finanzas.

## Documentación incluida

- `docs/REVISION_FUNCIONAL_V1.2.md`
- `docs/ARQUITECTURA_CLOUDFLARE_D1.md`
- `docs/PLAN_DESPLIEGUE_CLOUDFLARE.md`
- `docs/QA_REPORT_V1.2_CLOUD.md`
- `docs/CREDENCIALES_INICIALES.md`
- `docs/ARQUITECTURA_MINISTERIAL.md`
- `docs/MANUAL_IDENTIDAD_VISUAL.md`


## v1.3.3
Ver `CHANGELOG_v1.3.3.md` y `docs/QA_V1.3.3_MINISTRY_UNITS_SHARING.md`. La versión añade unidades ministeriales, hábitos personales/unidad, estados funcionales de Reunión de 12 y enlaces seguros por WhatsApp.

## v1.3.5 · Pilot Manual Metrics

Esta versión permite corregir manualmente Células, Realizadas, En escuela y Encuentro en los reportes de Reunión de 12 mientras la información base continúa en consolidación. Los cálculos automáticos siguen funcionando como valor sugerido y fallback.

Consulta `docs/MAPA_FUNCIONAL_V1.3.5.md` para el mapa completo de menús, vistas, stores, endpoints y persistencia D1.
