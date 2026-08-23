/**
 * LegioCert Pro - Módulo de Fotografías
 * Captura y gestión de fotos: antes, durante y después
 */

const FotosModule = (() => {
  const fotos = { antes: [], durante: [], despues: [] };
  const MAX_FOTOS_POR_TIPO = 5;
  const MAX_SIZE_PX = 1200;
  const JPEG_QUALITY = 0.82;

  const render = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="fotos-widget">
        <h4>📸 Fotografías del Tratamiento</h4>
        ${renderSeccion('antes', 'Antes del tratamiento', '🔵')}
        ${renderSeccion('durante', 'Durante el tratamiento', '🟡')}
        ${renderSeccion('despues', 'Después del tratamiento', '🟢')}
      </div>
    `;
  };

  const renderSeccion = (tipo, titulo, emoji) => `
    <div class="fotos-seccion">
      <div class="fotos-seccion-header">
        <span>${emoji} ${titulo}</span>
        <label class="btn btn-sm btn-ghost fotos-upload-btn">
          📷 Añadir foto
          <input type="file" accept="image/*" capture="environment" multiple
            onchange="FotosModule.agregarFotos('${tipo}', this.files)" style="display:none">
        </label>
      </div>
      <div id="fotos_${tipo}" class="fotos-grid"></div>
    </div>
  `;

  const agregarFotos = async (tipo, files) => {
    if (!files || files.length === 0) return;
    const actuales = fotos[tipo] || [];

    if (actuales.length + files.length > MAX_FOTOS_POR_TIPO) {
      App.toast(`Máximo ${MAX_FOTOS_POR_TIPO} fotos por sección`, 'warning');
      return;
    }

    for (const file of Array.from(files)) {
      try {
        const base64 = await comprimirFoto(file);
        fotos[tipo].push({ base64, nombre: file.name, timestamp: Date.now() });
      } catch (e) {
        App.toast('Error al procesar la foto', 'error');
      }
    }

    renderizarSeccion(tipo);
  };

  const comprimirFoto = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > MAX_SIZE_PX || height > MAX_SIZE_PX) {
            const ratio = Math.min(MAX_SIZE_PX / width, MAX_SIZE_PX / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const renderizarSeccion = (tipo) => {
    const grid = document.getElementById(`fotos_${tipo}`);
    if (!grid) return;

    if (fotos[tipo].length === 0) {
      grid.innerHTML = '<p class="fotos-vacio">Sin fotos</p>';
      return;
    }

    grid.innerHTML = fotos[tipo].map((foto, idx) => `
      <div class="foto-thumb" onclick="FotosModule.verFoto('${tipo}', ${idx})">
        <img src="${foto.base64}" alt="Foto ${idx + 1}" loading="lazy">
        <button class="foto-eliminar" onclick="event.stopPropagation(); FotosModule.eliminarFoto('${tipo}', ${idx})">✕</button>
      </div>
    `).join('');
  };

  const eliminarFoto = (tipo, idx) => {
    fotos[tipo].splice(idx, 1);
    renderizarSeccion(tipo);
  };

  const verFoto = (tipo, idx) => {
    const foto = fotos[tipo][idx];
    if (!foto) return;

    const overlay = document.createElement('div');
    overlay.className = 'foto-viewer';
    overlay.innerHTML = `
      <div class="foto-viewer-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="foto-viewer-content">
        <img src="${foto.base64}" alt="Foto">
        <button class="foto-viewer-close" onclick="this.closest('.foto-viewer').remove()">✕</button>
        <p>${new Date(foto.timestamp).toLocaleString('es-ES')}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  };

  // Cargar fotos desde datos guardados
  const cargarFotos = (fotosGuardadas) => {
    fotos.antes = fotosGuardadas?.antes || [];
    fotos.durante = fotosGuardadas?.durante || [];
    fotos.despues = fotosGuardadas?.despues || [];
    ['antes', 'durante', 'despues'].forEach(t => renderizarSeccion(t));
  };

  const limpiar = () => {
    fotos.antes = []; fotos.durante = []; fotos.despues = [];
    ['antes', 'durante', 'despues'].forEach(t => renderizarSeccion(t));
  };

  const obtenerFotos = () => ({ ...fotos });

  return { render, agregarFotos, eliminarFoto, verFoto, cargarFotos, limpiar, obtenerFotos };
})();

window.FotosModule = FotosModule;
