/**
 * LegioCert Pro - Base de Datos (IndexedDB)
 * Capa de acceso a datos con soporte offline completo
 */

const DB = (() => {
  const DB_NAME = 'LegioCertPro';
  const DB_VERSION = 1;
  let db = null;

  // Esquema de stores
  const STORES = {
    clientes: { keyPath: 'id', autoIncrement: true, indexes: ['nombre', 'empresa', 'cif'] },
    instalaciones: { keyPath: 'id', autoIncrement: true, indexes: ['clienteId', 'tipo'] },
    tratamientos: { keyPath: 'id', autoIncrement: true, indexes: ['clienteId', 'instalacionId', 'fecha'] },
    certificados: { keyPath: 'id', autoIncrement: true, indexes: ['tratamientoId', 'numero', 'fecha'] },
    productos: { keyPath: 'id', autoIncrement: true, indexes: ['nombre', 'lote'] },
    agenda: { keyPath: 'id', autoIncrement: true, indexes: ['fecha', 'clienteId'] },
    config: { keyPath: 'clave' },
    fotos: { keyPath: 'id', autoIncrement: true, indexes: ['tratamientoId'] },
  };

  // Abrir / inicializar base de datos
  const init = () => {
    return new Promise((resolve, reject) => {
      if (db) { resolve(db); return; }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const idb = e.target.result;

        Object.entries(STORES).forEach(([name, schema]) => {
          if (!idb.objectStoreNames.contains(name)) {
            const store = idb.createObjectStore(name, {
              keyPath: schema.keyPath,
              autoIncrement: schema.autoIncrement || false,
            });
            (schema.indexes || []).forEach(idx => {
              store.createIndex(idx, idx, { unique: false });
            });
          }
        });
      };

      request.onsuccess = (e) => { db = e.target.result; resolve(db); };
      request.onerror = (e) => reject(e.target.error);
    });
  };

  // Operación genérica de transacción
  const tx = (storeName, mode = 'readonly') => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  };

  // CRUD genérico
  const getAll = (storeName, indexName = null, value = null) => {
    return new Promise((resolve, reject) => {
      const store = tx(storeName);
      let request;
      if (indexName && value !== null) {
        const index = store.index(indexName);
        request = index.getAll(value);
      } else {
        request = store.getAll();
      }
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const getById = (storeName, id) => {
    return new Promise((resolve, reject) => {
      const store = tx(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const add = (storeName, data) => {
    return new Promise((resolve, reject) => {
      const store = tx(storeName, 'readwrite');
      const obj = { ...data, createdAt: Date.now(), updatedAt: Date.now() };
      const request = store.add(obj);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const update = (storeName, data) => {
    return new Promise((resolve, reject) => {
      const store = tx(storeName, 'readwrite');
      const obj = { ...data, updatedAt: Date.now() };
      const request = store.put(obj);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const remove = (storeName, id) => {
    return new Promise((resolve, reject) => {
      const store = tx(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  };

  const count = (storeName) => {
    return new Promise((resolve, reject) => {
      const store = tx(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  // Buscar con filtro (búsqueda en cliente)
  const search = (storeName, query, fields) => {
    return new Promise((resolve, reject) => {
      const store = tx(storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const q = query.toLowerCase();
        const results = request.result.filter(item =>
          fields.some(f => item[f] && String(item[f]).toLowerCase().includes(q))
        );
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  };

  // Exportar toda la BD
  const exportAll = () => {
    return new Promise(async (resolve) => {
      const data = {};
      for (const storeName of Object.keys(STORES)) {
        data[storeName] = await getAll(storeName);
      }
      resolve(data);
    });
  };

  // Importar datos
  const importAll = (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        for (const [storeName, records] of Object.entries(data)) {
          if (!STORES[storeName]) continue;
          const store = tx(storeName, 'readwrite');
          await new Promise(res => { const r = store.clear(); r.onsuccess = res; });
          for (const record of records) {
            await update(storeName, record);
          }
        }
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  // Config key-value
  const getConfig = (clave) => {
    return new Promise((resolve, reject) => {
      const store = tx('config');
      const request = store.get(clave);
      request.onsuccess = () => resolve(request.result ? request.result.valor : null);
      request.onerror = () => reject(request.error);
    });
  };

  const setConfig = (clave, valor) => {
    return new Promise((resolve, reject) => {
      const store = tx('config', 'readwrite');
      const request = store.put({ clave, valor });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  };

  // Generar número de certificado
  const nextCertNumber = async () => {
    let n = await getConfig('cert_counter');
    n = n ? parseInt(n) + 1 : 1;
    await setConfig('cert_counter', n);
    const year = new Date().getFullYear();
    return `LC-${year}-${String(n).padStart(4, '0')}`;
  };

  return { init, getAll, getById, add, update, remove, count, search, exportAll, importAll, getConfig, setConfig, nextCertNumber };
})();

window.DB = DB;
