# Points chauds du code — Audit

> Confiance : high

## Compréhension globale

Le projet ne compte que 3 fichiers de code (26 lignes au total) et 1 fichier de test (17 lignes). Il n'existe pas de « gros fichier » ni de « module surchargé » au sens usuel. Les points chauds sont ici définis par leur criticité fonctionnelle et leur fragilité observable — non par leur taille. Deux fichiers concentrent l'essentiel du risque : `src/stats.js` (logique métier avec un bug connu) et `bin/index.js` (point d'entrée sans garde-fous).

## Résumé exécutif

Le hotspot numéro un est `src/stats.js:10-11` : l'implémentation de `median` retourne l'élément d'index `Math.floor(n/2)` sans tenir compte de la parité de `n`, contredisant la convention standard et le test de référence. Ce défaut est la seule anomalie comportementale identifiée dans le code, mais c'est le cœur de valeur du produit — c'est là qu'un senior regarderait en premier.

Le deuxième hotspot est `bin/index.js:8-10` : trois lignes sans protection qui enchaînent lecture d'argument CLI, lecture synchrone de fichier, et parsing sans validation — chaque ligne peut produire une exception non capturée ou une valeur silencieusement incorrecte. Ce n'est pas un bug unique mais une zone d'accumulation de risques.

`test/stats.test.js` est un troisième hotspot par défaut d'adéquation : ses 3 cas couvrent les chemins nominaux mais laissent tous les cas limites non testés, ce qui signifie que n'importe quelle régression sur les cas limites passerait inaperçue.

## Constats détaillés

**`src/stats.js:10-11` — Bug de médiane sur listes de taille paire.** `VÉRIFIÉ_CODE` : `median()` calcule l'index central via `Math.floor(sorted.length / 2)` et retourne `sorted[mid]` sans condition sur la parité. Pour une liste de taille paire `[1, 2, 3, 4]`, `mid = Math.floor(4/2) = 2`, donc `sorted[2] = 3`. La convention mathématique standard est la moyenne des deux valeurs centrales : `(sorted[1] + sorted[2]) / 2 = (2 + 3) / 2 = 2.5`. Ce comportement est confirmé `OBSERVÉ` par `npm test` (2026-08-04, SHA `a7038b1`) : le test `médiane d'une liste de taille paire` (`test/stats.test.js:13-16`) échoue avec `3 !== 2.5`. Ce n'est pas un flake — c'est un défaut structurel de l'implémentation, reproductible à chaque exécution.

**`bin/index.js:8-10` — Zone d'accumulation des risques d'entrée.** `VÉRIFIÉ_CODE` : trois lignes successives sans protection forment un chemin d'exécution risqué. Ligne 8 : `process.argv[2]` peut être `undefined` si aucun argument n'est fourni. Ligne 9 : `fs.readFileSync(chemin, "utf8")` peut lancer `TypeError` (si `undefined`), `ENOENT` (fichier absent), `EACCES` (permissions). Ligne 10 : `.map(Number)` produit silencieusement `NaN` sur les lignes non numériques et `0` sur les lignes vides. Aucun de ces cas n'est capturé ni signalé. Ce bloc est le seul point d'entrée de données dans le système — sa fragilité est proportionnelle à son importance.

**`test/stats.test.js` — 3 tests, couverture partielle.** `VÉRIFIÉ_CODE` : la suite couvre exactement trois cas : moyenne d'une liste simple (`test/stats.test.js:5-7`), médiane d'une liste impaire (`test/stats.test.js:9-11`), médiane d'une liste paire (`test/stats.test.js:13-16`). Aucun test sur : liste vide, tableau contenant `NaN`, liste à un élément, valeurs négatives, comportement du CLI sur argument manquant ou fichier absent. Le README désigne pourtant cette suite comme **référence comportementale** (`README.md`) — son faible taux de couverture des cas limites fragilise ce statut.

**`src/stats.js:3-5` — `mean()` correcte mais non testée sur NaN.** `VÉRIFIÉ_CODE` : `mean()` utilise `reduce((acc, v) => acc + v, 0)` puis divise par `values.length`. Comportement correct sur listes de nombres entiers/décimaux positifs. Sur tableau vide : `0 / 0 = NaN`. Sur tableau contenant `NaN` : `NaN + n = NaN` → résultat `NaN` pour tout tableau. Ces deux cas ne sont pas testés.

## Forces

- `src/stats.js` est entièrement constitué de fonctions pures : pas d'état global, pas d'effet de bord, testables en isolation (`VÉRIFIÉ_CODE` — `test/stats.test.js:1-3` les importe directement).
- La logique de tri dans `median()` (`[...values].sort((a, b) => a - b)`) utilise correctement une copie du tableau (`[...values]`) pour éviter de muter l'entrée (`src/stats.js:9`).
- Le code est lisible sans ambiguïté en moins d'une minute — sa brièveté est une force de maintenabilité.

## Dettes techniques

- Bug de `median` sur listes de taille paire (`src/stats.js:10-11`) : l'anomalie la plus critique du projet, confirmée par le test de référence en échec.
- `bin/index.js:8-10` sans garde : zone d'accumulation de cas d'erreur non traités.
- `test/stats.test.js` : couverture limitée aux cas nominaux, aucune protection sur les cas limites pourtant prévisibles.

## Zones critiques

- **`src/stats.js:10-11`** : ligne unique responsable de l'anomalie de médiane sur listes paires. La correction est localisée (2 lignes à modifier, 1 condition à ajouter sur la parité). Priorité haute.
- **`bin/index.js:8-10`** : zone d'entrée sans défense. Un utilisateur non informé peut produire un résultat `NaN` sans message d'erreur.

## Risques

- **Bug reproductible sur la fonctionnalité principale.** Tout fichier d'entrée de taille paire produit une médiane incorrecte sans avertissement. Impact : élevé si l'outil est utilisé pour des calculs statistiques réels. Preuve : `src/stats.js:10-11`, `npm test` OBSERVÉ au SHA `a7038b1`.
- **Régression non détectable sur les cas limites.** Toute modification future de `mean()` ou `median()` sur les cas limites (NaN, tableau vide, un élément) passera inaperçue — la suite n'y touche pas. Preuve : `test/stats.test.js` (3 tests, aucun sur les cas limites).

## Recommandations priorisées

1. **Corriger `median()` pour les listes de taille paire** (`src/stats.js:10-11`) : ajouter une condition `if (sorted.length % 2 === 0) { return (sorted[mid - 1] + sorted[mid]) / 2; }` pour implémenter la convention standard. Cette correction est la priorité absolue — elle rendra la suite de référence verte et alignera le comportement sur la spécification des tests.
2. **Ajouter des tests sur les cas limites** (`test/stats.test.js`) : liste vide, liste à un élément, valeur `NaN` dans l'entrée — au minimum pour `mean()` et `median()`. Le README désignant la suite comme référence, son adéquation aux cas limites est critique.
3. **Protéger `bin/index.js:8-10`** : voir recommandations de l'audit `SECURITY_ROBUSTNESS`.

## Questions ouvertes

- La correction de `median()` sur listes paires est-elle dans le périmètre immédiat ou l'état rouge du seed est-il maintenu intentionnellement pour une durée prolongée ?
- Faut-il tester le comportement du CLI (`bin/index.js`) lui-même, ou seulement les fonctions pures de `src/stats.js` ?
