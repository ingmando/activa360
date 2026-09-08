# Activa 360 v1.3.2 · UX Hotfix

## Correcciones principales
- Reunión de 12: resumen reconstruido en dos bloques semánticos. En móvil se apilan dos bloques compactos; en escritorio se muestran lado a lado.
- Reunión de 12 (inicio y detalle): se eliminó el uso inconsistente de KPI genéricos que producía textos pegados o espacios excesivos.
- Menú hamburguesa móvil: ahora abre el mismo panel **Más** en vez de activar un drawer invisible.
- Tablet: el menú hamburguesa conserva drawer lateral con nombres.
- Escritorio: sidebar fijo con scroll interno independiente.
- Ministerios: filtros Buscar ministerio / Reunión próxima ya no desbordan el card ni la pantalla.
- Formularios: inputs, selects y textareas reciben límites de ancho globales.
- Perfil: cierre al tocar/clicar fuera, Escape y cambio de ruta.
- PWA/cache: nueva clave de cache y cache-busting de CSS/JS para reducir visualización de assets antiguos tras deploy.
- Compatibilidad responsive reforzada en 380 px, móvil, tablet y desktop.

## UX incorporado desde el roadmap inmediato
- Tabla Reunión de 12 con encabezado y primera columna sticky (ya presente y mantenida).
- Menú Más tipo bottom-sheet en móvil.
- Personas como cards en móvil.
- Banner de actualización PWA.
- Badge de alertas cuando el navegador soporta Badging API.
- Estados de carga y vacíos consistentes.
