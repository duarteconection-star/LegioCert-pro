/**
 * LegioCert Pro - Módulo de Agenda
 * Calendario de revisiones y avisos
 */

const AgendaModule = (() => {
  let currentYear, currentMonth;

  const render = () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    return `
      <div class="module-header">
        <h2><i class="icon">📅</i> Agenda</h2>
        <button class="btn btn-primary" onclick="AgendaModule.openForm()">
          <i class="icon">➕</i> Nueva revisión
        </button>
      </div>
      <div class="agenda-layout">
        <div class="calendar-panel">
          <div class="cal-nav">
            <button class="btn-icon" onclick="AgendaModule.prevMonth()">◀</button>
            <h3 id="cal_titulo"></h3>
            <button class="btn-icon" onclick="AgendaModule.nextMonth()">▶</button>
          </div>
          <div class="cal-weekdays">
            <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
          </div>
          <div id="cal_grid" class="cal-grid"></div>
        </div>
        <div class="agenda-list-panel">
          <h3 id="agenda_list_titulo">Próximas revisiones</h3>
          <div id="agenda_list"></div>
        </div>
      </div>
      <div id="agendaModal" class="modal hidden">
        <div class="modal-backdrop" onclick="AgendaModule.closeForm()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="agendaModalTitle">Nueva revisión</h3>
            <button class="btn-close" onclick="AgendaModule.closeForm()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Fecha *</label>
                <input type="date" id="ag_fecha" required>
              </div>
              <div class="form-group">
                <label>Hora</label>
                <input type="time" id="ag_hora">
              </div>
              <div class="form-group">
                <label>Cliente</label>
                <select id="ag_clienteId">
                  <option value="">Sin cliente</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tipo de revisión</label>
                <select id="ag_tipo">
                  <option value="revision">Revisión periódica</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="muestreo">Toma de muestras</option>
                  <option value="choque">Choque desinfección</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label>Descripción</label>
                <input type="text" id="ag_descripcion" placeholder="Descripción de la revisión">
              </div>
              <div class="form-group form-full">
                <label>Observaciones</label>
                <textarea id="ag_observaciones" rows="2" placeholder="Notas…"></textarea>
              </div>
              <div class="form-group">
                <label>Aviso previo</label>
                <select id="ag_aviso">
                  <option value="0">Sin aviso</option>
                  <option value="1">1 día antes</option>
                  <option value="3" selected>3 días antes</option>
                  <option value="7">1 semana antes</option>
                  <option value="15">15 días antes</option>
                </select>
              </div>
              <div class="form-group">
                <label>Repetición</label>
                <select id="ag_repeticion">
                  <option value="0">Sin repetición</option>
                  <option value="30">Mensual</option>
                  <option value="90">Trimestral</option>
                  <option value="180">Semestral</option>
                  <option value="365">Anual</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="AgendaModule.closeForm()">Cancelar</button>
            <button class="btn btn-primary" onclick="AgendaModule.save()">💾 Guardar</button>
          </div>
        </div>
      </div>
    `;
  };

  let eventos = [];
  let currentEdit = null;

  const load = async () => {
    eventos = await DB.getAll('agenda');
    const clientes = await DB.getAll('clientes');

    // Poblar select clientes en modal
    const sel = document.getElementById('ag_clienteId');
    if (sel) {
      sel.innerHTML = '<option value="">Sin cliente</option>' +
        clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    }

    renderCalendar();
    renderProximas(clientes);
    checkAvisos(eventos, clientes);
  };

  const renderCalendar = () => {
    const titulo = document.getElementById('cal_titulo');
    if (titulo) titulo.textContent = new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const grid = document.getElementById('cal_grid');
    if (!grid) return;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const offset = (firstDay + 6) % 7; // lunes = 0

    const hoy = new Date().toISOString().split('T')[0];

    // Construir mapa de días con eventos
    const eventosPorDia = {};
    eventos.forEach(ev => {
      if (!ev.fecha) return;
      const d = ev.fecha;
      if (d.startsWith(`${currentYear}-${String(currentMonth+1).padStart(2,'0')}`)) {
        const dia = parseInt(d.split('-')[2]);
        if (!eventosPorDia[dia]) eventosPorDia[dia] = [];
        eventosPorDia[dia].push(ev);
      }
    });

    let html = '';
    // Celdas vacías del inicio
    for (let i = 0; i < offset; i++) html += '<div class="cal-day empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const esHoy = dateStr === hoy;
      const evs = eventosPorDia[d] || [];
      const esPasado = dateStr < hoy;

      html += `
        <div class="cal-day ${esHoy ? 'today' : ''} ${esPasado ? 'past' : ''} ${evs.length ? 'has-events' : ''}"
          onclick="AgendaModule.selectDay('${dateStr}')">
          <span class="cal-day-num">${d}</span>
          ${evs.slice(0,2).map(ev => `<div class="cal-event-dot ${ev.tipo || 'revision'}">${ev.descripcion?.slice(0,8) || ev.tipo || 'Rev.'}</div>`).join('')}
          ${evs.length > 2 ? `<div class="cal-event-more">+${evs.length-2}</div>` : ''}
        </div>
      `;
    }

    grid.innerHTML = html;
  };

  const renderProximas = async (clientes) => {
    const clienteMap = {};
    (clientes || []).forEach(c => { clienteMap[c.id] = c; });

    const hoy = new Date().toISOString().split('T')[0];
    const proximas = eventos.filter(e => e.fecha >= hoy).sort((a,b) => a.fecha.localeCompare(b.fecha)).slice(0, 20);

    const el = document.getElementById('agenda_list');
    if (!el) return;

    const titulo = document.getElementById('agenda_list_titulo');
    if (titulo) titulo.textContent = `Próximas revisiones (${proximas.length})`;

    if (proximas.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><p>Sin revisiones programadas</p></div>';
      return;
    }

    const tipoColor = { revision:'blue', mantenimiento:'teal', muestreo:'purple', choque:'red', otro:'gray' };

    el.innerHTML = proximas.map(ev => {
      const fecha = new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'short', day:'2-digit', month:'short' });
      const diasRestantes = Math.ceil((new Date(ev.fecha) - new Date()) / 86400000);
      const urgente = diasRestantes <= 3;

      return `
        <div class="agenda-item ${urgente ? 'urgente' : ''}">
          <div class="agenda-fecha">
            <div class="agenda-dia">${fecha.split(' ')[1]}</div>
            <div class="agenda-mes">${fecha.split(' ')[2]}</div>
          </div>
          <div class="agenda-info">
            <div class="agenda-desc">${ev.descripcion || ev.tipo || 'Revisión'}</div>
            <div class="agenda-cliente">${clienteMap[ev.clienteId]?.nombre || 'Sin cliente'}</div>
            ${ev.hora ? `<div class="agenda-hora">🕐 ${ev.hora}</div>` : ''}
            <div class="agenda-dias ${urgente ? 'text-danger' : 'text-muted'}">
              ${diasRestantes === 0 ? '¡Hoy!' : diasRestantes === 1 ? '¡Mañana!' : `En ${diasRestantes} días`}
            </div>
          </div>
          <span class="badge badge-${tipoColor[ev.tipo] || 'blue'}">${ev.tipo || 'revisión'}</span>
          <div class="agenda-actions">
            <button class="btn-icon" onclick="AgendaModule.openForm(${ev.id})">✏️</button>
            <button class="btn-icon danger" onclick="AgendaModule.eliminar(${ev.id})">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  };

  const selectDay = (dateStr) => {
    const evsDia = eventos.filter(e => e.fecha === dateStr);
    if (evsDia.length === 0) {
      openForm(null, dateStr);
    } else {
      // Mostrar eventos del día en el panel lateral
      const titulo = document.getElementById('agenda_list_titulo');
      if (titulo) titulo.textContent = `Eventos del ${new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { day:'2-digit', month:'long' })}`;
      const el = document.getElementById('agenda_list');
      if (el) {
        el.innerHTML = evsDia.map(ev => `
          <div class="agenda-item">
            <div class="agenda-info">
              <div class="agenda-desc">${ev.descripcion || ev.tipo}</div>
              ${ev.hora ? `<div class="agenda-hora">🕐 ${ev.hora}</div>` : ''}
            </div>
            <div class="agenda-actions">
              <button class="btn-icon" onclick="AgendaModule.openForm(${ev.id})">✏️</button>
              <button class="btn-icon danger" onclick="AgendaModule.eliminar(${ev.id})">🗑️</button>
            </div>
          </div>
        `).join('');
        el.innerHTML += `<button class="btn btn-sm btn-primary" onclick="AgendaModule.openForm(null,'${dateStr}')" style="margin-top:10px">+ Añadir evento este día</button>`;
      }
    }
  };

  const prevMonth = () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  };

  const nextMonth = () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  };

  const openForm = async (id = null, fechaDefault = null) => {
    currentEdit = id;
    document.getElementById('agendaModalTitle').textContent = id ? 'Editar revisión' : 'Nueva revisión';

    ['fecha','hora','descripcion','observaciones'].forEach(f => {
      const el = document.getElementById(`ag_${f}`); if (el) el.value = '';
    });
    document.getElementById('ag_tipo').value = 'revision';
    document.getElementById('ag_aviso').value = '3';
    document.getElementById('ag_repeticion').value = '0';

    if (fechaDefault) document.getElementById('ag_fecha').value = fechaDefault;
    else document.getElementById('ag_fecha').value = new Date().toISOString().split('T')[0];

    if (id) {
      const ev = await DB.getById('agenda', id);
      if (ev) {
        document.getElementById('ag_fecha').value = ev.fecha || '';
        document.getElementById('ag_hora').value = ev.hora || '';
        document.getElementById('ag_descripcion').value = ev.descripcion || '';
        document.getElementById('ag_observaciones').value = ev.observaciones || '';
        document.getElementById('ag_tipo').value = ev.tipo || 'revision';
        document.getElementById('ag_aviso').value = ev.aviso || '3';
        document.getElementById('ag_clienteId').value = ev.clienteId || '';
        document.getElementById('ag_repeticion').value = ev.repeticion || '0';
      }
    }

    document.getElementById('agendaModal').classList.remove('hidden');
  };

  const closeForm = () => {
    document.getElementById('agendaModal').classList.add('hidden');
    currentEdit = null;
  };

  const save = async () => {
    const fecha = document.getElementById('ag_fecha').value;
    if (!fecha) { App.toast('La fecha es obligatoria', 'error'); return; }

    const data = {
      fecha,
      hora: document.getElementById('ag_hora').value,
      clienteId: parseInt(document.getElementById('ag_clienteId').value) || null,
      tipo: document.getElementById('ag_tipo').value,
      descripcion: document.getElementById('ag_descripcion').value.trim(),
      observaciones: document.getElementById('ag_observaciones').value.trim(),
      aviso: parseInt(document.getElementById('ag_aviso').value) || 0,
      repeticion: parseInt(document.getElementById('ag_repeticion').value) || 0,
    };

    if (currentEdit) {
      await DB.update('agenda', { ...data, id: currentEdit });
      App.toast('Revisión actualizada', 'success');
    } else {
      await DB.add('agenda', data);

      // Si tiene repetición, crear eventos futuros
      const rep = parseInt(document.getElementById('ag_repeticion').value) || 0;
      if (rep > 0) {
        for (let i = 1; i <= 5; i++) {
          const d = new Date(fecha);
          d.setDate(d.getDate() + rep * i);
          await DB.add('agenda', { ...data, fecha: d.toISOString().split('T')[0] });
        }
        App.toast(`Revisión creada con ${5} repeticiones`, 'success');
      } else {
        App.toast('Revisión creada', 'success');
      }
    }

    closeForm();
    await load();
    App.refreshDashboard();
  };

  const eliminar = (id) => {
    App.confirm('¿Eliminar esta revisión?', async () => {
      await DB.remove('agenda', id);
      App.toast('Revisión eliminada', 'info');
      await load();
      App.refreshDashboard();
    });
  };

  const checkAvisos = (eventos, clientes) => {
    const hoy = new Date();
    const clienteMap = {};
    clientes.forEach(c => { clienteMap[c.id] = c; });

    eventos.forEach(ev => {
      if (!ev.aviso || ev.aviso === 0) return;
      const fechaEv = new Date(ev.fecha + 'T12:00:00');
      const diasRestantes = Math.ceil((fechaEv - hoy) / 86400000);
      if (diasRestantes >= 0 && diasRestantes <= ev.aviso) {
        const cliente = clienteMap[ev.clienteId]?.nombre || '';
        App.toast(`⚠️ ${ev.descripcion || 'Revisión'} ${cliente ? `· ${cliente}` : ''} en ${diasRestantes} días`, 'warning', 6000);
      }
    });
  };

  return { render, load, prevMonth, nextMonth, selectDay, openForm, closeForm, save, eliminar };
})();

window.AgendaModule = AgendaModule;
