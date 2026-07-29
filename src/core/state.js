/* ============================================================
   CORE — état global, routeur, modales, helpers UI & calculs
   ============================================================ */
let S = null;               // état global
let CUR = 0;                // index du jour actif (Programme)

function defaultState() {
  return {
    v: 2,
    profile: { name:'', sex:'H', age:'', height:'', weight:'', bodyfat:'', activity:'modere', goal:'masse', targetWeight:'', project:'', experience:'inter' },
    settings: { daysPerWeek: 5, units:'kg' },
    program: buildSeedProgram(),
    customExos: [],
    nutrition: {
      targets: { mode:'auto', kcal:2200, p:150, c:230, f:70 },
      foods: [],
      recipes: clone(RECIPES_SEED),
      plans: clone(MEALPLANS_SEED),
      log: {}
    },
    history: [],
    weights: [],
    recovery: {}
  };
}
function save() { Store.save(S); }

/* ---- toast ---- */
let _toastT;
function toast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(_toastT); _toastT = setTimeout(() => t.classList.remove('show'), 2200);
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* ---- placeholder image ---- */
function imgErr(img) {
  img.onerror = null;
  const d = document.createElement('div'); d.className = 'ph';
  d.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6"/></svg>';
  img.replaceWith(d);
}
function exoImg(exo, big) {
  const k = (exo.photos || [])[0];
  if (k && MediaCache[k]) return Media.tag(k, big);
  if (k && PhotoCache[k]) return `<img src="${PhotoCache[k]}" alt="" loading="lazy">`;
  if (exo.folder)
    return `<img src="${IMG(exo.folder, 0)}" onerror="imgErr(this)" alt="" loading="lazy">`;
  return '<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6"/></svg></div>';
}
function allPhotoKeys() {
  const ks = [];
  (S.program || []).forEach(d => d.exos.forEach(e => (e.photos || []).forEach(k => ks.push(k))));
  (S.customExos || []).forEach(e => (e.photos || []).forEach(k => ks.push(k)));
  return ks;
}

/* ---- macros ---- */
function foodById(id) { return FOODMAP[id] || (S.nutrition.foods || []).find(f => f.id === id); }
function recipeById(id) { return (S.nutrition.recipes || []).find(r => r.id === id); }
function macrosForFood(food, grams) { const r = grams / 100; return { kcal: food.kcal*r, p: food.p*r, c: food.c*r, f: food.f*r }; }
function recipeMacros(recipe) {
  let t = { kcal:0, p:0, c:0, f:0 };
  (recipe.ing || []).forEach(([fid, g]) => { const f = foodById(fid); if (f) { const m = macrosForFood(f, g); t.kcal+=m.kcal; t.p+=m.p; t.c+=m.c; t.f+=m.f; } });
  const s = recipe.serv || 1; return { kcal: t.kcal/s, p: t.p/s, c: t.c/s, f: t.f/s };
}
function sumMacros(items) { return (items || []).reduce((a, it) => ({ kcal:a.kcal+it.kcal, p:a.p+it.p, c:a.c+it.c, f:a.f+it.f }), { kcal:0, p:0, c:0, f:0 }); }

/* ---- objectifs caloriques (Mifflin-St Jeor) ---- */
const ACT_FACTOR = { sedentaire:1.2, leger:1.375, modere:1.55, actif:1.725, intense:1.9 };
const ACT_LABEL = { sedentaire:'Sédentaire', leger:'Léger (1-2×/sem)', modere:'Modéré (3-4×/sem)', actif:'Actif (5-6×/sem)', intense:'Très intense (2×/jour)' };
const GOAL_LABEL = { seche:'Sèche', maintien:'Maintien', masse:'Prise de masse' };
function calcTargets(p) {
  if (!p || !p.weight || !p.height || !p.age) return null;
  const kg = +p.weight, cm = +p.height, age = +p.age;
  const bmr = 10*kg + 6.25*cm - 5*age + (p.sex === 'F' ? -161 : 5);
  const tdee = bmr * (ACT_FACTOR[p.activity] || 1.55);
  let kcal, pg;
  if (p.goal === 'seche') { kcal = tdee*0.80; pg = 2.2; }
  else if (p.goal === 'masse') { kcal = tdee*1.12; pg = 1.9; }
  else { kcal = tdee; pg = 2.0; }
  const protein = pg*kg, fat = 0.9*kg;
  const carbs = Math.max(0, (kcal - (protein*4 + fat*9)) / 4);
  return { bmr:Math.round(bmr), tdee:Math.round(tdee), kcal:Math.round(kcal), p:Math.round(protein), c:Math.round(carbs), f:Math.round(fat) };
}
function effectiveTargets() {
  const t = S.nutrition.targets;
  if (t.mode === 'manual') return { kcal:+t.kcal||0, p:+t.p||0, c:+t.c||0, f:+t.f||0 };
  const ct = calcTargets(S.profile);
  return ct ? { kcal:ct.kcal, p:ct.p, c:ct.c, f:ct.f } : { kcal:+t.kcal||2200, p:+t.p||150, c:+t.c||230, f:+t.f||70 };
}
