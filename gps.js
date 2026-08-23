/**
 * LegioCert Pro - Módulo GPS
 * Captura de ubicación con geocodificación inversa
 */

const GPSModule = (() => {
  let lastPosition = null;

  // Obtener posición GPS actual
  const obtenerPosicion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no disponible en este dispositivo'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const timestamp = new Date().toISOString();

          let direccion = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          try {
            direccion = await geocodificarInverso(latitude, longitude);
          } catch (e) {
            console.warn('Geocodificación inversa falló:', e);
          }

          lastPosition = { latitude, longitude, accuracy, timestamp, direccion };
          resolve(lastPosition);
        },
        (err) => {
          let msg = 'Error al obtener ubicación';
          if (err.code === 1) msg = 'Permiso de ubicación denegado';
          if (err.code === 2) msg = 'Posición no disponible';
          if (err.code === 3) msg = 'Tiempo de espera agotado';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  // Geocodificación inversa usando API pública (Nominatim)
  const geocodificarInverso = async (lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'LegioCertPro/1.0' } });
      if (!resp.ok) throw new Error('Sin respuesta');
      const data = await resp.json();
      return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  // Renderizar widget GPS para formularios de tratamiento
  const renderWidget = (containerId, onSuccess) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="gps-widget">
        <div class="gps-header">
          <span>📍 Ubicación GPS</span>
          <button class="btn btn-sm btn-primary" onclick="GPSModule.capturar('${containerId}', ${onSuccess ? 'window.__gpsCallback' : 'null'})">
            Obtener ubicación
          </button>
        </div>
        <div id="${containerId}_result" class="gps-result hidden">
          <div class="gps-coords"></div>
          <div class="gps-address"></div>
          <div class="gps-time"></div>
        </div>
      </div>
    `;
  };

  // Capturar posición y mostrar en widget
  const capturar = async (containerId, callback) => {
    const btn = document.querySelector(`#${containerId} button`);
    if (btn) { btn.textContent = '⏳ Obteniendo…'; btn.disabled = true; }

    try {
      const pos = await obtenerPosicion();
      const resultDiv = document.getElementById(`${containerId}_result`);
      if (resultDiv) {
        resultDiv.classList.remove('hidden');
        resultDiv.querySelector('.gps-coords').textContent =
          `Lat: ${pos.latitude.toFixed(6)} · Lon: ${pos.longitude.toFixed(6)} (±${pos.accuracy.toFixed(0)}m)`;
        resultDiv.querySelector('.gps-address').textContent = pos.direccion;
        resultDiv.querySelector('.gps-time').textContent =
          `Capturado: ${new Date(pos.timestamp).toLocaleString('es-ES')}`;
      }
      if (btn) { btn.textContent = '✅ Actualizar'; btn.disabled = false; }
      if (callback) callback(pos);
      return pos;
    } catch (e) {
      if (btn) { btn.textContent = '❌ Error – Reintentar'; btn.disabled = false; }
      App.toast(e.message, 'error');
      return null;
    }
  };

  // Generar enlace Google Maps
  const googleMapsUrl = (lat, lon) =>
    `https://www.google.com/maps?q=${lat},${lon}`;

  // Generar enlace OpenStreetMap
  const openStreetMapUrl = (lat, lon) =>
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=17`;

  const getLastPosition = () => lastPosition;

  return { obtenerPosicion, renderWidget, capturar, googleMapsUrl, openStreetMapUrl, getLastPosition };
})();

window.GPSModule = GPSModule;
