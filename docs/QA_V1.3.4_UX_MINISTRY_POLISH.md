# QA v1.3.4 — UX Polish + Parejas Ministeriales

## Encuentros 180°
- [ ] Palabra Rema tiene padding consistente en escritorio, tablet y móvil.
- [ ] Avance por Equipo de 12 no toca el borde del card.
- [ ] Finanzas de inscripción tiene padding equivalente al resto del módulo.
- [ ] Metas, Inscripciones, Avances semanales y Logística mantienen el mismo patrón.
- [ ] Ningún texto o barra de progreso desborda el viewport.

## Equipos de doce
- [ ] Resumen ministerial muestra 4 cards en escritorio.
- [ ] En móvil se muestra 2x2.
- [ ] Los números son jerárquicos y los subtítulos legibles.
- [ ] No aparecen textos como “unidades ministeriales” en la experiencia cotidiana salvo donde sea estrictamente administrativo/técnico.

## Parejas ministeriales
- [ ] Equipos de doce → Parejas ministeriales abre el administrador.
- [ ] “+ Crear pareja ministerial” muestra el formulario sin necesidad de buscarlo al final del scroll.
- [ ] Crear una pareja guarda primaryPersonId, secondaryPersonId, representativePersonId y displayName.
- [ ] Las personas ya vinculadas no aparecen disponibles para otra pareja.
- [ ] Desvincular pareja devuelve ambas personas a visualización individual.
- [ ] Persona 360 muestra “Pareja ministerial” para Pastor/Superadmin en líderes de niveles 0–3.
- [ ] Desde Persona 360 puede crearse la pareja directamente.
- [ ] Si la persona ya pertenece a una pareja, la interfaz lo informa y permite ir al administrador.

## Reunión de 12
- [ ] “Diezmo” y “Ofrenda” aparecen sin “de la unidad”.
- [ ] Devocional sigue siendo individual por persona.
- [ ] Diezmo, ofrenda y altar familiar siguen siendo compartidos por pareja/líder.

## PWA / caché
- [ ] El preview muestra v1.3.4.
- [ ] Service Worker usa cache `activa360-v1.3.4-ux-ministry-polish`.
- [ ] CSS y JS se solicitan con `?v=1.3.4`.
