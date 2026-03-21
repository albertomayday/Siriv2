const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')

let db

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  const dataPath = app.getPath('userData')
  const dbPath = path.join(dataPath, 'sirio.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createSchema()
  seedDefaults()
  migrateSchema()

  console.log('[DB] Inicializada en:', dbPath)
}

// ─── Migración para instalaciones existentes ─────────────────────────────────
function migrateSchema() {
  // Añadir columnas de stock a productos si no existen
  const cols = db.prepare("PRAGMA table_info(productos)").all().map(c => c.name)
  if (!cols.includes('controlar_stock')) {
    db.exec("ALTER TABLE productos ADD COLUMN controlar_stock INTEGER DEFAULT 0")
  }
  if (!cols.includes('stock_actual')) {
    db.exec("ALTER TABLE productos ADD COLUMN stock_actual REAL DEFAULT 0")
  }
  if (!cols.includes('stock_minimo')) {
    db.exec("ALTER TABLE productos ADD COLUMN stock_minimo REAL DEFAULT 0")
  }
}


function createSchema() {
  db.exec(`
    -- Configuración del sistema
    CREATE TABLE IF NOT EXISTS config (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Categorías de productos
    CREATE TABLE IF NOT EXISTS categorias (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      orden INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Productos / servicios
    CREATE TABLE IF NOT EXISTS productos (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      iva REAL NOT NULL DEFAULT 21.0,
      categoria_id TEXT REFERENCES categorias(id),
      codigo TEXT,
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      -- Inventario
      controlar_stock INTEGER DEFAULT 0,
      stock_actual    REAL    DEFAULT 0,
      stock_minimo    REAL    DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Clientes
    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      nif TEXT,
      email TEXT,
      telefono TEXT,
      direccion TEXT,
      cp TEXT,
      poblacion TEXT,
      provincia TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Serie de facturación
    CREATE TABLE IF NOT EXISTS series (
      id TEXT PRIMARY KEY,
      prefijo TEXT NOT NULL,
      ultimo_numero INTEGER DEFAULT 0,
      ejercicio INTEGER NOT NULL,
      activa INTEGER DEFAULT 1
    );

    -- Facturas (emitidas)
    CREATE TABLE IF NOT EXISTS facturas (
      id TEXT PRIMARY KEY,
      serie_id TEXT REFERENCES series(id),
      numero INTEGER NOT NULL,
      numero_completo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      cliente_id TEXT REFERENCES clientes(id),
      cliente_nombre TEXT NOT NULL,
      cliente_nif TEXT,
      cliente_direccion TEXT,
      base_imponible REAL NOT NULL,
      cuota_iva REAL NOT NULL,
      total REAL NOT NULL,
      estado TEXT DEFAULT 'emitida',  -- emitida | anulada | rectificativa
      factura_rectificada_id TEXT REFERENCES facturas(id),
      observaciones TEXT,
      -- VeriFactu
      verifactu_id TEXT,
      verifactu_hash TEXT,
      verifactu_qr TEXT,
      verifactu_estado TEXT DEFAULT 'pendiente', -- pendiente | enviada | aceptada | rechazada
      verifactu_fecha_envio TEXT,
      verifactu_respuesta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Líneas de factura
    CREATE TABLE IF NOT EXISTS factura_lineas (
      id TEXT PRIMARY KEY,
      factura_id TEXT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
      producto_id TEXT REFERENCES productos(id),
      descripcion TEXT NOT NULL,
      cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      iva REAL NOT NULL,
      base_imponible REAL NOT NULL,
      cuota_iva REAL NOT NULL,
      total REAL NOT NULL
    );

    -- Tickets TPV (ventas rápidas sin factura)
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      numero INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      total REAL NOT NULL,
      metodo_pago TEXT DEFAULT 'efectivo',
      descuento REAL DEFAULT 0,
      estado TEXT DEFAULT 'cerrado',
      operador TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Líneas de ticket
    CREATE TABLE IF NOT EXISTS ticket_lineas (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      producto_id TEXT REFERENCES productos(id),
      descripcion TEXT NOT NULL,
      cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      iva REAL NOT NULL,
      total REAL NOT NULL
    );

    -- Log VeriFactu (trazabilidad completa)
    CREATE TABLE IF NOT EXISTS verifactu_log (
      id TEXT PRIMARY KEY,
      factura_id TEXT REFERENCES facturas(id),
      accion TEXT NOT NULL,
      payload TEXT,
      respuesta TEXT,
      estado TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Movimientos de inventario
    CREATE TABLE IF NOT EXISTS inventario_movimientos (
      id TEXT PRIMARY KEY,
      producto_id   TEXT NOT NULL REFERENCES productos(id),
      tipo          TEXT NOT NULL,  -- entrada | salida | ajuste | devolucion
      cantidad      REAL NOT NULL,
      stock_antes   REAL NOT NULL,
      stock_despues REAL NOT NULL,
      motivo        TEXT,
      referencia    TEXT,           -- id de ticket o factura origen
      operador      TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );
  `)
}

// ─── Seed defaults ────────────────────────────────────────────────────────────
function seedDefaults() {
  const tx = db.transaction(() => {
    // Config inicial
    const configDefaults = [
      ['empresa_nombre', 'Mi Empresa S.L.'],
      ['empresa_nif', 'B00000000'],
      ['empresa_direccion', 'Calle Mayor, 1'],
      ['empresa_cp', '28001'],
      ['empresa_poblacion', 'Madrid'],
      ['empresa_provincia', 'Madrid'],
      ['empresa_telefono', ''],
      ['empresa_email', ''],
      ['iva_defecto', '21'],
      ['moneda', 'EUR'],
      ['verifactu_activo', '0'],
      ['verifactu_modo', 'produccion'],  // produccion | pruebas
      ['verifactu_certificado_path', ''],
      ['verifactu_certificado_pass', ''],
      ['ticket_pie', 'Gracias por su visita'],
      ['serie_defecto', '']
    ]

    const insertConfig = db.prepare(
      'INSERT OR IGNORE INTO config (clave, valor) VALUES (?, ?)'
    )
    for (const [clave, valor] of configDefaults) {
      insertConfig.run(clave, valor)
    }

    // Serie por defecto
    const hasSerie = db.prepare('SELECT COUNT(*) as n FROM series').get()
    if (hasSerie.n === 0) {
      const serieId = uuidv4()
      db.prepare(`
        INSERT INTO series (id, prefijo, ultimo_numero, ejercicio, activa)
        VALUES (?, 'F', 0, ?, 1)
      `).run(serieId, new Date().getFullYear())
      db.prepare("UPDATE config SET valor = ? WHERE clave = 'serie_defecto'")
        .run(serieId)
    }

    // Categorías por defecto
    const hasCats = db.prepare('SELECT COUNT(*) as n FROM categorias').get()
    if (hasCats.n === 0) {
      const cats = [
        [uuidv4(), 'General', '#3b82f6', 0],
        [uuidv4(), 'Servicios', '#10b981', 1],
        [uuidv4(), 'Productos', '#f59e0b', 2]
      ]
      const insertCat = db.prepare(
        'INSERT INTO categorias (id, nombre, color, orden) VALUES (?, ?, ?, ?)'
      )
      for (const cat of cats) insertCat.run(...cat)
    }
  })

  tx()
}

// ─── DAO: Productos ───────────────────────────────────────────────────────────
const productos = {
  list() {
    return db.prepare(`
      SELECT p.*, c.nombre as categoria_nombre, c.color as categoria_color
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1
      ORDER BY c.orden, p.nombre
    `).all()
  },
  create(data) {
    const id = uuidv4()
    db.prepare(`
      INSERT INTO productos (id, nombre, precio, iva, categoria_id, codigo, descripcion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.nombre, data.precio, data.iva ?? 21, data.categoria_id ?? null,
           data.codigo ?? null, data.descripcion ?? null)
    return { id, ...data }
  },
  update(id, data) {
    db.prepare(`
      UPDATE productos SET
        nombre = COALESCE(?, nombre),
        precio = COALESCE(?, precio),
        iva = COALESCE(?, iva),
        categoria_id = COALESCE(?, categoria_id),
        codigo = COALESCE(?, codigo),
        descripcion = COALESCE(?, descripcion),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(data.nombre, data.precio, data.iva, data.categoria_id,
           data.codigo, data.descripcion, id)
    return { id, ...data }
  },
  delete(id) {
    db.prepare("UPDATE productos SET activo = 0 WHERE id = ?").run(id)
    return { id }
  }
}

// ─── DAO: Categorías ──────────────────────────────────────────────────────────
const categorias = {
  list() {
    return db.prepare('SELECT * FROM categorias WHERE activo = 1 ORDER BY orden').all()
  },
  create(data) {
    const id = uuidv4()
    db.prepare('INSERT INTO categorias (id, nombre, color, orden) VALUES (?, ?, ?, ?)')
      .run(id, data.nombre, data.color ?? '#3b82f6', data.orden ?? 0)
    return { id, ...data }
  }
}

// ─── DAO: Clientes ────────────────────────────────────────────────────────────
const clientes = {
  list() {
    return db.prepare('SELECT * FROM clientes ORDER BY nombre').all()
  },
  create(data) {
    const id = uuidv4()
    db.prepare(`
      INSERT INTO clientes (id, nombre, nif, email, telefono, direccion, cp, poblacion, provincia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.nombre, data.nif ?? null, data.email ?? null,
           data.telefono ?? null, data.direccion ?? null, data.cp ?? null,
           data.poblacion ?? null, data.provincia ?? null)
    return { id, ...data }
  },
  update(id, data) {
    db.prepare(`
      UPDATE clientes SET
        nombre = COALESCE(?, nombre),
        nif = COALESCE(?, nif),
        email = COALESCE(?, email),
        telefono = COALESCE(?, telefono),
        direccion = COALESCE(?, direccion),
        cp = COALESCE(?, cp),
        poblacion = COALESCE(?, poblacion),
        provincia = COALESCE(?, provincia),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(data.nombre, data.nif, data.email, data.telefono,
           data.direccion, data.cp, data.poblacion, data.provincia, id)
    return { id, ...data }
  }
}

// ─── DAO: Facturas ────────────────────────────────────────────────────────────
const facturas = {
  list(filtros = {}) {
    let q = `SELECT f.*, c.nombre as cliente_nombre_rel
             FROM facturas f
             LEFT JOIN clientes c ON f.cliente_id = c.id
             WHERE 1=1`
    const params = []

    if (filtros.desde) { q += ' AND f.fecha >= ?'; params.push(filtros.desde) }
    if (filtros.hasta) { q += ' AND f.fecha <= ?'; params.push(filtros.hasta) }
    if (filtros.estado) { q += ' AND f.estado = ?'; params.push(filtros.estado) }
    if (filtros.verifactu_estado) { q += ' AND f.verifactu_estado = ?'; params.push(filtros.verifactu_estado) }

    q += ' ORDER BY f.fecha DESC, f.numero DESC'
    return db.prepare(q).all(...params)
  },

  get(id) {
    const factura = db.prepare('SELECT * FROM facturas WHERE id = ?').get(id)
    if (!factura) return null
    factura.lineas = db.prepare('SELECT * FROM factura_lineas WHERE factura_id = ?').all(id)
    return factura
  },

  create(data) {
    const tx = db.transaction(() => {
      // Obtener siguiente número
      const serie = db.prepare('SELECT * FROM series WHERE id = ?').get(data.serie_id)
      if (!serie) throw new Error('Serie no encontrada')

      const nuevoNumero = serie.ultimo_numero + 1
      db.prepare('UPDATE series SET ultimo_numero = ? WHERE id = ?')
        .run(nuevoNumero, serie.id)

      const numeroCompleto = `${serie.prefijo}${String(nuevoNumero).padStart(5, '0')}`
      const id = uuidv4()

      // Calcular totales
      let baseImponible = 0, cuotaIva = 0
      for (const linea of data.lineas) {
        baseImponible += linea.base_imponible
        cuotaIva += linea.cuota_iva
      }
      const total = baseImponible + cuotaIva

      // Insertar factura
      db.prepare(`
        INSERT INTO facturas (
          id, serie_id, numero, numero_completo, fecha,
          cliente_id, cliente_nombre, cliente_nif, cliente_direccion,
          base_imponible, cuota_iva, total, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, data.serie_id, nuevoNumero, numeroCompleto, data.fecha,
        data.cliente_id ?? null, data.cliente_nombre, data.cliente_nif ?? null,
        data.cliente_direccion ?? null,
        baseImponible, cuotaIva, total, data.observaciones ?? null
      )

      // Insertar líneas
      const insertLinea = db.prepare(`
        INSERT INTO factura_lineas (
          id, factura_id, producto_id, descripcion, cantidad,
          precio_unitario, iva, base_imponible, cuota_iva, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const linea of data.lineas) {
        insertLinea.run(
          uuidv4(), id, linea.producto_id ?? null, linea.descripcion,
          linea.cantidad, linea.precio_unitario, linea.iva,
          linea.base_imponible, linea.cuota_iva, linea.total
        )
      }

      return { id, numero_completo: numeroCompleto, total }
    })

    return tx()
  },

  anular(id) {
    db.prepare("UPDATE facturas SET estado = 'anulada' WHERE id = ?").run(id)
    return { id, estado: 'anulada' }
  },

  updateVerifactu(id, campos) {
    db.prepare(`
      UPDATE facturas SET
        verifactu_id = COALESCE(?, verifactu_id),
        verifactu_hash = COALESCE(?, verifactu_hash),
        verifactu_qr = COALESCE(?, verifactu_qr),
        verifactu_estado = COALESCE(?, verifactu_estado),
        verifactu_fecha_envio = COALESCE(?, verifactu_fecha_envio),
        verifactu_respuesta = COALESCE(?, verifactu_respuesta)
      WHERE id = ?
    `).run(
      campos.verifactu_id, campos.verifactu_hash, campos.verifactu_qr,
      campos.verifactu_estado, campos.verifactu_fecha_envio,
      campos.verifactu_respuesta, id
    )
  },

  exportCSV(filePath, filtros = {}) {
    const rows = this.list(filtros)
    const cabecera = 'Numero;Fecha;Cliente;NIF;Base;IVA;Total;Estado;VeriFactu\n'
    const lineas = rows.map(f =>
      `${f.numero_completo};${f.fecha};${f.cliente_nombre};${f.cliente_nif ?? ''};` +
      `${f.base_imponible.toFixed(2)};${f.cuota_iva.toFixed(2)};${f.total.toFixed(2)};` +
      `${f.estado};${f.verifactu_estado}`
    ).join('\n')
    require('fs').writeFileSync(filePath, '\uFEFF' + cabecera + lineas, 'utf8')
    return filePath
  }
}

// ─── DAO: Tickets ─────────────────────────────────────────────────────────────
const tickets = {
  _getNextNum() {
    const row = db.prepare('SELECT MAX(numero) as max FROM tickets').get()
    return (row.max ?? 0) + 1
  },

  create(data) {
    const tx = db.transaction(() => {
      const id = uuidv4()
      const numero = this._getNextNum()
      db.prepare(`
        INSERT INTO tickets (id, numero, fecha, total, metodo_pago, descuento, operador)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, numero, data.fecha ?? new Date().toISOString(),
             data.total, data.metodo_pago ?? 'efectivo',
             data.descuento ?? 0, data.operador ?? null)

      const insertLinea = db.prepare(`
        INSERT INTO ticket_lineas (id, ticket_id, producto_id, descripcion, cantidad, precio_unitario, iva, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const l of (data.lineas ?? [])) {
        insertLinea.run(uuidv4(), id, l.producto_id ?? null, l.descripcion,
                        l.cantidad, l.precio_unitario, l.iva ?? 21, l.total)
      }

      return { id, numero }
    })
    const resultado = tx()

    // Descontar stock fuera de la transacción principal (no crítico)
    try {
      const inventario = require('./inventario')
      inventario.descontarVenta(data.lineas ?? [], resultado.id)
    } catch (e) {
      console.warn('[Tickets] No se pudo descontar stock:', e.message)
    }

    return resultado
  },

  list(filtros = {}) {
    let q = 'SELECT * FROM tickets WHERE 1=1'
    const params = []
    if (filtros.desde) { q += ' AND fecha >= ?'; params.push(filtros.desde) }
    if (filtros.hasta) { q += ' AND fecha <= ?'; params.push(filtros.hasta) }
    q += ' ORDER BY fecha DESC'
    return db.prepare(q).all(...params)
  }
}

// ─── DAO: Config ──────────────────────────────────────────────────────────────
const config = {
  get(clave) {
    const row = db.prepare('SELECT valor FROM config WHERE clave = ?').get(clave)
    return row?.valor ?? null
  },
  set(clave, valor) {
    db.prepare(`
      INSERT INTO config (clave, valor, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, updated_at = excluded.updated_at
    `).run(clave, String(valor))
    return { clave, valor }
  },
  getAll() {
    const rows = db.prepare('SELECT * FROM config').all()
    return Object.fromEntries(rows.map(r => [r.clave, r.valor]))
  }
}

// ─── Log VeriFactu ────────────────────────────────────────────────────────────
const verifactuLog = {
  add(facturaId, accion, payload, respuesta, estado) {
    db.prepare(`
      INSERT INTO verifactu_log (id, factura_id, accion, payload, respuesta, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), facturaId, accion,
           typeof payload === 'object' ? JSON.stringify(payload) : payload,
           typeof respuesta === 'object' ? JSON.stringify(respuesta) : respuesta,
           estado)
  }
}

// ─── Acceso directo a la instancia db (para módulos internos) ─────────────────
function _raw() { return db }

module.exports = { init, _raw, productos, categorias, clientes, facturas, tickets, config, verifactuLog }
