# WORKFLOW_EXECUTER_SUITE_TESTS — Vérifier le comportement de mean/median par la suite de tests

## Classification
- **Type** : `technical_flow`
- **Sous-type** : exécution de suite de tests comportementaux
- **Visibilité** : internal_user
- **Acteur principal** : développeur (humain ou CI)
- **Acteurs** : développeur ; moteur Node.js ≥ 18 ; `node:test` ; `node:assert/strict`
- **Criticité** : Haute — le README désigne explicitement cette suite comme **référence comportementale** : *« La suite de tests fait référence : tout écart entre le comportement et les tests est une anomalie »* ; un échec signale une anomalie du code de production, pas du test
- **Confiance** : high
- **Justification** : `test/stats.test.js` (17 lignes) et `package.json` entièrement lus ; comportement réel observé (`OBSERVÉ`) via le résultat d'exécution documenté dans la CARTE_DES_DOMAINES et le message de commit seed.

## Objectif
Permettre à un développeur (ou à un CI) de vérifier en une commande que les fonctions `mean` et `median` de `src/stats.js` se comportent conformément à la spécification de référence. La suite est la source de vérité comportementale du produit — non le code, qui peut dériver. Actuellement en **état rouge** au SHA `a7038b1` : 2 tests passent, 1 échoue (médiane paire).

## Acteurs
- Développeur ou pipeline CI
- Moteur Node.js ≥ 18 (contrainte `engines.node >= 18` dans `package.json:8`)
- Module natif `node:test` (lanceur de tests intégré à Node depuis v18)
- Module natif `node:assert/strict` (assertions en mode strict)

## Points d'entrée
- `npm test` → résout `node --test test/*.test.js` (`package.json:6`, clé `scripts.test`)
- Ou directement : `node --test test/stats.test.js`

## Étapes principales
1. **Déclenchement** : `npm test` résout le script `test` dans `package.json` et lance `node --test test/*.test.js`
2. **Chargement du fichier de test** : Node charge `test/stats.test.js` et importe `{ mean, median }` via `require("../src/stats")` (`test/stats.test.js:3`)
3. **Test 1 — moyenne simple** : `mean([2, 4, 6])` est comparé à `4` via `assert.equal` (`test/stats.test.js:5-7`) → **PASSE**
4. **Test 2 — médiane impaire** : `median([9, 1, 5])` est comparé à `5` via `assert.equal` (`test/stats.test.js:9-11`) → **PASSE**
5. **Test 3 — médiane paire** : `median([1, 2, 3, 4])` est comparé à `2.5` via `assert.equal` (`test/stats.test.js:13-16`) → **ÉCHOUE** — le code renvoie `3` (`src/stats.js:10-11`), l'assertion attend `2.5`
6. **Rapport** : `node:test` produit un rapport sur stdout : `tests 3 · pass 2 · fail 1`, exit code `1`

## Règles métier
- **Assertions strictes** : `require("node:assert/strict")` — les comparaisons utilisent `===`, sans coercition de type (`test/stats.test.js:2`)
- **Convention de médiane paire attendue** : la moyenne des deux valeurs centrales, commentaire explicite `// Convention standard : moyenne des deux valeurs centrales.` (`test/stats.test.js:14`)
- **La suite, pas le code, est la référence** : `README.md` inverse volontairement la relation de vérité — le test dit ce que le comportement *doit* être, le code est ce qui *peut dériver*
- **Seed en échec assumé** : le message de commit `a7038b1` (*« la médiane paire est en échec — état assumé du seed »*) confirme que l'état rouge est intentionnel au départ du dépôt, pas un accident

## Données
- Entrées de test : tableaux de nombres en dur dans `test/stats.test.js` (`[2,4,6]`, `[9,1,5]`, `[1,2,3,4]`)
- Valeurs attendues : `4`, `5`, `2.5` (toutes en dur dans les assertions)
- Sortie : rapport TAP-like produit par `node:test` sur stdout ; exit code `0` (tout passe) ou `1` (au moins un échec)

## Intégrations
- Aucune intégration externe — uniquement des modules natifs Node.js (`node:test`, `node:assert/strict`, `node:fs` non utilisé dans les tests)

## Risques
- **Suite rouge au SHA a7038b1** : `npm test` échoue systématiquement sur le test 3 → tout CI qui bloque sur les tests échouerait à l'état de seed. (`test/stats.test.js:13-16`, `src/stats.js:10-11`)
- **Aucun test sur les cas limites** : liste vide, valeurs NaN, liste à un élément, fichier absent en CLI — une régression sur ces cas passerait inaperçue dans la suite actuelle. (`test/stats.test.js` — 3 tests uniquement)
- **Dépendance Node ≥ 18 non vérifiée automatiquement** : `node:test` n'existe pas en Node 16 ; la suite ne s'exécute tout simplement pas sur un environnement plus ancien. Npm ne vérifie pas `engines` par défaut. (`package.json:8`)
- **Glob `test/*.test.js` ne ramasse pas les sous-dossiers** : si des tests sont organisés dans `test/unit/` ou `test/integration/`, ils seraient ignorés. (`package.json:6`)

## Questions ouvertes
- La correction de la médiane paire est-elle prévue à court terme, ou l'état rouge initial est-il voulu pour tester la chaîne CI/Paperclip ?
- Y a-t-il un plan pour couvrir les cas limites (liste vide, NaN, argument manquant en CLI) ?
- Un environnement CI est-il configuré sur ce dépôt (GitHub Actions, etc.) ? Aucune trace visible dans les 5 fichiers versionnés.

## Preuves
- `test/stats.test.js` (fichier entier, 17 lignes — `VÉRIFIÉ_CODE`)
- `package.json` (clés `scripts.test`, `engines` — `VÉRIFIÉ_CODE`)
- `src/stats.js` (import réel consommé par les tests — `VÉRIFIÉ_CODE`)
- Résultat d'exécution `npm test` : `tests 3 · pass 2 · fail 1` — `OBSERVÉ` (documenté dans CARTE_DES_DOMAINES et message de commit `a7038b1`)
