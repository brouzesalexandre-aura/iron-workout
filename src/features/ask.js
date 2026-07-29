/* ============================================================
   PENDANT LE REPOS — difficulté de la série et suggestion
   ============================================================ */
const Ask = {
  ei: null, si: null,
  el() { return document.getElementById('diffask'); },

  open(ei, si) {
    this.ei = ei; this.si = si;
    this.paint();
    const e = this.el(); if (e) e.classList.add('show');
  },
  close() {
    this.ei = null;
    const e = this.el(); if (e) { e.classList.remove('show'); e.innerHTML = ''; }
  },
  /* Fermer sans répondre : on lance quand même le repos */
  skip() {
    const en = S.activeSession && S.activeSession.entries[this.ei];
    this.close();
    if (en) Timer.start(+en.rest || 90);
    Seance._renderActive(document.getElementById('v-seance'));
  },

  paint() {
    const s = S.activeSession, e = this.el();
    if (!s || this.ei == null || !e) return;
    const en = s.entries[this.ei]; if (!en) { this.close(); return; }
    e.innerHTML = `
      <div class="dq"><span>Série ${this.si + 1} · ${esc(en.name)}<br><small>C'était comment ?</small></span>
        <button class="dclose" onclick="Ask.skip()">✕</button></div>
      <div class="diffbtns">${DIFFS.map(d => `<button class="dbtn" onclick="Ask.answer('${d.k}')"><span>${d.ic}</span>${d.lab}</button>`).join('')}</div>
      <p class="dhint">La série suivante s'ajuste toute seule, et le repos démarre.</p>`;
  },

  /* Ressenti enregistré -> série suivante préparée -> chrono lancé */
  answer(d) {
    const s = S.activeSession; if (!s) return;
    const en = s.entries[this.ei], st = en.sets[this.si];
    st.d = d; save();
    this.prepareNext(en, this.si, d);
    this.close();
    Timer.start(+en.rest || 90);
    Seance._renderActive(document.getElementById('v-seance'));
  },

  /* Déduit la charge / les reps de la série suivante à partir du ressenti */
  prepareNext(en, si, d) {
    const next = en.sets[si + 1];
    if (!next || next.done) { save(); return; }
    const st = en.sets[si];
    next.weight = st.weight;
    next.reps = st.reps;
    next.hint = '';
    if (d === 'correct') { next.hint = 'Même charge — tu étais dans la bonne zone.'; save(); return; }
    if (d === 'dur')     { next.hint = 'Même charge — série difficile, on consolide.'; save(); return; }
    const dir = d === 'facile' ? 1 : -1;
    const w = parseFloat(st.weight);
    const nw = (isNaN(w) || w <= 0) ? null : nextLoad(en.k, w, dir);
    if (nw != null && Math.abs(nw - w) > 0.001) {
      next.weight = String(nw);
      next.hint = dir > 0
        ? `+${round(nw - w, 2)} kg — la précédente était facile.`
        : `−${round(w - nw, 2)} kg — tu es allé à l'échec.`;
    } else {
      const r = parseInt(st.reps);
      if (!isNaN(r)) {
        const nr = Math.max(1, r + dir * 2);
        next.reps = String(nr);
        next.hint = dir > 0 ? '+2 reps — la précédente était facile.' : '−2 reps — tu es allé à l\'échec.';
      }
    }
    save();
  },
};
