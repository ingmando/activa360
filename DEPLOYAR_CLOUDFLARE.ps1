$ErrorActionPreference = 'Stop'
Write-Host "=== Activa 360 v1.2 Cloudflare D1 ===" -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js no está instalado. Instala Node.js 22 LTS y vuelve a ejecutar." }
Write-Host "1/6 Instalando dependencias..." -ForegroundColor Yellow
npm install
Write-Host "2/6 Iniciando sesión en Cloudflare..." -ForegroundColor Yellow
npx wrangler login
Write-Host "3/6 Creando D1..." -ForegroundColor Yellow
Write-Host "Si Wrangler pregunta si deseas agregar el binding al archivo, responde N / No." -ForegroundColor DarkYellow
$output = (& npx wrangler d1 create activa360-db 2>&1 | Tee-Object -Variable captured | Out-String)
Write-Host $output
$match = [regex]::Match($output, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')
if ($match.Success) { $dbid = $match.Value } else { $dbid = Read-Host "Pega aquí el database_id mostrado por Cloudflare" }
Write-Host "4/6 Configurando database_id $dbid..." -ForegroundColor Yellow
node scripts/set-d1-id.mjs $dbid
Write-Host "5/6 Aplicando migraciones y dataset demo..." -ForegroundColor Yellow
npx wrangler d1 migrations apply activa360-db --remote
Write-Host "6/6 Publicando Worker + frontend..." -ForegroundColor Yellow
npx wrangler deploy
Write-Host "=== Despliegue terminado ===" -ForegroundColor Green
Write-Host "Revisa la URL workers.dev mostrada arriba. Luego cambia las contraseñas iniciales." -ForegroundColor Green
