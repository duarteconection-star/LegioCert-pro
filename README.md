# LegioCert Pro v1.0.0

Aplicación profesional para gestión de tratamientos antilegionella.

## Normativa
- Real Decreto 487/2022
- Real Decreto 614/2024  
- UNE 100030:2017+A1:2018

---

## Estructura de archivos

```
legiocert-pro/
├── index.html          ← Punto de entrada
├── style.css           ← Estilos completos
├── app.js              ← Núcleo, router, layout
├── config.js           ← Configuración global
├── db.js               ← Base de datos IndexedDB
├── clientes.js         ← Módulo clientes
├── instalaciones.js    ← Módulo instalaciones
├── calculadora.js      ← Calculadora profesional
├── legionella.js       ← Registro de tratamientos
├── gps.js              ← Geolocalización GPS
├── firma.js            ← Firmas digitales canvas
├── fotos.js            ← Gestión de fotografías
├── pdf.js              ← Generador de certificados
├── historial.js        ← Historial y exportación
├── dashboard.js        ← Panel de control
├── agenda.js           ← Calendario y avisos
├── productos.js        ← Inventario y stock
├── manifest.json       ← PWA manifest
├── service-worker.js   ← Caché offline
└── assets/
    ├── icons/          ← Iconos PWA (192px, 512px mínimo)
    └── logos/          ← Logo de empresa
```

---

## Instalación y despliegue

### Opción A – GitHub Pages (recomendado para Android)
1. Crea un repositorio en GitHub
2. Sube todos los archivos
3. En Settings → Pages → Source: main branch
4. URL: `https://tuusuario.github.io/legiocert-pro/`
5. En Android Chrome → "Añadir a pantalla de inicio" → instala como PWA

### Opción B – WebIntoApp
1. Sube los archivos a GitHub Pages (paso anterior)
2. En WebIntoApp.com → nueva app → introduce la URL
3. Descarga el APK → instala en Android

### Opción C – Servidor local (pruebas)
```bash
# Con Python
python -m http.server 8080

# Con Node.js
npx serve .

# Con PHP
php -S localhost:8080
```
Abre: `http://localhost:8080`

> ⚠️ IMPORTANTE: La app debe servirse desde HTTPS o localhost.
> El GPS y la instalación PWA no funcionan en HTTP puro.

---

## Iconos PWA (necesarios)

Crea o coloca en `assets/icons/`:
- icon-192.png (obligatorio)
- icon-512.png (obligatorio)
- icon-72, 96, 128, 144, 152, 384.png (opcionales)

La app genera iconos automáticamente desde canvas si no existen los archivos PNG.

---

## Características principales

✅ Clientes con CIF, dirección, provincia  
✅ Instalaciones por cliente (ACS, AFCH, Piscinas, Torres, etc.)  
✅ Calculadora: cloro granulado, hipoclorito, dióxido de cloro  
✅ Protocolos 20/50/150 ppm con tiempo de contacto  
✅ Registro completo: pH, temperatura, cloro libre/combinado  
✅ Cronómetro de tratamiento integrado  
✅ Fotografías antes/durante/después con compresión  
✅ GPS con geocodificación inversa (Nominatim)  
✅ Doble firma digital (técnico + cliente) en canvas  
✅ Certificado PDF profesional con QR, logos y textos legales  
✅ Historial con filtros y exportación CSV/JSON/PDF  
✅ Agenda con calendario y avisos configurables  
✅ Inventario de productos con alertas de caducidad y stock  
✅ Cálculo de costes: mano de obra, desplazamiento, margen  
✅ Dashboard con gráficos de actividad  
✅ Modo oscuro / claro  
✅ PWA instalable en Android  
✅ Funcionamiento 100% offline (IndexedDB)  
✅ Backup y restauración de datos  

---

## Configuración inicial

1. Abre la app → ve a **Configuración** (⚙️)
2. Rellena los datos de empresa (nombre, CIF, email, teléfono)
3. Ajusta las tarifas por defecto (precio/hora, km, margen)
4. Añade tus clientes e instalaciones
5. ¡Listo para registrar tratamientos!

---

## Sincronización futura (Firebase / Supabase)

La arquitectura está preparada para sincronización en la nube.
El módulo `db.js` puede extenderse añadiendo un adaptador:

```javascript
// Ejemplo futuro en db.js
const syncWithSupabase = async () => {
  const { data } = await supabase.from('tratamientos').upsert(localData);
};
```

---

## Autor
**Duarte Conection** · duarteconection@gmail.com  
LegioCert Pro v1.0.0
