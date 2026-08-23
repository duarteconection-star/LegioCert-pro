/**
 * LegioCert Pro - Dashboard
 * Estadísticas, gráficos y resumen general
 */

const DashboardModule = (() => {
  const render = () => `
    <div class="dashboard">
      <div class="dashboard-header">
        <h2>Panel de Control</h2>
        <span id="dashboard_fecha" class="dashboard-date"></span>
      </div>
      <div id="dashboard_stats" class="stats-grid"></div>
      <div class="charts-row">
        <div class="chart-card">
          <h3>Tratamientos por tipo</h3>
          <canvas id="chart_tipos" width="300" height="200"></canvas>
        </div>
        <div class="chart-card">
          <h3>Actividad mensual</h3>
          <canvas id="chart_mensual" width="300" height="200"></canvas>
        </div>
      </div>
      <div id="dashboard_proximas" class="proximas-section"></div>
      <div id="dashboard_recientes" class="recientes-section"></div>
    </div>
  `;

  const load = async () => {
    // Fecha
    const fechaEl = document.getElementById('dashboard_fecha');
    if (fechaEl) fechaEl.textContent = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

    const [clientes, instalaciones, tratamientos, certificados, productos] = await Promise.all([
      DB.getAll('clientes'), DB.getAll('instalaciones'), DB.getAll('tratamientos'),
      DB.getAll('certificados'), DB.getAll('productos'),
    ]);

    // Calcular facturación estimada
    let facturacion = 0;
    let costes = 0;
    tratamientos.forEach(t => {
      const mo = (t.horas || 0) * (t.precioHora || 0);
      const desp = (t.km || 0) * (t.precioKm || 0);
      const prod = t.costeProducto || 0;
      const subtotal = mo + desp + prod;
      costes += subtotal;
      facturacion += subtotal * (1 + (t.margen || 0) / 100);
    });

    // Próximas revisiones (desde agenda)
    const agenda = await DB.getAll('agenda');
    const hoy = new Date().toISOString().split('T')[0];
    const proximas = agenda.filter(a => a.fecha >= hoy).slice(0, 5);

    // Stats
    const statsEl = document.getElementById('dashboard_stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card blue" onclick="App.navigate('clientes')">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${clientes.length}</div>
          <div class="stat-label">Clientes</div>
        </div>
        <div class="stat-card teal" onclick="App.navigate('instalaciones')">
          <div class="stat-icon">🏢</div>
          <div class="stat-value">${instalaciones.length}</div>
          <div class="stat-label">Instalaciones</div>
        </div>
        <div class="stat-card green" onclick="App.navigate('historial')">
          <div class="stat-icon">🧪</div>
          <div class="stat-value">${tratamientos.length}</div>
          <div class="stat-label">Tratamientos</div>
        </div>
        <div class="stat-card orange" onclick="App.navigate('historial')">
          <div class="stat-icon">📄</div>
          <div class="stat-value">${certificados.length}</div>
          <div class="stat-label">Certificados</div>
        </div>
        <div class="stat-card purple" onclick="App.navigate('agenda')">
          <div class="stat-icon">📅</div>
          <div class="stat-value">${proximas.length}</div>
          <div class="stat-label">Próximas revisiones</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-icon">💶</div>
          <div class="stat-value">${facturacion.toFixed(0)}€</div>
          <div class="stat-label">Facturación estimada</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">💸</div>
          <div class="stat-value">${costes.toFixed(0)}€</div>
          <div class="stat-label">Costes totales</div>
        </div>
        <div class="stat-card gray" onclick="App.navigate('productos')">
          <div class="stat-icon">🧴</div>
          <div class="stat-value">${productos.length}</div>
          <div class="stat-label">Productos en stock</div>
        </div>
      `;
    }

    // Gráficos
    setTimeout(() => {
      renderChartTipos(tratamientos);
      renderChartMensual(tratamientos);
    }, 100);

    // Próximas revisiones
    renderProximas(proximas, clientes);

    // Tratamientos recientes
    renderRecientes(tratamientos.slice(-5).reverse(), clientes);
  };

  const renderChartTipos = (tratamientos) => {
    const canvas = document.getElementById('chart_tipos');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const tipos = {};
    tratamientos.forEach(t => { tipos[t.tipo || 'otro'] = (tipos[t.tipo || 'otro'] || 0) + 1; });

    const labels = Object.keys(tipos);
    const values = Object.values(tipos);
    const colores = ['#1565C0','#00BCD4','#26C281','#F39C12','#E74C3C','#9B59B6'];

    if (labels.length === 0) {
      ctx.fillStyle = '#aaa';
      ctx.font = '12px Arial';
      ctx.fillText('Sin datos', canvas.width/2 - 30, canvas.height/2);
      return;
    }

    // Gráfico de barras simples
    const padding = 30;
    const chartW = canvas.width - padding * 2;
    const chartH = canvas.height - padding * 2;
    const barW = Math.floor(chartW / labels.length) - 6;
    const maxVal = Math.max(...values);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    labels.forEach((label, i) => {
      const barH = maxVal > 0 ? (values[i] / maxVal) * chartH : 0;
      const x = padding + i * (barW + 6);
      const y = padding + chartH - barH;

      ctx.fillStyle = colores[i % colores.length];
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Valor encima
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(values[i], x + barW/2, y - 4);

      // Label debajo
      ctx.fillStyle = '#555';
      ctx.font = '9px Arial';
      const shortLabel = label.slice(0, 8);
      ctx.fillText(shortLabel, x + barW/2, canvas.height - 6);
    });
  };

  const renderChartMensual = (tratamientos) => {
    const canvas = document.getElementById('chart_mensual');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Últimos 6 meses
    const meses = [];
    const counts = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      meses.push(d.toLocaleDateString('es-ES', { month:'short' }));
      counts.push(tratamientos.filter(t => t.fecha && t.fecha.startsWith(key)).length);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 30;
    const chartW = canvas.width - padding * 2;
    const chartH = canvas.height - padding * 2;
    const maxVal = Math.max(...counts, 1);
    const step = chartW / (meses.length - 1);

    // Línea
    ctx.beginPath();
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    const points = meses.map((_, i) => ({
      x: padding + i * step,
      y: padding + chartH - (counts[i] / maxVal) * chartH,
    }));

    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Relleno
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length-1].x, padding + chartH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(21,101,192,0.12)';
    ctx.fill();

    // Puntos y labels
    points.forEach((p, i) => {
      ctx.fillStyle = '#1565C0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      if (counts[i] > 0) {
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(counts[i], p.x, p.y - 8);
      }

      ctx.fillStyle = '#666';
      ctx.font = '9px Arial';
      ctx.fillText(meses[i], p.x, canvas.height - 4);
    });
  };

  const renderProximas = (proximas, clientes) => {
    const el = document.getElementById('dashboard_proximas');
    if (!el) return;

    const clienteMap = {};
    clientes.forEach(c => { clienteMap[c.id] = c; });

    el.innerHTML = `
      <h3 class="section-subtitle">📅 Próximas revisiones</h3>
      ${proximas.length === 0
        ? '<p class="text-muted">No hay revisiones programadas</p>'
        : proximas.map(a => `
          <div class="proxima-item">
            <span class="proxima-fecha">${a.fecha}</span>
            <span class="proxima-desc">${a.descripcion || 'Revisión'}</span>
            <span class="proxima-cliente">${clienteMap[a.clienteId]?.nombre || '—'}</span>
          </div>`).join('')
      }
      <button class="btn btn-sm btn-ghost" onclick="App.navigate('agenda')" style="margin-top:8px">Ver agenda completa →</button>
    `;
  };

  const renderRecientes = (tratamientos, clientes) => {
    const el = document.getElementById('dashboard_recientes');
    if (!el) return;

    const clienteMap = {};
    clientes.forEach(c => { clienteMap[c.id] = c; });

    el.innerHTML = `
      <h3 class="section-subtitle">🕐 Tratamientos recientes</h3>
      ${tratamientos.length === 0
        ? '<p class="text-muted">Sin actividad reciente</p>'
        : tratamientos.map(t => `
          <div class="reciente-item" onclick="App.navigate('historial')">
            <span class="reciente-fecha">${t.fecha || '—'}</span>
            <span class="reciente-cliente">${clienteMap[t.clienteId]?.nombre || '—'}</span>
            <span class="reciente-tipo badge badge-${t.tipo === 'choque' ? 'red' : t.tipo === 'desinfeccion' ? 'orange' : 'blue'}">${t.tipo || '—'}</span>
          </div>`).join('')
      }
      <button class="btn btn-sm btn-ghost" onclick="App.navigate('historial')" style="margin-top:8px">Ver todo el historial →</button>
    `;
  };

  return { render, load };
})();

window.DashboardModule = DashboardModule;
