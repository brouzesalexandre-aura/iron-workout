/* ---------- Zones + type de matériel des exercices d'origine ---------- */
const ZMAP = {
  db_bench:{eqt:"db",zp:["pecs"],zs:["triceps", "delt_ant", "pecs_up"],mp:["Pectoraux"],ms:["Triceps", "Deltoïde antérieur", "Pectoraux supérieurs"]},
  incline_db:{eqt:"db",zp:["pecs_up"],zs:["delt_ant", "triceps", "pecs"],mp:["Pectoraux supérieurs"],ms:["Deltoïde antérieur", "Triceps", "Pectoraux"]},
  cable_fly:{eqt:"cable",zp:["pecs"],zs:["delt_ant", "pecs_up"],mp:["Pectoraux"],ms:["Deltoïde antérieur", "Pectoraux supérieurs"]},
  bb_bench:{eqt:"bb",zp:["pecs"],zs:["triceps", "delt_ant", "pecs_up"],mp:["Pectoraux"],ms:["Triceps", "Deltoïde antérieur", "Pectoraux supérieurs"]},
  pec_deck:{eqt:"machine",zp:["pecs"],zs:["delt_ant", "pecs_up"],mp:["Pectoraux"],ms:["Deltoïde antérieur", "Pectoraux supérieurs"]},
  pushup:{eqt:"bw",zp:["pecs"],zs:["triceps", "delt_ant", "abs_up", "abs_low", "pecs_up"],mp:["Pectoraux"],ms:["Triceps", "Deltoïde antérieur", "Abdominaux supérieurs", "Abdominaux inférieurs", "Pectoraux supérieurs"]},
  lat_wide:{eqt:"cable",zp:["lats"],zs:["biceps", "midback"],mp:["Grand dorsal"],ms:["Biceps", "Rhomboïdes / trapèze moyen"]},
  lat_close:{eqt:"cable",zp:["lats"],zs:["biceps", "midback"],mp:["Grand dorsal"],ms:["Biceps", "Rhomboïdes / trapèze moyen"]},
  seated_row:{eqt:"cable",zp:["midback", "lats"],zs:["biceps", "traps"],mp:["Rhomboïdes / trapèze moyen", "Grand dorsal"],ms:["Biceps", "Trapèzes"]},
  db_row:{eqt:"db",zp:["lats", "midback"],zs:["biceps", "delt_post"],mp:["Grand dorsal", "Rhomboïdes / trapèze moyen"],ms:["Biceps", "Deltoïde postérieur"]},
  row_high:{eqt:"cable",zp:["midback", "traps"],zs:["lats", "delt_post"],mp:["Rhomboïdes / trapèze moyen", "Trapèzes"],ms:["Grand dorsal", "Deltoïde postérieur"]},
  straight_arm:{eqt:"cable",zp:["lats"],zs:["triceps", "pecs"],mp:["Grand dorsal"],ms:["Triceps", "Pectoraux"]},
  pullup:{eqt:"bw",zp:["lats"],zs:["biceps", "midback", "forearms"],mp:["Grand dorsal"],ms:["Biceps", "Rhomboïdes / trapèze moyen", "Avant-bras"]},
  deadlift:{eqt:"bb",zp:["lowback", "glutes"],zs:["lats", "hams", "traps", "forearms"],mp:["Lombaires", "Fessiers"],ms:["Grand dorsal", "Ischio-jambiers", "Trapèzes", "Avant-bras"]},
  hyperext:{eqt:"bw",zp:["lowback"],zs:["glutes", "hams"],mp:["Lombaires"],ms:["Fessiers", "Ischio-jambiers"]},
  lat_raise:{eqt:"db",zp:["delt_lat"],zs:["delt_ant", "traps"],mp:["Deltoïde latéral"],ms:["Deltoïde antérieur", "Trapèzes"]},
  sh_press:{eqt:"db",zp:["delt_ant", "delt_lat"],zs:["triceps", "traps"],mp:["Deltoïde antérieur", "Deltoïde latéral"],ms:["Triceps", "Trapèzes"]},
  front_raise:{eqt:"db",zp:["delt_ant"],zs:["pecs", "traps"],mp:["Deltoïde antérieur"],ms:["Pectoraux", "Trapèzes"]},
  rear_delt:{eqt:"cable",zp:["delt_post"],zs:["midback", "traps"],mp:["Deltoïde postérieur"],ms:["Rhomboïdes / trapèze moyen", "Trapèzes"]},
  face_pull:{eqt:"cable",zp:["delt_post", "traps"],zs:["midback"],mp:["Deltoïde postérieur", "Trapèzes"],ms:["Rhomboïdes / trapèze moyen"]},
  ext_rot:{eqt:"db",zp:["delt_post"],zs:[],mp:["Deltoïde postérieur"],ms:[]},
  shrug:{eqt:"bb",zp:["traps"],zs:["forearms"],mp:["Trapèzes"],ms:["Avant-bras"]},
  ohp_bb:{eqt:"bb",zp:["delt_ant", "delt_lat"],zs:["triceps", "abs_up", "abs_low"],mp:["Deltoïde antérieur", "Deltoïde latéral"],ms:["Triceps", "Abdominaux supérieurs", "Abdominaux inférieurs"]},
  ez_curl:{eqt:"ez",zp:["biceps"],zs:["forearms"],mp:["Biceps"],ms:["Avant-bras"]},
  conc_curl:{eqt:"db",zp:["biceps"],zs:["forearms"],mp:["Biceps"],ms:["Avant-bras"]},
  cable_curl:{eqt:"cable",zp:["biceps"],zs:["forearms"],mp:["Biceps"],ms:["Avant-bras"]},
  hammer:{eqt:"db",zp:["biceps", "forearms"],zs:[],mp:["Biceps", "Avant-bras"],ms:[]},
  preacher:{eqt:"ez",zp:["biceps"],zs:["forearms"],mp:["Biceps"],ms:["Avant-bras"]},
  cgbp:{eqt:"bb",zp:["triceps"],zs:["pecs", "delt_ant"],mp:["Triceps"],ms:["Pectoraux", "Deltoïde antérieur"]},
  pushdown:{eqt:"cable",zp:["triceps"],zs:[],mp:["Triceps"],ms:[]},
  skull:{eqt:"ez",zp:["triceps"],zs:[],mp:["Triceps"],ms:[]},
  oh_ext:{eqt:"cable",zp:["triceps"],zs:[],mp:["Triceps"],ms:[]},
  bench_dip:{eqt:"bw",zp:["triceps"],zs:["delt_ant", "pecs"],mp:["Triceps"],ms:["Deltoïde antérieur", "Pectoraux"]},
  squat:{eqt:"bb",zp:["quads", "glutes"],zs:["hams", "lowback", "abs_up", "abs_low", "quads_med"],mp:["Quadriceps", "Fessiers"],ms:["Ischio-jambiers", "Lombaires", "Abdominaux supérieurs", "Abdominaux inférieurs", "Vaste interne"]},
  leg_press:{eqt:"machine",zp:["quads"],zs:["glutes", "hams", "quads_med"],mp:["Quadriceps"],ms:["Fessiers", "Ischio-jambiers", "Vaste interne"]},
  leg_ext:{eqt:"machine",zp:["quads", "quads_med"],zs:[],mp:["Quadriceps", "Vaste interne"],ms:[]},
  rdl:{eqt:"db",zp:["hams", "glutes"],zs:["lowback"],mp:["Ischio-jambiers", "Fessiers"],ms:["Lombaires"]},
  leg_curl:{eqt:"machine",zp:["hams"],zs:["calves"],mp:["Ischio-jambiers"],ms:["Mollets (jumeaux)"]},
  lunge:{eqt:"db",zp:["quads", "glutes"],zs:["hams", "adductors", "quads_med"],mp:["Quadriceps", "Fessiers"],ms:["Ischio-jambiers", "Adducteurs", "Vaste interne"]},
  hip_thrust:{eqt:"bb",zp:["glutes"],zs:["hams", "adductors"],mp:["Fessiers"],ms:["Ischio-jambiers", "Adducteurs"]},
  calf:{eqt:"machine",zp:["calves"],zs:["soleus"],mp:["Mollets (jumeaux)"],ms:["Soléaire"]},
  calf_seated:{eqt:"machine",zp:["soleus"],zs:["calves"],mp:["Soléaire"],ms:["Mollets (jumeaux)"]},
  wrist_curl:{eqt:"db",zp:["forearms"],zs:[],mp:["Avant-bras"],ms:[]},
  reverse_curl:{eqt:"ez",zp:["forearms"],zs:["biceps"],mp:["Avant-bras"],ms:["Biceps"]},
  plank:{eqt:"bw",zp:["abs_up", "abs_low"],zs:["obliques", "lowback"],mp:["Abdominaux supérieurs", "Abdominaux inférieurs"],ms:["Obliques / grand dentelé", "Lombaires"]},
  cable_crunch:{eqt:"cable",zp:["abs_up"],zs:["obliques", "abs_low"],mp:["Abdominaux supérieurs"],ms:["Obliques / grand dentelé", "Abdominaux inférieurs"]},
  crunch:{eqt:"bw",zp:["abs_up"],zs:["obliques", "abs_low"],mp:["Abdominaux supérieurs"],ms:["Obliques / grand dentelé", "Abdominaux inférieurs"]},
  leg_raise:{eqt:"bw",zp:["abs_low"],zs:["obliques", "quads", "abs_up", "quads_med"],mp:["Abdominaux inférieurs"],ms:["Obliques / grand dentelé", "Quadriceps", "Abdominaux supérieurs", "Vaste interne"]},
};
/* Visuels d'origine qui ne montraient pas le bon mouvement. Ne mettre ici que
   des dossiers free-exercise-db déjà utilisés ailleurs dans la bibliothèque :
   un slug inventé ne casse pas le build, il affiche juste un cadre vide. */
const FOLDER_FIX = {
  lat_wide:   'Wide-Grip_Lat_Pulldown',
  pushdown:   'Triceps_Pushdown_-_Rope_Attachment',
  db_row:     'Bent_Over_Two-Dumbbell_Row',
  row_high:   'Kneeling_High_Pulley_Row',
  cable_fly:  'Cable_Crossover',            // montrait un écarté haltère sur banc
  lat_raise:  'Seated_Side_Lateral_Raise',  // montrait une poulie, pas des haltères
  calf:       'Standing_Calf_Raises',
};

/* Fusionne : corrige les images, applique zones + matériel, puis concatène */
LIB.forEach(e => {
  if (FOLDER_FIX[e.k]) e.folder = FOLDER_FIX[e.k];
  const z = ZMAP[e.k];
  if (z) { e.eqt = z.eqt; e.zp = z.zp.slice(); e.zs = z.zs.slice(); e.mp = z.mp.slice(); e.ms = z.ms.slice(); }
  else { e.eqt = e.eqt || 'other'; e.zp = e.zp || []; e.zs = e.zs || []; }
});
LIB2.forEach(e => LIB.push(e));

const LIBMAP = Object.fromEntries(LIB.map(e => [e.k, e]));
// Construit un exercice complet à partir d'une clé LIB + surcharges (séries/reps/repos)
function exoFrom(k, ov = {}) {
  const b = LIBMAP[k]; if (!b) return null;
  return { id: uid(), k, name: b.name, eq: b.eq, cat: b.cat, folder: b.folder, mp: [...b.mp], ms: [...b.ms],
    eqt: b.eqt, zp: [...(b.zp||[])], zs: [...(b.zs||[])],
    tip: b.tip, sets: ov.sets ?? b.ds, reps: ov.reps ?? b.dr, rest: ov.rest ?? b.drest, load: ov.load ?? '', photos: [], note: '' };
}

/* ---------- Programme 5 jours de départ (le tien) ---------- */
const SEED_DAYS = [
  {name:'PECTORAUX + DORSAUX', sub:'Push/Pull haut du corps — Super-set recommandé', pr:1, ex:[
    ['db_bench',{sets:4,reps:'10–12',rest:90}],['incline_db',{sets:4,reps:'10–12',rest:90}],['cable_fly',{sets:3,reps:'12',rest:75}],
    ['lat_wide',{sets:4,reps:'10–12',rest:90}],['seated_row',{sets:4,reps:'12',rest:90}],['db_row',{sets:3,reps:'12',rest:75}],['face_pull',{sets:3,reps:'15',rest:60}] ]},
  {name:'BICEPS + TRICEPS', sub:'Bras complet — Priorité absolue du programme', pr:1, ex:[
    ['ez_curl',{sets:4,reps:'10–12',rest:75}],['conc_curl',{sets:3,reps:'12/côté',rest:60}],['cable_curl',{sets:3,reps:'12',rest:60}],
    ['cgbp',{sets:4,reps:'10–12',rest:90}],['pushdown',{sets:4,reps:'12',rest:75}],['skull',{sets:3,reps:'12',rest:75}],['oh_ext',{sets:3,reps:'12',rest:60}] ]},
  {name:'JAMBES + FESSIERS + MOLLETS', sub:'Focus quadriceps et grand fessier', pr:2, ex:[
    ['squat',{sets:4,reps:'10–12',rest:120}],['leg_press',{sets:4,reps:'12',rest:90}],['leg_ext',{sets:3,reps:'12',rest:75}],
    ['rdl',{sets:3,reps:'12',rest:75}],['hip_thrust',{sets:4,reps:'12',rest:90}],['leg_curl',{sets:3,reps:'12',rest:75}],['calf',{sets:4,reps:'15',rest:60}] ]},
  {name:'ÉPAULES + TRAPÈZES + ABDOS', sub:'Deltoïdes 3 chefs — Coiffe des rotateurs incluse', pr:1, ex:[
    ['lat_raise',{sets:4,reps:'12',rest:60}],['sh_press',{sets:4,reps:'10–12',rest:90}],['front_raise',{sets:3,reps:'12',rest:60}],
    ['rear_delt',{sets:3,reps:'12',rest:75}],['shrug',{sets:4,reps:'12–15',rest:60}],['ext_rot',{sets:3,reps:'15',rest:45}],['plank',{sets:3,reps:'45 sec',rest:45}] ]},
  {name:'DORSAUX VOL. + AVANT-BRAS + ABDOS', sub:'Dos complet — Focus muscles entre les omoplates', pr:2, ex:[
    ['lat_close',{sets:4,reps:'10–12',rest:90}],['row_high',{sets:4,reps:'12',rest:90}],['straight_arm',{sets:3,reps:'12',rest:75}],
    ['wrist_curl',{sets:3,reps:'15',rest:45}],['reverse_curl',{sets:3,reps:'12',rest:60}],['hyperext',{sets:3,reps:'15',rest:60}],['cable_crunch',{sets:3,reps:'15',rest:45}] ]},
];
function buildSeedProgram() { return buildProgV3(); }
function buildSeedProgramLegacy() {
  return SEED_DAYS.map((d, i) => ({ id: uid(), name: d.name, sub: d.sub, pr: d.pr,
    exos: d.ex.map(([k, ov]) => exoFrom(k, ov)) }));
}
