# ◈ Ecosistema Osiris / Sirio
**Plataforma de gestión comercial multi-negocio con VeriFactu**
Versión 1.0 — Estado: Backend completo · UIs pendientes

---

## Arquitectura general

```
OSIRIS  (implantador)
   │  genera perfil.json + licencia.json
   │  despliega vía RDP/TeamViewer
   ▼
SIRIO   (cliente final — cada negocio)
   │  lee perfil.json al arrancar
   │  UI dinámica según tipo de negocio
   ▼
MOTOR   (backend universal)
   ├─ SQLite local (offline-first)
   ├─ VeriFactu → AEAT (obligación legal)
   └─ Dongle de licencia
```

**Stack:** Electron + Vite + SQLite + vanilla JS | Windows 10/11 | Offline-first
**Repos:** `albertomayday/osiris` · `albertomayday/sirio`

---

## OSIRIS — Configurador de instancias

### ✅ Completado

#### Backend / Main process
| Módulo | Archivo | Estado |
|--------|---------|--------|
| Base de datos | `src/main/database.js` | ✅ Completo |
| Generador de perfiles | `src/main/generador.js` | ✅ Completo |
| Gestión de licencias | `src/main/licencias.js` | ✅ Completo |
| Motor de deploy | `src/main/deploy.js` | ✅ Completo |
| Proceso principal Electron | `src/main/main.js` | ✅ Completo |
| Bridge seguro renderer | `src/main/preload.js` | ✅ Completo |
| Config Vite + Electron | `vite.config.js`, `package.json` | ✅ Completo |

#### Plantillas de negocio
| Plantilla | Archivo | Estado |
|-----------|---------|--------|
| Esquema base universal | `plantillas/esquema-perfil.json` | ✅ Completo |
| Hostelería | `plantillas/hosteleria.json` | ✅ Completo |
| Ferretería | `plantillas/ferreteria.json` | ✅ Completo |
| Taller mecánico | `plantillas/taller.json` | ✅ Completo |
| Farmacia | `plantillas/farmacia.json` | ✅ Completo |
| Genérico | `plantillas/generico.json` | ✅ Completo |

#### IPC disponibles (renderer → main)
```
inst:list / inst:get / inst:create / inst:update / inst:delete
plantilla:list / plantilla:cargar / plantilla:esquema
perfil:generar / perfil:verificar
lic:detectarDongle / lic:generarDongleId / lic:generar / lic:verificar / lic:crear / lic:revocar / lic:get
deploy:exportarPaquete / deploy:historial
sys:info / sys:openExternal / sys:openPath / sys:showSaveDialog
```

#### API disponible en renderer (`window.osiris.*`)
```javascript
window.osiris.instancias.{ list, get, create, update, delete }
window.osiris.plantillas.{ list, cargar, esquema }
window.osiris.perfil.{ generar, verificar }
window.osiris.licencias.{ detectarDongle, generarDongleId, generar, verificar, crear, revocar, get }
window.osiris.deploy.{ exportarPaquete, historial }
window.osiris.sys.{ info, openExternal, openPath, showSaveDialog }
```

### 🔲 Pendiente — UI

| Página | Descripción | Prioridad |
|--------|-------------|-----------|
| **Dashboard de instancias** | Lista de todos los negocios gestionados con estado, tipo, fecha último deploy, licencia activa | Alta |
| **Wizard nuevo negocio** | 6 pasos: Tipo de negocio → Datos empresa → Módulos activos → Campos extra → Fiscal/IVA → Licencia dongle | Alta |
| **Editor de perfil** | Modificar configuración de instancia existente y regenerar paquete | Alta |
| **Gestor de licencias** | Generar ID dongle, crear/revocar licencias, ver estado por instancia | Media |
| **Historial de deploys** | Log de instalaciones y actualizaciones por instancia | Media |
| **Vista detalle instancia** | Ficha completa: datos, módulos, licencia, deploys, notas | Media |

---

## SIRIO — TPV multi-negocio

### ✅ Completado

#### Backend / Main process
| Módulo | Archivo | Estado |
|--------|---------|--------|
| Base de datos SQLite | `src/main/database.js` | ✅ Completo |
| Módulo VeriFactu AEAT | `src/main/verifactu.js` | ✅ Completo |
| Scheduler background | `src/main/scheduler.js` | ✅ Completo |
| Servicio Windows standalone | `src/main/scheduler-service.js` | ✅ Completo |
| Control de inventario | `src/main/inventario.js` | ✅ Completo |
| Verificación de licencia dongle | `src/main/licencia.js` | ✅ Completo |
| Lector/aplicador de perfil | `src/main/perfil.js` | ✅ Completo |
| Proceso principal Electron | `src/main/main.js` | ✅ Completo |
| Bridge seguro renderer | `src/main/preload.js` | ✅ Completo |

#### Scripts de despliegue
| Script | Archivo | Estado |
|--------|---------|--------|
| Instalación telemática | `scripts/deploy.ps1` | ✅ Completo |
| Actualización telemática | `scripts/update.ps1` | ✅ Completo |
| Instalar servicio Windows | `scripts/install-service.js` | ✅ Completo |
| Desinstalar servicio Windows | `scripts/uninstall-service.js` | ✅ Completo |

#### Schema SQLite
| Tabla | Estado |
|-------|--------|
| `config` | ✅ |
| `categorias` | ✅ |
| `productos` (con campos stock) | ✅ |
| `clientes` | ✅ |
| `series` | ✅ |
| `facturas` + `factura_lineas` | ✅ |
| `tickets` + `ticket_lineas` | ✅ |
| `inventario_movimientos` | ✅ |
| `verifactu_log` | ✅ |

#### IPC disponibles (renderer → main)
```
window:minimize / window:maximize / window:close
db:productos:list/create/update/delete
db:categorias:list/create
db:clientes:list/create/update
db:facturas:list/get/create/anular
db:tickets:create/list
db:config:get/set/getAll
verifactu:status / verifactu:enviar / verifactu:pendientes / verifactu:sincronizar
inv:listStock / inv:getStock / inv:getAlertas / inv:getValoracion
inv:registrarMovimiento / inv:getMovimientos / inv:getMovimientosGlobal / inv:configurarStock
perfil:get / perfil:modulos / perfil:terminologia / perfil:camposExtra / perfil:actualizar
admin:backup / admin:restore / admin:getLogs / admin:info
sys:info / sys:openExternal / sys:exportarFacturas
```

#### API disponible en renderer (`window.sirio.*`)
```javascript
window.sirio.productos.{ list, create, update, delete }
window.sirio.categorias.{ list, create }
window.sirio.clientes.{ list, create, update }
window.sirio.facturas.{ list, get, create, anular, exportar }
window.sirio.tickets.{ create, list }
window.sirio.config.{ get, set, getAll }
window.sirio.verifactu.{ status, enviar, pendientes, sincronizar }
window.sirio.inventario.{ listStock, getStock, getAlertas, getValoracion,
                           registrarMovimiento, getMovimientos,
                           getMovimientosGlobal, configurarStock }
window.sirio.perfil.{ get, modulos, terminologia, camposExtra, actualizar }
window.sirio.admin.{ backup, restore, getLogs, info }
window.sirio.sys.{ info, openExternal }
```

#### UI existente (funcional, pendiente de refactorizar con perfil dinámico)
| Página | Archivo | Estado |
|--------|---------|--------|
| TPV / Caja | `src/renderer/app.js` | ✅ Funcional |
| Facturas emitidas | `src/renderer/app.js` | ✅ Funcional |
| Clientes | `src/renderer/app.js` | ✅ Funcional |
| Productos | `src/renderer/app.js` | ✅ Funcional |
| VeriFactu | `src/renderer/app.js` | ✅ Funcional |
| Configuración | `src/renderer/app.js` | ✅ Funcional |
| Sistema de diseño CSS | `src/renderer/styles/main.css` | ✅ Completo |

### 🔲 Pendiente — UI

| Página | Descripción | Prioridad |
|--------|-------------|-----------|
| **Dashboard negocio** | KPIs del día: ventas, tickets, alertas stock, estado VeriFactu, gráfico tendencia | Alta |
| **Inventario** | Stock actual por producto, movimientos entrada/salida, alertas mínimos, valoración, ajuste manual | Alta |
| **Panel admin** | Acceso por F12 sin contraseña: backup/restore, logs, edición de perfil.json, reset licencia, info sistema | Media |
| **Refactorizar UI existente** | Aplicar terminología dinámica del perfil (ticket→comanda, cliente→paciente, etc.) y mostrar/ocultar módulos según perfil activo | Media |
| **Campos extra en formularios** | Renderizar campos_extra del perfil en modales de cliente, producto y ticket | Media |

---

## Flujo de trabajo completo

```
1. OSIRIS: Nuevo negocio
   ├─ Wizard: tipo + datos + módulos + campos + fiscal + dongle
   ├─ Genera perfil.json (firmado SHA-256)
   ├─ Genera licencia.json (hash dongle)
   └─ Exporta paquete ZIP con deploy.ps1 personalizado

2. IMPLANTACIÓN (vía RDP/TeamViewer)
   ├─ Conectar al equipo del cliente
   ├─ Ejecutar deploy.ps1 como Admin (~3-5 min)
   │   ├─ Instala Git + Node si faltan
   │   ├─ Clona albertomayday/sirio
   │   ├─ npm install + vite build
   │   ├─ Copia perfil.json + licencia.json
   │   ├─ Crea acceso directo escritorio
   │   ├─ Configura arranque automático Windows
   │   └─ Instala servicio VeriFactu background
   └─ Sirio arranca con la configuración del negocio

3. SIRIO en el negocio
   ├─ Arranca → verifica dongle → carga perfil → abre UI
   ├─ UI adaptada al tipo de negocio (módulos + terminología)
   ├─ VeriFactu sincroniza automáticamente cada 15 min
   └─ Admin (F12): backup, logs, ajuste de perfil local

4. ACTUALIZACIÓN FUTURA
   └─ Ejecutar: C:\Sirio\scripts\update.ps1
       ├─ git pull
       ├─ npm install + vite build
       └─ Reinicia servicio
```

---

## LOPD — Separación de datos

| Sistema | Datos que contiene | LOPD |
|---------|-------------------|------|
| **Osiris** | Nombre negocio, tipo, fecha deploy, estado licencia | ✅ Sin datos personales de terceros |
| **Sirio** | Clientes, facturas, tickets — todos en SQLite local del cliente | ✅ Soberanía total del dato |
| **AEAT (VeriFactu)** | Solo registros fiscales — obligación legal RD 1007/2023 | ✅ Obligatorio por ley |
| **Internet** | Ningún dato sale salvo VeriFactu | ✅ Offline-first |

---

## Tipos de negocio disponibles

| Tipo | IVA base | Módulo inventario | Campos extra destacados |
|------|----------|-------------------|------------------------|
| Hostelería | 10% | Opcional | Mesa |
| Ferretería | 21% | Activo | Ref. proveedor, ubicación |
| Taller mecánico | 21% | Activo | Matrícula, km, diagnóstico |
| Farmacia | 4% | Activo | CN, principio activo, receta |
| Genérico | 21% | Opcional | — |

*Nuevos tipos: añadir JSON en `osiris/plantillas/` sin tocar código.*

---

## Resumen de estado

| Área | Completado | Pendiente |
|------|-----------|-----------|
| Backend Sirio | 10/10 módulos | — |
| Backend Osiris | 6/6 módulos | — |
| Scripts deploy | 4/4 | — |
| Plantillas negocio | 5/5 | — |
| UI Sirio | 6/8 páginas | Dashboard, Inventario, Admin |
| UI Osiris | 0/6 páginas | Todas |
| Refactorización UI dinámica | — | Pendiente |

**Próximo paso: construcción de UIs** — Osiris primero (wizard + instancias), luego Sirio (dashboard + inventario + admin).
