# PWA y notificaciones — preparación v1.3

La v1.3 mantiene `manifest.webmanifest` y `service-worker.js`, agrega shortcuts y captura `beforeinstallprompt` para ofrecer instalación desde el perfil o el menú Más.

## Estado actual
- Instalable en navegadores compatibles.
- `display: standalone`.
- Cache de assets básicos.
- Sin push remoto todavía.

## Próximos pasos
1. Recuperación de contraseña por token de un solo uso + correo.
2. Proveedor de correo transaccional (p. ej., Resend) desde Worker.
3. Web Push con consentimiento explícito y almacenamiento de suscripciones.
4. Preferencias de notificación por usuario y categoría.
