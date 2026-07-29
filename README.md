<h1 align="center">IRON</h1>

<p align="center">
  Application de musculation et de nutrition, pensée pour être utilisée
  <em>pendant</em> la séance : une série à l'écran, un geste pour la valider.
</p>

<p align="center">
  <a href="../../releases/latest"><img alt="Dernière version" src="https://img.shields.io/github/v/release/brouzesalexandre-aura/iron-workout?label=version&color=E8432D"></a>
  <a href="../../actions/workflows/ci.yml"><img alt="CI" src="https://github.com/brouzesalexandre-aura/iron-workout/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="Licence MIT" src="https://img.shields.io/badge/licence-MIT-blue"></a>
</p>

---

## Ce que fait l'app

**Programme** — cinq jours configurables, exercices, séries, répétitions et temps de repos.
Un programme force / volume ondulatoire est fourni, chargeable en un bouton.

**Séance guidée** — l'écran n'affiche qu'une série à la fois : charge, répétitions,
et un bouton. Tu valides, l'app demande le ressenti (*facile, correct, dur, échec*),
**puis** lance le repos et prépare la série suivante avec la charge ajustée. Les paliers
respectent le matériel : 2,5 kg à la barre, 2 kg aux haltères, 5 kg aux machines.
Au poids du corps, l'ajustement se fait en répétitions.

**Charge musculaire** — un modèle anatomique découpé en **25 zones**, vues avant et
arrière, colorié du bleu (récupéré) au rouge (saturé). La fatigue se calcule à partir
du volume réalisé, du ressenti déclaré et de la part de chaque muscle dans le mouvement,
puis décroît à la vitesse propre au muscle — 30 h pour les mollets, 72 h pour les
quadriceps. Trois modes : fatigue actuelle, sollicitation d'une séance à venir,
répartition sur tout le programme.

**Bibliothèque** — 215 exercices en français, avec visuel, matériel, muscles ciblés et
conseil d'exécution. Chaque fiche affiche le schéma corporel des muscles travaillés.
Tu peux créer tes propres exercices et leur attacher photos, GIF ou **vidéos** filmées
depuis le téléphone.

**Progression** — l'évolution des charges, exercice par exercice. Une courbe du **1RM
estimé** (Epley) doublée de la charge maximale, pour que monter en répétitions compte
autant que monter en poids. Les records personnels sont détectés tout seuls : charge
maximale, meilleure série, meilleur volume, et la séance qui les a établis. Au poids du
corps la progression bascule automatiquement en répétitions.

**Nutrition** — journal calories et macros, base d'aliments, recettes, plans de repas,
objectifs calculés depuis ton profil. Dès que la journée est renseignée, l'app dit ce
qui manque — en grammes d'aliments réels plutôt qu'en pourcentages — et confronte la
tendance du poids à l'objectif déclaré.

**Mise à jour** — l'app interroge les releases de ce dépôt et te propose d'installer la
nouvelle version. Tes données ne sont jamais effacées par une mise à jour.

## Installer

Télécharge l'APK depuis la [dernière release](../../releases/latest) et ouvre-le sur ton
Android (7.0 minimum). Autorise l'installation depuis cette source quand le système le
demande.

`dist/index.html` s'ouvre aussi directement dans un navigateur, sans rien installer :
c'est exactement la même app.

## Architecture

IRON est **une seule page HTML autonome**. Pas de framework, pas de dépendance à
l'exécution, aucun serveur : les données vivent dans `localStorage`, les médias dans
`IndexedDB`. L'APK Android n'est qu'une WebView autour de ce fichier.

Le code source, lui, est découpé en modules. `tools/build.mjs` les concatène dans
l'ordre déclaré par `build.config.json` et produit `dist/index.html`.

```
src/
├── index.html            squelette et emplacements d'injection
├── manifest.json         manifeste PWA (icônes dans assets/)
├── styles/               feuilles numérotées : l'ordre est la cascade
├── data/                 exercices, zones musculaires, modèle anatomique, aliments
├── core/                 état, stockage, médias, paliers de charge, mise à jour
├── features/             un module par écran + moteur de fatigue
├── ui/                   navigation et modales
└── boot.js               démarrage

android/                  projet Gradle (WebView + pont natif)
tools/build.mjs           assemblage vers dist/
tests/e2e.mjs             tests de bout en bout (Playwright)
```

Le pont natif `IronNative` n'existe que pour ce que la WebView ne sait pas faire :
interroger l'API GitHub sans se heurter à la politique CORS (l'origine d'un fichier
local vaut `null`), et remettre un APK téléchargé à l'installeur du système.

### Le modèle de fatigue

Chaque série terminée dépose des « unités de charge » sur les zones qu'elle sollicite :
une unité pleine sur les muscles primaires, 45 % sur les secondaires, multipliée par le
ressenti déclaré (0,55 pour *facile*, 1,6 pour *échec*). Le total est rapporté au volume
qui sature la zone, puis décroît linéairement.

Une zone à 100 % revient à zéro après ses heures de récupération de référence ; une zone
à 50 % en met deux fois moins. Concrètement : un quadriceps rincé demande trois jours,
à moitié entamé il est bon le lendemain. Les vitesses sont réglables muscle par muscle.

### Les conseils nutrition

Ils ne sortent d'aucun modèle : ce sont des règles lisibles dans `features/nutri-tips.js`,
comparées à des repères d'entraînement classiques — 1,6 à 2,2 g de protéines par kilo, un
plancher de lipides autour de 0,7 g/kg, des glucides le jour d'une séance. Chaque manque
est traduit en aliments de la base (« 240 g de blanc de poulet ») parce qu'un écart de
40 g de protéines ne veut rien dire tant qu'on ne sait pas à quoi ça ressemble dans une
assiette.

La tendance du poids sur quatre semaines est confrontée à l'objectif déclaré : un poids
stable en prise de masse veut dire que l'apport réel est au niveau du maintien, et l'app
le dit. Elle refuse de conclure sur moins de trois pesées.

## Développer

```bash
npm install
npm run build     # produit dist/index.html et le copie dans les assets Android
npm test          # tests de bout en bout dans Chromium
npm run apk       # construit l'APK debug (nécessite un SDK Android)
```

`dist/index.html` est **versionné** : la CI vérifie qu'il correspond aux sources
(`npm run check`). Après toute modification dans `src/`, lance `npm run build` et
commite le résultat.

Le numéro de version vit dans le fichier `VERSION` à la racine, et rien qu'à cet
endroit : la partie web et Gradle le lisent tous les deux.

## Publier une version

Le dépôt doit contenir quatre secrets, une seule fois :

| Secret | Contenu |
|---|---|
| `KEYSTORE_B64` | le keystore de release encodé en base64 |
| `KEYSTORE_PASSWORD` | mot de passe du keystore |
| `KEY_ALIAS` | `iron` |
| `KEY_PASSWORD` | mot de passe de la clé |

Toutes les versions **doivent** être signées avec la même clé, sinon Android refuse
d'installer la mise à jour par-dessus.

Ensuite, publier revient à :

```bash
echo "2.7.0" > VERSION
npm run build
git commit -am "version 2.7.0" && git push
git tag v2.7.0 && git push --tags
```

La CI construit l'APK signé, le teste et crée la release. L'app le détecte au démarrage
suivant.

## Contribuer

Les évolutions et les bugs se suivent dans les [issues](../../issues). Deux modèles sont
proposés : *Bug* et *Évolution*.

## Crédits

- Visuels des exercices : [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domaine public)
- Modèle anatomique : [react-native-body-highlighter](https://github.com/HamzaMoumen/react-native-body-highlighter) (MIT)

## Licence

MIT — voir [LICENSE](LICENSE).

> Cette application est un outil de suivi personnel. Elle ne remplace ni un coach, ni un
> professionnel de santé, ni un diététicien.
