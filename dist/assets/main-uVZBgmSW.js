(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const c of i)if(c.type==="childList")for(const l of c.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function a(i){const c={};return i.integrity&&(c.integrity=i.integrity),i.referrerPolicy&&(c.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?c.credentials="include":i.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function s(i){if(i.ep)return;i.ep=!0;const c=a(i);fetch(i.href,c)}})();class ${constructor(){this.db=null}async init(){return new Promise((e,a)=>{const s=indexedDB.open("SirioDB",1);s.onerror=()=>a(s.error),s.onsuccess=()=>{this.db=s.result,e()},s.onupgradeneeded=i=>{const c=i.target.result;c.objectStoreNames.contains("productos")||c.createObjectStore("productos",{keyPath:"id"}),c.objectStoreNames.contains("categorias")||c.createObjectStore("categorias",{keyPath:"id"}),c.objectStoreNames.contains("clientes")||c.createObjectStore("clientes",{keyPath:"id"}),c.objectStoreNames.contains("config")||c.createObjectStore("config",{keyPath:"clave"})}})}async getAll(e){return new Promise((a,s)=>{const l=this.db.transaction([e],"readonly").objectStore(e).getAll();l.onsuccess=()=>a(l.result),l.onerror=()=>s(l.error)})}async put(e,a){return new Promise((s,i)=>{const o=this.db.transaction([e],"readwrite").objectStore(e).put(a);o.onsuccess=()=>s(o.result),o.onerror=()=>i(o.error)})}async get(e,a){return new Promise((s,i)=>{const o=this.db.transaction([e],"readonly").objectStore(e).get(a);o.onsuccess=()=>s(o.result),o.onerror=()=>i(o.error)})}async delete(e,a){return new Promise((s,i)=>{const o=this.db.transaction([e],"readwrite").objectStore(e).delete(a);o.onsuccess=()=>s(o.result),o.onerror=()=>i(o.error)})}}const r=new $,n={perfil:null,term:{},state:{productos:[],categorias:[],clientes:[],config:{}},loadPerfil(){let t=localStorage.getItem("sirio-perfil");return t||(t=JSON.stringify({negocio:{nombre:"Mi Negocio PWA"},terminologia:{tpv:"TPV",factura:"Factura",cliente:"Cliente",producto:"Producto",inventario:"Inventario"},modulos:{inventario:{activo:!0},verifactu:{activo:!0}},admin:{atajo_teclado:"F12"}}),localStorage.setItem("sirio-perfil",t)),JSON.parse(t)},async seedDummyData(){(await r.getAll("productos")).length>0||(await r.put("categorias",{id:"1",nombre:"Bebidas"}),await r.put("categorias",{id:"2",nombre:"Comida"}),await r.put("productos",{id:"1",nombre:"Coca-Cola",precio:2,categoria_id:"1"}),await r.put("productos",{id:"2",nombre:"Hamburguesa",precio:8.5,categoria_id:"2"}),await r.put("productos",{id:"3",nombre:"Patatas Fritas",precio:3.5,categoria_id:"2"}),await r.put("productos",{id:"4",nombre:"Agua",precio:1.5,categoria_id:"1"}),await r.put("clientes",{id:"1",nombre:"Juan Pérez",nif:"12345678A"}),await r.put("clientes",{id:"2",nombre:"María García",nif:"87654321B"}),await r.put("config",{clave:"iva",valor:"21"}))},async init(){var e,a,s;await r.init(),await this.seedDummyData(),this.perfil=this.loadPerfil(),this.term=((e=this.perfil)==null?void 0:e.terminologia)??{},this.aplicarPerfil(),await this.loadState(),this.renderNegocio(),this.renderTPV(),this.renderFacturas(),this.renderClientes(),this.renderProductos(),this.renderInventario(),this.renderVerifactu(),this.renderConfig(),this.renderAdmin(),this.updateVerifactuBadge(),setInterval(()=>this.updateVerifactuBadge(),6e4);const t=((s=(a=this.perfil)==null?void 0:a.admin)==null?void 0:s.atajo_teclado)??"F12";document.addEventListener("keydown",i=>{i.key===t&&(i.preventDefault(),this.navigate("admin"))})},aplicarPerfil(){const t=this.perfil;if(!t)return;const e={tpv:this.T("tpv"),facturas:this.T("factura")+"s",clientes:this.T("cliente")+"s",productos:this.T("producto")+"s",inventario:this.T("inventario")};Object.entries(e).forEach(([i,c])=>{const l=document.getElementById(`lbl-${i}`);l&&(l.textContent=c)});const a=t.modulos??{};Object.entries({inventario:"nav-inventario",verifactu:"nav-verifactu",caja:"nav-caja"}).forEach(([i,c])=>{var o;const l=document.getElementById(c);l&&(l.style.display=(o=a[i])!=null&&o.activo?"flex":"none")})},async loadState(){this.state.productos=await r.getAll("productos"),this.state.categorias=await r.getAll("categorias"),this.state.clientes=await r.getAll("clientes"),this.state.config=await r.getAll("config")},loadFromStorage(t){const e=localStorage.getItem(`sirio-${t}`);return e?JSON.parse(e):null},T(t){return this.term[t]??t},fmt(t){return Number(t??0).toLocaleString("es-ES",{style:"currency",currency:"EUR"})},fmtDate(t){return t?new Date(t).toLocaleDateString("es-ES"):"—"},escH(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""},async updateVerifactuBadge(){const t=document.querySelector(".status-dot"),e=document.querySelector(".status-text");t&&e&&(t.className="status-dot active",e.textContent="VeriFactu OK")}};n.renderNegocio=async function(){var v,u;const t=document.getElementById("page-negocio"),e=[],a=[],s=[],i=e.reduce((b,p)=>b+p.total,0),c=a.filter(b=>b.estado!=="anulada").reduce((b,p)=>b+p.total,0),l=((u=(v=this.perfil)==null?void 0:v.negocio)==null?void 0:u.nombre)??"Mi Negocio",o=new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),d=new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});return t.innerHTML=`
    <div class='flex items-center justify-between'>
      <div>
        <h1 class='page-title'><span class='title-icon'>◉</span> ${this.escH(l)}</h1>
        <div style='font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:4px;text-transform:capitalize'>${d} · ${o}</div>
      </div>
      <button class='btn btn-secondary btn-sm' onclick='App.renderNegocio()'>↻ Actualizar</button>
    </div>

    <div class='kpi-row'>
      <div class='kpi-card'>
        <div class='kpi-label'>${this.T("ticket")}s hoy</div>
        <div class='kpi-value'>${this.fmt(i)}</div>
      </div>
      <div class='kpi-card'>
        <div class='kpi-label'>${this.T("factura")}s hoy</div>
        <div class='kpi-value'>${this.fmt(c)}</div>
      </div>
      <div class='kpi-card'>
        <div class='kpi-label'>Alertas stock</div>
        <div class='kpi-value'>${s.length}</div>
      </div>
    </div>

    <div class='section'>
      <h2 class='section-title'>Estado VeriFactu</h2>
      <div class='vf-status active'>
        OK
      </div>
    </div>
  `,`
}
return `};n.renderTPV=async function(){const t=document.getElementById("page-tpv"),e=await r.getAll("productos"),a=await r.getAll("categorias");t.innerHTML=`
    <h1 class="page-title"><span class="title-icon">⊞</span> ${this.T("tpv")}</h1>
    <div class="tpv-grid">
      <div style="display:flex;flex-direction:column;gap:12px;overflow:hidden">
        <div class="cat-tabs" id="cat-tabs">
          <button class="cat-tab active" onclick="App.filtrarProductos('')">Todos</button>
          ${a.map(s=>`<button class="cat-tab" onclick="App.filtrarProductos('${s.id}')">${this.escH(s.nombre)}</button>`).join("")}
        </div>
        <div class="productos-grid" id="productos-grid">
          ${e.map(s=>`
            <button class="producto-card" onclick="App.agregarProducto('${s.id}')">
              <div class="producto-nombre">${this.escH(s.nombre)}</div>
              <div class="producto-precio">${this.fmt(s.precio)}</div>
            </button>
          `).join("")}
        </div>
      </div>
      <div class="ticket-panel">
        <div class="ticket-header">◧ ${this.T("ticket")} actual</div>
        <div class="ticket-lineas" id="ticket-lineas">
          <div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">Añade productos</div></div>
        </div>
        <div class="ticket-totales">
          <div class="total-row"><span>Base imponible</span><span id="t-base">0,00 €</span></div>
          <div class="total-row"><span>IVA (21%)</span><span id="t-iva">0,00 €</span></div>
          <div class="total-row total-final"><span>TOTAL</span><span id="t-total">0,00 €</span></div>
        </div>
        <div class="ticket-actions">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <button class="btn btn-secondary" onclick="App.limpiarTicket()">Limpiar</button>
            <button class="btn btn-success" onclick="App.cobrarTicket()">Cobrar</button>
          </div>
          <button class="btn btn-primary w-full" onclick="App.emitirFactura()">Emitir ${this.T("factura")}</button>
        </div>
      </div>
    </div>
  `,this.ticket=[],this.actualizarTicket()};n.filtrarProductos=function(t){document.querySelectorAll(".cat-tab").forEach(e=>e.classList.remove("active")),event.target.classList.add("active")};n.agregarProducto=async function(t){const e=await r.get("productos",t),a=this.ticket.find(s=>s.producto.id===t);a?a.cantidad++:this.ticket.push({producto:e,cantidad:1,precio:e.precio}),this.actualizarTicket()};n.actualizarTicket=function(){const t=document.getElementById("ticket-lineas"),e=document.getElementById("t-base"),a=document.getElementById("t-iva"),s=document.getElementById("t-total");if(this.ticket.length===0){t.innerHTML='<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">Añade productos</div></div>',e.textContent="0,00 €",a.textContent="0,00 €",s.textContent="0,00 €";return}t.innerHTML=this.ticket.map((o,d)=>`
    <div class="ticket-linea">
      <div class="linea-info">
        <div class="linea-nombre">${this.escH(o.producto.nombre)}</div>
        <div class="linea-precio">${this.fmt(o.precio)}</div>
      </div>
      <div class="linea-cantidad">
        <button onclick="App.cambiarCantidad(${d}, -1)">-</button>
        <span>${o.cantidad}</span>
        <button onclick="App.cambiarCantidad(${d}, 1)">+</button>
      </div>
      <div class="linea-total">${this.fmt(o.cantidad*o.precio)}</div>
      <button class="linea-remove" onclick="App.removerLinea(${d})">×</button>
    </div>
  `).join("");const i=this.ticket.reduce((o,d)=>o+d.cantidad*d.precio,0),c=i*.21,l=i+c;e.textContent=this.fmt(i),a.textContent=this.fmt(c),s.textContent=this.fmt(l)};n.cambiarCantidad=function(t,e){this.ticket[t].cantidad+=e,this.ticket[t].cantidad<=0&&this.ticket.splice(t,1),this.actualizarTicket()};n.removerLinea=function(t){this.ticket.splice(t,1),this.actualizarTicket()};n.limpiarTicket=function(){this.ticket=[],this.actualizarTicket()};n.cobrarTicket=function(){this.ticket.length!==0&&(alert("Ticket cobrado! (Funcionalidad básica)"),this.limpiarTicket())};n.emitirFactura=function(){alert("Factura emitida! (Funcionalidad básica)")};document.addEventListener("DOMContentLoaded",()=>{n.init()});n.renderFacturas=async function(){const t=document.getElementById("page-facturas"),e=[{id:"1",numero_completo:"F2024-001",fecha:"2024-03-29",cliente_nombre:"Juan Pérez",base_imponible:10.5,cuota_iva:2.2,total:12.7,estado:"emitida",verifactu_estado:"pendiente"}];t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◧</span> ${this.T("factura")}s emitidas</h1>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm" onclick="App.exportarFacturas()">Exportar CSV</button>
        <button class="btn btn-secondary btn-sm" onclick="App.renderFacturas()">↻ Actualizar</button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">Total facturado</div><div class="kpi-value">${this.fmt(e.reduce((a,s)=>a+s.total,0))}</div></div>
      <div class="kpi-card"><div class="kpi-label">${this.T("factura")}s emitidas</div><div class="kpi-value">${e.filter(a=>a.estado!=="anulada").length}</div></div>
      <div class="kpi-card"><div class="kpi-label">Pendientes VeriFactu</div><div class="kpi-value" style="color:var(--amber)">${e.filter(a=>a.verifactu_estado==="pendiente").length}</div></div>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div style="flex:1;overflow:auto">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Fecha</th><th>${this.T("cliente")}</th><th>Base</th><th>IVA</th><th>Total</th><th>Estado</th><th>VeriFactu</th><th></th></tr></thead>
            <tbody>
              ${e.length===0?`<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">Sin ${this.T("factura")}s</td></tr>`:e.map(a=>`
                  <tr>
                    <td class="text-mono">${a.numero_completo}</td>
                    <td>${this.fmtDate(a.fecha)}</td>
                    <td>${this.escH(a.cliente_nombre)}</td>
                    <td class="text-mono">${this.fmt(a.base_imponible)}</td>
                    <td class="text-mono">${this.fmt(a.cuota_iva)}</td>
                    <td class="text-mono" style="font-weight:600">${this.fmt(a.total)}</td>
                    <td><span class="badge badge-success">${a.estado}</span></td>
                    <td><span class="badge badge-warning">${a.verifactu_estado}</span></td>
                    <td>${a.verifactu_estado==="pendiente"?`<button class="btn btn-secondary btn-sm" onclick="App.enviarVF('${a.id}')">Enviar</button>`:""}</td>
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `};n.exportarFacturas=function(){alert("Exportar CSV (Funcionalidad básica)")};n.enviarVF=function(t){alert("Enviar a VeriFactu (Funcionalidad básica)")};n.renderClientes=async function(){const t=document.getElementById("page-clientes"),e=await r.getAll("clientes");t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◉</span> ${this.T("cliente")}s</h1>
      <button class="btn btn-primary btn-sm" onclick="App.showClienteForm()">+ Nuevo ${this.T("cliente")}</button>
    </div>

    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div style="flex:1;overflow:auto">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>NIF</th><th>Acciones</th></tr></thead>
            <tbody>
              ${e.length===0?`<tr><td colspan="3" style="text-align:center;padding:40px;color:var(--text-muted)">Sin ${this.T("cliente")}s</td></tr>`:e.map(a=>`
                  <tr>
                    <td>${this.escH(a.nombre)}</td>
                    <td class="text-mono">${this.escH(a.nif||"-")}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="App.editCliente('${a.id}')">Editar</button>
                      <button class="btn btn-danger btn-sm" onclick="App.deleteCliente('${a.id}')">Eliminar</button>
                    </td>
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `};n.showClienteForm=function(t=null){const a=`
    <div class="modal-overlay" onclick="this.remove()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>${!!t?"Editar":"Nuevo"} ${this.T("cliente")}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <form onsubmit="App.saveCliente(event, '${(t==null?void 0:t.id)||""}')">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" name="nombre" value="${(t==null?void 0:t.nombre)||""}" required>
          </div>
          <div class="form-group">
            <label>NIF</label>
            <input type="text" name="nif" value="${(t==null?void 0:t.nif)||""}">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `;document.body.insertAdjacentHTML("beforeend",a)};n.saveCliente=async function(t,e){t.preventDefault();const a=t.target,s={nombre:a.nombre.value,nif:a.nif.value};e?s.id=e:s.id=Date.now().toString(),await r.put("clientes",s),t.target.closest(".modal-overlay").remove(),this.renderClientes()};n.editCliente=async function(t){const e=await r.get("clientes",t);this.showClienteForm(e)};n.deleteCliente=async function(t){confirm("¿Eliminar cliente?")&&(await r.delete("clientes",t),this.renderClientes())};n.renderProductos=async function(){const t=document.getElementById("page-productos"),e=await r.getAll("productos"),a=await r.getAll("categorias");t.innerHTML=`
    <div class='flex items-center justify-between'>
      <h1 class='page-title'><span class='title-icon'>◈</span> ${this.T("producto")}s</h1>
      <button class='btn btn-primary btn-sm' onclick='App.showProductoForm()'>+ Nuevo ${this.T("producto")}</button>
    </div>

    <div class='card' style='flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0'>
      <div style='flex:1;overflow:auto'>
        <div class='table-wrap'>
          <table>
            <thead><tr><th>Icono</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
            <tbody>
              ${e.length===0?`<tr><td colspan='6' style='text-align:center;padding:40px;color:var(--text-muted)'>Sin ${this.T("producto")}s</td></tr>`:e.map(s=>{var i;return`
                  <tr>
                    <td>${s.icono||"📦"}</td>
                    <td>${this.escH(s.nombre)}</td>
                    <td>${((i=a.find(c=>c.id===s.categoria_id))==null?void 0:i.nombre)||"-"}</td>
                    <td class='text-mono'>${this.fmt(s.precio)}</td>
                    <td class='text-mono'>${s.stock||0} uds</td>
                    <td>
                      <button class='btn btn-secondary btn-sm' onclick='App.editProducto("${s.id}")'>Editar</button>
                      <button class='btn btn-danger btn-sm' onclick='App.deleteProducto("${s.id}")'>Eliminar</button>
                    </td>
                  </tr>`}).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `};n.showProductoForm=function(t=null){const a=`
    <div class='modal-overlay' onclick='this.remove()'>
      <div class='modal' onclick='event.stopPropagation()'>
        <div class='modal-header'>
          <h3>${!!t?"Editar":"Nuevo"} ${this.T("producto")}</h3>
          <button class='modal-close' onclick='this.closest(".modal-overlay").remove()'>×</button>
        </div>
        <form onsubmit='App.saveProducto(event, "${(t==null?void 0:t.id)||""}")'>
          <div class='form-row'>
            <div class='form-group'>
              <label>Icono / Emoji</label>
              <input type='text' name='icono' value='${(t==null?void 0:t.icono)||"📦"}' maxlength='4'>
            </div>
            <div class='form-group'>
              <label>Nombre</label>
              <input type='text' name='nombre' value='${(t==null?void 0:t.nombre)||""}' required>
            </div>
          </div>
          <div class='form-row'>
            <div class='form-group'>
              <label>Precio venta (€)</label>
              <input type='number' step='0.01' name='precio' value='${(t==null?void 0:t.precio)||""}' required>
            </div>
            <div class='form-group'>
              <label>Precio coste (€)</label>
              <input type='number' step='0.01' name='precio_costo' value='${(t==null?void 0:t.precio_costo)||""}'>
            </div>
          </div>
          <div class='form-row'>
            <div class='form-group'>
              <label>Categoría</label>
              <select name='categoria_id'>
                <option value=''>Sin categoría</option>
                ${(this.state.categorias||[]).map(s=>`<option value='${s.id}' ${(t==null?void 0:t.categoria_id)===s.id?"selected":""}>${s.nombre}</option>`).join("")}
              </select>
            </div>
            <div class='form-group'>
              <label>IVA %</label>
              <select name='iva'>
                <option value='21' ${(t==null?void 0:t.iva)==21?"selected":""}>21% (general)</option>
                <option value='10' ${(t==null?void 0:t.iva)==10?"selected":""}>10% (reducido)</option>
                <option value='4' ${(t==null?void 0:t.iva)==4?"selected":""}>4% (superreducido)</option>
                <option value='0' ${(t==null?void 0:t.iva)==0?"selected":""}>0% (exento)</option>
              </select>
            </div>
          </div>
          <div class='form-row'>
            <div class='form-group'>
              <label>Stock actual</label>
              <input type='number' name='stock' value='${(t==null?void 0:t.stock)||0}' min='0'>
            </div>
            <div class='form-group'>
              <label>Stock mínimo</label>
              <input type='number' name='stock_minimo' value='${(t==null?void 0:t.stock_minimo)||5}' min='0'>
            </div>
          </div>
          <div class='modal-actions'>
            <button type='button' class='btn btn-secondary' onclick='this.closest(".modal-overlay").remove()'>Cancelar</button>
            <button type='submit' class='btn btn-primary'>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `;document.body.insertAdjacentHTML("beforeend",a)};n.saveProducto=async function(t,e){t.preventDefault();const a=t.target,s={icono:a.icono.value||"📦",nombre:a.nombre.value,precio:parseFloat(a.precio.value),precio_costo:a.precio_costo.value?parseFloat(a.precio_costo.value):null,categoria_id:a.categoria_id.value||null,iva:parseInt(a.iva.value),stock:parseInt(a.stock.value)||0,stock_minimo:parseInt(a.stock_minimo.value)||5};e?s.id=e:s.id=Date.now().toString(),await r.put("productos",s),t.target.closest(".modal-overlay").remove(),this.renderProductos(),this.renderInventario()};n.editProducto=async function(t){const e=await r.get("productos",t);this.showProductoForm(e)};n.deleteProducto=async function(t){confirm("¿Eliminar producto?")&&(await r.delete("productos",t),this.renderProductos())};n.renderInventario=async function(){const t=document.getElementById("page-inventario"),e=await r.getAll("productos"),a=await r.getAll("categorias"),s=e.length,i=e.filter(o=>(o.stock||0)<=(o.stock_minimo||5)).length,c=e.filter(o=>(o.stock||0)===0).length,l=e.reduce((o,d)=>o+(d.stock||0)*(d.precio_costo||d.precio),0);t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">▦</span> ${this.T("inventario")}</h1>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm" onclick="App.exportarInventario()">Exportar CSV</button>
        <button class="btn btn-secondary btn-sm" onclick="App.renderInventario()">↻ Actualizar</button>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">Total productos</div>
        <div class="kpi-value">${s}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Stock bajo</div>
        <div class="kpi-value" style="color: var(--amber)">${i}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Agotados</div>
        <div class="kpi-value" style="color: var(--red)">${c}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Valor inventario</div>
        <div class="kpi-value">${this.fmt(l)}</div>
      </div>
    </div>

    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div class="card-header" style="padding:16px;border-bottom:1px solid var(--border)">
        <div style="display:flex;gap:12px;align-items:center">
          <input type="text" placeholder="Buscar productos..." id="inv-search" oninput="App.filtrarInventario()" style="flex:1;padding:8px;border:1px solid var(--border);border-radius:4px">
          <button class="btn btn-primary btn-sm" onclick="App.showProductoForm()">+ Nuevo producto</button>
        </div>
      </div>
      <div style="flex:1;overflow:auto">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Icono</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>P. Venta</th>
                <th>P. Coste</th>
                <th>Margen</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="inv-table-body">
              ${e.map(o=>{var g;const d=o.stock||0,v=o.stock_minimo||5,u=d===0?"stock-out":d<=v?"stock-low":"stock-ok",b=d===0?"Agotado":d<=v?`⚠ ${d}`:`${d} uds`,p=o.precio_costo&&o.precio?((o.precio-o.precio_costo)/o.precio*100).toFixed(1):"—",h=((g=a.find(y=>y.id===o.categoria_id))==null?void 0:g.nombre)||"—";return`
                  <tr>
                    <td style="font-size:22px">${o.icono||"📦"}</td>
                    <td><span class="td-name">${this.escH(o.nombre)}</span></td>
                    <td><span class="td-cat">${this.escH(h)}</span></td>
                    <td class="text-mono">${this.fmt(o.precio)}</td>
                    <td class="text-mono">${o.precio_costo?this.fmt(o.precio_costo):"—"}</td>
                    <td class="text-mono" style="color: ${p!=="—"&&parseFloat(p)>40?"var(--green)":p!=="—"&&parseFloat(p)>20?"var(--amber)":"var(--red)"}">${p!=="—"?p+"%":"—"}</td>
                    <td><span class="stock-badge ${u}">${b}</span></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="App.editProducto('${o.id}')">Editar</button>
                      <button class="btn btn-danger btn-sm" onclick="App.deleteProducto('${o.id}')">Eliminar</button>
                    </td>
                  </tr>
                `}).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `};n.filtrarInventario=function(){const t=document.getElementById("inv-search").value.toLowerCase();document.querySelectorAll("#inv-table-body tr").forEach(a=>{const s=a.textContent.toLowerCase();a.style.display=s.includes(t)?"":"none"})};n.exportarInventario=function(){alert("Exportar inventario CSV (Funcionalidad básica)")};n.renderVerifactu=function(){const t=document.getElementById("page-verifactu");t.innerHTML='<h1 class="page-title"><span class="title-icon">◎</span> VeriFactu</h1><p>Página en desarrollo</p>'};n.renderConfig=function(){const t=document.getElementById("page-config");t.innerHTML='<h1 class="page-title"><span class="title-icon">◌</span> Configuración</h1><p>Página en desarrollo</p>'};n.renderAdmin=function(){const t=document.getElementById("page-admin");t.innerHTML='<h1 class="page-title"><span class="title-icon">⚙</span> Admin</h1><p>Página en desarrollo</p>'};n.renderCaja=async function(){const t=document.getElementById("page-caja"),e=[{id:1,items:[{name:"Producto 1",qty:2,price:10}],total:20,method:"cash",time:"10:30"},{id:2,items:[{name:"Producto 2",qty:1,price:15}],total:15,method:"card",time:"11:00"}],a=e.reduce((o,d)=>o+d.total,0),s=e.filter(o=>o.method==="cash").reduce((o,d)=>o+d.total,0),i=e.filter(o=>o.method==="card").reduce((o,d)=>o+d.total,0),c=e.length?a/e.length:0,l=e.reduce((o,d)=>o+d.items.reduce((v,u)=>v+u.qty,0),0);t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">⬣</span> Caja</h1>
      <button class="btn btn-secondary btn-sm" onclick="App.cierreCaja()">⏹ Cierre de Caja</button>
    </div>

    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">Total vendido</div><div class="kpi-value accent">${this.fmt(a)}</div><div class="kpi-sub">${e.length} transacciones</div></div>
      <div class="kpi-card"><div class="kpi-label">Ticket medio</div><div class="kpi-value">${this.fmt(c)}</div><div class="kpi-sub">por venta</div></div>
      <div class="kpi-card"><div class="kpi-label">Unidades vendidas</div><div class="kpi-value">${l}</div><div class="kpi-sub">hoy</div></div>
      <div class="kpi-card"><div class="kpi-label">Efectivo</div><div class="kpi-value green">${this.fmt(s)}</div><div class="kpi-sub">${e.filter(o=>o.method==="cash").length} ventas</div></div>
      <div class="kpi-card"><div class="kpi-label">Tarjeta</div><div class="kpi-value blue">${this.fmt(i)}</div><div class="kpi-sub">${e.filter(o=>o.method==="card").length} ventas</div></div>
    </div>

    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div class="card-header" style="padding:16px;border-bottom:1px solid var(--border)">
        <div>Historial de Ventas</div>
      </div>
      <div style="flex:1;overflow:auto;padding:16px">
        ${e.length?e.map(o=>`
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
                <span>${o.time} · ${o.items.length} artículo${o.items.length!==1?"s":""}</span>
                <span>${o.method==="cash"?"💶 Efect.":"💳 Tarj."}</span>
                <span class="text-mono">${this.fmt(o.total)}</span>
              </div>
            `).join(""):'<div style="text-align:center;color:var(--text-muted);padding:40px">Sin ventas registradas hoy</div>'}
      </div>
    </div>

    <div class="card" style="padding:16px;margin-top:16px">
      <h3 style="margin-bottom:12px">Desglose</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between">
          <span>💶 Efectivo</span>
          <span class="text-mono green">${this.fmt(s)}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span>💳 Tarjeta</span>
          <span class="text-mono blue">${this.fmt(i)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px;margin-top:8px">
          <span style="font-weight:600">TOTAL</span>
          <span class="text-mono accent">${this.fmt(a)}</span>
        </div>
      </div>
    </div>
  `};n.cierreCaja=function(){confirm("¿Realizar cierre de caja? Se resetearán las ventas del día.")&&alert("Cierre de caja realizado (Funcionalidad básica)")};n.loadCatTabs=function(){const t=document.getElementById("cat-tabs");t&&(t.innerHTML=`<button class="cat-tab active" onclick="App.filtrarCat(this,'')">Todos</button>`+this.state.categorias.map(e=>`<button class="cat-tab" onclick="App.filtrarCat(this,'${e.id}')">${this.escH(e.nombre)}</button>`).join(""))};n.filtrarCat=function(t,e){document.querySelectorAll(".cat-tab").forEach(a=>a.classList.remove("active")),t.classList.add("active"),this.loadProductosGrid(e)};n.loadProductosGrid=function(t=""){const e=document.getElementById("productos-grid");if(!e)return;const a=t?this.state.productos.filter(s=>s.categoria_id===t):this.state.productos;if(a.length===0){e.innerHTML='<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">Sin productos</div></div>';return}e.innerHTML=a.map(s=>`
    <div class="producto-card" onclick="TPV.addLinea('${s.id}','${this.escH(s.nombre)}',${s.precio},${s.iva})">
      <div class="prod-nombre">${this.escH(s.nombre)}</div>
      <div class="prod-precio">${this.fmt(s.precio)}</div>
      ${s.categoria_color?`<div style="width:24px;height:3px;background:${s.categoria_color};border-radius:2px;margin:6px auto 0"></div>`:""}
    </div>
  `).join("")};n.renderFacturas=async function(){const t=document.getElementById("page-facturas"),e=await window.sirio.facturas.list(),a=e.filter(i=>i.estado!=="anulada").reduce((i,c)=>i+c.total,0),s=e.filter(i=>i.verifactu_estado==="pendiente"&&i.estado!=="anulada").length;t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◧</span> ${this.T("factura")}s emitidas</h1>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm" onclick="App.exportarFacturas()">Exportar CSV</button>
        <button class="btn btn-secondary btn-sm" onclick="App.renderFacturas()">↻ Actualizar</button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">Total facturado</div><div class="kpi-value">${this.fmt(a)}</div></div>
      <div class="kpi-card"><div class="kpi-label">${this.T("factura")}s emitidas</div><div class="kpi-value">${e.filter(i=>i.estado!=="anulada").length}</div></div>
      <div class="kpi-card"><div class="kpi-label">Pendientes VeriFactu</div><div class="kpi-value" style="color:${s>0?"var(--amber)":"var(--green)"}">${s}</div></div>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div class="card-header" style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <span class="card-title">Registro de ${this.T("factura")}s</span>
      </div>
      <div style="flex:1;overflow:auto">
        <div class="table-wrap" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Número</th><th>Fecha</th><th>${this.T("cliente")}</th><th>Base</th><th>IVA</th><th>Total</th><th>Estado</th><th>VeriFactu</th><th></th></tr></thead>
            <tbody>
              ${e.length===0?`<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">Sin ${this.T("factura")}s</td></tr>`:e.map(i=>`
                  <tr>
                    <td class="text-mono">${i.numero_completo}</td>
                    <td>${this.fmtDate(i.fecha)}</td>
                    <td>${this.escH(i.cliente_nombre)}</td>
                    <td class="text-mono">${this.fmt(i.base_imponible)}</td>
                    <td class="text-mono">${this.fmt(i.cuota_iva)}</td>
                    <td class="text-mono" style="font-weight:600">${this.fmt(i.total)}</td>
                    <td>${k(i.estado)}</td>
                    <td>${x(i.verifactu_estado)}</td>
                    <td>${i.verifactu_estado==="pendiente"&&i.estado!=="anulada"?`<button class="btn btn-secondary btn-sm" onclick="App.enviarVF('${i.id}')">Enviar</button>`:""}</td>
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `};n.enviarVF=async function(t){const e=await window.sirio.verifactu.enviar(t);alert(e.ok?"✓ Aceptada por AEAT":`✗ Error: ${e.error}`),n.renderFacturas(),n.updateVerifactuBadge()};n.exportarFacturas=async function(){const t=await window.sirio.facturas.exportar({});t&&alert(`Exportado en:
${t}`)};n.renderClientes=function(){var s,i;const t=document.getElementById("page-clientes"),e=this.state.clientes,a=((i=(s=this.perfil)==null?void 0:s.campos_extra)==null?void 0:i.cliente)??[];t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◉</span> ${this.T("cliente")}s</h1>
      <button class="btn btn-primary btn-sm" onclick="App.modalCliente()">+ Nuevo ${this.T("cliente")}</button>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div style="flex:1;overflow:auto">
        <div class="table-wrap" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Nombre</th><th>NIF/CIF</th><th>Email</th><th>Teléfono</th><th>Población</th>
              ${a.map(c=>`<th>${c.label}</th>`).join("")}
            </tr></thead>
            <tbody>
              ${e.length===0?`<tr><td colspan="${5+a.length}" style="text-align:center;padding:40px;color:var(--text-muted)">Sin ${this.T("cliente")}s</td></tr>`:e.map(c=>`
                  <tr>
                    <td style="font-weight:600">${this.escH(c.nombre)}</td>
                    <td class="text-mono">${c.nif??"—"}</td>
                    <td>${c.email??"—"}</td>
                    <td>${c.telefono??"—"}</td>
                    <td>${c.poblacion??"—"}</td>
                    ${a.map(()=>"<td>—</td>").join("")}
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `};n.modalCliente=function(){var a,s;const t=((s=(a=this.perfil)==null?void 0:a.campos_extra)==null?void 0:s.cliente)??[],e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
    <div class="modal">
      <div class="modal-title">◉ Nuevo ${this.T("cliente")}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="input-group" style="grid-column:1/-1"><label class="input-label">Nombre *</label><input class="input" id="c-nombre" placeholder="Nombre"/></div>
        <div class="input-group"><label class="input-label">NIF / CIF</label><input class="input" id="c-nif" placeholder="B00000000"/></div>
        <div class="input-group"><label class="input-label">Email</label><input class="input" id="c-email" type="email"/></div>
        <div class="input-group"><label class="input-label">Teléfono</label><input class="input" id="c-tel"/></div>
        <div class="input-group"><label class="input-label">CP</label><input class="input" id="c-cp"/></div>
        <div class="input-group"><label class="input-label">Dirección</label><input class="input" id="c-dir"/></div>
        <div class="input-group"><label class="input-label">Población</label><input class="input" id="c-pob"/></div>
        <div class="input-group"><label class="input-label">Provincia</label><input class="input" id="c-prov"/></div>
        ${t.map(i=>`
          <div class="input-group">
            <label class="input-label">${i.label}</label>
            <input class="input" id="cex-${i.clave}" placeholder="${i.label}" ${i.obligatorio?"required":""}/>
          </div>
        `).join("")}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="App._guardarCliente()">Guardar</button>
      </div>
    </div>
  `,document.body.appendChild(e)};n._guardarCliente=async function(){var e,a,s,i,c,l,o,d,v,u;const t=(a=(e=document.getElementById("c-nombre"))==null?void 0:e.value)==null?void 0:a.trim();if(!t)return alert("El nombre es obligatorio");await window.sirio.clientes.create({nombre:t,nif:((s=document.getElementById("c-nif"))==null?void 0:s.value)||null,email:((i=document.getElementById("c-email"))==null?void 0:i.value)||null,telefono:((c=document.getElementById("c-tel"))==null?void 0:c.value)||null,cp:((l=document.getElementById("c-cp"))==null?void 0:l.value)||null,direccion:((o=document.getElementById("c-dir"))==null?void 0:o.value)||null,poblacion:((d=document.getElementById("c-pob"))==null?void 0:d.value)||null,provincia:((v=document.getElementById("c-prov"))==null?void 0:v.value)||null}),(u=document.querySelector(".modal-overlay"))==null||u.remove(),n.state.clientes=await window.sirio.clientes.list(),n.renderClientes()};n.renderProductos=function(){const t=document.getElementById("page-productos"),e=this.state.productos;t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◈</span> ${this.T("producto")}s</h1>
      <button class="btn btn-primary btn-sm" onclick="App.modalProducto()">+ Nuevo ${this.T("producto")}</button>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div style="flex:1;overflow:auto">
        <div class="table-wrap" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Nombre</th><th>${this.T("categoria")}</th><th>Precio</th><th>IVA</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              ${e.length===0?`<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Sin ${this.T("producto")}s</td></tr>`:e.map(a=>`
                  <tr>
                    <td style="font-weight:600">${this.escH(a.nombre)}</td>
                    <td>${a.categoria_nombre?`<span class="badge" style="background:${a.categoria_color}22;color:${a.categoria_color}">${this.escH(a.categoria_nombre)}</span>`:"—"}</td>
                    <td class="text-mono" style="color:var(--accent-bright)">${this.fmt(a.precio)}</td>
                    <td class="text-mono">${a.iva}%</td>
                    <td>${a.controlar_stock?`<span class="text-mono" style="color:${a.stock_actual<=0?"var(--red)":a.stock_actual<=a.stock_minimo?"var(--amber)":"var(--green)"}">${a.stock_actual}</span>`:'<span style="color:var(--text-muted)">—</span>'}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="App.eliminarProducto('${a.id}')">Eliminar</button></td>
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `};n.modalProducto=function(){var e,a,s;const t=document.createElement("div");t.className="modal-overlay",t.innerHTML=`
    <div class="modal">
      <div class="modal-title">◈ Nuevo ${this.T("producto")}</div>
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
        <div class="input-group"><label class="input-label">${this.T("categoria")}</label>
          <select class="input" id="p-cat">
            <option value="">Sin ${this.T("categoria")}</option>
            ${this.state.categorias.map(i=>`<option value="${i.id}">${this.escH(i.nombre)}</option>`).join("")}
          </select>
        </div>
        <div class="input-group"><label class="input-label">Código</label><input class="input" id="p-codigo"/></div>
        ${(s=(a=(e=this.perfil)==null?void 0:e.modulos)==null?void 0:a.inventario)!=null&&s.activo?`
        <div class="input-group" style="grid-column:1/-1">
          <label class="input-label">Control de stock</label>
          <select class="input" id="p-stock">
            <option value="0">No controlar</option>
            <option value="1">Controlar stock</option>
          </select>
        </div>
        <div class="input-group"><label class="input-label">Stock inicial</label><input class="input" id="p-stockval" type="number" value="0"/></div>
        <div class="input-group"><label class="input-label">Stock mínimo</label><input class="input" id="p-stockmin" type="number" value="0"/></div>
        `:""}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="App._guardarProducto()">Guardar</button>
      </div>
    </div>
  `,document.body.appendChild(t)};n._guardarProducto=async function(){var s,i,c,l,o,d,v,u,b,p;const t=(i=(s=document.getElementById("p-nombre"))==null?void 0:s.value)==null?void 0:i.trim(),e=parseFloat((c=document.getElementById("p-precio"))==null?void 0:c.value);if(!t||isNaN(e))return alert("Nombre y precio son obligatorios");const a=await window.sirio.productos.create({nombre:t,precio:e,iva:parseFloat(((l=document.getElementById("p-iva"))==null?void 0:l.value)??21),categoria_id:((o=document.getElementById("p-cat"))==null?void 0:o.value)||null,codigo:((d=document.getElementById("p-codigo"))==null?void 0:d.value)||null});((v=document.getElementById("p-stock"))==null?void 0:v.value)==="1"&&await window.sirio.inventario.configurarStock(a.id,{controlarStock:!0,stockMinimo:parseFloat(((u=document.getElementById("p-stockmin"))==null?void 0:u.value)??0),stockInicial:parseFloat(((b=document.getElementById("p-stockval"))==null?void 0:b.value)??0)}),(p=document.querySelector(".modal-overlay"))==null||p.remove(),n.state.productos=await window.sirio.productos.list(),n.renderProductos(),n.renderTPV()};n.eliminarProducto=async function(t){confirm("¿Eliminar este producto?")&&(await window.sirio.productos.delete(t),n.state.productos=await window.sirio.productos.list(),n.renderProductos(),n.renderTPV())};n.renderInventario=async function(){const t=document.getElementById("page-inventario"),e=await window.sirio.inventario.listStock(),a=await window.sirio.inventario.getValoracion(),s=e.filter(i=>i.estado_stock!=="ok");t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">▦</span> ${this.T("inventario")}</h1>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm" onclick="App.renderInventario()">↻ Actualizar</button>
        <button class="btn btn-primary btn-sm" onclick="App.modalMovimiento()">+ Movimiento</button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">Referencias controladas</div><div class="kpi-value">${(a==null?void 0:a.referencias_controladas)??0}</div></div>
      <div class="kpi-card"><div class="kpi-label">Valor en stock</div><div class="kpi-value">${this.fmt((a==null?void 0:a.valor_stock)??0)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Bajo mínimo</div><div class="kpi-value" style="color:${((a==null?void 0:a.bajo_minimo)??0)>0?"var(--amber)":"var(--green)"}">${(a==null?void 0:a.bajo_minimo)??0}</div></div>
      <div class="kpi-card"><div class="kpi-label">Agotados</div><div class="kpi-value" style="color:${((a==null?void 0:a.agotados)??0)>0?"var(--red)":"var(--green)"}">${(a==null?void 0:a.agotados)??0}</div></div>
    </div>
    ${s.length>0?`
    <div class="card" style="border-color:rgba(212,135,42,.3)">
      <div class="card-header"><span class="card-title" style="color:var(--amber)">⚠ Alertas de stock</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Producto</th><th>Stock actual</th><th>Mínimo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            ${s.map(i=>`
              <tr>
                <td style="font-weight:600">${this.escH(i.nombre)}</td>
                <td class="text-mono" style="color:${i.stock_actual<=0?"var(--red)":"var(--amber)"}">${i.stock_actual}</td>
                <td class="text-mono">${i.stock_minimo}</td>
                <td>${i.estado_stock==="agotado"?'<span class="badge badge-red">Agotado</span>':'<span class="badge badge-amber">Bajo mínimo</span>'}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="App.modalMovimiento('${i.id}','${this.escH(i.nombre)}')">Entrada</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>`:""}
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
      <div class="card-header" style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <span class="card-title">Stock completo</span>
      </div>
      <div style="flex:1;overflow:auto">
        <div class="table-wrap" style="border:none;border-radius:0">
          <table>
            <thead><tr><th>Producto</th><th>${this.T("categoria")}</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Valor</th><th></th></tr></thead>
            <tbody>
              ${e.map(i=>{const c=i.stock_minimo>0?Math.min(100,i.stock_actual/(i.stock_minimo*2)*100):100;return`
                <tr>
                  <td style="font-weight:600">${this.escH(i.nombre)}</td>
                  <td>${i.categoria_nombre?`<span style="color:${i.categoria_color}">${this.escH(i.categoria_nombre)}</span>`:"—"}</td>
                  <td class="text-mono">
                    ${i.controlar_stock?`<div class="flex items-center gap-8">
                          <span style="color:${i.stock_actual<=0?"var(--red)":i.stock_actual<=i.stock_minimo?"var(--amber)":"var(--green)"}">
                            ${i.stock_actual}
                          </span>
                          <div class="stock-bar-wrap">
                            <div class="stock-bar ${i.estado_stock}" style="width:${c}%"></div>
                          </div>
                        </div>`:'<span style="color:var(--text-muted)">No controlado</span>'}
                  </td>
                  <td class="text-mono">${i.controlar_stock?i.stock_minimo:"—"}</td>
                  <td>${i.controlar_stock?i.estado_stock==="ok"?'<span class="badge badge-green">OK</span>':i.estado_stock==="bajo"?'<span class="badge badge-amber">Bajo</span>':'<span class="badge badge-red">Agotado</span>':"—"}</td>
                  <td class="text-mono">${i.controlar_stock?this.fmt(i.stock_actual*i.precio):"—"}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="App.modalMovimiento('${i.id}','${this.escH(i.nombre)}')">Mov.</button>
                  </td>
                </tr>`}).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `};n.modalMovimiento=function(t="",e=""){const a=document.createElement("div");a.className="modal-overlay",a.innerHTML=`
    <div class="modal">
      <div class="modal-title">▦ Registrar movimiento</div>
      ${t?`<div style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);padding:8px;background:var(--bg-hover);border-radius:var(--radius)">${e}</div>`:`
      <div class="input-group">
        <label class="input-label">Producto</label>
        <select class="input" id="mv-prod">
          <option value="">— Selecciona —</option>
          ${n.state.productos.filter(s=>s.controlar_stock).map(s=>`<option value="${s.id}">${n.escH(s.nombre)}</option>`).join("")}
        </select>
      </div>`}
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
        <button class="btn btn-primary" onclick="App._guardarMovimiento('${t}')">Registrar</button>
      </div>
    </div>
  `,document.body.appendChild(a)};n._guardarMovimiento=async function(t){var c,l,o,d,v;const e=t||((c=document.getElementById("mv-prod"))==null?void 0:c.value);if(!e)return alert("Selecciona un producto");const a=(l=document.getElementById("mv-tipo"))==null?void 0:l.value,s=parseFloat(((o=document.getElementById("mv-cant"))==null?void 0:o.value)??0),i=(d=document.getElementById("mv-motivo"))==null?void 0:d.value;await window.sirio.inventario.registrarMovimiento({productoId:e,tipo:a,cantidad:s,motivo:i}),(v=document.querySelector(".modal-overlay"))==null||v.remove(),n.state.productos=await window.sirio.productos.list(),n.renderInventario(),n.renderProductos()};n.renderVerifactu=async function(){var s;const t=document.getElementById("page-verifactu"),e=await window.sirio.verifactu.status(),a=await window.sirio.verifactu.pendientes();t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon">◎</span> VeriFactu — AEAT</h1>
      <button class="btn btn-primary btn-sm" onclick="App.sincronizarVF()">↻ Sincronizar</button>
    </div>
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">Estado</div>
        <div class="kpi-value" style="color:${e.activo?"var(--green)":"var(--red)"}">
          ${e.activo?"ACTIVO":"INACTIVO"}
        </div>
        <div class="kpi-sub">Modo: ${((s=e.modo)==null?void 0:s.toUpperCase())??"—"}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Pendientes</div>
        <div class="kpi-value" style="color:${e.pendientes>0?"var(--amber)":"var(--green)"}">${e.pendientes}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Último envío</div>
        <div class="kpi-value" style="font-size:16px">${e.ultimoEnvio?this.fmtDate(e.ultimoEnvio):"—"}</div>
        ${e.ultimoError?`<div class="kpi-sub" style="color:var(--red)">${this.escH(e.ultimoError)}</div>`:""}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Facturas pendientes (${a.length})</span></div>
      ${a.length===0?'<div class="empty-state" style="padding:30px"><div class="empty-icon">◎</div><div class="empty-text">Todas sincronizadas</div></div>':`<div class="table-wrap"><table>
            <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Total</th><th></th></tr></thead>
            <tbody>
              ${a.map(i=>`
                <tr>
                  <td class="text-mono">${i.numero_completo}</td>
                  <td>${this.fmtDate(i.fecha)}</td>
                  <td>${this.escH(i.cliente_nombre)}</td>
                  <td class="text-mono">${this.fmt(i.total)}</td>
                  <td><button class="btn btn-success btn-sm" onclick="App.enviarVF('${i.id}')">Enviar</button></td>
                </tr>`).join("")}
            </tbody>
          </table></div>`}
    </div>
  `};n.sincronizarVF=async function(){const t=await window.sirio.verifactu.sincronizar();alert(`Sincronizadas: ${t.total}
Aceptadas: ${t.resultados.filter(e=>e.ok).length}
Errores: ${t.resultados.filter(e=>!e.ok).length}`),n.renderVerifactu(),n.updateVerifactuBadge()};n.renderConfig=async function(){const t=document.getElementById("page-config"),e=await window.sirio.config.getAll();t.innerHTML=`
    <h1 class="page-title"><span class="title-icon">◌</span> Configuración</h1>
    <div class="card">
      <div class="card-header"><span class="card-title">Datos de la empresa</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${m("Nombre / Razón social","empresa_nombre",e.empresa_nombre)}
        ${m("NIF / CIF","empresa_nif",e.empresa_nif)}
        ${m("Dirección","empresa_direccion",e.empresa_direccion)}
        ${m("CP","empresa_cp",e.empresa_cp)}
        ${m("Población","empresa_poblacion",e.empresa_poblacion)}
        ${m("Provincia","empresa_provincia",e.empresa_provincia)}
        ${m("Teléfono","empresa_telefono",e.empresa_telefono)}
        ${m("Email","empresa_email",e.empresa_email)}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">VeriFactu — AEAT</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="input-group">
          <label class="input-label">Estado</label>
          <select class="input" id="cfg-verifactu_activo">
            <option value="0" ${e.verifactu_activo!=="1"?"selected":""}>Desactivado</option>
            <option value="1" ${e.verifactu_activo==="1"?"selected":""}>Activado</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Modo</label>
          <select class="input" id="cfg-verifactu_modo">
            <option value="pruebas" ${e.verifactu_modo!=="produccion"?"selected":""}>Pruebas</option>
            <option value="produccion" ${e.verifactu_modo==="produccion"?"selected":""}>Producción</option>
          </select>
        </div>
        ${m("Certificado (.pfx/.p12)","verifactu_certificado_path",e.verifactu_certificado_path)}
        ${m("Contraseña certificado","verifactu_certificado_pass",e.verifactu_certificado_pass,"password")}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">TPV</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${m("Pie de ticket","ticket_pie",e.ticket_pie)}
        <div class="input-group">
          <label class="input-label">IVA por defecto</label>
          <select class="input" id="cfg-iva_defecto">
            <option value="21" ${e.iva_defecto==="21"?"selected":""}>21%</option>
            <option value="10" ${e.iva_defecto==="10"?"selected":""}>10%</option>
            <option value="4"  ${e.iva_defecto==="4"?"selected":""}>4%</option>
          </select>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:12px">
      <button class="btn btn-primary btn-lg" onclick="App._guardarConfig()">Guardar configuración</button>
    </div>
  `};function m(t,e,a,s="text"){return`<div class="input-group"><label class="input-label">${t}</label><input class="input" id="cfg-${e}" type="${s}" value="${n.escH(a??"")}"/></div>`}n._guardarConfig=async function(){const t=["empresa_nombre","empresa_nif","empresa_direccion","empresa_cp","empresa_poblacion","empresa_provincia","empresa_telefono","empresa_email","verifactu_activo","verifactu_modo","verifactu_certificado_path","verifactu_certificado_pass","ticket_pie","iva_defecto"];for(const e of t){const a=document.getElementById(`cfg-${e}`);a&&await window.sirio.config.set(e,a.value)}n.state.config=await window.sirio.config.getAll(),alert("✓ Configuración guardada"),n.updateVerifactuBadge()};n.renderAdmin=async function(){var s,i,c,l;const t=document.getElementById("page-admin"),e=await window.sirio.admin.info(),a=e.perfil;t.innerHTML=`
    <div class="flex items-center justify-between">
      <h1 class="page-title"><span class="title-icon" style="color:var(--amber)">⚙</span> Panel Administración</h1>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">Acceso: ${((s=a==null?void 0:a.admin)==null?void 0:s.atajo_teclado)??"F12"}</div>
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
        ${f("Versión",e.version)}
        ${f("Plataforma",e.platform)}
        ${f("Node",e.nodeVersion)}
        ${f("Datos",e.dataPath)}
        ${f("Negocio",((i=a==null?void 0:a.negocio)==null?void 0:i.nombre)??"—")}
        ${f("Tipo",(a==null?void 0:a._plantilla)??"—")}
        ${f("Módulos activos",Object.entries((a==null?void 0:a.modulos)??{}).filter(([,o])=>o.activo).map(([o])=>o).join(", "))}
        ${f("Licencia",((c=a==null?void 0:a.licencia)==null?void 0:c.plan)??"—")}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Perfil activo — perfil.json</span>
        <button class="btn btn-secondary btn-sm" onclick="App.adminEditarPerfil()">Editar</button>
      </div>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);line-height:1.8">
        Plantilla: <strong>${(a==null?void 0:a._plantilla)??"generico"}</strong> ·
        Versión: <strong>${(a==null?void 0:a._version)??"1.0"}</strong> ·
        Firma: <strong>${((l=a==null?void 0:a._firma)==null?void 0:l.slice(0,16))??"—"}...</strong>
      </div>
    </div>
  `};function f(t,e){return`<div style="padding:8px;background:var(--bg-hover);border-radius:var(--radius-sm)">
    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1px;margin-bottom:4px">${t}</div>
    <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-primary);word-break:break-all">${n.escH(e)||"—"}</div>
  </div>`}n.adminBackup=async function(){const t=await window.sirio.admin.backup();t&&alert(`✓ Backup guardado en:
${t}`)};n.adminRestore=async function(){confirm(`¿Restaurar backup?
Se reiniciará la aplicación.`)&&await window.sirio.admin.restore()};n.adminLogs=async function(){const t=await window.sirio.admin.getLogs(),e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
    <div class="modal" style="max-width:700px">
      <div class="modal-title">📋 Log VeriFactu</div>
      <div class="log-list">
        ${t.length===0?'<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:11px">Sin entradas en el log</div>':t.map(a=>`<div class="log-line">${n.escH(a)}</div>`).join("")}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
      </div>
    </div>
  `,document.body.appendChild(e)};n.adminEditarPerfil=function(){alert(`Para editar el perfil de forma avanzada,
modifica perfil.json en el directorio de instalación
y reinicia Sirio.`)};function k(t){const e={emitida:["badge-green","● Emitida"],anulada:["badge-red","✕ Anulada"],rectificativa:["badge-amber","↺ Rectificativa"]},[a,s]=e[t]??["badge-muted",t];return`<span class="badge ${a}">${s}</span>`}function x(t){const e={pendiente:["badge-amber","○ Pendiente"],enviando:["badge-accent","↑ Enviando"],aceptada:["badge-green","✓ Aceptada"],rechazada:["badge-red","✕ Rechazada"]},[a,s]=e[t]??["badge-muted",t??"—"];return`<span class="badge ${a}">${s}</span>`}document.addEventListener("DOMContentLoaded",()=>n.init());window.App=n;n.init();
