# Activa 360 v1.3.3 — Unidades Ministeriales + Reunión de 12 Sharing

## Modelo ministerial
- Nueva colección `ministryUnits`.
- Una unidad puede ser `individual` o `couple`.
- Cada pareja conserva dos registros Persona 360 independientes.
- La unidad define persona principal, cónyuge/segunda persona, representante y nombre visible.
- Fallback compatible: los líderes existentes se muestran automáticamente como unidades individuales hasta que se vinculen como pareja.
- Los dos pastores generales del demo se agrupan automáticamente como unidad pastoral si todavía no existe una unidad guardada.

## Hábitos de Reunión de 12
- Devocional: se registra de forma individual por cada persona de la unidad.
- Diezmo: un registro por unidad ministerial.
- Ofrenda: un registro por unidad ministerial.
- Altar familiar: un registro por unidad ministerial.
- Células, reuniones realizadas, personas en escuela y Encuentro 180° se calculan para toda la cobertura de la unidad.
- Compatibilidad con reportes anteriores basados en `leaderId`.

## Estados de reunión
- Borrador: preparación interna. No habilita enlaces externos.
- Abierta: permite diligenciamiento y enlaces por WhatsApp.
- Cerrada: bloquea edición ordinaria y desactiva el acceso público.
- Pastor/Superadmin puede abrir, cerrar o reabrir una reunión.

## Compartir por WhatsApp
- Token aleatorio por reunión + unidad ministerial.
- El token se almacena únicamente como hash en D1.
- Se puede regenerar un enlace; el anterior queda reemplazado.
- Pantalla pública sin autenticación para diligenciar el reporte de esa unidad.
- El enlace deja de funcionar al cerrar la reunión o al expirar.
- Botones `WhatsApp` y `Copiar enlace` para administración pastoral.

## UX móvil
- Cards de Reunión de 12 reforzadas contra overflow.
- Métricas automáticas 2×2 en móvil.
- Hábitos de unidad apilados en pantallas estrechas.
- Modal de reporte limitado al viewport y con scroll interno.

## Liderazgo y árbol
- Gestión básica de parejas ministeriales desde Equipos y unidades ministeriales.
- Árbol ministerial navega por unidades, no por duplicación de cónyuges.
- Equipo de 12 muestra unidades y personas vinculadas.
- Persona permite definir nivel de liderazgo y mentor/cobertura.

## Roles
- Backend reconoce `superadmin` con permisos equivalentes de administración global.
- El usuario demo no crea automáticamente un Superadmin; debe provisionarse de forma explícita antes de producción.
