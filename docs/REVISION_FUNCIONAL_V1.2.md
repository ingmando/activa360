# Revisión funcional — Activa 360 v1.2 Cloud

## Estado

Esta versión corresponde al **freeze funcional del MVP** y consolida el roadmap levantado durante las iteraciones v0.1 → v1.2.

## Módulos incluidos

### 1. Autenticación y roles
- Login real contra D1.
- Sesión segura con cookie HttpOnly.
- Roles: Pastor principal, Líder de 12, Líder de célula, Servidor y Miembro.
- Menú y acceso a módulos según rol.
- Cambio de contraseña.

### 2. Dashboard pastoral
- KPIs por rol.
- Personas, células, nuevos, liderazgo, formación, reuniones y alertas.
- Datos del sistema central, no del navegador local.

### 3. Personas / Persona 360
- Listado, filtros, creación, edición y detalle.
- Estado ministerial.
- Célula.
- Formación.
- Ministerios.
- Seguimiento e historial.

### 4. Células / Célula 360
- Listado y ficha 360.
- Líder y líder en formación vinculados a Personas.
- Localidad.
- Red calculada por nivel ministerial.
- Reuniones y asistencia vinculadas.

### 5. Reuniones de célula
- Registro semanal.
- Tema, versículo, observaciones e invitados.
- Toma de asistencia nominal.
- Estados Presente / Ausente / Justificado.
- Historial por célula.

### 6. Reuniones generales
- Reunión de martes y reunión principal de domingo.
- Flujo Antes / Durante / Después.
- Responsables y asignaciones.
- Asistencia, nuevos, ofrenda, diezmo, observaciones y acciones de mejora.

### 7. Seguimiento + Consolidación
- Pipeline Nuevo → Contactado → En seguimiento → Integrado → Consolidado.
- Origen desde reunión general o reunión de célula.
- Responsable, próxima acción e historial.
- Conversión a Persona 360.

### 8. Formación / Escuelas
- Tres niveles configurables.
- Matrículas, sesiones, asistencia y progreso.
- Estados En curso / Pausado / Aprobado.
- Datos conectados a Persona 360 y Reunión de 12.

### 9. Equipos de 12 y árbol ministerial
- Pastores generales en nivel 0: Danny Tinoco y Laura Tinoco.
- Equipo de 12.
- Red 144.
- Red 1728 y crecimiento recursivo futuro.
- Mentoría, cobertura y navegación por árbol.
- Formación de líderes: Identificado → Formación → Asistente → Aprobado → Enviado.

### 10. Reunión de 12
- Histórico semanal.
- Matriz del Equipo de 12.
- Preguntas manuales: devocional, diezmo, ofrenda, altar familiar, observaciones.
- Indicadores calculados: células bajo cobertura, reuniones realizadas, personas en escuela e inscritos al Encuentro 180°.
- Conclusiones pastorales de la semana.

### 11. Ministerios
- Catálogo de ministerios.
- Responsables y servidores.
- Programación por reunión general.
- Estados Asignado / Confirmado / Servido / Ausente.

### 12. Encuentros 180°
- Ficha del encuentro, palabra rema, cita bíblica, meta, coordinador y valor.
- Metas por miembros del Equipo de 12.
- Preinscripciones, inscripciones y pagos.
- Avances semanales.
- Logística, intercesión y tareas.
- Antes / Durante / Después operativo.
- Asistencia nominal, incidencias y seguimiento posterior.

### 13. Eventos
- Eventos abiertos: congresos, lanzamientos, conciertos, capacitaciones, etc.
- Responsables, logística, tareas, participantes y ciclo Antes / Durante / Después.

### 14. Reportes y analítica pastoral
- Resumen ejecutivo.
- Células, consolidación, formación, liderazgo, reuniones y ministerios.
- Exportación CSV e impresión.

### 15. Centro de alertas
- Alertas generadas desde la operación.
- Severidad, estado y acceso al origen.
- Contador real en header.

### 16. Configuración y respaldo
- Datos institucionales.
- Exportación de respaldo JSON desde D1.
- Importación administrativa.
- Restauración del dataset demo.
- Recorrido de presentación.

### 17. PWA
- Manifest y Service Worker.
- Instalación como aplicación web.
- Los llamados `/api/*` nunca se cachean.

## Funcionalidades deliberadamente fuera del MVP productivo

- WhatsApp Business / SMS reales.
- Correo transaccional real.
- Pagos en línea.
- Contabilidad formal.
- App nativa Android/iOS.
- Permisos de datos por fila/red completamente server-side.
- Auditoría completa de todas las mutaciones.

Estas quedan como roadmap posterior al piloto.
