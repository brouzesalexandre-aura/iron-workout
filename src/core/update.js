/* ============================================================
   MISE À JOUR — vérifie les releases GitHub et installe l'APK
   ============================================================
   L'app n'est pas distribuée par un store : elle interroge elle-même
   l'API GitHub. Si l'APK Android expose le pont natif IronNative, la
   nouvelle version est téléchargée puis remise à l'installeur système
   (une confirmation Android reste obligatoire, c'est voulu). Sinon on
   se contente d'ouvrir la page de la release.
   ============================================================ */

const GH_REPO = '@@GH_REPO@@';
const RELEASES_API = `https://api.github.com/repos/${GH_REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${GH_REPO}/releases/latest`;

/* Compare deux versions « 2.6.1 ». Renvoie 1 si a > b, -1 si a < b, 0 si égales. */
function cmpVersion(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

const Update = {
  native() {
    try { return typeof IronNative !== 'undefined' && !!IronNative.canInstall(); } catch (e) { return false; }
  },
  /* En file:// sans pont natif, l'API GitHub est bloquée par la CORS : inutile d'essayer. */
  available() { return this.native() || location.protocol.startsWith('http'); },

  /* Vérification silencieuse au démarrage, une fois par jour au maximum */
  autoCheck() {
    if (!navigator.onLine || !this.available()) return;
    const last = +(S.settings.updCheck || 0);
    if (Date.now() - last < 20 * 3600 * 1000) return;
    S.settings.updCheck = Date.now(); save();
    this.check(true);
  },

  async check(silent) {
    if (!silent) toast('Recherche d\'une mise à jour…');
    let rel;
    try {
      /* le pont natif évite la CORS : en WebView l'origine est file:// */
      if (this.native()) {
        rel = JSON.parse(IronNative.fetchLatestRelease());
      } else {
        const r = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        rel = await r.json();
      }
    } catch (e) {
      if (!silent) toast('⚠ Impossible de joindre GitHub');
      return null;
    }
    const version = String(rel.tag_name || '').replace(/^v/, '');
    if (!version || cmpVersion(version, APP_VERSION) <= 0) {
      if (!silent) toast('IRON ' + APP_VERSION + ' est à jour ✓');
      return null;
    }
    const apk = (rel.assets || []).find(a => a.name.toLowerCase().endsWith('.apk'));
    this.pending = { version, url: apk && apk.browser_download_url, notes: rel.body || '', page: rel.html_url || RELEASES_PAGE };
    this.banner();
    return this.pending;
  },

  banner() {
    const u = this.pending; if (!u) return;
    let el = document.getElementById('updbar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'updbar'; el.className = 'updbar';
      document.body.appendChild(el);
    }
    el.innerHTML = `<div><b>IRON ${esc(u.version)} disponible</b><span>Tu es en ${APP_VERSION}</span></div>
      <button class="btn sm primary" onclick="Update.start()">Installer</button>
      <button class="updclose" onclick="Update.dismiss()">✕</button>`;
    el.classList.add('show');
  },
  dismiss() {
    const el = document.getElementById('updbar');
    if (el) el.classList.remove('show');
  },

  start() {
    const u = this.pending; if (!u) return;
    if (!u.url) { window.open(u.page, '_blank'); return; }
    if (this.native()) {
      toast('Téléchargement de la mise à jour…');
      try { IronNative.downloadAndInstall(u.url, u.version); }
      catch (e) { window.open(u.url, '_blank'); }
    } else {
      window.open(u.url, '_blank');
    }
    this.dismiss();
  },

  /* Détail affiché depuis Réglages */
  async panel() {
    Modal.open('Mise à jour', '<p class="hint">Recherche en cours…</p>', '');
    const u = await this.check(true);
    const body = u
      ? `<div class="field"><label>Nouvelle version</label>
           <p class="hint">IRON <b style="color:var(--text)">${esc(u.version)}</b> est disponible (tu es en ${APP_VERSION}).</p></div>
         ${u.notes ? `<div class="tip" style="white-space:pre-wrap">${esc(u.notes.slice(0, 600))}</div>` : ''}
         <p class="hint" style="margin-top:12px">Tes données sont conservées : l'installation se fait par-dessus, sans désinstaller.</p>`
      : `<div class="empty"><p>IRON ${APP_VERSION} est à jour ✓</p></div>`;
    Modal.open('Mise à jour', body,
      u ? `<button class="btn wide ghost" onclick="Modal.close()">Plus tard</button>
           <button class="btn wide primary" onclick="Modal.close();Update.start()">Installer</button>`
        : `<button class="btn wide primary" onclick="Modal.close()">Fermer</button>`);
  },
};
