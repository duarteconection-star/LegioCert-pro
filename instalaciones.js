/**
 * LegioCert Pro - Módulo de Instalaciones
 * Cada cliente puede tener múltiples instalaciones
 */

const InstalacionesModule = (() => {
  let currentEdit = null;
  let filterClienteId = null;

  const render = (params = {}) => {
    filterClienteId = params.clienteId || null;
    return `
      <div class="module-header">
        <h2><i class="icon">🏢</i> Instalaciones</h2>
        <button class="btn btn-primary" onclick="InstalacionesModule.openForm()">
          <i class="icon">➕</i> Nueva Instalación
        </button>
      </div>
      <div class="filter-bar">
        <select id="instClienteFilter" onchange="InstalacionesModule.filterByCliente(this.value)" class="select-filter">
          <option value="">Todos los clientes</option>
        </select>
        <input type="text" id="instSearch" placeholder="🔍 Buscar instalación…"
          oninput="InstalacionesModule.search(this.value)" class="input-search" style="flex:1">
      </div>
      <div id="instalacionesList" class="cards-grid"></div>
      <div id="instModal" class="modal hidden">
        <div class="modal-backdrop" onclick="InstalacionesModule.closeForm()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="instModalTitle">Nueva Instalación</h3>
            <button class="btn-close" onclick="InstalacionesModule.closeForm()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Cliente *</label>
                <select id="inst_clienteId" required>
                  <option value="">Seleccionar cliente...</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label>Nombre / Descripción *</label>
                <input type="text" id="inst_nombre" placeholder="Ej: ACS Edificio A">
              </div>
              <div class="form-group">
                <label>Tipo de instalación *</label>
                <select id="inst_tipo">
                  <option value="">Seleccionar tipo...</option>
                  ${CONFIG.TIPOS_INSTALACION.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Volumen (litros)</label>
                <input type="number" id="inst_volumen" placeholder="0" min="0">
              </div>
              <div class="form-group">
                <label>Material</label>
                <select id="inst_material">
                  <option value="">Seleccionar...</option>
                  ${CONFIG.MATERIALES.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Año de instalación</label>
                <input type="number" id="inst_anio" placeholder="${new Date().getFullYear()}" min="1950" max="${new Date().getFullYear()}">
              </div>
              <div class="form-group">
                <label>Ubicación en el edificio</label>
                <input type="text" id="inst_ubicacion" placeholder="Ej: Planta baja, cuarto técnico">
              </div>
              <div class="form-group form-full">
                <label>Observaciones</label>
                <textarea id="inst_observaciones" rows="3" placeholder="Notas sobre la instalación…"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="InstalacionesModule.closeForm()">Cancelar</button>
            <button class="btn btn-primary" onclick="InstalacionesModule.save()">
              <i class="icon">💾</i> Guardar
            </button>
          </div>
        </div>
      </div>
    `;
  };

  const load = async () => {
    await loadClienteFilter();
    let instalaciones;
    if (filterClienteId) {
      instalaciones = await DB.getAll('instalaciones', 'clienteId', filterClienteId);
      const el = document.getElementById('instClienteFilter');
      if (el) el.value = filterClienteId;
    } else {
      instalaciones = await DB.getAll('instalaciones');
    }
    renderList(instalaciones);
  };

  const loadClienteFilter = async () => {
    const clientes = await DB.getAll('clientes');
    const select = document.getElementById('instClienteFilter');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Todos los clientes</option>' +
      clientes.map(c => `<option value="${c.id}">${c.nombre}${c.empresa ? ` – ${c.empresa}` : ''}</option>`).join('');
    if (current) select.value = current;
  };

  const filterByCliente = (clienteId) => {
    filterClienteId = clienteId ? parseInt(clienteId) : null;
    load();
  };

  const renderList = async (instalaciones) => {
    const container = document.getElementById('instalacionesList');
    if (!container) return;

    if (instalaciones.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏢</div>
          <p>No hay instalaciones registradas</p>
          <button class="btn btn-primary" onclick="InstalacionesModule.openForm()">Añadir instalación</button>
        </div>`;
      return;
    }

    const clientes = await DB.getAll('clientes');
    const clienteMap = {};
    clientes.forEach(c => { clienteMap[c.id] = c; });

    const tratamientos = await DB.getAll('tratamientos');
    const countTrat = {};
    tratamientos.forEach(t => { countTrat[t.instalacionId] = (countTrat[t.instalacionId] || 0) + 1; });

    const iconos = {
      'ACS': '🚿', 'AFCH': '💧', 'Depósito': '🪣', 'Piscina': '🏊',
      'SPA': '♨️', 'Torre': '🏗️', 'Humectador': '💨', 'Fuente': '⛲',
    };

    container.innerHTML = instalaciones.map(inst => {
      const cliente = clienteMap[inst.clienteId] || {};
      const iconKey = Object.keys(iconos).find(k => (inst.tipo || '').includes(k));
      const icono = iconKey ? iconos[iconKey] : '🏢';

      return `
        <div class="card inst-card" onclick="InstalacionesModule.openTratamiento(${inst.id})">
          <div class="card-avatar inst-avatar">${icono}</div>
          <div class="card-body">
            <h4 class="card-title">${inst.nombre || inst.tipo}</h4>
            <p class="card-subtitle">${cliente.nombre || 'Sin cliente'} ${cliente.empresa ? `· ${cliente.empresa}` : ''}</p>
            <div class="inst-meta">
              ${inst.tipo ? `<span class="badge badge-blue">${inst.tipo}</span>` : ''}
              ${inst.volumen ? `<span class="badge badge-teal">${inst.volumen.toLocaleString()} L</span>` : ''}
              ${inst.material ? `<span class="badge badge-gray">${inst.material}</span>` : ''}
            </div>
            <div class="card-stats">
              <span class="stat-badge">🧪 ${countTrat[inst.id] || 0} tratamientos</span>
              ${inst.anio ? `<span class="stat-badge">📅 Año ${inst.anio}</span>` : ''}
            </div>
          </div>
          <div class="card-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="InstalacionesModule.openForm(${inst.id})" title="Editar">✏️</button>
            <button class="btn-icon" onclick="InstalacionesModule.openTratamiento(${inst.id})" title="Nuevo tratamiento">🧪</button>
            <button class="btn-icon danger" onclick="InstalacionesModule.confirmDelete(${inst.id})" title="Eliminar">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  };

  const search = async (q) => {
    if (!q.trim()) { load(); return; }
    let instalaciones = await DB.search('instalaciones', q, ['nombre', 'tipo', 'material', 'ubicacion', 'observaciones']);
    if (filterClienteId) {
      instalaciones = instalaciones.filter(i => i.clienteId === filterClienteId);
    }
    renderList(instalaciones);
  };

  const openForm = async (id = null) => {
    currentEdit = id;
    document.getElementById('instModalTitle').textContent = id ? 'Editar Instalación' : 'Nueva Instalación';

    // Poblar select de clientes
    const clientes = await DB.getAll('clientes');
    document.getElementById('inst_clienteId').innerHTML =
      '<option value="">Seleccionar cliente...</option>' +
      clientes.map(c => `<option value="${c.id}">${c.nombre}${c.empresa ? ` – ${c.empresa}` : ''}</option>`).join('');

    // Limpiar campos
    ['nombre','tipo','volumen','material','anio','ubicacion','observaciones']
      .forEach(f => { const el = document.getElementById(`inst_${f}`); if (el) el.value = ''; });

    if (filterClienteId) {
      document.getElementById('inst_clienteId').value = filterClienteId;
    }

    if (id) {
      const inst = await DB.getById('instalaciones', id);
      if (inst) {
        document.getElementById('inst_clienteId').value = inst.clienteId || '';
        document.getElementById('inst_nombre').value = inst.nombre || '';
        document.getElementById('inst_tipo').value = inst.tipo || '';
        document.getElementById('inst_volumen').value = inst.volumen || '';
        document.getElementById('inst_material').value = inst.material || '';
        document.getElementById('inst_anio').value = inst.anio || '';
        document.getElementById('inst_ubicacion').value = inst.ubicacion || '';
        document.getElementById('inst_observaciones').value = inst.observaciones || '';
      }
    }

    document.getElementById('instModal').classList.remove('hidden');
  };

  const closeForm = () => {
    document.getElementById('instModal').classList.add('hidden');
    currentEdit = null;
  };

  const save = async () => {
    const clienteId = parseInt(document.getElementById('inst_clienteId').value);
    const nombre = document.getElementById('inst_nombre').value.trim();
    const tipo = document.getElementById('inst_tipo').value;

    if (!clienteId) { App.toast('Selecciona un cliente', 'error'); return; }
    if (!nombre && !tipo) { App.toast('Indica nombre o tipo de instalación', 'error'); return; }

    const data = {
      clienteId,
      nombre,
      tipo,
      volumen: parseFloat(document.getElementById('inst_volumen').value) || null,
      material: document.getElementById('inst_material').value,
      anio: parseInt(document.getElementById('inst_anio').value) || null,
      ubicacion: document.getElementById('inst_ubicacion').value.trim(),
      observaciones: document.getElementById('inst_observaciones').value.trim(),
    };

    if (currentEdit) {
      await DB.update('instalaciones', { ...data, id: currentEdit });
      App.toast('Instalación actualizada', 'success');
    } else {
      await DB.add('instalaciones', data);
      App.toast('Instalación creada', 'success');
    }

    closeForm();
    load();
    App.refreshDashboard();
  };

  const confirmDelete = (id) => {
    App.confirm('¿Eliminar esta instalación y todos sus tratamientos?', async () => {
      const trats = await DB.getAll('tratamientos', 'instalacionId', id);
      for (const t of trats) await DB.remove('tratamientos', t.id);
      await DB.remove('instalaciones', id);
      App.toast('Instalación eliminada', 'info');
      load();
      App.refreshDashboard();
    });
  };

  const openTratamiento = (instalacionId) => {
    App.navigate('legionella', { instalacionId });
  };

  return { render, load, search, filterByCliente, openForm, closeForm, save, confirmDelete, openTratamiento };
})();

window.InstalacionesModule = InstalacionesModule;
