// IndexedDB 키-값 저장소 (사용 불가 시 localStorage로 대체)
const DB = 'samsigi'; const STORE = 'kv';
let dbp = null;
function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('no idb'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}
function tx(mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(r?.result);
    t.onerror = () => reject(t.error);
  }));
}
const LS = 'samsigi:';
export async function getItem(key) {
  try { return await tx('readonly', (s) => s.get(key)); } catch (e) {
    try { const v = localStorage.getItem(LS + key); return v ? JSON.parse(v) : undefined; } catch { return undefined; }
  }
}
export async function setItem(key, value) {
  try { await tx('readwrite', (s) => s.put(value, key)); } catch (e) {
    try { localStorage.setItem(LS + key, JSON.stringify(value)); } catch { /* 저장 불가 */ }
  }
}
export async function clearAll() {
  try { await tx('readwrite', (s) => s.clear()); } catch { /* */ }
  try { Object.keys(localStorage).filter((k) => k.startsWith(LS)).forEach((k) => localStorage.removeItem(k)); } catch { /* */ }
}
