const path = require('path')
const { Service } = require('node-windows')

const svc = new Service({
  name: 'Sirio TPV',
  script: path.join(__dirname, '..', 'src', 'main', 'scheduler-service.js')
})

svc.on('uninstall', () => {
  console.log('✓ Servicio "Sirio TPV" desinstalado correctamente')
})

svc.on('error', (err) => {
  console.error('✗ Error al desinstalar:', err)
})

console.log('Desinstalando servicio Windows "Sirio TPV"...')
svc.uninstall()
