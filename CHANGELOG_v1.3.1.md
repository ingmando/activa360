# Activa 360 v1.3.1 — UX Polish + PWA Update Experience

## Objetivo
Pulir la v1.3 después de las pruebas reales en teléfono y escritorio, sin alterar la lógica ministerial ni el contrato API/D1.

## Correcciones principales

1. **Reunión de 12**
   - Nuevo resumen 4 métricas: 4 columnas en escritorio, 2×2 en móvil/tablet.
   - Tipografía y jerarquía corregidas; sin espacios verticales excesivos.
   - Matriz de escritorio con encabezado sticky y primera columna sticky.
   - Se mantiene la representación por cards en móvil.

2. **Sidebar desktop**
   - El menú lateral queda fijo a altura completa.
   - Solo el contenido principal hace scroll.
   - La navegación interna conserva scroll independiente cuando hay muchos módulos.

3. **Menú de perfil**
   - Cierra al hacer clic/tap fuera.
   - Cierra con `Escape`.
   - Cierra antes de abrir Perfil, Cambiar contraseña o Cerrar sesión.

4. **Personas mobile-first**
   - La tabla de directorio se transforma en cards en pantallas móviles.
   - Acción `Ver 360` ocupa ancho táctil adecuado.

5. **Árbol ministerial**
   - Se conserva drill-down.
   - Se añade breadcrumb de cobertura/generación para no perder contexto.

6. **PWA**
   - Cache actualizado a `activa360-v1.3.1-ux-polish`.
   - La nueva versión queda en espera y se muestra el aviso `Nueva versión disponible`.
   - `Actualizar ahora` activa el nuevo Service Worker y recarga de forma controlada.
   - El contador de alertas intenta sincronizarse con la Badging API cuando está disponible.

7. **Estados y accesibilidad**
   - Loading visual reforzado.
   - Mejor tratamiento táctil y de foco.
   - Menú `Más` reforzado como bottom sheet en móvil.

## Compatibilidad
- Mantiene Cloudflare Workers + Static Assets + D1.
- No requiere nuevas migraciones D1.
- No modifica las tablas ni el seed.
- Puede desplegarse como preview desde la rama `develop` antes de promover a `main`.

## Recomendación QA
Validar en preview al menos: Android 360–430 px, tablet 768–1024 px y escritorio >1200 px antes del merge a `main`.
