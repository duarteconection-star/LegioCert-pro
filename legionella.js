/**
 * LegioCert Pro - Módulo de Tratamientos Legionella
 * Registro completo de tratamientos con fotos, GPS y firmas
 */

const LegionellaModule = (() => {
  let currentTratamiento = null;
  let gpsData = null;
  let timerInterval = null;
  let timerStart = null;

  const render = (params = {}) => `
    <div class="module-header">
      <h2><i class="icon">🧪</i> Nuevo Tratamiento</h2>
    </div>
    <div class="tratamiento-form">

      <!-- DATOS GENERALES -->
      <div class="form-section">
        <h3 class="section-title">📋 Datos Generales</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Cliente *</label>
            <select id="t_clienteId" onchange="LegionellaModule.onClienteChange(this.value)" required>
              <option value="">Seleccionar cliente…</option>
            </select>
          </div>
          <div class="form-group">
            <label>Instalación *</label>
            <select id="t_instalacionId" required>
              <option value="">Primero selecciona cliente</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha *</label>
            <input type="date" id="t_fecha" required>
          </div>
          <div class="form-group">
            <label>Técnico responsable</label>
            <input type="text" id="t_tecnico" placeholder="Nombre del técnico">
          </div>
          <div class="form-group">
            <label>Tipo de tratamiento</label>
            <select id="t_tipo">
              <option value="mantenimiento">Mantenimiento preventivo</option>
              <option value="desinfeccion">Desinfección</option>
              <option value="choque">Choque por positivo Legionella</option>
              <option value="revision">Revisión</option>
              <option value="muestreo">Toma de muestras</option>
            </select>
          </div>
          <div class="form-group">
            <label>Normativa aplicada</label>
            <select id="t_normativa">
              <option value="RD487">RD 487/2022</option>
              <option value="RD614">RD 614/2024</option>
              <option value="UNE">UNE 100030</option>
            </select>
          </div>
        </div>
      </div>

      <!-- CRONOMETRO Y TIEMPOS -->
      <div class="form-section">
        <h3 class="section-title">⏱️ Tiempos</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Hora inicio</label>
            <input type="time" id="t_horaInicio">
            <button class="btn btn-sm btn-ghost" onclick="LegionellaModule.ahora('t_horaInicio')" style="margin-top:4px">Ahora</button>
          </div>
          <div class="form-group">
            <label>Hora fin</label>
            <input type="time" id="t_horaFin">
            <button class="btn btn-sm btn-ghost" onclick="LegionellaModule.ahora('t_horaFin')" style="margin-top:4px">Ahora</button>
          </div>
          <div class="form-group form-full">
            <div class="cronometro">
              <div id="cronometro_display" class="cronometro-display">00:00:00</div>
              <div class="cronometro-btns">
                <button class="btn btn-primary" onclick="LegionellaModule.iniciarCronometro()">▶ Iniciar</button>
                <button class="btn btn-ghost" onclick="LegionellaModule.pararCronometro()">⏹ Parar</button>
                <button class="btn btn-ghost" onclick="LegionellaModule.resetCronometro()">↺ Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PARÁMETROS ANALÍTICOS -->
      <div class="form-section">
        <h3 class="section-title">🔬 Parámetros Analíticos</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Temperatura (°C)</label>
            <input type="number" id="t_temperatura" placeholder="Ej: 60" step="0.1">
          </div>
          <div class="form-group">
            <label>pH inicial</label>
            <input type="number" id="t_phInicial" placeholder="Ej: 7.2" step="0.01" min="0" max="14">
          </div>
          <div class="form-group">
            <label>pH final</label>
            <input type="number" id="t_phFinal" placeholder="Ej: 7.0" step="0.01" min="0" max="14">
          </div>
          <div class="form-group">
            <label>Cloro libre inicial (ppm)</label>
            <input type="number" id="t_cloroLibreInicial" placeholder="0" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>Cloro libre final (ppm)</label>
            <input type="number" id="t_cloroLibreFinal" placeholder="0" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>Cloro combinado (ppm)</label>
            <input type="number" id="t_cloroCombinado" placeholder="0" step="0.01" min="0">
          </div>
        </div>
      </div>

      <!-- PRODUCTO -->
      <div class="form-section">
        <h3 class="section-title">🧴 Producto Utilizado</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Producto</label>
            <select id="t_producto" onchange="LegionellaModule.onProductoChange()">
              <option value="">Seleccionar producto…</option>
              <option value="Cloro granulado 65%">Cloro granulado 65%</option>
              <option value="Hipoclorito sódico 12%">Hipoclorito sódico 12%</option>
              <option value="Hipoclorito sódico 20%">Hipoclorito sódico 20%</option>
              <option value="Dióxido de cloro">Dióxido de cloro</option>
              <option value="custom">Otro (especificar)</option>
            </select>
          </div>
          <div class="form-group" id="t_producto_custom_row" style="display:none">
            <label>Nombre del producto</label>
            <input type="text" id="t_productoCustom" placeholder="Nombre del producto">
          </div>
          <div class="form-group">
            <label>Nº Lote</label>
            <input type="text" id="t_lote" placeholder="Ej: LOT-2024-001">
          </div>
          <div class="form-group">
            <label>Fecha caducidad</label>
            <input type="date" id="t_caducidad">
          </div>
          <div class="form-group">
            <label>Cantidad utilizada</label>
            <input type="number" id="t_cantidad" placeholder="0" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>Unidad</label>
            <select id="t_cantidadUnidad">
              <option value="g">Gramos (g)</option>
              <option value="kg">Kilogramos (kg)</option>
              <option value="mL">Mililitros (mL)</option>
              <option value="L">Litros (L)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Coste del producto (€)</label>
            <input type="number" id="t_costeProducto" placeholder="0.00" step="0.01" min="0">
          </div>
        </div>
      </div>

      <!-- COSTES -->
      <div class="form-section">
        <h3 class="section-title">💶 Costes del Servicio</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Horas de trabajo</label>
            <input type="number" id="t_horas" placeholder="0" step="0.5" min="0" oninput="LegionellaModule.calcularCoste()">
          </div>
          <div class="form-group">
            <label>Precio hora (€)</label>
            <input type="number" id="t_precioHora" value="${CONFIG.COSTES.MANO_OBRA_HORA}" step="0.5" oninput="LegionellaModule.calcularCoste()">
          </div>
          <div class="form-group">
            <label>Km desplazamiento</label>
            <input type="number" id="t_km" placeholder="0" step="1" min="0" oninput="LegionellaModule.calcularCoste()">
          </div>
          <div class="form-group">
            <label>Precio km (€)</label>
            <input type="number" id="t_precioKm" value="${CONFIG.COSTES.DESPLAZAMIENTO_KM}" step="0.01" oninput="LegionellaModule.calcularCoste()">
          </div>
          <div class="form-group">
            <label>Margen (%)</label>
            <input type="number" id="t_margen" value="${CONFIG.COSTES.MARGEN_DEFECTO}" step="1" min="0" oninput="LegionellaModule.calcularCoste()">
          </div>
        </div>
        <div id="coste_resumen" class="coste-resumen"></div>
      </div>

      <!-- OBSERVACIONES -->
      <div class="form-section">
        <h3 class="section-title">📝 Observaciones</h3>
        <textarea id="t_observaciones" rows="4" placeholder="Observaciones del tratamiento…" class="textarea-full"></textarea>
      </div>

      <!-- FOTOGRAFÍAS -->
      <div class="form-section">
        <h3 class="section-title">📸 Fotografías</h3>
        <div id="fotos_container"></div>
      </div>

      <!-- GPS -->
      <div class="form-section">
        <h3 class="section-title">📍 Ubicación GPS</h3>
        <div id="gps_container"></div>
      </div>

      <!-- FIRMAS -->
      <div class="form-section">
        <h3 class="section-title">✍️ Firmas</h3>
        <div class="firmas-grid">
          <div>
            <label class="firma-label-titulo">Técnico</label>
            <div id="firma_tecnico"></div>
          </div>
          <div>
            <label class="firma-label-titulo">Cliente</label>
            <div id="firma_cliente"></div>
          </div>
        </div>
      </div>

      <!-- BOTONES -->
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="App.navigate('historial')">Cancelar</button>
        <button class="btn btn-secondary" onclick="LegionellaModule.guardar(false)">
          💾 Guardar borrador
        </button>
        <button class="btn btn-primary" onclick="LegionellaModule.guardar(true)">
          📄 Guardar y generar certificado
        </button>
      </div>
    </div>
  `;

  const load = async (params = {}) => {
    // Fecha de hoy por defecto
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('t_fecha').value = hoy;
    const ahora = new Date().toTimeString().slice(0, 5);
    document.getElementById('t_horaInicio').value = ahora;

    // Poblar select de clientes
    const clientes = await DB.getAll('clientes');
    const selCliente = document.getElementById('t_clienteId');
    selCliente.innerHTML = '<option value="">Seleccionar cliente…</option>' +
      clientes.map(c => `<option value="${c.id}">${c.nombre}${c.empresa ? ` – ${c.empresa}` : ''}</option>`).join('');

    // Si viene con params
    if (params.instalacionId) {
      const inst = await DB.getById('instalaciones', params.instalacionId);
      if (inst) {
        selCliente.value = inst.clienteId;
        await onClienteChange(inst.clienteId);
        document.getElementById('t_instalacionId').value = inst.id;
      }
    }

    if (params.tratamientoId) {
      await cargarTratamiento(params.tratamientoId);
    }

    // Inicializar widgets
    FotosModule.render('fotos_container');
    GPSModule.renderWidget('gps_container');
    FirmaModule.crear('firma_tecnico', 'Firma del técnico');
    FirmaModule.crear('firma_cliente', 'Firma del cliente');

    // Técnico por defecto
    const tecnicoDefault = await DB.getConfig('tecnico_nombre');
    if (tecnicoDefault) document.getElementById('t_tecnico').value = tecnicoDefault;
  };

  const onClienteChange = async (clienteId) => {
    const selInst = document.getElementById('t_instalacionId');
    if (!clienteId) {
      selInst.innerHTML = '<option value="">Primero selecciona cliente</option>';
      return;
    }
    const instalaciones = await DB.getAll('instalaciones', 'clienteId', parseInt(clienteId));
    selInst.innerHTML = '<option value="">Seleccionar instalación…</option>' +
      instalaciones.map(i => `<option value="${i.id}">${i.nombre || i.tipo}${i.volumen ? ` (${i.volumen}L)` : ''}</option>`).join('');
  };

  const onProductoChange = () => {
    const v = document.getElementById('t_producto').value;
    document.getElementById('t_producto_custom_row').style.display = v === 'custom' ? 'block' : 'none';
  };

  const ahora = (fieldId) => {
    document.getElementById(fieldId).value = new Date().toTimeString().slice(0, 5);
  };

  // Cronómetro
  let _timerSeconds = 0;
  const iniciarCronometro = () => {
    if (timerInterval) return;
    timerStart = Date.now() - _timerSeconds * 1000;
    timerInterval = setInterval(() => {
      _timerSeconds = Math.floor((Date.now() - timerStart) / 1000);
      const h = String(Math.floor(_timerSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((_timerSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(_timerSeconds % 60).padStart(2, '0');
      const el = document.getElementById('cronometro_display');
      if (el) el.textContent = `${h}:${m}:${s}`;
    }, 1000);
    ahora('t_horaInicio');
  };

  const pararCronometro = () => {
    clearInterval(timerInterval); timerInterval = null;
    ahora('t_horaFin');
  };

  const resetCronometro = () => {
    clearInterval(timerInterval); timerInterval = null; _timerSeconds = 0;
    const el = document.getElementById('cronometro_display');
    if (el) el.textContent = '00:00:00';
  };

  const calcularCoste = () => {
    const horas = parseFloat(document.getElementById('t_horas').value) || 0;
    const precioHora = parseFloat(document.getElementById('t_precioHora').value) || 0;
    const km = parseFloat(document.getElementById('t_km').value) || 0;
    const precioKm = parseFloat(document.getElementById('t_precioKm').value) || 0;
    const margen = parseFloat(document.getElementById('t_margen').value) || 0;
    const costeProducto = parseFloat(document.getElementById('t_costeProducto').value) || 0;

    const manoObra = horas * precioHora;
    const desplazamiento = km * precioKm;
    const subtotal = manoObra + desplazamiento + costeProducto;
    const margenEuros = subtotal * (margen / 100);
    const total = subtotal + margenEuros;
    const beneficio = margenEuros;

    const el = document.getElementById('coste_resumen');
    if (el && (horas || km || costeProducto)) {
      el.innerHTML = `
        <div class="coste-fila"><span>Mano de obra (${horas}h × ${precioHora}€)</span><strong>${manoObra.toFixed(2)} €</strong></div>
        <div class="coste-fila"><span>Desplazamiento (${km}km × ${precioKm}€)</span><strong>${desplazamiento.toFixed(2)} €</strong></div>
        <div class="coste-fila"><span>Producto</span><strong>${costeProducto.toFixed(2)} €</strong></div>
        <div class="coste-fila"><span>Margen (${margen}%)</span><strong>${margenEuros.toFixed(2)} €</strong></div>
        <div class="coste-fila total"><span>TOTAL</span><strong>${total.toFixed(2)} €</strong></div>
        <div class="coste-fila beneficio"><span>Beneficio estimado</span><strong>${beneficio.toFixed(2)} €</strong></div>
      `;
    }
  };

  const cargarTratamiento = async (id) => {
    const t = await DB.getById('tratamientos', id);
    if (!t) return;
    currentTratamiento = t;
    // Rellenar campos...
    ['fecha','horaInicio','horaFin','temperatura','phInicial','phFinal',
     'cloroLibreInicial','cloroLibreFinal','cloroCombinado','lote','cantidad',
     'costeProducto','horas','km','margen','observaciones','tecnico'].forEach(f => {
      const el = document.getElementById(`t_${f}`);
      if (el && t[f] !== undefined) el.value = t[f];
    });
    if (t.producto) document.getElementById('t_producto').value = t.producto;
    if (t.normativa) document.getElementById('t_normativa').value = t.normativa;
    if (t.tipo) document.getElementById('t_tipo').value = t.tipo;
    if (t.fotos) FotosModule.cargarFotos(t.fotos);
  };

  const recogerDatos = () => {
    const productoVal = document.getElementById('t_producto').value;
    const productoNombre = productoVal === 'custom'
      ? document.getElementById('t_productoCustom').value
      : productoVal;

    return {
      clienteId: parseInt(document.getElementById('t_clienteId').value) || null,
      instalacionId: parseInt(document.getElementById('t_instalacionId').value) || null,
      fecha: document.getElementById('t_fecha').value,
      horaInicio: document.getElementById('t_horaInicio').value,
      horaFin: document.getElementById('t_horaFin').value,
      duracionSegundos: _timerSeconds,
      tecnico: document.getElementById('t_tecnico').value.trim(),
      tipo: document.getElementById('t_tipo').value,
      normativa: document.getElementById('t_normativa').value,
      temperatura: parseFloat(document.getElementById('t_temperatura').value) || null,
      phInicial: parseFloat(document.getElementById('t_phInicial').value) || null,
      phFinal: parseFloat(document.getElementById('t_phFinal').value) || null,
      cloroLibreInicial: parseFloat(document.getElementById('t_cloroLibreInicial').value) || null,
      cloroLibreFinal: parseFloat(document.getElementById('t_cloroLibreFinal').value) || null,
      cloroCombinado: parseFloat(document.getElementById('t_cloroCombinado').value) || null,
      producto: productoNombre,
      lote: document.getElementById('t_lote').value.trim(),
      caducidad: document.getElementById('t_caducidad').value,
      cantidad: parseFloat(document.getElementById('t_cantidad').value) || null,
      cantidadUnidad: document.getElementById('t_cantidadUnidad').value,
      costeProducto: parseFloat(document.getElementById('t_costeProducto').value) || 0,
      horas: parseFloat(document.getElementById('t_horas').value) || 0,
      precioHora: parseFloat(document.getElementById('t_precioHora').value) || 0,
      km: parseFloat(document.getElementById('t_km').value) || 0,
      precioKm: parseFloat(document.getElementById('t_precioKm').value) || 0,
      margen: parseFloat(document.getElementById('t_margen').value) || 0,
      observaciones: document.getElementById('t_observaciones').value.trim(),
      fotos: FotosModule.obtenerFotos(),
      firmaTecnico: FirmaModule.obtenerImagen('firma_tecnico'),
      firmaCliente: FirmaModule.obtenerImagen('firma_cliente'),
      gps: GPSModule.getLastPosition(),
    };
  };

  const guardar = async (generarCert) => {
    const datos = recogerDatos();

    if (!datos.clienteId || !datos.instalacionId) {
      App.toast('Selecciona cliente e instalación', 'error'); return;
    }
    if (!datos.fecha) {
      App.toast('Indica la fecha del tratamiento', 'error'); return;
    }

    let id;
    if (currentTratamiento) {
      await DB.update('tratamientos', { ...datos, id: currentTratamiento.id });
      id = currentTratamiento.id;
      App.toast('Tratamiento actualizado', 'success');
    } else {
      id = await DB.add('tratamientos', datos);
      App.toast('Tratamiento guardado', 'success');
    }

    if (generarCert) {
      await PDFModule.generarCertificado(id);
    } else {
      App.navigate('historial');
    }

    App.refreshDashboard();
  };

  return { render, load, onClienteChange, onProductoChange, ahora, iniciarCronometro, pararCronometro, resetCronometro, calcularCoste, guardar };
})();

window.LegionellaModule = LegionellaModule;
