# Arquitectura Ministerial · Activa 360 v0.3

## Contexto actual
Activa Tu Corazón cuenta actualmente con una sede ubicada al norte de Bogotá. Los pastores principales son el Pastor Danny Tinoco y la Pastora Laura Tinoco.

## Modelo de crecimiento
La estructura se modela como un **árbol de discipulado recursivo**:

1. Pastores generales.
2. Equipo de 12: línea de liderazgo más cercana a los pastores; puede estar conformada por personas o parejas ministeriales.
3. Red 144: discípulos/equipos desarrollados por los integrantes del equipo de 12.
4. Red 1728: siguiente generación, cuando integrantes de la red 144 desarrollen sus propios equipos de 12.
5. Niveles futuros: el mismo patrón continúa sin modificar el modelo de datos.

## Regla estructural
La red de una persona o célula **no debe ser diligenciada manualmente**. Se deriva de la posición del líder dentro del árbol ministerial.

- Nivel pastoral: pastores generales.
- Nivel 1: Equipo de 12.
- Nivel 2: Red 144.
- Nivel 3: Red 1728.

Esto evita inconsistencias y permite escalar el sistema.

## Cobertura
Cada líder puede tener:
- Discípulos directos.
- Células directas.
- Células pertenecientes a sus discípulos y generaciones inferiores.

Por tanto, el alcance de un líder corresponde a todo su subárbol ministerial, sujeto a los permisos del sistema.

## Persona
Una persona es una entidad independiente de sus roles. Puede tener:
- Estado ministerial.
- Uno o varios roles.
- Mentor/cobertura.
- Nivel de formación.
- Célula.
- Ministerio(s).
- Seguimientos.

## Célula
Campos definidos para v0.3:
- Nombre.
- Líder (relación con Persona; no texto libre).
- Líder en formación (relación con Persona; no texto libre).
- Red calculada automáticamente.
- Localidad.
- Dirección.
- Día.
- Hora.
- Estado.
- Miembros e indicadores.

### Autocomplete de líderes
El formulario busca personas existentes por nombre. El usuario selecciona un resultado y el sistema almacena el `personaId`, no el nombre escrito.

### Localidad
Para la fase actual se utiliza el catálogo de localidades de Bogotá. En una fase posterior el modelo debe soportar ciudad/municipio/sede para permitir expansión geográfica.

## Compatibilidad con Ganar · Consolidar · Discipular · Enviar
El árbol de liderazgo representa principalmente **Discipular y Enviar**, mientras que Personas, Consolidación, Formación, Células y Seguimiento soportan el recorrido completo:

Ganar → Consolidar → Discipular → Enviar → Multiplicar.

## Principio de arquitectura digital
No crear tablas independientes llamadas `red_12`, `red_144` o `red_1728`. El sistema debe almacenar relaciones de mentoría/cobertura y calcular dinámicamente la generación.

## Evolución recomendada de datos
En PostgreSQL/Supabase, el concepto central puede representarse mediante una relación `mentor_id` o una entidad de relaciones ministeriales con fecha, estado y tipo de cobertura. Para el prototipo IndexedDB, v0.3 utiliza `mentorId` y `leadershipLevel` para simular el modelo.
