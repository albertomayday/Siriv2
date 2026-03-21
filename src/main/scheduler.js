const cron = require('node-cron')
const verifactu = require('./verifactu')
const db = require('./database')

let tareas = []

function start() {
  // Sincronizar VeriFactu cada 15 minutos
  const tareaSync = cron.schedule('*/15 * * * *', async () => {
    const cfg = db.config.getAll()
    if (cfg.verifactu_activo !== '1') return

    const pendientes = verifactu.getPendientes()
    if (pendientes.length === 0) return

    console.log(`[Scheduler] Sincronizando ${pendientes.length} facturas pendientes VeriFactu...`)
    const resultado = await verifactu.sincronizarPendientes()
    console.log(`[Scheduler] Resultado:`, resultado)
  }, { scheduled: true, timezone: 'Europe/Madrid' })

  tareas.push(tareaSync)
  console.log('[Scheduler] Iniciado — VeriFactu sync cada 15 min')
}

function stop() {
  tareas.forEach(t => t.destroy())
  tareas = []
  console.log('[Scheduler] Detenido')
}

module.exports = { start, stop }
