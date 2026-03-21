/**
 * SIRIO — Instalador de servicio Windows
 * Ejecutar como Administrador: node scripts/install-service.js
 */

const path = require('path')
const { Service } = require('node-windows')
const appDir = path.resolve(__dirname, '..')

const svc = new Service({
  name: 'Sirio TPV',
  description: 'Sirio TPV — Gestor con VeriFactu. Sincronización automática con AEAT.',
  script: path.join(appDir, 'src', 'main', 'scheduler-service.js'),
  nodeOptions: [],
  workingDirectory: appDir,
  allowServiceLogon: true,

  // Reinicio automático en caso de fallo
  wait: 2,       // segundos antes de reintentar
  grow: 0.25,    // factor de espera incremental
  maxRestarts: 3
})

svc.on('install', () => {
  svc.start()
  console.log('✓ Servicio "Sirio TPV" instalado e iniciado')
  console.log('  Para gestionarlo: services.msc → "Sirio TPV"')
})

svc.on('alreadyinstalled', () => {
  console.log('⚠ El servicio ya estaba instalado')
  console.log('  Ejecuta: node scripts/uninstall-service.js para reinstalarlo')
})

svc.on('error', (err) => {
  console.error('✗ Error al instalar el servicio:', err)
})

console.log('Instalando servicio Windows "Sirio TPV"...')
svc.install()
