/* ============================================================
   PALIERS DE CHARGE PAR TYPE DE MATÉRIEL
   ============================================================ */
const LOAD_STEP = {
  bw: 0,        // poids du corps : on progresse en répétitions
  db: 2,        // haltères
  bb: 2.5,      // barre (2 disques de 1,25 kg)
  ez: 2.5,      // barre EZ
  cable: 5,     // poulie / colonne à broche
  machine: 5,   // machine à broche
  smith: 2.5,   // Smith machine
  kb: 4,        // kettlebell
  band: 0,      // élastique
  other: 2.5,
};
function loadStep(k) {
  const e = LIBMAP[k];
  const s = e ? LOAD_STEP[e.eqt] : undefined;
  return s === undefined ? 2.5 : s;
}
/* Charge suivante (dir = +1) ou précédente (dir = -1), null si non pertinent */
function nextLoad(k, cur, dir) {
  const w = parseFloat(cur), st = loadStep(k);
  if (!st || isNaN(w)) return null;
  return Math.max(0, round(w + dir * st, 2));
}
