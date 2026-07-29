/* ============================================================
   NUTRITION — journal calories/macros, recettes, plans, aliments
   ============================================================ */
const MEALS = [ {k:'petitdej',label:'Petit-déjeuner',ic:'☕'}, {k:'dej',label:'Déjeuner',ic:'🍽'}, {k:'collation',label:'Collation',ic:'🍎'}, {k:'diner',label:'Dîner',ic:'🌙'} ];
const MEALKEYS = MEALS.map(m => m.k);
function mlabel(m){ return `${Math.round(m.kcal)} kcal · <b style="color:var(--prot)">${Math.round(m.p)}</b>P <b style="color:var(--carb)">${Math.round(m.c)}</b>G <b style="color:var(--fat)">${Math.round(m.f)}</b>L`; }

const Nutri = {
  sub: 'journal', date: todayKey(),
  logFor(d) { return S.nutrition.log[d] || (S.nutrition.log[d] = []); },
  render() {
    const v = document.getElementById('v-nutrition');
    v.innerHTML = `<div class="subtabs">
        ${[['journal','Journal'],['recettes','Recettes'],['plans','Plans'],['aliments','Aliments']].map(([k,l])=>`<button class="subtab ${this.sub===k?'on':''}" onclick="Nutri.setSub('${k}')">${l}</button>`).join('')}
      </div><div id="nutBody"></div>`;
    this._body();
  },
  setSub(s) { this.sub = s; this.render(); },
  _body() {
    ({ journal:()=>this._journal(), recettes:()=>this._recettes(), plans:()=>this._plans(), aliments:()=>this._aliments() }[this.sub])();
  },

  /* ---------- JOURNAL ---------- */
  _journal() {
    const t = effectiveTargets();
    const entries = this.logFor(this.date);
    const tot = sumMacros(entries);
    const isToday = this.date === todayKey();
    const el = document.getElementById('nutBody');
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button class="iconbtn" onclick="Nutri.shiftDate(-1)">‹</button>
        <div style="text-align:center"><div style="font-weight:700;font-size:14px">${isToday?'Aujourd\'hui':fmtDateFull(this.date)}</div>
          <div style="font-size:11px;color:var(--muted)">${isToday?fmtDateFull(this.date):''}</div></div>
        <button class="iconbtn" onclick="Nutri.shiftDate(1)" ${isToday?'style="opacity:.35"':''}>›</button>
      </div>
      <div class="macro-hero">
        <div class="cal-ring-wrap">
          ${ringSVG(tot.kcal, t.kcal)}
          <div class="macro-bars">
            ${macroBar('Protéines', tot.p, t.p, 'var(--prot)')}
            ${macroBar('Glucides', tot.c, t.c, 'var(--carb)')}
            ${macroBar('Lipides', tot.f, t.f, 'var(--fat)')}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn sm wide" onclick="Nutri.applyPlanMenu()">📋 Plan</button>
          <button class="btn sm wide" onclick="Nutri.saveAsPlan()">💾 Sauver</button>
          <button class="btn sm wide" onclick="NutriTips.panel('${this.date}')">💡 Conseils</button>
        </div>
      </div>
      ${NutriTips.card(this.date)}
      ${MEALS.map(meal => {
        const items = entries.filter(e => e.meal === meal.k);
        const mm = sumMacros(items);
        return `<div class="meal-sec">
          <div class="meal-hd"><div class="mn"><span class="ic">${meal.ic}</span>${meal.label}</div><div class="mk">${Math.round(mm.kcal)} kcal</div></div>
          ${items.map(it=>`<div class="food-row" onclick="Nutri.editEntry('${it.id}')">
            <div class="fi"><div class="fn">${esc(it.label)}</div><div class="fq">${it.type==='recipe'?it.qty+' portion'+(it.qty>1?'s':''):Math.round(it.qty)+' g'} · ${Math.round(it.p)}P ${Math.round(it.c)}G ${Math.round(it.f)}L</div></div>
            <div class="fc"><b>${Math.round(it.kcal)}</b><small>kcal</small></div>
          </div>`).join('')}
          <button class="addmeal" onclick="Nutri.addToMeal('${meal.k}')">+ Ajouter à ${meal.label.toLowerCase()}</button>
        </div>`;
      }).join('')}
      <div class="hint" style="text-align:center;margin-top:8px">P = protéines · G = glucides · L = lipides</div>`;
  },
  shiftDate(d) {
    const dt = new Date(this.date + 'T12:00:00'); dt.setDate(dt.getDate() + d);
    const nk = todayKey(dt); if (new Date(nk) > new Date(todayKey())) return;
    this.date = nk; this._journal();
  },
  addToMeal(mealK) { this._pickFor = mealK; this._psub = 'food'; this._pq = ''; Modal.open('Ajouter', this._addBody(), ''); },
  pickMealToAdd() {
    Modal.open('Ajouter à…', MEALS.map(m=>`<button class="btn ghost block" style="justify-content:flex-start;gap:12px;margin-bottom:8px" onclick="Modal.close();Nutri.addToMeal('${m.k}')"><span style="font-size:20px">${m.ic}</span> ${m.label}</button>`).join(''), '');
  },
  _addBody() {
    const foods = [...S.nutrition.foods, ...FOODS];
    const recs = S.nutrition.recipes;
    const q = this._pq.toLowerCase();
    const flist = foods.filter(f => !q || f.name.toLowerCase().includes(q));
    const rlist = recs.filter(r => !q || r.name.toLowerCase().includes(q));
    return `<div class="seg" style="margin-bottom:12px"><button class="${this._psub==='food'?'on':''}" onclick="Nutri._psetsub('food')">Aliments</button><button class="${this._psub==='recipe'?'on':''}" onclick="Nutri._psetsub('recipe')">Recettes</button></div>
      <div class="field"><input class="input" id="addSearch" placeholder="Rechercher…" value="${esc(this._pq)}" oninput="Nutri._paddsearch(this.value)"></div>
      <div id="addList">${ this._psub==='food'
        ? flist.map(f=>`<div class="food-row" style="border-bottom:1px solid var(--border)" onclick="Nutri.qtyFood('${f.id}')"><div class="fi"><div class="fn">${esc(f.name)}</div><div class="fq">${f.kcal} kcal · ${f.p}P ${f.c}G ${f.f}L / 100g</div></div><span style="color:var(--green);font-size:20px">+</span></div>`).join('')
        : rlist.map(r=>{const m=recipeMacros(r);return `<div class="food-row" style="border-bottom:1px solid var(--border)" onclick="Nutri.qtyRecipe('${r.id}')"><div class="fi"><div class="fn">${r.emoji||'🍴'} ${esc(r.name)}</div><div class="fq">${Math.round(m.kcal)} kcal/portion</div></div><span style="color:var(--green);font-size:20px">+</span></div>`;}).join('') }</div>`;
  },
  _psetsub(s) { this._psub = s; Modal.setBody(this._addBody()); },
  _psetsubRefresh(){ document.getElementById('addList'); },
  _paddsearch(q) { this._pq = q; const l = document.getElementById('addList'); const foods=[...S.nutrition.foods,...FOODS]; const recs=S.nutrition.recipes; const qq=q.toLowerCase();
    if (this._psub==='food'){ l.innerHTML = foods.filter(f=>!qq||f.name.toLowerCase().includes(qq)).map(f=>`<div class="food-row" style="border-bottom:1px solid var(--border)" onclick="Nutri.qtyFood('${f.id}')"><div class="fi"><div class="fn">${esc(f.name)}</div><div class="fq">${f.kcal} kcal · ${f.p}P ${f.c}G ${f.f}L / 100g</div></div><span style="color:var(--green);font-size:20px">+</span></div>`).join(''); }
    else { l.innerHTML = recs.filter(r=>!qq||r.name.toLowerCase().includes(qq)).map(r=>{const m=recipeMacros(r);return `<div class="food-row" style="border-bottom:1px solid var(--border)" onclick="Nutri.qtyRecipe('${r.id}')"><div class="fi"><div class="fn">${r.emoji||'🍴'} ${esc(r.name)}</div><div class="fq">${Math.round(m.kcal)} kcal/portion</div></div><span style="color:var(--green);font-size:20px">+</span></div>`;}).join(''); } },
  qtyFood(fid) {
    const f = foodById(fid); if (!f) return;
    const quick = f.portion ? `<button class="btn sm" onclick="document.getElementById('qG').value=${f.portion.g};Nutri._qprev('${fid}')">${esc(f.portion.label)} (${f.portion.g}g)</button>` : '';
    const commons = [50,100,150,200].map(g=>`<button class="btn sm" onclick="document.getElementById('qG').value=${g};Nutri._qprev('${fid}')">${g}g</button>`).join('');
    Modal.open(f.name, `
      <div class="field"><label>Quantité (grammes)</label>${stepperHTML('qG', f.portion?f.portion.g:100, 10, 0, 5000)}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${quick}${commons}</div>
      <div id="qPrev" class="banner" style="margin:0"><div class="bt"></div></div>`,
      `<button class="btn wide ghost" onclick="Nutri.addToMeal('${this._pickFor}')">‹ Retour</button><button class="btn wide green" onclick="Nutri.confirmFood('${fid}')">Ajouter</button>`);
    this._qprev(fid);
  },
  _qprev(fid) { const f = foodById(fid); const g = +val('qG')||0; const m = macrosForFood(f, g); const b = document.querySelector('#qPrev .bt'); if (b) b.innerHTML = `<h4>${Math.round(m.kcal)} kcal</h4><p>${Math.round(m.p)}g protéines · ${Math.round(m.c)}g glucides · ${Math.round(m.f)}g lipides</p>`; },
  confirmFood(fid) {
    const f = foodById(fid); const g = +val('qG')||0; if (!g) { toast('Quantité ?'); return; }
    const m = macrosForFood(f, g);
    this.logFor(this.date).push({ id:uid(), meal:this._pickFor, type:'food', ref:fid, qty:g, label:f.name, kcal:m.kcal, p:m.p, c:m.c, f:m.f });
    save(); Modal.close(); this._journal(); toast('Ajouté ✓');
  },
  qtyRecipe(rid) {
    const r = recipeById(rid); if (!r) return;
    Modal.open(r.name, `<div class="field"><label>Portions</label>${stepperHTML('qS', 1, 1, 1, 20)}</div>
      <div id="qPrev" class="banner" style="margin:0"><div class="bt"></div></div>`,
      `<button class="btn wide ghost" onclick="Nutri.addToMeal('${this._pickFor}')">‹ Retour</button><button class="btn wide green" onclick="Nutri.confirmRecipe('${rid}')">Ajouter</button>`);
    this._rprev(rid);
    document.getElementById('qS').addEventListener('input', () => this._rprev(rid));
    document.querySelectorAll('#qPrev').forEach(()=>{});
  },
  _rprev(rid) { const r = recipeById(rid); const s = +val('qS')||1; const m = recipeMacros(r); const b = document.querySelector('#qPrev .bt'); if (b) b.innerHTML = `<h4>${Math.round(m.kcal*s)} kcal</h4><p>${Math.round(m.p*s)}g P · ${Math.round(m.c*s)}g G · ${Math.round(m.f*s)}g L</p>`; },
  confirmRecipe(rid) {
    const r = recipeById(rid); const s = +val('qS')||1; const m = recipeMacros(r);
    this.logFor(this.date).push({ id:uid(), meal:this._pickFor, type:'recipe', ref:rid, qty:s, label:(r.emoji?r.emoji+' ':'')+r.name, kcal:m.kcal*s, p:m.p*s, c:m.c*s, f:m.f*s });
    save(); Modal.close(); this._journal(); toast('Recette ajoutée ✓');
  },
  editEntry(id) {
    const entries = this.logFor(this.date); const it = entries.find(e=>e.id===id); if (!it) return;
    if (it.type === 'food') {
      Modal.open(it.label, `<div class="field"><label>Quantité (g)</label>${stepperHTML('qG', Math.round(it.qty), 10, 0, 5000)}</div><div id="qPrev" class="banner" style="margin:0"><div class="bt"></div></div>`,
        `<button class="btn ghost danger" onclick="Nutri.rmEntry('${id}')">Supprimer</button><button class="btn wide green" onclick="Nutri._updFood('${id}')">Enregistrer</button>`);
      this._qprev(it.ref);
      document.getElementById('qG').addEventListener('input', ()=>this._qprev(it.ref));
    } else {
      Modal.open(it.label, `<div class="field"><label>Portions</label>${stepperHTML('qS', it.qty, 1, 1, 20)}</div><div id="qPrev" class="banner" style="margin:0"><div class="bt"></div></div>`,
        `<button class="btn ghost danger" onclick="Nutri.rmEntry('${id}')">Supprimer</button><button class="btn wide green" onclick="Nutri._updRec('${id}')">Enregistrer</button>`);
      this._rprev(it.ref);
      document.getElementById('qS').addEventListener('input', ()=>this._rprev(it.ref));
    }
  },
  _updFood(id) { const it = this.logFor(this.date).find(e=>e.id===id); const f=foodById(it.ref); const g=+val('qG')||0; const m=macrosForFood(f,g); Object.assign(it,{qty:g,kcal:m.kcal,p:m.p,c:m.c,f:m.f}); save(); Modal.close(); this._journal(); },
  _updRec(id) { const it = this.logFor(this.date).find(e=>e.id===id); const r=recipeById(it.ref); const s=+val('qS')||1; const m=recipeMacros(r); Object.assign(it,{qty:s,kcal:m.kcal*s,p:m.p*s,c:m.c*s,f:m.f*s}); save(); Modal.close(); this._journal(); },
  rmEntry(id) { S.nutrition.log[this.date] = this.logFor(this.date).filter(e=>e.id!==id); save(); Modal.close(); this._journal(); },

  /* ---------- appliquer / sauver plan ---------- */
  applyPlanMenu() {
    Modal.open('Appliquer un plan', S.nutrition.plans.map(p=>`<div class="tile" onclick="Nutri.applyPlan('${p.id}')"><div class="tile-row"><div class="tile-thumb" style="font-size:20px">📋</div><div class="tile-b"><h4>${esc(p.name)}</h4><p>${p.goal||''}</p></div><span style="color:var(--green)">Appliquer</span></div></div>`).join('') || '<p class="hint">Aucun plan.</p>', '');
  },
  applyPlan(pid) {
    const p = S.nutrition.plans.find(x=>x.id===pid); if (!p) return;
    p.meals.forEach((meal, idx) => {
      const mealK = MEALKEYS[idx] || 'collation';
      meal.items.forEach(([type, ref, qty]) => {
        if (type === 'food') { const f = foodById(ref); if (!f) return; const m = macrosForFood(f, qty); this.logFor(this.date).push({ id:uid(), meal:mealK, type:'food', ref, qty, label:f.name, kcal:m.kcal, p:m.p, c:m.c, f:m.f }); }
        else { const r = recipeById(ref); if (!r) return; const m = recipeMacros(r); this.logFor(this.date).push({ id:uid(), meal:mealK, type:'recipe', ref, qty, label:(r.emoji?r.emoji+' ':'')+r.name, kcal:m.kcal*qty, p:m.p*qty, c:m.c*qty, f:m.f*qty }); }
      });
    });
    save(); Modal.close(); this._journal(); toast('Plan appliqué ✓');
  },
  saveAsPlan() {
    const entries = this.logFor(this.date); if (!entries.length) { toast('Journée vide'); return; }
    Modal.open('Sauver en plan', `<div class="field"><label>Nom du plan</label><input class="input" id="plName" placeholder="Ex : Ma journée type"></div>`,
      `<button class="btn wide ghost" onclick="Modal.close()">Annuler</button><button class="btn wide primary" onclick="Nutri._doSavePlan()">Créer le plan</button>`);
  },
  _doSavePlan() {
    const name = val('plName') || 'Mon plan'; const entries = this.logFor(this.date);
    const meals = MEALS.map(m => ({ name:m.label, items: entries.filter(e=>e.meal===m.k).map(e=>[e.type, e.ref, e.qty]) }));
    S.nutrition.plans.unshift({ id:uid(), name, goal:'Perso', custom:true, meals }); save(); Modal.close(); toast('Plan créé ✓');
  },

  /* ---------- RECETTES ---------- */
  _recettes() {
    const el = document.getElementById('nutBody');
    el.innerHTML = `<button class="btn ghost block" style="border-style:dashed;margin-bottom:14px" onclick="Nutri.editRecipe(null)">+ Créer une recette</button>
      ${S.nutrition.recipes.map(r=>{const m=recipeMacros(r);return `<div class="tile" onclick="Nutri.viewRecipe('${r.id}')"><div class="tile-row">
        <div class="tile-thumb" style="font-size:24px;background:var(--bg3)">${r.emoji||'🍴'}</div>
        <div class="tile-b"><h4>${esc(r.name)}</h4><p>${Math.round(m.kcal)} kcal · ${Math.round(m.p)}P ${Math.round(m.c)}G ${Math.round(m.f)}L / portion</p>
          <div>${(r.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div>
      </div></div>`;}).join('')}`;
  },
  viewRecipe(id) {
    const r = recipeById(id); if (!r) return; const m = recipeMacros(r);
    Modal.open((r.emoji?r.emoji+' ':'')+r.name, `
      <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;gap:8px">
        <div class="stat-card"><div class="sv">${Math.round(m.kcal)}</div><div class="sl">kcal</div></div>
        <div class="stat-card"><div class="sv" style="color:var(--prot)">${Math.round(m.p)}</div><div class="sl">Prot.</div></div>
        <div class="stat-card blue"><div class="sv" style="color:var(--carb)">${Math.round(m.c)}</div><div class="sl">Gluc.</div></div>
        <div class="stat-card gold"><div class="sv" style="color:var(--fat)">${Math.round(m.f)}</div><div class="sl">Lip.</div></div>
      </div>
      <p class="hint" style="margin:4px 0 12px">Pour ${r.serv} portion${r.serv>1?'s':''} · valeurs par portion</p>
      <h5 style="font-size:11px;text-transform:uppercase;color:var(--muted);letter-spacing:1px;margin-bottom:8px">Ingrédients</h5>
      <ul class="ml" style="margin-bottom:14px">${(r.ing||[]).map(([fid,g])=>{const f=foodById(fid);return `<li class="p">${f?esc(f.name):'?'} — ${g} g</li>`;}).join('')}</ul>
      <h5 style="font-size:11px;text-transform:uppercase;color:var(--muted);letter-spacing:1px;margin-bottom:8px">Préparation</h5>
      <ol style="padding-left:18px;font-size:13px;line-height:1.7;color:var(--text)">${(r.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
      <div class="divider"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary wide" onclick="Modal.close();Nutri._pickFor='dej';Nutri.qtyRecipe('${r.id}')">+ Ajouter au journal</button>
        <button class="btn ghost" onclick="Nutri.editRecipe('${r.id}')">✎</button>
        ${r.id.startsWith('r_')?'':`<button class="btn ghost danger" onclick="Nutri.delRecipe('${r.id}')">✕</button>`}
      </div>`, '');
  },
  editRecipe(id) {
    const r = id ? recipeById(id) : { id:null, name:'', emoji:'🍴', serv:1, tags:[], ing:[], steps:[] };
    this._rdraft = clone(r);
    this._renderRecipeEditor(id);
  },
  _renderRecipeEditor(id) {
    const r = this._rdraft;
    Modal.open(id ? 'Modifier la recette' : 'Nouvelle recette', `
      <div class="row2"><div class="field"><label>Emoji</label><input class="input" id="rEmoji" value="${esc(r.emoji)}" maxlength="2" style="text-align:center;font-size:22px"></div>
        <div class="field"><label>Portions</label>${stepperHTML('rServ', r.serv, 1, 1, 20)}</div></div>
      <div class="field"><label>Nom *</label><input class="input" id="rName" value="${esc(r.name)}"></div>
      <div class="field"><label>Tags (virgules)</label><input class="input" id="rTags" value="${esc((r.tags||[]).join(', '))}" placeholder="Prise de masse, Rapide"></div>
      <div class="field"><label>Ingrédients</label>
        <div id="rIng">${this._ingRows()}</div>
        <button class="btn sm ghost block" style="border-style:dashed;margin-top:6px" onclick="Nutri._pickIng()">+ Ajouter un ingrédient</button>
      </div>
      <div class="field"><label>Préparation (une étape par ligne)</label><textarea class="textarea" id="rSteps" style="min-height:90px">${esc((r.steps||[]).join('\n'))}</textarea></div>
      <div class="banner" id="rPrev" style="margin:4px 0 0"><div class="bt"></div></div>`,
      `<button class="btn wide ghost" onclick="Modal.close()">Annuler</button><button class="btn wide primary" onclick="Nutri.saveRecipe('${id||''}')">Enregistrer</button>`);
    this._recPrev();
  },
  _ingRows() {
    return (this._rdraft.ing||[]).map((row,i)=>{const f=foodById(row[0]);return `<div class="setrow" style="grid-template-columns:1fr 70px 32px">
      <div style="font-size:13px">${f?esc(f.name):'?'}</div>
      <input class="miniput" type="number" inputmode="numeric" value="${row[1]}" oninput="Nutri._ingG(${i},this.value)">
      <button class="iconbtn" style="width:30px;height:30px;color:#FF7B6B" onclick="Nutri._ingDel(${i})">✕</button></div>`;}).join('') || '<p class="hint">Aucun ingrédient.</p>';
  },
  _pickIng() {
    this._ingq='';
    Modal.open('Choisir un aliment', `<div class="field"><input class="input" id="ingSearch" placeholder="Rechercher…" oninput="Nutri._ingSearch(this.value)"></div><div id="ingList">${this._ingListHTML('')}</div>`,
      `<button class="btn wide ghost" onclick="Nutri._renderRecipeEditor('${this._rdraft.id||''}')">‹ Retour à la recette</button>`);
  },
  _ingListHTML(q) { const foods=[...S.nutrition.foods,...FOODS]; const qq=q.toLowerCase(); return foods.filter(f=>!qq||f.name.toLowerCase().includes(qq)).map(f=>`<div class="food-row" style="border-bottom:1px solid var(--border)" onclick="Nutri._ingAdd('${f.id}')"><div class="fi"><div class="fn">${esc(f.name)}</div><div class="fq">${f.kcal} kcal/100g</div></div><span style="color:var(--green);font-size:20px">+</span></div>`).join(''); },
  _ingSearch(q){ document.getElementById('ingList').innerHTML = this._ingListHTML(q); },
  _ingAdd(fid){ this._rdraft.ing.push([fid, (foodById(fid).portion?foodById(fid).portion.g:100)]); this._renderRecipeEditor(this._rdraft.id||''); },
  _ingG(i,v){ this._rdraft.ing[i][1] = +v||0; this._recPrev(); },
  _ingDel(i){ this._rdraft.ing.splice(i,1); document.getElementById('rIng').innerHTML=this._ingRows(); this._recPrev(); },
  _recPrev(){ const r=this._rdraft; r.serv=+val('rServ')||1; const m=recipeMacros(r); const b=document.querySelector('#rPrev .bt'); if(b) b.innerHTML=`<h4>${Math.round(m.kcal)} kcal / portion</h4><p>${Math.round(m.p)}g P · ${Math.round(m.c)}g G · ${Math.round(m.f)}g L</p>`; },
  saveRecipe(id) {
    const r = this._rdraft; r.name = val('rName'); if (!r.name){toast('Nom ?');return;}
    r.emoji = val('rEmoji')||'🍴'; r.serv = +val('rServ')||1; r.tags = splitList(val('rTags'));
    r.steps = val('rSteps').split('\n').map(s=>s.trim()).filter(Boolean);
    if (id) { const i=S.nutrition.recipes.findIndex(x=>x.id===id); S.nutrition.recipes[i]=r; }
    else { r.id = 'rc_'+uid(); S.nutrition.recipes.unshift(r); }
    save(); Modal.close(); this.render(); toast('Recette enregistrée ✓');
  },
  delRecipe(id){ Modal.confirm('Supprimer la recette ?','',()=>{ S.nutrition.recipes=S.nutrition.recipes.filter(x=>x.id!==id); save(); Modal.close(); this.render(); },'Supprimer'); },

  /* ---------- PLANS ---------- */
  _plans() {
    const el = document.getElementById('nutBody');
    el.innerHTML = `<p class="hint" style="margin-bottom:12px">Un plan = une journée de repas type. Applique-le à ta journée en un tap depuis le Journal.</p>
      ${S.nutrition.plans.map(p=>{ let tot={kcal:0,p:0,c:0,f:0}; p.meals.forEach(meal=>meal.items.forEach(([type,ref,qty])=>{ if(type==='food'){const f=foodById(ref);if(f){const m=macrosForFood(f,qty);tot.kcal+=m.kcal;tot.p+=m.p;tot.c+=m.c;tot.f+=m.f;}} else {const r=recipeById(ref);if(r){const m=recipeMacros(r);tot.kcal+=m.kcal*qty;tot.p+=m.p*qty;tot.c+=m.c*qty;tot.f+=m.f*qty;}} }));
        return `<div class="tile" onclick="Nutri.viewPlan('${p.id}')"><div class="tile-row"><div class="tile-thumb" style="font-size:20px;background:var(--bg3)">📋</div>
          <div class="tile-b"><h4>${esc(p.name)}</h4><p>${Math.round(tot.kcal)} kcal · ${Math.round(tot.p)}P ${Math.round(tot.c)}G ${Math.round(tot.f)}L</p><span class="tag">${esc(p.goal||'')}</span></div></div></div>`; }).join('')}`;
  },
  viewPlan(id) {
    const p = S.nutrition.plans.find(x=>x.id===id); if (!p) return;
    Modal.open(p.name, `${p.meals.map((meal,idx)=>`<div class="meal-sec"><div class="meal-hd"><div class="mn"><span class="ic">${MEALS[idx]?MEALS[idx].ic:'🍴'}</span>${esc(meal.name)}</div></div>
      ${meal.items.map(([type,ref,qty])=>{const o=type==='food'?foodById(ref):recipeById(ref); return `<div class="food-row"><div class="fi"><div class="fn">${o?esc((o.emoji?o.emoji+' ':'')+o.name):'?'}</div><div class="fq">${type==='food'?qty+' g':qty+' portion'+(qty>1?'s':'')}</div></div></div>`;}).join('')||'<p class="hint">—</p>'}</div>`).join('')}
      <div class="divider"></div>
      <button class="btn green block" onclick="Nutri.applyPlan('${p.id}')">Appliquer à ${this.date===todayKey()?'aujourd\'hui':'ce jour'}</button>
      ${p.custom?`<button class="btn ghost danger block" style="margin-top:8px" onclick="Nutri.delPlan('${p.id}')">Supprimer le plan</button>`:''}`, '');
  },
  delPlan(id){ Modal.confirm('Supprimer le plan ?','',()=>{ S.nutrition.plans=S.nutrition.plans.filter(x=>x.id!==id); save(); Modal.close(); this.render(); },'Supprimer'); },

  /* ---------- ALIMENTS ---------- */
  _aliments() {
    this._aq = this._aq || '';
    const foods = [...S.nutrition.foods, ...FOODS];
    const el = document.getElementById('nutBody');
    const list = foods.filter(f=>!this._aq||f.name.toLowerCase().includes(this._aq.toLowerCase()));
    el.innerHTML = `<button class="btn ghost block" style="border-style:dashed;margin-bottom:12px" onclick="Nutri.editFood(null)">+ Ajouter un aliment</button>
      <div class="field"><input class="input" id="alSearch" placeholder="Rechercher un aliment…" value="${esc(this._aq)}" oninput="Nutri._asearch(this.value)"></div>
      <div id="alList">${list.map(f=>this._foodRow(f)).join('')}</div>`;
  },
  _foodRow(f){ return `<div class="food-row" style="border-bottom:1px solid var(--border)" onclick="Nutri.editFood('${f.id}')"><div class="fi"><div class="fn">${esc(f.name)}${f.id.startsWith('f_')?'':' <span class="tag" style="background:rgba(46,204,113,.15);color:var(--green)">Perso</span>'}</div><div class="fq">${f.cat||''} · pour 100g</div></div><div class="fc"><b>${f.kcal}</b><small>kcal · ${f.p}P ${f.c}G ${f.f}L</small></div></div>`; },
  _asearch(q){ this._aq=q; const foods=[...S.nutrition.foods,...FOODS]; document.getElementById('alList').innerHTML = foods.filter(f=>!q||f.name.toLowerCase().includes(q.toLowerCase())).map(f=>this._foodRow(f)).join(''); },
  editFood(id) {
    const f = id ? [...S.nutrition.foods,...FOODS].find(x=>x.id===id) : { id:null, name:'', cat:'Protéine', kcal:'', p:'', c:'', f:'' };
    const builtin = id && id.startsWith('f_');
    Modal.open(id ? (builtin?'Aliment':'Modifier l\'aliment') : 'Nouvel aliment', `
      <p class="hint" style="margin-bottom:10px">Valeurs pour 100 g.</p>
      <div class="field"><label>Nom *</label><input class="input" id="fName" value="${esc(f.name)}" ${builtin?'disabled':''}></div>
      <div class="field"><label>Catégorie</label><input class="input" id="fCat" value="${esc(f.cat||'')}" ${builtin?'disabled':''}></div>
      <div class="row2"><div class="field"><label>Calories</label><input class="input" type="number" id="fKcal" value="${f.kcal}" ${builtin?'disabled':''}></div>
        <div class="field"><label>Protéines</label><input class="input" type="number" id="fP" value="${f.p}" ${builtin?'disabled':''}></div></div>
      <div class="row2"><div class="field"><label>Glucides</label><input class="input" type="number" id="fC" value="${f.c}" ${builtin?'disabled':''}></div>
        <div class="field"><label>Lipides</label><input class="input" type="number" id="fF" value="${f.f}" ${builtin?'disabled':''}></div></div>
      ${builtin?'<p class="hint">Aliment de la base — non modifiable. Duplique-le en créant un aliment perso si besoin.</p>':''}`,
      builtin ? `<button class="btn wide ghost" onclick="Modal.close()">Fermer</button>`
        : `${id?`<button class="btn ghost danger" onclick="Nutri.delFood('${id}')">Suppr.</button>`:''}<button class="btn wide primary" onclick="Nutri.saveFood('${id||''}')">Enregistrer</button>`);
  },
  saveFood(id) {
    const name = val('fName'); if (!name){toast('Nom ?');return;}
    const obj = { id: id||('fc_'+uid()), name, cat: val('fCat')||'Autre', kcal:+val('fKcal')||0, p:+val('fP')||0, c:+val('fC')||0, f:+val('fF')||0 };
    if (id) { const i=S.nutrition.foods.findIndex(x=>x.id===id); if(i>=0) S.nutrition.foods[i]=obj; else S.nutrition.foods.unshift(obj); }
    else S.nutrition.foods.unshift(obj);
    save(); Modal.close(); this._aliments(); toast('Aliment enregistré ✓');
  },
  delFood(id){ S.nutrition.foods=S.nutrition.foods.filter(x=>x.id!==id); save(); Modal.close(); this._aliments(); }
};

/* ---- widgets nutrition ---- */
function ringSVG(consumed, target) {
  const r = 52, c = 2*Math.PI*r, pct = target ? Math.min(1, consumed/target) : 0;
  const over = consumed > target && target;
  const col = over ? 'var(--red)' : 'var(--green)';
  return `<div class="ring"><svg width="118" height="118" viewBox="0 0 118 118">
    <circle class="rc" cx="59" cy="59" r="${r}" stroke="var(--bg)" stroke-width="11"/>
    <circle class="rc" cx="59" cy="59" r="${r}" stroke="${col}" stroke-width="11" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct)}"/>
  </svg><div class="ring-ctr"><div class="big">${Math.round(consumed)}</div><div class="lbl">/ ${target} kcal</div></div></div>`;
}
function macroBar(name, cons, targ, col) {
  const pct = targ ? Math.min(100, cons/targ*100) : 0;
  return `<div class="mbar"><div class="mtop"><b>${name}</b><span>${Math.round(cons)} / ${targ} g</span></div>
    <div class="mtrack"><div class="mfill" style="width:${pct}%;background:${col}"></div></div></div>`;
}
function fmtDateFull(k){ const d=new Date(k+'T12:00:00'); return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}); }
