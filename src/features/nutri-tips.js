/* ============================================================
   CONSEILS NUTRITION — lecture d'une journée et d'une semaine
   ============================================================
   Une fois que l'utilisateur a renseigné ses repas, l'app compare
   ce qu'il a mangé à ses objectifs et dit ce qui manque, en clair
   et en grammes d'aliments réels plutôt qu'en pourcentages.

   Les repères utilisés sont des repères d'entraînement classiques
   (1,6 à 2,2 g de protéines par kilo, un plancher de lipides pour
   l'équilibre hormonal, des glucides autour de la séance). Ce sont
   des ordres de grandeur, pas un avis médical : le panneau le dit.
   ============================================================ */

/* Repères, en grammes par kilo de poids de corps */
const PROT_MIN = 1.6, PROT_HIGH = 2.2, FAT_MIN = 0.7;
/* Tolérances autour de l'objectif calorique avant de signaler quoi que ce soit */
const KCAL_LOW = 0.85, KCAL_HIGH = 1.15;

const NutriTips = {

  /* ---------- lecture d'une journée ---------- */

  dayTips(dateKey) {
    const entries = S.nutrition.log[dateKey] || [];
    if (!entries.length) return [];

    const t = effectiveTargets();
    const tot = sumMacros(entries);
    const kg = +S.profile.weight || 0;
    const goal = S.profile.goal || 'masse';
    const tips = [];

    /* -- calories -- */
    const dk = tot.kcal - t.kcal;
    if (t.kcal && tot.kcal < t.kcal * KCAL_LOW) {
      tips.push({ lvl: 'warn', t: `Il te manque ${Math.round(-dk)} kcal`,
        d: goal === 'masse'
          ? 'En prise de masse, un déficit répété freine la récupération avant de freiner la prise de muscle. Ajoute plutôt des glucides : ils coûtent peu à digérer.'
          : goal === 'seche'
            ? 'Descendre bien en dessous de la cible fait fondre autant de muscle que de gras, et rend les séances plates. Le déficit prévu est déjà intégré à ton objectif.'
            : 'Tu es sous ton maintien. Sur plusieurs jours, ça finit par se voir sur les charges.' });
    } else if (t.kcal && tot.kcal > t.kcal * KCAL_HIGH) {
      tips.push({ lvl: goal === 'seche' ? 'bad' : 'warn', t: `${Math.round(dk)} kcal au-dessus de la cible`,
        d: goal === 'seche'
          ? 'Un dépassement ponctuel ne casse rien, mais répété il annule le déficit sans que la balance bouge dans le bon sens.'
          : 'Au-delà d\'un surplus modéré, le supplément part surtout en gras. Vise le haut de la fourchette, pas au-delà.' });
    } else if (t.kcal) {
      tips.push({ lvl: 'ok', t: 'Calories dans la cible', d: `${Math.round(tot.kcal)} kcal pour un objectif de ${t.kcal}.` });
    }

    /* -- protéines -- */
    const dp = t.p - tot.p;
    if (dp > 12) {
      tips.push({ lvl: 'warn', t: `${Math.round(dp)} g de protéines en moins`,
        d: `Soit à peu près ${protEquiv(dp)}. C'est le macro qui se rattrape le plus facilement, et celui qui compte le plus quand on s'entraîne ${(S.settings.daysPerWeek || 5)} fois par semaine.` });
    } else if (kg && tot.p / kg > PROT_HIGH + 0.6) {
      tips.push({ lvl: 'info', t: 'Protéines très hautes',
        d: `${round(tot.p / kg, 1)} g/kg. Au-delà de ${PROT_HIGH} g/kg le bénéfice ne monte plus ; ces calories serviraient mieux en glucides autour de la séance.` });
    } else {
      tips.push({ lvl: 'ok', t: 'Protéines couvertes',
        d: kg ? `${Math.round(tot.p)} g, soit ${round(tot.p / kg, 1)} g/kg — dans la fourchette ${PROT_MIN}–${PROT_HIGH}.` : `${Math.round(tot.p)} g.` });
    }

    /* -- glucides, surtout un jour de séance -- */
    const trained = this.trainedOn(dateKey);
    const dc = t.c - tot.c;
    if (dc > 40) {
      tips.push({ lvl: trained ? 'warn' : 'info', t: `${Math.round(dc)} g de glucides en moins`,
        d: trained
          ? 'Tu t\'es entraîné aujourd\'hui : les glucides sont le carburant des séries lourdes et ce qui reremplit les réserves ensuite. C\'est souvent là que se joue la sensation de séance molle.'
          : `Soit environ ${carbEquiv(dc)}. Rien de grave un jour de repos, mais c'est ce qui manque le plus souvent aux journées trop légères.` });
    }

    /* -- lipides : plancher hormonal -- */
    if (kg && tot.f < FAT_MIN * kg * 0.75) {
      tips.push({ lvl: 'warn', t: 'Lipides bas',
        d: `${Math.round(tot.f)} g aujourd'hui. En dessous d'environ ${Math.round(FAT_MIN * kg)} g par jour sur la durée, l'équilibre hormonal et l'absorption des vitamines A, D, E et K en pâtissent.` });
    }

    /* -- répartition sur la journée -- */
    const perMeal = MEALS.map(m => sumMacros(entries.filter(e => e.meal === m.k)));
    const biggest = perMeal.reduce((a, b) => (b.kcal > a.kcal ? b : a), { kcal: 0 });
    if (tot.kcal > 800 && biggest.kcal / tot.kcal > 0.55) {
      const name = MEALS[perMeal.indexOf(biggest)].label.toLowerCase();
      tips.push({ lvl: 'info', t: 'Journée concentrée sur un repas',
        d: `${Math.round(biggest.kcal / tot.kcal * 100)} % de tes calories sont sur le ${name}. Étaler sur trois ou quatre prises facilite la digestion et lisse l'apport en protéines.` });
    }
    const pMax = Math.max(...perMeal.map(m => m.p));
    if (kg && tot.p > 60 && pMax / tot.p > 0.6) {
      tips.push({ lvl: 'info', t: 'Protéines groupées sur un repas',
        d: `Trois à quatre prises d'environ ${Math.round(0.35 * kg)} g valent mieux qu'une seule grosse : la synthèse protéique se relance à chaque prise.` });
    }

    /* -- légumes et fruits -- */
    const cats = new Set(entries.map(e => (foodById(e.ref) || {}).cat).filter(Boolean));
    if (!cats.has('Légume') && !cats.has('Fruit')) {
      tips.push({ lvl: 'warn', t: 'Ni légume ni fruit aujourd\'hui',
        d: 'Fibres, micronutriments et volume dans l\'assiette : c\'est ce qui manque le plus souvent aux régimes construits autour des macros. Deux portions suffisent à changer la donne.' });
    }

    return tips;
  },

  /* ---------- lecture de la semaine ---------- */

  weekTips() {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(todayKey(d));
    }
    const logged = days.filter(d => (S.nutrition.log[d] || []).length);
    const tips = [];

    if (!logged.length) return tips;

    if (logged.length < 5) {
      tips.push({ lvl: 'info', t: `${logged.length} jour${logged.length > 1 ? 's' : ''} renseigné${logged.length > 1 ? 's' : ''} sur 7`,
        d: 'Un journal à trous ne dit rien de fiable : ce sont presque toujours les jours non notés qui expliquent l\'écart entre ce qu\'on croit manger et ce que fait la balance. Cinq jours sur sept suffisent à voir juste.' });
    }

    const foods = new Set();
    logged.forEach(d => (S.nutrition.log[d] || []).forEach(e => foods.add(e.ref)));
    if (logged.length >= 4 && foods.size < 10) {
      tips.push({ lvl: 'info', t: `${foods.size} aliments différents sur la semaine`,
        d: 'Manger la même chose tous les jours simplifie la logistique, mais concentre aussi les carences éventuelles. Faire tourner deux ou trois sources par catégorie suffit.' });
    }

    /* tendance de poids sur quatre semaines, confrontée à l'objectif */
    const w = (S.weights || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const since = Date.now() - 28 * 86400000;
    const rec = w.filter(x => new Date(x.date + 'T12:00:00').getTime() >= since);
    if (rec.length >= 3) {
      const a = rec[0], b = rec[rec.length - 1];
      const weeks = Math.max(1, (new Date(b.date) - new Date(a.date)) / (7 * 86400000));
      const perWeek = (b.kg - a.kg) / weeks;
      const goal = S.profile.goal || 'masse';
      if (goal === 'masse' && perWeek < 0.05) {
        tips.push({ lvl: 'warn', t: 'Le poids ne monte pas',
          d: `${round(perWeek, 2)} kg/semaine sur trois semaines. Si l'objectif est de prendre, c'est que l'apport réel est au niveau du maintien : ajouter environ 200 kcal par jour et re-mesurer dans deux semaines est plus fiable que de tout changer d'un coup.` });
      } else if (goal === 'masse' && perWeek > 0.5) {
        tips.push({ lvl: 'warn', t: 'Le poids monte vite',
          d: `${round(perWeek, 2)} kg/semaine. Au-delà d'environ 0,3 kg/semaine, la part de gras dans la prise augmente nettement. Retirer 200 kcal ramène la pente sans casser la progression.` });
      } else if (goal === 'seche' && perWeek > -0.05) {
        tips.push({ lvl: 'warn', t: 'Le poids ne descend pas',
          d: `${round(perWeek, 2)} kg/semaine sur un mois. En sèche, un poids stable signifie que l'apport réel égale la dépense — souvent parce que les portions non pesées sont sous-estimées.` });
      } else {
        tips.push({ lvl: 'ok', t: 'Tendance cohérente avec l\'objectif',
          d: `${perWeek > 0 ? '+' : ''}${round(perWeek, 2)} kg/semaine sur le dernier mois.` });
      }
    } else {
      tips.push({ lvl: 'info', t: 'Trop peu de pesées récentes pour conclure',
        d: 'Le poids varie de plus d\'un kilo d\'un jour à l\'autre selon l\'eau et le contenu digestif. Trois pesées étalées sur un mois, dans les mêmes conditions, suffisent à dégager une tendance — et c\'est la tendance qui pilote les calories, pas la pesée du matin.' });
    }

    return tips;
  },

  /** Une séance a-t-elle été terminée ce jour-là ? */
  trainedOn(dateKey) {
    return (S.history || []).some(h => h.done && todayKey(new Date(h.date)) === dateKey);
  },

  /* ---------- rendu ---------- */

  /** Encart compact affiché dans le journal, sous les macros. */
  card(dateKey) {
    const tips = this.dayTips(dateKey);
    if (!tips.length) return '';
    const order = { bad: 0, warn: 1, info: 2, ok: 3 };
    const sorted = tips.slice().sort((a, b) => order[a.lvl] - order[b.lvl]);
    const head = sorted.slice(0, 2);
    return `<div class="tipcard">
      <div class="tiphd"><h4>Conseils du jour</h4>
        <button class="btn sm ghost" onclick="NutriTips.panel('${dateKey}')">Tout voir</button></div>
      ${head.map(x => this._row(x)).join('')}
      ${tips.length > head.length ? `<p class="hint" style="margin-top:6px">+ ${tips.length - head.length} autre${tips.length - head.length > 1 ? 's' : ''} remarque${tips.length - head.length > 1 ? 's' : ''}.</p>` : ''}
    </div>`;
  },

  _row(x) {
    const ic = { bad: '✕', warn: '!', info: 'i', ok: '✓' }[x.lvl];
    return `<div class="tiprow ${x.lvl}"><span class="tipic">${ic}</span>
      <div><h5>${esc(x.t)}</h5><p>${esc(x.d)}</p></div></div>`;
  },

  panel(dateKey) {
    dateKey = dateKey || Nutri.date;
    const day = this.dayTips(dateKey);
    const week = this.weekTips();
    Modal.open('Conseils nutrition', `
      <h5 class="mini-hd">Ta journée</h5>
      ${day.length ? day.map(x => this._row(x)).join('')
        : '<p class="hint">Rien à analyser : la journée est vide.</p>'}
      <div class="divider"></div>
      <h5 class="mini-hd">Ta semaine</h5>
      ${week.length ? week.map(x => this._row(x)).join('')
        : '<p class="hint">Renseigne quelques jours pour voir se dégager une tendance.</p>'}
      <div class="divider"></div>
      <p class="hint">Ce sont des repères d'entraînement généraux, calculés depuis ton profil et ce que tu as
        noté — pas un avis médical. Pour un plan adapté à ta situation, un diététicien du sport reste
        irremplaçable.</p>`,
      `<button class="btn wide primary" onclick="Modal.close()">Fermer</button>`);
  },
};

/* ---- équivalences en aliments réels : plus parlant qu'un nombre de grammes ---- */
function protEquiv(g) {
  const opts = [['f_poulet', 'de blanc de poulet'], ['f_fromageblanc', 'de fromage blanc'], ['f_oeuf', 'd\'œuf']];
  return _equiv(g, 'p', opts);
}
function carbEquiv(g) {
  const opts = [['f_riz', 'de riz cuit'], ['f_patate', 'de pommes de terre'], ['f_pain', 'de pain complet']];
  return _equiv(g, 'c', opts);
}
function _equiv(g, macro, opts) {
  for (const [id, label] of opts) {
    const f = foodById(id);
    if (!f || !f[macro]) continue;
    const grams = Math.round(g / f[macro] * 100 / 10) * 10;
    if (grams >= 30 && grams <= 600) return `${grams} g ${label}`;
  }
  const f = foodById(opts[0][0]);
  return f ? `${Math.round(g / f[macro] * 100)} g ${opts[0][1]}` : `${Math.round(g)} g`;
}
