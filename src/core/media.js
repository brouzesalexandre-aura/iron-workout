/* ============================================================
   MÉDIAS — photos, GIF et vidéos attachés aux exercices
   ============================================================
   Les images restent stockées en dataURL (compatibilité avec les photos
   déjà enregistrées). Les vidéos sont stockées en Blob : une vidéo de
   quelques secondes pèse plusieurs mégaoctets, la garder en base64 ferait
   exploser le quota. Chaque vidéo est accompagnée d'une vignette extraite
   de sa première image, pour les listes.
   ============================================================ */

const MEDIA_DB = 'iron_media', MEDIA_STORE = 'media';
const MediaCache = {};          // clé -> objectURL (vidéos) ou dataURL (images)
const PosterCache = {};         // clé -> dataURL de la vignette d'une vidéo

const Media = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open(MEDIA_DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(MEDIA_STORE);
      r.onsuccess = () => { this._db = r.result; res(r.result); };
      r.onerror = () => rej(r.error);
    });
  },
  async _tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction(MEDIA_STORE, mode);
      const rq = fn(t.objectStore(MEDIA_STORE));
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  },
  put(key, rec) { return this._tx('readwrite', s => s.put(rec, key)); },
  get(key) { return this._tx('readonly', s => s.get(key)); },
  del(key) {
    if (MediaCache[key] && String(MediaCache[key]).startsWith('blob:')) URL.revokeObjectURL(MediaCache[key]);
    delete MediaCache[key]; delete PosterCache[key];
    return this._tx('readwrite', s => s.delete(key));
  },

  /* Charge en mémoire les médias nécessaires à un rendu synchrone */
  async preload(keys) {
    for (const k of keys) {
      if (MediaCache[k] !== undefined) continue;
      let rec = null;
      try { rec = await this.get(k); } catch (e) {}
      if (!rec) {                                   // ancienne photo : store historique
        try { const d = await Photos.get(k); if (d) { MediaCache[k] = d; PhotoCache[k] = d; } } catch (e) {}
        continue;
      }
      if (rec.type === 'video') {
        MediaCache[k] = URL.createObjectURL(rec.blob);
        PosterCache[k] = rec.poster || '';
      } else {
        MediaCache[k] = rec.data;
        PhotoCache[k] = rec.data;
      }
    }
  },

  isVideo(key) { return !!PosterCache[key]; },

  /* Enregistre un fichier choisi par l'utilisateur, image ou vidéo */
  async addFile(file) {
    if (!file) return null;
    const key = 'md_' + uid();
    if (file.type.startsWith('video/')) {
      const poster = await videoPoster(file).catch(() => '');
      await this.put(key, { type: 'video', mime: file.type, blob: file, poster });
      MediaCache[key] = URL.createObjectURL(file);
      PosterCache[key] = poster;
    } else {
      /* les GIF ne doivent pas passer par le canvas : ils y perdraient l'animation */
      const data = file.type === 'image/gif'
        ? await fileToRawDataURL(file)
        : await fileToDataURL(file);
      await this.put(key, { type: 'image', mime: file.type, data });
      MediaCache[key] = data; PhotoCache[key] = data;
    }
    return key;
  },

  /* Balise HTML d'un média stocké. big = lecture vidéo en boucle */
  tag(key, big) {
    const src = MediaCache[key];
    if (!src) return '';
    if (this.isVideo(key)) {
      return big
        ? `<video src="${src}" poster="${PosterCache[key]}" autoplay loop muted playsinline></video>`
        : `<img src="${PosterCache[key]}" alt=""><span class="vbadge">▶</span>`;
    }
    return `<img src="${src}" alt="" loading="lazy">`;
  },
};

/* Lit un fichier sans le recompresser (GIF animés) */
function fileToRawDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

/* Extrait la première image d'une vidéo pour servir de vignette */
function videoPoster(file) {
  return new Promise((res, rej) => {
    const v = document.createElement('video');
    v.preload = 'metadata'; v.muted = true; v.playsInline = true;
    v.src = URL.createObjectURL(file);
    const done = () => {
      try {
        const r = Math.min(480 / v.videoWidth, 480 / v.videoHeight, 1);
        const c = document.createElement('canvas');
        c.width = v.videoWidth * r; c.height = v.videoHeight * r;
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.7));
      } catch (e) { res(''); }
      finally { URL.revokeObjectURL(v.src); }
    };
    v.onloadeddata = () => { v.currentTime = Math.min(0.1, (v.duration || 1) / 4); };
    v.onseeked = done;
    v.onerror = () => { URL.revokeObjectURL(v.src); rej(new Error('vidéo illisible')); };
  });
}
