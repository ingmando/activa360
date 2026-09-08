# Despliegue GitHub → Cloudflare

## Recomendación
Usar GitHub como fuente de verdad del código y Cloudflare como runtime. No subir `node_modules/` ni `.wrangler/`.

## Flujo
1. Crear/usar repositorio privado `activa360`.
2. Subir el contenido del paquete, no el ZIP como único archivo.
3. Confirmar que `wrangler.jsonc` conserva `name: activa360` y el binding D1 `DB`.
4. En Cloudflare: Workers & Pages → activa360 → Settings/Builds → conectar GitHub.
5. Rama estable recomendada: `main`; desarrollo: `develop`.
6. Comando de despliegue: `npx wrangler deploy`.
7. Probar primero en preview/desarrollo y luego promover a producción.

La base D1 no se reemplaza al actualizar el frontend/Worker. No ejecutar nuevamente el seed sobre una base con datos reales.
