/**
 * LegioCert Pro - Configuración Global
 * Parámetros, constantes y configuración de la aplicación
 */

const CONFIG = {
  APP_NAME: 'LegioCert Pro',
  APP_VERSION: '1.0.0',
  APP_AUTHOR: 'Duarte Conection',
  APP_EMAIL: 'duarteconection@gmail.com',

  // Normativa aplicable
  NORMATIVA: {
    RD_487: 'Real Decreto 487/2022',
    RD_614: 'Real Decreto 614/2024',
    UNE: 'UNE 100030:2017+A1:2018',
  },

  // Textos legales automáticos para certificados
  TEXTOS_LEGALES: {
    intro: 'El presente certificado acredita la realización del tratamiento de desinfección conforme a lo establecido en el Real Decreto 487/2022, de 21 de junio, por el que se establecen los requisitos técnico-sanitarios para la prevención y control de la legionelosis, modificado por el Real Decreto 614/2024.',
    metodo: 'El tratamiento se ha realizado según el protocolo establecido en la UNE 100030:2017+A1:2018, Guía para la prevención y control de la proliferación y diseminación de Legionella en instalaciones.',
    validez: 'Este certificado es válido como documento acreditativo del mantenimiento higiénico-sanitario realizado en la instalación descrita.',
  },

  // Protocolos de cloro (ppm)
  PROTOCOLOS_CLORO: {
    MANTENIMIENTO: { ppm: 20, descripcion: 'Choque de mantenimiento', tiempoContacto: 2 },
    DESINFECCION: { ppm: 50, descripcion: 'Desinfección preventiva', tiempoContacto: 6 },
    CHOQUE: { ppm: 150, descripcion: 'Choque por Legionella positivo', tiempoContacto: 12 },
  },

  // Productos químicos y conversiones
  PRODUCTOS: {
    CLORO_GRANULADO: { nombre: 'Cloro granulado (65%)', concentracion: 0.65, unidad: 'kg', densidad: null },
    HIPOCLORITO_SODICO: { nombre: 'Hipoclorito sódico (12%)', concentracion: 0.12, unidad: 'L', densidad: 1.21 },
    DIOXIDO_CLORO: { nombre: 'Dióxido de cloro (0.3%)', concentracion: 0.003, unidad: 'L', densidad: 1.0 },
  },

  // Conversiones de volumen
  CONVERSIONES: {
    L_A_M3: 0.001,
    M3_A_L: 1000,
    L_A_GAL: 0.264172,
    GAL_A_L: 3.78541,
    M3_A_GAL: 264.172,
    GAL_A_M3: 0.00378541,
  },

  // Tipos de instalación
  TIPOS_INSTALACION: [
    'ACS (Agua Caliente Sanitaria)',
    'AFCH (Agua Fría de Consumo Humano)',
    'Depósito de agua',
    'Piscina',
    'SPA / Jacuzzi',
    'Torre de refrigeración',
    'Humectador',
    'Fuente ornamental',
    'Sistema de riego',
    'Otro',
  ],

  // Materiales de instalación
  MATERIALES: ['Cobre', 'Acero inoxidable', 'PVC', 'Polietileno', 'Fibra de vidrio', 'Hierro galvanizado', 'Otro'],

  // Provincias de España
  PROVINCIAS: [
    'Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Barcelona','Burgos','Cáceres',
    'Cádiz','Cantabria','Castellón','Ciudad Real','Córdoba','Cuenca','Girona','Granada','Guadalajara',
    'Guipúzcoa','Huelva','Huesca','Islas Baleares','Jaén','La Coruña','La Rioja','Las Palmas','León',
    'Lleida','Lugo','Madrid','Málaga','Murcia','Navarra','Ourense','Palencia','Pontevedra','Salamanca',
    'Santa Cruz de Tenerife','Segovia','Sevilla','Soria','Tarragona','Teruel','Toledo','Valencia',
    'Valladolid','Vizcaya','Zamora','Zaragoza','Ceuta','Melilla',
  ],

  // Colores del tema
  COLORES: {
    PRIMARY: '#0A2342',
    PRIMARY_LIGHT: '#1565C0',
    ACCENT: '#00BCD4',
    ACCENT_DARK: '#0097A7',
    SUCCESS: '#26C281',
    WARNING: '#F39C12',
    DANGER: '#E74C3C',
    TEXT: '#1A1A2E',
    TEXT_LIGHT: '#6B7280',
    BG: '#F0F4F8',
    BG_DARK: '#0D1B2A',
    WHITE: '#FFFFFF',
  },

  // Configuración de PDF
  PDF: {
    EMPRESA: 'Duarte Conection',
    CIF_EMPRESA: '',
    TELEFONO_EMPRESA: '',
    EMAIL_EMPRESA: 'duarteconection@gmail.com',
    DIRECCION_EMPRESA: '',
    LOGO_URL: null,
  },

  // Costes por defecto
  COSTES: {
    MANO_OBRA_HORA: 35,
    DESPLAZAMIENTO_KM: 0.35,
    MARGEN_DEFECTO: 30,
  },
};

// Exportar para uso global
window.CONFIG = CONFIG;
