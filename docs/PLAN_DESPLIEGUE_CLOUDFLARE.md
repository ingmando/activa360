# Plan de despliegue — Cloudflare Workers + D1

## Ruta recomendada (15–30 minutos)

1. Instala Node.js 22 LTS.
2. Descomprime el paquete.
3. Abre PowerShell en la carpeta.
4. Ejecuta `npm install`.
5. Ejecuta `npx wrangler login` y autoriza en el navegador.
6. Ejecuta `npx wrangler d1 create activa360-db`. Si pregunta si deseas agregar el binding al archivo de configuración, responde **No**.
7. Copia `database_id`.
8. Ejecuta `npm run db:set-id -- <DATABASE_ID>`.
9. Ejecuta `npm run db:migrate:remote`.
10. Ejecuta `npm run deploy`.
11. Abre la URL `workers.dev` entregada por Wrangler.
12. Inicia sesión con una cuenta inicial.
13. Cambia inmediatamente la contraseña.
14. Prueba desde dos dispositivos creando/modificando un registro y comprobando que ambos ven el cambio.

## Verificación mínima posterior al despliegue

- Login y logout.
- Personas: crear/editar.
- Células: editar líder/localidad.
- Reunión de célula: crear y registrar asistencia.
- Formación: matrícula y progreso.
- Encuentro 180°: inscripción y fase Durante.
- Reunión de 12: diligenciar hábitos y comprobar métricas automáticas.
- Exportar respaldo desde Configuración.

## Recomendación para dominio

Primero valida en `*.workers.dev`. Cuando el piloto esté estable, configura un dominio/subdominio institucional, por ejemplo `360.activatucorazon.com`.
