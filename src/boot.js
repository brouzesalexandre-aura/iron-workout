/* ============================================================
   INIT
   ============================================================ */
function migrate(st) {
  const d = defaultState();
  st = Object.assign({}, d, st);
  st.profile = Object.assign({}, d.profile, st.profile || {});
  st.settings = Object.assign({}, d.settings, st.settings || {});
  st.nutrition = Object.assign({}, d.nutrition, st.nutrition || {});
  st.nutrition.targets = Object.assign({}, d.nutrition.targets, st.nutrition.targets || {});
  st.nutrition.log = st.nutrition.log || {};
  st.nutrition.foods = st.nutrition.foods || [];
  st.nutrition.recipes = st.nutrition.recipes || clone(RECIPES_SEED);
  st.nutrition.plans = st.nutrition.plans || clone(MEALPLANS_SEED);
  st.customExos = st.customExos || [];
  st.history = st.history || [];
  st.weights = st.weights || [];
  st.program = st.program || buildSeedProgram();
  delete st.gym;
  st.recovery = st.recovery || {};
  /* les anciennes séances n'ont pas de clé d'exercice : on la retrouve via le programme */
  (st.history || []).forEach(h => (h.entries || []).forEach(en => {
    if (en.k || !en.exoId) return;
    for (const d of st.program) { const e = (d.exos||[]).find(x => x.id === en.exoId); if (e && e.k) { en.k = e.k; break; } }
  }));
  st.v = 3;
  return st;
}

async function boot() {
  const saved = Store.load();
  S = saved ? migrate(saved) : defaultState();
  if (!saved) save();
  // barre d'action : menu
  document.getElementById('barActions').innerHTML =
    `<button class="iconbtn" onclick="App.menu()" title="Réglages"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/><circle cx="5" cy="12" r="1.7"/></svg></button>`;
  // précharge les photos perso pour un rendu synchrone
  try { await Media.preload(allPhotoKeys()); } catch (e) {}
  try { Update.autoCheck(); } catch (e) {}
  App.go('programme');
  if (!Store.ok) toast('⚠ Stockage local indisponible — données non sauvegardées');
  // service worker (si servi en http/https)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
// bouton d'installation PWA
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });

document.addEventListener('DOMContentLoaded', boot);
if (document.readyState !== 'loading') boot();
