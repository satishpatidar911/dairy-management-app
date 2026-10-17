// High-Performance Browser IndexedDB Storage for Instant Mobile & Offline Data Access
// Provides asynchronous key-value persistence without any external dependencies.

const DB_NAME = 'dairy_app_db';
const DB_VERSION = 1;
const STORE_NAME = 'dairy_store';

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('IndexedDB open error:', request.error);
      resolve(null);
    };
  });
}

export const idbStorage = {
  async get(key) {
    try {
      const db = await openDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('idbStorage.get error:', e);
      return null;
    }
  },

  async set(key, value) {
    try {
      const db = await openDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('idbStorage.set error:', e);
      return false;
    }
  },

  async delete(key) {
    try {
      const db = await openDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('idbStorage.delete error:', e);
      return false;
    }
  }
};
