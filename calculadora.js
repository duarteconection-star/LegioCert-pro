/**
 * LegioCert Pro - Calculadora Profesional
 * Cálculos de cloro, dióxido de cloro, conversiones de volumen
 */

const CalculadoraModule = (() => {
  const render = () => `
    <div class="module-header">
      <h2><i class="icon">🧮</i> Calculadora Profesional</h2>
    </div>
    <div class="calc-tabs">
      <button class="calc-tab active" onclick="CalculadoraModule.switchTab('cloro', this)">Cloro</button>
      <button class="calc-tab" onclick="CalculadoraModule.switchTab('dioxido', this)">Dióxido de Cl.</button>
      <button class="calc-tab" onclick="CalculadoraModule.switchTab('conversion', this)">Conversiones</button>
      <button class="calc-tab" onclick="CalculadoraModule.switchTab('ppm', this)">ppm / mg·L</button>
    </div>

    <!-- CLORO -->
    <div id="tab-cloro" class="calc-panel active">
      <div class="calc-section">
        <h3>Parámetros del Sistema</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Volumen del sistema</label>
            <div class="input-with-unit">
              <input type="number" id="calc_volumen" placeholder="0" min="0" oninput="CalculadoraModule.calcularCloro()">
              <select id="calc_vol_unidad" onchange="CalculadoraModule.calcularCloro()">
                <option value="L">Litros</option>
                <option value="m3">m³</option>
                <option value="gal">Galones</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Concentración objetivo (ppm)</label>
            <input type="number" id="calc_ppm_objetivo" placeholder="Ej: 20" min="0" oninput="CalculadoraModule.calcularCloro()">
          </div>
          <div class="form-group">
            <label>Cloro residual actual (ppm)</label>
            <input type="number" id="calc_cloro_actual" placeholder="0" min="0" value="0" oninput="CalculadoraModule.calcularCloro()">
          </div>
          <div class="form-group">
            <label>Producto a utilizar</label>
            <select id="calc_producto" onchange="CalculadoraModule.calcularCloro()">
              <option value="CLORO_GRANULADO">Cloro granulado (65%)</option>
              <option value="HIPOCLORITO_SODICO">Hipoclorito sódico (12%)</option>
              <option value="HIPOCLORITO_20">Hipoclorito sódico (20%)</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>
          <div class="form-group" id="calc_custom_conc_row" style="display:none">
            <label>Concentración del producto (%)</label>
            <input type="number" id="calc_custom_conc" placeholder="0" min="0" max="100" oninput="CalculadoraModule.calcularCloro()">
          </div>
        </div>
        <div class="protocol-buttons">
          <p>Protocolos rápidos:</p>
          <button class="btn btn-protocol" onclick="CalculadoraModule.setProtocol(20)">
            🟡 20 ppm<br><small>Mantenimiento</small>
          </button>
          <button class="btn btn-protocol" onclick="CalculadoraModule.setProtocol(50)">
            🟠 50 ppm<br><small>Preventivo</small>
          </button>
          <button class="btn btn-protocol" onclick="CalculadoraModule.setProtocol(150)">
            🔴 150 ppm<br><small>Choque</small>
          </button>
        </div>
      </div>
      <div class="calc-results" id="calc_resultado_cloro">
        <div class="result-placeholder">Introduce los datos para calcular</div>
      </div>
    </div>

    <!-- DIÓXIDO DE CLORO -->
    <div id="tab-dioxido" class="calc-panel hidden">
      <div class="calc-section">
        <h3>Dióxido de Cloro</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Volumen del sistema (L)</label>
            <input type="number" id="dio_volumen" placeholder="0" oninput="CalculadoraModule.calcularDioxido()">
          </div>
          <div class="form-group">
            <label>Concentración objetivo (ppm)</label>
            <input type="number" id="dio_ppm" placeholder="Ej: 0.5" step="0.1" oninput="CalculadoraModule.calcularDioxido()">
          </div>
          <div class="form-group">
            <label>Concentración del producto (%)</label>
            <input type="number" id="dio_conc" placeholder="0.3" value="0.3" step="0.01" oninput="CalculadoraModule.calcularDioxido()">
          </div>
        </div>
      </div>
      <div class="calc-results" id="calc_resultado_dioxido">
        <div class="result-placeholder">Introduce los datos para calcular</div>
      </div>
    </div>

    <!-- CONVERSIONES -->
    <div id="tab-conversion" class="calc-panel hidden">
      <div class="calc-section">
        <h3>Conversión de Volumen</h3>
        <div class="form-group">
          <label>Valor</label>
          <input type="number" id="conv_valor" placeholder="0" oninput="CalculadoraModule.convertir()">
        </div>
        <div class="form-group">
          <label>Unidad origen</label>
          <select id="conv_desde" onchange="CalculadoraModule.convertir()">
            <option value="L">Litros (L)</option>
            <option value="m3">Metros cúbicos (m³)</option>
            <option value="gal">Galones (gal)</option>
          </select>
        </div>
        <div id="conv_resultado" class="conv-result-grid"></div>
      </div>
      <div class="calc-section">
        <h3>Conversión Cloro Libre / Combinado</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Cloro libre (ppm)</label>
            <input type="number" id="clib" placeholder="0" step="0.01" oninput="CalculadoraModule.calcularCloroTotal()">
          </div>
          <div class="form-group">
            <label>Cloro combinado (ppm)</label>
            <input type="number" id="ccomb" placeholder="0" step="0.01" oninput="CalculadoraModule.calcularCloroTotal()">
          </div>
        </div>
        <div id="cloro_total_result" class="result-box"></div>
      </div>
    </div>

    <!-- ppm / mg·L -->
    <div id="tab-ppm" class="calc-panel hidden">
      <div class="calc-section">
        <h3>Conversión ppm ↔ mg/L</h3>
        <div class="info-box">
          Para soluciones acuosas diluidas: <strong>1 ppm = 1 mg/L</strong> (densidad ≈ 1 kg/L)
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Valor en ppm</label>
            <input type="number" id="ppm_valor" placeholder="0" step="0.01" oninput="CalculadoraModule.convertirPPM('ppm')">
          </div>
          <div class="form-group">
            <label>Valor en mg/L</label>
            <input type="number" id="mgl_valor" placeholder="0" step="0.01" oninput="CalculadoraModule.convertirPPM('mgl')">
          </div>
        </div>
        <div id="ppm_result" class="result-box"></div>
      </div>
      <div class="calc-section">
        <h3>Ratio de Dilución</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Volumen total (L)</label>
            <input type="number" id="dil_total" placeholder="0" oninput="CalculadoraModule.calcularDilucion()">
          </div>
          <div class="form-group">
            <label>ppm deseadas</label>
            <input type="number" id="dil_ppm" placeholder="0" oninput="CalculadoraModule.calcularDilucion()">
          </div>
          <div class="form-group">
            <label>Concentración producto (%)</label>
            <input type="number" id="dil_conc" placeholder="12" oninput="CalculadoraModule.calcularDilucion()">
          </div>
        </div>
        <div id="dil_result" class="result-box"></div>
      </div>
    </div>
  `;

  const load = () => {};

  const switchTab = (tab, btn) => {
    document.querySelectorAll('.calc-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.calc-panel').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
    btn.classList.add('active');
    const panel = document.getElementById(`tab-${tab}`);
    if (panel) { panel.classList.remove('hidden'); panel.classList.add('active'); }
  };

  const setProtocol = (ppm) => {
    document.getElementById('calc_ppm_objetivo').value = ppm;
    calcularCloro();
    App.toast(`Protocolo ${ppm} ppm seleccionado`, 'info');
  };

  const calcularCloro = () => {
    const volRaw = parseFloat(document.getElementById('calc_volumen').value) || 0;
    const unidad = document.getElementById('calc_vol_unidad').value;
    const ppmObj = parseFloat(document.getElementById('calc_ppm_objetivo').value) || 0;
    const ppmActual = parseFloat(document.getElementById('calc_cloro_actual').value) || 0;
    const producto = document.getElementById('calc_producto').value;

    // Mostrar/ocultar campo custom
    document.getElementById('calc_custom_conc_row').style.display = producto === 'CUSTOM' ? 'block' : 'none';

    const resultDiv = document.getElementById('calc_resultado_cloro');
    if (!volRaw || !ppmObj) {
      resultDiv.innerHTML = '<div class="result-placeholder">Introduce volumen y concentración objetivo</div>';
      return;
    }

    // Convertir a litros
    let volLitros = volRaw;
    if (unidad === 'm3') volLitros = volRaw * 1000;
    if (unidad === 'gal') volLitros = volRaw * CONFIG.CONVERSIONES.GAL_A_L;

    const ppmNecesaria = Math.max(0, ppmObj - ppmActual);
    // g Cl2 necesarios = ppm * L / 1000 (porque 1 ppm = 1 mg/L = 1 g/m³)
    const grClNecesario = (ppmNecesaria * volLitros) / 1000; // en gramos de Cl2

    let cantidadProducto, nombreProducto, unidadProducto, concentracion;

    switch (producto) {
      case 'CLORO_GRANULADO':
        concentracion = 0.65;
        nombreProducto = 'Cloro granulado (65%)';
        unidadProducto = 'gramos';
        cantidadProducto = grClNecesario / concentracion;
        break;
      case 'HIPOCLORITO_SODICO':
        concentracion = 0.12;
        nombreProducto = 'Hipoclorito sódico (12%)';
        unidadProducto = 'mL';
        // Hipoclorito: g Cl2 / (conc * densidad)
        cantidadProducto = (grClNecesario / (concentracion * 1.21)) * 1; // en mL (densidad ≈1.21)
        // ajuste: mL = g / (g/mL) = g / (conc * densidad_g_mL)
        cantidadProducto = grClNecesario / (concentracion * 1.21) * 1000 / 1000;
        cantidadProducto = (grClNecesario / (concentracion * 1.21)); // en mL
        break;
      case 'HIPOCLORITO_20':
        concentracion = 0.20;
        nombreProducto = 'Hipoclorito sódico (20%)';
        unidadProducto = 'mL';
        cantidadProducto = grClNecesario / (concentracion * 1.25);
        break;
      case 'CUSTOM':
        const customConc = (parseFloat(document.getElementById('calc_custom_conc').value) || 0) / 100;
        if (!customConc) { resultDiv.innerHTML = '<div class="result-placeholder">Introduce la concentración del producto</div>'; return; }
        concentracion = customConc;
        nombreProducto = `Producto personalizado (${(customConc*100).toFixed(1)}%)`;
        unidadProducto = 'g';
        cantidadProducto = grClNecesario / concentracion;
        break;
    }

    const tiempoContacto = getTiempoContacto(ppmObj);
    const volM3 = volLitros / 1000;
    const volGal = volLitros * CONFIG.CONVERSIONES.L_A_GAL;

    const esCloroGranulado = producto === 'CLORO_GRANULADO';
    const cantidadDisplay = esCloroGranulado
      ? `${cantidadProducto.toFixed(2)} g (${(cantidadProducto/1000).toFixed(4)} kg)`
      : `${cantidadProducto.toFixed(1)} mL (${(cantidadProducto/1000).toFixed(4)} L)`;

    resultDiv.innerHTML = `
      <div class="result-card primary">
        <div class="result-label">Cantidad de ${nombreProducto}</div>
        <div class="result-value">${cantidadDisplay}</div>
      </div>
      <div class="result-grid">
        <div class="result-card">
          <div class="result-label">Volumen del sistema</div>
          <div class="result-value">${volLitros.toLocaleString('es-ES', {maximumFractionDigits:1})} L</div>
          <div class="result-sub">${volM3.toFixed(3)} m³ · ${volGal.toFixed(1)} gal</div>
        </div>
        <div class="result-card">
          <div class="result-label">Cloro Cl₂ necesario</div>
          <div class="result-value">${grClNecesario.toFixed(2)} g</div>
          <div class="result-sub">Δ ppm: ${ppmActual} → ${ppmObj}</div>
        </div>
        <div class="result-card">
          <div class="result-label">Tiempo de contacto</div>
          <div class="result-value">${tiempoContacto.horas} h</div>
          <div class="result-sub">${tiempoContacto.descripcion}</div>
        </div>
        <div class="result-card ${ppmObj >= 150 ? 'danger' : ppmObj >= 50 ? 'warning' : 'success'}">
          <div class="result-label">Nivel de actuación</div>
          <div class="result-value">${ppmObj} ppm</div>
          <div class="result-sub">${tiempoContacto.protocolo}</div>
        </div>
      </div>
      <div class="calc-nota">
        <strong>⚠️ Nota:</strong> Verificar pH entre 6.5 y 8.0 para máxima eficacia del cloro. 
        pH óptimo 7.0–7.6. A pH > 8.0 la eficacia cae drásticamente.
      </div>
    `;
  };

  const getTiempoContacto = (ppm) => {
    if (ppm >= 150) return { horas: 12, descripcion: 'Choque por positivo Legionella', protocolo: 'Choque intensivo' };
    if (ppm >= 50) return { horas: 6, descripcion: 'Desinfección preventiva', protocolo: 'Preventivo' };
    return { horas: 2, descripcion: 'Choque de mantenimiento', protocolo: 'Mantenimiento' };
  };

  const calcularDioxido = () => {
    const vol = parseFloat(document.getElementById('dio_volumen').value) || 0;
    const ppm = parseFloat(document.getElementById('dio_ppm').value) || 0;
    const conc = (parseFloat(document.getElementById('dio_conc').value) || 0.3) / 100;
    const resultDiv = document.getElementById('calc_resultado_dioxido');

    if (!vol || !ppm) {
      resultDiv.innerHTML = '<div class="result-placeholder">Introduce los datos para calcular</div>';
      return;
    }

    // mg ClO2 = ppm * L (1 ppm = 1 mg/L)
    const mgClO2 = ppm * vol;
    // mL producto = mg / (conc% * 1000 mg/mL * densidad≈1)
    const mLProducto = mgClO2 / (conc * 1000);

    resultDiv.innerHTML = `
      <div class="result-card primary">
        <div class="result-label">Dióxido de Cloro necesario</div>
        <div class="result-value">${mLProducto.toFixed(2)} mL</div>
        <div class="result-sub">Producto al ${(conc*100).toFixed(2)}%</div>
      </div>
      <div class="result-grid">
        <div class="result-card">
          <div class="result-label">ClO₂ puro requerido</div>
          <div class="result-value">${mgClO2.toFixed(2)} mg</div>
          <div class="result-sub">${(mgClO2/1000).toFixed(4)} g</div>
        </div>
        <div class="result-card">
          <div class="result-label">Concentración objetivo</div>
          <div class="result-value">${ppm} ppm</div>
          <div class="result-sub">Para ${vol.toLocaleString('es-ES')} L</div>
        </div>
      </div>
      <div class="calc-nota">
        <strong>Dióxido de Cloro:</strong> Efectivo en rango pH 5–10. 
        Tiempo de contacto mínimo recomendado: 30 min a 0.5 ppm.
      </div>
    `;
  };

  const convertir = () => {
    const valor = parseFloat(document.getElementById('conv_valor').value) || 0;
    const desde = document.getElementById('conv_desde').value;
    const resultDiv = document.getElementById('conv_resultado');

    let litros;
    if (desde === 'L') litros = valor;
    else if (desde === 'm3') litros = valor * 1000;
    else litros = valor * CONFIG.CONVERSIONES.GAL_A_L;

    const m3 = litros / 1000;
    const gal = litros * CONFIG.CONVERSIONES.L_A_GAL;

    resultDiv.innerHTML = `
      <div class="conv-row"><span>Litros:</span><strong>${litros.toLocaleString('es-ES', {maximumFractionDigits:4})} L</strong></div>
      <div class="conv-row"><span>Metros cúbicos:</span><strong>${m3.toFixed(6)} m³</strong></div>
      <div class="conv-row"><span>Galones (US):</span><strong>${gal.toFixed(4)} gal</strong></div>
    `;
  };

  const calcularCloroTotal = () => {
    const libre = parseFloat(document.getElementById('clib').value) || 0;
    const combinado = parseFloat(document.getElementById('ccomb').value) || 0;
    const total = libre + combinado;
    const ratio = libre > 0 ? (combinado / libre).toFixed(2) : '—';

    const estado = combinado > 0.5
      ? '<span class="badge badge-red">⚠️ Cloraminas elevadas – revisar</span>'
      : '<span class="badge badge-green">✅ Correcto</span>';

    document.getElementById('cloro_total_result').innerHTML = `
      <div class="conv-row"><span>Cloro total:</span><strong>${total.toFixed(2)} ppm</strong></div>
      <div class="conv-row"><span>Ratio combinado/libre:</span><strong>${ratio}</strong></div>
      <div class="conv-row"><span>Estado:</span>${estado}</div>
    `;
  };

  const convertirPPM = (desde) => {
    if (desde === 'ppm') {
      const ppm = parseFloat(document.getElementById('ppm_valor').value) || 0;
      document.getElementById('mgl_valor').value = ppm;
      document.getElementById('ppm_result').innerHTML = `<div class="conv-row"><span>${ppm} ppm</span><strong>= ${ppm} mg/L</strong></div>`;
    } else {
      const mgl = parseFloat(document.getElementById('mgl_valor').value) || 0;
      document.getElementById('ppm_valor').value = mgl;
      document.getElementById('ppm_result').innerHTML = `<div class="conv-row"><span>${mgl} mg/L</span><strong>= ${mgl} ppm</strong></div>`;
    }
  };

  const calcularDilucion = () => {
    const total = parseFloat(document.getElementById('dil_total').value) || 0;
    const ppm = parseFloat(document.getElementById('dil_ppm').value) || 0;
    const concPct = parseFloat(document.getElementById('dil_conc').value) || 0;
    if (!total || !ppm || !concPct) { document.getElementById('dil_result').innerHTML = ''; return; }

    const concDecimal = concPct / 100;
    const mgNecesarios = ppm * total;
    const mLProducto = mgNecesarios / (concDecimal * 1000);

    document.getElementById('dil_result').innerHTML = `
      <div class="conv-row"><span>Producto a añadir:</span><strong>${mLProducto.toFixed(2)} mL</strong></div>
      <div class="conv-row"><span>Agua a añadir:</span><strong>${(total - mLProducto/1000).toFixed(2)} L</strong></div>
    `;
  };

  return { render, load, switchTab, setProtocol, calcularCloro, calcularDioxido, convertir, calcularCloroTotal, convertirPPM, calcularDilucion };
})();

window.CalculadoraModule = CalculadoraModule;
