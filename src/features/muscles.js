/* ============================================================
   SCHÉMA « MUSCLES TRAVAILLÉS » D'UN EXERCICE
   ============================================================ */
const Muscles = {
  /* Retrouve les zones d'un exercice, même sur des données anciennes :
     1) zones portées par l'entrée  2) clé de bibliothèque  3) correspondance par nom
     4) dernier recours : le groupe musculaire de l'exercice */
  zonesOf(e) {
    e = e || {};
    let b = (e.k && LIBMAP[e.k]) || null;
    if (!b && e.name) {
      const n = String(e.name).toLowerCase().trim();
      b = LIB.find(x => x.name.toLowerCase().trim() === n) || null;
    }
    b = b || {};
    let zp = (e.zp && e.zp.length) ? e.zp.slice() : (b.zp || []).slice();
    let zs = (e.zs && e.zs.length) ? e.zs.slice() : (b.zs || []).slice();
    if (!zp.length) zp = (CAT_ZONES[e.cat || b.cat] || []).slice();
    zs = zs.filter(z => !zp.includes(z));
    const mp = zp.map(ZLABEL), ms = zs.map(ZLABEL);
    return { zp, zs, mp: mp.length ? mp : ((e.mp && e.mp.length) ? e.mp : (b.mp || [])),
                     ms: ms.length ? ms : ((e.ms && e.ms.length) ? e.ms : (b.ms || [])) };
  },
  /* Injection différée : le schéma n'est construit qu'à la première ouverture */
  fill(elId, e) {
    const el = document.getElementById(elId);
    if (!el || el.dataset.done) return;
    el.dataset.done = '1';
    const z = this.zonesOf(e);
    el.innerHTML = muscleMap(z.zp, z.zs);
  },
  show(e) {
    const z = this.zonesOf(e);
    const body = (z.zp.length || z.zs.length)
      ? muscleMap(z.zp, z.zs) +
        `<div class="chips" style="margin-top:14px;justify-content:center">
          ${z.mp.map(m => `<span class="chip cm">${esc(m)}</span>`).join('')}
          ${z.ms.map(m => `<span class="chip cs">${esc(m)}</span>`).join('')}</div>`
      : `<div class="empty"><p>Muscles non renseignés pour cet exercice.<br>
          Ouvre-le dans Exercices pour lui associer un groupe musculaire.</p></div>`;
    Modal.open(e.name || 'Muscles travaillés', body, '');
  },
};

/* Repli si un exercice n'a aucune zone : on colorie son groupe musculaire */
const CAT_ZONES = {
  'Pecto':      ['pecs', 'pecs_up'],
  'Dos':        ['lats', 'midback'],
  'Épaules':    ['delt_ant', 'delt_lat', 'delt_post'],
  'Biceps':     ['biceps'],
  'Triceps':    ['triceps'],
  'Jambes':     ['quads', 'hams'],
  'Fessiers':   ['glutes'],
  'Abdos':      ['abs_up', 'abs_low'],
  'Avant-bras': ['forearms'],
  'Mollets':    ['calves', 'soleus'],
  'Trapèzes':   ['traps'],
  'Cou':        ['neck'],
};
