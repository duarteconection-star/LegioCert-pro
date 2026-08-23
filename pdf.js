/**
 * LegioCert Pro - Generador de Certificados PDF
 * PDF profesional con datos completos, fotos, firmas y QR
 */

const PDFModule = (() => {

  const generarCertificado = async (tratamientoId) => {
    App.toast('Generando certificado…', 'info');

    const trat = await DB.getById('tratamientos', tratamientoId);
    if (!trat) { App.toast('Tratamiento no encontrado', 'error'); return; }

    const cliente = trat.clienteId ? await DB.getById('clientes', trat.clienteId) : null;
    const instalacion = trat.instalacionId ? await DB.getById('instalaciones', trat.instalacionId) : null;
    const numeroCert = await DB.nextCertNumber();

    // Guardar certificado
    const certId = await DB.add('certificados', {
      tratamientoId,
      numero: numeroCert,
      fecha: new Date().toISOString(),
      clienteId: trat.clienteId,
      instalacionId: trat.instalacionId,
    });

    // Generar QR en base64 (usando canvas)
    const qrData = `LegioCert:${numeroCert}|Fecha:${trat.fecha}|Cliente:${cliente?.nombre || ''}`;
    const qrBase64 = generarQRSimple(qrData);

    // Abrir ventana de impresión/PDF
    const htmlContent = buildCertHTML(numeroCert, trat, cliente, instalacion, qrBase64);
    abrirVentanaPDF(htmlContent, numeroCert);

    App.toast(`Certificado ${numeroCert} generado`, 'success');
    App.refreshDashboard();
    App.navigate('historial');
  };

  const buildCertHTML = (numero, trat, cliente, instalacion, qrBase64) => {
    const fecha = trat.fecha ? new Date(trat.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
    const horaIni = trat.horaInicio || '—';
    const horaFin = trat.horaFin || '—';
    const dur = trat.duracionSegundos ? formatDuration(trat.duracionSegundos) : '—';

    const tipoNorm = {
      RD487: CONFIG.NORMATIVA.RD_487,
      RD614: CONFIG.NORMATIVA.RD_614,
      UNE: CONFIG.NORMATIVA.UNE,
    }[trat.normativa] || trat.normativa || '—';

    const fotosHTML = buildFotosHTML(trat.fotos);
    const firmasHTML = buildFirmasHTML(trat.firmaTecnico, trat.firmaCliente);
    const gpsHTML = trat.gps ? `
      <tr><td>Latitud / Longitud</td><td>${trat.gps.latitude?.toFixed(6)} / ${trat.gps.longitude?.toFixed(6)}</td></tr>
      <tr><td>Dirección</td><td>${trat.gps.direccion || '—'}</td></tr>
    ` : '';

    const costes = calcularCostesResumen(trat);

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Certificado ${numero}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a1a2e; background:#fff; }
  .cert-page { max-width: 210mm; margin: 0 auto; padding: 15mm; }
  
  /* CABECERA */
  .cert-header { display:flex; justify-content:space-between; align-items:flex-start; 
    border-bottom: 3px solid #0A2342; padding-bottom: 12px; margin-bottom: 16px; }
  .cert-logo { font-size: 22pt; font-weight: 900; color: #0A2342; letter-spacing: -1px; }
  .cert-logo span { color: #00BCD4; }
  .cert-empresa { font-size: 8pt; color: #666; margin-top: 4px; }
  .cert-numero { text-align: right; }
  .cert-numero .num { font-size: 14pt; font-weight: 700; color: #0A2342; }
  .cert-numero .tipo { font-size: 9pt; color: #00BCD4; text-transform: uppercase; letter-spacing: 1px; }
  .cert-numero .fecha-em { font-size: 8pt; color: #666; }
  
  /* TÍTULO */
  .cert-titulo { background: linear-gradient(135deg, #0A2342 0%, #1565C0 100%);
    color: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
  .cert-titulo h1 { font-size: 14pt; font-weight: 700; }
  .cert-titulo .normativa { font-size: 8pt; opacity: 0.85; margin-top: 4px; }
  
  /* SECCIONES */
  .cert-section { margin-bottom: 16px; }
  .cert-section h2 { font-size: 10pt; font-weight: 700; color: #0A2342; 
    border-left: 4px solid #00BCD4; padding-left: 8px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 8px; border-bottom: 1px solid #e8edf2; font-size: 9.5pt; vertical-align: top; }
  td:first-child { width: 42%; color: #555; font-weight: 500; }
  td:last-child { color: #1a1a2e; }
  tr:hover td { background: #f8fafc; }
  
  /* PARÁMETROS */
  .params-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .param-box { background: #f0f4f8; border-radius: 6px; padding: 10px; text-align: center; }
  .param-box .param-label { font-size: 7.5pt; color: #666; text-transform: uppercase; }
  .param-box .param-value { font-size: 14pt; font-weight: 700; color: #0A2342; }
  .param-box .param-unit { font-size: 7.5pt; color: #00BCD4; }
  
  /* FOTOS */
  .fotos-section h2 { font-size: 10pt; font-weight: 700; color: #0A2342; 
    border-left: 4px solid #00BCD4; padding-left: 8px; margin-bottom: 8px; text-transform: uppercase; }
  .fotos-grupo h3 { font-size: 9pt; color: #555; margin: 8px 0 6px; }
  .fotos-grid-pdf { display: flex; flex-wrap: wrap; gap: 8px; }
  .fotos-grid-pdf img { width: 90px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid #dde; }
  
  /* FIRMAS */
  .firmas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 8px; }
  .firma-box { border: 1px solid #dde; border-radius: 8px; padding: 10px; text-align: center; }
  .firma-box img { max-width: 180px; max-height: 80px; object-fit: contain; }
  .firma-box .firma-nombre { font-size: 8pt; color: #555; margin-top: 6px; }
  .firma-box .firma-linea { border-top: 1px solid #ccc; margin-top: 40px; padding-top: 4px; font-size: 8pt; color: #888; }
  
  /* QR Y FOOTER */
  .cert-footer { display: flex; justify-content: space-between; align-items: flex-end;
    border-top: 2px solid #0A2342; margin-top: 20px; padding-top: 12px; }
  .cert-footer .legal { font-size: 7.5pt; color: #666; max-width: 70%; line-height: 1.5; }
  .cert-footer .qr-block { text-align: center; }
  .cert-footer .qr-block img { width: 70px; height: 70px; }
  .cert-footer .qr-block p { font-size: 6.5pt; color: #888; margin-top: 3px; }
  
  /* COSTES (opcional, sin datos confidenciales por defecto) */
  .badge-normativa { display:inline-block; background:#E3F2FD; color:#1565C0; 
    padding:2px 8px; border-radius:20px; font-size:8pt; font-weight:600; }
  
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cert-page { padding: 10mm; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="cert-page">

  <!-- CABECERA -->
  <div class="cert-header">
    <div>
      <div class="cert-logo">Legio<span>Cert</span> Pro</div>
      <div class="cert-empresa">
        ${CONFIG.PDF.EMPRESA}<br>
        ${CONFIG.PDF.EMAIL_EMPRESA}<br>
        ${CONFIG.PDF.TELEFONO_EMPRESA || ''}
      </div>
    </div>
    <div class="cert-numero">
      <div class="tipo">Certificado de Tratamiento</div>
      <div class="num">${numero}</div>
      <div class="fecha-em">Emitido: ${new Date().toLocaleDateString('es-ES')}</div>
      ${qrBase64 ? `<img src="${qrBase64}" style="width:55px;height:55px;margin-top:6px">` : ''}
    </div>
  </div>

  <!-- TÍTULO -->
  <div class="cert-titulo">
    <h1>Certificado de Desinfección y Tratamiento Antilegionella</h1>
    <div class="normativa">${tipoNorm} · ${CONFIG.NORMATIVA.UNE}</div>
  </div>

  <!-- CLIENTE -->
  <div class="cert-section">
    <h2>Datos del Cliente</h2>
    <table>
      <tr><td>Nombre / Razón social</td><td>${cliente?.nombre || '—'} ${cliente?.empresa ? `· ${cliente.empresa}` : ''}</td></tr>
      <tr><td>CIF / NIF</td><td>${cliente?.cif || '—'}</td></tr>
      <tr><td>Dirección</td><td>${cliente?.direccion || '—'} ${cliente?.provincia ? `· ${cliente.provincia}` : ''}</td></tr>
      <tr><td>Teléfono</td><td>${cliente?.telefono || '—'}</td></tr>
      <tr><td>Email</td><td>${cliente?.email || '—'}</td></tr>
      <tr><td>Persona de contacto</td><td>${cliente?.contacto || '—'}</td></tr>
    </table>
  </div>

  <!-- INSTALACIÓN -->
  <div class="cert-section">
    <h2>Datos de la Instalación</h2>
    <table>
      <tr><td>Descripción</td><td>${instalacion?.nombre || '—'}</td></tr>
      <tr><td>Tipo</td><td>${instalacion?.tipo || '—'}</td></tr>
      <tr><td>Volumen</td><td>${instalacion?.volumen ? `${instalacion.volumen.toLocaleString('es-ES')} litros` : '—'}</td></tr>
      <tr><td>Material</td><td>${instalacion?.material || '—'}</td></tr>
      <tr><td>Año instalación</td><td>${instalacion?.anio || '—'}</td></tr>
      <tr><td>Ubicación</td><td>${instalacion?.ubicacion || '—'}</td></tr>
    </table>
  </div>

  <!-- TRATAMIENTO -->
  <div class="cert-section">
    <h2>Datos del Tratamiento</h2>
    <table>
      <tr><td>Fecha</td><td>${fecha}</td></tr>
      <tr><td>Hora inicio</td><td>${horaIni}</td></tr>
      <tr><td>Hora fin</td><td>${horaFin}</td></tr>
      <tr><td>Duración</td><td>${dur}</td></tr>
      <tr><td>Técnico</td><td>${trat.tecnico || '—'}</td></tr>
      <tr><td>Tipo</td><td>${trat.tipo || '—'}</td></tr>
      <tr><td>Normativa</td><td><span class="badge-normativa">${tipoNorm}</span></td></tr>
      <tr><td>Producto</td><td>${trat.producto || '—'}</td></tr>
      <tr><td>Nº Lote</td><td>${trat.lote || '—'}</td></tr>
      <tr><td>Caducidad</td><td>${trat.caducidad || '—'}</td></tr>
      <tr><td>Cantidad utilizada</td><td>${trat.cantidad ? `${trat.cantidad} ${trat.cantidadUnidad || ''}` : '—'}</td></tr>
    </table>
  </div>

  <!-- PARÁMETROS ANALÍTICOS -->
  <div class="cert-section">
    <h2>Parámetros Analíticos</h2>
    <div class="params-grid">
      ${trat.temperatura ? `<div class="param-box"><div class="param-label">Temperatura</div><div class="param-value">${trat.temperatura}</div><div class="param-unit">°C</div></div>` : ''}
      ${trat.phInicial ? `<div class="param-box"><div class="param-label">pH inicial</div><div class="param-value">${trat.phInicial}</div><div class="param-unit">—</div></div>` : ''}
      ${trat.phFinal ? `<div class="param-box"><div class="param-label">pH final</div><div class="param-value">${trat.phFinal}</div><div class="param-unit">—</div></div>` : ''}
      ${trat.cloroLibreInicial ? `<div class="param-box"><div class="param-label">Cl libre inicial</div><div class="param-value">${trat.cloroLibreInicial}</div><div class="param-unit">ppm</div></div>` : ''}
      ${trat.cloroLibreFinal ? `<div class="param-box"><div class="param-label">Cl libre final</div><div class="param-value">${trat.cloroLibreFinal}</div><div class="param-unit">ppm</div></div>` : ''}
      ${trat.cloroCombinado ? `<div class="param-box"><div class="param-label">Cl combinado</div><div class="param-value">${trat.cloroCombinado}</div><div class="param-unit">ppm</div></div>` : ''}
    </div>
  </div>

  <!-- GPS -->
  ${trat.gps ? `
  <div class="cert-section">
    <h2>Ubicación GPS</h2>
    <table>
      ${gpsHTML}
    </table>
  </div>` : ''}

  <!-- OBSERVACIONES -->
  ${trat.observaciones ? `
  <div class="cert-section">
    <h2>Observaciones</h2>
    <p style="padding:8px;background:#f8fafc;border-radius:6px;font-size:9.5pt;line-height:1.6">${trat.observaciones}</p>
  </div>` : ''}

  <!-- FOTOS -->
  ${fotosHTML}

  <!-- FIRMAS -->
  <div class="cert-section">
    <h2>Firmas</h2>
    ${firmasHTML}
  </div>

  <!-- TEXTO LEGAL -->
  <div class="cert-section">
    <h2>Declaración Legal</h2>
    <p style="font-size:8.5pt;color:#444;line-height:1.6;padding:10px;background:#f0f4f8;border-radius:6px">
      ${CONFIG.TEXTOS_LEGALES.intro}<br><br>
      ${CONFIG.TEXTOS_LEGALES.metodo}<br><br>
      ${CONFIG.TEXTOS_LEGALES.validez}
    </p>
  </div>

  <!-- FOOTER -->
  <div class="cert-footer">
    <div class="legal">
      <strong>${CONFIG.PDF.EMPRESA}</strong> · ${CONFIG.PDF.EMAIL_EMPRESA}<br>
      Documento generado electrónicamente por LegioCert Pro v${CONFIG.APP_VERSION}<br>
      Certificado nº <strong>${numero}</strong> · ${new Date().toLocaleString('es-ES')}
    </div>
  </div>

  <!-- BOTÓN IMPRIMIR (no se imprime) -->
  <div class="no-print" style="margin-top:20px;display:flex;gap:12px;justify-content:center">
    <button onclick="window.print()" style="padding:10px 24px;background:#0A2342;color:white;border:none;border-radius:8px;font-size:11pt;cursor:pointer">
      🖨️ Imprimir / Guardar PDF
    </button>
    <button onclick="window.close()" style="padding:10px 24px;background:#eee;color:#333;border:none;border-radius:8px;font-size:11pt;cursor:pointer">
      ✕ Cerrar
    </button>
  </div>

</div>
</body>
</html>`;
  };

  const buildFotosHTML = (fotos) => {
    if (!fotos || (!fotos.antes?.length && !fotos.durante?.length && !fotos.despues?.length)) return '';

    const grupos = [
      { key: 'antes', label: '🔵 Antes del tratamiento' },
      { key: 'durante', label: '🟡 Durante el tratamiento' },
      { key: 'despues', label: '🟢 Después del tratamiento' },
    ];

    const content = grupos.map(g => {
      const imgs = fotos[g.key];
      if (!imgs || imgs.length === 0) return '';
      return `
        <div class="fotos-grupo">
          <h3>${g.label}</h3>
          <div class="fotos-grid-pdf">
            ${imgs.map(f => `<img src="${f.base64}" alt="foto">`).join('')}
          </div>
        </div>
      `;
    }).join('');

    if (!content.trim()) return '';

    return `
      <div class="cert-section fotos-section">
        <h2>Registro Fotográfico</h2>
        ${content}
      </div>
    `;
  };

  const buildFirmasHTML = (firmaTecnico, firmaCliente) => `
    <div class="firmas-grid">
      <div class="firma-box">
        ${firmaTecnico && firmaTecnico !== 'data:image/png;base64,' ?
          `<img src="${firmaTecnico}" alt="Firma técnico">` :
          '<div class="firma-linea" style="margin-top:60px">Firma del técnico</div>'
        }
        <div class="firma-nombre">Técnico responsable</div>
      </div>
      <div class="firma-box">
        ${firmaCliente && firmaCliente !== 'data:image/png;base64,' ?
          `<img src="${firmaCliente}" alt="Firma cliente">` :
          '<div class="firma-linea" style="margin-top:60px">Firma del cliente</div>'
        }
        <div class="firma-nombre">Representante del cliente</div>
      </div>
    </div>
  `;

  const generarQRSimple = (texto) => {
    // QR simplificado usando canvas (patrón visual básico de identificación)
    const canvas = document.createElement('canvas');
    const size = 100;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fondo blanco
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);

    // Borde exterior
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, 10);
    ctx.fillRect(0, 90, size, 10);
    ctx.fillRect(0, 0, 10, size);
    ctx.fillRect(90, 0, 10, size);

    // Patrón interno basado en hash del texto
    ctx.fillStyle = '#000';
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
      hash = ((hash << 5) - hash) + texto.charCodeAt(i);
      hash |= 0;
    }
    for (let x = 2; x < 9; x++) {
      for (let y = 2; y < 9; y++) {
        if ((hash + x * 7 + y * 13) % 3 !== 0) {
          ctx.fillRect(x * 10, y * 10, 9, 9);
        }
      }
    }

    return canvas.toDataURL('image/png');
  };

  const abrirVentanaPDF = (html, numero) => {
    const win = window.open('', `cert_${numero}`, 'width=900,height=700,scrollbars=yes');
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      // Fallback: blob URL
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.target = '_blank';
      a.download = `${numero}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  };

  const calcularCostesResumen = (trat) => {
    const manoObra = (trat.horas || 0) * (trat.precioHora || 0);
    const desp = (trat.km || 0) * (trat.precioKm || 0);
    const prod = trat.costeProducto || 0;
    const subtotal = manoObra + desp + prod;
    const margen = subtotal * ((trat.margen || 0) / 100);
    return { manoObra, desp, prod, subtotal, margen, total: subtotal + margen };
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return { generarCertificado, buildCertHTML };
})();

window.PDFModule = PDFModule;
