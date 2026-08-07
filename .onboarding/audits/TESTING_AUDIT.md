# Tests — Audit

> Confiance : high

## Compréhension globale

La suite de tests est constituée de deux fichiers (`test/stats.test.js`, 44 lignes, 9 tests ; `test/cli.test.js`, 29 lignes, 3 tests), exécutés via `node --test test/*.test.js` (`package.json:7`). Elle utilise exclusivement des modules natifs Node.js (`node:test`, `node:assert/strict`) — aucune dépendance externe. Le `README.md` désigne explicitement cette suite comme la **référence comportementale** du produit : « La suite de tests fait référence : tout écart entre le comportement et les tests est une anomalie. »

Au SHA courant (2026-08-07), la suite est **verte** : `OBSERVÉ` en exécutant `npm test` → `tests 21 · pass 21 · fail 0`. Historiquement, au SHA `a7038b1` (2026-08-04), la suite était rouge à 3 tests.

## Résumé exécutif

La suite était rouge au seed (SHA `a7038b1`), mais a été progressivement enrichie et corrigée. Au SHA courant (2026-08-07), elle est verte avec 21 tests passants, couvrant :
- Cas nominaux stats : `mean([2,4,6])`, `median([9,1,5])`, `median([1,2,3,4])`
- Cas limites stats adressés : `mean([])` throw (SHIAAAAAAAAAAAAAAAAAAAAA-243), `median([])` throw (SHIAAAAAAAAAAAAAAAAAAAAA-329), `parseValues("")` throw, `parseValues("non-numérique")` throw, `parseValues("Infinity")` throw (SHIAAAAAAAAAAAAAAAAAAAAAAAA-295), `parseValues("-Infinity")` throw (SHIAAAAAAAAAAAAAAAAAAAAAAAA-295), `parseValues("guillemets")` (SHIAAAAAAAAAAAAAAAAAAAAA-398), `parseValues("cellule vide quotée")` throw (SHIAAAAAAAAAAAAAAAAAAAAA-405), `parseValues("hex/octal/binaire/scientifique")` throw (SHIAAAAAAAAAAAAAAAAAAAAA-448), `parseValues("lignes vides")` filtrées
- Tests CLI : sans argument → usage + exit 1, usage sans `.csv`, fichier inexistant → message clair, chemin dossier → EISDIR
- Couverture restante non couverte : valeur NaN en entrée.

Il n'y a pas de configuration CI visible dans les fichiers versionnés — aucun fichier GitHub Actions, aucun `.travis.yml`, aucun `Jenkinsfile` — ni de couverture de code instrumentée.

## Constats détaillés

**État réel de la suite (`OBSERVÉ`, 2026-08-07).** Exécution : `npm test` → `node --test test/*.test.js` (`package.json:7`). État : **verte**, 21 tests passants.
- Tests 1–3 (nominaux stats) : `mean([2,4,6])` ✔, `median([9,1,5])` ✔, `median([1,2,3,4])` ✔
- Tests 4–7 (limites stats) : `parseValues("")` throw ✔, `parseValues("non-numérique")` throw ✔, `mean([])` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-243), `median([])` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-329)
- Tests 8–11 (Infinity et citations) : `parseValues("Infinity")` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAAAAA-295), `parseValues("-Infinity")` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAAAAA-295), `parseValues("lignes vides")` filtrées ✔, `parseValues("guillemets doubles")` ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-398)
- Tests 12–17 (Excel, cellules vides, notations non-décimales) : `parseValues("guillemets + valeur invalide")` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-398), `parseValues('""' cellule vide)` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-405), `parseValues("0xAB" hex)` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-448), `parseValues("1e2" scientifique)` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-448), `parseValues("0o12" octal)` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-448), `parseValues("0b101" binaire)` throw ✔ (SHIAAAAAAAAAAAAAAAAAAAAA-448)
- Tests 18–21 (CLI) : sans argument → usage + exit 1 ✔, usage sans `.csv` ✔, fichier inexistant → message clair ✔, chemin dossier → EISDIR ✔

**Correction médiane paire (`RÉSOLU`, SHA `38a7ba5`).** `src/stats.js:14-16` : implémentation correcte avec condition sur la parité. Pour `[1,2,3,4]`, teste `length % 2 === 0` (vrai), retourne moyenne des deux centrales `(sorted[1] + sorted[2]) / 2 = 2.5`. Le test `test/stats.test.js:15` valide cette correction.

**Garde tableau vide dans `median()` (`RÉSOLU`, SHA `77da3f0`, SHIAAAAAAAAAAAAAAAAAAAAA-329).** `src/stats.js:12-14` : ajout d'une vérification explicite pour rejeter les tableaux vides avec le même message d'erreur que `mean([])` : `"Aucune valeur numérique à analyser dans ce fichier."`. Cette correction aligne le comportement de `median([])` sur celui de `mean([])` — tous deux lèvent maintenant une erreur intelligible plutôt que de retourner `undefined`. Le test `test/stats.test.js:38-40` valide ce comportement.

**Couverture des cas nominaux.** `VÉRIFIÉ_CODE` : les 3 tests couvrent `mean([2,4,6])` → `4` (`test/stats.test.js:5-7`), `median([9,1,5])` → `5` (`test/stats.test.js:9-11`), `median([1,2,3,4])` → `2.5` (`test/stats.test.js:13-16`). Ces cas vérifient le bon fonctionnement sur des entrées propres et bien formées.

**Cas limites couverts.** Recherche dans `test/stats.test.js` : cas limites trouvés et testés. `mean([])` → `throw Error("Aucune valeur numérique à analyser dans ce fichier.")` (test 6, validé SHA `38a7ba5`, SHIAAAAAAAAAAAAAAAAAAAAA-243). `median([])` → `throw Error("Aucune valeur numérique à analyser dans ce fichier.")` (test 10, validé SHA `77da3f0`, SHIAAAAAAAAAAAAAAAAAAAAA-329). `parseValues("")` → throw (test 4). `parseValues("valeur invalide")` → throw (test 5). `parseValues("Infinity")` → throw (test 7, SHIAAAAAAAAAAAAAAAAAAAAAAAA-295). `parseValues("-Infinity")` → throw (test 8, SHIAAAAAAAAAAAAAAAAAAAAAAAA-295). Comportement sur NaN d'entrée : `mean([NaN, 2])` non couvert (infection NaN dans le `reduce`).

**Cas limites `Infinity`/`-Infinity` couverts (`VÉRIFIÉ_CODE`, SHIAAAAAAAAAAAAAAAAAAAAAAAA-295).** `parseValues("Infinity")` et `parseValues("-Infinity")` lèvent une erreur `"Valeurs non-numériques : Infinity"` / `"Valeurs non-numériques : -Infinity"` via la validation regex stricte décimale, couverte par 2 tests.

**Cas limites notations non-décimales couverts (`VÉRIFIÉ_CODE`, SHIAAAAAAAAAAAAAAAAAAAAA-448).** `parseValues()` utilise depuis cette issue la regex `/^[+-]?\d+(\.\d+)?$/` qui rejette les notations hex (`0x…`), octal (`0o…`), binaire (`0b…`), et scientifique (`1e2`), tous levant `"Valeurs non-numériques : <valeur>"`. Ces 4 cas sont désormais explicitement testés et passants (`test/stats.test.js`).

**Absence de CI.** Recherche sur `.github/`, `workflows/`, `.travis.yml`, `Jenkinsfile`, `CircleCI`, `Makefile` dans les fichiers versionnés — non localisé. `git ls-files` retourne 37 fichiers (incluant la structure `.onboarding/`). `HYPOTHÈSE` : aucune exécution automatique de la suite n'est configurée sur ce dépôt.

**Aucun outil de couverture.** Recherche sur `c8`, `nyc`, `istanbul`, `--experimental-test-coverage` dans `package.json` — non localisé. La couverture de code n'est pas mesurée.

**Moteur Node ≥ 18 nécessaire.** `VÉRIFIÉ_CODE` : `node:test` et `node:assert/strict` en modules natifs n'existent pas avant Node 18 — lecture de `package.json:7` et `test/stats.test.js:1` le confirme. `OBSERVÉ` : exécution confirmée sur Node 24.18.0 (`node --version`). `HYPOTHÈSE` : sur Node < 18, la suite échouerait à l'import sans message d'erreur explicite sur la version — plausible au regard de la documentation Node, mais non vérifié dans ce run.

**Glob `test/*.test.js`.** `VÉRIFIÉ_CODE` : le script npm `test` utilise le glob `test/*.test.js` (`package.json:7`). Deux fichiers correspondent actuellement : `test/stats.test.js` et `test/cli.test.js`. Un test ajouté dans `test/unit/` ou `test/integration/` ne serait pas ramassé par ce glob.

## Forces

- Modules natifs Node.js uniquement (`node:test`, `node:assert/strict`) : aucune dépendance de test externe, pas de risque de breaking change lié à une mise à jour Jest ou Mocha.
- Assertions strictes (`node:assert/strict`) : pas de coercition de type — `assert.equal(3, 2.5)` échoue correctement (`test/stats.test.js:2`).
- Les tests des cas nominaux et limites sont corrects et documentent le comportement attendu de référence.
- Couverture CLI étendue : arguments manquants, usage, erreurs, et messages d'erreur testés.

## Dettes techniques

- Couverture des cas limites : valeurs NaN en entrée (`mean([NaN, 2])`) reste non couverte malgré l'amélioration générale (de 12 à 21 tests)
- Pas de CI configuré : aucune exécution automatique de la suite sur push ou PR.
- Pas de mesure de couverture instrumentée.

## Zones critiques

- Couverture NaN : aucun test pour `mean([NaN, 2])` ou autres contaminations NaN — c'est un cas limite non couverte restante, bien que la couverture générale ait progressé significativement (21 tests, dont 4 nouveaux pour notations non-décimales).

## Risques

- **Régression invisible sur NaN** : aucun test pour contamination NaN (`mean([NaN, 2])`). Comportement avec NaN indéfini — reste le seul cas limite non couvert.
- Suite est désormais robuste pour les entrées non-décimales (hex, octal, binaire, scientifique) grâce à SHIAAAAAAAAAAAAAAAAAAAAA-448 — risque résiduel limité à NaN.

## Recommandations priorisées

1. **Ajouter le cas limite NaN manquant dans `test/stats.test.js`** : un test pour `mean([NaN, 2])` pour confirmer le comportement attendu (contamination NaN ou rejet explicite). Les notations non-décimales sont maintenant couvertes (SHIAAAAAAAAAAAAAAAAAAAAA-448). `mean([])`, `median([])`, hex/octal/binaire/scientifique sont tous testés et passants.
2. **Configurer un pipeline CI minimal** (ex. GitHub Actions : `npm test` sur push) si le dépôt est destiné à recevoir des contributions ou à être utilisé en pipeline. La suite est maintenant verte et peut passer en CI.
3. **Élargir le glob** de `test/*.test.js` à `test/**/*.test.js` dans `package.json:7` si des sous-dossiers de tests sont envisagés.

## Questions ouvertes

- Le comportement attendu pour NaN en entrée (`mean([NaN, 2])`) : doit-il être une erreur explicite ou silencieusement propagé ? Décision impacte `parseValues()`.
- Y a-t-il un pipeline CI (GitHub Actions, etc.) prévu sur ce dépôt ? La suite étant verte, elle peut passer en CI immédiatement.
