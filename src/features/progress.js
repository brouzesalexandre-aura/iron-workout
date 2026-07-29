/* ============================================================
   PROGRESSION — évolution des charges et records personnels
   ============================================================
   Tout est recalculé depuis l'historique des séances : rien n'est
   stocké en double. Une série ne compte que si elle a été validée
   et qu'elle porte au moins une répétition.

   Deux familles d'exercices se mesurent différemment :
   au poids du corps la progression se lit en répétitions, partout
   ailleurs en kilos. Le mode est déduit des séries elles-mêmes,
   pas déclaré : un exercice fait en lesté bascule tout seul.
   ============================================================ */

/* 1RM estimé, formule d'Epley. Sert à comparer un 5×5 lourd et un
   3×12 léger sur la même échelle — en kilos, donc lisible. */
function e1RM(w, r) {
  w = +w || 0; r = +r || 0;
  if (!w || !r) return 0;
  return w * (1 + r / 30);
}

const Progress = {
  sort: 'recent',   // recent | progress | alpha
  q: '',

  /* ---------- agrégation ---------- */

  /** Historique regroupé par exercice, séance par séance, trié par date. */
  index() {
    const map = new Map();
    (S.history || []).filter(h => h.done).forEach(h => {
      (h.entries || []).forEach(en => {
        const sets = (en.sets || []).filter(s => s.done && (+s.reps || 0) > 0);
        if (!sets.length) return;
        const key = en.k || 'n:' + String(en.name || '').toLowerCase().trim();
        if (key === 'n:') return;
        let e = map.get(key);
        if (!e) map.set(key, e = {
          key, k: en.k || null,
          name: en.name || (LIBMAP[en.k] || {}).name || 'Exercice',
          sessions: [],
        });
        const best = sets.reduce((b, s) =>
          (e1RM(s.weight, s.reps) > e1RM(b.weight, b.reps)) ? s : b);
        e.sessions.push({
          date: h.date,
          sessionId: h.id,
          dayName: h.dayName || '',
          nsets: sets.length,
          reps: sets.reduce((a, s) => a + (+s.reps || 0), 0),
          topW: Math.max(...sets.map(s => +s.weight || 0)),
          topR: Math.max(...sets.map(s => +s.reps || 0)),
          volume: sets.reduce((a, s) => a + (+s.weight || 0) * (+s.reps || 0), 0),
          best: { w: +best.weight || 0, r: +best.reps || 0, e: e1RM(best.weight, best.reps) },
        });
      });
    });

    const out = [...map.values()];
    out.forEach(e => {
      e.sessions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      /* aucune charge jamais saisie : la progression se lit en répétitions */
      e.mode = e.sessions.every(s => s.topW === 0) ? 'reps' : 'load';
      e.metric = s => (e.mode === 'reps' ? s.topR : s.best.e);

      /* Marque les séances qui ont battu un record. La première ne compte
         pas : être la meilleure quand elle est la seule ne veut rien dire. */
      let high = 0;
      e.sessions.forEach((s, i) => {
        const m = e.metric(s);
        s.pr = i > 0 && m > high + 1e-9;
        if (m > high) high = m;
      });
      const byVol = e.sessions.reduce((a, s) => (s.volume > a.volume ? s : a));
      const byBest = e.sessions.reduce((a, s) => (e.metric(s) > e.metric(a) ? s : a));
      e.rec = {
        maxW: Math.max(...e.sessions.map(s => s.topW)),
        maxR: Math.max(...e.sessions.map(s => s.topR)),
        best: byBest.best,
        bestDate: byBest.date,
        maxVol: byVol.volume,
        maxVolDate: byVol.date,
      };
      e.last = e.sessions[e.sessions.length - 1];
      e.first = e.sessions[0];
      e.cur = e.metric(e.last);
      e.gain = e.cur - e.metric(e.first);
      e.gainPct = e.metric(e.first) ? e.gain / e.metric(e.first) * 100 : 0;
      e.lastDate = e.last.date;
    });
    return out;
  },

  /** Tous les records établis depuis `days` jours, le plus récent d'abord. */
  recentPRs(list, days = 30) {
    const since = Date.now() - days * 86400000;
    const out = [];
    list.forEach(e => e.sessions.forEach(s => {
      if (s.pr && new Date(s.date).getTime() >= since) out.push({ e, s });
    }));
    return out.sort((a, b) => (a.s.date < b.s.date ? 1 : -1));
  },

  /** Un seul record par exercice — le plus récent. Sinon la liste se répète. */
  latestPRs(list, days = 30) {
    const seen = new Set();
    return this.recentPRs(list, days).filter(x => !seen.has(x.e.key) && seen.add(x.e.key));
  },

  /* ---------- rendu ---------- */

  render() {
    const v = document.getElementById('v-progression');
    const list = this.index();

    if (!list.length) {
      v.innerHTML = `
        <div class="sec-hd"><div><h2>MA <span>PROGRESSION</span></h2><p>Rien à afficher pour l'instant</p></div></div>
        <div class="empty"><p>Termine une séance et tes charges apparaîtront ici :<br>
          courbe par exercice, 1RM estimé et records personnels.</p>
          <button class="btn primary" style="margin-top:14px" onclick="App.go('seance')">Aller à la séance</button></div>`;
      return;
    }

    const sessions = (S.history || []).filter(h => h.done).length;
    const tonnage = list.reduce((a, e) => a + e.sessions.reduce((b, s) => b + s.volume, 0), 0);
    const prs = this.recentPRs(list);
    const top = this.latestPRs(list);

    v.innerHTML = `
      <div class="sec-hd"><div><h2>MA <span>PROGRESSION</span></h2>
        <p>${list.length} exercice${list.length > 1 ? 's' : ''} suivi${list.length > 1 ? 's' : ''}</p></div></div>

      <div class="stat-grid">
        <div class="stat-card"><div class="sv">${sessions}</div><div class="sl">Séances</div></div>
        <div class="stat-card gold"><div class="sv">${fmtTonnage(tonnage)}</div><div class="sl">Tonnage total</div></div>
        <div class="stat-card blue"><div class="sv">${list.length}</div><div class="sl">Exercices</div></div>
        <div class="stat-card green"><div class="sv">${prs.length}</div><div class="sl">Records 30 j</div></div>
      </div>

      ${top.length ? `
        <div class="sec-hd" style="margin-top:20px"><div><h2>RECORDS <span>RÉCENTS</span></h2>
          <p>Le dernier de chaque exercice, sur 30 jours</p></div></div>
        <div class="prlist">
          ${top.slice(0, 6).map(({ e, s }) => `
            <div class="prow" onclick="Progress.open('${esc(e.key)}')">
              <span class="pmedal">🏆</span>
              <div class="pb"><h4>${esc(e.name)}</h4>
                <p>${e.mode === 'reps' ? s.topR + ' répétitions' : `${round(s.best.w, 1)} kg × ${s.best.r}`} · ${fmtShort(s.date)}</p></div>
              ${e.mode === 'reps' ? '' : `<div class="pv">${round(s.best.e)}<small>kg 1RM</small></div>`}
            </div>`).join('')}
        </div>` : ''}

      <div class="sec-hd" style="margin-top:22px"><div><h2>PAR <span>EXERCICE</span></h2>
        <p>Touche une ligne pour la courbe complète</p></div></div>

      <div class="seg" style="margin-bottom:10px" id="pgSort">
        <button class="${this.sort === 'recent' ? 'on' : ''}" onclick="Progress.setSort('recent')">Récents</button>
        <button class="${this.sort === 'progress' ? 'on' : ''}" onclick="Progress.setSort('progress')">Progression</button>
        <button class="${this.sort === 'alpha' ? 'on' : ''}" onclick="Progress.setSort('alpha')">A → Z</button>
      </div>
      <div class="field"><input class="input" id="pgSearch" placeholder="Rechercher un exercice…"
        value="${esc(this.q)}" oninput="Progress.search(this.value)"></div>
      <div id="pgList">${this._rows(list)}</div>`;
  },

  setSort(s) { this.sort = s; this.render(); },
  search(q) { this.q = q; document.getElementById('pgList').innerHTML = this._rows(this.index()); },

  _rows(list) {
    const q = this.q.toLowerCase().trim();
    let l = q ? list.filter(e => e.name.toLowerCase().includes(q)) : list.slice();
    if (this.sort === 'alpha') l.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    else if (this.sort === 'progress') l.sort((a, b) => b.gainPct - a.gainPct);
    else l.sort((a, b) => (a.lastDate < b.lastDate ? 1 : -1));
    if (!l.length) return '<p class="hint" style="text-align:center;padding:18px 0">Aucun exercice ne correspond.</p>';

    return l.map(e => {
      const unit = e.mode === 'reps' ? 'reps' : 'kg';
      const g = round(e.gain, e.mode === 'reps' ? 0 : 1);
      const cls = g > 0 ? 'up' : g < 0 ? 'down' : '';
      return `<div class="pgrow" onclick="Progress.open('${esc(e.key)}')">
        <div class="pgspark">${sparkline(e.sessions.map(s => e.metric(s)), g >= 0 ? 'var(--green)' : 'var(--gold)')}</div>
        <div class="pgb"><h4>${esc(e.name)}</h4>
          <p>${e.sessions.length} séance${e.sessions.length > 1 ? 's' : ''} · dernière le ${fmtShort(e.lastDate)}</p></div>
        <div class="pgv"><b>${round(e.cur, e.mode === 'reps' ? 0 : 1)}<small> ${unit}</small></b>
          <span class="pgd ${cls}">${g > 0 ? '+' : ''}${g}</span></div>
      </div>`;
    }).join('');
  },

  /* ---------- fiche d'un exercice ---------- */

  open(key) {
    const e = this.index().find(x => x.key === key);
    if (!e) return;
    const unit = e.mode === 'reps' ? 'reps' : 'kg';
    const dec = e.mode === 'reps' ? 0 : 1;
    const r = e.rec;

    const series = e.mode === 'reps'
      ? [{ label: 'Répétitions', color: 'var(--green)', pts: e.sessions.map(s => s.topR) }]
      : [{ label: '1RM estimé', color: 'var(--red)', pts: e.sessions.map(s => s.best.e) },
         { label: 'Charge max', color: 'var(--blue)', dash: true, pts: e.sessions.map(s => s.topW) }];

    Modal.open(e.name, `
      <div class="stat-grid" style="grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="stat-card"><div class="sv">${round(e.cur, dec)}<small> ${unit}</small></div>
          <div class="sl">${e.mode === 'reps' ? 'Meilleure série' : '1RM estimé'} actuel</div></div>
        <div class="stat-card ${e.gain >= 0 ? 'green' : 'gold'}"><div class="sv">${e.gain > 0 ? '+' : ''}${round(e.gain, dec)}<small> ${unit}</small></div>
          <div class="sl">Depuis le ${fmtShort(e.first.date)}</div></div>
      </div>

      ${lineChart(series, e.sessions.map(s => s.date))}
      <div class="chartleg">${series.map(s =>
        `<span><i style="background:${s.color};${s.dash ? 'height:2px;opacity:.7' : ''}"></i>${s.label}</span>`).join('')}</div>

      <div class="divider"></div>
      <h5 class="mini-hd">Records personnels</h5>
      <div class="reclist">
        ${e.mode === 'reps' ? `
          <div class="recrow"><span>Meilleure série</span><b>${r.maxR} répétitions</b></div>
          <div class="recrow"><span>Le ${fmtShort(r.bestDate)}</span><b>${r.maxR} reps</b></div>`
        : `
          <div class="recrow"><span>Charge maximale</span><b>${round(r.maxW, 1)} kg</b></div>
          <div class="recrow"><span>Meilleure série</span><b>${round(r.best.w, 1)} kg × ${r.best.r}</b></div>
          <div class="recrow"><span>1RM estimé</span><b>${round(r.best.e)} kg <small style="color:var(--muted)">le ${fmtShort(r.bestDate)}</small></b></div>`}
        <div class="recrow"><span>Meilleur volume</span><b>${fmtTonnage(r.maxVol)} <small style="color:var(--muted)">le ${fmtShort(r.maxVolDate)}</small></b></div>
      </div>

      <div class="divider"></div>
      <h5 class="mini-hd">Séance par séance</h5>
      <div class="sesslist">
        ${e.sessions.slice().reverse().slice(0, 15).map(s => `
          <div class="recrow"><span>${fmtShort(s.date)}${s.pr ? ' <span class="prtag">record</span>' : ''}</span>
            <b>${e.mode === 'reps' ? s.topR + ' reps' : `${round(s.best.w, 1)} kg × ${s.best.r}`}
              <small style="color:var(--muted)">· ${s.nsets} série${s.nsets > 1 ? 's' : ''}</small></b></div>`).join('')}
      </div>
      ${e.sessions.length > 15 ? `<p class="hint" style="margin-top:8px">Les 15 dernières séances sur ${e.sessions.length}.</p>` : ''}

      <p class="hint" style="margin-top:12px">Le 1RM estimé (formule d'Epley) ramène toutes les séries à une même
        échelle : il monte aussi bien en ajoutant du poids qu'en ajoutant des répétitions.</p>`,
      `<button class="btn wide ghost" onclick="Modal.close()">Fermer</button>
       ${e.k ? `<button class="btn wide primary" onclick="Modal.close();Muscles.show(${JSON.stringify({ k: e.k, name: e.name }).replace(/"/g, '&quot;')})">Muscles travaillés</button>` : ''}`);
  },
};

/* ---------- graphiques ---------- */

function fmtTonnage(kg) {
  if (kg >= 1000) return round(kg / 1000, 1) + ' t';
  return Math.round(kg) + ' kg';
}
function fmtShort(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Courbe miniature, sans axes : donne la forme, pas les valeurs. */
function sparkline(vals, color) {
  if (!vals || vals.length < 2) return `<svg viewBox="0 0 60 26"><line x1="4" y1="13" x2="56" y2="13" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/></svg>`;
  const W = 60, H = 26, pad = 3;
  const min = Math.min(...vals), max = Math.max(...vals), rng = (max - min) || 1;
  const pts = vals.map((v, i) => [
    pad + (i / (vals.length - 1)) * (W - 2 * pad),
    pad + (1 - (v - min) / rng) * (H - 2 * pad),
  ]);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <path d="${pts.map((p, i) => (i ? 'L' : 'M') + round(p[0], 1) + ' ' + round(p[1], 1)).join(' ')}"
      fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${round(pts[pts.length - 1][0], 1)}" cy="${round(pts[pts.length - 1][1], 1)}" r="2.6" fill="${color}"/></svg>`;
}

/**
 * Courbe multi-séries partageant une même échelle verticale.
 * `series` : [{ label, color, dash, pts:[nombres] }] — toutes de même longueur que `dates`.
 */
function lineChart(series, dates) {
  const all = series.flatMap(s => s.pts).filter(v => isFinite(v));
  if (all.length < 2 || series[0].pts.length < 2) {
    return '<p class="hint" style="text-align:center;padding:24px 0">Il faut au moins deux séances pour tracer une courbe.</p>';
  }
  const W = 320, H = 150, padL = 34, padR = 8, padT = 10, padB = 20;
  const min = Math.min(...all), max = Math.max(...all);
  const lo = min - (max - min || 1) * 0.12, hi = max + (max - min || 1) * 0.12;
  const n = series[0].pts.length;
  const x = i => padL + (n === 1 ? 0.5 : i / (n - 1)) * (W - padL - padR);
  const y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const gy = [hi, (hi + lo) / 2, lo];

  const uid_ = 'pg' + (lineChart._n = (lineChart._n || 0) + 1);
  return `<svg class="pgchart" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="${uid_}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${series[0].color}" stop-opacity=".28"/>
      <stop offset="1" stop-color="${series[0].color}" stop-opacity="0"/></linearGradient></defs>
    ${gy.map(v => `<line x1="${padL}" y1="${round(y(v), 1)}" x2="${W - padR}" y2="${round(y(v), 1)}"
        stroke="var(--border)" stroke-width="1"/>
      <text x="${padL - 5}" y="${round(y(v), 1) + 3.5}" text-anchor="end" class="ax">${round(v, v < 20 ? 1 : 0)}</text>`).join('')}
    <path d="${series[0].pts.map((v, i) => (i ? 'L' : 'M') + round(x(i), 1) + ' ' + round(y(v), 1)).join(' ')}
      L ${round(x(n - 1), 1)} ${H - padB} L ${round(x(0), 1)} ${H - padB} Z" fill="url(#${uid_})"/>
    ${series.map(s => `<path d="${s.pts.map((v, i) => (i ? 'L' : 'M') + round(x(i), 1) + ' ' + round(y(v), 1)).join(' ')}"
        fill="none" stroke="${s.color}" stroke-width="${s.dash ? 1.8 : 2.4}"
        ${s.dash ? 'stroke-dasharray="4 3" opacity=".75"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`).join('')}
    ${series[0].pts.map((v, i) => `<circle cx="${round(x(i), 1)}" cy="${round(y(v), 1)}" r="2.8" fill="${series[0].color}"/>`).join('')}
    <text x="${padL}" y="${H - 5}" class="ax">${fmtShort(dates[0])}</text>
    <text x="${W - padR}" y="${H - 5}" text-anchor="end" class="ax">${fmtShort(dates[n - 1])}</text>
  </svg>`;
}
