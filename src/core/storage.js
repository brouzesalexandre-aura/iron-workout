/* ============================================================
   STORAGE — localStorage (état) + IndexedDB (photos) + repli mémoire
   ============================================================ */
const SKEY = 'iron_state_v2';
let mem = null; // repli si localStorage indisponible

const Store = {
  ok: (() => { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch (e) { return false; } })(),
  load() {
    if (!this.ok) return mem;
    try { const raw = localStorage.getItem(SKEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  },
  save(state) {
    if (!this.ok) { mem = state; return; }
    try { localStorage.setItem(SKEY, JSON.stringify(state)); }
    catch (e) { console.warn('save fail', e); toast('⚠ Stockage plein — libère de l\'espace'); }
  }
};

/* ---- IndexedDB pour les photos (clé -> dataURL) ---- */
const Photos = {
  _db: null,
  open() {
    return new Promise((res) => {
      if (this._db) return res(this._db);
      if (!('indexedDB' in window)) { this._mem = this._mem || {}; return res(null); }
      try {
        const r = indexedDB.open('iron_photos', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('img'); };
        r.onsuccess = () => { this._db = r.result; res(this._db); };
        r.onerror = () => { this._mem = this._mem || {}; res(null); };
      } catch (e) { this._mem = this._mem || {}; res(null); }
    });
  },
  async put(key, dataURL) {
    const db = await this.open();
    if (!db) { this._mem[key] = dataURL; return; }
    return new Promise((res) => { const tx = db.transaction('img', 'readwrite'); tx.objectStore('img').put(dataURL, key); tx.oncomplete = res; tx.onerror = res; });
  },
  async get(key) {
    const db = await this.open();
    if (!db) return this._mem ? this._mem[key] : null;
    return new Promise((res) => { const tx = db.transaction('img', 'readonly'); const rq = tx.objectStore('img').get(key); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); });
  },
  async del(key) {
    const db = await this.open();
    if (!db) { if (this._mem) delete this._mem[key]; return; }
    return new Promise((res) => { const tx = db.transaction('img', 'readwrite'); tx.objectStore('img').delete(key); tx.oncomplete = res; tx.onerror = res; });
  }
};
// Cache mémoire des dataURL déjà chargées (pour affichage synchrone)
const PhotoCache = {};
async function preloadPhotos(keys) {
  await Promise.all((keys || []).filter(k => !(k in PhotoCache)).map(async k => { PhotoCache[k] = await Photos.get(k); }));
}

/* ---- Lecture / redimensionnement d'une image uploadée -> dataURL compressé ---- */
function fileToDataURL(file, maxDim = 900, quality = 0.8) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxDim || h > maxDim) { const r = Math.min(maxDim / w, maxDim / h); w = Math.round(w * r); h = Math.round(h * r); }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        try { res(c.toDataURL('image/jpeg', quality)); } catch (e) { res(fr.result); }
      };
      img.onerror = () => res(fr.result);
      img.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}
