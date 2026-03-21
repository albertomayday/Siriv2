# ◈ Sirio TPV

**Gestor TPV con VeriFactu** — Cumplimiento RD 1007/2023 AEAT  
Electron + Vite + SQLite | Windows 10/11 | Offline-first

---

## Características

- **TPV completo** — Productos, categorías, tickets, cobros
- **Facturación electrónica** — Series, líneas, IVA desglosado
- **VeriFactu / AEAT** — Hash SHA-256 encadenado, envío SOAP, QR verificación
- **Sincronización automática** — Servicio Windows en background cada 15 min
- **Clientes** — Gestión completa con NIF/CIF
- **Exportación CSV** — Facturas exportables para contabilidad
- **Base de datos local** — SQLite, sin servidor, sin internet obligatorio
- **Diseño sin navegador** — App de escritorio nativa vía Electron

---

## Instalación telemática (RDP/TeamViewer)

```powershell
# En el equipo del cliente, como Administrador:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
irm https://raw.githubusercontent.com/albertomayday/sirio/main/scripts/deploy.ps1 | iex
```

O copiar y ejecutar `scripts/deploy.ps1` manualmente.

### Lo que hace el instalador:
1. Verifica/instala Git y Node.js
2. Clona el repositorio en `C:\Sirio`
3. Instala dependencias y compila el frontend
4. Crea acceso directo en el escritorio
5. Configura arranque automático con Windows
6. Instala el servicio VeriFactu en background
7. Lanza Sirio TPV

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Modo desarrollo (Vite + Electron)
npm run dev

# Build instalador .exe
npm run build
```

---

## Estructura del proyecto

```
sirio/
├── src/
│   ├── main/
│   │   ├── main.js              # Proceso principal Electron
│   │   ├── preload.js           # Bridge seguro renderer ↔ main
│   │   ├── database.js          # SQLite — schema + DAOs
│   │   ├── verifactu.js         # Módulo VeriFactu AEAT
│   │   ├── scheduler.js         # Cron job in-app
│   │   └── scheduler-service.js # Servicio Windows standalone
│   └── renderer/
│       ├── index.html
│       ├── app.js               # SPA — TPV, Facturas, Config...
│       └── styles/main.css
├── scripts/
│   ├── deploy.ps1               # Instalación telemática
│   ├── update.ps1               # Actualización telemática
│   ├── install-service.js       # Instalar servicio Windows
│   └── uninstall-service.js     # Desinstalar servicio Windows
├── resources/
│   └── icon.ico
├── package.json
└── vite.config.js
```

---

## VeriFactu — Configuración

1. Abrir **Config → VeriFactu**
2. Activar el módulo
3. Seleccionar modo (Pruebas para testing, Producción para uso real)
4. Indicar la ruta del certificado digital (`.pfx` o `.p12`) emitido por FNMT
5. Introducir la contraseña del certificado
6. Guardar — la sincronización es automática cada 15 minutos

### Campos técnicos
| Campo | Valor |
|-------|-------|
| Normativa | RD 1007/2023 |
| Hash | SHA-256 encadenado |
| Protocolo | SOAP/XML |
| Endpoint pruebas | `prewww1.aeat.es` |
| Endpoint producción | `www1.agenciatributaria.gob.es` |
| Frecuencia sync | Cada 15 minutos |

---

## Actualización remota

```powershell
# En el equipo del cliente, como Administrador:
C:\Sirio\scripts\update.ps1
```

---

## Licencia

Uso interno — © 2025 Alberto
