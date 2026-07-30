# Contribuer à IRON

Merci de passer par là. Le projet est petit et volontairement sans dépendances :
on peut le lire en entier en une soirée.

## Démarrer

```bash
git clone https://github.com/brouzesalexandre-aura/iron-workout.git
cd iron-workout
npm install          # uniquement Playwright, pour les tests
npm run build        # produit dist/index.html
npm test             # tests de bout en bout dans Chromium
```

Ouvre ensuite `dist/index.html` dans un navigateur : c'est l'app entière, telle
qu'elle tourne sur le téléphone. Aucun serveur, aucun framework, rien à démarrer.

Pour l'APK il faut un SDK Android :

```bash
npm run apk          # android/app/build/outputs/apk/debug/IRON-2.6.0.apk
```

## Les deux règles qui comptent

**1. `dist/index.html` est versionné.** Ne l'édite jamais à la main : il est
généré. Modifie les fichiers de `src/`, lance `npm run build`, et commite le
résultat avec tes sources. La CI refuse la PR si les deux ne correspondent pas
(`npm run check`).

**2. La version vit dans `VERSION`, et nulle part ailleurs.** La partie web et
Gradle la lisent tous les deux. Ne touche pas à `versionName` dans
`build.gradle`.

## Où va quoi

```
src/core/        état, stockage, médias, paliers de charge, mise à jour
src/data/        exercices, zones musculaires, modèle anatomique, aliments
src/features/    un module par écran, plus les moteurs (fatigue, progression, conseils)
src/ui/          navigation et modales
src/styles/      feuilles numérotées — l'ordre du numéro EST l'ordre de la cascade
```

L'ordre de concaténation est déclaré dans `build.config.json`. Un nouveau module
doit y être ajouté, sinon il n'arrive jamais dans le bundle.

Le style du code suit ce qui existe : pas de sémicolons manquants, pas de
transpileur, des fonctions courtes, et des commentaires qui expliquent
*pourquoi* plutôt que *quoi*. L'app est en français, y compris les identifiants
visibles par l'utilisateur.

## Tests

`tests/e2e.mjs` charge le bundle dans Chromium et vérifie le comportement réel :
navigation, moteur de fatigue, séance guidée, paliers de charge, progression,
conseils nutrition, et migration des anciennes sauvegardes.

Toute PR qui touche à un calcul doit ajouter un test. Le moteur de fatigue et
les paliers de charge sont les deux endroits où une erreur silencieuse se paie
en séances ratées, pas en écran cassé.

La migration mérite une attention particulière : une mise à jour s'installe
par-dessus les données existantes. Un changement de forme de l'état doit être
absorbé par `migrate()` dans `src/boot.js`, et couvert par un test qui vérifie
que l'historique survit.

## Proposer un changement

1. Ouvre une [issue](https://github.com/brouzesalexandre-aura/iron-workout/issues)
   d'abord, sauf pour un correctif évident. Les modèles *Bug* et *Évolution* sont
   là pour ça.
2. Une branche par sujet, un sujet par PR.
3. `npm run build && npm test` avant de pousser.
4. Décris ce que tu as vérifié à la main sur téléphone, s'il y a de l'interface.

Les évolutions déjà identifiées sont dans les issues ouvertes. Celles étiquetées
`enhancement` sans assigné sont libres — dis-le en commentaire avant de
commencer, ça évite le travail en double.

## Ce que le projet ne veut pas devenir

- Pas de framework, pas de bundler, pas de dépendance à l'exécution.
- Pas de compte, pas de serveur, pas de télémétrie. Les données restent sur le
  téléphone.
- Pas de fonctionnalité qui demande d'être en ligne pour s'entraîner.

Une PR qui ajoute React ou un backend sera refusée — pas par principe, mais
parce que l'app doit rester lisible par une personne seule et utilisable dans un
sous-sol sans réseau.

## Licence

En contribuant, tu acceptes que ton code soit publié sous la licence MIT du
projet.
