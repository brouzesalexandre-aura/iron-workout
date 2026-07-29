/* ============================================================
   EXERCICES — bibliothèque, recherche, import, exos perso
   ============================================================ */
const Exos = {
  q: '', filt: '',
  _all() { return [...S.customExos, ...LIB]; },
  _match(e) {
    const okq = !this.q || e.name.toLowerCase().includes(this.q.toLowerCase()) || (e.eq||'').toLowerCase().includes(this.q.toLowerCase());
    const okf = !this.filt || e.cat === this.filt;
    return okq && okf;
  },
  render() {
    const v = document.getElementById('v-exercices');
    const list = this._all().filter(e => this._match(e));
    v.innerHTML = `
      <div class="sec-hd"><div><h2>BIBLIO<span>THÈQUE</span></h2><p>${this._all().length} exercices · touche pour importer</p></div></div>
      <div class="field" style="margin-bottom:10px"><div style="position:relative">
        <input class="input" id="exoSearch" placeholder="Rechercher un exercice…" value="${esc(this.q)}" oninput="Exos.search(this.value)" style="padding-left:38px">
        <svg viewBox="0 0 24 24" width="18" style="position:absolute;left:12px;top:13px" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
      </div></div>
      <div class="subtabs">
        <button class="subtab ${!this.filt?'on':''}" onclick="Exos.filter('')">Tous</button>
        ${MUSCLES.map(m=>`<button class="subtab ${this.filt===m?'on':''}" onclick="Exos.filter('${m}')">${m}</button>`).join('')}
      </div>
      <button class="btn ghost block" style="border-style:dashed;margin-bottom:14px" onclick="Exos.editCustom(null)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg> Créer un exercice perso</button>
      ${list.length ? list.map(e=>this._tile(e)).join('') : '<div class="empty"><p>Aucun exercice trouvé.</p></div>'}`;
  },
  _tile(e) {
    const ref = e.custom ? 'cus:' + e.id : 'lib:' + e.k;
    return `<div class="tile" onclick="Exos.view('${ref}')"><div class="tile-row">
      <div class="tile-thumb">${exoImg(e)}</div>
      <div class="tile-b"><h4>${esc(e.name)}${e.custom?' <span class="tag" style="background:rgba(46,204,113,.15);color:var(--green)">Perso</span>':''}</h4>
        <p>${esc(e.eq||'')}</p><span class="tag">${esc(e.cat||'')}</span></div>
      <svg viewBox="0 0 24 24" width="18" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>
    </div></div>`;
  },
  search(q) { this.q = q; const v = document.getElementById('v-exercices'); const list = this._all().filter(e=>this._match(e)); const anchor = document.querySelector('#v-exercices .subtabs'); // re-render only list part for speed
    this.render(); const inp = document.getElementById('exoSearch'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } },
  filter(f) { this.filt = f; this.render(); },
  srcByRef(ref) { const [t, id] = ref.split(':'); return t === 'cus' ? S.customExos.find(x=>x.id===id) : LIBMAP[id]; },
  view(ref) {
    const e = this.srcByRef(ref); if (!e) return;
    Modal.open(e.name, `
      <div class="img-zone" style="width:100%;height:200px;border-radius:12px;margin-bottom:14px">${exoImg(e, true)}</div>
      <div class="machine" style="font-size:13px;margin-bottom:4px">🛠 ${esc(e.eq||'')}</div>
      <span class="tag">${esc(e.cat||'')}</span>
      <div style="margin:12px 0"><div class="chips">${chipsHTML(e)}</div></div>
      ${muscleMap(e.zp || [], e.zs || [])}
      <div style="font-size:12px;color:var(--muted);margin-bottom:2px">Par défaut : ${e.ds??3} séries · ${e.dr??'12'} reps · ${e.drest??75}s repos</div>
      ${e.tip?`<div class="tip">💡 ${esc(e.tip)}</div>`:''}
      ${e.custom?`<button class="btn sm ghost" style="margin-top:12px" onclick="Exos.editCustom('${e.id}')">✎ Modifier</button>
        <button class="btn sm danger" style="margin-top:12px" onclick="Exos.delCustom('${e.id}')">✕ Supprimer</button>`:''}
      <div class="divider"></div>
      <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Ajouter à un jour</label>
      <div style="margin-top:10px">${S.program.map((d,i)=>`<button class="btn ghost block" style="justify-content:space-between;margin-bottom:8px" onclick="Exos.addTo('${ref}',${i})"><span>J${i+1} · ${esc(d.name)}</span><span style="color:var(--green)">+ Ajouter</span></button>`).join('') || '<p class="hint">Crée d\'abord un jour dans Programme.</p>'}</div>`, '');
  },
  addTo(ref, dayIdx) { const e = this.srcByRef(ref); if (!e) return; S.program[dayIdx].exos.push(makeExoFromSource(e)); save(); Modal.close(); toast('Ajouté à J' + (dayIdx+1) + ' ✓'); if (App.tab==='programme') { CUR = dayIdx; Prog.render(); } },
  // sélecteur utilisé par Programme
  pick(onPick) {
    this._onPick = onPick; this._pq = '';
    Modal.open('Choisir un exercice', this._pickBody(), '');
  },
  _pickBody() {
    const list = this._all().filter(e => !this._pq || e.name.toLowerCase().includes(this._pq.toLowerCase()) || (e.cat||'').toLowerCase().includes(this._pq.toLowerCase()));
    return `<div class="field"><div style="position:relative">
        <input class="input" id="pickSearch" placeholder="Rechercher…" value="${esc(this._pq)}" oninput="Exos._pf(this.value)" style="padding-left:38px">
        <svg viewBox="0 0 24 24" width="18" style="position:absolute;left:12px;top:13px" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg></div></div>
      <button class="btn ghost block" style="border-style:dashed;margin-bottom:12px" onclick="Modal.close();Exos.editCustom(null)">+ Créer un exercice perso</button>
      <div id="pickList">${list.map(e=>{const ref=e.custom?'cus:'+e.id:'lib:'+e.k; return `<div class="tile" onclick="Exos._doPick('${ref}')"><div class="tile-row"><div class="tile-thumb">${exoImg(e)}</div><div class="tile-b"><h4>${esc(e.name)}</h4><p>${esc(e.eq||'')} · ${esc(e.cat||'')}</p></div><span style="color:var(--green);font-size:20px">+</span></div></div>`;}).join('')}</div>`;
  },
  _pf(q) { this._pq = q; const l = document.getElementById('pickList'); const list = this._all().filter(e => !q || e.name.toLowerCase().includes(q.toLowerCase()) || (e.cat||'').toLowerCase().includes(q.toLowerCase()));
    l.innerHTML = list.map(e=>{const ref=e.custom?'cus:'+e.id:'lib:'+e.k; return `<div class="tile" onclick="Exos._doPick('${ref}')"><div class="tile-row"><div class="tile-thumb">${exoImg(e)}</div><div class="tile-b"><h4>${esc(e.name)}</h4><p>${esc(e.eq||'')} · ${esc(e.cat||'')}</p></div><span style="color:var(--green);font-size:20px">+</span></div></div>`;}).join(''); },
  _doPick(ref) { const e = this.srcByRef(ref); if (e && this._onPick) this._onPick(e); },

  /* ---- exercices perso ---- */
  editCustom(id) {
    const e = id ? S.customExos.find(x=>x.id===id) : { id:null, name:'', eq:'', cat:'Pecto', mp:[], ms:[], tip:'', ds:3, dr:'12', drest:75, photos:[], custom:true };
    this._editing = clone(e);
    Modal.open(id ? 'Modifier l\'exercice' : 'Nouvel exercice', `
      <div class="field"><label>Nom *</label><input class="input" id="cName" value="${esc(e.name)}" placeholder="Ex : Développé Arnold"></div>
      <div class="field"><label>Matériel</label><input class="input" id="cEq" value="${esc(e.eq)}" placeholder="Ex : Haltères"></div>
      <div class="field"><label>Groupe musculaire</label><select class="select" id="cCat">${MUSCLES.map(m=>`<option${m===e.cat?' selected':''}>${m}</option>`).join('')}</select></div>
      <div class="row3">
        <div class="field"><label>Séries</label>${stepperHTML('cSets', e.ds, 1, 1, 20)}</div>
        <div class="field"><label>Reps</label><input class="input" id="cReps" value="${esc(e.dr)}"></div>
        <div class="field"><label>Repos</label>${stepperHTML('cRest', e.drest, 15, 0, 600)}</div>
      </div>
      <div class="field"><label>Muscles principaux (virgules)</label><input class="input" id="cMp" value="${esc((e.mp||[]).join(', '))}"></div>
      <div class="field"><label>Muscles secondaires</label><input class="input" id="cMs" value="${esc((e.ms||[]).join(', '))}"></div>
      <div class="field"><label>Conseil</label><textarea class="textarea" id="cTip" style="min-height:60px">${esc(e.tip||'')}</textarea></div>
      <div class="field"><label>Photos, GIF et vidéos</label><div class="photo-strip" id="cfoto">${this._customPhotos()}</div>
        <input type="file" id="cFile" accept="image/*,video/*" style="display:none" onchange="Exos._addCustomPhoto(this.files[0])"></div>`,
      `<button class="btn wide ghost" onclick="Modal.close()">Annuler</button><button class="btn wide primary" onclick="Exos.saveCustom()">Enregistrer</button>`);
  },
  _customPhotos() {
    const e = this._editing;
    return (e.photos||[]).map(k=>`<div style="position:relative"><span class="photo-thumb">${Media.tag(k)}</span><button onclick="Exos._delCustomPhoto('${k}')" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:var(--red);color:#fff;border:none;font-size:13px">✕</button></div>`).join('') + `<div class="photo-add" onclick="document.getElementById('cFile').click()">+</div>`;
  },
  async _addCustomPhoto(file) {
    if (!file) return;
    toast(file.type.startsWith('video/') ? 'Traitement de la vidéo…' : 'Traitement…');
    try {
      const key = await Media.addFile(file);
      this._editing.photos.push(key);
      document.getElementById('cfoto').innerHTML = this._customPhotos();
    } catch (e) { toast('⚠ Fichier illisible'); }
  },
  async _delCustomPhoto(k) {
    this._editing.photos = this._editing.photos.filter(x => x !== k);
    await Media.del(k).catch(() => {}); await Photos.del(k).catch(() => {});
    document.getElementById('cfoto').innerHTML = this._customPhotos();
  },
  saveCustom() {
    const name = val('cName'); if (!name) { toast('Donne un nom'); return; }
    const e = this._editing;
    e.name = name; e.eq = val('cEq'); e.cat = document.getElementById('cCat').value;
    e.ds = +val('cSets')||3; e.dr = val('cReps')||'12'; e.drest = +val('cRest')||60;
    e.mp = splitList(val('cMp')); e.ms = splitList(val('cMs')); e.tip = val('cTip'); e.custom = true;
    if (e.id) { const idx = S.customExos.findIndex(x=>x.id===e.id); S.customExos[idx] = e; }
    else { e.id = uid(); S.customExos.unshift(e); }
    save(); Modal.close(); this.render(); toast('Exercice enregistré ✓');
  },
  delCustom(id) { Modal.confirm('Supprimer cet exercice ?', 'Il reste dans les jours où il a déjà été ajouté.', () => { S.customExos = S.customExos.filter(x=>x.id!==id); save(); Modal.close(); this.render(); }, 'Supprimer'); }
};
