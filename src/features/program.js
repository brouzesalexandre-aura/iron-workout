/* ============================================================
   PROGRAMME — jours configurables + exercices éditables
   ============================================================ */
function makeExoFromSource(src) {
  return { id: uid(), k: src.k || null, name: src.name, eq: src.eq || '', cat: src.cat || '', folder: src.folder || '',
    mp: [...(src.mp || [])], ms: [...(src.ms || [])], tip: src.tip || '',
    eqt: src.eqt || 'other', zp: [...(src.zp || [])], zs: [...(src.zs || [])],
    sets: src.ds ?? src.sets ?? 3, reps: src.dr ?? src.reps ?? '12', rest: src.drest ?? src.rest ?? 75, load: '', photos: [...(src.photos || [])], note: '' };
}
function chipsHTML(e) {
  return (e.mp || []).map(m => `<span class="chip cm">${esc(m)}</span>`).join('') + (e.ms || []).map(m => `<span class="chip cs">${esc(m)}</span>`).join('');
}
const PRCLS = { 1:'p1', 2:'p2', 3:'p3' }, PRTXT = { 1:'🔴 PRIORITÉ 1', 2:'🟡 PRIORITÉ 2', 3:'🔵 SECONDAIRE' };

const Prog = {
  render() {
    const days = S.program;
    if (CUR >= days.length) CUR = Math.max(0, days.length - 1);
    document.getElementById('barSub').textContent = `${days.length} jour${days.length>1?'s':''} · ${GOAL_LABEL[({seche:'seche',maintien:'maintien',masse:'masse'}[S.profile.goal])]||'Hypertrophie'}`;
    const v = document.getElementById('v-programme');
    if (!days.length) { v.innerHTML = this._empty(); return; }
    const d = days[CUR];
    v.innerHTML = `
      <div class="sec-hd">
        <div><h2>TA <span>SEMAINE</span></h2><p>${days.length} séances · touche une carte pour les détails</p></div>
        <button class="iconbtn" onclick="Prog.manageDays()" title="Gérer les jours"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5h9M12 12h9M12 19h9M3 5h.01M3 12h.01M3 19h.01"/></svg></button>
      </div>
      <div class="pills">
        ${days.map((dd, i) => `<button class="pill${i===CUR?' active':''}" onclick="Prog.sel(${i})"><b>J${i+1}</b><small>${esc(this._short(dd.name))}</small></button>`).join('')}
        <button class="pill add" onclick="Prog.addDayMenu()">+</button>
      </div>
      <div class="day-hdr">
        <div class="day-num">${String(CUR+1).padStart(2,'0')}</div>
        <div class="day-info">
          <h3>${esc(d.name)}</h3>
          <p>${esc(d.sub||'')}</p>
          <span class="badge ${PRCLS[d.pr]||'p3'}">${PRTXT[d.pr]||'SÉANCE'}</span>
        </div>
        <button class="iconbtn" onclick="Prog.editDay(${CUR})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg></button>
      </div>
      <div class="grid">${d.exos.map(e => this._card(e)).join('')}</div>
      <button class="btn ghost block" style="margin-top:14px;border-style:dashed" onclick="Prog.addExoToDay(${CUR})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg> Ajouter un exercice</button>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn wide green" onclick="Seance.start(${CUR})">▶ Démarrer cette séance</button>
      </div>`;
  },
  _short(name) { const w = name.split(/[ +]/)[0]; return w.length > 9 ? w.slice(0, 8) + '…' : w; },
  _empty() {
    return `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6"/></svg>
      <p>Aucune séance.<br>Ajoute ton premier jour d'entraînement.</p><button class="btn primary" style="margin-top:14px" onclick="Prog.addDayMenu()">+ Ajouter un jour</button></div>`;
  },
  _card(e) {
    const load = e.load ? esc(e.load) : '—';
    return `<div class="card" id="card-${e.id}">
      <div class="exo-top" onclick="Prog.toggle('${e.id}')">
        <div class="img-zone">${exoImg(e)}${e.photos&&e.photos.length?'<div class="img-badge">📷</div>':''}</div>
        <div class="exo-main">
          <div class="exo-name">${esc(e.name)}</div>
          <div class="machine">${esc(e.eq)}</div>
          <div class="chips">${chipsHTML(e)}</div>
        </div>
      </div>
      <div class="exo-stats">
        <div class="est tap" onclick="Prog.editExo(${CUR},'${e.id}')"><div class="v">${esc(e.sets)}</div><div class="l">Séries</div></div>
        <div class="est tap" onclick="Prog.editExo(${CUR},'${e.id}')"><div class="v">${esc(e.reps)}</div><div class="l">Reps</div></div>
        <div class="est tap" onclick="Prog.editExo(${CUR},'${e.id}')"><div class="v" style="color:${e.load?'var(--green)':'var(--muted)'}">${load}</div><div class="l">Charge</div></div>
        <div class="est tap" onclick="Prog.editExo(${CUR},'${e.id}')"><div class="v">${esc(e.rest)}s</div><div class="l">Repos</div></div>
      </div>
      <div class="detail">
        <h5>Muscles travaillés</h5>
        <ul class="ml">${(e.mp||[]).map(m=>`<li class="p">${esc(m)}</li>`).join('')}${(e.ms||[]).map(m=>`<li class="s">${esc(m)}</li>`).join('')}</ul>
        <div class="mmap" id="mm-${e.id}"></div>
        ${e.note?`<div class="tip" style="color:var(--blue);border-color:var(--blue);background:rgba(78,155,255,.08)">📝 ${esc(e.note)}</div>`:''}
        ${e.tip?`<div class="tip">💡 ${esc(e.tip)}</div>`:''}
        <div class="detail-actions">
          <button class="btn sm" onclick="Prog.editExo(${CUR},'${e.id}')">✎ Modifier</button>
          <button class="btn sm" onclick="Prog.exoPhotos('${e.id}')">📷 Photos</button>
          <button class="btn sm danger" onclick="Prog.removeExo(${CUR},'${e.id}')">✕ Retirer</button>
        </div>
      </div></div>`;
  },
  sel(i) { CUR = i; this.render(); },
  toggle(id) {
    const c = document.getElementById('card-' + id);
    c.classList.toggle('open');
    if (c.classList.contains('open')) {
      const e = (S.program[CUR].exos || []).find(x => x.id === id);
      if (e) Muscles.fill('mm-' + id, e);
    }
  },

  /* ---- gestion des jours ---- */
  addDayMenu() {
    Modal.open('Ajouter un jour', `
      <button class="btn primary block" onclick="Prog.newBlankDay()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg> Jour vierge</button>
      <div class="divider"></div>
      <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Depuis un template</label>
      <div style="margin-top:10px">${DAY_TEMPLATES.map((t,i)=>`
        <div class="tile" onclick="Prog.addTemplate(${i})"><div class="tile-row">
          <div class="tile-thumb" style="font-size:20px">${['💪','🎯','🦵','⬆️','⬇️','🔥','💪','🎽'][i]||'🏋️'}</div>
          <div class="tile-b"><h4>${esc(t.name)}</h4><p>${t.keys.length} exercices</p></div>
          <svg viewBox="0 0 24 24" width="18" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>
        </div></div>`).join('')}</div>`, '');
  },
  newBlankDay() {
    S.program.push({ id: uid(), name: 'NOUVEAU JOUR', sub: '', pr: 2, exos: [] });
    CUR = S.program.length - 1; save(); Modal.close(); this.render(); this.editDay(CUR);
  },
  addTemplate(i) {
    S.program.push(templateToDay(DAY_TEMPLATES[i]));
    CUR = S.program.length - 1; save(); Modal.close(); this.render(); toast('Jour ajouté ✓');
  },
  editDay(i) {
    const d = S.program[i];
    Modal.open('Modifier le jour', `
      <div class="field"><label>Nom de la séance</label><input class="input" id="dName" value="${esc(d.name)}" placeholder="Ex : PECTORAUX + DORSAUX"></div>
      <div class="field"><label>Sous-titre</label><input class="input" id="dSub" value="${esc(d.sub||'')}" placeholder="Ex : Push/Pull haut du corps"></div>
      <div class="field"><label>Priorité</label>
        <div class="seg" id="dPr">
          <button class="${d.pr===1?'on':''}" onclick="setSeg('dPr',this);this.dataset.v=1" data-v="1">🔴 Priorité 1</button>
          <button class="${d.pr===2?'on':''}" data-v="2" onclick="setSeg('dPr',this)">🟡 Priorité 2</button>
          <button class="${d.pr===3?'on':''}" data-v="3" onclick="setSeg('dPr',this)">🔵 Secondaire</button>
        </div></div>`,
      `<button class="btn ghost danger" onclick="Prog.deleteDay(${i})">Supprimer</button>
       <button class="btn wide primary" onclick="Prog.saveDay(${i})">Enregistrer</button>`);
  },
  saveDay(i) {
    const d = S.program[i];
    d.name = document.getElementById('dName').value.trim() || 'SÉANCE';
    d.sub = document.getElementById('dSub').value.trim();
    const on = document.querySelector('#dPr button.on'); d.pr = on ? +on.dataset.v : 2;
    save(); Modal.close(); this.render();
  },
  deleteDay(i) {
    Modal.confirm('Supprimer ce jour ?', `« ${S.program[i].name} » et ses ${S.program[i].exos.length} exercices seront retirés.`, () => {
      S.program.splice(i, 1); CUR = Math.max(0, CUR - (i <= CUR ? 1 : 0)); save(); Modal.close(); this.render();
    }, 'Supprimer');
  },
  manageDays() {
    const rows = S.program.map((d, i) => `
      <div class="reorder-item">
        <span style="font-family:'Bebas Neue';font-size:18px;color:var(--red);min-width:26px">J${i+1}</span>
        <div class="rn">${esc(d.name)}<div style="font-size:10px;color:var(--muted);font-weight:400">${d.exos.length} exos</div></div>
        <button class="iconbtn" style="width:32px;height:32px" onclick="Prog.moveDay(${i},-1)"${i===0?' disabled style="opacity:.3;width:32px;height:32px"':''}>▲</button>
        <button class="iconbtn" style="width:32px;height:32px" onclick="Prog.moveDay(${i},1)"${i===S.program.length-1?' disabled style="opacity:.3;width:32px;height:32px"':''}>▼</button>
        <button class="iconbtn" style="width:32px;height:32px;color:#FF7B6B" onclick="Prog.deleteDay(${i})">✕</button>
      </div>`).join('');
    Modal.open('Gérer ma semaine', `<p class="hint" style="margin-bottom:12px">Réordonne, renomme ou supprime tes jours. Le nombre de jours = ${S.program.length}/semaine.</p>${rows}
      <button class="btn primary block" style="margin-top:8px" onclick="Modal.close();Prog.addDayMenu()">+ Ajouter un jour</button>`, '');
  },
  moveDay(i, dir) {
    const j = i + dir; if (j < 0 || j >= S.program.length) return;
    const [x] = S.program.splice(i, 1); S.program.splice(j, 0, x);
    if (CUR === i) CUR = j; else if (CUR === j) CUR = i;
    save(); this.manageDays(); this.render();
  },

  /* ---- exercices ---- */
  addExoToDay(i) { Exos.pick(src => { S.program[i].exos.push(makeExoFromSource(src)); save(); Modal.close(); CUR = i; this.render(); toast('Exercice ajouté ✓'); }); },
  removeExo(day, id) {
    const d = S.program[day]; const idx = d.exos.findIndex(e => e.id === id);
    if (idx < 0) return;
    Modal.confirm('Retirer l\'exercice ?', d.exos[idx].name, () => { d.exos.splice(idx, 1); save(); Modal.close(); this.render(); }, 'Retirer');
  },
  editExo(day, id) {
    const e = S.program[day].exos.find(x => x.id === id); if (!e) return;
    Modal.open('Modifier l\'exercice', `
      <div class="field"><label>Nom</label><input class="input" id="eName" value="${esc(e.name)}"></div>
      <div class="field"><label>Matériel / machine</label><input class="input" id="eEq" value="${esc(e.eq)}"></div>
      <div class="row2">
        <div class="field"><label>Séries</label>${stepperHTML('eSets', e.sets, 1, 0, 20)}</div>
        <div class="field"><label>Reps</label><input class="input" id="eReps" value="${esc(e.reps)}" placeholder="10–12"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Charge</label><input class="input" id="eLoad" value="${esc(e.load)}" placeholder="Ex : 20 kg"></div>
        <div class="field"><label>Repos (sec)</label>${stepperHTML('eRest', e.rest, 15, 0, 600)}</div>
      </div>
      <div class="field"><label>Muscles principaux (séparés par virgule)</label><input class="input" id="eMp" value="${esc((e.mp||[]).join(', '))}"></div>
      <div class="field"><label>Muscles secondaires</label><input class="input" id="eMs" value="${esc((e.ms||[]).join(', '))}"></div>
      <div class="field"><label>Ma note perso</label><textarea class="textarea" id="eNote" placeholder="Réglage machine, sensations, rappel technique…">${esc(e.note||'')}</textarea></div>
      <div class="field"><label>Conseil</label><textarea class="textarea" id="eTip" style="min-height:60px">${esc(e.tip||'')}</textarea></div>
      <div class="field"><label>Photos, GIF et vidéos</label><div class="photo-strip" id="efoto">${photoStripHTML(e)}</div>
        <input type="file" id="eFile" accept="image/*,video/*" style="display:none" onchange="Prog._addPhoto('${day}','${id}',this.files[0])"></div>`,
      `<button class="btn wide ghost" onclick="Modal.close()">Fermer</button><button class="btn wide primary" onclick="Prog.saveExo(${day},'${id}')">Enregistrer</button>`);
  },
  saveExo(day, id) {
    const e = S.program[day].exos.find(x => x.id === id); if (!e) return;
    e.name = val('eName') || e.name; e.eq = val('eEq'); e.reps = val('eReps') || e.reps;
    e.sets = +val('eSets') || e.sets; e.rest = +val('eRest') || 0; e.load = val('eLoad');
    e.mp = splitList(val('eMp')); e.ms = splitList(val('eMs')); e.note = val('eNote'); e.tip = val('eTip');
    save(); Modal.close(); this.render(); toast('Enregistré ✓');
  },
  exoPhotos(id) { this.editExo(CUR, id); setTimeout(() => document.getElementById('eFile')?.click(), 200); },
  async _addPhoto(day, id, file) {
    if (!file) return;
    const e = S.program[day].exos.find(x => x.id === id); if (!e) return;
    toast(file.type.startsWith('video/') ? 'Traitement de la vidéo…' : 'Traitement de la photo…');
    try {
      const key = await Media.addFile(file);
      e.photos.push(key); save();
      const strip = document.getElementById('efoto'); if (strip) strip.innerHTML = photoStripHTML(e);
    } catch (err) { toast('⚠ Fichier illisible'); }
  },
  async delPhoto(day, id, key) {
    const e = S.program[day].exos.find(x => x.id === id); if (!e) return;
    e.photos = e.photos.filter(k => k !== key);
    await Media.del(key).catch(() => {}); await Photos.del(key).catch(() => {});
    save();
    const strip = document.getElementById('efoto'); if (strip) strip.innerHTML = photoStripHTML(e);
  }
};

/* ---- petits helpers de formulaire ---- */
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function splitList(s) { return s.split(',').map(x => x.trim()).filter(Boolean); }
function setSeg(group, btn) { document.querySelectorAll('#' + group + ' button').forEach(b => b.classList.remove('on')); btn.classList.add('on'); }
function stepperHTML(id, v, step = 1, min = 0, max = 999) {
  return `<div class="stepper"><button type="button" onclick="stepp('${id}',${-step},${min},${max})">−</button>
    <input id="${id}" type="number" value="${esc(v)}" inputmode="numeric"><button type="button" onclick="stepp('${id}',${step},${min},${max})">+</button></div>`;
}
function stepp(id, d, min, max) { const el = document.getElementById(id); let n = (+el.value || 0) + d; n = Math.max(min, Math.min(max, n)); el.value = n; }
function photoStripHTML(e) {
  const day = CUR;
  return (e.photos || []).map(k => `<div style="position:relative">
      <span class="photo-thumb">${Media.tag(k)}</span>
      <button onclick="Prog.delPhoto('${day}','${e.id}','${k}')" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:var(--red);color:#fff;border:none;font-size:13px;cursor:pointer">✕</button>
    </div>`).join('') + `<div class="photo-add" onclick="document.getElementById('eFile').click()">+</div>`;
}
