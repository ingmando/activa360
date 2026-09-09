# Activa 360 v1.3.5 · Pilot Manual Metrics

## Objetivo
Ajustar el reporte de Reunión de 12 para la etapa piloto, donde las métricas de células, reuniones realizadas, formación y Encuentro aún pueden provenir de datos simulados o incompletos.

## Cambios
- Se elimina la expresión **“de la unidad”** de las etiquetas visibles de **Diezmo** y **Ofrenda** en el enlace público de Reunión de 12.
- El texto explicativo usa **equipo ministerial** como término visible.
- `Células`, `Realizadas`, `En escuela` y `Encuentro` pasan a ser campos numéricos editables en:
  - enlace público `/r12/:token`;
  - modal autenticado del tablero Reunión de 12.
- Cada campo se precarga con el cálculo automático actual cuando no existe una corrección manual.
- Al guardar, las correcciones quedan en `twelveMeetingReports.manualMetrics`.
- Se agrega `metricSource: "manual"` para trazabilidad.
- El tablero de Reunión de 12 y sus totales usan el valor manual si existe; si no, mantienen el cálculo automático.
- No se requieren migraciones SQL: `app_records.data` almacena JSON y acepta los nuevos atributos de forma retrocompatible.
- Se actualiza versión PWA/caché a v1.3.5.

## Compatibilidad
Los reportes anteriores sin `manualMetrics` continúan funcionando y utilizan los cálculos automáticos existentes.
