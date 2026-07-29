/* ============================================================
   SÉANCE — logging + minuteur de repos + historique
   ============================================================ */
function fmtTime(s) { s = Math.max(0, Math.round(s)); return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0'); }
const Timer = {
  t: null, left: 0,
  start(sec) {
    this.left = sec; this._show(); this._paint(); clearInterval(this.t);
    this.t = setInterval(() => { this.left--; if (this.left <= 0) { this.stop(); this._ding(); } else this._paint(); }, 1000);
  },
  _paint() { document.getElementById('timerTxt').textContent = fmtTime(this.left); },
  add(s) { if (!this.t) return; this.left = Math.max(1, this.left + s); this._paint(); },
  _show() { document.getElementById('timerbar').classList.add('show'); },
  stop() { clearInterval(this.t); document.getElementById('timerbar').classList.remove('show');
    const a = document.getElementById('diffask'); if (a) a.classList.remove('up'); },
  _ding() {
    try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) {}
    try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain();
      o.connect(g); g.connect(a.destination); o.frequency.value = 880; o.type = 'sine'; g.gain.setValueAtTime(.001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(.3, a.currentTime + .02); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .5);
      o.start(); o.stop(a.currentTime + .5); } catch (e) {}
    toast('⏱ Repos terminé — go !');
  }
};

const Seance = {
  render() {
    const v = document.getElementById('v-seance');
    if (S.activeSession) return this._renderActive(v);
    // écran de démarrage
    const hist = S.history.slice().reverse();
    v.innerHTML = `
      <div class="sec-hd"><div><h2>SÉANCE <span>DU JOUR</span></h2><p>Choisis la séance à démarrer</p></div></div>
      <div class="grid" style="grid-template-columns:1fr">
        ${S.program.map((d,i)=>`<div class="tile" onclick="Seance.start(${i})"><div class="tile-row">
          <div class="tile-thumb" style="font-family:'Bebas Neue';font-size:22px;color:var(--red);background:var(--bg3)">J${i+1}</div>
          <div class="tile-b"><h4>${esc(d.name)}</h4><p>${d.exos.length} exercices · ${d.exos.reduce((a,e)=>a+(+e.sets||0),0)} séries</p></div>
          <div class="btn sm green">▶</div></div></div>`).join('')}
      </div>
      <div class="sec-hd" style="margin-top:26px"><div><h2>HISTORIQUE</h2><p>${S.history.length} séance${S.history.length>1?'s':''} enregistrée${S.history.length>1?'s':''}</p></div></div>
      ${hist.length ? hist.map(h=>this._histTile(h)).join('') : '<div class="empty"><p>Pas encore de séance terminée.<br>Lance-toi 💪</p></div>'}`;
  },
  _histTile(h) {
    const vol = this._volume(h);
    return `<div class="tile" onclick="Seance.viewHist('${h.id}')"><div class="tile-row">
      <div class="tile-thumb" style="background:var(--bg3);font-size:18px">📅</div>
      <div class="tile-b"><h4>${esc(h.dayName)}</h4><p>${fmtDate(h.date)} · ${h.entries.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0)} séries · ${Math.round(vol)} kg volume</p></div>
      <button class="iconbtn" style="width:32px;height:32px;color:#FF7B6B" onclick="event.stopPropagation();Seance.delHist('${h.id}')">✕</button>
    </div></div>`;
  },
  _volume(h) { let v = 0; h.entries.forEach(e => e.sets.forEach(s => { if (s.done) v += (parseFloat(s.weight)||0) * (parseInt(s.reps)||0); })); return v; },
  start(i) {
    const begin = () => {
      const d = S.program[i];
      S.activeSession = { id: uid(), date: new Date().toISOString(), dayId: d.id, dayName: d.name,
        entries: d.exos.map(e => {
          const w = (e.load || '').match(/[\d.]+/); const wv = w ? w[0] : '';
          const rp = String(e.reps).match(/\d+/); const rv = rp ? rp[0] : '';
          const base = LIBMAP[e.k] || {};
          return { exoId: e.id, k: e.k || null, name: e.name, folder: e.folder, photos: e.photos, tip: e.tip,
            zp: [...(e.zp || base.zp || [])], zs: [...(e.zs || base.zs || [])],
            rest: +e.rest || base.drest || 90,
            sets: Array.from({ length: Math.max(1, +e.sets || 1) }, () => ({ weight: wv, reps: rv, done: false, d: null })) };
        }) };
      save(); if (App.tab !== 'seance') App.go('seance'); else this.render();
    };
    if (S.activeSession && S.activeSession.dayId !== S.program[i].id)
      Modal.confirm('Séance en cours', 'Une séance est déjà en cours. La remplacer ?', () => { Modal.close(); begin(); }, 'Remplacer');
    else begin();
  },
  /* Exercice courant : celui qu'on a choisi s'il reste des séries, sinon le premier inachevé */
  _focus() {
    const s = S.activeSession;
    if (s.focus != null && s.entries[s.focus] && s.entries[s.focus].sets.some(x => !x.done)) return s.focus;
    return s.entries.findIndex(e => e.sets.some(x => !x.done));
  },
  goTo(ei) {
    S.activeSession.focus = ei; save(); Ask.close();
    this._renderActive(document.getElementById('v-seance'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _renderActive(v) {
    const s = S.activeSession;
    const doneSets = s.entries.reduce((a, e) => a + e.sets.filter(x => x.done).length, 0);
    const totSets = s.entries.reduce((a, e) => a + e.sets.length, 0);
    const ei = this._focus();
    const head = `
      <div class="sec-hd"><div><h2>${esc(s.dayName)}</h2><p>${doneSets}/${totSets} séries · ${Math.round(this._volume(s))} kg soulevés</p></div>
        <button class="iconbtn on" onclick="Seance.cancel()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="mtrack" style="height:8px;margin-bottom:16px"><div class="mfill" style="width:${totSets?doneSets/totSets*100:0}%;background:var(--green)"></div></div>`;

    if (ei < 0) {
      v.innerHTML = head + `
        <div class="empty"><p>Toutes les séries sont validées.<br>Belle séance 💪</p></div>
        <button class="btn green block" onclick="Seance.finish()">✓ Terminer la séance</button>
        <button class="btn ghost block danger" style="margin-top:10px" onclick="Seance.cancel()">Abandonner</button>`;
      return;
    }

    const en = s.entries[ei];
    const si = en.sets.findIndex(x => !x.done);
    const st = en.sets[si];
    const stepW = loadStep(en.k) || 2.5;
    const rest = +en.rest || 90;

    v.innerHTML = head + `
      <div class="card curexo">
        <div class="exo-top" style="cursor:default">
          <div class="img-zone" style="width:64px;height:64px">${exoImg(en)}</div>
          <div class="exo-main">
            <div class="exo-name">${esc(en.name)}</div>
            <div class="machine">Exercice ${ei + 1}/${s.entries.length}${en.eq ? ' · ' + esc(en.eq) : ''}</div>
          </div>
        </div>

        <div class="setcount">Série <b>${si + 1}</b> <span>sur ${en.sets.length}</span></div>
        ${st.hint ? `<div class="sethint">${st.hint}</div>` : ''}

        <div class="bigrow">
          <div class="bigfield"><label>Charge (kg)</label>
            <div class="bigctrl">
              <button onclick="Seance.bump(${ei},${si},'weight',-${stepW})">−</button>
              <input id="fW" class="biginput" inputmode="decimal" placeholder="—" value="${esc(st.weight)}"
                     oninput="Seance.setField(${ei},${si},'weight',this.value)">
              <button onclick="Seance.bump(${ei},${si},'weight',${stepW})">+</button>
            </div></div>
          <div class="bigfield"><label>Répétitions</label>
            <div class="bigctrl">
              <button onclick="Seance.bump(${ei},${si},'reps',-1)">−</button>
              <input id="fR" class="biginput" inputmode="numeric" placeholder="—" value="${esc(st.reps)}"
                     oninput="Seance.setField(${ei},${si},'reps',this.value)">
              <button onclick="Seance.bump(${ei},${si},'reps',1)">+</button>
            </div></div>
        </div>

        <button class="btn green block bigbtn" onclick="Seance.validate(${ei},${si})">✓ Valider la série</button>

        <div class="setactions">
          <button class="btn sm ghost" onclick="Seance.editRest(${ei})">⏱ ${fmtTime(rest)}</button>
          <button class="btn sm ghost" onclick="Seance.muscles(${ei})">🧍 Muscles</button>
          ${en.tip ? `<button class="btn sm ghost" onclick="toast('💡 '+${JSON.stringify(en.tip).replace(/"/g, '&quot;')})">💡 Conseil</button>` : ''}
          <button class="btn sm ghost" onclick="Seance.addSet(${ei})">+ Série</button>
          ${en.sets.length > 1 ? `<button class="btn sm ghost" onclick="Seance.rmSet(${ei})">− Série</button>` : ''}
        </div>

        ${en.sets.some(x => x.done) ? `<div class="donelist">
          ${en.sets.map((x, i) => x.done ? `<div class="setdone" onclick="Seance.reopen(${ei},${i})">
            <span class="n">${i + 1}</span>
            <span class="w">${esc(x.weight || '—')} kg × ${esc(x.reps || '—')}</span>
            ${x.d && DIFFMAP[x.d] ? `<span class="dtag" style="background:${DIFFMAP[x.d].col}">${DIFFMAP[x.d].ic} ${DIFFMAP[x.d].lab}</span>` : '<span class="dtag none">ressenti ?</span>'}
            <span class="undo">↺</span></div>` : '').join('')}
        </div>` : ''}
      </div>

      <div class="sec-hd" style="margin-top:20px"><div><h2>SUITE</h2><p>Touche un exercice pour y aller</p></div></div>
      ${s.entries.map((e, i) => {
        if (i === ei) return '';
        const dn = e.sets.filter(x => x.done).length;
        const fini = dn === e.sets.length;
        return `<div class="tile${fini ? ' fini' : ''}" onclick="Seance.goTo(${i})"><div class="tile-row">
          <div class="tile-thumb" style="width:44px;height:44px">${exoImg(e)}</div>
          <div class="tile-b"><h4>${esc(e.name)}</h4><p>${dn}/${e.sets.length} séries${fini ? ' · terminé ✓' : ''}</p></div>
        </div></div>`;
      }).join('')}

      <button class="btn green block" style="margin-top:14px" onclick="Seance.finish()">✓ Terminer la séance</button>
      <button class="btn ghost block danger" style="margin-top:10px" onclick="Seance.cancel()">Abandonner</button>`;
  },

  setField(ei, si, f, val) { S.activeSession.entries[ei].sets[si][f] = val; save(); },

  bump(ei, si, f, d) {
    const st = S.activeSession.entries[ei].sets[si];
    const cur = parseFloat(st[f]);
    let val = (isNaN(cur) ? (f === 'weight' ? 0 : 10) : cur) + d;
    if (val < 0) val = 0;
    st[f] = String(round(val, 2)); save();
    const el = document.getElementById(f === 'weight' ? 'fW' : 'fR');
    if (el) el.value = st[f];
  },

  /* Valider une série : on demande le ressenti AVANT de lancer le chrono */
  validate(ei, si) {
    const en = S.activeSession.entries[ei], st = en.sets[si];
    st.done = true;
    /* report immédiat sur la série suivante ; le ressenti l'ajustera ensuite */
    const next = en.sets[si + 1];
    if (next && !next.done) { next.weight = st.weight; next.reps = st.reps; next.hint = ''; }
    save();
    Ask.open(ei, si);
    this._renderActive(document.getElementById('v-seance'));
  },

  /* Rouvrir une série déjà validée pour la corriger */
  reopen(ei, si) {
    const st = S.activeSession.entries[ei].sets[si];
    st.done = false; st.d = null;
    S.activeSession.focus = ei; save(); Ask.close(); Timer.stop();
    this._renderActive(document.getElementById('v-seance'));
  },

  /* Conservé pour compatibilité : bascule validé / non validé */
  toggleSet(ei, si) {
    const st = S.activeSession.entries[ei].sets[si];
    if (st.done) this.reopen(ei, si); else this.validate(ei, si);
  },

  muscles(ei) { Muscles.show(S.activeSession.entries[ei]); },

  editRest(ei) {
    const en = S.activeSession.entries[ei];
    const P = [30, 45, 60, 75, 90, 105, 120, 150, 180, 240];
    Modal.open('Temps de repos', `
      <p class="hint" style="margin-bottom:12px">${esc(en.name)} — déclenché après le recueil du ressenti. La valeur est aussi mémorisée dans ton programme.</p>
      <div class="restgrid" id="restGrid">${P.map(v => `<button class="restchip ${(+en.rest || 90) === v ? 'on' : ''}" data-v="${v}" onclick="Seance.setRest(${ei},${v})">${fmtTime(v)}</button>`).join('')}</div>
      <div class="divider"></div>
      <div class="restbump">
        <button class="btn sm ghost" onclick="Seance.bumpRest(${ei},-15)">− 15 s</button>
        <span id="restNow">${fmtTime(+en.rest || 90)}</span>
        <button class="btn sm ghost" onclick="Seance.bumpRest(${ei},15)">+ 15 s</button>
      </div>`,
      `<button class="btn wide primary" onclick="Modal.close();Seance._renderActive(document.getElementById('v-seance'))">Terminé</button>`);
  },
  _applyRest(ei, v) {
    const en = S.activeSession.entries[ei];
    en.rest = Math.max(0, Math.min(900, Math.round(v)));
    const day = S.program.find(d => d.id === S.activeSession.dayId);
    const exo = day && day.exos.find(x => x.id === en.exoId);
    if (exo) exo.rest = en.rest;
    save();
    return en.rest;
  },
  setRest(ei, v) {
    const r = this._applyRest(ei, v);
    Modal.close();
    this._renderActive(document.getElementById('v-seance'));
    toast('Repos réglé sur ' + fmtTime(r));
  },
  bumpRest(ei, d) {
    const r = this._applyRest(ei, (+S.activeSession.entries[ei].rest || 90) + d);
    const el = document.getElementById('restNow'); if (el) el.textContent = fmtTime(r);
    document.querySelectorAll('#restGrid .restchip').forEach(b => b.classList.toggle('on', +b.dataset.v === r));
  },
  toggleSet(ei, si) {
    const st = S.activeSession.entries[ei].sets[si]; st.done = !st.done; save();
    const exo = S.program[S.program.findIndex(d=>d.id===S.activeSession.dayId)]?.exos.find(x=>x.id===S.activeSession.entries[ei].exoId);
    if (st.done && exo) Timer.start(+exo.rest || 90);
    this._renderActive(document.getElementById('v-seance'));
  },
  addSet(ei) { const e = S.activeSession.entries[ei]; const last = e.sets[e.sets.length-1] || {}; e.sets.push({ weight: last.weight||'', reps: last.reps||'', done: false }); save(); this._renderActive(document.getElementById('v-seance')); },
  rmSet(ei) { const e = S.activeSession.entries[ei]; if (e.sets.length>1) e.sets.pop(); save(); this._renderActive(document.getElementById('v-seance')); },
  cancel() { Modal.confirm('Abandonner la séance ?', 'Les données saisies seront perdues.', () => { S.activeSession = null; save(); Timer.stop(); Ask.close(); Modal.close(); this.render(); }, 'Abandonner'); },
  finish() {
    const s = S.activeSession;
    // reporte la dernière charge dans le programme (pré-remplissage futur)
    const day = S.program.find(d => d.id === s.dayId);
    if (day) s.entries.forEach(en => { const done = en.sets.filter(x=>x.done && x.weight); if (done.length) { const w = done[done.length-1].weight; const exo = day.exos.find(x=>x.id===en.exoId); if (exo && w) exo.load = w + ' kg'; } });
    s.done = true; s.endDate = new Date().toISOString();
    S.history.push(s); S.activeSession = null; save(); Timer.stop(); Ask.close();
    App.go('seance'); toast('Séance enregistrée 💪 ' + Math.round(this._volume(s)) + ' kg soulevés');
  },
  viewHist(id) {
    const h = S.history.find(x => x.id === id); if (!h) return;
    Modal.open(h.dayName, `<p class="hint" style="margin-bottom:12px">${fmtDate(h.date)} · Volume total ${Math.round(this._volume(h))} kg</p>
      ${h.entries.map((e,ei)=>`<div style="margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <div style="font-weight:700;font-size:14px;flex:1">${esc(e.name)}</div>
          <button class="btn sm ghost" onclick="Seance.histMuscles('${h.id}',${ei})">🧍 Muscles</button></div>
        ${e.sets.map((st,i)=>`<div style="font-size:12px;color:${st.done?'var(--text)':'var(--muted)'};padding:2px 0">Série ${i+1} : ${st.weight||'—'} kg × ${st.reps||'—'} ${st.done?'✓':''}${st.d&&DIFFMAP[st.d]?` · ${DIFFMAP[st.d].ic} ${DIFFMAP[st.d].lab}`:''}</div>`).join('')}</div>`).join('')}`, '');
  },
  histMuscles(hid, ei) {
    const h = S.history.find(x => x.id === hid);
    if (h && h.entries[ei]) Muscles.show(h.entries[ei]);
  },
  delHist(id) { Modal.confirm('Supprimer cette séance ?', '', () => { S.history = S.history.filter(x=>x.id!==id); save(); Modal.close(); this.render(); }, 'Supprimer'); }
};
function fmtDate(iso) { const d = new Date(iso); return d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' }); }
