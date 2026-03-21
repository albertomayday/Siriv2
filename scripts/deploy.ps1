# ═══════════════════════════════════════════════════════════════════════════════
# SIRIO TPV — Script de despliegue telemático
# Ejecutar como Administrador en el equipo del cliente (vía RDP/TeamViewer)
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [string]$RepoUrl    = "https://github.com/albertomayday/sirio.git",
    [string]$InstallDir = "C:\Sirio",
    [string]$NodeVersion = "20"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red }

Write-Host @"
╔══════════════════════════════════════════╗
║   SIRIO TPV — Instalación telemática     ║
║   Versión 1.0 — $(Get-Date -Format 'dd/MM/yyyy')              ║
╚══════════════════════════════════════════╝
"@ -ForegroundColor White

# ─── 1. Verificar privilegios ─────────────────────────────────────────────────
Write-Step "Verificando privilegios de administrador..."
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Fail "Este script debe ejecutarse como Administrador"
    exit 1
}
Write-OK "Ejecutando como Administrador"

# ─── 2. Instalar Git si no existe ────────────────────────────────────────────
Write-Step "Verificando Git..."
if (-NOT (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Warn "Git no encontrado. Instalando via winget..."
    winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-OK "Git instalado"
} else {
    Write-OK "Git disponible: $(git --version)"
}

# ─── 3. Instalar Node.js si no existe ────────────────────────────────────────
Write-Step "Verificando Node.js..."
if (-NOT (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warn "Node.js no encontrado. Instalando via winget..."
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-OK "Node.js instalado"
} else {
    Write-OK "Node.js disponible: $(node --version)"
}

# ─── 4. Clonar / actualizar repositorio ──────────────────────────────────────
Write-Step "Preparando directorio de instalación: $InstallDir"
if (Test-Path "$InstallDir\.git") {
    Write-Warn "Repositorio ya existe — actualizando..."
    Set-Location $InstallDir
    git pull origin main --quiet
    Write-OK "Repositorio actualizado"
} else {
    if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Step "Clonando repositorio..."
    git clone $RepoUrl $InstallDir --quiet
    Write-OK "Repositorio clonado en $InstallDir"
}

Set-Location $InstallDir

# ─── 5. Instalar dependencias ─────────────────────────────────────────────────
Write-Step "Instalando dependencias npm..."
npm install --production --silent 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    # Reintentar sin flag production para incluir devDependencies de build
    npm install --silent 2>&1 | Out-Null
}
Write-OK "Dependencias instaladas"

# ─── 6. Compilar frontend ─────────────────────────────────────────────────────
Write-Step "Compilando frontend (Vite)..."
npm run build:vite --silent 2>&1 | Out-Null
Write-OK "Frontend compilado en /dist"

# ─── 7. Configurar autoarranque con Windows ───────────────────────────────────
Write-Step "Configurando arranque automático con Windows..."

$startupScript = @"
@echo off
cd /d "$InstallDir"
start "" "$env:APPDATA\npm\electron.cmd" .
"@

$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\SirioTPV.bat"
Set-Content -Path $startupPath -Value $startupScript -Encoding ASCII
Write-OK "Acceso directo de arranque creado en Inicio"

# Acceso directo en escritorio
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:Public\Desktop\Sirio TPV.lnk")
$Shortcut.TargetPath = "$env:APPDATA\npm\electron.cmd"
$Shortcut.Arguments  = "."
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.Description = "Sirio TPV — Gestor con VeriFactu"
$Shortcut.Save()
Write-OK "Acceso directo en escritorio creado"

# ─── 8. Instalar servicio VeriFactu (background) ──────────────────────────────
Write-Step "Instalando servicio VeriFactu en background..."
try {
    node scripts/install-service.js
    Write-OK "Servicio 'Sirio TPV' instalado y activo"
} catch {
    Write-Warn "No se pudo instalar el servicio automáticamente"
    Write-Warn "Instálalo manualmente: node scripts/install-service.js"
}

# ─── 9. Firewall — permitir Electron ─────────────────────────────────────────
Write-Step "Configurando regla de firewall..."
try {
    New-NetFirewallRule -DisplayName "Sirio TPV" -Direction Inbound `
        -Program (Get-Command node).Source `
        -Action Allow -ErrorAction SilentlyContinue | Out-Null
    Write-OK "Regla de firewall creada"
} catch {
    Write-Warn "No se pudo crear regla de firewall (no crítico)"
}

# ─── 10. Resumen final ────────────────────────────────────────────────────────
Write-Host @"

╔══════════════════════════════════════════════════════╗
║   ✓ SIRIO TPV instalado correctamente                ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║   Directorio : $InstallDir
║   Arranque   : Automático con Windows                ║
║   Servicio   : Sirio TPV (VeriFactu background)      ║
║   Escritorio : Acceso directo creado                 ║
║                                                      ║
║   PRÓXIMOS PASOS:                                    ║
║   1. Abrir Sirio TPV desde el escritorio             ║
║   2. Ir a Config → Datos de la empresa               ║
║   3. Activar VeriFactu cuando tengas certificado     ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

# Lanzar la app
Write-Step "Iniciando Sirio TPV..."
Start-Process -FilePath "$env:APPDATA\npm\electron.cmd" -ArgumentList "." -WorkingDirectory $InstallDir
