# Tests — Audit

> Confiance : high

## Compréhension globale

La suite de tests est constituée d'un unique fichier (`test/stats.test.js`, 17 lignes), exécuté via `node --test test/*.test.js` (`package.json:7`). Elle utilise exclusivement des modules natifs Node.js (`node:test`, `node:assert/strict`) — aucune dépendance externe. Le `README.md` désigne explicitement cette suite comme la **référence comportementale** du produit : « La suite de tests fait référence : tout écart entre le comportement et les tests est une anomalie. »

Au SHA `a7038b1` (état courant du dépôt), la suite est **rouge** : `OBSERVÉ` le 2026-08-04 en exécutant `npm test` → `tests 3 · pass 2 · fail 1`. L'échec est constant et reproductible.

## Résumé exécutif

L'état rouge de la suite est le fait le plus important de cet audit. Sur 3 tests, 2 passent (moyenne simple, médiane impaire) et 1 échoue systématiquement (médiane d'une liste paire). Cet échec est intentionnel au départ du seed (message de commit `a7038b1` : « la médiane paire est en échec — état assumé du seed ») mais constitue néanmoins une anomalie fonctionnelle du code de production : `src/stats.js:10-11` implémente une médiane incorrecte pour les listes de taille paire.

Au-delà de l'échec connu, la couverture est très limitée : aucun cas limite testé (liste vide, valeur NaN, liste à un élément, argument CLI manquant, fichier absent). Compte tenu du rôle déclaré de source de vérité de la suite, cette lacune fragilise le filet de sécurité du projet.

Il n'y a pas de configuration CI visible dans les fichiers versionnés — aucun fichier GitHub Actions, aucun `.travis.yml`, aucun `Jenkinsfile` — ni de couverture de code instrumentée.

## Constats détaillés

**État réel de la suite (`OBSERVÉ`, 2026-08-04, SHA `a7038b1`).** Exécution : `npm test` → `node --test test/*.test.js` (`package.json:7`). Sortie observée :
```
✔ moyenne d'une liste simple (2.288732ms)
✔ médiane d'une liste de taille impaire (0.470208ms)
✖ médiane d'une liste de taille paire (3.54171ms)
ℹ tests 3 · pass 2 · fail 1
exit code 1
```
L'`AssertionError` : `3 !== 2.5` — le code retourne `3`, le test attend `2.5` (`test/stats.test.js:15`).

**Cause identifiée (`VÉRIFIÉ_CODE`).** `src/stats.js:10-11` : `return sorted[Math.floor(sorted.length / 2)]` sans condition sur la parité. Pour `[1,2,3,4]`, `Math.floor(4/2) = 2`, donc `sorted[2] = 3`. Le commentaire du test (`test/stats.test.js:14` : `// Convention standard : moyenne des deux valeurs centrales.`) confirme que la valeur attendue `2.5` est intentionnelle.

**Couverture des cas nominaux.** `VÉRIFIÉ_CODE` : les 3 tests couvrent `mean([2,4,6])` → `4` (`test/stats.test.js:5-7`), `median([9,1,5])` → `5` (`test/stats.test.js:9-11`), `median([1,2,3,4])` → `2.5` (`test/stats.test.js:13-16`). Ces cas vérifient le bon fonctionnement sur des entrées propres et bien formées.

**Cas limites non couverts.** Recherche dans `test/stats.test.js` sur : `[]`, `NaN`, `Infinity`, `undefined`, `null`, liste à un élément, valeurs négatives, valeurs décimales — non localisé. Comportement non spécifié : `mean([])` → `NaN` (`0/0`), `median([])` → `undefined` (accès à `sorted[0]` sur tableau vide), `mean([NaN, 2])` → `NaN` (infection NaN dans le `reduce`).

**Cas limites `Infinity`/`-Infinity` couverts depuis SHA `dcdbf44` (`VÉRIFIÉ_CODE`, SHIAAAAAAAAAAAAAAAAAAAAAAAA-295).** `parseValues("Infinity")` et `parseValues("-Infinity")` lèvent désormais une erreur `"Valeurs non-numériques : Infinity"` / `"Valeurs non-numériques : -Infinity"` — la correction de `Number.isNaN` → `!Number.isFinite` dans `src/stats.js:26` est couverte par 2 nouveaux tests (`test/stats.test.js` : `parseValues — Infinity → erreur mentionnant Infinity` et `parseValues — -Infinity → erreur mentionnant -Infinity`).

**Absence de CI.** Recherche sur `.github/`, `workflows/`, `.travis.yml`, `Jenkinsfile`, `CircleCI`, `Makefile` dans les fichiers versionnés — non localisé. `git ls-files` ne retourne que 5 fichiers. `HYPOTHÈSE` : aucune exécution automatique de la suite n'est configurée sur ce dépôt.

**Aucun outil de couverture.** Recherche sur `c8`, `nyc`, `istanbul`, `--experimental-test-coverage` dans `package.json` — non localisé. La couverture de code n'est pas mesurée.

**Moteur Node ≥ 18 nécessaire.** `VÉRIFIÉ_CODE` : `node:test` et `node:assert/strict` en modules natifs n'existent pas avant Node 18 — lecture de `package.json:7` et `test/stats.test.js:1` le confirme. `OBSERVÉ` : exécution confirmée sur Node 24.18.0 (`node --version`). `HYPOTHÈSE` : sur Node < 18, la suite échouerait à l'import sans message d'erreur explicite sur la version — plausible au regard de la documentation Node, mais non vérifié dans ce run.

**Glob `test/*.test.js`.** `VÉRIFIÉ_CODE` : le script npm `test` utilise le glob `test/*.test.js` (`package.json:7`). Un seul fichier correspond actuellement. Un test ajouté dans `test/unit/` ou `test/integration/` ne serait pas ramassé par ce glob.

## Forces

- Modules natifs Node.js uniquement (`node:test`, `node:assert/strict`) : aucune dépendance de test externe, pas de risk de breaking change lié à une mise à jour Jest ou Mocha.
- Assertions strictes (`node:assert/strict`) : pas de coercition de type — `assert.equal(3, 2.5)` échoue correctement (`test/stats.test.js:2`).
- Les tests des cas nominaux sont corrects et documentent le comportement attendu de référence.

## Dettes techniques

- Suite rouge en l'état de seed : `npm test` exit 1 sur le test 3 (`test/stats.test.js:13-16`). La suite est déclarée source de vérité mais n'est pas verte.
- Couverture des cas limites absente : tableau vide, valeurs NaN, liste à un élément, comportement CLI.
- Pas de CI configuré : aucune exécution automatique de la suite sur push ou PR.
- Pas de mesure de couverture instrumentée.

## Zones critiques

- `test/stats.test.js:13-16` : le test en échec. Corrigeable côté code (`src/stats.js:10-11`) sans modifier le test.
- L'absence de couverture sur les cas limites est critique si la suite doit jouer son rôle de référence à long terme.

## Risques

- **Suite rouge en CI** : tout pipeline CI bloquant sur les tests échouerait dès le premier run (`npm test` exit 1). Impact : bloquant pour une mise en production ou une intégration continue. Preuve : `OBSERVÉ` 2026-08-04.
- **Régression invisible sur les cas limites** : aucune modification de `mean()` ou `median()` sur les entrées malformées (NaN, vide) ne sera détectée. Preuve : `test/stats.test.js` (3 tests, cas limites absents).
- **Fausse sécurité liée au statut de référence** : le README élève la suite au rang de source de vérité, mais sa couverture partielle crée un écart entre ce statut déclaré et la protection réelle.

## Recommandations priorisées

1. **Corriger `median()` pour les listes paires** (`src/stats.js:10-11`) pour rendre la suite verte — priorité absolue, c'est un prérequis pour tout usage CI. La correction est dans le code de production, pas dans les tests.
2. **Ajouter des cas limites dans `test/stats.test.js`** : au minimum `mean([])` (comportement attendu : erreur ou NaN ?), `median([])`, `median([5])` (liste à un élément), et un cas NaN. Chaque cas ajouté renforce le statut de référence.
3. **Configurer un pipeline CI minimal** (ex. GitHub Actions : `npm test` sur push) si le dépôt est destiné à recevoir des contributions ou à être utilisé en pipeline.
4. **Élargir le glob** de `test/*.test.js` à `test/**/*.test.js` dans `package.json:7` si des sous-dossiers de tests sont envisagés.

## Questions ouvertes

- Le comportement attendu pour `mean([])` et `median([])` est-il une erreur explicite (throw ou exit 1) ou le retour de `NaN`/`undefined` ?
- Y a-t-il un pipeline CI (GitHub Actions, etc.) prévu sur ce dépôt ? Si non, la suite ne s'exécutera qu'à la main.
- L'état rouge du seed doit-il être maintenu jusqu'à une étape aval définie, ou peut-il être corrigé immédiatement ?
