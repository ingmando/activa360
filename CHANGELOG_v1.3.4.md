# Activa 360 v1.3.4 — UX Polish + Parejas Ministeriales

## Cambios principales

- Encuentros 180°: se normalizó el padding interior de Palabra Rema, Avance por Equipo de 12, Finanzas, Metas, Inscripciones, Avances y Logística.
- Se revisó la misma pauta de contenedores para evitar textos pegados al borde de los cards.
- Se limpió la nomenclatura visible: se elimina “de la unidad” en Diezmo y Ofrenda; en la interfaz se priorizan “pareja ministerial”, “líder individual”, “equipo” o “equipo ministerial”.
- Equipos de doce: nuevo resumen ministerial con 4 indicadores en cards; 4 columnas en escritorio y 2x2 en móvil/tablet.
- La pantalla principal se renombra visualmente a “Equipos y parejas ministeriales”.
- Parejas ministeriales: creación funcional desde Equipos de doce → Parejas ministeriales, con botón visible y panel de creación accesible.
- Parejas ministeriales: segunda ruta desde Persona 360 → Pareja ministerial.
- El formulario permite seleccionar persona principal, cónyuge, representante y nombre visible.
- Se conservan las entidades `ministryUnits` y las relaciones por IDs en D1/app_records; no se requiere migración SQL nueva.
- Cache busting y PWA actualizados a v1.3.4.

## Reglas de negocio conservadas

- Cada persona conserva su Persona 360 independiente.
- Una pareja ministerial agrupa dos personas para árbol, estadísticas y Reunión de 12.
- Devocional: individual por persona.
- Diezmo, ofrenda y altar familiar: un registro compartido por pareja/líder.
