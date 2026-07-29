/* ============================================================
   PROGRAMME 5 JOURS — ondulatoire force / volume
   Contrainte : 72 h minimum entre deux sollicitations d'un muscle.
   Jours d'entraînement : lundi, mardi, mercredi, jeudi, dimanche.
   Seules paires valides à 3 j d'écart : lundi+jeudi et mercredi+dimanche.
   Le mardi reste isolé -> il porte le bas du corps, travaillé 1×/semaine.
   ============================================================ */
const PROG_V3 = [
  { name:'LUNDI · PUSH FORCE', sub:'Pectoraux, épaules, triceps — lourd 4-6 reps · mollets · abdos', pr:1, ex:[
    ['bb_bench',      {sets:5, reps:'5',        rest:180}],
    ['bb_incline',    {sets:4, reps:'6',        rest:150}],
    ['seated_bb_ohp', {sets:4, reps:'6',        rest:150}],
    ['cgbp',          {sets:4, reps:'6–8',      rest:120}],
    ['ez_skull',      {sets:3, reps:'8',        rest:90}],
    ['lat_raise',     {sets:3, reps:'10',       rest:75}],
    ['calf',          {sets:4, reps:'8–10',     rest:90}],
    ['cable_crunch',  {sets:4, reps:'10',       rest:60}],
  ]},
  { name:'MARDI · BAS DU CORPS', sub:'Quadriceps, ischios, fessiers, lombaires — mixte 5-15 reps', pr:1, ex:[
    ['squat',         {sets:5, reps:'5',        rest:180}],
    ['romanian_dl',   {sets:4, reps:'8',        rest:150}],
    ['leg_press',     {sets:4, reps:'10–12',    rest:120}],
    ['hip_thrust',    {sets:4, reps:'10–12',    rest:90}],
    ['leg_curl',      {sets:4, reps:'12',       rest:75}],
    ['leg_ext',       {sets:3, reps:'15',       rest:60}],
    ['hyperext',      {sets:3, reps:'15',       rest:60}],
  ]},
  { name:'MERCREDI · PULL FORCE', sub:'Dos, biceps, avant-bras — lourd 4-6 reps · obliques', pr:1, ex:[
    ['bb_row',        {sets:5, reps:'5',        rest:180}],
    ['lat_close',     {sets:4, reps:'6',        rest:150}],
    ['seated_row',    {sets:3, reps:'8',        rest:120}],
    ['ez_curl_std',   {sets:4, reps:'6–8',      rest:120}],
    ['preacher',      {sets:3, reps:'8',        rest:90}],
    ['reverse_curl',  {sets:3, reps:'10',       rest:75}],
    ['wrist_curl',    {sets:3, reps:'15',       rest:45}],
    ['cable_wood_chop',{sets:3,reps:'12/côté',  rest:60}],
  ]},
  { name:'JEUDI · PUSH VOLUME', sub:'Pectoraux, épaules, triceps — 12-15 reps · mollets · abdos', pr:1, ex:[
    ['incline_db',    {sets:4, reps:'12',       rest:90}],
    ['dips_chest',    {sets:3, reps:'max',      rest:90}],
    ['cable_cross',   {sets:3, reps:'15',       rest:60}],
    ['low_cross',     {sets:3, reps:'15',       rest:60}],
    ['lat_raise',     {sets:4, reps:'15',       rest:60}],
    ['pushdown',      {sets:4, reps:'15',       rest:60}],
    ['oh_ext',        {sets:3, reps:'15',       rest:60}],
    ['calf',          {sets:4, reps:'20',       rest:45}],
    ['ab_machine',    {sets:4, reps:'15',       rest:45}],
  ]},
  { name:'DIMANCHE · PULL VOLUME', sub:'Dos, biceps, avant-bras — 12-15 reps · obliques', pr:1, ex:[
    ['lat_wide',      {sets:4, reps:'12',       rest:90}],
    ['seated_row',    {sets:4, reps:'12',       rest:75}],
    ['straight_arm',  {sets:3, reps:'15',       rest:60}],
    ['face_pull',     {sets:3, reps:'15',       rest:60}],
    ['alt_curl',      {sets:4, reps:'12/côté',  rest:60}],
    ['conc_curl',     {sets:3, reps:'12/côté',  rest:60}],
    ['cable_curl',    {sets:3, reps:'15',       rest:60}],
    ['palms_down_wrist',{sets:3,reps:'15',      rest:45}],
    ['cable_side_bend',{sets:3, reps:'15/côté', rest:45}],
  ]},
];

function buildProgV3() {
  return PROG_V3.map(d => ({ id: uid(), name: d.name, sub: d.sub, pr: d.pr,
    exos: d.ex.map(([k, ov]) => exoFrom(k, ov)).filter(Boolean) }));
}

/* Remplace les 5 jours par le programme force/volume, sans toucher au reste */
function loadProgV3() {
  Modal.confirm('Charger le programme force / volume ?',
    'Tes 5 jours actuels sont remplacés. Historique, nutrition et pesées sont conservés.',
    () => {
      S.program = buildProgV3();
      CUR = 0; save(); Modal.close(); App.go('programme');
      toast('Programme force / volume chargé 💪');
    }, 'Remplacer');
}
