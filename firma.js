/**
 * LegioCert Pro - Módulo de Firmas Digitales v2
 * Bug fix: inicialización correcta del canvas tras renderizado del DOM
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
            <button class="btn btn-sm btn-ghost" onclick="FirmaModule.limpiar('${containerId}')">Limpiar</button>
          </div>
        </div>
        <canvas id="${containerId}_canvas" class="firma-canvas" width="600" height="200"></canvas>
        <p class="firma-hint">Firma con el dedo o el ratón en el recuadro blanco</p>
      </div>
    `;

    // Esperar al siguiente frame para que el DOM esté pintado
    requestAnimationFrame(() => {
      setTimeout(() => inicializarCanvas(containerId), 100);
    });
  };

  const inicializarCanvas = (id) => {
    const canvas = document.getElementById(`${id}_canvas`);
    if (!canvas) return;

    // Ajustar tamaño real del canvas al tamaño CSS
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width;
      canvas.height = Math.max(160, rect.height);
    }

    const ctx = canvas.getContext('2d');
    let dibujando = false;

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estilo de trazo
    ctx.strokeStyle = '#0A2342';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const scaleX = canvas.width / r.width;
      const scaleY = canvas.height / r.height;
      if (e.touches && e.touches[0]) {
        return {
          x: (e.touches[0].clientX - r.left) * scaleX,
          y: (e.touches[0].clientY - r.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - r.left) * scaleX,
        y: (e.clientY - r.top) * scaleY,
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      dibujando = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      e.preventDefault();
      if (!dibujando) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = (e) => {
      if (e) e.preventDefault();
      dibujando = false;
    };

    // Eliminar listeners anteriores clonando el canvas
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const c = newCanvas;
    const ctx2 = c.getContext('2d');
    ctx2.fillStyle = '#FFFFFF';
    ctx2.fillRect(0, 0, c.width, c.height);
    ctx2.strokeStyle = '#0A2342';
    ctx2.lineWidth = 2.5;
    ctx2.lineCap = 'round';
    ctx2.lineJoin = 'round';

    let drawing = false;

    const getPos2 = (e) => {
      const r = c.getBoundingClientRect();
      const sx = c.width / r.width;
      const sy = c.height / r.height;
      if (e.touches && e.touches[0]) {
        return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
      }
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    };

    c.addEventListener('mousedown', (e) => {
      drawing = true;
      const p = getPos2(e);
      ctx2.beginPath(); ctx2.moveTo(p.x, p.y);
    });
    c.addEventListener('mousemove', (e) => {
      if (!drawing) return;
      const p = getPos2(e);
      ctx2.lineTo(p.x, p.y); ctx2.stroke();
    });
    c.addEventListener('mouseup', () => { drawing = false; });
    c.addEventListener('mouseleave', () => { drawing = false; });
    c.addEventListener('touchstart', (e) => {
      e.preventDefault(); drawing = true;
      const p = getPos2(e); ctx2.beginPath(); ctx2.moveTo(p.x, p.y);
    }, { passive: false });
    c.addEventListener('touchmove', (e) => {
      e.preventDefault(); if (!drawing) return;
      const p = getPos2(e); ctx2.lineTo(p.x, p.y); ctx2.stroke();
    }, { passive: false });
    c.addEventListener('touchend', (e) => { e.preventDefault(); drawing = false; }, { passive: false });

    instancias[id] = { canvas: c, ctx: ctx2 };
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
