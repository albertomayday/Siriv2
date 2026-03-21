/**
 * SIRIO — Verificación de licencia dongle
 * Se ejecuta antes de crear la ventana principal
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const SALT = 'OSIRIS-SIRIO-2025'
const BYPASS_FILE = path.join(__dirname, '../../.dev-bypass') // Solo en desarrollo

function verificar(appDir) {
  // Bypass en desarrollo
  if (fs.existsSync(BYPASS_FILE) || process.env.NODE_ENV === 'development') {
    return { ok: true, plan: 'dev', bypass: true }
  }

  // Leer licencia.json del directorio de la app
  const licPath = path.join(appDir, 'licencia.json')
  if (!fs.existsSync(licPath)) {
    return { ok: false, error: 'Fichero de licencia no encontrado' }
  }

  let licencia
  try {
    licencia = JSON.parse(fs.readFileSync(licPath, 'utf8'))
  } catch {
    return { ok: false, error: 'Licencia corrupta o inválida' }
  }

  // Detectar dongle
  const dongle = detectarDongle()
  if (!dongle.encontrado) {
    return { ok: false, error: 'Dongle no detectado. Conecte el dispositivo de licencia.' }
  }

  // Verificar que el dongle coincide con la licencia
  if (dongle.dongleId !== licencia.dongleId) {
    return { ok: false, error: 'Dongle no corresponde a esta licencia.' }
  }

  // Verificar hash
  const hashEsperado = calcularHash(licencia)
  if (hashEsperado !== licencia.hash) {
    return { ok: false, error: 'Licencia manipulada o inválida.' }
  }

  // Verificar expiración
  if (licencia.fechaExpiracion) {
    if (new Date(licencia.fechaExpiracion) < new Date()) {
      return { ok: false, error: 'Licencia expirada.' }
    }
  }

  return { ok: true, plan: licencia.plan, instanciaId: licencia.instanciaId }
}

function detectarDongle() {
  if (process.platform !== 'win32') {
    return { encontrado: false, dongleId: null }
  }

  try {
    const { execSync } = require('child_process')
    const salida = execSync(
      'wmic logicaldisk where "DriveType=2" get DeviceID /value',
      { encoding: 'utf8', timeout: 3000 }
    )
    const unidades = salida.match(/DeviceID=([A-Z]:)/g)?.map(m => m.split('=')[1]) ?? []

    for (const unidad of unidades) {
      const keyPath = path.join(unidad + '\\', 'sirio.key')
      if (fs.existsSync(keyPath)) {
        const contenido = fs.readFileSync(keyPath, 'utf8').trim()
        return { encontrado: true, dongleId: contenido }
      }
    }
  } catch {}

  return { encontrado: false, dongleId: null }
}

function calcularHash(licencia) {
  const contenido = `${SALT}:${licencia.instanciaId}:${licencia.dongleId}:${licencia.plan}:${licencia.fechaActivacion}`
  return crypto.createHash('sha256').update(contenido).digest('hex').toUpperCase()
}

module.exports = { verificar, detectarDongle }
