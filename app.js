/**
 * LegioCert Pro - Núcleo de la Aplicación
 * Router, navegación, toast, confirm, y arranque PWA
 */

const App = (() => {
  let currentModule = null;
  let currentParams = {};

  // Mapa de módulos
  const MODULES = {
    dashboard:    { module: () => DashboardModule,    label: 'Dashboard',     icon: '📊' },
    clientes:     { module: () => ClientesModule,      label: 'Clientes',      icon: '👥' },
    instalaciones:{ module: () => InstalacionesModule, label: 'Instalaciones', icon: '🏢' },
    calculadora:  { module: () => CalculadoraModule,   label: 'Calculadora',   icon: '🧮' },
    legionella:   { module: () => LegionellaModule,    label: 'Tratamiento',   icon: '🧪' },
    historial:    { module: () => HistorialModule,     label: 'Historial',     icon: '📋' },
    agenda:       { module: () => AgendaModule,        label: 'Agenda',        icon: '📅' },
    productos:    { module: () => ProductosModule,     label: 'Productos',     icon: '🧴' },
    config:       { module: () => ConfigModule,        label: 'Configuración', icon: '⚙️' },
  };

  const NAV_ITEMS = ['dashboard','clientes','instalaciones','calculadora','legionella','historial','agenda','productos','config'];

  // ─── ARRANQUE ────────────────────────────────────────────────────────────────
  const init = async () => {
    try {
      await DB.init();
      buildLayout();
      await navigate('dashboard');
      registerSW();
      setupInstallPrompt();
    } catch (e) {
      console.error('Error iniciando LegioCert Pro:', e);
      document.body.innerHTML = `<div style="padding:40px;text-align:center;color:#e74c3c">
        <h2>Error al iniciar la aplicación</h2><p>${e.message}</p>
        <button onclick="location.reload()" style="margin-top:16px;padding:10px 24px">Reintentar</button>
      </div>`;
    }
  };

  // ─── LAYOUT ──────────────────────────────────────────────────────────────────
  const buildLayout = () => {
    document.body.innerHTML = `
      <div id="app-shell">
        <!-- SIDEBAR DESKTOP -->
        <aside id="sidebar" class="sidebar">
          <div class="sidebar-brand">
            <div class="brand-logo">LC</div>
            <div class="brand-text">
              <span class="brand-name">LegioCert</span>
              <span class="brand-sub">Pro</span>
            </div>
          </div>
          <nav class="sidebar-nav">
            ${NAV_ITEMS.map(key => {
              const m = MODULES[key];
              return `<button class="nav-item" id="nav_${key}" onclick="App.navigate('${key}')">
                <span class="nav-icon">${m.icon}</span>
                <span class="nav-label">${m.label}</span>
              </button>`;
            }).join('')}
          </nav>
          <div class="sidebar-footer">
            <span class="version-badge">v${CONFIG.APP_VERSION}</span>
          </div>
        </aside>

        <!-- MAIN -->
        <div id="main-wrapper">
          <!-- TOPBAR MOBILE -->
          <header class="topbar">
            <button class="hamburger" id="hamburger" onclick="App.toggleSidebar()">☰</button>
            <span class="topbar-title" id="topbar_title">LegioCert Pro</span>
            <div class="topbar-actions">
              <button class="btn-icon-top" onclick="App.navigate('legionella')" title="Nuevo tratamiento">🧪</button>
              <button class="btn-icon-top" id="installBtn" style="display:none" onclick="App.installPWA()" title="Instalar app">📲</button>
            </div>
          </header>

          <!-- CONTENIDO PRINCIPAL -->
          <main id="content" class="content"></main>

          <!-- BOTTOM NAV MOBILE -->
          <nav class="bottom-nav">
            <button class="bottom-nav-item" onclick="App.navigate('dashboard')">
              <span>📊</span><span>Inicio</span>
            </button>
            <button class="bottom-nav-item" onclick="App.navigate('clientes')">
              <span>👥</span><span>Clientes</span>
            </button>
            <button class="bottom-nav-item new-action" onclick="App.navigate('legionella')">
              <span>➕</span><span>Nuevo</span>
            </button>
            <button class="bottom-nav-item" onclick="App.navigate('historial')">
              <span>📋</span><span>Historial</span>
            </button>
            <button class="bottom-nav-item" onclick="App.navigate('calculadora')">
              <span>🧮</span><span>Calc.</span>
            </button>
          </nav>
        </div>

        <!-- OVERLAY SIDEBAR MOBILE -->
        <div id="sidebar-overlay" class="sidebar-overlay hidden" onclick="App.closeSidebar()"></div>

        <!-- TOAST -->
        <div id="toast-container" class="toast-container"></div>

        <!-- CONFIRM DIALOG -->
        <div id="confirmDialog" class="modal hidden">
          <div class="modal-backdrop"></div>
          <div class="modal-content" style="max-width:360px;text-align:center">
            <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
            <p id="confirmMessage" style="margin-bottom:20px;font-size:1rem;color:#333"></p>
            <div style="display:flex;gap:12px;justify-content:center">
              <button class="btn btn-ghost" id="confirmCancel">Cancelar</button>
              <button class="btn btn-danger" id="confirmOk">Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // ─── NAVEGACIÓN ───────────────────────────────────────────────────────────────
  const navigate = async (moduleName, params = {}) => {
    if (!MODULES[moduleName]) { console.warn('Módulo no encontrado:', moduleName); return; }

    currentModule = moduleName;
    currentParams = params;

    // Actualizar nav activo
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById(`nav_${moduleName}`);
    if (navBtn) navBtn.classList.add('active');

    // Título topbar
    const titulo = document.getElementById('topbar_title');
    if (titulo) titulo.textContent = MODULES[moduleName].label;

    // Renderizar contenido
    const content = document.getElementById('content');
    const mod = MODULES[moduleName].module();

    if (typeof mod.render === 'function') {
      content.innerHTML = mod.render(params);
    }

    // Scroll arriba
    content.scrollTop = 0;
    closeSidebar();

    // Cargar datos
    if (typeof mod.load === 'function') {
      await mod.load(params);
    }
  };

  // ─── SIDEBAR ──────────────────────────────────────────────────────────────────
  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');
  };

  const closeSidebar = () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
  };

  // ─── TOAST ───────────────────────────────────────────────────────────────────
  const toast = (message, type = 'info', duration = 3500) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(t);

    requestAnimationFrame(() => t.classList.add('show'));

    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 350);
    }, duration);
  };

  // ─── CONFIRM ─────────────────────────────────────────────────────────────────
  const confirm = (message, onOk, onCancel) => {
    const dialog = document.getElementById('confirmDialog');
    document.getElementById('confirmMessage').textContent = message;
    dialog.classList.remove('hidden');

    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    const cleanup = () => dialog.classList.add('hidden');

    okBtn.onclick = () => { cleanup(); if (onOk) onOk(); };
    cancelBtn.onclick = () => { cleanup(); if (onCancel) onCancel(); };
  };

  // ─── DASHBOARD REFRESH ────────────────────────────────────────────────────────
  const refreshDashboard = () => {
    if (currentModule === 'dashboard') {
      DashboardModule.load();
    }
  };

  // ─── PWA / SERVICE WORKER ────────────────────────────────────────────────────
  const registerSW = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('SW registrado:', reg.scope))
        .catch(err => console.warn('SW error:', err));
    }
  };

  let deferredPrompt = null;
  const setupInstallPrompt = () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.getElementById('installBtn');
      if (btn) btn.style.display = 'block';
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      const btn = document.getElementById('installBtn');
      if (btn) btn.style.display = 'none';
      toast('¡Aplicación instalada correctamente!', 'success');
    });
  };

  const installPWA = async () => {
    if (!deferredPrompt) { toast('La aplicación ya está instalada', 'info'); return; }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') toast('Instalando…', 'success');
  };

  // ─── BACKUP / RESTORE ────────────────────────────────────────────────────────
  const exportarBackup = async () => {
    const data = await DB.exportAll();
    const json = JSON.stringify({ version: CONFIG.APP_VERSION, fecha: new Date().toISOString(), data }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LegioCert_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Copia de seguridad exportada', 'success');
  };

  const importarBackup = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.data) throw new Error('Formato inválido');
        confirm('¿Restaurar la copia de seguridad? Se sobreescribirán todos los datos actuales.', async () => {
          await DB.importAll(parsed.data);
          toast('Datos restaurados correctamente', 'success');
          await navigate('dashboard');
        });
      } catch (err) {
        toast('Error al importar: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  return {
    init, navigate, toggleSidebar, closeSidebar,
    toast, confirm, refreshDashboard,
    installPWA, exportarBackup, importarBackup,
  };
})();

// ─── MÓDULO DE CONFIGURACIÓN ──────────────────────────────────────────────────
const ConfigModule = (() => {
  const render = () => `
    <div class="module-header">
      <h2><i class="icon">⚙️</i> Configuración</h2>
    </div>
    <div class="config-sections">
      <div class="config-section">
        <h3>🏢 Datos de empresa</h3>
        <div class="form-grid">
          <div class="form-group form-full">
            <label>Nombre de la empresa</label>
            <input type="text" id="cfg_empresa" placeholder="Duarte Conection">
          </div>
          <div class="form-group">
            <label>CIF</label>
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
            <input type="text" id="cfg_direccion" placeholder="Calle, número, ciudad">
          </div>
          <div class="form-group form-full">
            <label>Nombre del técnico por defecto</label>
            <input type="text" id="cfg_tecnico" placeholder="Nombre del técnico">
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
            <option value="auto">Automático (sistema)</option>
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
        <p class="text-muted" style="margin-bottom:12px">Estas acciones no se pueden deshacer.</p>
        <button class="btn btn-danger" onclick="ConfigModule.borrarTodo()">🗑️ Borrar todos los datos</button>
      </div>

      <div class="config-section">
        <h3>ℹ️ Acerca de</h3>
        <p><strong>LegioCert Pro</strong> v${CONFIG.APP_VERSION}</p>
        <p class="text-muted">${CONFIG.APP_AUTHOR} · ${CONFIG.APP_EMAIL}</p>
        <p class="text-muted">Normativa: ${CONFIG.NORMATIVA.RD_487} · ${CONFIG.NORMATIVA.RD_614} · ${CONFIG.NORMATIVA.UNE}</p>
      </div>
    </div>
  `;

  const load = async () => {
    const campos = ['empresa','cif','telefono','email','direccion','tecnico','precioHora','precioKm','margen','tema'];
    for (const campo of campos) {
      const val = await DB.getConfig(`cfg_${campo}`);
      const el = document.getElementById(`cfg_${campo}`);
      if (el && val !== null) el.value = val;
    }
    const tema = await DB.getConfig('cfg_tema') || 'dark';
    document.documentElement.setAttribute('data-theme', tema);
  };

  const guardarEmpresa = async () => {
    const campos = ['empresa','cif','telefono','email','direccion','tecnico'];
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

// ─── INICIO ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
