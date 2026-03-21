/**
 * SIRIO — Servicio de background VeriFactu
 * Este script corre como servicio Windows independiente de la UI.
 * Sincroniza facturas pendientes con AEAT cada 15 minutos.
 */

// Simular entorno Electron para reutilizar los módulos
const path = require('path')
const os = require('os')
const fs = require('fs')

// Ruta de datos del usuario (misma que Electron usa)
const dataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Sirio TPV')
if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true })

// Mock mínimo de electron.app para reutilizar database.js
const electronMock = {
  app: {
    getPath: (key) => {
      if (key === 'userData') return dataPath
      return dataPath
    },
    getVersion: () => '1.0.0'
  }
}
require.cache[require.resolve('electron')] = {
  id: 'electron',
  filename: 'electron',
  loaded: true,
  exports: electronMock
}

const db = require('../src/main/database')
const verifactu = require('../src/main/verifactu')
const cron = require('node-cron')

// Log a archivo
const logPath = path.join(dataPath, 'verifactu-service.log')
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  fs.appendFileSync(logPath, line)
  console.log(msg)
}

// Inicializar
db.init()
log('Servicio VeriFactu iniciado')

// Tarea cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
  const cfg = db.config.getAll()
  if (cfg.verifactu_activo !== '1') {
    log('VeriFactu desactivado — omitiendo sincronización')
    return
  }

  const pendientes = verifactu.getPendientes()
  if (pendientes.length === 0) {
    log('Sin facturas pendientes')
    return
  }

  log(`Sincronizando ${pendientes.length} facturas...`)
  const resultado = await verifactu.sincronizarPendientes()
  const ok = resultado.resultados.filter(r => r.ok).length
  const err = resultado.resultados.filter(r => !r.ok).length
  log(`Resultado: ${ok} aceptadas, ${err} errores`)
}, { timezone: 'Europe/Madrid' })

log('Scheduler activo — sincronización cada 15 min')

// Mantener proceso vivo
process.on('SIGTERM', () => {
  log('Servicio detenido')
  process.exit(0)
})
