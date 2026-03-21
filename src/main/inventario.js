/**
 * MÓDULO INVENTARIO
 * Gestión de stock por producto — movimientos, alertas de mínimos,
 * descuento automático al cobrar tickets y facturas.
 */

const db = require('./database')

// ─── Obtener stock actual de un producto ──────────────────────────────────────
function getStock(productoId) {
  const row = db._raw().prepare(
    'SELECT stock_actual, stock_minimo, controlar_stock FROM productos WHERE id = ?'
  ).get(productoId)
  return row ?? null
}

// ─── Listar todos los productos con su stock ──────────────────────────────────
function listStock() {
  return db._raw().prepare(`
    SELECT
      p.id, p.nombre, p.codigo, p.precio,
      p.stock_actual, p.stock_minimo, p.controlar_stock,
      c.nombre AS categoria_nombre, c.color AS categoria_color,
      CASE
        WHEN p.controlar_stock = 1 AND p.stock_actual <= 0          THEN 'agotado'
        WHEN p.controlar_stock = 1 AND p.stock_actual <= p.stock_minimo THEN 'bajo'
        ELSE 'ok'
      END AS estado_stock
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.activo = 1
    ORDER BY estado_stock DESC, p.nombre
  `).all()
}

// ─── Alertas: productos con stock bajo o agotado ──────────────────────────────
function getAlertas() {
  return db._raw().prepare(`
    SELECT p.id, p.nombre, p.codigo, p.stock_actual, p.stock_minimo,
      CASE WHEN p.stock_actual <= 0 THEN 'agotado' ELSE 'bajo' END AS tipo
    FROM productos p
    WHERE p.activo = 1
      AND p.controlar_stock = 1
      AND p.stock_actual <= p.stock_minimo
    ORDER BY p.stock_actual ASC
  `).all()
}

// ─── Registrar movimiento de stock ────────────────────────────────────────────
// tipo: 'entrada' | 'salida' | 'ajuste' | 'devolucion'
function registrarMovimiento({ productoId, tipo, cantidad, motivo, referencia, operador }) {
  const raw = db._raw()

  const producto = raw.prepare('SELECT * FROM productos WHERE id = ?').get(productoId)
  if (!producto) throw new Error(`Producto ${productoId} no encontrado`)

  const stockAntes = producto.stock_actual ?? 0
  let stockDespues

  if (tipo === 'ajuste') {
    stockDespues = cantidad  // cantidad es el nuevo valor absoluto
  } else if (tipo === 'entrada' || tipo === 'devolucion') {
    stockDespues = stockAntes + cantidad
  } else if (tipo === 'salida') {
    stockDespues = stockAntes - cantidad
  } else {
    throw new Error(`Tipo de movimiento desconocido: ${tipo}`)
  }

  const tx = raw.transaction(() => {
    // Actualizar stock en producto
    raw.prepare('UPDATE productos SET stock_actual = ?, updated_at = datetime(\'now\') WHERE id = ?')
       .run(stockDespues, productoId)

    // Registrar en log de movimientos
    const { v4: uuidv4 } = require('uuid')
    raw.prepare(`
      INSERT INTO inventario_movimientos
        (id, producto_id, tipo, cantidad, stock_antes, stock_despues, motivo, referencia, operador)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), productoId, tipo,
      tipo === 'ajuste' ? (stockDespues - stockAntes) : cantidad,
      stockAntes, stockDespues,
      motivo ?? null, referencia ?? null, operador ?? null
    )

    return { stockAntes, stockDespues, diferencia: stockDespues - stockAntes }
  })

  return tx()
}

// ─── Descontar stock al vender (llamado desde tickets.create) ─────────────────
function descontarVenta(lineas, referencia) {
  const raw = db._raw()
  const resultados = []

  for (const linea of lineas) {
    if (!linea.producto_id) continue

    const prod = raw.prepare(
      'SELECT controlar_stock, stock_actual FROM productos WHERE id = ?'
    ).get(linea.producto_id)

    if (!prod || prod.controlar_stock !== 1) continue

    try {
      const res = registrarMovimiento({
        productoId: linea.producto_id,
        tipo: 'salida',
        cantidad: linea.cantidad,
        motivo: 'Venta TPV',
        referencia
      })
      resultados.push({ productoId: linea.producto_id, ...res })
    } catch (e) {
      console.warn('[Inventario] No se pudo descontar stock:', e.message)
    }
  }

  return resultados
}

// ─── Devolver stock al anular (ticket o factura) ──────────────────────────────
function devolverAnulacion(lineas, referencia) {
  const raw = db._raw()

  for (const linea of lineas) {
    if (!linea.producto_id) continue
    const prod = raw.prepare(
      'SELECT controlar_stock FROM productos WHERE id = ?'
    ).get(linea.producto_id)
    if (!prod || prod.controlar_stock !== 1) continue

    try {
      registrarMovimiento({
        productoId: linea.producto_id,
        tipo: 'devolucion',
        cantidad: linea.cantidad,
        motivo: 'Anulación',
        referencia
      })
    } catch (e) {
      console.warn('[Inventario] No se pudo devolver stock:', e.message)
    }
  }
}

// ─── Historial de movimientos de un producto ──────────────────────────────────
function getMovimientos(productoId, limite = 50) {
  return db._raw().prepare(`
    SELECT m.*, p.nombre AS producto_nombre
    FROM inventario_movimientos m
    JOIN productos p ON m.producto_id = p.id
    WHERE m.producto_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `).all(productoId, limite)
}

// ─── Historial global de movimientos ─────────────────────────────────────────
function getMovimientosGlobal(filtros = {}) {
  let q = `
    SELECT m.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
    FROM inventario_movimientos m
    JOIN productos p ON m.producto_id = p.id
    WHERE 1=1
  `
  const params = []

  if (filtros.desde)      { q += ' AND m.created_at >= ?'; params.push(filtros.desde) }
  if (filtros.hasta)      { q += ' AND m.created_at <= ?'; params.push(filtros.hasta) }
  if (filtros.tipo)       { q += ' AND m.tipo = ?';        params.push(filtros.tipo) }
  if (filtros.productoId) { q += ' AND m.producto_id = ?'; params.push(filtros.productoId) }

  q += ' ORDER BY m.created_at DESC LIMIT 500'
  return db._raw().prepare(q).all(...params)
}

// ─── Actualizar config de stock en un producto ───────────────────────────────
function configurarStock(productoId, { controlarStock, stockMinimo, stockInicial }) {
  const raw = db._raw()

  raw.prepare(`
    UPDATE productos SET
      controlar_stock = COALESCE(?, controlar_stock),
      stock_minimo    = COALESCE(?, stock_minimo),
      updated_at      = datetime('now')
    WHERE id = ?
  `).run(
    controlarStock !== undefined ? (controlarStock ? 1 : 0) : null,
    stockMinimo ?? null,
    productoId
  )

  // Si se pasa stock inicial, registrar como ajuste de apertura
  if (stockInicial !== undefined && stockInicial !== null) {
    registrarMovimiento({
      productoId,
      tipo: 'ajuste',
      cantidad: stockInicial,
      motivo: 'Stock inicial / ajuste manual'
    })
  }

  return raw.prepare('SELECT * FROM productos WHERE id = ?').get(productoId)
}

// ─── Resumen de valoración de inventario ─────────────────────────────────────
function getValoracion() {
  return db._raw().prepare(`
    SELECT
      COUNT(*)                                        AS total_referencias,
      SUM(CASE WHEN controlar_stock = 1 THEN 1 END)  AS referencias_controladas,
      SUM(CASE WHEN controlar_stock = 1 THEN stock_actual * precio END) AS valor_stock,
      SUM(CASE WHEN controlar_stock = 1 AND stock_actual <= 0 THEN 1 END) AS agotados,
      SUM(CASE WHEN controlar_stock = 1 AND stock_actual > 0
               AND stock_actual <= stock_minimo THEN 1 END)              AS bajo_minimo
    FROM productos
    WHERE activo = 1
  `).get()
}

module.exports = {
  getStock,
  listStock,
  getAlertas,
  registrarMovimiento,
  descontarVenta,
  devolverAnulacion,
  getMovimientos,
  getMovimientosGlobal,
  configurarStock,
  getValoracion
}
