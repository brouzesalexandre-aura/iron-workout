/* ---------- Templates de jours (prêts à importer) ---------- */
const DAY_TEMPLATES = [
  {name:'PUSH — Pecto/Épaules/Triceps', pr:1, keys:['bb_bench','incline_db','sh_press','lat_raise','cgbp','pushdown']},
  {name:'PULL — Dos/Biceps', pr:1, keys:['pullup','seated_row','db_row','rear_delt','ez_curl','hammer']},
  {name:'LEGS — Jambes complètes', pr:1, keys:['squat','leg_press','rdl','leg_curl','hip_thrust','calf']},
  {name:'UPPER — Haut du corps', pr:1, keys:['bb_bench','lat_wide','sh_press','seated_row','ez_curl','pushdown']},
  {name:'LOWER — Bas du corps', pr:2, keys:['squat','rdl','leg_press','leg_curl','calf','plank']},
  {name:'FULL BODY', pr:1, keys:['squat','bb_bench','lat_wide','sh_press','ez_curl','cable_crunch']},
  {name:'BRAS (Biceps + Triceps)', pr:2, keys:['ez_curl','cgbp','conc_curl','skull','cable_curl','oh_ext']},
  {name:'ABDOS + GAINAGE', pr:3, keys:['cable_crunch','leg_raise','plank','crunch']},
];
function templateToDay(t) {
  return { id: uid(), name: t.name, sub: 'Template importé', pr: t.pr, exos: t.keys.map(k => exoFrom(k)).filter(Boolean) };
}
