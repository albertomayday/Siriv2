/**
 * MÓDULO VERIFACTU
 * Cumplimiento RD 1007/2023 - Sistema de Verificación de Facturas
 * Especificación técnica AEAT v1.0
 */

const crypto = require('crypto')
const { create: xmlCreate } = require('xml2js')
const axios = require('axios')
const db = require('./database')

// ─── Endpoints AEAT ───────────────────────────────────────────────────────────
const ENDPOINTS = {
  produccion: 'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
  pruebas:    'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP'
}

// ─── Estado del módulo ────────────────────────────────────────────────────────
let _status = {
  activo: false,
  modo: 'pruebas',
  ultimoEnvio: null,
  ultimoError: null,
  pendientes: 0
}

// ─── Inicialización ───────────────────────────────────────────────────────────
async function init() {
  const cfg = db.config.getAll()
  _status.activo = cfg.verifactu_activo === '1'
  _status.modo = cfg.verifactu_modo ?? 'pruebas'
}

// ─── Obtener estado ───────────────────────────────────────────────────────────
function getStatus() {
  const pendientes = db.facturas.list({ verifactu_estado: 'pendiente' })
    .filter(f => f.estado !== 'anulada')
  _status.pendientes = pendientes.length
  return { ..._status }
}

// ─── Obtener pendientes ───────────────────────────────────────────────────────
function getPendientes() {
  return db.facturas.list({ verifactu_estado: 'pendiente' })
    .filter(f => f.estado !== 'anulada')
}

// ─── Generar hash encadenado ──────────────────────────────────────────────────
function generarHash(factura, hashAnterior) {
  const cfg = db.config.getAll()

  // Campos para el hash según especificación AEAT
  const campos = [
    cfg.empresa_nif,
    factura.numero_completo,
    factura.fecha,
    factura.total.toFixed(2),
    hashAnterior ?? ''
  ].join('&')

  return crypto.createHash('sha256').update(campos, 'utf8').digest('hex').toUpperCase()
}

// ─── Obtener hash de la factura anterior ─────────────────────────────────────
function getHashAnterior(serieId) {
  const ultima = db.facturas.list({}).find(f =>
    f.serie_id === serieId &&
    f.verifactu_hash &&
    f.estado !== 'anulada'
  )
  return ultima?.verifactu_hash ?? null
}

// ─── Construir XML SOAP para AEAT ─────────────────────────────────────────────
function buildSoapXML(factura, hash, cfg) {
  const fecha = factura.fecha.slice(0, 10)
  const hora = factura.fecha.slice(11, 19) || '00:00:00'

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:sum="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SistemaFacturacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <sum:RegFactuSistemaFacturacion>
      <sum:Cabecera>
        <sum:ObligadoEmision>
          <sum:NombreRazon>${escapeXml(cfg.empresa_nombre)}</sum:NombreRazon>
          <sum:NIF>${escapeXml(cfg.empresa_nif)}</sum:NIF>
        </sum:ObligadoEmision>
      </sum:Cabecera>
      <sum:RegistroFactura>
        <sum:RegistroAlta>
          <sum:IDVersion>1.0</sum:IDVersion>
          <sum:IDFactura>
            <sum:IDEmisorFactura>${escapeXml(cfg.empresa_nif)}</sum:IDEmisorFactura>
            <sum:NumSerieFactura>${escapeXml(factura.numero_completo)}</sum:NumSerieFactura>
            <sum:FechaExpedicionFactura>${fecha}</sum:FechaExpedicionFactura>
          </sum:IDFactura>
          <sum:NombreRazonEmisor>${escapeXml(cfg.empresa_nombre)}</sum:NombreRazonEmisor>
          <sum:TipoFactura>${factura.estado === 'rectificativa' ? 'R1' : 'F1'}</sum:TipoFactura>
          <sum:DescripcionOperacion>${escapeXml(factura.observaciones || 'Venta')}</sum:DescripcionOperacion>
          <sum:Desglose>
            <sum:DetalleDesglose>
              <sum:Impuesto>01</sum:Impuesto>
              <sum:ClaveRegimen>01</sum:ClaveRegimen>
              <sum:CalificacionOperacion>S1</sum:CalificacionOperacion>
              <sum:TipoImpositivo>${calcularTipoIVA(factura)}</sum:TipoImpositivo>
              <sum:BaseImponibleOImporteNoSujeto>${factura.base_imponible.toFixed(2)}</sum:BaseImponibleOImporteNoSujeto>
              <sum:CuotaRepercutida>${factura.cuota_iva.toFixed(2)}</sum:CuotaRepercutida>
            </sum:DetalleDesglose>
          </sum:Desglose>
          <sum:CuotaTotal>${factura.cuota_iva.toFixed(2)}</sum:CuotaTotal>
          <sum:ImporteTotal>${factura.total.toFixed(2)}</sum:ImporteTotal>
          <sum:Huella>${hash}</sum:Huella>
          <sum:FechaHoraHuella>${fecha}T${hora}</sum:FechaHoraHuella>
          <sum:SistemaInformatico>
            <sum:NombreRazon>Sirio TPV</sum:NombreRazon>
            <sum:NIF>B00000000</sum:NIF>
            <sum:NombreSistemaInformatico>Sirio</sum:NombreSistemaInformatico>
            <sum:Version>1.0</sum:Version>
            <sum:NumeroInstalacion>SIRIO-001</sum:NumeroInstalacion>
            <sum:TipoUsoPosibleSoloVerifactu>S</sum:TipoUsoPosibleSoloVerifactu>
            <sum:TipoUsoPosibleMultiOT>N</sum:TipoUsoPosibleMultiOT>
            <sum:IndicadorMultiplesOT>N</sum:IndicadorMultiplesOT>
          </sum:SistemaInformatico>
        </sum:RegistroAlta>
      </sum:RegistroFactura>
    </sum:RegFactuSistemaFacturacion>
  </soapenv:Body>
</soapenv:Envelope>`
}

// ─── Calcular tipo IVA predominante ──────────────────────────────────────────
function calcularTipoIVA(factura) {
  if (factura.base_imponible === 0) return '0.00'
  const tipo = (factura.cuota_iva / factura.base_imponible) * 100
  return tipo.toFixed(2)
}

// ─── Escapar XML ─────────────────────────────────────────────────────────────
function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ─── Generar QR VeriFactu ─────────────────────────────────────────────────────
function generarQR(factura, hash, cfg) {
  const params = new URLSearchParams({
    nif: cfg.empresa_nif,
    numserie: factura.numero_completo,
    fecha: factura.fecha.slice(0, 10),
    importe: factura.total.toFixed(2),
    huella: hash.slice(0, 8)  // Primeros 8 caracteres del hash
  })
  return `https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/VerificacionFactura?${params.toString()}`
}

// ─── Enviar factura a AEAT ────────────────────────────────────────────────────
async function enviarFactura(facturaId) {
  const cfg = db.config.getAll()

  if (cfg.verifactu_activo !== '1') {
    return { ok: false, error: 'VeriFactu no está activado en la configuración' }
  }

  const factura = db.facturas.get(facturaId)
  if (!factura) return { ok: false, error: 'Factura no encontrada' }
  if (factura.verifactu_estado === 'aceptada') {
    return { ok: true, mensaje: 'Factura ya enviada y aceptada' }
  }

  try {
    // Generar hash encadenado
    const hashAnterior = getHashAnterior(factura.serie_id)
    const hash = generarHash(factura, hashAnterior)
    const qrUrl = generarQR(factura, hash, cfg)

    // Construir payload XML
    const xml = buildSoapXML(factura, hash, cfg)

    // Marcar como en proceso
    db.facturas.updateVerifactu(facturaId, {
      verifactu_hash: hash,
      verifactu_qr: qrUrl,
      verifactu_estado: 'enviando',
      verifactu_fecha_envio: new Date().toISOString()
    })

    db.verifactuLog.add(facturaId, 'envio_inicio', xml, null, 'enviando')

    // Enviar a AEAT
    const endpoint = ENDPOINTS[cfg.verifactu_modo] || ENDPOINTS.pruebas
    const response = await axios.post(endpoint, xml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'RegFactuSistemaFacturacion'
      },
      timeout: 30000
    })

    // Procesar respuesta
    const respuestaXml = response.data
    const aceptada = respuestaXml.includes('<sum:EstadoRegistro>Correcto</sum:EstadoRegistro>')
    const estado = aceptada ? 'aceptada' : 'rechazada'

    db.facturas.updateVerifactu(facturaId, {
      verifactu_estado: estado,
      verifactu_respuesta: respuestaXml.slice(0, 2000)
    })

    db.verifactuLog.add(facturaId, 'envio_respuesta', null, respuestaXml, estado)

    _status.ultimoEnvio = new Date().toISOString()
    _status.ultimoError = aceptada ? null : 'Rechazada por AEAT'

    return { ok: aceptada, estado, hash, qrUrl }

  } catch (err) {
    const errorMsg = err.message || 'Error desconocido'

    db.facturas.updateVerifactu(facturaId, {
      verifactu_estado: 'pendiente',  // Vuelve a pendiente para reintento
      verifactu_respuesta: errorMsg
    })

    db.verifactuLog.add(facturaId, 'envio_error', null, errorMsg, 'error')
    _status.ultimoError = errorMsg

    return { ok: false, error: errorMsg }
  }
}

// ─── Sincronizar todas las pendientes ────────────────────────────────────────
async function sincronizarPendientes() {
  const pendientes = getPendientes()
  const resultados = []

  for (const factura of pendientes) {
    const resultado = await enviarFactura(factura.id)
    resultados.push({ id: factura.id, numero: factura.numero_completo, ...resultado })

    // Pausa entre envíos para no saturar el servicio AEAT
    await new Promise(r => setTimeout(r, 500))
  }

  return { total: pendientes.length, resultados }
}

module.exports = {
  init,
  getStatus,
  getPendientes,
  enviarFactura,
  sincronizarPendientes,
  generarHash,
  generarQR
}
