/**
 * LegioCert Pro - Módulo de Productos
 * Inventario, lotes, caducidad y control de stock
 */

const ProductosModule = (() => {
  let currentEdit = null;

  const render = () => `
    <div class="module-header">
      <h2><i class="icon">🧴</i> Productos e Inventario</h2>
      <button class="btn btn-primary" onclick="ProductosModule.openForm()">
        <i class="icon">➕</i> Nuevo producto
      </button>
    </div>
    <div class="search-bar">
      <input type="text" id="prodSearch" placeholder="🔍 Buscar producto, lote…"
        oninput="ProductosModule.search(this.value)" class="input-search">
    </div>
    <div id="alertas_caducidad" class="alertas-caducidad"></div>
    <div id="productosList" class="productos-grid"></div>

    <div id="prodModal" class="modal hidden">
      <div class="modal-backdrop" onclick="ProductosModule.closeForm()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="prodModalTitle">Nuevo Producto</h3>
          <button class="btn-close" onclick="ProductosModule.closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group form-full">
              <label>Nombre del producto *</label>
              <input type="text" id="p_nombre" placeholder="Ej: Cloro granulado 65%">
            </div>
            <div class="form-group">
              <label>Tipo</label>
              <select id="p_tipo">
                <option value="desinfectante">Desinfectante</option>
                <option value="cloro">Cloro</option>
                <option value="hipoclorito">Hipoclorito</option>
                <option value="dioxido">Dióxido de cloro</option>
                <option value="corrector_ph">Corrector pH</option>
                <option value="alguicida">Alguicida</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Concentración (%)</label>
              <input type="number" id="p_concentracion" placeholder="Ej: 65" min="0" max="100" step="0.1">
            </div>
            <div class="form-group">
              <label>Nº Lote</label>
              <input type="text" id="p_lote" placeholder="LOT-2024-001">
            </div>
            <div class="form-group">
              <label>Fecha caducidad</label>
              <input type="date" id="p_caducidad">
            </div>
            <div class="form-group">
              <label>Stock actual</label>
              <input type="number" id="p_stock" placeholder="0" min="0" step="0.1">
            </div>
            <div class="form-group">
              <label>Unidad de stock</label>
              <select id="p_unidad">
                <option value="kg">Kilogramos (kg)</option>
                <option value="L">Litros (L)</option>
                <option value="g">Gramos (g)</option>
                <option value="mL">Mililitros (mL)</option>
                <option value="ud">Unidades</option>
              </select>
            </div>
            <div class="form-group">
              <label>Stock mínimo (alerta)</label>
              <input type="number" id="p_stockMin" placeholder="0" min="0" step="0.1">
            </div>
            <div class="form-group">
              <label>Coste por unidad (€)</label>
              <input type="number" id="p_costeUnidad" placeholder="0.00" step="0.01" oninput="ProductosModule.calcularPrecios()">
            </div>
            <div class="form-group">
              <label>Precio de venta (€)</label>
              <input type="number" id="p_precioVenta" placeholder="0.00" step="0.01">
            </div>
            <div class="form-group">
              <label>Margen (%)</label>
              <input type="number" id="p_margen" placeholder="30" step="1" oninput="ProductosModule.calcularPrecios()">
            </div>
            <div class="form-group">
              <label>Proveedor</label>
              <input type="text" id="p_proveedor" placeholder="Nombre del proveedor">
            </div>
            <div class="form-group form-full">
              <label>Observaciones</label>
              <textarea id="p_observaciones" rows="2" placeholder="Notas, ficha técnica…"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="ProductosModule.closeForm()">Cancelar</button>
          <button class="btn btn-primary" onclick="ProductosModule.save()">💾 Guardar</button>
        </div>
      </div>
    </div>

    <!-- Modal ajuste de stock -->
    <div id="stockModal" class="modal hidden">
      <div class="modal-backdrop" onclick="document.getElementById('stockModal').classList.add('hidden')"></div>
      <div class="modal-content" style="max-width:380px">
        <div class="modal-header">
          <h3>Ajustar Stock</h3>
          <button class="btn-close" onclick="document.getElementById('stockModal').classList.add('hidden')">✕</button>
        </div>
        <div class="modal-body">
          <p id="stock_prod_nombre" style="font-weight:600;margin-bottom:12px"></p>
          <div class="form-group">
            <label>Operación</label>
            <select id="stock_op">
              <option value="add">➕ Añadir stock</option>
              <option value="sub">➖ Consumir stock</option>
              <option value="set">🔄 Establecer stock</option>
            </select>
          </div>
          <div class="form-group">
            <label>Cantidad</label>
            <input type="number" id="stock_cantidad" placeholder="0" min="0" step="0.1">
          </div>
          <div class="form-group">
            <label>Motivo</label>
            <input type="text" id="stock_motivo" placeholder="Ej: Compra, tratamiento…">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('stockModal').classList.add('hidden')">Cancelar</button>
          <button class="btn btn-primary" onclick="ProductosModule.confirmarStock()">Actualizar</button>
        </div>
      </div>
    </div>
  `;

  let stockEditId = null;

  const load = async () => {
    const productos = await DB.getAll('productos');
    renderAlertas(productos);
    renderList(productos);
  };

  const renderAlertas = (productos) => {
    const el = document.getElementById('alertas_caducidad');
    if (!el) return;

    const hoy = new Date();
    const en30dias = new Date(hoy.getTime() + 30 * 86400000).toISOString().split('T')[0];
    const hoyStr = hoy.toISOString().split('T')[0];

    const caducados = productos.filter(p => p.caducidad && p.caducidad < hoyStr);
    const proximosCad = productos.filter(p => p.caducidad && p.caducidad >= hoyStr && p.caducidad <= en30dias);
    const stockBajo = productos.filter(p => p.stockMin && p.stock !== null && p.stock <= p.stockMin);

    const alertas = [];
    if (caducados.length) alertas.push(`⛔ ${caducados.length} producto(s) caducado(s): ${caducados.map(p=>p.nombre).join(', ')}`);
    if (proximosCad.length) alertas.push(`⚠️ ${proximosCad.length} producto(s) próximos a caducar (30 días): ${proximosCad.map(p=>p.nombre).join(', ')}`);
    if (stockBajo.length) alertas.push(`📦 Stock bajo: ${stockBajo.map(p=>`${p.nombre} (${p.stock} ${p.unidad})`).join(', ')}`);

    el.innerHTML = alertas.map(a => `<div class="alerta-item">${a}</div>`).join('');
  };

  const renderList = (productos) => {
    const container = document.getElementById('productosList');
    if (!container) return;

    if (productos.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🧴</div><p>Sin productos registrados</p><button class="btn btn-primary" onclick="ProductosModule.openForm()">Añadir producto</button></div>`;
      return;
    }

    const hoy = new Date().toISOString().split('T')[0];

    container.innerHTML = productos.map(p => {
      const caducado = p.caducidad && p.caducidad < hoy;
      const proxCad = p.caducidad && !caducado && p.caducidad <= new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
      const stockBajo = p.stockMin && p.stock !== null && p.stock <= p.stockMin;

      const margen = p.costeUnidad && p.precioVenta
        ? (((p.precioVenta - p.costeUnidad) / p.costeUnidad) * 100).toFixed(1)
        : null;

      return `
        <div class="producto-card ${caducado ? 'caducado' : proxCad ? 'prox-caducar' : ''}">
          <div class="producto-header">
            <div class="producto-nombre">${p.nombre}</div>
            <div class="producto-badges">
              ${caducado ? '<span class="badge badge-red">Caducado</span>' : ''}
              ${proxCad ? '<span class="badge badge-orange">Caduca pronto</span>' : ''}
              ${stockBajo ? '<span class="badge badge-yellow">Stock bajo</span>' : ''}
            </div>
          </div>
          <div class="producto-meta">
            ${p.tipo ? `<span class="badge badge-blue">${p.tipo}</span>` : ''}
            ${p.concentracion ? `<span class="badge badge-teal">${p.concentracion}%</span>` : ''}
            ${p.lote ? `<span class="text-muted">Lote: ${p.lote}</span>` : ''}
            ${p.caducidad ? `<span class="text-muted">Cad: ${p.caducidad}</span>` : ''}
          </div>
          <div class="producto-stock">
            <div class="stock-info">
              <span class="stock-val ${stockBajo ? 'text-danger' : ''}">${p.stock ?? '—'} ${p.unidad || ''}</span>
              ${p.stockMin ? `<span class="text-muted">Mín: ${p.stockMin}</span>` : ''}
            </div>
            <button class="btn btn-sm btn-ghost" onclick="ProductosModule.openStock(${p.id})">📦 Ajustar</button>
          </div>
          <div class="producto-precios">
            ${p.costeUnidad ? `<span>Coste: <strong>${p.costeUnidad}€/${p.unidad||'ud'}</strong></span>` : ''}
            ${p.precioVenta ? `<span>Venta: <strong>${p.precioVenta}€/${p.unidad||'ud'}</strong></span>` : ''}
            ${margen ? `<span class="text-success">Margen: <strong>${margen}%</strong></span>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn-icon" onclick="ProductosModule.openForm(${p.id})">✏️</button>
            <button class="btn-icon danger" onclick="ProductosModule.eliminar(${p.id})">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  };

  const search = async (q) => {
    if (!q.trim()) { load(); return; }
    const results = await DB.search('productos', q, ['nombre', 'lote', 'tipo', 'proveedor']);
    renderList(results);
  };

  const openForm = async (id = null) => {
    currentEdit = id;
    document.getElementById('prodModalTitle').textContent = id ? 'Editar Producto' : 'Nuevo Producto';

    ['nombre','lote','caducidad','stock','stockMin','costeUnidad','precioVenta','margen','proveedor','observaciones','concentracion']
      .forEach(f => { const el = document.getElementById(`p_${f}`); if (el) el.value = ''; });
    document.getElementById('p_tipo').value = 'desinfectante';
    document.getElementById('p_unidad').value = 'kg';

    if (id) {
      const p = await DB.getById('productos', id);
      if (p) {
        ['nombre','lote','caducidad','proveedor','observaciones'].forEach(f => {
          const el = document.getElementById(`p_${f}`); if (el) el.value = p[f] || '';
        });
        ['stock','stockMin','costeUnidad','precioVenta','margen','concentracion'].forEach(f => {
          const el = document.getElementById(`p_${f}`); if (el && p[f] !== null && p[f] !== undefined) el.value = p[f];
        });
        document.getElementById('p_tipo').value = p.tipo || 'desinfectante';
        document.getElementById('p_unidad').value = p.unidad || 'kg';
      }
    }

    document.getElementById('prodModal').classList.remove('hidden');
  };

  const closeForm = () => {
    document.getElementById('prodModal').classList.add('hidden');
    currentEdit = null;
  };

  const calcularPrecios = () => {
    const coste = parseFloat(document.getElementById('p_costeUnidad').value) || 0;
    const margen = parseFloat(document.getElementById('p_margen').value) || 0;
    if (coste && margen) {
      const pvp = coste * (1 + margen / 100);
      document.getElementById('p_precioVenta').value = pvp.toFixed(2);
    }
  };

  const save = async () => {
    const nombre = document.getElementById('p_nombre').value.trim();
    if (!nombre) { App.toast('El nombre es obligatorio', 'error'); return; }

    const data = {
      nombre,
      tipo: document.getElementById('p_tipo').value,
      concentracion: parseFloat(document.getElementById('p_concentracion').value) || null,
      lote: document.getElementById('p_lote').value.trim(),
      caducidad: document.getElementById('p_caducidad').value,
      stock: parseFloat(document.getElementById('p_stock').value) ?? null,
      unidad: document.getElementById('p_unidad').value,
      stockMin: parseFloat(document.getElementById('p_stockMin').value) || null,
      costeUnidad: parseFloat(document.getElementById('p_costeUnidad').value) || null,
      precioVenta: parseFloat(document.getElementById('p_precioVenta').value) || null,
      margen: parseFloat(document.getElementById('p_margen').value) || null,
      proveedor: document.getElementById('p_proveedor').value.trim(),
      observaciones: document.getElementById('p_observaciones').value.trim(),
    };

    if (currentEdit) {
      await DB.update('productos', { ...data, id: currentEdit });
      App.toast('Producto actualizado', 'success');
    } else {
      await DB.add('productos', data);
      App.toast('Producto creado', 'success');
    }

    closeForm();
    load();
    App.refreshDashboard();
  };

  const openStock = async (id) => {
    stockEditId = id;
    const p = await DB.getById('productos', id);
    if (!p) return;
    document.getElementById('stock_prod_nombre').textContent = `${p.nombre} — Stock actual: ${p.stock ?? 0} ${p.unidad || ''}`;
    document.getElementById('stock_cantidad').value = '';
    document.getElementById('stock_motivo').value = '';
    document.getElementById('stock_op').value = 'add';
    document.getElementById('stockModal').classList.remove('hidden');
  };

  const confirmarStock = async () => {
    if (!stockEditId) return;
    const p = await DB.getById('productos', stockEditId);
    if (!p) return;

    const op = document.getElementById('stock_op').value;
    const cant = parseFloat(document.getElementById('stock_cantidad').value) || 0;
    let nuevoStock = p.stock ?? 0;

    if (op === 'add') nuevoStock += cant;
    else if (op === 'sub') nuevoStock = Math.max(0, nuevoStock - cant);
    else nuevoStock = cant;

    await DB.update('productos', { ...p, stock: nuevoStock });
    document.getElementById('stockModal').classList.add('hidden');
    App.toast(`Stock actualizado: ${nuevoStock} ${p.unidad || ''}`, 'success');
    load();
    App.refreshDashboard();
  };

  const eliminar = (id) => {
    App.confirm('¿Eliminar este producto?', async () => {
      await DB.remove('productos', id);
      App.toast('Producto eliminado', 'info');
      load();
      App.refreshDashboard();
    });
  };

  return { render, load, search, openForm, closeForm, calcularPrecios, save, openStock, confirmarStock, eliminar };
})();

window.ProductosModule = ProductosModule;
