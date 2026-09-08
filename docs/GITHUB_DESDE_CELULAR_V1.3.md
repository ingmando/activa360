# GitHub desde celular — Activa 360 v1.3

## Recomendación
Para reemplazar una versión completa con muchas carpetas, usar el computador una vez es el camino más seguro. Después de que el repositorio contiene la estructura completa, desde el celular se pueden editar archivos individuales, hacer commits y dejar que Cloudflare despliegue automáticamente.

## Flujo objetivo
Código → GitHub privado → Cloudflare Workers Builds → Worker `activa360` → D1 `activa360-db`.

## Desde celular para cambios pequeños
1. Abrir GitHub en Chrome y el repositorio `activa360`.
2. Abrir el archivo a cambiar.
3. Pulsar Editar (lápiz), modificar y elegir `Commit changes`.
4. Cloudflare detecta el push a la rama conectada y crea un deployment.
5. Revisar Workers & Pages → activa360 → Deployments.
6. Probar la URL pública.

## Para una versión completa
No subir el ZIP como único archivo para desplegar. GitHub debe contener `public/`, `src/`, `migrations/`, `docs/`, `package.json` y `wrangler.jsonc` en su estructura original.
