/**
 * LegioCert Pro - Módulo de Firmas Digitales v2 (Corregido)
 */
const FirmaModule = (() => {
  const instancias = {};

  const crear = (containerId, label = 'Firma') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="firma-widget">
        <div class="firma-header">
          <span class="firma-label">✍️ ${label}</span>
          <div class="firma-btns">
            <button class="btn btn-sm btn-ghost" type="button" onclick="FirmaModule.limpiar('${containerId}')">Limpiar</button>
          </div>
        </div>
        <canvas id="${containerId}_canvas" class="firma-canvas" width="600" height="200"></canvas>
        <p class="firma-hint">Firma con el dedo o el ratón en el recuadro blanco</p>
      </div>
    `;

    requestAnimationFrame(() => {
      setTimeout(() => inicializarCanvas(containerId), 100);
    });
  };

  const inicializarCanvas = (id) => {
    const canvas = document.getElementById(`${id}_canvas`);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width;
      canvas.height = Math.max(160, rect.height);
    }

    const ctx = canvas.getContext('2d');
    let dibujando = false;

    // Configuración inicial del lienzo
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0A2342';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const scaleX = canvas.width / r.width;
      const scaleY = canvas.height / r.height;
      
      const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;

      return {
        x: (clientX - r.left) * scaleX,
        y: (clientY - r.top) * scaleY
      };
    };

    const startDraw = (e) => {
      dibujando = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!dibujando) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      dibujando = false;
    };

    // Eventos Ratón
    canvas.addEventListener('mousedown', (e) => { startDraw(e); });
    canvas.addEventListener('mousemove', (e) => { draw(e); });
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    // Eventos Táctiles (Móviles)
    canvas.addEventListener('touchstart', (e) => {
      if (e.target === canvas) e.preventDefault();
      startDraw(e);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.target === canvas) e.preventDefault();
      draw(e);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (e.target === canvas) e.preventDefault();
      stopDraw();
    }, { passive: false });

    instancias[id] = { canvas, ctx };
  };

  const limpiar = (id) => {
    const inst = instancias[id];
    if (!inst) { inicializarCanvas(id); return; }
    inst.ctx.fillStyle = '#FFFFFF';
    inst.ctx.fillRect(0, 0, inst.canvas.width, inst.canvas.height);
  };

  const obtenerImagen = (id) => {
    const inst = instancias[id];
    if (!inst) return null;
    return inst.canvas.toDataURL('image/png');
  };

  const tieneFirma = (id) => {
    const inst = instancias[id];
    if (!inst) return false;
    const data = inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250) return true;
    }
    return false;
  };

  const cargarImagen = (id, base64) => {
    if (!base64) return;
    setTimeout(() => {
      const inst = instancias[id];
      if (!inst) return;
      const img = new Image();
      img.onload = () => inst.ctx.drawImage(img, 0, 0, inst.canvas.width, inst.canvas.height);
      img.src = base64;
    }, 200);
  };

  return { crear, limpiar, obtenerImagen, tieneFirma, cargarImagen };
})();

window.FirmaModule = FirmaModule;
