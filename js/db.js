// IndexedDB storage: reports (metadata + entries) and blobs (photos, audio).
// Blobs are stored as ArrayBuffer + type for maximum compatibility (older Safari).

const DB_NAME = 'fotobericht';
const DB_VERSION = 1;
let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('reports')) db.createObjectStore('reports', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(store, mode, op) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = op(tx.objectStore(store));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaktion abgebrochen'));
  });
}

export const db = {
  allReports: () => run('reports', 'readonly', s => s.getAll()),
  getReport: id => run('reports', 'readonly', s => s.get(id)),
  putReport: report => run('reports', 'readwrite', s => s.put(report)),
  deleteReport: id => run('reports', 'readwrite', s => s.delete(id)),

  async putBlob(id, blob) {
    const data = await blob.arrayBuffer();
    return run('blobs', 'readwrite', s => s.put({ id, type: blob.type, data }));
  },
  async getBlob(id) {
    if (!id) return null;
    const rec = await run('blobs', 'readonly', s => s.get(id));
    return rec ? new Blob([rec.data], { type: rec.type }) : null;
  },
  deleteBlob: id => run('blobs', 'readwrite', s => s.delete(id)),
};

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
