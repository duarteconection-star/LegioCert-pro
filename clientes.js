/**
 * LegioCert Pro - Módulo de Clientes
 * Gestión completa: crear, editar, eliminar, buscar clientes
 */

const ClientesModule = (() => {
  let currentEdit = null;

  const render = () => `
    <div class="module-header">
      <h2><i class="icon">👥</i> Clientes</h2>
      <button class="btn btn-primary" onclick="ClientesModule.openForm()">
        <i class="icon">➕</i> Nuevo Cliente
      </button>
    </div>
    <div class="search-bar">
      <input type="text" id="clienteSearch" placeholder="🔍 Buscar por nombre, empresa, CIF…"
        oninput="ClientesModule.search(this.value)" class="input-search">
    </div>
    <div id="clientesList" class="cards-grid"></div>
    <div id="clienteModal" class="modal hidden">
      <div class="modal-backdrop" onclick="ClientesModule.closeForm()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="clienteModalTitle">Nuevo Cliente</h3>
          <button class="btn-close" onclick="ClientesModule.closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre *</label>
              <input type="text" id="c_nombre" placeholder="Nombre completo" required>
            </div>
            <div class="form-group">
              <label>Empresa</label>
              <input type="text" id="c_empresa" placeholder="Razón social">
            </div>
            <div class="form-group">
              <label>CIF / NIF</label>
              <input type="text" id="c_cif" placeholder="B12345678">
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" id="c_telefono" placeholder="600 000 000">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="c_email" placeholder="cliente@empresa.com">
            </div>
            <div class="form-group">
              <label>Persona de contacto</label>
              <input type="text" id="c_contacto" placeholder="Nombre del contacto">
            </div>
            <div class="form-group form-full">
              <label>Dirección</label>
              <input type="text" id="c_direccion" placeholder="Calle, número, piso…">
            </div>
            <div class="form-group">
              <label>Provincia</label>
              <select id="c_provincia">
                <option value="">Seleccionar...</option>
                ${CONFIG.PROVINCIAS.map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
            </div>
            <div class="form-group form-full">
              <label>Observaciones</label>
              <textarea id="c_observaciones" placeholder="Notas adicionales…" rows="3"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="ClientesModule.closeForm()">Cancelar</button>
          <button class="btn btn-primary" onclick="ClientesModule.save()">
            <i class="icon">💾</i> Guardar
          </button>
        </div>
      </div>
    </div>
  `;

  const load = async () => {
    const clientes = await DB.getAll('clientes');
    renderList(clientes);
  };

  const renderList = async (clientes) => {
    const container = document.getElementById('clientesList');
    if (!container) return;

    if (clientes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <p>No hay clientes registrados</p>
          <button class="btn btn-primary" onclick="ClientesModule.openForm()">Añadir primer cliente</button>
        </div>`;
      return;
    }

    // Cargar conteo de instalaciones por cliente
    const instalaciones = await DB.getAll('instalaciones');
    const tratamientos = await DB.getAll('tratamientos');

    const countIns = {};
    const countTrat = {};
    instalaciones.forEach(i => { countIns[i.clienteId] = (countIns[i.clienteId] || 0) + 1; });
    tratamientos.forEach(t => { countTrat[t.clienteId] = (countTrat[t.clienteId] || 0) + 1; });

    container.innerHTML = clientes.map(c => `
      <div class="card cliente-card" onclick="ClientesModule.viewDetail(${c.id})">
        <div class="card-avatar">${(c.nombre || c.empresa || '?')[0].toUpperCase()}</div>
        <div class="card-body">
          <h4 class="card-title">${c.nombre || '—'}</h4>
          <p class="card-subtitle">${c.empresa || 'Sin empresa'}</p>
          <p class="card-meta">${c.cif ? `CIF: ${c.cif}` : ''}</p>
          <div class="card-stats">
            <span class="stat-badge"><i>🏢</i> ${countIns[c.id] || 0} instalaciones</span>
            <span class="stat-badge"><i>🧪</i> ${countTrat[c.id] || 0} tratamientos</span>
          </div>
        </div>
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" onclick="ClientesModule.openForm(${c.id})" title="Editar">✏️</button>
          <button class="btn-icon danger" onclick="ClientesModule.confirmDelete(${c.id})" title="Eliminar">🗑️</button>
        </div>
      </div>
    `).join('');
  };

  const search = async (q) => {
    if (!q.trim()) { load(); return; }
    const results = await DB.search('clientes', q, ['nombre', 'empresa', 'cif', 'email', 'telefono']);
    renderList(results);
  };

  const openForm = async (id = null) => {
    currentEdit = id;
    document.getElementById('clienteModalTitle').textContent = id ? 'Editar Cliente' : 'Nuevo Cliente';

    // Limpiar
    ['nombre','empresa','cif','telefono','email','contacto','direccion','provincia','observaciones']
      .forEach(f => {
        const el = document.getElementById(`c_${f}`);
        if (el) el.value = '';
      });

    if (id) {
      const c = await DB.getById('clientes', id);
      if (c) {
        document.getElementById('c_nombre').value = c.nombre || '';
        document.getElementById('c_empresa').value = c.empresa || '';
        document.getElementById('c_cif').value = c.cif || '';
        document.getElementById('c_telefono').value = c.telefono || '';
        document.getElementById('c_email').value = c.email || '';
        document.getElementById('c_contacto').value = c.contacto || '';
        document.getElementById('c_direccion').value = c.direccion || '';
        document.getElementById('c_provincia').value = c.provincia || '';
        document.getElementById('c_observaciones').value = c.observaciones || '';
      }
    }

    document.getElementById('clienteModal').classList.remove('hidden');
  };

  const closeForm = () => {
    document.getElementById('clienteModal').classList.add('hidden');
    currentEdit = null;
  };

  const save = async () => {
    const nombre = document.getElementById('c_nombre').value.trim();
    if (!nombre) { App.toast('El nombre es obligatorio', 'error'); return; }

    const data = {
      nombre,
      empresa: document.getElementById('c_empresa').value.trim(),
      cif: document.getElementById('c_cif').value.trim(),
      telefono: document.getElementById('c_telefono').value.trim(),
      email: document.getElementById('c_email').value.trim(),
      contacto: document.getElementById('c_contacto').value.trim(),
      direccion: document.getElementById('c_direccion').value.trim(),
      provincia: document.getElementById('c_provincia').value,
      observaciones: document.getElementById('c_observaciones').value.trim(),
    };

    if (currentEdit) {
      await DB.update('clientes', { ...data, id: currentEdit });
      App.toast('Cliente actualizado correctamente', 'success');
    } else {
      await DB.add('clientes', data);
      App.toast('Cliente creado correctamente', 'success');
    }

    closeForm();
    load();
    App.refreshDashboard();
  };

  const confirmDelete = (id) => {
    App.confirm('¿Eliminar este cliente? Se eliminarán también sus instalaciones y tratamientos.', async () => {
      // Eliminar instalaciones y tratamientos asociados
      const inst = await DB.getAll('instalaciones', 'clienteId', id);
      for (const i of inst) await DB.remove('instalaciones', i.id);
      const trat = await DB.getAll('tratamientos', 'clienteId', id);
      for (const t of trat) await DB.remove('tratamientos', t.id);
      await DB.remove('clientes', id);
      App.toast('Cliente eliminado', 'info');
      load();
      App.refreshDashboard();
    });
  };

  const viewDetail = (id) => {
    // Ir a instalaciones filtrando por cliente
    App.navigate('instalaciones', { clienteId: id });
  };

  return { render, load, search, openForm, closeForm, save, confirmDelete, viewDetail };
})();

window.ClientesModule = ClientesModule;
