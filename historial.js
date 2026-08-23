/**
 * LegioCert Pro - Módulo de Historial
 * Ver, filtrar y exportar tratamientos
 */

const HistorialModule = (() => {
  const render = () => `
    <div class="module-header">
      <h2><i class="icon">📋</i> Historial de Tratamientos</h2>
      <button class="btn btn-primary" onclick="App.navigate('legionella')">
        <i class="icon">➕</i> Nuevo
      </button>
    </div>
    <div class="filter-bar" style="flex-wrap:wrap;gap:8px">
      <select id="h_filtroCliente" onchange="HistorialModule.load()" class="select-filter">
        <option value="">Todos los clientes</option>
      </select>
      <select id="h_filtroTipo" onchange="HistorialModule.load()" class="select-filter">
        <option value="">Todos los tipos</option>
        <option value="mantenimiento">Mantenimiento</option>
        <option value="desinfeccion">Desinfección</option>
        <option value="choque">Choque</option>
        <option value="revision">Revisión</option>
        <option value="muestreo">Muestreo</option>
      </select>
      <input type="date" id="h_filtroDesde" onchange="HistorialModule.load()" class="input-filter" placeholder="Desde">
      <input type="date" id="h_filtroHasta" onchange="HistorialModule.load()" class="input-filter" placeholder="Hasta">
      <div class="export-btns">
        <button class="btn btn-sm btn-ghost" onclick="HistorialModule.exportar('json')">JSON</button>
        <button class="btn btn-sm btn-ghost" onclick="HistorialModule.exportar('csv')">CSV</button>
        <button class="btn btn-sm btn-primary" onclick="HistorialModule.exportar('pdf')">📄 PDF</button>
      </div>
    </div>
    <div id="historialList" class="historial-list"></div>
  `;

  const load = async () => {
    // Poblar filtro de clientes
    const clientes = await DB.getAll('clientes');
    const selCliente = document.getElementById('h_filtroCliente');
    if (selCliente && selCliente.options.length <= 1) {
      selCliente.innerHTML = '<option value="">Todos los clientes</option>' +
        clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    }

    const clienteMap = {};
    clientes.forEach(c => { clienteMap[c.id] = c; });

    const instalaciones = await DB.getAll('instalaciones');
    const instMap = {};
    instalaciones.forEach(i => { instMap[i.id] = i; });

    let tratamientos = await DB.getAll('tratamientos');
    tratamientos.sort((a, b) => (b.fecha || '') < (a.fecha || '') ? -1 : 1);

    // Aplicar filtros
    const filtroCliente = document.getElementById('h_filtroCliente')?.value;
    const filtroTipo = document.getElementById('h_filtroTipo')?.value;
    const filtroDesde = document.getElementById('h_filtroDesde')?.value;
    const filtroHasta = document.getElementById('h_filtroHasta')?.value;

    if (filtroCliente) tratamientos = tratamientos.filter(t => String(t.clienteId) === filtroCliente);
    if (filtroTipo) tratamientos = tratamientos.filter(t => t.tipo === filtroTipo);
    if (filtroDesde) tratamientos = tratamientos.filter(t => t.fecha >= filtroDesde);
    if (filtroHasta) tratamientos = tratamientos.filter(t => t.fecha <= filtroHasta);

    const container = document.getElementById('historialList');
    if (!container) return;

    if (tratamientos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>No hay tratamientos registrados</p>
          <button class="btn btn-primary" onclick="App.navigate('legionella')">Registrar tratamiento</button>
        </div>`;
      return;
    }

    const tipoIconos = {
      mantenimiento: '🟡', desinfeccion: '🟠', choque: '🔴', revision: '🔵', muestreo: '🟣'
    };
    const tipoLabel = {
      mantenimiento: 'Mantenimiento', desinfeccion: 'Desinfección',
      choque: 'Choque', revision: 'Revisión', muestreo: 'Muestreo'
    };

    container.innerHTML = tratamientos.map(t => {
      const cliente = clienteMap[t.clienteId] || {};
      const inst = instMap[t.instalacionId] || {};
      const icon = tipoIconos[t.tipo] || '⚪';
      const label = tipoLabel[t.tipo] || t.tipo || 'Tratamiento';
      const fecha = t.fecha ? new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

      return `
        <div class="historial-item">
          <div class="historial-icon">${icon}</div>
          <div class="historial-info">
            <div class="historial-top">
              <span class="historial-tipo">${label}</span>
              <span class="historial-fecha">${fecha}</span>
            </div>
            <div class="historial-cliente">${cliente.nombre || 'Sin cliente'} ${cliente.empresa ? `· ${cliente.empresa}` : ''}</div>
            <div class="historial-inst">${inst.nombre || inst.tipo || 'Sin instalación'}</div>
            <div class="historial-params">
              ${t.cloroLibreFinal ? `<span class="param-chip">Cl libre: ${t.cloroLibreFinal} ppm</span>` : ''}
              ${t.phFinal ? `<span class="param-chip">pH: ${t.phFinal}</span>` : ''}
              ${t.temperatura ? `<span class="param-chip">T°: ${t.temperatura}°C</span>` : ''}
              ${t.producto ? `<span class="param-chip">${t.producto}</span>` : ''}
            </div>
          </div>
          <div class="historial-actions">
            <button class="btn-icon" onclick="HistorialModule.verDetalle(${t.id})" title="Ver detalle">👁️</button>
            <button class="btn-icon" onclick="PDFModule.generarCertificado(${t.id})" title="Generar PDF">📄</button>
            <button class="btn-icon" onclick="App.navigate('legionella', {tratamientoId: ${t.id}})" title="Editar">✏️</button>
            <button class="btn-icon danger" onclick="HistorialModule.eliminar(${t.id})" title="Eliminar">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  };

  const verDetalle = async (id) => {
    const t = await DB.getById('tratamientos', id);
    if (!t) return;

    const cliente = t.clienteId ? await DB.getById('clientes', t.clienteId) : null;
    const inst = t.instalacionId ? await DB.getById('instalaciones', t.instalacionId) : null;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>Detalle del Tratamiento</h3>
          <button class="btn-close" onclick="this.closest('.modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="detalle-grid">
            <div class="detalle-item"><span>Cliente</span><strong>${cliente?.nombre || '—'}</strong></div>
            <div class="detalle-item"><span>Instalación</span><strong>${inst?.nombre || inst?.tipo || '—'}</strong></div>
            <div class="detalle-item"><span>Fecha</span><strong>${t.fecha || '—'}</strong></div>
            <div class="detalle-item"><span>Tipo</span><strong>${t.tipo || '—'}</strong></div>
            <div class="detalle-item"><span>Técnico</span><strong>${t.tecnico || '—'}</strong></div>
            <div class="detalle-item"><span>Producto</span><strong>${t.producto || '—'}</strong></div>
            <div class="detalle-item"><span>Cantidad</span><strong>${t.cantidad ? `${t.cantidad} ${t.cantidadUnidad}` : '—'}</strong></div>
            <div class="detalle-item"><span>Lote</span><strong>${t.lote || '—'}</strong></div>
            <div class="detalle-item"><span>pH inicial/final</span><strong>${t.phInicial || '—'} / ${t.phFinal || '—'}</strong></div>
            <div class="detalle-item"><span>Cl libre i/f</span><strong>${t.cloroLibreInicial || '—'} / ${t.cloroLibreFinal || '—'} ppm</strong></div>
            <div class="detalle-item"><span>Temperatura</span><strong>${t.temperatura ? `${t.temperatura}°C` : '—'}</strong></div>
            <div class="detalle-item"><span>Cloro combinado</span><strong>${t.cloroCombinado ? `${t.cloroCombinado} ppm` : '—'}</strong></div>
          </div>
          ${t.observaciones ? `<div style="margin-top:12px"><strong>Observaciones:</strong><p style="margin-top:6px;color:#555">${t.observaciones}</p></div>` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Cerrar</button>
          <button class="btn btn-primary" onclick="PDFModule.generarCertificado(${t.id}); this.closest('.modal').remove()">📄 Generar PDF</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  const eliminar = (id) => {
    App.confirm('¿Eliminar este tratamiento permanentemente?', async () => {
      await DB.remove('tratamientos', id);
      App.toast('Tratamiento eliminado', 'info');
      load();
      App.refreshDashboard();
    });
  };

  const exportar = async (formato) => {
    const tratamientos = await DB.getAll('tratamientos');
    const clientes = await DB.getAll('clientes');
    const clienteMap = {};
    clientes.forEach(c => { clienteMap[c.id] = c; });

    const enriquecidos = tratamientos.map(t => ({
      ...t,
      clienteNombre: clienteMap[t.clienteId]?.nombre || '',
      clienteEmpresa: clienteMap[t.clienteId]?.empresa || '',
      fotos: undefined, firmaTecnico: undefined, firmaCliente: undefined, // excluir binarios
    }));

    let content, filename, type;

    if (formato === 'json') {
      content = JSON.stringify(enriquecidos, null, 2);
      filename = `LegioCert_historial_${new Date().toISOString().split('T')[0]}.json`;
      type = 'application/json';
    } else if (formato === 'csv') {
      const cols = ['id','fecha','clienteNombre','clienteEmpresa','tipo','producto','cantidad','cantidadUnidad',
        'temperatura','phInicial','phFinal','cloroLibreInicial','cloroLibreFinal','cloroCombinado',
        'tecnico','lote','observaciones'];
      const header = cols.join(';');
      const rows = enriquecidos.map(t => cols.map(c => `"${t[c] ?? ''}"`).join(';'));
      content = [header, ...rows].join('\n');
      filename = `LegioCert_historial_${new Date().toISOString().split('T')[0]}.csv`;
      type = 'text/csv;charset=utf-8;';
    } else if (formato === 'pdf') {
      App.toast('Abriendo listado para imprimir…', 'info');
      const html = buildListadoHTML(enriquecidos);
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
      return;
    }

    const blob = new Blob(['\ufeff' + content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    App.toast(`Exportado como ${formato.toUpperCase()}`, 'success');
  };

  const buildListadoHTML = (tratamientos) => `
    <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Historial LegioCert Pro</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 9pt; }
      h1 { color: #0A2342; font-size: 14pt; border-bottom: 2px solid #0A2342; padding-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #0A2342; color: white; padding: 6px 8px; text-align: left; font-size: 8pt; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 8pt; }
      tr:nth-child(even) td { background: #f8fafc; }
      @media print { @page { margin: 10mm; } }
    </style></head><body>
    <h1>Historial de Tratamientos – LegioCert Pro</h1>
    <p style="color:#666;margin-bottom:12px">Generado: ${new Date().toLocaleString('es-ES')} · Total: ${tratamientos.length} tratamientos</p>
    <table>
      <thead><tr><th>Fecha</th><th>Cliente</th><th>Tipo</th><th>Producto</th><th>Cl libre final</th><th>pH final</th><th>Técnico</th></tr></thead>
      <tbody>
        ${tratamientos.map(t => `
          <tr>
            <td>${t.fecha || '—'}</td>
            <td>${t.clienteNombre || '—'}</td>
            <td>${t.tipo || '—'}</td>
            <td>${t.producto || '—'}</td>
            <td>${t.cloroLibreFinal ? `${t.cloroLibreFinal} ppm` : '—'}</td>
            <td>${t.phFinal || '—'}</td>
            <td>${t.tecnico || '—'}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div class="no-print" style="margin-top:16px">
      <button onclick="window.print()" style="padding:8px 20px;background:#0A2342;color:white;border:none;border-radius:6px;cursor:pointer">🖨️ Imprimir</button>
    </div>
    </body></html>
  `;

  return { render, load, verDetalle, eliminar, exportar };
})();

window.HistorialModule = HistorialModule;
