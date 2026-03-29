# ◈ Sirio TPV

**Gestor TPV con VeriFactu** — Cumplimiento RD 1007/2023 AEAT  
PWA + Vite + IndexedDB | Web/Móvil | Offline-first

---

## Características

- **TPV completo** — Productos, categorías, tickets, cobros
- **Facturación electrónica** — Series, líneas, IVA desglosado
- **VeriFactu / AEAT** — Hash SHA-256 encadenado, envío SOAP, QR verificación
- **Sincronización automática** — Service Worker en background
- **Clientes** — Gestión completa con NIF/CIF
- **Exportación CSV** — Facturas exportables para contabilidad
- **Base de datos local** — IndexedDB, sin servidor, sin internet obligatorio
- **PWA instalable** — Funciona como app nativa en navegador

---

## Instalación

Accede a la URL de la app en un navegador compatible (Chrome, Edge, etc.) y haz clic en "Instalar app" para instalarla como PWA.

### Desarrollo local

```bash
# Instalar dependencias
npm install

# Modo desarrollo (Vite)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Primera versión PWA
- Abre http://localhost:5173 en un navegador moderno.
- La app se cargará como PWA básica con IndexedDB.
- Para instalar: Busca el botón "Instalar app" en la barra de direcciones.

## Despliegue (Deploy)

La PWA se despliega automáticamente a GitHub Pages cuando se hace push a la rama `pwa-no-electron`.

### Configuración Inicial
1. Ve a **Settings > Pages** en el repositorio de GitHub.
2. Selecciona **Deploy from a branch**.
3. Elige la rama `pwa-no-electron` como source.
4. Guarda los cambios.

### Desplegar
1. Haz push a la rama `pwa-no-electron`:
   ```bash
   git add .
   git commit -m "Deploy PWA"
   git push origin pwa-no-electron
   ```

2. GitHub Actions construirá y desplegará automáticamente.

3. La app estará disponible en: `https://albertomayday.github.io/Siriv2/`

### Iconos
Reemplaza `public/icon-192.png` y `public/icon-512.png` con imágenes reales de 192x192 y 512x512 px para el manifest.

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
