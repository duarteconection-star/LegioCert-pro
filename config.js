/**
 * LegioCert Pro - Módulo de Configuración actualizado
 * Añadido campo Nº Registro Sanitario empresa aplicadora
 */

const ConfigModule = (() => {
  const render = () => `
    <div class="module-header">
      <h2><i class="icon">⚙️</i> Configuración</h2>
    </div>
    <div class="config-sections">
      <div class="config-section">
        <h3>🏢 Empresa aplicadora</h3>
        <p class="text-muted" style="margin-bottom:14px;font-size:13px">Estos datos aparecerán en todos los certificados.</p>
        <div class="form-grid">
          <div class="form-group form-full">
            <label>Nombre de la empresa *</label>
            <input type="text" id="cfg_empresa" placeholder="Duarte Conection">
          </div>
          <div class="form-group">
            <label>CIF *</label>
            <input type="text" id="cfg_cif" placeholder="B12345678">
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" id="cfg_telefono" placeholder="600 000 000">
          </div>
          <div class="form-group form-full">
            <label>Email</label>
            <input type="email" id="cfg_email" placeholder="empresa@email.com">
          </div>
          <div class="form-group form-full">
            <label>Dirección</label>
            <input type="text" id="cfg_direccion" placeholder="Calle, número, ciudad, CP">
          </div>
          <div class="form-group form-full">
            <label>Nº Registro Sanitario / Empresa habilitada (opcional)</label>
            <input type="text" id="cfg_registro" placeholder="Ej: AND-CA-0001 o número de autorización">
          </div>
          <div class="form-group form-full">
            <label>Nombre del técnico por defecto</label>
            <input type="text" id="cfg_tecnico" placeholder="Nombre del técnico responsable">
          </div>
        </div>
        <button class="btn btn-primary" onclick="ConfigModule.guardarEmpresa()">💾 Guardar datos de empresa</button>
      </div>

      <div class="config-section">
        <h3>💶 Tarifas por defecto</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Precio hora de trabajo (€)</label>
            <input type="number" id="cfg_precioHora" placeholder="35" step="0.5">
          </div>
          <div class="form-group">
            <label>Precio por km (€)</label>
            <input type="number" id="cfg_precioKm" placeholder="0.35" step="0.01">
          </div>
          <div class="form-group">
            <label>Margen por defecto (%)</label>
            <input type="number" id="cfg_margen" placeholder="30" step="1">
          </div>
        </div>
        <button class="btn btn-primary" onclick="ConfigModule.guardarTarifas()">💾 Guardar tarifas</button>
      </div>

      <div class="config-section">
        <h3>🌙 Apariencia</h3>
        <div class="form-group">
          <label>Tema</label>
          <select id="cfg_tema" onchange="ConfigModule.cambiarTema(this.value)">
            <option value="dark">Oscuro</option>
            <option value="light">Claro</option>
          </select>
        </div>
      </div>

      <div class="config-section">
        <h3>💾 Copia de seguridad</h3>
        <p class="text-muted" style="margin-bottom:12px">Exporta o importa todos los datos de la aplicación.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="App.exportarBackup()">📤 Exportar backup</button>
          <label class="btn btn-ghost">
            📥 Importar backup
            <input type="file" accept=".json" onchange="App.importarBackup(this.files[0])" style="display:none">
          </label>
        </div>
      </div>

      <div class="config-section danger-zone">
        <h3>⚠️ Zona peligrosa</h3>
        <p class="text-muted" style="margin-bottom:12px">Esta acción no se puede deshacer.</p>
        <button class="btn btn-danger" onclick="ConfigModule.borrarTodo()">🗑️ Borrar todos los datos</button>
      </div>

      <div class="config-section">
        <h3>ℹ️ Acerca de</h3>
        <p><strong>LegioCert Pro</strong> v${CONFIG.APP_VERSION}</p>
        <p class="text-muted">${CONFIG.APP_AUTHOR} · ${CONFIG.APP_EMAIL}</p>
        <p class="text-muted" style="margin-top:6px">Normativa: ${CONFIG.NORMATIVA.RD_487} · ${CONFIG.NORMATIVA.RD_614} · ${CONFIG.NORMATIVA.UNE}</p>
      </div>
    </div>
  `;

  const load = async () => {
    const campos = ['empresa','cif','telefono','email','direccion','registro','tecnico','precioHora','precioKm','margen','tema'];
    for (const campo of campos) {
      const val = await DB.getConfig(`cfg_${campo}`);
      const el = document.getElementById(`cfg_${campo}`);
      if (el && val !== null) el.value = val;
    }
    const tema = await DB.getConfig('cfg_tema') || 'dark';
    document.documentElement.setAttribute('data-theme', tema);
    const select = document.getElementById('cfg_tema');
    if (select) select.value = tema;
  };

  const guardarEmpresa = async () => {
    const campos = ['empresa','cif','telefono','email','direccion','registro','tecnico'];
    for (const c of campos) {
      const val = document.getElementById(`cfg_${c}`)?.value || '';
      await DB.setConfig(`cfg_${c}`, val);
      if (c === 'empresa') CONFIG.PDF.EMPRESA = val;
      if (c === 'email') CONFIG.PDF.EMAIL_EMPRESA = val;
      if (c === 'telefono') CONFIG.PDF.TELEFONO_EMPRESA = val;
      if (c === 'tecnico') await DB.setConfig('tecnico_nombre', val);
    }
    App.toast('Datos de empresa guardados', 'success');
  };

  const guardarTarifas = async () => {
    const ph = parseFloat(document.getElementById('cfg_precioHora')?.value) || CONFIG.COSTES.MANO_OBRA_HORA;
    const km = parseFloat(document.getElementById('cfg_precioKm')?.value) || CONFIG.COSTES.DESPLAZAMIENTO_KM;
    const mg = parseFloat(document.getElementById('cfg_margen')?.value) || CONFIG.COSTES.MARGEN_DEFECTO;
    await DB.setConfig('cfg_precioHora', ph);
    await DB.setConfig('cfg_precioKm', km);
    await DB.setConfig('cfg_margen', mg);
    CONFIG.COSTES.MANO_OBRA_HORA = ph;
    CONFIG.COSTES.DESPLAZAMIENTO_KM = km;
    CONFIG.COSTES.MARGEN_DEFECTO = mg;
    App.toast('Tarifas guardadas', 'success');
  };

  const cambiarTema = async (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    await DB.setConfig('cfg_tema', tema);
  };

  const borrarTodo = () => {
    App.confirm('¿Borrar TODOS los datos? Esta acción es IRREVERSIBLE.', async () => {
      const stores = ['clientes','instalaciones','tratamientos','certificados','productos','agenda','fotos'];
      for (const s of stores) {
        const items = await DB.getAll(s);
        for (const item of items) await DB.remove(s, item.id);
      }
      App.toast('Todos los datos han sido eliminados', 'info');
      App.navigate('dashboard');
    });
  };

  return { render, load, guardarEmpresa, guardarTarifas, cambiarTema, borrarTodo };
})();

window.ConfigModule = ConfigModule;
