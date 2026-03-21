# ═══════════════════════════════════════════════════════════════════════════════
# SIRIO TPV — Actualización telemática
# Ejecutar como Administrador para actualizar una instalación existente
# ═══════════════════════════════════════════════════════════════════════════════

param([string]$InstallDir = "C:\Sirio")

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }

Write-Host "SIRIO TPV — Actualizando..." -ForegroundColor White

# Detener servicio
Write-Step "Deteniendo servicio..."
Stop-Service -Name "Sirio TPV" -ErrorAction SilentlyContinue
Write-OK "Servicio detenido"

# Pull
Set-Location $InstallDir
Write-Step "Descargando cambios..."
git pull origin main --quiet
Write-OK "Código actualizado"

# Rebuild
Write-Step "Recompilando..."
npm install --silent 2>&1 | Out-Null
npm run build:vite --silent 2>&1 | Out-Null
Write-OK "Build completado"

# Reiniciar servicio
Write-Step "Reiniciando servicio..."
Start-Service -Name "Sirio TPV" -ErrorAction SilentlyContinue
Write-OK "Servicio activo"

Write-Host "`n✓ Sirio TPV actualizado correctamente`n" -ForegroundColor Green
