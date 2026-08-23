/**
 * LegioCert Pro - Módulo de Firmas Digitales
 * Canvas de firma para técnico y cliente
 */

const FirmaModule = (() => {
  const instancias = {};

  // Crear pad de firma en un contenedor
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
        <canvas id="${containerId}_canvas" class="firma-canvas" width="400" height="150"></canvas>
        <p class="firma-hint">Firma con el dedo o el ratón</p>
      </div>
    `;

    const canvas = document.getElementById(`${containerId}_canvas`);
    inicializarCanvas(containerId, canvas);
  };

  const inicializarCanvas = (id, canvas) => {
    const ctx = canvas.getContext('2d');
    let dibujando = false;
    let lastX = 0, lastY = 0;

    // Configurar estilo de trazo
    ctx.strokeStyle = '#0A2342';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if (e.touches) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      dibujando = true;
      const pos = getPos(e);
      lastX = pos.x; lastY = pos.y;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    };

    const draw = (e) => {
      e.preventDefault();
      if (!dibujando) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x; lastY = pos.y;
    };

    const stopDraw = () => { dibujando = false; };

    // Mouse
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    // Touch
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    instancias[id] = { canvas, ctx };
  };

  const limpiar = (id) => {
    const inst = instancias[id];
    if (!inst) return;
    const { ctx, canvas } = inst;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Obtener imagen de firma como base64
  const obtenerImagen = (id) => {
    const inst = instancias[id];
    if (!inst) return null;
    return inst.canvas.toDataURL('image/png');
  };

  // Verificar si hay firma (no está en blanco)
  const tieneFirma = (id) => {
    const inst = instancias[id];
    if (!inst) return false;
    const { ctx, canvas } = inst;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250) return true;
    }
    return false;
  };

  // Cargar firma desde base64
  const cargarImagen = (id, base64) => {
    const inst = instancias[id];
    if (!inst || !base64) return;
    const img = new Image();
    img.onload = () => inst.ctx.drawImage(img, 0, 0);
    img.src = base64;
  };

  return { crear, limpiar, obtenerImagen, tieneFirma, cargarImagen };
})();

window.FirmaModule = FirmaModule;
