const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

// Importar módulos internos
const db        = require('./database')
const verifactu = require('./verifactu')
const scheduler = require('./scheduler')
const inventario = require('./inventario')
const licencia  = require('./licencia')
const perfil    = require('./perfil')

let mainWindow
const APP_DIR = path.join(__dirname, '../..')

// ─── Prevenir múltiples instancias ───────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ─── Crear ventana principal ──────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  Menu.setApplicationMenu(null)
  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Ventana de error de licencia ────────────────────────────────────────────
function createLicenciaErrorWindow(mensaje) {
  const win = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    resizable: false,
    backgroundColor: '#0a0a0f',
    webPreferences: { contextIsolation: true }
  })

  win.loadURL(`data:text/html,
    <html><body style="font-family:monospace;background:#0a0a0f;color:#e8e8f0;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      height:100vh;margin:0;padding:24px;box-sizing:border-box;text-align:center">
      <div style="font-size:36px;margin-bottom:16px">🔒</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#ff4d6a">Licencia no válida</div>
      <div style="font-size:13px;color:#8888aa;line-height:1.6">${mensaje}</div>
      <button onclick="window.close()" style="margin-top:24px;padding:10px 24px;
        background:#5b5bff;color:white;border:none;border-radius:6px;
        font-size:13px;cursor:pointer">Cerrar</button>
    </body></html>
  `)
}

// ─── App ready ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // 1. Verificar licencia
  const resultadoLic = licencia.verificar(APP_DIR)
  if (!resultadoLic.ok) {
    createLicenciaErrorWindow(resultadoLic.error)
    return
  }

  // 2. Cargar perfil
  perfil.cargar(APP_DIR)

  // 3. Inicializar base de datos
  await db.init()

  // 4. Iniciar scheduler VeriFactu
  scheduler.start()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    scheduler.stop()
    app.quit()
  }
})

// ─── IPC: Ventana ─────────────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())

// ─── IPC: Base de datos ───────────────────────────────────────────────────────

// PRODUCTOS
ipcMain.handle('db:productos:list', () => db.productos.list())
ipcMain.handle('db:productos:create', (_, data) => db.productos.create(data))
ipcMain.handle('db:productos:update', (_, id, data) => db.productos.update(id, data))
ipcMain.handle('db:productos:delete', (_, id) => db.productos.delete(id))

// CATEGORÍAS
ipcMain.handle('db:categorias:list', () => db.categorias.list())
ipcMain.handle('db:categorias:create', (_, data) => db.categorias.create(data))

// CLIENTES
ipcMain.handle('db:clientes:list', () => db.clientes.list())
ipcMain.handle('db:clientes:create', (_, data) => db.clientes.create(data))
ipcMain.handle('db:clientes:update', (_, id, data) => db.clientes.update(id, data))

// FACTURAS
ipcMain.handle('db:facturas:list', (_, filtros) => db.facturas.list(filtros))
ipcMain.handle('db:facturas:get', (_, id) => db.facturas.get(id))
ipcMain.handle('db:facturas:create', (_, data) => db.facturas.create(data))
ipcMain.handle('db:facturas:anular', (_, id) => db.facturas.anular(id))

// TICKETS TPV
ipcMain.handle('db:tickets:create', (_, data) => db.tickets.create(data))
ipcMain.handle('db:tickets:list', (_, filtros) => db.tickets.list(filtros))

// CONFIGURACIÓN
ipcMain.handle('db:config:get', (_, clave) => db.config.get(clave))
ipcMain.handle('db:config:set', (_, clave, valor) => db.config.set(clave, valor))
ipcMain.handle('db:config:getAll', () => db.config.getAll())

// ─── IPC: VeriFactu ───────────────────────────────────────────────────────────
ipcMain.handle('verifactu:status', () => verifactu.getStatus())
ipcMain.handle('verifactu:enviar', (_, facturaId) => verifactu.enviarFactura(facturaId))
ipcMain.handle('verifactu:pendientes', () => verifactu.getPendientes())
ipcMain.handle('verifactu:sincronizar', () => verifactu.sincronizarPendientes())

// ─── IPC: Inventario ──────────────────────────────────────────────────────────
ipcMain.handle('inv:listStock',           ()           => inventario.listStock())
ipcMain.handle('inv:getStock',            (_, id)      => inventario.getStock(id))
ipcMain.handle('inv:getAlertas',          ()           => inventario.getAlertas())
ipcMain.handle('inv:getValoracion',       ()           => inventario.getValoracion())
ipcMain.handle('inv:registrarMovimiento', (_, data)    => inventario.registrarMovimiento(data))
ipcMain.handle('inv:getMovimientos',      (_, id, lim) => inventario.getMovimientos(id, lim))
ipcMain.handle('inv:getMovimientosGlobal',(_, f)       => inventario.getMovimientosGlobal(f))
ipcMain.handle('inv:configurarStock',     (_, id, cfg) => inventario.configurarStock(id, cfg))

// ─── IPC: Perfil ──────────────────────────────────────────────────────────────
ipcMain.handle('perfil:get',        ()        => perfil.get())
ipcMain.handle('perfil:modulos',    ()        => perfil.getModulos())
ipcMain.handle('perfil:terminologia',()       => perfil.getTerminologia())
ipcMain.handle('perfil:camposExtra',(_, ent)  => perfil.getCamposExtra(ent))
ipcMain.handle('perfil:actualizar', (_, cambios) => perfil.actualizar(APP_DIR, cambios))

// ─── IPC: Admin panel ─────────────────────────────────────────────────────────
ipcMain.handle('admin:backup', async () => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar backup de base de datos',
    defaultPath: `sirio-backup-${new Date().toISOString().slice(0,10)}.db`,
    filters: [{ name: 'SQLite', extensions: ['db'] }]
  })
  if (!filePath) return null
  const fs = require('fs')
  const dbPath = require('path').join(app.getPath('userData'), 'sirio.db')
  fs.copyFileSync(dbPath, filePath)
  return filePath
})

ipcMain.handle('admin:restore', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Restaurar backup',
    filters: [{ name: 'SQLite', extensions: ['db'] }],
    properties: ['openFile']
  })
  if (!filePaths?.length) return null
  const fs = require('fs')
  const dbPath = require('path').join(app.getPath('userData'), 'sirio.db')
  fs.copyFileSync(filePaths[0], dbPath)
  app.relaunch()
  app.exit(0)
  return filePaths[0]
})

ipcMain.handle('admin:getLogs', () => {
  const fs = require('fs')
  const logPath = require('path').join(app.getPath('userData'), 'verifactu-service.log')
  if (!fs.existsSync(logPath)) return []
  return fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).slice(-100).reverse()
})

ipcMain.handle('admin:info', () => ({
  version:    app.getVersion(),
  platform:   process.platform,
  dataPath:   app.getPath('userData'),
  perfil:     perfil.get(),
  nodeVersion: process.version
}))

// ─── IPC: Sistema ─────────────────────────────────────────────────────────────
ipcMain.handle('sys:info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  dataPath: app.getPath('userData')
}))

ipcMain.handle('sys:openExternal', (_, url) => shell.openExternal(url))

ipcMain.handle('sys:exportarFacturas', async (_, filtros) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar facturas',
    defaultPath: `facturas_${new Date().toISOString().slice(0,10)}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })
  if (filePath) {
    return db.facturas.exportCSV(filePath, filtros)
  }
  return null
})
