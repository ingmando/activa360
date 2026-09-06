# QA técnico — Activa 360 v1.2 Cloud

## Validaciones ejecutadas sobre el paquete

- 25 archivos JavaScript verificados con `node --check` sin errores de sintaxis.
- Rutas/importaciones principales preservadas desde v1.2 final.
- Esquema SQL validado con SQLite.
- Dataset demo aplicado correctamente sobre esquema vacío.
- 5 usuarios de autenticación creados.
- 1.066 registros demo de negocio insertados.
- 31 colecciones lógicas presentes.
- 120 personas demo.
- 20 células.
- 36 reuniones de célula.
- 251 registros de asistencia.
- 24 reportes de Reunión de 12.
- 120 participantes de Encuentros 180°.
- Service Worker actualizado para excluir `/api/*` del cache.
- El frontend ya no inicializa `seedDatabase()` ni IndexedDB.
- `database.js` usa exclusivamente la API del Worker para datos de negocio.
- Autenticación trasladada al Worker/D1.

## Riesgos conocidos del piloto

1. La autorización de lectura aún es amplia para usuarios autenticados. El UI aplica alcance por rol, pero el backend debe endurecer filtrado por cobertura antes de cargar información pastoral altamente sensible.
2. El esquema `app_records` es deliberadamente transicional. Facilita desplegar rápido, pero no aprovecha aún toda la potencia relacional de SQL.
3. Las notificaciones WhatsApp/SMS/correo continúan simuladas.
4. Las métricas se calculan mayoritariamente en cliente después de consultar colecciones completas. Para un volumen grande se deben mover agregaciones al backend y añadir índices/consultas específicas.

## Veredicto

Apto para **piloto controlado y pruebas multiusuario** en Cloudflare D1. Antes de producción institucional completa se recomienda ejecutar hardening de permisos por cobertura y normalización progresiva de las tablas críticas.

## Validación de cobertura de navegación

Se compararon las 16 rutas declaradas en `router.js` con los handlers de `app.js`. Resultado: **16/16 rutas con handler**, sin módulos huérfanos:

Dashboard, Personas, Células, Reuniones generales, Eventos, Encuentros 180°, Reuniones de célula, Seguimiento, Formación, Equipos de doce, Reunión de 12, Árbol ministerial, Ministerios, Reportes, Centro de alertas y Configuración.

## Validación de persistencia

Búsqueda estática confirmada: la versión Cloud no contiene llamadas a `indexedDB`. No utiliza `localStorage` para datos de negocio. Solo conserva estado efímero de interfaz mediante `sessionStorage`; la persistencia real se realiza en D1.
