/* ============================================================
   CHARGE MUSCULAIRE — fatigue, récupération, schéma corporel
   ============================================================ */

/* Difficulté ressentie d'une série -> coefficient d'effort */
const DIFFS = [
  { k:'facile',  lab:'Facile',  ic:'😌', col:'#2ECC71', eff:0.55 },
  { k:'correct', lab:'Correct', ic:'💪', col:'#4E9BFF', eff:1.00 },
  { k:'dur',     lab:'Dur',     ic:'🔥', col:'#F39C12', eff:1.35 },
  { k:'echec',   lab:'Échec',   ic:'💀', col:'#E8432D', eff:1.60 },
];
const DIFFMAP = Object.fromEntries(DIFFS.map(d => [d.k, d]));
const SECONDARY_SHARE = 0.45;   // part de charge reçue par un muscle secondaire

/* Échelle de couleurs : 0 % bleu -> 100 % rouge */
const HEAT = [
  [0.00, [ 46,125,209]],  // bleu   — frais
  [0.25, [ 46,204,113]],  // vert   — prêt
  [0.50, [241,196, 15]],  // jaune  — partiellement récupéré
  [0.75, [255,149,  0]],  // orange — encore chargé
  [1.00, [232, 67, 45]],  // rouge  — saturé
];
function heatColor(p) {
  p = Math.max(0, Math.min(1, p || 0));
  for (let i = 1; i < HEAT.length; i++) {
    if (p <= HEAT[i][0]) {
      const [p0, c0] = HEAT[i-1], [p1, c1] = HEAT[i];
      const t = (p - p0) / (p1 - p0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * t));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return 'rgb(232,67,45)';
}

const Fatigue = {
  /* multiplicateur de récupération réglé par l'utilisateur (1 = normal) */
  mult(z) { return (S.recovery && S.recovery[z]) || 1; },
  recHours(z) { return (ZMAPZ[z] ? ZMAPZ[z].rec : 48) * this.mult(z); },
  cap(z) { return ZMAPZ[z] ? ZMAPZ[z].cap : 12; },

  /* Zones touchées par un exercice (à partir de sa clé de bibliothèque ou de ses zones) */
  zonesOf(src) {
    if (!src) return { zp: [], zs: [] };
    if (src.zp || src.zs) return { zp: src.zp || [], zs: src.zs || [] };
    const b = LIBMAP[src.k]; return b ? { zp: b.zp || [], zs: b.zs || [] } : { zp: [], zs: [] };
  },

  /* Unités de charge d'une séance (terminée ou en cours) -> { zone: unités } */
  unitsOfSession(sess, onlyDone = true) {
    const u = {};
    (sess.entries || []).forEach(en => {
      const src = LIBMAP[en.k] || (en.exoId && this._exoInProgram(en.exoId)) || { zp: en.zp, zs: en.zs };
      const { zp, zs } = this.zonesOf(src);
      if (!zp.length && !zs.length) return;
      (en.sets || []).forEach(st => {
        if (onlyDone && !st.done) return;
        const eff = (DIFFMAP[st.d] || DIFFMAP.correct).eff;
        zp.forEach(z => u[z] = (u[z] || 0) + eff);
        zs.forEach(z => u[z] = (u[z] || 0) + eff * SECONDARY_SHARE);
      });
    });
    return u;
  },
  _exoInProgram(exoId) {
    for (const d of S.program) { const e = d.exos.find(x => x.id === exoId); if (e) return e; }
    return null;
  },

  /* Charge estimée d'un jour du programme (séries prévues, effort « correct ») */
  unitsOfDay(day) {
    const u = {};
    (day.exos || []).forEach(e => {
      const { zp, zs } = this.zonesOf(LIBMAP[e.k] || e);
      const n = Math.max(1, +e.sets || 1);
      zp.forEach(z => u[z] = (u[z] || 0) + n);
      zs.forEach(z => u[z] = (u[z] || 0) + n * SECONDARY_SHARE);
    });
    return u;
  },

  toPct(units) {
    const out = {};
    ZONES.forEach(z => { out[z.z] = Math.min(1.6, (units[z.z] || 0) / this.cap(z.z)); });
    return out;
  },

  /* Fatigue résiduelle actuelle : décroissance linéaire à vitesse 1 / recHours */
  current(atMs) {
    const now = atMs || Date.now();
    const res = {}; const meta = {};
    ZONES.forEach(z => { res[z.z] = 0; meta[z.z] = { last: null, sessions: 0 }; });
    const sessions = S.history.slice(-40);
    if (S.activeSession) sessions.push(S.activeSession);
    sessions.forEach(s => {
      const end = new Date(s.endDate || s.date).getTime();
      const hours = Math.max(0, (now - end) / 3600000);
      const pct = this.toPct(this.unitsOfSession(s));
      ZONES.forEach(zo => {
        const z = zo.z; if (!pct[z]) return;
        const rem = Math.max(0, pct[z] - hours / this.recHours(z));
        if (rem > 0) { res[z] += rem; meta[z].sessions++; }
        if (pct[z] > 0.05 && (!meta[z].last || end > meta[z].last)) meta[z].last = end;
      });
    });
    ZONES.forEach(z => { res[z.z] = Math.min(1, res[z.z]); });
    this._meta = meta;
    return res;
  },

  /* Heures restantes avant récupération complète d'une zone */
  readyIn(z, cur) {
    const v = (cur || this.current())[z] || 0;
    return v <= 0 ? 0 : v * this.recHours(z);
  },
  /* Heures avant de repasser sous 50 % (zone de nouveau entraînable) */
  trainableIn(z, cur) {
    const v = (cur || this.current())[z] || 0;
    return v <= 0.5 ? 0 : (v - 0.5) * this.recHours(z);
  },
};

function fmtHours(h) {
  if (h <= 0) return 'maintenant';
  if (h < 1) return Math.round(h * 60) + ' min';
  if (h < 24) return Math.round(h) + ' h';
  const d = Math.floor(h / 24), r = Math.round(h % 24);
  return d + ' j' + (r ? ' ' + r + ' h' : '');
}

const Charge = {
  mode: 'now',      // 'now' | 'day' | 'prog'
  dayIdx: 0,

  values() {
    if (this.mode === 'day') {
      const d = S.program[this.dayIdx]; return d ? Fatigue.toPct(Fatigue.unitsOfDay(d)) : {};
    }
    if (this.mode === 'prog') {
      const u = {};
      S.program.forEach(d => { const du = Fatigue.unitsOfDay(d); for (const k in du) u[k] = (u[k]||0) + du[k]; });
      const pct = {}; ZONES.forEach(z => pct[z.z] = Math.min(1.6, (u[z.z]||0) / (Fatigue.cap(z.z) * 1.8)));
      return pct;
    }
    return Fatigue.current();
  },

  render() {
    const v = document.getElementById('v-charge');
    const val = this.values();
    this._cache = val;
    const isNow = this.mode === 'now';
    const sorted = ZONES.slice().sort((a, b) => (val[b.z]||0) - (val[a.z]||0));
    const worked = sorted.filter(z => (val[z.z]||0) > 0.02);

    v.innerHTML = `
      <div class="sec-hd"><div><h2>CHARGE <span>MUSCULAIRE</span></h2>
        <p>${isNow ? 'Fatigue actuelle et récupération' : this.mode === 'day' ? 'Sollicitation prévue de la séance' : 'Répartition sur tout le programme'}</p></div></div>

      <div class="subtabs">
        <button class="subtab ${isNow?'on':''}" onclick="Charge.setMode('now')">Maintenant</button>
        <button class="subtab ${this.mode==='day'?'on':''}" onclick="Charge.setMode('day')">Une séance</button>
        <button class="subtab ${this.mode==='prog'?'on':''}" onclick="Charge.setMode('prog')">Programme</button>
      </div>

      ${this.mode === 'day' ? `<div class="field" style="margin-bottom:12px"><select class="select" onchange="Charge.pickDay(this.value)">
        ${S.program.map((d,i)=>`<option value="${i}"${i===this.dayIdx?' selected':''}>J${i+1} · ${esc(d.name)}</option>`).join('')}
      </select></div>` : ''}

      <div class="card" style="padding:14px 10px 10px">
        <div class="bodywrap">
          <div class="bodycol"><div class="bodylab">Avant</div>${bodySVG('front')}</div>
          <div class="bodycol"><div class="bodylab">Arrière</div>${bodySVG('back')}</div>
        </div>
        <div class="heatscale">
          <span>0 %</span><div class="heatbar"></div><span>100 %</span>
        </div>
        <p class="hint" style="text-align:center;margin-top:8px">
          ${isNow ? 'Bleu : récupéré · Rouge : à laisser récupérer' : 'Intensité de sollicitation'} — touche un muscle pour le détail</p>
      </div>

      ${isNow ? this._readyBlock(val) : ''}

      <div class="sec-hd" style="margin-top:22px"><div><h2>${isNow ? 'PAR MUSCLE' : 'DÉTAIL'}</h2>
        <p>${worked.length} muscle${worked.length>1?'s':''} concerné${worked.length>1?'s':''}</p></div></div>
      ${worked.length ? worked.map(z => this._row(z, val[z.z])).join('')
        : '<div class="empty"><p>Aucune charge enregistrée.<br>Termine une séance pour voir le schéma se remplir.</p></div>'}

      ${isNow ? `<button class="btn ghost block" style="margin-top:16px" onclick="Charge.settings()">⚙ Régler ma vitesse de récupération</button>` : ''}`;

    this.paint(val);
  },

  _readyBlock(val) {
    const ready = ZONES.filter(z => (val[z.z]||0) <= 0.35);
    const soon = ZONES.filter(z => (val[z.z]||0) > 0.35 && (val[z.z]||0) <= 0.65);
    const rest = ZONES.filter(z => (val[z.z]||0) > 0.65);
    const pill = (list, col, lab) => !list.length ? '' :
      `<div class="rdy"><span class="rdydot" style="background:${col}"></span>
        <div><b>${lab}</b><p>${list.map(z=>esc(z.sh)).join(' · ')}</p></div></div>`;
    return `<div class="card" style="padding:12px 14px;margin-top:12px">
      ${pill(ready, '#2ECC71', 'Prêts à travailler')}
      ${pill(soon, '#F39C12', 'Entraînables mais entamés')}
      ${pill(rest, '#E8432D', 'À laisser récupérer')}</div>`;
  },

  _row(z, p) {
    p = p || 0;
    const col = heatColor(p);
    const extra = this.mode === 'now'
      ? (p > 0.02 ? 'récupéré dans ' + fmtHours(Fatigue.readyIn(z.z, this._cache)) : '')
      : '';
    return `<div class="zrow" onclick="Charge.zoneTap('${z.z}')">
      <div class="zbar"><div class="zfill" style="height:${Math.max(4,Math.min(100,p*100))}%;background:${col}"></div></div>
      <div class="zmain"><b>${esc(z.lab)}</b><span>${extra}</span></div>
      <div class="zpct" style="color:${col}">${Math.round(p*100)}%</div></div>`;
  },

  paint(val) {
    this._cache = val;
    document.querySelectorAll('#v-charge .mz').forEach(el => {
      const p = val[el.dataset.z] || 0;
      el.style.fill = p < 0.02 ? '' : heatColor(p);
    });
  },

  setMode(m) { this.mode = m; this.render(); },
  pickDay(i) { this.dayIdx = +i; this.render(); },

  zoneTap(z) {
    const zo = ZMAPZ[z]; if (!zo) return;
    const val = this._cache || this.values();
    const p = val[z] || 0;
    const meta = (Fatigue._meta || {})[z] || {};
    const exos = LIB.filter(e => (e.zp||[]).includes(z)).slice(0, 8);
    const mult = Fatigue.mult(z);
    Modal.open(zo.lab, `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        <div class="bigpct" style="color:${heatColor(p)};border-color:${heatColor(p)}">${Math.round(p*100)}<small>%</small></div>
        <div style="flex:1">
          ${this.mode === 'now' ? `
            <div style="font-size:13px;font-weight:700;margin-bottom:3px">${p>0.65?'À laisser récupérer':p>0.35?'Entraînable, déjà entamé':'Prêt à travailler'}</div>
            <p class="hint">Récupération complète dans <b style="color:var(--text)">${fmtHours(Fatigue.readyIn(z, val))}</b></p>
            ${p>0.5?`<p class="hint">Repasse sous 50 % dans <b style="color:var(--text)">${fmtHours(Fatigue.trainableIn(z, val))}</b></p>`:''}
            ${meta.last?`<p class="hint">Dernier travail : ${fmtDate(new Date(meta.last).toISOString())}</p>`:''}`
          : `<div style="font-size:13px;font-weight:700">Sollicitation ${this.mode==='day'?'de la séance':'du programme'}</div>`}
        </div>
      </div>
      <div class="tip">Récupération de référence à 100 % : ${Math.round(ZMAPZ[z].rec * mult)} h${mult!==1?` (réglage perso ×${mult})`:''}</div>
      <div class="divider"></div>
      <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Vitesse de récupération</label>
      <div class="row3" style="margin-top:8px">
        ${[['0.7','Rapide'],['1','Normale'],['1.3','Lente']].map(([v,l])=>
          `<button class="btn sm ${Math.abs(mult-(+v))<0.01?'primary':'ghost'}" onclick="Charge.setMult('${z}',${v})">${l}</button>`).join('')}
      </div>
      <div class="divider"></div>
      <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Exercices qui le ciblent</label>
      <div class="chips" style="margin-top:8px">${exos.map(e=>`<span class="chip">${esc(e.name)}</span>`).join('') || '<span class="hint">—</span>'}</div>`, '');
  },

  setMult(z, m) {
    S.recovery = S.recovery || {};
    if (m === 1) delete S.recovery[z]; else S.recovery[z] = m;
    save(); Modal.close(); this.render(); toast('Récupération ajustée ✓');
  },

  settings() {
    Modal.open('Vitesse de récupération', `
      <p class="hint" style="margin-bottom:12px">Ajuste muscle par muscle si tu récupères plus vite ou plus lentement que la moyenne. La durée indiquée est le temps pour repartir de 100 % à 0 %.</p>
      ${ZONES.map(z=>{const m=Fatigue.mult(z.z);return `
        <div class="setline">
          <div><b>${esc(z.lab)}</b><span>${Math.round(z.rec*m)} h</span></div>
          <div class="rsegs">${[['0.7','−'],['1','='],['1.3','+']].map(([v,l])=>
            `<button class="rseg ${Math.abs(m-(+v))<0.01?'on':''}" onclick="Charge.setMultQuiet('${z.z}',${v},this)">${l}</button>`).join('')}</div>
        </div>`;}).join('')}`,
      `<button class="btn wide primary" onclick="Modal.close();Charge.render()">Terminé</button>`);
  },
  setMultQuiet(z, m, el) {
    S.recovery = S.recovery || {};
    if (m === 1) delete S.recovery[z]; else S.recovery[z] = m;
    save();
    const wrap = el.parentElement;
    wrap.querySelectorAll('.rseg').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    wrap.parentElement.querySelector('span').textContent = Math.round(ZMAPZ[z].rec * m) + ' h';
  },
};
