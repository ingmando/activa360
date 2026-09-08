# QA Activa 360 v1.3.2

## Pruebas críticas
1. Móvil <= 767 px: Reunión de 12 debe mostrar exactamente dos bloques de resumen, uno debajo del otro.
2. Desktop >= 1024 px: los dos bloques de resumen se muestran lado a lado y el sidebar permanece fijo al hacer scroll.
3. Móvil: hamburguesa y botón Más abren el mismo panel de navegación; no debe aparecer un scrim sin contenido.
4. Tablet 768–1023 px: hamburguesa abre/cierra drawer lateral con etiquetas.
5. Ministerios móvil: Buscar ministerio y Reunión próxima permanecen dentro del card.
6. Perfil: abrir y tocar fuera debe cerrar el menú; Escape también.
7. Cambiar de módulo con el menú de perfil abierto debe cerrarlo.
8. Hard refresh después del deploy: confirmar que carga CSS/JS v1.3.2 y no la versión anterior del service worker.
9. Reunión de 12 desktop: tabla mantiene encabezado y primera columna visibles durante scroll.
10. Personas móvil: verificar cards y botón Ver 360 sin scroll horizontal.
