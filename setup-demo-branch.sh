#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# setup-demo-branch.sh
# Crea la rama `demo` PWA en el repo Siriv2
# Ejecutar desde la raíz del repo: bash setup-demo-branch.sh
# ═══════════════════════════════════════════════════════

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ─── Verificar que estamos en el repo correcto ────────
if [ ! -f "package.json" ]; then
  err "Ejecuta este script desde la raíz del repo Siriv2"
fi

REPO_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "unknown")
log "Repo detectado: $REPO_NAME"

# ─── Guardar rama actual ──────────────────────────────
ORIGINAL_BRANCH=$(git branch --show-current)
log "Rama actual: $ORIGINAL_BRANCH"

# ─── Crear / resetear rama demo ──────────────────────
if git show-ref --quiet refs/heads/demo; then
  warn "La rama 'demo' ya existe — se sobreescribirá"
  git checkout demo
  git reset --hard $ORIGINAL_BRANCH
else
  log "Creando rama demo desde $ORIGINAL_BRANCH"
  git checkout -b demo
fi

ok "En rama demo"

# ═══════════════════════════════════════════════════════
# ARCHIVOS
# ═══════════════════════════════════════════════════════

# ─── package.json ─────────────────────────────────────
log "Escribiendo package.json (demo — solo Vite + idb)"
cat > package.json << 'PKGJSON'
{
  "name": "sirio-demo",
  "version": "1.0.0",
  "description": "Sirio TPV — Demo PWA (hostelería)",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
PKGJSON
ok "package.json"

# ─── vite.config.js ───────────────────────────────────
log "Escribiendo vite.config.js"
cat > vite.config.js << 'VITECFG'
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5174,
    open: true
  }
})
VITECFG
ok "vite.config.js"

# ─── vercel.json ──────────────────────────────────────
log "Escribiendo vercel.json"
cat > vercel.json << 'VERCELJSON'
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ]
}
VERCELJSON
ok "vercel.json"

# ─── .gitignore demo ──────────────────────────────────
log "Escribiendo .gitignore"
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
dist-electron/
*.local
.env
GITIGNORE
ok ".gitignore"

# ─── Directorios ──────────────────────────────────────
log "Creando estructura de directorios"
mkdir -p public/icons
mkdir -p src/db
mkdir -p src/seed
mkdir -p src/renderer

# ─── public/manifest.json ─────────────────────────────
log "Escribiendo manifest.json"
cat > public/manifest.json << 'MANIFEST'
{
  "name": "Sirio TPV — Demo",
  "short_name": "Sirio Demo",
  "description": "Demostración del TPV Sirio con VeriFactu",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#5B8DEF",
  "orientation": "landscape-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["business", "productivity"],
  "lang": "es"
}
MANIFEST
ok "manifest.json"

# ─── public/sw.js ─────────────────────────────────────
log "Escribiendo service worker"
cat > public/sw.js << 'SWJS'
const CACHE = 'sirio-demo-v1'
const PRECACHE = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (!e.request.url.startsWith(self.location.origin)) return
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      }).catch(() => cached)
    })
  )
})
SWJS
ok "sw.js"

# ─── Iconos SVG/PNG ───────────────────────────────────
log "Generando iconos PWA"
node - << 'ICONSCRIPT'
const fs = require('fs')
function svgIcon(size) {
  const r = size / 2
  const fontSize = Math.round(size * 0.35)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size*0.18)}" fill="#0a0a0f"/>
  <defs><linearGradient id="g" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#0a0a0f"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size*0.18)}" fill="url(#g)"/>
  <text x="${r}" y="${r+fontSize*0.38}" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="#5B8DEF" text-anchor="middle">◈</text>
  <text x="${r}" y="${size-Math.round(size*0.12)}" font-family="monospace" font-size="${Math.round(size*0.1)}" fill="#4a4a68" text-anchor="middle">SIRIO</text>
</svg>`
}
fs.writeFileSync('public/icons/icon-192.png', svgIcon(192))
fs.writeFileSync('public/icons/icon-512.png', svgIcon(512))
console.log('Iconos generados')
ICONSCRIPT
ok "Iconos generados"

# ─── src/db/idb.js ────────────────────────────────────
log "Escribiendo src/db/idb.js (capa IndexedDB)"
cat > src/db/idb.js << 'IDBJS'
import { openDB } from 'idb'

const DB_NAME = 'sirio-demo'
const DB_VERSION = 1
let _db = null

async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('config'))
        db.createObjectStore('config', { keyPath: 'clave' })
      if (!db.objectStoreNames.contains('categorias'))
        db.createObjectStore('categorias', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('productos')) {
        const s = db.createObjectStore('productos', { keyPath: 'id' })
        s.createIndex('categoria_id', 'categoria_id')
      }
      if (!db.objectStoreNames.contains('clientes'))
        db.createObjectStore('clientes', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('tickets')) {
        const s = db.createObjectStore('tickets', { keyPath: 'id' })
        s.createIndex('fecha', 'fecha')
      }
      if (!db.objectStoreNames.contains('facturas')) {
        const s = db.createObjectStore('facturas', { keyPath: 'id' })
        s.createIndex('fecha', 'fecha')
      }
      if (!db.objectStoreNames.contains('inventario_movimientos')) {
        const s = db.createObjectStore('inventario_movimientos', { keyPath: 'id' })
        s.createIndex('producto_id', 'producto_id')
      }
    }
  })
  return _db
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()
}

const config = {
  async get(clave) { const db = await getDB(); const r = await db.get('config', clave); return r?.valor ?? null },
  async set(clave, valor) { const db = await getDB(); await db.put('config', { clave, valor }); return true },
  async getAll() { const db = await getDB(); const rows = await db.getAll('config'); return Object.fromEntries(rows.map(r => [r.clave, r.valor])) }
}

const categorias = {
  async list() { const db = await getDB(); return db.getAll('categorias') },
  async create(data) { const db = await getDB(); const cat = { id: uid(), ...data }; await db.put('categorias', cat); return cat }
}

const productos = {
  async list() {
    const db = await getDB()
    const prods = await db.getAll('productos')
    const cats  = await db.getAll('categorias')
    const catMap = Object.fromEntries(cats.map(c => [c.id, c]))
    return prods.map(p => ({ ...p, categoria_nombre: catMap[p.categoria_id]?.nombre ?? null, categoria_color: catMap[p.categoria_id]?.color ?? null }))
  },
  async create(data) {
    const db = await getDB()
    const prod = { id: uid(), nombre: data.nombre, precio: data.precio, iva: data.iva ?? 10, categoria_id: data.categoria_id ?? null, codigo: data.codigo ?? null, controlar_stock: false, stock_actual: 0, stock_minimo: 0 }
    await db.put('productos', prod); return prod
  },
  async update(id, data) { const db = await getDB(); const prod = await db.get('productos', id); if (!prod) return null; const u = { ...prod, ...data }; await db.put('productos', u); return u },
  async delete(id) { const db = await getDB(); await db.delete('productos', id); return true }
}

const clientes = {
  async list() { const db = await getDB(); return db.getAll('clientes') },
  async create(data) { const db = await getDB(); const c = { id: uid(), ...data }; await db.put('clientes', c); return c },
  async update(id, data) { const db = await getDB(); const e = await db.get('clientes', id); const u = { ...e, ...data }; await db.put('clientes', u); return u }
}

let _ticketCounter = null
async function nextTicketNum() {
  const db = await getDB(); const all = await db.getAll('tickets')
  if (_ticketCounter === null) _ticketCounter = all.length
  return ++_ticketCounter
}

const tickets = {
  async create(data) {
    const db = await getDB()
    const num = await nextTicketNum()
    const t = { id: uid(), numero: num, ...data, fecha: data.fecha ?? new Date().toISOString() }
    await db.put('tickets', t)
    for (const l of (data.lineas ?? [])) {
      const prod = await db.get('productos', l.producto_id)
      if (prod?.controlar_stock) { prod.stock_actual = (prod.stock_actual ?? 0) - l.cantidad; await db.put('productos', prod) }
    }
    return t
  },
  async list(filtros = {}) {
    const db = await getDB(); let res = await db.getAll('tickets')
    if (filtros.desde) res = res.filter(t => t.fecha >= filtros.desde)
    return res.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }
}

let _facturaCounter = null
async function nextFacturaNum() {
  const db = await getDB(); const all = await db.getAll('facturas')
  if (_facturaCounter === null) _facturaCounter = all.length
  return ++_facturaCounter
}

const facturas = {
  async create(data) {
    const db = await getDB()
    const num = await nextFacturaNum()
    const f = {
      id: uid(), numero: num,
      numero_completo: `DEMO/${new Date().getFullYear()}/${String(num).padStart(5,'0')}`,
      fecha: data.fecha ?? new Date().toISOString(),
      cliente_id: data.cliente_id ?? null, cliente_nombre: data.cliente_nombre ?? 'Cliente Ocasional', cliente_nif: data.cliente_nif ?? null,
      lineas: data.lineas ?? [],
      base_imponible: (data.lineas ?? []).reduce((s, l) => s + (l.base_imponible ?? 0), 0),
      cuota_iva: (data.lineas ?? []).reduce((s, l) => s + (l.cuota_iva ?? 0), 0),
      total: (data.lineas ?? []).reduce((s, l) => s + l.total, 0),
      estado: 'emitida', verifactu_estado: 'pendiente'
    }
    await db.put('facturas', f); return f
  },
  async list(filtros = {}) {
    const db = await getDB(); let res = await db.getAll('facturas')
    if (filtros.desde) res = res.filter(f => f.fecha >= filtros.desde)
    return res.sort((a, b) => b.fecha.localeCompare(a.fecha))
  },
  async get(id) { const db = await getDB(); return db.get('facturas', id) },
  async anular(id) { const db = await getDB(); const f = await db.get('facturas', id); if (f) { f.estado = 'anulada'; await db.put('facturas', f) } return f },
  async exportar() {
    const db = await getDB(); const all = await db.getAll('facturas')
    const csv = ['Número,Fecha,Cliente,NIF,Base,IVA,Total,Estado',
      ...all.map(f => [f.numero_completo, f.fecha?.slice(0,10), f.cliente_nombre, f.cliente_nif??'', f.base_imponible?.toFixed(2), f.cuota_iva?.toFixed(2), f.total?.toFixed(2), f.estado].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'facturas-sirio-demo.csv'; a.click()
    URL.revokeObjectURL(url)
    return '(descarga en navegador)'
  }
}

const inventario = {
  async listStock() {
    const prods = await productos.list()
    return prods.filter(p => p.controlar_stock).map(p => ({ ...p, estado_stock: p.stock_actual <= 0 ? 'agotado' : p.stock_actual <= p.stock_minimo ? 'bajo' : 'ok' }))
  },
  async getStock(id) { const db = await getDB(); return db.get('productos', id) },
  async getAlertas() { return (await this.listStock()).filter(p => p.estado_stock !== 'ok').map(p => ({ ...p, tipo: p.estado_stock })) },
  async getValoracion() {
    const prods = await this.listStock()
    return { referencias_controladas: prods.length, valor_stock: prods.reduce((s,p) => s + p.stock_actual * p.precio, 0), bajo_minimo: prods.filter(p => p.estado_stock === 'bajo').length, agotados: prods.filter(p => p.estado_stock === 'agotado').length }
  },
  async registrarMovimiento({ productoId, tipo, cantidad, motivo }) {
    const db = await getDB(); const prod = await db.get('productos', productoId); if (!prod) return null
    let s = prod.stock_actual ?? 0
    if (tipo === 'entrada') s += cantidad
    else if (tipo === 'salida') s -= cantidad
    else if (tipo === 'ajuste') s = cantidad
    prod.stock_actual = Math.max(0, s); await db.put('productos', prod)
    const mov = { id: uid(), producto_id: productoId, tipo, cantidad, motivo, fecha: new Date().toISOString() }
    await db.put('inventario_movimientos', mov); return mov
  },
  async getMovimientos(productoId) { const db = await getDB(); return (await db.getAll('inventario_movimientos')).filter(m => m.producto_id === productoId) },
  async getMovimientosGlobal() { const db = await getDB(); return db.getAll('inventario_movimientos') },
  async configurarStock(productoId, { controlarStock, stockMinimo, stockInicial }) {
    const db = await getDB(); const prod = await db.get('productos', productoId); if (!prod) return null
    prod.controlar_stock = controlarStock; prod.stock_minimo = stockMinimo ?? 0; prod.stock_actual = stockInicial ?? 0
    await db.put('productos', prod); return prod
  }
}

const admin = {
  async info() { return { version: '1.0.0-demo', platform: navigator.platform ?? 'Web', nodeVersion: 'PWA (navegador)', dataPath: 'IndexedDB (local)', perfil: await perfil.get() } },
  async backup() {
    const db = await getDB(); const data = {}
    for (const s of ['config','categorias','productos','clientes','tickets','facturas','inventario_movimientos']) data[s] = await db.getAll(s)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `sirio-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url)
    return '(descargado en navegador)'
  },
  async restore() { alert('En la demo, restaura importando el JSON de backup.') },
  async getLogs() { return ['[DEMO] VeriFactu simulado — sin conexión real con AEAT', '[DEMO] Todos los envíos son ficticios'] }
}

const sys = {
  async info() { return { plataforma: 'PWA', demo: true } },
  async openExternal(url) { window.open(url, '_blank') }
}

const perfil = {
  async get() {
    return {
      _plantilla: 'hosteleria', _version: '1.0', _firma: 'demo-no-firma-real',
      negocio: { nombre: 'Bar Demo — Sirio TPV', tipo: 'hosteleria' },
      terminologia: { tpv: 'Caja', ticket: 'Comanda', factura: 'Factura', cliente: 'Cliente', producto: 'Producto', categoria: 'Categoría', cobrar: 'Cobrar', inventario: 'Inventario' },
      modulos: { inventario: { activo: true }, verifactu: { activo: true } },
      campos_extra: { cliente: [] },
      admin: { atajo_teclado: 'F12' },
      licencia: { plan: 'demo' }
    }
  },
  async modulos() { return (await this.get()).modulos },
  async terminologia() { return (await this.get()).terminologia },
  async camposExtra() { return (await this.get()).campos_extra },
  async actualizar() { return true }
}

const verifactu = {
  async status() { return { activo: true, modo: 'demo', pendientes: await this._countPendientes(), ultimoEnvio: null, ultimoError: null } },
  async _countPendientes() { const db = await getDB(); return (await db.getAll('facturas')).filter(f => f.verifactu_estado === 'pendiente' && f.estado !== 'anulada').length },
  async enviar(facturaId) {
    await new Promise(r => setTimeout(r, 800))
    const db = await getDB(); const f = await db.get('facturas', facturaId)
    if (f) { f.verifactu_estado = 'aceptada'; await db.put('facturas', f) }
    return { ok: true, mensaje: '[DEMO] Aceptada simulada — sin conexión real con AEAT' }
  },
  async pendientes() { const db = await getDB(); return (await db.getAll('facturas')).filter(f => f.verifactu_estado === 'pendiente' && f.estado !== 'anulada') },
  async sincronizar() {
    const pend = await this.pendientes(); const resultados = []
    for (const f of pend) resultados.push({ id: f.id, ...(await this.enviar(f.id)) })
    return { total: resultados.length, resultados }
  }
}

export const sirioAPI = { config, categorias, productos, clientes, tickets, facturas, inventario, admin, sys, perfil, verifactu }
IDBJS
ok "src/db/idb.js"

# ─── src/seed/hosteleria.js ───────────────────────────
log "Escribiendo src/seed/hosteleria.js"
cat > src/seed/hosteleria.js << 'SEEDJS'
export async function seedHosteleria(sirio) {
  const existing = await sirio.categorias.list()
  if (existing.length > 0) return

  await sirio.config.set('empresa_nombre', 'Bar Demo El Sirio')
  await sirio.config.set('empresa_nif', 'B12345678')
  await sirio.config.set('empresa_direccion', 'Calle Mayor, 1')
  await sirio.config.set('empresa_cp', '28001')
  await sirio.config.set('empresa_poblacion', 'Madrid')
  await sirio.config.set('empresa_provincia', 'Madrid')
  await sirio.config.set('empresa_telefono', '910000000')
  await sirio.config.set('empresa_email', 'demo@siriotpv.es')
  await sirio.config.set('iva_defecto', '10')
  await sirio.config.set('ticket_pie', 'Gracias por su visita — Bar Demo El Sirio')
  await sirio.config.set('verifactu_activo', '1')
  await sirio.config.set('verifactu_modo', 'pruebas')
  await sirio.config.set('serie_defecto', 'DEMO2024')

  const cats = {}
  for (const c of [
    { nombre: 'Bebidas', color: '#5B8DEF' }, { nombre: 'Cafés', color: '#C4843E' },
    { nombre: 'Tapas', color: '#4CAF82' }, { nombre: 'Bocadillos', color: '#D4872A' },
    { nombre: 'Postres', color: '#9C6FDE' }
  ]) { const cat = await sirio.categorias.create(c); cats[c.nombre] = cat.id }

  const defProds = [
    { nombre: 'Cerveza Caña',       precio: 2.20, iva: 10, cat: 'Bebidas' },
    { nombre: 'Cerveza Botella',    precio: 2.80, iva: 10, cat: 'Bebidas' },
    { nombre: 'Refresco',           precio: 2.00, iva: 10, cat: 'Bebidas' },
    { nombre: 'Agua Mineral',       precio: 1.50, iva: 10, cat: 'Bebidas' },
    { nombre: 'Vino Copa',          precio: 2.50, iva: 10, cat: 'Bebidas' },
    { nombre: 'Copa Vermut',        precio: 3.00, iva: 10, cat: 'Bebidas' },
    { nombre: 'Café Solo',          precio: 1.50, iva: 10, cat: 'Cafés' },
    { nombre: 'Café con Leche',     precio: 1.80, iva: 10, cat: 'Cafés' },
    { nombre: 'Cortado',            precio: 1.60, iva: 10, cat: 'Cafés' },
    { nombre: 'Té / Infusión',      precio: 1.80, iva: 10, cat: 'Cafés' },
    { nombre: 'Jamón Ibérico',      precio: 5.50, iva: 10, cat: 'Tapas',       stock: 30, min: 5 },
    { nombre: 'Queso Manchego',     precio: 4.00, iva: 10, cat: 'Tapas',       stock: 25, min: 5 },
    { nombre: 'Tortilla Española',  precio: 3.50, iva: 10, cat: 'Tapas',       stock: 15, min: 3 },
    { nombre: 'Croquetas (4 ud)',   precio: 4.50, iva: 10, cat: 'Tapas',       stock: 40, min: 8 },
    { nombre: 'Patatas Bravas',     precio: 3.50, iva: 10, cat: 'Tapas',       stock: 20, min: 5 },
    { nombre: 'Ensalada Mixta',     precio: 5.00, iva: 10, cat: 'Tapas',       stock: 10, min: 3 },
    { nombre: 'Bocadillo Jamón',    precio: 4.00, iva: 10, cat: 'Bocadillos',  stock: 15, min: 3 },
    { nombre: 'Bocadillo Tortilla', precio: 3.50, iva: 10, cat: 'Bocadillos',  stock: 10, min: 3 },
    { nombre: 'Montadito Surtido',  precio: 5.00, iva: 10, cat: 'Bocadillos',  stock: 12, min: 3 },
    { nombre: 'Flan Casero',        precio: 3.00, iva: 10, cat: 'Postres',     stock: 8,  min: 2 },
    { nombre: 'Tarta del Día',      precio: 3.50, iva: 10, cat: 'Postres',     stock: 6,  min: 2 }
  ]

  for (const p of defProds) {
    const prod = await sirio.productos.create({ nombre: p.nombre, precio: p.precio, iva: p.iva, categoria_id: cats[p.cat] ?? null })
    if (p.stock !== undefined) await sirio.inventario.configurarStock(prod.id, { controlarStock: true, stockMinimo: p.min ?? 0, stockInicial: p.stock })
  }

  await sirio.clientes.create({ nombre: 'Juan García López',     nif: '12345678A', email: 'juan@ejemplo.es',  telefono: '600111222', poblacion: 'Madrid' })
  await sirio.clientes.create({ nombre: 'María Fernández Ruiz',  nif: '87654321B', email: 'maria@ejemplo.es', telefono: '600333444', poblacion: 'Alcalá' })
  await sirio.clientes.create({ nombre: 'Restaurantes Pérez SL', nif: 'B98765432', email: 'admin@perez.es',   telefono: '910555666', poblacion: 'Madrid' })

  const prods = await sirio.productos.list()
  const getP = n => prods.find(p => p.nombre === n)
  const now = new Date()
  const haceH = h => new Date(now - h * 3600000).toISOString()

  for (const t of [
    { h: 6.5, metodo: 'efectivo', items: [['Café con Leche', 2], ['Tarta del Día', 1]] },
    { h: 5.2, metodo: 'tarjeta',  items: [['Cerveza Caña', 3], ['Croquetas (4 ud)', 1], ['Patatas Bravas', 1]] },
    { h: 3.8, metodo: 'efectivo', items: [['Copa Vermut', 2], ['Jamón Ibérico', 1]] },
    { h: 2.1, metodo: 'tarjeta',  items: [['Bocadillo Jamón', 1], ['Refresco', 1]] },
    { h: 1.0, metodo: 'efectivo', items: [['Café Solo', 2], ['Flan Casero', 2]] }
  ]) {
    const lineas = t.items.map(([n, cant]) => { const p = getP(n); if (!p) return null; const sub = p.precio * cant; return { producto_id: p.id, descripcion: p.nombre, cantidad: cant, precio_unitario: p.precio, iva: p.iva, total: sub } }).filter(Boolean)
    await sirio.tickets.create({ fecha: haceH(t.h), total: lineas.reduce((s,l)=>s+l.total,0), metodo_pago: t.metodo, lineas })
  }

  console.log('[SIRIO DEMO] Seed hostelería cargado ✓')
}
SEEDJS
ok "src/seed/hosteleria.js"

# ─── src/main.js ──────────────────────────────────────
log "Escribiendo src/main.js"
cat > src/main.js << 'MAINJS'
import { sirioAPI }       from './db/idb.js'
import { seedHosteleria } from './seed/hosteleria.js'

window.sirio = sirioAPI

import './renderer/app.js'

document.addEventListener('DOMContentLoaded', async () => {
  try { await seedHosteleria(window.sirio) } catch (e) { console.warn('[SIRIO DEMO] Seed error:', e) }
})
MAINJS
ok "src/main.js"

# ─── index.html ───────────────────────────────────────
log "Escribiendo index.html"
cat > index.html << 'INDEXHTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="theme-color" content="#5B8DEF"/>
  <title>Sirio TPV — Demo</title>
  <link rel="manifest" href="/manifest.json"/>
  <link rel="icon" href="/icons/icon-192.png"/>
  <link rel="apple-touch-icon" href="/icons/icon-192.png"/>
  <style>
    :root {
      --bg-base:#0a0a0f;--bg-surface:#111118;--bg-elevated:#16161f;--bg-hover:#1c1c28;
      --border:rgba(255,255,255,.07);--border-focus:rgba(91,141,239,.5);
      --text-primary:#e8e8f0;--text-secondary:#8888a8;--text-muted:#4a4a68;
      --accent:#5B8DEF;--accent-bright:#7aaeff;--accent-dim:rgba(91,141,239,.15);
      --green:#4CAF82;--red:#EF5B5B;--amber:#D4872A;--purple:#9C6FDE;
      --font-sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      --font-mono:'JetBrains Mono','Fira Code','Consolas',monospace;
      --radius:8px;--radius-sm:4px;--radius-lg:12px;
      --shadow:0 4px 24px rgba(0,0,0,.4);--shadow-lg:0 8px 48px rgba(0,0,0,.6);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;overflow:hidden}
    body{font-family:var(--font-sans);background:var(--bg-base);color:var(--text-primary);font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased}
    #demo-banner{position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#D4872A,#EF5B5B);color:#fff;font-family:var(--font-mono);font-size:10px;letter-spacing:.5px;text-align:center;padding:4px 12px;display:flex;align-items:center;justify-content:center;gap:12px}
    #demo-banner a{color:#fff;text-decoration:underline}
    body.has-banner{padding-top:26px}
    #app{display:flex;height:100%;flex-direction:column}
    .titlebar{height:40px;background:var(--bg-surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:12px;flex-shrink:0;user-select:none}
    .titlebar-logo{font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent-bright);letter-spacing:-.5px}
    .titlebar-sep{width:1px;height:16px;background:var(--border)}
    #tb-negocio{font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:.5px;flex:1}
    .titlebar-status{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10px;color:var(--text-muted)}
    .status-dot{width:6px;height:6px;border-radius:50%;background:var(--text-muted)}
    .status-dot.active{background:var(--green);box-shadow:0 0 6px var(--green)}
    .status-dot.pending{background:var(--amber);box-shadow:0 0 6px var(--amber)}
    .layout{display:flex;flex:1;overflow:hidden}
    .sidebar{width:200px;background:var(--bg-surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:8px 0;flex-shrink:0;overflow-y:auto}
    .nav-section{padding:0 8px;margin-bottom:4px}
    .nav-section-label{font-family:var(--font-mono);font-size:9px;font-weight:600;color:var(--text-muted);letter-spacing:1.5px;text-transform:uppercase;padding:8px 8px 4px}
    .nav-btn{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;background:none;border:none;border-radius:var(--radius);color:var(--text-secondary);font-family:var(--font-sans);font-size:12px;cursor:pointer;transition:all .15s;text-align:left}
    .nav-btn:hover{background:var(--bg-hover);color:var(--text-primary)}
    .nav-btn.active{background:var(--accent-dim);color:var(--accent-bright)}
    .nav-btn .nav-ico{font-size:14px;width:18px;text-align:center;flex-shrink:0}
    .content{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px}
    .page{display:none;flex-direction:column;gap:16px;height:100%}
    .page.active{display:flex}
    .page-title{font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px}
    .title-icon{color:var(--accent)}
    .card{background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px}
    .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .card-title{font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.8px}
    .kpi-row{display:flex;gap:12px;flex-wrap:wrap}
    .kpi-card{flex:1;min-width:140px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px}
    .kpi-label{font-family:var(--font-mono);font-size:9px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .kpi-value{font-size:28px;font-weight:700;line-height:1;color:var(--text-primary);font-variant-numeric:tabular-nums}
    .kpi-sub{font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:6px}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;border:none;border-radius:var(--radius);font-family:var(--font-sans);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;white-space:nowrap}
    .btn:disabled{opacity:.4;cursor:not-allowed}
    .btn-primary{background:var(--accent);color:#fff}
    .btn-primary:hover:not(:disabled){background:var(--accent-bright)}
    .btn-secondary{background:var(--bg-hover);color:var(--text-secondary);border:1px solid var(--border)}
    .btn-secondary:hover:not(:disabled){background:var(--bg-elevated);color:var(--text-primary)}
    .btn-success{background:var(--green);color:#fff}
    .btn-success:hover:not(:disabled){filter:brightness(1.1)}
    .btn-danger{background:rgba(239,91,91,.15);color:var(--red);border:1px solid rgba(239,91,91,.2)}
    .btn-danger:hover:not(:disabled){background:rgba(239,91,91,.25)}
    .btn-sm{padding:5px 10px;font-size:11px}
    .btn-lg{padding:12px 24px;font-size:14px}
    .w-full{width:100%}
    .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:600;font-family:var(--font-mono)}
    .badge-green{background:rgba(76,175,130,.15);color:var(--green)}
    .badge-red{background:rgba(239,91,91,.15);color:var(--red)}
    .badge-amber{background:rgba(212,135,42,.15);color:var(--amber)}
    .badge-accent{background:var(--accent-dim);color:var(--accent-bright)}
    .badge-muted{background:var(--bg-hover);color:var(--text-muted)}
    .table-wrap{border:1px solid var(--border);border-radius:var(--radius);overflow:auto}
    table{width:100%;border-collapse:collapse}
    th{font-family:var(--font-mono);font-size:9px;font-weight:600;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;text-align:left;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg-elevated);white-space:nowrap}
    td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text-secondary);font-size:12px}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:var(--bg-hover)}
    .text-mono{font-family:var(--font-mono)}
    .input{width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;color:var(--text-primary);font-family:var(--font-sans);font-size:13px;outline:none;transition:border-color .15s}
    .input:focus{border-color:var(--border-focus)}
    .input-label{display:block;font-family:var(--font-mono);font-size:9px;font-weight:600;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
    .input-group{display:flex;flex-direction:column;gap:4px}
    .modal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:24px}
    .modal{background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;display:flex;flex-direction:column;gap:16px;box-shadow:var(--shadow-lg)}
    .modal-title{font-size:14px;font-weight:700;color:var(--text-primary)}
    .modal-footer{display:flex;justify-content:flex-end;gap:8px;padding-top:8px;border-top:1px solid var(--border)}
    .tpv-grid{display:grid;grid-template-columns:1fr 320px;gap:16px;flex:1;overflow:hidden}
    .cat-tabs{display:flex;gap:6px;flex-wrap:wrap}
    .cat-tab{padding:5px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:100px;color:var(--text-secondary);font-size:11px;cursor:pointer;transition:all .15s}
    .cat-tab:hover{border-color:var(--accent);color:var(--text-primary)}
    .cat-tab.active{background:var(--accent-dim);border-color:var(--accent);color:var(--accent-bright)}
    .productos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;overflow-y:auto;align-content:start}
    .producto-card{background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:12px 8px;cursor:pointer;text-align:center;transition:all .15s;user-select:none}
    .producto-card:hover{border-color:var(--accent);background:var(--bg-hover);transform:translateY(-1px)}
    .producto-card:active{transform:translateY(0)}
    .prod-nombre{font-size:11px;font-weight:500;color:var(--text-primary);margin-bottom:6px;line-height:1.3}
    .prod-precio{font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--accent-bright)}
    .ticket-panel{background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);display:flex;flex-direction:column;overflow:hidden}
    .ticket-header{padding:12px 16px;font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--text-secondary);border-bottom:1px solid var(--border);background:var(--bg-elevated)}
    .ticket-lineas{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:4px}
    .ticket-linea{display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:8px;padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);font-size:12px}
    .linea-nombre{color:var(--text-primary);font-weight:500}
    .linea-qty{font-family:var(--font-mono);color:var(--text-muted);font-size:11px}
    .linea-precio{font-family:var(--font-mono);color:var(--accent-bright);font-weight:600}
    .linea-del{color:var(--text-muted);cursor:pointer;padding:2px 4px;border-radius:3px}
    .linea-del:hover{color:var(--red);background:rgba(239,91,91,.1)}
    .ticket-totales{padding:12px 16px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:6px}
    .total-row{display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);font-family:var(--font-mono)}
    .total-final{font-size:16px;font-weight:700;color:var(--text-primary);border-top:1px solid var(--border);padding-top:8px;margin-top:4px}
    .ticket-actions{padding:12px 16px;display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border)}
    .dash-grid{display:grid;grid-template-columns:1fr 280px;gap:16px}
    .actividad-item{display:flex;align-items:center;gap:10px;padding:8px;border-radius:var(--radius-sm);font-size:12px}
    .actividad-item:hover{background:var(--bg-hover)}
    .actividad-hora{font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:40px;flex-shrink:0}
    .actividad-desc{flex:1;color:var(--text-secondary)}
    .actividad-val{font-family:var(--font-mono);font-weight:600;color:var(--accent-bright)}
    .stock-bar-wrap{width:60px;height:4px;background:var(--bg-hover);border-radius:2px;overflow:hidden}
    .stock-bar{height:100%;border-radius:2px;background:var(--green);transition:width .3s}
    .stock-bar.bajo{background:var(--amber)}
    .stock-bar.agotado{background:var(--red)}
    .admin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
    .admin-action{background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;cursor:pointer;transition:all .15s;text-align:center}
    .admin-action:hover{border-color:var(--accent);background:var(--bg-hover)}
    .admin-action-ico{font-size:28px;margin-bottom:10px}
    .admin-action-label{font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:4px}
    .admin-action-desc{font-size:11px;color:var(--text-muted);line-height:1.4}
    .log-list{background:var(--bg-base);border:1px solid var(--border);border-radius:var(--radius);padding:12px;max-height:300px;overflow-y:auto;font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)}
    .log-line{padding:3px 0;border-bottom:1px solid var(--border)}
    .log-line:last-child{border:none}
    .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:48px 24px;color:var(--text-muted)}
    .empty-icon{font-size:32px}
    .empty-text{font-size:13px}
    .flex{display:flex}.items-center{align-items:center}.justify-between{justify-content:space-between}.gap-8{gap:8px}
    select{appearance:auto}
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
    ::-webkit-scrollbar-thumb:hover{background:var(--text-muted)}
  </style>
</head>
<body class="has-banner">
  <div id="demo-banner">
    <span>⚠</span>
    <span><strong>MODO DEMO</strong> — Datos en tu navegador · VeriFactu simulado · Sin conexión AEAT</span>
    <span>·</span>
    <span>¿Te interesa? <a href="https://github.com/albertomayday/Siriv2" target="_blank">Ver el proyecto real →</a></span>
  </div>
  <div id="app">
    <div class="titlebar">
      <div class="titlebar-logo">◈ SIRIO</div>
      <div class="titlebar-sep"></div>
      <div id="tb-negocio">Cargando...</div>
      <div class="titlebar-status">
        <div class="status-dot" id="vf-dot"></div>
        <span id="vf-text">VeriFactu</span>
      </div>
    </div>
    <div class="layout">
      <nav class="sidebar">
        <div class="nav-section">
          <div class="nav-section-label">Principal</div>
          <button class="nav-btn active" data-page="negocio" onclick="App.navigate('negocio')"><span class="nav-ico">◉</span><span id="lbl-negocio">Negocio</span></button>
          <button class="nav-btn" data-page="tpv" onclick="App.navigate('tpv')"><span class="nav-ico">⊞</span><span id="lbl-tpv">TPV</span></button>
          <button class="nav-btn" data-page="facturas" onclick="App.navigate('facturas')"><span class="nav-ico">◧</span><span id="lbl-facturas">Facturas</span></button>
        </div>
        <div class="nav-section">
          <div class="nav-section-label">Gestión</div>
          <button class="nav-btn" data-page="clientes" onclick="App.navigate('clientes')"><span class="nav-ico">◉</span><span id="lbl-clientes">Clientes</span></button>
          <button class="nav-btn" data-page="productos" onclick="App.navigate('productos')"><span class="nav-ico">◈</span><span id="lbl-productos">Productos</span></button>
          <button class="nav-btn" id="nav-inventario" data-page="inventario" onclick="App.navigate('inventario')"><span class="nav-ico">▦</span><span id="lbl-inventario">Inventario</span></button>
        </div>
        <div class="nav-section">
          <div class="nav-section-label">Sistema</div>
          <button class="nav-btn" id="nav-verifactu" data-page="verifactu" onclick="App.navigate('verifactu')"><span class="nav-ico">◎</span><span>VeriFactu</span></button>
          <button class="nav-btn" data-page="config" onclick="App.navigate('config')"><span class="nav-ico">◌</span><span>Configuración</span></button>
        </div>
      </nav>
      <main class="content">
        <div class="page active" id="page-negocio"></div>
        <div class="page" id="page-tpv"></div>
        <div class="page" id="page-facturas"></div>
        <div class="page" id="page-clientes"></div>
        <div class="page" id="page-productos"></div>
        <div class="page" id="page-inventario"></div>
        <div class="page" id="page-verifactu"></div>
        <div class="page" id="page-config"></div>
        <div class="page" id="page-admin"></div>
      </main>
    </div>
  </div>
  <script>
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{})
  </script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
INDEXHTML
ok "index.html"

# ─── src/renderer/app.js ──────────────────────────────
log "Copiando src/renderer/app.js desde la rama principal"
# El app.js de la demo ya está en src/renderer/app.js si venimos de main
# Solo necesitamos parchear los 3 puntos que difieren del original

# Parche 1: updateVerifactuBadge — usar IDs del HTML en lugar de querySelector genérico
# Parche 2: adminReset — usar indexedDB nativo en lugar de dynamic import idb
# Parche 3: renderVerifactu — añadir badge DEMO y cambiar texto botón envío
# (El app.js completo ya fue escrito por el script anterior si usas el zip,
#  o se puede copiar del main y aplicar estos 3 parches)

echo ""
warn "IMPORTANTE: copia src/renderer/app.js desde el zip descargado"
warn "o aplica los 3 parches documentados en README-demo.md"

# ─── README-demo.md ───────────────────────────────────
log "Escribiendo README-demo.md"
cat > README-demo.md << 'READMEDEMO'
# Sirio TPV — Rama Demo (PWA)

Demo interactiva del TPV Sirio desplegada como PWA en Vercel.

## Stack

- **Vite** (build)
- **idb** (IndexedDB wrapper)
- **Service Worker** (offline-first)
- **Sin Electron, sin SQLite, sin Node.js en servidor**

## Diferencias con `main`

| Módulo | main | demo |
|---|---|---|
| `window.sirio.*` | IPC → Electron main | `src/db/idb.js` (IndexedDB) |
| `better-sqlite3` | ✅ | ❌ |
| VeriFactu | SOAP real + `.pfx` | Stub simulado |
| Scheduler 15 min | Servicio Windows | `setInterval` |
| Perfil | `perfil.json` archivo | Objeto JS hardcoded |
| Licencia dongle | USB + crypto | Siempre válido |

## Parches en app.js vs original

1. `updateVerifactuBadge()` — usa `getElementById('vf-dot')` y `getElementById('vf-text')`
2. `adminReset()` — usa `indexedDB.deleteDatabase()` nativo
3. `renderVerifactu()` — badge DEMO + texto "Simular envío"

## Despliegue en Vercel

```
Branch:         demo
Build command:  npm run build
Output dir:     dist
```

## Desarrollo local

```bash
npm install
npm run dev
# → http://localhost:5174
```

## Resetear datos demo

Panel Admin (F12) → "Resetear demo"
READMEDEMO
ok "README-demo.md"

# ═══════════════════════════════════════════════════════
# INSTALAR DEPENDENCIAS Y BUILD
# ═══════════════════════════════════════════════════════
log "Instalando dependencias (idb + vite)..."
npm install

log "Verificando build de producción..."
npm run build

ok "Build correcto"

# ═══════════════════════════════════════════════════════
# GIT
# ═══════════════════════════════════════════════════════
log "Preparando commit..."
git add -A
git status --short

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Rama demo lista para commit y push${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo -e "Ejecuta ahora:"
echo -e "  ${YELLOW}git commit -m 'feat: demo PWA hostelería — IndexedDB + seed + SW'${NC}"
echo -e "  ${YELLOW}git push origin demo${NC}"
echo ""
echo -e "Luego en Vercel:"
echo -e "  Branch: ${YELLOW}demo${NC}"
echo -e "  Build:  ${YELLOW}npm run build${NC}"
echo -e "  Output: ${YELLOW}dist${NC}"
echo ""
warn "Recuerda copiar src/renderer/app.js desde el zip descargado"
warn "antes de hacer el commit (ver README-demo.md)"
