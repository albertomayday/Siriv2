const { contextBridge, ipcRenderer } = require('electron')

// ─── API expuesta al renderer de forma segura ─────────────────────────────────
contextBridge.exposeInMainWorld('sirio', {

  // Ventana
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },

  // Productos
  productos: {
    list: () => ipcRenderer.invoke('db:productos:list'),
    create: (data) => ipcRenderer.invoke('db:productos:create', data),
    update: (id, data) => ipcRenderer.invoke('db:productos:update', id, data),
    delete: (id) => ipcRenderer.invoke('db:productos:delete', id)
  },

  // Categorías
  categorias: {
    list: () => ipcRenderer.invoke('db:categorias:list'),
    create: (data) => ipcRenderer.invoke('db:categorias:create', data)
  },

  // Clientes
  clientes: {
    list: () => ipcRenderer.invoke('db:clientes:list'),
    create: (data) => ipcRenderer.invoke('db:clientes:create', data),
    update: (id, data) => ipcRenderer.invoke('db:clientes:update', id, data)
  },

  // Facturas
  facturas: {
    list: (filtros) => ipcRenderer.invoke('db:facturas:list', filtros),
    get: (id) => ipcRenderer.invoke('db:facturas:get', id),
    create: (data) => ipcRenderer.invoke('db:facturas:create', data),
    anular: (id) => ipcRenderer.invoke('db:facturas:anular', id),
    exportar: (filtros) => ipcRenderer.invoke('sys:exportarFacturas', filtros)
  },

  // Tickets TPV
  tickets: {
    create: (data) => ipcRenderer.invoke('db:tickets:create', data),
    list: (filtros) => ipcRenderer.invoke('db:tickets:list', filtros)
  },

  // Configuración
  config: {
    get: (clave) => ipcRenderer.invoke('db:config:get', clave),
    set: (clave, valor) => ipcRenderer.invoke('db:config:set', clave, valor),
    getAll: () => ipcRenderer.invoke('db:config:getAll')
  },

  // VeriFactu
  verifactu: {
    status: () => ipcRenderer.invoke('verifactu:status'),
    enviar: (facturaId) => ipcRenderer.invoke('verifactu:enviar', facturaId),
    pendientes: () => ipcRenderer.invoke('verifactu:pendientes'),
    sincronizar: () => ipcRenderer.invoke('verifactu:sincronizar')
  },

  // Inventario
  inventario: {
    listStock:            ()           => ipcRenderer.invoke('inv:listStock'),
    getStock:             (id)         => ipcRenderer.invoke('inv:getStock', id),
    getAlertas:           ()           => ipcRenderer.invoke('inv:getAlertas'),
    getValoracion:        ()           => ipcRenderer.invoke('inv:getValoracion'),
    registrarMovimiento:  (data)       => ipcRenderer.invoke('inv:registrarMovimiento', data),
    getMovimientos:       (id, lim)    => ipcRenderer.invoke('inv:getMovimientos', id, lim),
    getMovimientosGlobal: (filtros)    => ipcRenderer.invoke('inv:getMovimientosGlobal', filtros),
    configurarStock:      (id, cfg)    => ipcRenderer.invoke('inv:configurarStock', id, cfg)
  },

  // Sistema
  sys: {
    info: () => ipcRenderer.invoke('sys:info'),
    openExternal: (url) => ipcRenderer.invoke('sys:openExternal', url)
  },

  // Perfil del negocio
  perfil: {
    get:          ()        => ipcRenderer.invoke('perfil:get'),
    modulos:      ()        => ipcRenderer.invoke('perfil:modulos'),
    terminologia: ()        => ipcRenderer.invoke('perfil:terminologia'),
    camposExtra:  (entidad) => ipcRenderer.invoke('perfil:camposExtra', entidad),
    actualizar:   (cambios) => ipcRenderer.invoke('perfil:actualizar', cambios)
  },

  // Panel de administración
  admin: {
    backup:  ()  => ipcRenderer.invoke('admin:backup'),
    restore: ()  => ipcRenderer.invoke('admin:restore'),
    getLogs: ()  => ipcRenderer.invoke('admin:getLogs'),
    info:    ()  => ipcRenderer.invoke('admin:info')
  }
})
