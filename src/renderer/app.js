// ═══════════════════════════════════════════════════════
// SIRIO TPV — Controlador principal con perfil dinámico
// ═══════════════════════════════════════════════════════

import db from './database.js'

const App = {
  perfil: null,
  term: {},
  state: { productos: [], categorias: [], clientes: [], config: {} },

  loadPerfil() {
    let perfil = localStorage.getItem('sirio-perfil')
    if (!perfil) {
      // Perfil dummy para primera versión
      perfil = JSON.stringify({
        negocio: { nombre: 'Mi Negocio PWA' },
        terminologia: { tpv: 'TPV', factura: 'Factura', cliente: 'Cliente', producto: 'Producto', inventario: 'Inventario' },
        modulos: { inventario: { activo: true }, verifactu: { activo: true } },
        admin: { atajo_teclado: 'F12' }
      })
      localStorage.setItem('sirio-perfil', perfil)
    }
    return JSON.parse(perfil)
  },

  async seedDummyData() {
    // Verificar si ya hay datos
    const productos = await db.getAll('productos')
    if (productos.length > 0) return

    // Agregar datos dummy
    await db.put('productos', { id: '1', nombre: 'Producto 1', precio: 10.0, categoria_id: '1' })
    await db.put('productos', { id: '2', nombre: 'Producto 2', precio: 15.0, categoria_id: '1' })
    await db.put('categorias', { id: '1', nombre: 'Categoría 1' })
    await db.put('clientes', { id: '1', nombre: 'Cliente 1', nif: '12345678A' })
    await db.put('config', { clave: 'iva', valor: '21' })
  },

  async init() {
    // Init database
    await db.init()

    // Agregar datos dummy si está vacío
    await this.seedDummyData()

    // 1. Cargar perfil desde localStorage
    this.perfil = this.loadPerfil()
    this.term   = this.perfil?.terminologia ?? {}

    // 2. Aplicar perfil a la UI
    this.aplicarPerfil()

    // 3. Cargar datos desde IndexedDB
    await this.loadState()

    // 4. Renderizar páginas
    this.renderNegocio()
    this.renderTPV()
    this.renderFacturas()
    this.renderClientes()
    this.renderProductos()
    this.renderInventario()
    this.renderVerifactu()
    this.renderConfig()
    this.renderAdmin()

    // 5. Badge VeriFactu
    this.updateVerifactuBadge()
    setInterval(() => this.updateVerifactuBadge(), 60000)

    // 6. Atajo teclado Admin
    const atajo = this.perfil?.admin?.atajo_teclado ?? 'F12'
    document.addEventListener('keydown', e => {
      if (e.key === atajo) { e.preventDefault(); this.navigate('admin') }
    })
  },

  aplicarPerfil() {
    const p = this.perfil
    if (!p) return

    // Terminología en sidebar
    const labels = {
      tpv: this.T('tpv'), facturas: this.T('factura') + 's',
      clientes: this.T('cliente') + 's', productos: this.T('producto') + 's',
      inventario: this.T('inventario')
    }
    Object.entries(labels).forEach(([k, v]) => {
      const el = document.getElementById(`lbl-${k}`)
      if (el) el.textContent = v
    })

    // Mostrar/ocultar módulos en sidebar
    const modulos = p.modulos ?? {}
    const navMap = { inventario:'nav-inventario', verifactu:'nav-verifactu' }
    Object.entries(navMap).forEach(([mod, navId]) => {
      const el = document.getElementById(navId)
      if (el) el.style.display = modulos[mod]?.activo ? 'flex' : 'none'
    })
  },

  async loadState() {
    this.state.productos  = await db.getAll('productos')
    this.state.categorias = await db.getAll('categorias')
    this.state.clientes   = await db.getAll('clientes')
    this.state.config     = await db.getAll('config')
  },

  loadFromStorage(key) {
    const data = localStorage.getItem(`sirio-${key}`)
    return data ? JSON.parse(data) : null
  },

  T(clave) {
    return this.term[clave] ?? clave
  },

  fmt(n) {
    return Number(n ?? 0).toLocaleString('es-ES', { style:'currency', currency:'EUR' })
  },

  fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-ES')
  },

  escH(s) {
    if (!s) return ''
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  },

  async updateVerifactuBadge() {
    // Stub para primera versión
    const dot = document.querySelector('.status-dot')
    const txt = document.querySelector('.status-text')
    if (dot && txt) {
      dot.className = 'status-dot active'
      txt.textContent = 'VeriFactu OK'
    }
  }
}

// ═══════════════════════════════════════════════════════
// DASHBOARD NEGOCIO
// ═══════════════════════════════════════════════════════
App.renderNegocio = async function() {
  const el = document.getElementById('page-negocio')
  // Datos dummy para primera versión
  const tickets = [] // await db.getAll('tickets') or dummy
  const facturas = []
  const alertas = []
  const vfStatus = { activo: true, pendientes: 0 }

  const ventaHoy = tickets.reduce((s, t) => s + t.total, 0)
  const factHoy  = facturas.filter(f => f.estado !== 'anulada').reduce((s, f) => s + f.total, 0)
  const nombre   = this.perfil?.negocio?.nombre ?? 'Mi Negocio'
  const hora     = new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })
  const fecha    = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title"><span class="title-icon">◉</span> ${this.escH(nombre)}</h1>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:4px;text-transform:capitalize">${fecha} · ${hora}</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="App.renderNegocio()">↻ Actualizar</button>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">${this.T('ticket')}s hoy</div>
        <div class="kpi-value">${this.fmt(ventaHoy)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${this.T('factura')}s hoy</div>
        <div class="kpi-value">${this.fmt(factHoy)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Alertas stock</div>
        <div class="kpi-value">${alertas.length}</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Estado VeriFactu</h2>
      <div class="vf-status ${vfStatus.activo ? (vfStatus.pendientes > 0 ? 'pending' : 'active') : 'inactive'}">
        ${vfStatus.activo ? (vfStatus.pendientes > 0 ? `Pendientes: ${vfStatus.pendientes}` : 'OK') : 'Inactivo'}
      </div>
    </div>
  `
}

      <div class="kpi-card">
        <div class="kpi-label">Recaudación total</div>
        <div class="kpi-value" style="color:var(--accent-bright)">${this.fmt(ventaHoy + factHoy)}</div>
        <div class="kpi-sub">TPV + ${this.T('factura')}s</div>
      </div>
      ${this.perfil?.modulos?.inventario?.activo ? `
      <div class="kpi-card" style="cursor:pointer" onclick="App.navigate('inventario')">
        <div class="kpi-label">Alertas stock</div>
        <div class="kpi-value" style="color:${alertas.length > 0 ? 'var(--amber)' : 'var(--green)'}">${alertas.length}</div>
        <div class="kpi-sub">${alertas.length > 0 ? 'Productos bajo mínimo' : 'Stock OK'}</div>
      </div>` : ''}
      ${this.perfil?.modulos?.verifactu?.activo ? `
      <div class="kpi-card" style="cursor:pointer" onclick="App.navigate('verifactu')">
        <div class="kpi-label">VeriFactu</div>
        <div class="kpi-value" style="font-size:16px;color:${vfStatus.pendientes > 0 ? 'var(--amber)' : 'var(--green)'}">
          ${vfStatus.activo ? (vfStatus.pendientes > 0 ? `${vfStatus.pendientes} pend.` : 'OK') : 'OFF'}
        </div>
        <div class="kpi-sub">Modo ${vfStatus.modo ?? '—'}</div>
      </div>` : ''}
    </div>

    <div class="dash-grid">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Últimos ${this.T('ticket')}s</span>
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('tpv')">Ir al ${this.T('tpv')}</button>
        </div>
        ${tickets.length === 0
          ? '<div class="empty-state" style="padding:30px"><div class="empty-icon">◈</div><div class="empty-text">Sin actividad hoy</div></div>'
          : `<div style="display:flex;flex-direction:column;gap:6px">
              ${tickets.slice(0,8).map(t => `
                <div class="actividad-item">
                  <span class="actividad-hora">${new Date(t.fecha).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span>
                  <span class="actividad-desc">${this.T('ticket')} #${t.numero} · ${t.metodo_pago}</span>
                  <span class="actividad-val">${this.fmt(t.total)}</span>
                </div>
              `).join('')}
            </div>`
        }
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-title" style="margin-bottom:12px">Accesos rápidos</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-primary w-full" onclick="App.navigate('tpv')">⊞ Abrir ${this.T('tpv')}</button>
            <button class="btn btn-secondary w-full" onclick="App.navigate('facturas')">◧ Nueva ${this.T('factura')}</button>
            ${this.perfil?.modulos?.inventario?.activo
              ? `<button class="btn btn-secondary w-full" onclick="App.navigate('inventario')">▦ Ver stock</button>`
              : ''}
          </div>
        </div>

        ${alertas.length > 0 ? `
        <div class="card" style="border-color:rgba(212,135,42,.3)">
          <div class="card-title" style="margin-bottom:12px;color:var(--amber)">⚠ Alertas de stock</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${alertas.slice(0,4).map(a => `
              <div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0;border-bottom:1px solid var(--border)">
                <span style="color:var(--text-secondary)">${this.escH(a.nombre)}</span>
                <span class="badge ${a.tipo==='agotado' ? 'badge-red' : 'badge-amber'}">${a.tipo}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `
}

// Stubs básicos para primera versión
App.renderTPV = function() {
  const el = document.getElementById('page-tpv')
  el.innerHTML = `<h1 class="page-title"><span class="title-icon">⊞</span> ${this.T('tpv')}</h1><p>Página en desarrollo</p>`
}

App.renderFacturas = function() {
  const el = document.getElementById('page-facturas')
  el.innerHTML = `<h1 class="page-title"><span class="title-icon">◧</span> ${this.T('factura')}s</h1><p>Página en desarrollo</p>`
}

App.renderClientes = function() {
  const el = document.getElementById('page-clientes')
  el.innerHTML = `<h1 class="page-title"><span class="title-icon">◉</span> ${this.T('cliente')}s</h1><p>Página en desarrollo</p>`
}

App.renderProductos = function() {
  const el = document.getElementById('page-productos')
  el.innerHTML = `<h1 class="page-title"><span class="title-icon">◈</span> ${this.T('producto')}s</h1><p>Página en desarrollo</p>`
}

App.renderInventario = function() {
  const el = document.getElementById('page-inventario')
  el.innerHTML = `<h1 class="page-title"><span class="title-icon">▦</span> ${this.T('inventario')}</h1><p>Página en desarrollo</p>`
}

App.renderVerifactu = function() {
  const el = document.getElementById('page-verifactu')
  el.innerHTML = `<h1 class="page-title"><span class="title-icon">◎</span> VeriFactu</h1><p>Página en desarrollo</p>`
}

App.renderConfig = function() {
  const el = document.getElementById('page-config')
  el.innerHTML = `<h1 class="page-title"><span class="title-icon">◌</span> Configuración</h1><p>Página en desarrollo</p>`
}

App.renderAdmin = function() {
  const el = document.getElementById('page-admin')
  el.innerHTML = `<h1 class="page-title"><span class="title-icon">⚙</span> Admin</h1><p>Página en desarrollo</p>`
}

App.loadCatTabs = function() {
  const el = document.getElementById('cat-tabs')
  if (!el) return
  el.innerHTML = `<button class="cat-tab active" onclick="App.filtrarCat(this,'')">Todos</button>` +
    this.state.categorias.map(c =>
      `<button class="cat-tab" onclick="App.filtrarCat(this,'${c.id}')">${this.escH(c.nombre)}</button>`
    ).join('')
}

App.filtrarCat = function(btn, catId) {
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  this.loadProductosGrid(catId)
}

App.loadProductosGrid = function(catId = '') {
  const el = document.getElementById('productos-grid')
  if (!el) return
  const prods = catId ? this.state.productos.filter(p => p.categoria_id === catId) : this.state.productos
  if (prods.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">Sin productos</div></div>'
    return
  }
  el.innerHTML = prods.map(p => `
    <div class="producto-card" onclick="TPV.addLinea('${p.id}','${this.escH(p.nombre)}',${p.precio},${p.iva})">
      <div class="prod-nombre">${this.escH(p.nombre)}</div>
      <div class="prod-precio">${this.fmt(p.precio)}</div>
      ${p.categoria_color ? `<div style="width:24px;height:3px;background:${p.categoria_color};border-radius:2px;margin:6px auto 0"></div>` : ''}
    </div>
  `).join('')
}

// ─── TPV State ────────────────────────────────────────
const TPV = {
  lineas: [],

  addLinea(id, nombre, precio, iva) {
    const ex = this.lineas.find(l => l.producto_id === id)
    if (ex) ex.cantidad++
    else this.lineas.push({ producto_id: id, descripcion: nombre, cantidad: 1, precio_unitario: precio, iva })
    this.renderLineas()
  },

  quitarLinea(idx) { this.lineas.splice(idx, 1); this.renderLineas() },

  renderLineas() {
    const el = document.getElementById('ticket-lineas')
    if (!el) return
    if (this.lineas.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">Añade productos</div></div>'
      document.getElementById('t-base').textContent = '0,00 €'
      document.getElementById('t-iva').textContent  = '0,00 €'
      document.getElementById('t-total').textContent = '0,00 €'
      return
    }
    el.innerHTML = this.lineas.map((l, i) => `
      <div class="ticket-linea">
        <div class="linea-nombre">${App.escH(l.descripcion)}</div>
        <div class="linea-qty">×${l.cantidad}</div>
        <div class="linea-precio">${App.fmt(l.precio_unitario * l.cantidad)}</div>
        <div class="linea-del" onclick="TPV.quitarLinea(${i})">✕</div>
      </div>
    `).join('')
    const t = this.calcTotales()
    document.getElementById('t-base').textContent  = App.fmt(t.base)
    document.getElementById('t-iva').textContent   = App.fmt(t.iva)
    document.getElementById('t-total').textContent = App.fmt(t.total)
  },

  calcTotales() {
    let base = 0, iva = 0
    for (const l of this.lineas) {
      const sub = l.precio_unitario * l.cantidad
      const b = sub / (1 + l.iva / 100)
      base += b; iva += sub - b
    }
    return { base, iva, total: base + iva }
  },

  limpiar() { this.lineas = []; this.renderLineas() },

  async cobrar(metodo = 'efectivo') {
    if (!this.lineas.length) return alert('El ticket está vacío')
    const t = this.calcTotales()
    const lineasDB = this.lineas.map(l => {
      const sub = l.precio_unitario * l.cantidad
      return { producto_id: l.producto_id, descripcion: l.descripcion, cantidad: l.cantidad, precio_unitario: l.precio_unitario, iva: l.iva, total: sub }
    })
    await window.sirio.tickets.create({ fecha: new Date().toISOString(), total: t.total, metodo_pago: metodo, lineas: lineasDB })
    alert(`Cobrado: ${App.fmt(t.total)}`)
    this.limpiar()
    App.renderNegocio()
  },

  async emitirFactura() {
    if (!this.lineas.length) return alert('El ticket está vacío')
    const cfg = await window.sirio.config.getAll()
    if (!cfg.serie_defecto) return alert('No hay serie de facturación configurada')

    const opts = App.state.clientes.map(c => `<option value="${c.id}">${App.escH(c.nombre)} — ${c.nif ?? ''}</option>`).join('')
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">◧ Emitir ${App.T('factura')}</div>
        <div class="input-group">
          <label class="input-label">${App.T('cliente')}</label>
          <select class="input" id="mf-cliente"><option value="">— Ocasional —</option>${opts}</select>
        </div>
        <div class="input-group">
          <label class="input-label">Nombre</label>
          <input class="input" id="mf-nombre" placeholder="Nombre del ${App.T('cliente')}"/>
        </div>
        <div class="input-group">
          <label class="input-label">NIF / CIF</label>
          <input class="input" id="mf-nif" placeholder="B00000000"/>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="TPV._confirmarFactura()">Emitir</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
  },

  async _confirmarFactura() {
    const cfg = await window.sirio.config.getAll()
    const clienteId = document.getElementById('mf-cliente')?.value || null
    const nombre = document.getElementById('mf-nombre')?.value || App.T('cliente') + ' Ocasional'
    const nif = document.getElementById('mf-nif')?.value || null
    const cliente = clienteId ? App.state.clientes.find(c => c.id === clienteId) : null
    const t = this.calcTotales()

    const lineasDB = this.lineas.map(l => {
      const sub = l.precio_unitario * l.cantidad
      const b = sub / (1 + l.iva / 100)
      return { producto_id: l.producto_id, descripcion: l.descripcion, cantidad: l.cantidad, precio_unitario: l.precio_unitario, iva: l.iva, base_imponible: b, cuota_iva: sub - b, total: sub }
    })

    const f = await window.sirio.facturas.create({
      serie_id: cfg.serie_defecto, fecha: new Date().toISOString(),
      cliente_id: clienteId, cliente_nombre: cliente?.nombre ?? nombre,
      cliente_nif: cliente?.nif ?? nif, lineas: lineasDB
    })

    document.querySelector('.modal-overlay')?.remove()
    alert(`${App.T('factura')} ${f.numero_completo} emitida — ${App.fmt(f.total)}`)
    this.limpiar()
    App.renderFacturas()
    App.updateVerifactuBadge()
  }
}

// ═══════════════════════════════════════════════════════
// FACTURAS
// ═══════════════════════════════════════════════════════
App.renderFacturas = async function() {
  const el = document.getElementById('page-facturas')
  const lista = await window.sirio.facturas.list()
  const total = lista.filter(f => f.estado !== 'anulada').reduce((s, f) => s + f.total, 0)
  const pendVF = lista.filter(f => f.verifactu_estado === 'pendiente' && f.estado !== 'anulada').length

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◧</span> ${this.T('factura')}s emitidas</h1>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm" onclick="App.exportarFacturas()">Exportar CSV</button>
        <button class="btn btn-secondary btn-sm" onclick="App.renderFacturas()">↻ Actualizar</button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">Total facturado</div><div class="kpi-value">${this.fmt(total)}</div></div>
      <div class="kpi-card"><div class="kpi-label">${this.T('factura')}s emitidas</div><div class="kpi-value">${lista.filter(f=>f.estado!=='anulada').length}</div></div>
      <div class="kpi-card"><div class="kpi-label">Pendientes VeriFactu</div><div class="kpi-value" style="color:${pendVF>0?'var(--amber)':'var(--green)'}">${pendVF}</div></div>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div class="card-header" style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <span class="card-title">Registro de ${this.T('factura')}s</span>
      </div>
      <div style="flex:1;overflow:auto">
        <div class="table-wrap" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Número</th><th>Fecha</th><th>${this.T('cliente')}</th><th>Base</th><th>IVA</th><th>Total</th><th>Estado</th><th>VeriFactu</th><th></th></tr></thead>
            <tbody>
              ${lista.length === 0
                ? `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">Sin ${this.T('factura')}s</td></tr>`
                : lista.map(f => `
                  <tr>
                    <td class="text-mono">${f.numero_completo}</td>
                    <td>${this.fmtDate(f.fecha)}</td>
                    <td>${this.escH(f.cliente_nombre)}</td>
                    <td class="text-mono">${this.fmt(f.base_imponible)}</td>
                    <td class="text-mono">${this.fmt(f.cuota_iva)}</td>
                    <td class="text-mono" style="font-weight:600">${this.fmt(f.total)}</td>
                    <td>${badgeEstado(f.estado)}</td>
                    <td>${badgeVF(f.verifactu_estado)}</td>
                    <td>${f.verifactu_estado==='pendiente'&&f.estado!=='anulada'
                        ? `<button class="btn btn-secondary btn-sm" onclick="App.enviarVF('${f.id}')">Enviar</button>`
                        : ''}</td>
                  </tr>`).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

App.enviarVF = async function(id) {
  const res = await window.sirio.verifactu.enviar(id)
  alert(res.ok ? `✓ Aceptada por AEAT` : `✗ Error: ${res.error}`)
  App.renderFacturas(); App.updateVerifactuBadge()
}

App.exportarFacturas = async function() {
  const p = await window.sirio.facturas.exportar({})
  if (p) alert(`Exportado en:\n${p}`)
}

// ═══════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════
App.renderClientes = function() {
  const el = document.getElementById('page-clientes')
  const lista = this.state.clientes
  const camposExtra = this.perfil?.campos_extra?.cliente ?? []

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◉</span> ${this.T('cliente')}s</h1>
      <button class="btn btn-primary btn-sm" onclick="App.modalCliente()">+ Nuevo ${this.T('cliente')}</button>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div style="flex:1;overflow:auto">
        <div class="table-wrap" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Nombre</th><th>NIF/CIF</th><th>Email</th><th>Teléfono</th><th>Población</th>
              ${camposExtra.map(c => `<th>${c.label}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${lista.length === 0
                ? `<tr><td colspan="${5+camposExtra.length}" style="text-align:center;padding:40px;color:var(--text-muted)">Sin ${this.T('cliente')}s</td></tr>`
                : lista.map(c => `
                  <tr>
                    <td style="font-weight:600">${this.escH(c.nombre)}</td>
                    <td class="text-mono">${c.nif ?? '—'}</td>
                    <td>${c.email ?? '—'}</td>
                    <td>${c.telefono ?? '—'}</td>
                    <td>${c.poblacion ?? '—'}</td>
                    ${camposExtra.map(() => '<td>—</td>').join('')}
                  </tr>`).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

App.modalCliente = function() {
  const camposExtra = this.perfil?.campos_extra?.cliente ?? []
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">◉ Nuevo ${this.T('cliente')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="input-group" style="grid-column:1/-1"><label class="input-label">Nombre *</label><input class="input" id="c-nombre" placeholder="Nombre"/></div>
        <div class="input-group"><label class="input-label">NIF / CIF</label><input class="input" id="c-nif" placeholder="B00000000"/></div>
        <div class="input-group"><label class="input-label">Email</label><input class="input" id="c-email" type="email"/></div>
        <div class="input-group"><label class="input-label">Teléfono</label><input class="input" id="c-tel"/></div>
        <div class="input-group"><label class="input-label">CP</label><input class="input" id="c-cp"/></div>
        <div class="input-group"><label class="input-label">Dirección</label><input class="input" id="c-dir"/></div>
        <div class="input-group"><label class="input-label">Población</label><input class="input" id="c-pob"/></div>
        <div class="input-group"><label class="input-label">Provincia</label><input class="input" id="c-prov"/></div>
        ${camposExtra.map(c => `
          <div class="input-group">
            <label class="input-label">${c.label}</label>
            <input class="input" id="cex-${c.clave}" placeholder="${c.label}" ${c.obligatorio?'required':''}/>
          </div>
        `).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="App._guardarCliente()">Guardar</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
}

App._guardarCliente = async function() {
  const nombre = document.getElementById('c-nombre')?.value?.trim()
  if (!nombre) return alert('El nombre es obligatorio')
  await window.sirio.clientes.create({
    nombre, nif: document.getElementById('c-nif')?.value || null,
    email: document.getElementById('c-email')?.value || null,
    telefono: document.getElementById('c-tel')?.value || null,
    cp: document.getElementById('c-cp')?.value || null,
    direccion: document.getElementById('c-dir')?.value || null,
    poblacion: document.getElementById('c-pob')?.value || null,
    provincia: document.getElementById('c-prov')?.value || null
  })
  document.querySelector('.modal-overlay')?.remove()
  App.state.clientes = await window.sirio.clientes.list()
  App.renderClientes()
}

// ═══════════════════════════════════════════════════════
// PRODUCTOS
// ═══════════════════════════════════════════════════════
App.renderProductos = function() {
  const el = document.getElementById('page-productos')
  const lista = this.state.productos

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◈</span> ${this.T('producto')}s</h1>
      <button class="btn btn-primary btn-sm" onclick="App.modalProducto()">+ Nuevo ${this.T('producto')}</button>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div style="flex:1;overflow:auto">
        <div class="table-wrap" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Nombre</th><th>${this.T('categoria')}</th><th>Precio</th><th>IVA</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              ${lista.length === 0
                ? `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Sin ${this.T('producto')}s</td></tr>`
                : lista.map(p => `
                  <tr>
                    <td style="font-weight:600">${this.escH(p.nombre)}</td>
                    <td>${p.categoria_nombre
                      ? `<span class="badge" style="background:${p.categoria_color}22;color:${p.categoria_color}">${this.escH(p.categoria_nombre)}</span>`
                      : '—'}</td>
                    <td class="text-mono" style="color:var(--accent-bright)">${this.fmt(p.precio)}</td>
                    <td class="text-mono">${p.iva}%</td>
                    <td>${p.controlar_stock
                      ? `<span class="text-mono" style="color:${p.stock_actual<=0?'var(--red)':p.stock_actual<=p.stock_minimo?'var(--amber)':'var(--green)'}">${p.stock_actual}</span>`
                      : '<span style="color:var(--text-muted)">—</span>'}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="App.eliminarProducto('${p.id}')">Eliminar</button></td>
                  </tr>`).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

App.modalProducto = function() {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">◈ Nuevo ${this.T('producto')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="input-group" style="grid-column:1/-1"><label class="input-label">Nombre *</label><input class="input" id="p-nombre"/></div>
        <div class="input-group"><label class="input-label">Precio (con IVA) *</label><input class="input" id="p-precio" type="number" step="0.01"/></div>
        <div class="input-group"><label class="input-label">% IVA</label>
          <select class="input" id="p-iva">
            <option value="21">21% — General</option>
            <option value="10">10% — Reducido</option>
            <option value="4">4% — Superreducido</option>
            <option value="0">0% — Exento</option>
          </select>
        </div>
        <div class="input-group"><label class="input-label">${this.T('categoria')}</label>
          <select class="input" id="p-cat">
            <option value="">Sin ${this.T('categoria')}</option>
            ${this.state.categorias.map(c => `<option value="${c.id}">${this.escH(c.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="input-group"><label class="input-label">Código</label><input class="input" id="p-codigo"/></div>
        ${this.perfil?.modulos?.inventario?.activo ? `
        <div class="input-group" style="grid-column:1/-1">
          <label class="input-label">Control de stock</label>
          <select class="input" id="p-stock">
            <option value="0">No controlar</option>
            <option value="1">Controlar stock</option>
          </select>
        </div>
        <div class="input-group"><label class="input-label">Stock inicial</label><input class="input" id="p-stockval" type="number" value="0"/></div>
        <div class="input-group"><label class="input-label">Stock mínimo</label><input class="input" id="p-stockmin" type="number" value="0"/></div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="App._guardarProducto()">Guardar</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
}

App._guardarProducto = async function() {
  const nombre = document.getElementById('p-nombre')?.value?.trim()
  const precio = parseFloat(document.getElementById('p-precio')?.value)
  if (!nombre || isNaN(precio)) return alert('Nombre y precio son obligatorios')

  const prod = await window.sirio.productos.create({
    nombre, precio,
    iva: parseFloat(document.getElementById('p-iva')?.value ?? 21),
    categoria_id: document.getElementById('p-cat')?.value || null,
    codigo: document.getElementById('p-codigo')?.value || null
  })

  if (document.getElementById('p-stock')?.value === '1') {
    await window.sirio.inventario.configurarStock(prod.id, {
      controlarStock: true,
      stockMinimo: parseFloat(document.getElementById('p-stockmin')?.value ?? 0),
      stockInicial: parseFloat(document.getElementById('p-stockval')?.value ?? 0)
    })
  }

  document.querySelector('.modal-overlay')?.remove()
  App.state.productos = await window.sirio.productos.list()
  App.renderProductos()
  App.renderTPV()
}

App.eliminarProducto = async function(id) {
  if (!confirm('¿Eliminar este producto?')) return
  await window.sirio.productos.delete(id)
  App.state.productos = await window.sirio.productos.list()
  App.renderProductos()
  App.renderTPV()
}

// ═══════════════════════════════════════════════════════
// INVENTARIO
// ═══════════════════════════════════════════════════════
App.renderInventario = async function() {
  const el = document.getElementById('page-inventario')
  const lista = await window.sirio.inventario.listStock()
  const val   = await window.sirio.inventario.getValoracion()
  const alertas = lista.filter(p => p.estado_stock !== 'ok')

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">▦</span> ${this.T('inventario')}</h1>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm" onclick="App.renderInventario()">↻ Actualizar</button>
        <button class="btn btn-primary btn-sm" onclick="App.modalMovimiento()">+ Movimiento</button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">Referencias controladas</div><div class="kpi-value">${val?.referencias_controladas ?? 0}</div></div>
      <div class="kpi-card"><div class="kpi-label">Valor en stock</div><div class="kpi-value">${this.fmt(val?.valor_stock ?? 0)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Bajo mínimo</div><div class="kpi-value" style="color:${(val?.bajo_minimo??0)>0?'var(--amber)':'var(--green)'}">${val?.bajo_minimo ?? 0}</div></div>
      <div class="kpi-card"><div class="kpi-label">Agotados</div><div class="kpi-value" style="color:${(val?.agotados??0)>0?'var(--red)':'var(--green)'}">${val?.agotados ?? 0}</div></div>
    </div>
    ${alertas.length > 0 ? `
    <div class="card" style="border-color:rgba(212,135,42,.3)">
      <div class="card-header"><span class="card-title" style="color:var(--amber)">⚠ Alertas de stock</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Producto</th><th>Stock actual</th><th>Mínimo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            ${alertas.map(p => `
              <tr>
                <td style="font-weight:600">${this.escH(p.nombre)}</td>
                <td class="text-mono" style="color:${p.stock_actual<=0?'var(--red)':'var(--amber)'}">${p.stock_actual}</td>
                <td class="text-mono">${p.stock_minimo}</td>
                <td>${p.estado_stock==='agotado'
                  ? '<span class="badge badge-red">Agotado</span>'
                  : '<span class="badge badge-amber">Bajo mínimo</span>'}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="App.modalMovimiento('${p.id}','${this.escH(p.nombre)}')">Entrada</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div class="card-header" style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <span class="card-title">Stock completo</span>
      </div>
      <div style="flex:1;overflow:auto">
        <div class="table-wrap" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Producto</th><th>${this.T('categoria')}</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Valor</th><th></th></tr></thead>
            <tbody>
              ${lista.map(p => {
                const pct = p.stock_minimo > 0 ? Math.min(100, (p.stock_actual / (p.stock_minimo * 2)) * 100) : 100
                return `
                <tr>
                  <td style="font-weight:600">${this.escH(p.nombre)}</td>
                  <td>${p.categoria_nombre ? `<span style="color:${p.categoria_color}">${this.escH(p.categoria_nombre)}</span>` : '—'}</td>
                  <td class="text-mono">
                    ${p.controlar_stock
                      ? `<div class="flex items-center gap-8">
                          <span style="color:${p.stock_actual<=0?'var(--red)':p.stock_actual<=p.stock_minimo?'var(--amber)':'var(--green)'}">
                            ${p.stock_actual}
                          </span>
                          <div class="stock-bar-wrap">
                            <div class="stock-bar ${p.estado_stock}" style="width:${pct}%"></div>
                          </div>
                        </div>`
                      : '<span style="color:var(--text-muted)">No controlado</span>'
                    }
                  </td>
                  <td class="text-mono">${p.controlar_stock ? p.stock_minimo : '—'}</td>
                  <td>${p.controlar_stock
                    ? (p.estado_stock==='ok'
                        ? '<span class="badge badge-green">OK</span>'
                        : p.estado_stock==='bajo'
                          ? '<span class="badge badge-amber">Bajo</span>'
                          : '<span class="badge badge-red">Agotado</span>')
                    : '—'}</td>
                  <td class="text-mono">${p.controlar_stock ? this.fmt(p.stock_actual * p.precio) : '—'}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="App.modalMovimiento('${p.id}','${this.escH(p.nombre)}')">Mov.</button>
                  </td>
                </tr>`
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

App.modalMovimiento = function(productoId = '', productoNombre = '') {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">▦ Registrar movimiento</div>
      ${!productoId ? `
      <div class="input-group">
        <label class="input-label">Producto</label>
        <select class="input" id="mv-prod">
          <option value="">— Selecciona —</option>
          ${App.state.productos.filter(p=>p.controlar_stock).map(p => `<option value="${p.id}">${App.escH(p.nombre)}</option>`).join('')}
        </select>
      </div>` : `<div style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);padding:8px;background:var(--bg-hover);border-radius:var(--radius)">${productoNombre}</div>`}
      <div class="input-group">
        <label class="input-label">Tipo</label>
        <select class="input" id="mv-tipo">
          <option value="entrada">Entrada (compra/recepción)</option>
          <option value="salida">Salida (merma/corrección)</option>
          <option value="ajuste">Ajuste (nuevo valor absoluto)</option>
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Cantidad</label>
        <input class="input" id="mv-cant" type="number" step="0.01" min="0" value="0"/>
      </div>
      <div class="input-group">
        <label class="input-label">Motivo</label>
        <input class="input" id="mv-motivo" placeholder="Compra proveedor, corrección..."/>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="App._guardarMovimiento('${productoId}')">Registrar</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
}

App._guardarMovimiento = async function(productoId) {
  const pid = productoId || document.getElementById('mv-prod')?.value
  if (!pid) return alert('Selecciona un producto')
  const tipo = document.getElementById('mv-tipo')?.value
  const cantidad = parseFloat(document.getElementById('mv-cant')?.value ?? 0)
  const motivo = document.getElementById('mv-motivo')?.value
  await window.sirio.inventario.registrarMovimiento({ productoId: pid, tipo, cantidad, motivo })
  document.querySelector('.modal-overlay')?.remove()
  App.state.productos = await window.sirio.productos.list()
  App.renderInventario()
  App.renderProductos()
}

// ═══════════════════════════════════════════════════════
// VERIFACTU
// ═══════════════════════════════════════════════════════
App.renderVerifactu = async function() {
  const el = document.getElementById('page-verifactu')
  const status = await window.sirio.verifactu.status()
  const pendientes = await window.sirio.verifactu.pendientes()

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◎</span> VeriFactu — AEAT</h1>
      <button class="btn btn-primary btn-sm" onclick="App.sincronizarVF()">↻ Sincronizar</button>
    </div>
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">Estado</div>
        <div class="kpi-value" style="color:${status.activo?'var(--green)':'var(--red)'}">
          ${status.activo ? 'ACTIVO' : 'INACTIVO'}
        </div>
        <div class="kpi-sub">Modo: ${status.modo?.toUpperCase() ?? '—'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Pendientes</div>
        <div class="kpi-value" style="color:${status.pendientes>0?'var(--amber)':'var(--green)'}">${status.pendientes}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Último envío</div>
        <div class="kpi-value" style="font-size:16px">${status.ultimoEnvio ? this.fmtDate(status.ultimoEnvio) : '—'}</div>
        ${status.ultimoError ? `<div class="kpi-sub" style="color:var(--red)">${this.escH(status.ultimoError)}</div>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Facturas pendientes (${pendientes.length})</span></div>
      ${pendientes.length === 0
        ? '<div class="empty-state" style="padding:30px"><div class="empty-icon">◎</div><div class="empty-text">Todas sincronizadas</div></div>'
        : `<div class="table-wrap"><table>
            <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Total</th><th></th></tr></thead>
            <tbody>
              ${pendientes.map(f => `
                <tr>
                  <td class="text-mono">${f.numero_completo}</td>
                  <td>${this.fmtDate(f.fecha)}</td>
                  <td>${this.escH(f.cliente_nombre)}</td>
                  <td class="text-mono">${this.fmt(f.total)}</td>
                  <td><button class="btn btn-success btn-sm" onclick="App.enviarVF('${f.id}')">Enviar</button></td>
                </tr>`).join('')}
            </tbody>
          </table></div>`
      }
    </div>
  `
}

App.sincronizarVF = async function() {
  const res = await window.sirio.verifactu.sincronizar()
  alert(`Sincronizadas: ${res.total}\nAceptadas: ${res.resultados.filter(r=>r.ok).length}\nErrores: ${res.resultados.filter(r=>!r.ok).length}`)
  App.renderVerifactu(); App.updateVerifactuBadge()
}

// ═══════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════
App.renderConfig = async function() {
  const el = document.getElementById('page-config')
  const cfg = await window.sirio.config.getAll()

  el.innerHTML = `
    <h1 class="page-title"><span class="title-icon">◌</span> Configuración</h1>
    <div class="card">
      <div class="card-header"><span class="card-title">Datos de la empresa</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${cfgI('Nombre / Razón social','empresa_nombre',cfg.empresa_nombre)}
        ${cfgI('NIF / CIF','empresa_nif',cfg.empresa_nif)}
        ${cfgI('Dirección','empresa_direccion',cfg.empresa_direccion)}
        ${cfgI('CP','empresa_cp',cfg.empresa_cp)}
        ${cfgI('Población','empresa_poblacion',cfg.empresa_poblacion)}
        ${cfgI('Provincia','empresa_provincia',cfg.empresa_provincia)}
        ${cfgI('Teléfono','empresa_telefono',cfg.empresa_telefono)}
        ${cfgI('Email','empresa_email',cfg.empresa_email)}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">VeriFactu — AEAT</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="input-group">
          <label class="input-label">Estado</label>
          <select class="input" id="cfg-verifactu_activo">
            <option value="0" ${cfg.verifactu_activo!=='1'?'selected':''}>Desactivado</option>
            <option value="1" ${cfg.verifactu_activo==='1'?'selected':''}>Activado</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Modo</label>
          <select class="input" id="cfg-verifactu_modo">
            <option value="pruebas" ${cfg.verifactu_modo!=='produccion'?'selected':''}>Pruebas</option>
            <option value="produccion" ${cfg.verifactu_modo==='produccion'?'selected':''}>Producción</option>
          </select>
        </div>
        ${cfgI('Certificado (.pfx/.p12)','verifactu_certificado_path',cfg.verifactu_certificado_path)}
        ${cfgI('Contraseña certificado','verifactu_certificado_pass',cfg.verifactu_certificado_pass,'password')}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">TPV</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${cfgI('Pie de ticket','ticket_pie',cfg.ticket_pie)}
        <div class="input-group">
          <label class="input-label">IVA por defecto</label>
          <select class="input" id="cfg-iva_defecto">
            <option value="21" ${cfg.iva_defecto==='21'?'selected':''}>21%</option>
            <option value="10" ${cfg.iva_defecto==='10'?'selected':''}>10%</option>
            <option value="4"  ${cfg.iva_defecto==='4'?'selected':''}>4%</option>
          </select>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:12px">
      <button class="btn btn-primary btn-lg" onclick="App._guardarConfig()">Guardar configuración</button>
    </div>
  `
}

function cfgI(label, id, val, type='text') {
  return `<div class="input-group"><label class="input-label">${label}</label><input class="input" id="cfg-${id}" type="${type}" value="${App.escH(val??'')}"/></div>`
}

App._guardarConfig = async function() {
  const campos = ['empresa_nombre','empresa_nif','empresa_direccion','empresa_cp','empresa_poblacion','empresa_provincia','empresa_telefono','empresa_email','verifactu_activo','verifactu_modo','verifactu_certificado_path','verifactu_certificado_pass','ticket_pie','iva_defecto']
  for (const c of campos) {
    const el = document.getElementById(`cfg-${c}`)
    if (el) await window.sirio.config.set(c, el.value)
  }
  App.state.config = await window.sirio.config.getAll()
  alert('✓ Configuración guardada')
  App.updateVerifactuBadge()
}

// ═══════════════════════════════════════════════════════
// ADMIN (F12)
// ═══════════════════════════════════════════════════════
App.renderAdmin = async function() {
  const el = document.getElementById('page-admin')
  const info = await window.sirio.admin.info()
  const p = info.perfil

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon" style="color:var(--amber)">⚙</span> Panel Administración</h1>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">Acceso: ${p?.admin?.atajo_teclado ?? 'F12'}</div>
      <button class="btn btn-secondary btn-sm" onclick="App.navigate('negocio')">← Volver</button>
    </div>

    <div class="admin-grid">
      <div class="admin-action" onclick="App.adminBackup()">
        <div class="admin-action-ico">💾</div>
        <div class="admin-action-label">Exportar Backup</div>
        <div class="admin-action-desc">Copia de seguridad de la base de datos SQLite</div>
      </div>
      <div class="admin-action" onclick="App.adminRestore()">
        <div class="admin-action-ico">📂</div>
        <div class="admin-action-label">Restaurar Backup</div>
        <div class="admin-action-desc">Restaurar base de datos desde fichero anterior</div>
      </div>
      <div class="admin-action" onclick="App.adminLogs()">
        <div class="admin-action-ico">📋</div>
        <div class="admin-action-label">Ver Logs</div>
        <div class="admin-action-desc">Log de VeriFactu y errores del servicio</div>
      </div>
      <div class="admin-action" onclick="App.navigate('config')">
        <div class="admin-action-ico">◌</div>
        <div class="admin-action-label">Configuración</div>
        <div class="admin-action-desc">Datos empresa, VeriFactu, TPV</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Información del sistema</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px">
        ${adminFila('Versión', info.version)}
        ${adminFila('Plataforma', info.platform)}
        ${adminFila('Node', info.nodeVersion)}
        ${adminFila('Datos', info.dataPath)}
        ${adminFila('Negocio', p?.negocio?.nombre ?? '—')}
        ${adminFila('Tipo', p?._plantilla ?? '—')}
        ${adminFila('Módulos activos', Object.entries(p?.modulos??{}).filter(([,v])=>v.activo).map(([k])=>k).join(', '))}
        ${adminFila('Licencia', p?.licencia?.plan ?? '—')}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Perfil activo — perfil.json</span>
        <button class="btn btn-secondary btn-sm" onclick="App.adminEditarPerfil()">Editar</button>
      </div>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);line-height:1.8">
        Plantilla: <strong>${p?._plantilla ?? 'generico'}</strong> ·
        Versión: <strong>${p?._version ?? '1.0'}</strong> ·
        Firma: <strong>${p?._firma?.slice(0,16) ?? '—'}...</strong>
      </div>
    </div>
  `
}

function adminFila(label, val) {
  return `<div style="padding:8px;background:var(--bg-hover);border-radius:var(--radius-sm)">
    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1px;margin-bottom:4px">${label}</div>
    <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-primary);word-break:break-all">${App.escH(val) || '—'}</div>
  </div>`
}

App.adminBackup = async function() {
  const p = await window.sirio.admin.backup()
  if (p) alert(`✓ Backup guardado en:\n${p}`)
}

App.adminRestore = async function() {
  if (!confirm('¿Restaurar backup?\nSe reiniciará la aplicación.')) return
  await window.sirio.admin.restore()
}

App.adminLogs = async function() {
  const logs = await window.sirio.admin.getLogs()
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal" style="max-width:700px">
      <div class="modal-title">📋 Log VeriFactu</div>
      <div class="log-list">
        ${logs.length === 0
          ? '<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:11px">Sin entradas en el log</div>'
          : logs.map(l => `<div class="log-line">${App.escH(l)}</div>`).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
}

App.adminEditarPerfil = function() {
  alert('Para editar el perfil de forma avanzada,\nmodifica perfil.json en el directorio de instalación\ny reinicia Sirio.')
}

// ═══════════════════════════════════════════════════════
// Utils
// ═══════════════════════════════════════════════════════
function badgeEstado(e) {
  const m = { emitida:['badge-green','● Emitida'], anulada:['badge-red','✕ Anulada'], rectificativa:['badge-amber','↺ Rectificativa'] }
  const [cls,txt] = m[e] ?? ['badge-muted', e]
  return `<span class="badge ${cls}">${txt}</span>`
}

function badgeVF(e) {
  const m = { pendiente:['badge-amber','○ Pendiente'], enviando:['badge-accent','↑ Enviando'], aceptada:['badge-green','✓ Aceptada'], rechazada:['badge-red','✕ Rechazada'] }
  const [cls,txt] = m[e] ?? ['badge-muted', e ?? '—']
  return `<span class="badge ${cls}">${txt}</span>`
}

document.addEventListener('DOMContentLoaded', () => App.init())
