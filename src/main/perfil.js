/**
 * SIRIO — Lector y aplicador de perfil.json
 * Determina qué módulos están activos, la terminología y los campos extra
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

let _perfil = null

// ─── Perfil por defecto (si no hay perfil.json) ───────────────────────────────
const PERFIL_DEFAULT = {
  _version: '1.0',
  _plantilla: 'generico',
  negocio: { tipo: 'generico', nombre: 'Mi Negocio' },
  fiscal: { iva_defecto: 21, tipos_iva: [21, 10, 4, 0] },
  modulos: {
    negocio:    { activo: true,  orden: 0 },
    tpv:        { activo: true,  orden: 1 },
    facturas:   { activo: true,  orden: 2 },
    clientes:   { activo: true,  orden: 3 },
    productos:  { activo: true,  orden: 4 },
    inventario: { activo: false, orden: 5 },
    verifactu:  { activo: false, orden: 6 },
    config:     { activo: true,  orden: 99 }
  },
  terminologia: {
    ticket: 'Ticket', factura: 'Factura', cliente: 'Cliente',
    producto: 'Producto', categoria: 'Categoría', tpv: 'TPV', cobrar: 'Cobrar'
  },
  campos_extra: { cliente: [], producto: [], ticket: [] },
  tpv: { mostrar_mesas: false, mostrar_descuento: true, metodos_pago: ['efectivo', 'tarjeta'], pie_ticket: 'Gracias' },
  inventario: { alertas_activas: true, descuento_auto_venta: true, stock_negativo: false },
  visual: { tema: 'oscuro', color_acento: '#5b5bff' },
  admin: { atajo_teclado: 'F12', backup_automatico: true }
}

// ─── Cargar perfil ────────────────────────────────────────────────────────────
function cargar(appDir) {
  const perfilPath = path.join(appDir, 'perfil.json')

  if (!fs.existsSync(perfilPath)) {
    console.log('[Perfil] Sin perfil.json — usando configuración por defecto')
    _perfil = PERFIL_DEFAULT
    return _perfil
  }

  try {
    const raw = JSON.parse(fs.readFileSync(perfilPath, 'utf8'))

    // Verificar firma de integridad
    if (raw._firma) {
      const copia = { ...raw }
      delete copia._firma
      const hashCalculado = crypto.createHash('sha256')
        .update(JSON.stringify(copia, null, 0))
        .digest('hex').toUpperCase()

      if (hashCalculado !== raw._firma) {
        console.warn('[Perfil] ⚠ Firma inválida — usando perfil por defecto')
        _perfil = PERFIL_DEFAULT
        return _perfil
      }
    }

    // Merge con defaults para garantizar compatibilidad
    _perfil = mergeConDefault(raw)
    console.log(`[Perfil] Cargado: ${_perfil._plantilla} — ${_perfil.negocio.nombre}`)
    return _perfil

  } catch (e) {
    console.error('[Perfil] Error al cargar:', e.message)
    _perfil = PERFIL_DEFAULT
    return _perfil
  }
}

function mergeConDefault(perfil) {
  return {
    ...PERFIL_DEFAULT,
    ...perfil,
    modulos:      { ...PERFIL_DEFAULT.modulos,      ...(perfil.modulos ?? {}) },
    terminologia: { ...PERFIL_DEFAULT.terminologia, ...(perfil.terminologia ?? {}) },
    campos_extra: { ...PERFIL_DEFAULT.campos_extra, ...(perfil.campos_extra ?? {}) },
    tpv:          { ...PERFIL_DEFAULT.tpv,          ...(perfil.tpv ?? {}) },
    inventario:   { ...PERFIL_DEFAULT.inventario,   ...(perfil.inventario ?? {}) },
    visual:       { ...PERFIL_DEFAULT.visual,        ...(perfil.visual ?? {}) },
    admin:        { ...PERFIL_DEFAULT.admin,         ...(perfil.admin ?? {}) }
  }
}

// ─── Getters ──────────────────────────────────────────────────────────────────
function get()                 { return _perfil ?? PERFIL_DEFAULT }
function getModulos()          { return _perfil?.modulos ?? PERFIL_DEFAULT.modulos }
function getTerminologia()     { return _perfil?.terminologia ?? PERFIL_DEFAULT.terminologia }
function getCamposExtra(entidad){ return _perfil?.campos_extra?.[entidad] ?? [] }
function moduloActivo(nombre)  { return !!(_perfil?.modulos?.[nombre]?.activo) }
function getTerm(clave)        { return _perfil?.terminologia?.[clave] ?? clave }

// ─── Actualizar perfil local (panel admin de Sirio) ──────────────────────────
function actualizar(appDir, cambios) {
  const perfilActual = _perfil ?? PERFIL_DEFAULT
  const nuevo = mergeConDefault({ ...perfilActual, ...cambios })

  // Re-firmar
  const copia = { ...nuevo }
  delete copia._firma
  nuevo._firma = crypto.createHash('sha256')
    .update(JSON.stringify(copia, null, 0))
    .digest('hex').toUpperCase()

  fs.writeFileSync(path.join(appDir, 'perfil.json'), JSON.stringify(nuevo, null, 2), 'utf8')
  _perfil = nuevo
  return nuevo
}

module.exports = { cargar, get, getModulos, getTerminologia, getCamposExtra, moduloActivo, getTerm, actualizar }
