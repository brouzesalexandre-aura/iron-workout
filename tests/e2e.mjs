#!/usr/bin/env node
/**
 * Tests de bout en bout : on charge dist/index.html dans Chromium et on
 * vérifie le comportement réel de l'app — navigation, moteur de fatigue,
 * séance guidée, schéma musculaire, migration des anciennes sauvegardes.
 *
 *   npm test
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const URL_APP = 'file://' + resolve(ROOT, 'dist/index.html');

let failures = [];
const check = (cond, label, detail = '') => {
  if (cond) console.log(`  ok   ${label}`);
  else { failures.push(label); console.log(`  ÉCHEC ${label} ${detail}`); }
};

/* En CI, « npx playwright install » fournit le bon binaire. En local, on
   réutilise un Chromium déjà présent plutôt que d'en retélécharger un. */
function localChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  const dir = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
  const bin = dir && resolve(base, dir, 'chrome-linux/chrome');
  return bin && existsSync(bin) ? bin : undefined;
}

const browser = await chromium.launch({ executablePath: localChromium() });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
let errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push(m.text());
});
// les visuels d'exercice viennent de GitHub : inutiles ici, et absents en CI
await page.route('**://raw.githubusercontent.com/**', (r) => r.abort());

console.log('\n== Chargement ==');
await page.goto(URL_APP);
await page.waitForTimeout(1200);
check(errors.length === 0, 'aucune erreur JS au démarrage', errors.slice(0, 3).join(' | '));

console.log('\n== Bibliothèque ==');
check(await page.evaluate('LIB.length') === 215, '215 exercices');
check(!(await page.evaluate('LIB.filter(e => !e.zp || !e.zp.length).length')), 'chaque exercice a une zone primaire');
check(!(await page.evaluate(
  `(() => { const ok = new Set(ZONES.map(z => z.z));
     return LIB.some(e => [...(e.zp||[]), ...(e.zs||[])].some(z => !ok.has(z))); })()`)),
  'aucune zone inconnue');

/* Le visuel vient de free-exercise-db, dont les dossiers sont nommés en anglais
   avec le matériel dedans. Un slug inventé n'affiche rien : on vérifie que les
   corrections manuelles pointent sur des dossiers déjà utilisés ailleurs, et que
   le matériel déclaré ne contredit pas le nom du dossier. */
const img = await page.evaluate(`(() => {
  const known = new Set(LIB.map(e => e.folder));
  const CONTRA = { db:/Barbell|Cable_|Smith_|Kettlebell/, bb:/Dumbbell|Kettlebell/,
                   cable:/Dumbbell|Kettlebell/, bw:/Dumbbell|Barbell|Cable_|Machine/ };
  return {
    fixOk: Object.values(FOLDER_FIX).every(f => known.has(f)),
    contradictions: LIB.filter(e => CONTRA[e.eqt] && CONTRA[e.eqt].test(e.folder)).map(e => e.name),
    sansVisuel: LIB.filter(e => !e.folder).length,
  };
})()`);
check(img.fixOk, 'les images corrigées pointent sur des dossiers connus');
check(img.contradictions.length === 0, 'aucun visuel ne contredit le matériel déclaré',
  img.contradictions.join(', '));
check(img.sansVisuel === 0, 'chaque exercice a un visuel');

console.log('\n== Navigation ==');
for (const tab of ['programme', 'seance', 'charge', 'exercices', 'progression', 'nutrition', 'profil']) {
  errors = [];
  await page.evaluate(`App.go('${tab}')`);
  await page.waitForTimeout(300);
  const len = await page.evaluate(`document.getElementById('v-${tab}').innerHTML.length`);
  check(len > 200 && errors.length === 0, `onglet ${tab}`, errors.slice(0, 2).join(' | '));
}
check(await page.evaluate("document.querySelectorAll('.tabbar .tab').length") === 7, '7 onglets');
check(await page.evaluate("[...document.querySelectorAll('.tabbar .tab')].every(t => !!document.getElementById('v-' + t.dataset.tab))"),
  'chaque onglet a sa vue');

console.log('\n== Schéma corporel ==');
await page.evaluate("App.go('charge')");
await page.waitForTimeout(300);
check(await page.evaluate("document.querySelectorAll('#v-charge .bodysvg').length") === 2, 'vues avant et arrière');
check(await page.evaluate("[...new Set([...document.querySelectorAll('#v-charge .mz')].map(e => e.dataset.z))].length") === 25,
  '25 zones dessinées');
const ids = await page.evaluate(`(() => {
  const d = document.createElement('div');
  d.innerHTML = muscleMap(['pecs'], ['triceps']);
  document.body.appendChild(d);
  const own = new Set([...d.querySelectorAll('clipPath')].map(c => c.id));
  const orphans = [...d.querySelectorAll('path[clip-path]')]
    .map(p => p.getAttribute('clip-path').slice(5, -1)).filter(r => !own.has(r)).length;
  const all = [...document.querySelectorAll('clipPath')].map(c => c.id);
  d.remove();
  return { orphans, unique: new Set(all).size === all.length };
})()`);
check(ids.unique, 'identifiants de découpe uniques');
check(ids.orphans === 0, 'aucune découpe orpheline');

console.log('\n== Moteur de fatigue ==');
await page.evaluate(`(() => {
  const t = Date.now() - 6 * 3600000;
  S.history = [{ id:'t1', date:new Date(t).toISOString(), endDate:new Date(t).toISOString(),
    dayId:'x', dayName:'TEST', done:true, entries:[{ exoId:'e1', k:'bb_bench', name:'Développé couché barre',
      zp:['pecs'], zs:['triceps'], sets:Array.from({length:8},()=>({weight:'60',reps:'10',done:true,d:'dur'})) }] }];
  S.activeSession = null; save();
})()`);
const fat = await page.evaluate('Fatigue.current()');
check(fat.pecs > 0.5, `pectoraux chargés (${fat.pecs.toFixed(2)})`);
check(fat.triceps > 0 && fat.triceps < fat.pecs, 'triceps chargés en secondaire');
check(fat.quads === 0, 'quadriceps intacts');
const decay = await page.evaluate('Fatigue.current(Date.now() + ZMAPZ.pecs.rec * 3600000).pecs');
check(decay < 0.001, 'fatigue nulle après le délai de récupération');

console.log('\n== Paliers de charge ==');
check(await page.evaluate("nextLoad('db_bench', 20, 1)") === 22, 'haltères : pas de 2 kg');
check(await page.evaluate("nextLoad('bb_bench', 60, 1)") === 62.5, 'barre : pas de 2,5 kg');
check(await page.evaluate("nextLoad('leg_press', 100, 1)") === 105, 'machine : pas de 5 kg');
check(await page.evaluate("nextLoad('pushup', 0, 1)") === null, 'poids du corps : progression en répétitions');

console.log('\n== Séance guidée ==');
errors = [];
await page.evaluate("S.history = []; S.activeSession = null; save(); App.go('seance'); Seance.start(0)");
await page.waitForTimeout(400);
check(await page.evaluate("!!document.getElementById('fW') && !!document.getElementById('fR')"),
  'une seule série à l\'écran');
await page.evaluate("Seance.setField(0,0,'weight','60'); Seance.setField(0,0,'reps','5'); Seance.validate(0,0)");
await page.waitForTimeout(250);
check(await page.evaluate("document.getElementById('diffask').classList.contains('show')"), 'le ressenti est demandé');
check(!(await page.evaluate("document.getElementById('timerbar').classList.contains('show')")),
  'le chrono ne démarre pas avant le ressenti');
await page.evaluate("Ask.answer('facile')");
await page.waitForTimeout(300);
check(await page.evaluate("document.getElementById('timerbar').classList.contains('show')"),
  'le chrono démarre après le ressenti');
check(parseFloat(await page.evaluate("S.activeSession.entries[0].sets[1].weight")) === 62.5,
  '« Facile » monte la charge de la série suivante');
await page.evaluate("Seance.validate(0,1); Ask.answer('echec')");
await page.waitForTimeout(200);
check(parseFloat(await page.evaluate("S.activeSession.entries[0].sets[2].weight")) === 60,
  '« Échec » redescend la charge');
check(errors.length === 0, 'aucune erreur JS pendant la séance', errors.slice(0, 3).join(' | '));

console.log('\n== Temps de repos ==');
await page.evaluate('Seance.setRest(0, 120)');
await page.waitForTimeout(200);
check(await page.evaluate('S.activeSession.entries[0].rest') === 120, 'durée appliquée');
check(await page.evaluate(`(() => { const d = S.program.find(x => x.id === S.activeSession.dayId);
  return d.exos.find(x => x.id === S.activeSession.entries[0].exoId).rest; })()`) === 120,
  'durée mémorisée dans le programme');

console.log('\n== Muscles d\'un exercice ==');
const zones = await page.evaluate(`(() => ({
  parNom: Muscles.zonesOf({ name: 'Développé couché barre' }).zp,
  parCategorie: Muscles.zonesOf({ name: 'Inventé', cat: 'Dos' }).zp,
  inconnu: Muscles.zonesOf({ name: 'Totalement inconnu' }).zp,
}))()`);
check(zones.parNom.includes('pecs'), 'résolution par le nom de l\'exercice');
check(zones.parCategorie.includes('lats'), 'repli sur le groupe musculaire');
check(zones.inconnu.length === 0, 'aucune zone inventée');

console.log('\n== Progression ==');
/* quatre semaines de développé couché en progression, plus des pompes au poids du corps */
await page.evaluate(`(() => {
  const day = 86400000, now = Date.now();
  const bench = [[60,10],[62.5,10],[62.5,11],[65,10]];
  S.history = bench.map((wr, i) => ({
    id: 'h' + i, date: new Date(now - (21 - i * 7) * day).toISOString(), done: true,
    dayId: 'd1', dayName: 'PUSH',
    entries: [
      { exoId: 'e1', k: 'bb_bench', name: 'Développé couché barre',
        sets: Array.from({length: 3}, () => ({ weight: String(wr[0]), reps: String(wr[1]), done: true })) },
      { exoId: 'e2', k: 'pushup', name: 'Pompes',
        sets: [{ weight: '0', reps: String(20 + i * 2), done: true }] },
    ],
  }));
  S.activeSession = null; save();
})()`);
const idx = await page.evaluate('Progress.index().map(e => ({key:e.key, mode:e.mode, n:e.sessions.length, gain:e.gain, prs:e.sessions.filter(s=>s.pr).length}))');
const bench = idx.find(e => e.key === 'bb_bench');
const push = idx.find(e => e.key === 'pushup');
check(idx.length === 2, 'deux exercices suivis');
check(bench && bench.n === 4, 'quatre séances de développé couché');
check(bench && bench.mode === 'load', 'exercice chargé : progression en kilos');
check(push && push.mode === 'reps', 'poids du corps : progression en répétitions');
check(bench && bench.gain > 0, `le 1RM estimé progresse (+${bench ? bench.gain.toFixed(1) : '?'} kg)`);
check(bench && bench.prs === 3, 'chaque séance bat la précédente, la première exceptée');
check(await page.evaluate("round(e1RM(100, 10))") === 133, '1RM estimé : 100 kg × 10 → 133 kg');
check(await page.evaluate("e1RM(0, 10)") === 0, 'pas de 1RM au poids du corps');
check(await page.evaluate("Progress.recentPRs(Progress.index()).filter(x => x.e.key === 'bb_bench').length") === 3,
  'la toute première séance ne compte pas comme record');
check(await page.evaluate("Progress.recentPRs(Progress.index(), 10).filter(x => x.e.key === 'bb_bench').length") === 2,
  'les records hors fenêtre sont écartés');
errors = [];
await page.evaluate("App.go('progression')");
await page.waitForTimeout(300);
const pg = await page.evaluate(`(() => ({
  rows: document.querySelectorAll('#v-progression .pgrow').length,
  spark: document.querySelectorAll('#v-progression .pgspark svg').length,
  pr: document.querySelectorAll('#v-progression .prow').length,
}))()`);
check(pg.rows === 2, 'une ligne par exercice');
check(pg.spark === 2, 'courbe miniature sur chaque ligne');
check(pg.pr === 2, 'un seul record affiché par exercice');
check(await page.evaluate('Progress.latestPRs(Progress.index()).length') === 2,
  'les records répétés sur un même exercice sont dédupliqués');
await page.evaluate("Progress.open('bb_bench')");
await page.waitForTimeout(250);
check(await page.evaluate("document.querySelectorAll('#sheet .pgchart path[stroke]').length") >= 2,
  'la fiche trace le 1RM et la charge max');
check(await page.evaluate("document.querySelectorAll('#sheet .recrow').length") > 4, 'records et historique listés');
await page.evaluate('Modal.close()');
check(errors.length === 0, 'aucune erreur JS sur la progression', errors.slice(0, 3).join(' | '));

console.log('\n== Conseils nutrition ==');
await page.evaluate(`(() => {
  S.profile.weight = '76'; S.profile.height = '171'; S.profile.age = '30'; S.profile.goal = 'masse';
  S.nutrition.targets = { mode:'manual', kcal:2900, p:150, c:380, f:70 };
  S.nutrition.log = {}; save();
})()`);
check(await page.evaluate("NutriTips.dayTips(todayKey()).length") === 0, 'journée vide : aucun conseil');
await page.evaluate(`(() => {
  const d = todayKey();
  S.nutrition.log[d] = [
    { id:'a', meal:'dej', type:'food', ref:'f_riz', qty:200, label:'Riz', kcal:260, p:5, c:56, f:1 },
    { id:'b', meal:'dej', type:'food', ref:'f_oeuf', qty:200, label:'Œufs', kcal:286, p:26, c:2, f:19 },
  ];
  save();
})()`);
const tips = await page.evaluate("NutriTips.dayTips(todayKey()).map(t => t.t + '|' + t.lvl)");
check(tips.some(t => /protéines en moins/.test(t)), 'manque de protéines détecté');
check(tips.some(t => /kcal/.test(t)), 'écart calorique signalé');
check(tips.some(t => /légume|fruit/i.test(t)), 'absence de légume et de fruit signalée');
check(await page.evaluate("NutriTips.dayTips(todayKey()).some(t => /g de blanc de poulet|g de fromage blanc|g d'œuf/.test(t.d))"),
  'le manque est traduit en aliments réels');
errors = [];
await page.evaluate("App.go('nutrition'); Nutri.date = todayKey(); Nutri.render()");
await page.waitForTimeout(300);
check(await page.evaluate("document.querySelectorAll('#v-nutrition .tipcard .tiprow').length") > 0,
  'encart de conseils affiché dans le journal');
/* tendance de poids : trois pesées plates alors que l'objectif est de prendre */
await page.evaluate(`(() => {
  const day = 86400000, now = Date.now();
  S.weights = [26, 14, 2].map(d => ({ date: todayKey(new Date(now - d * day)), kg: 76 + (d === 2 ? 0.1 : 0) }));
  save();
})()`);
const wk = await page.evaluate('NutriTips.weekTips().map(t => t.t)');
check(wk.some(t => /poids ne monte pas/i.test(t)), 'stagnation du poids détectée en prise de masse');
await page.evaluate("S.profile.goal = 'seche'; save()");
check(await page.evaluate("NutriTips.weekTips().some(t => /poids ne descend pas/i.test(t.t))"),
  'stagnation du poids détectée en sèche');
await page.evaluate("S.profile.goal = 'masse'; S.weights = []; save()");
check(await page.evaluate("NutriTips.weekTips().some(t => /pesées/i.test(t.t))"),
  'sans pesée, l\'app le dit au lieu de conclure');

await page.evaluate("NutriTips.panel(todayKey())");
await page.waitForTimeout(250);
check(await page.evaluate("/diététicien/.test(document.getElementById('sheet').textContent)"),
  'le panneau rappelle ses limites');
await page.evaluate('Modal.close()');
check(errors.length === 0, 'aucune erreur JS sur les conseils', errors.slice(0, 3).join(' | '));

console.log('\n== Mise à jour ==');
check(await page.evaluate("cmpVersion('2.7.0', '2.6.0')") === 1, 'comparaison de versions');
check(await page.evaluate("cmpVersion('2.6.0', '2.6.0')") === 0, 'versions égales');
check(await page.evaluate("cmpVersion('2.10.0', '2.9.0')") === 1, 'comparaison numérique, pas alphabétique');
check(await page.evaluate("typeof Update.check === 'function' && typeof Media.addFile === 'function'"),
  'modules mise à jour et médias chargés');

console.log('\n== Migration d\'une sauvegarde ancienne ==');
/* Une mise à jour installe un nouveau code par-dessus les mêmes données : ce que
   migrate() reçoit ici est exactement ce que l'app retrouvera après l'update. */
await page.evaluate(`(() => {
  const st = defaultState(); delete st.recovery; st.v = 2;
  st.history = [{ id:'h1', date:new Date().toISOString(), dayId:st.program[0].id, dayName:'ANCIEN', done:true,
    entries:[{ exoId: st.program[0].exos[0].id, name:'x', sets:[{weight:'40',reps:'10',done:true}] }] }];
  st.program[0].name = 'MON JOUR À MOI';
  st.customExos = [{ id:'c1', name:'Mon exo', cat:'Pectoraux', zp:['pecs'], zs:[], photos:[] }];
  st.weights = [{ d:'2026-01-01', w:75 }];
  st.nutrition.log = { '2026-01-01': [{ n:'Riz', kcal:350, p:7, c:78, f:1 }] };
  st.profile.height = '171';
  localStorage.setItem('iron_state_v2', JSON.stringify(st));
})()`);
errors = [];
await page.reload();
await page.waitForTimeout(1200);
check(errors.length === 0, 'rechargement sans erreur', errors.slice(0, 3).join(' | '));
check(await page.evaluate('S.v') === 3, 'état migré');
check(await page.evaluate('S.history.length') === 1, 'historique préservé');
check(await page.evaluate('!!S.history[0].entries[0].k'), 'clé d\'exercice retrouvée');
check(await page.evaluate("S.program[0].name") === 'MON JOUR À MOI', 'programme personnalisé préservé');
check(await page.evaluate('S.customExos.length') === 1, 'exercices personnels préservés');
check(await page.evaluate('S.weights.length') === 1, 'suivi du poids préservé');
check(await page.evaluate("Object.keys(S.nutrition.log).length") === 1, 'journal nutrition préservé');
check(await page.evaluate("S.profile.height") === '171', 'profil préservé');

await browser.close();

console.log('\n' + '='.repeat(46));
if (failures.length) {
  console.log(`${failures.length} test(s) en échec :`);
  failures.forEach((f) => console.log('  -', f));
  process.exit(1);
}
console.log('TOUS LES TESTS PASSENT');
