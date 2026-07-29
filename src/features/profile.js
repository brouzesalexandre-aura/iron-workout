/* ============================================================
   PROFIL — profil physique, objectif, besoins caloriques, poids
   ============================================================ */
const Profil = {
  render() {
    const p = S.profile, t = calcTargets(p), eff = effectiveTargets();
    const v = document.getElementById('v-profil');
    const bmi = (p.weight && p.height) ? (p.weight / Math.pow(p.height/100, 2)) : null;
    v.innerHTML = `
      <div class="sec-hd"><div><h2>MON <span>PROFIL</span></h2><p>${p.name?esc(p.name):'Configure ton profil'}</p></div>
        <button class="iconbtn" onclick="App.menu()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></button></div>

      <div class="banner">
        <div style="width:52px;height:52px;border-radius:14px;background:var(--red);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:24px;color:#fff">${p.name?esc(p.name[0].toUpperCase()):'🏋️'}</div>
        <div class="bt"><h4>${p.name?esc(p.name):'Athlète'}</h4><p>${p.weight?p.weight+' kg':'— kg'} · Objectif : ${GOAL_LABEL[p.goal]||'—'}${p.targetWeight?' → '+p.targetWeight+' kg':''}</p></div>
        <button class="btn sm" onclick="Profil.edit()">✎ Modifier</button>
      </div>

      <div class="stat-grid">
        <div class="stat-card"><div class="sv">${p.weight||'—'}<small> kg</small></div><div class="sl">Poids actuel</div></div>
        <div class="stat-card blue"><div class="sv">${bmi?round(bmi,1):'—'}</div><div class="sl">IMC ${bmi?'· '+bmiCat(bmi):''}</div></div>
        <div class="stat-card gold"><div class="sv">${t?t.tdee:'—'}</div><div class="sl">Maintien (kcal)</div></div>
        <div class="stat-card green"><div class="sv">${p.bodyfat||'—'}<small>${p.bodyfat?' %':''}</small></div><div class="sl">Masse grasse</div></div>
      </div>

      <div class="macro-hero">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h4 style="font-size:14px;font-weight:700">🎯 Mes besoins ${S.nutrition.targets.mode==='manual'?'(manuels)':'(calculés)'}</h4>
          <button class="btn sm ghost" onclick="Profil.editTargets()">Ajuster</button>
        </div>
        ${t || S.nutrition.targets.mode==='manual' ? `
        <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:0">
          <div class="stat-card" style="padding:11px"><div class="sv" style="font-size:24px">${eff.kcal}</div><div class="sl">kcal/jour</div></div>
          <div class="stat-card" style="padding:11px"><div class="sv" style="font-size:24px;color:var(--prot)">${eff.p}</div><div class="sl">Protéines</div></div>
          <div class="stat-card" style="padding:11px"><div class="sv" style="font-size:24px;color:var(--carb)">${eff.c}</div><div class="sl">Glucides</div></div>
          <div class="stat-card" style="padding:11px"><div class="sv" style="font-size:24px;color:var(--fat)">${eff.f}</div><div class="sl">Lipides</div></div>
        </div>
        ${t?`<p class="hint" style="margin-top:10px">Métabolisme de base : ${t.bmr} kcal · Maintien : ${t.tdee} kcal · Objectif ${GOAL_LABEL[p.goal]} → ${eff.kcal} kcal</p>`:'<p class="hint" style="margin-top:10px">Objectifs définis manuellement.</p>'}`
        : `<p class="hint">Renseigne âge, taille et poids pour calculer automatiquement tes besoins.</p><button class="btn primary block" style="margin-top:10px" onclick="Profil.edit()">Compléter mon profil</button>`}
      </div>

      ${p.project ? `<div class="macro-hero"><h4 style="font-size:14px;font-weight:700;margin-bottom:6px">🚀 Mon projet</h4><p style="font-size:13px;line-height:1.6;color:var(--muted2);white-space:pre-wrap">${esc(p.project)}</p></div>` : ''}

      <div class="sec-hd" style="margin-top:8px"><div><h2>SUIVI DU <span>POIDS</span></h2><p>${S.weights.length} mesure${S.weights.length>1?'s':''}</p></div>
        <button class="btn sm primary" onclick="Profil.addWeight()">+ Peser</button></div>
      ${this._weightBlock()}`;
  },
  _weightBlock() {
    const w = S.weights.slice().sort((a,b)=>a.date<b.date?-1:1);
    if (!w.length) return '<div class="empty"><p>Aucune pesée.<br>Ajoute ta première mesure pour suivre ta progression.</p></div>';
    const first = w[0].kg, last = w[w.length-1].kg, diff = round(last-first,1);
    return `<div class="macro-hero" style="padding:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div><div style="font-family:'Bebas Neue';font-size:30px;line-height:1">${last} <span style="font-size:15px;color:var(--muted)">kg</span></div><div class="sl" style="font-size:10px;color:var(--muted)">Dernière pesée</div></div>
          <div style="text-align:right"><div style="font-family:'Bebas Neue';font-size:30px;line-height:1;color:${diff<0?'var(--green)':diff>0?'var(--gold)':'var(--muted)'}">${diff>0?'+':''}${diff}</div><div class="sl" style="font-size:10px;color:var(--muted)">Évolution totale</div></div>
        </div>
        ${weightChart(w)}
      </div>
      ${w.slice().reverse().slice(0,12).map(e=>`<div class="food-row" style="border-bottom:1px solid var(--border)"><div class="fi"><div class="fn">${e.kg} kg</div><div class="fq">${fmtDateFull(e.date)}</div></div><button class="iconbtn" style="width:30px;height:30px;color:#FF7B6B" onclick="Profil.delWeight('${e.date}')">✕</button></div>`).join('')}`;
  },
  edit() {
    const p = S.profile;
    Modal.open('Mon profil', `
      <div class="field"><label>Prénom / pseudo</label><input class="input" id="pName" value="${esc(p.name)}"></div>
      <div class="field"><label>Sexe</label><div class="seg" id="pSex">
        <button class="${p.sex==='H'?'on':''}" data-v="H" onclick="setSeg('pSex',this)">Homme</button>
        <button class="${p.sex==='F'?'on':''}" data-v="F" onclick="setSeg('pSex',this)">Femme</button></div></div>
      <div class="row3">
        <div class="field"><label>Âge</label><input class="input" type="number" id="pAge" value="${p.age}" inputmode="numeric"></div>
        <div class="field"><label>Taille cm</label><input class="input" type="number" id="pHt" value="${p.height}" inputmode="numeric"></div>
        <div class="field"><label>Poids kg</label><input class="input" type="number" id="pWt" value="${p.weight}" inputmode="decimal"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Masse grasse %</label><input class="input" type="number" id="pBf" value="${p.bodyfat}" inputmode="decimal" placeholder="optionnel"></div>
        <div class="field"><label>Poids cible kg</label><input class="input" type="number" id="pTw" value="${p.targetWeight}" inputmode="decimal" placeholder="optionnel"></div>
      </div>
      <div class="field"><label>Niveau d'activité</label><select class="select" id="pAct">${opts(Object.entries(ACT_LABEL), p.activity)}</select></div>
      <div class="field"><label>Objectif</label><div class="seg" id="pGoal">
        <button class="${p.goal==='seche'?'on':''}" data-v="seche" onclick="setSeg('pGoal',this)">Sèche</button>
        <button class="${p.goal==='maintien'?'on':''}" data-v="maintien" onclick="setSeg('pGoal',this)">Maintien</button>
        <button class="${p.goal==='masse'?'on':''}" data-v="masse" onclick="setSeg('pGoal',this)">Prise de masse</button></div></div>
      <div class="field"><label>Niveau d'expérience</label><select class="select" id="pExp">${opts([['debut','Débutant'],['inter','Intermédiaire'],['avance','Avancé']], p.experience)}</select></div>
      <div class="field"><label>Mon projet / ma recherche</label><textarea class="textarea" id="pProj" placeholder="Ex : Prendre 5 kg de muscle en 6 mois, focus bras et épaules, préparer l'été…">${esc(p.project||'')}</textarea></div>`,
      `<button class="btn wide ghost" onclick="Modal.close()">Annuler</button><button class="btn wide primary" onclick="Profil.save()">Enregistrer</button>`);
  },
  save() {
    const p = S.profile;
    p.name = val('pName'); p.sex = document.querySelector('#pSex button.on')?.dataset.v || 'H';
    p.age = val('pAge'); p.height = val('pHt'); p.weight = val('pWt'); p.bodyfat = val('pBf'); p.targetWeight = val('pTw');
    p.activity = document.getElementById('pAct').value; p.goal = document.querySelector('#pGoal button.on')?.dataset.v || 'masse';
    p.experience = document.getElementById('pExp').value; p.project = val('pProj');
    save(); Modal.close(); this.render();
    toast(S.nutrition.targets.mode==='auto' ? 'Profil & besoins mis à jour ✓' : 'Profil enregistré ✓');
  },
  editTargets() {
    const t = S.nutrition.targets, ct = calcTargets(S.profile), eff = effectiveTargets();
    Modal.open('Ajuster mes besoins', `
      <div class="field"><label>Mode de calcul</label><div class="seg" id="tMode">
        <button class="${t.mode==='auto'?'on':''}" data-v="auto" onclick="setSeg('tMode',this);Profil._tmode('auto')">Automatique</button>
        <button class="${t.mode==='manual'?'on':''}" data-v="manual" onclick="setSeg('tMode',this);Profil._tmode('manual')">Manuel</button></div>
        <p class="hint">Automatique = calculé depuis ton profil et ton objectif (Mifflin-St Jeor). Manuel = tu fixes tes propres chiffres.</p></div>
      <div id="tManual" style="display:${t.mode==='manual'?'block':'none'}">
        <div class="row2"><div class="field"><label>Calories</label><input class="input" type="number" id="tK" value="${t.mode==='manual'?t.kcal:eff.kcal}"></div>
          <div class="field"><label>Protéines g</label><input class="input" type="number" id="tP" value="${t.mode==='manual'?t.p:eff.p}"></div></div>
        <div class="row2"><div class="field"><label>Glucides g</label><input class="input" type="number" id="tC" value="${t.mode==='manual'?t.c:eff.c}"></div>
          <div class="field"><label>Lipides g</label><input class="input" type="number" id="tF" value="${t.mode==='manual'?t.f:eff.f}"></div></div>
      </div>
      ${ct?`<p class="hint">Suggestion auto : ${ct.kcal} kcal · ${ct.p}P · ${ct.c}G · ${ct.f}L</p>`:''}`,
      `<button class="btn wide ghost" onclick="Modal.close()">Annuler</button><button class="btn wide primary" onclick="Profil.saveTargets()">Enregistrer</button>`);
  },
  _tmode(m){ document.getElementById('tManual').style.display = m==='manual'?'block':'none'; },
  saveTargets() {
    const mode = document.querySelector('#tMode button.on')?.dataset.v || 'auto';
    S.nutrition.targets.mode = mode;
    if (mode==='manual'){ S.nutrition.targets.kcal=+val('tK')||0; S.nutrition.targets.p=+val('tP')||0; S.nutrition.targets.c=+val('tC')||0; S.nutrition.targets.f=+val('tF')||0; }
    save(); Modal.close(); this.render(); toast('Besoins mis à jour ✓');
  },
  addWeight() {
    Modal.open('Nouvelle pesée', `<div class="row2">
        <div class="field"><label>Poids (kg)</label><input class="input" type="number" id="wKg" inputmode="decimal" value="${S.profile.weight||''}" autofocus></div>
        <div class="field"><label>Date</label><input class="input" type="date" id="wDate" value="${todayKey()}"></div></div>`,
      `<button class="btn wide ghost" onclick="Modal.close()">Annuler</button><button class="btn wide primary" onclick="Profil.saveWeight()">Enregistrer</button>`);
  },
  saveWeight() {
    const kg = +val('wKg'); const date = val('wDate') || todayKey();
    if (!kg) { toast('Poids ?'); return; }
    S.weights = S.weights.filter(w=>w.date!==date); S.weights.push({ date, kg });
    // met à jour le poids courant si c'est la mesure la plus récente
    const latest = S.weights.slice().sort((a,b)=>a.date<b.date?-1:1).pop();
    if (latest && latest.date===date) S.profile.weight = String(kg);
    save(); Modal.close(); this.render(); toast('Pesée enregistrée ✓');
  },
  delWeight(date){ S.weights = S.weights.filter(w=>w.date!==date); save(); this.render(); }
};
function bmiCat(b){ return b<18.5?'maigre':b<25?'normal':b<30?'surpoids':'obésité'; }
function weightChart(w) {
  if (w.length < 2) return '<p class="hint" style="text-align:center;padding:20px 0">Ajoute au moins 2 pesées pour voir la courbe.</p>';
  const W=320,H=110,pad=8;
  const kgs=w.map(x=>x.kg), min=Math.min(...kgs), max=Math.max(...kgs), rng=(max-min)||1;
  const pts=w.map((x,i)=>{ const px=pad+(i/(w.length-1))*(W-2*pad); const py=pad+(1-(x.kg-min)/rng)*(H-2*pad); return [px,py]; });
  const line=pts.map((p,i)=>(i?'L':'M')+round(p[0],1)+' '+round(p[1],1)).join(' ');
  const area=line+` L ${round(pts[pts.length-1][0],1)} ${H-pad} L ${pad} ${H-pad} Z`;
  return `<svg class="wchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--red)" stop-opacity=".35"/><stop offset="1" stop-color="var(--red)" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#wg)"/><path d="${line}" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map(p=>`<circle cx="${round(p[0],1)}" cy="${round(p[1],1)}" r="3" fill="var(--red)"/>`).join('')}</svg>`;
}
