/* ============================================================
   ROUTEUR & FAB
   ============================================================ */
const TABMETA = {
  programme:   { title:'PROGRAMME', fab:true },
  seance:      { title:'SÉANCE', fab:false },
  charge:      { title:'CHARGE', fab:false },
  exercices:   { title:'EXERCICES', fab:true },
  progression: { title:'PROGRESSION', fab:false },
  nutrition:   { title:'NUTRITION', fab:true },
  profil:      { title:'PROFIL', fab:false }
};
const App = {
  tab: 'programme',
  go(tab) {
    this.tab = tab;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('v-' + tab).classList.add('active');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const m = TABMETA[tab];
    document.getElementById('barTitle').textContent = m.title;
    const fab = document.getElementById('fab');
    fab.style.display = m.fab ? 'flex' : 'none';
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
    window.scrollTo({ top: 0 });
    this.render(tab);
  },
  render(tab) {
    ({ programme: Prog, seance: Seance, charge: Charge, exercices: Exos,
       progression: Progress, nutrition: Nutri, profil: Profil }[tab]).render();
  },
  fab() {
    if (this.tab === 'programme') Prog.addExoToDay(CUR);
    else if (this.tab === 'exercices') Exos.editCustom(null);
    else if (this.tab === 'nutrition') Nutri.pickMealToAdd();
  },
  menu() {
    const s = S.settings;
    Modal.open('Réglages & données', `
      <div class="field"><label>Version</label>
        <p class="hint">IRON <b style="color:var(--text)">${APP_VERSION}</b> · ${LIB.length} exercices · ${ZONES.length} zones musculaires</p></div>
      <div class="divider"></div>
      <div class="field"><label>Installer l'app</label>
        <p class="hint">Sur Android/Chrome : menu ⋮ → « Ajouter à l'écran d'accueil » pour l'ouvrir comme une vraie app, en plein écran et hors-ligne.</p></div>
      <div class="divider"></div>
      <div class="field"><label>Mise à jour</label>
        <button class="btn sm block" onclick="Update.panel()">⟳ Vérifier les mises à jour</button>
        <p class="hint">IRON se met à jour depuis les releases GitHub du projet. Tes données ne sont jamais effacées par une mise à jour.</p>
      </div>
      <div class="divider"></div>
      <div class="field"><label>Programme</label>
        <button class="btn sm block" onclick="loadProgV3()">↻ Charger le programme force / volume (5 jours)</button>
        <p class="hint">Lundi push force · mardi bas du corps · mercredi pull force · jeudi push volume · dimanche pull volume. Remplace les 5 jours, garde l'historique.</p>
      </div>
      <div class="divider"></div>
      <div class="field"><label>Sauvegarde</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn sm" onclick="App.exportData()">⬇ Exporter (JSON)</button>
          <button class="btn sm" onclick="document.getElementById('importFile').click()">⬆ Importer</button>
        </div>
        <p class="hint">Exporte toutes tes données (programme, séances, nutrition, poids) dans un fichier que tu peux garder ou transférer.</p>
        <input type="file" id="importFile" accept="application/json" style="display:none" onchange="App.importData(this.files[0])">
      </div>
      <div class="divider"></div>
      <div class="field"><label>Zone de danger</label>
        <button class="btn sm danger block" onclick="App.reset()">↺ Réinitialiser aux valeurs d'usine</button>
        <p class="hint">Efface tout et recharge le programme de départ. Irréversible.</p>
      </div>
      <div class="divider"></div>
      <p class="hint" style="text-align:center">IRON · app perso de musculation & nutrition<br>Images d'exercices : free-exercise-db (domaine public)</p>
    `, '');
  },
  exportData() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'iron-sauvegarde-' + todayKey() + '.json'; a.click();
    toast('Sauvegarde exportée');
  },
  importData(file) {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => { try { const d = JSON.parse(fr.result); if (!d.program) throw 0; S = d; save(); Modal.close(); App.go(App.tab); toast('Données importées ✓'); } catch (e) { toast('Fichier invalide'); } };
    fr.readAsText(file);
  },
  reset() {
    Modal.confirm('Tout réinitialiser ?', 'Cela efface ton programme, tes séances et ta nutrition, et recharge le programme de départ.', () => {
      S = defaultState(); CUR = 0; save(); Modal.close(); App.go('programme'); toast('Réinitialisé');
    }, 'Réinitialiser');
  }
};
