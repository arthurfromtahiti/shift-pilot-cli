# Points chauds du code — Audit

> Confiance : high

## Compréhension globale

Le projet ne compte que 3 fichiers de code (26 lignes au total) et 1 fichier de test (17 lignes). Il n'existe pas de « gros fichier » ni de « module surchargé » au sens usuel. Les points chauds sont ici définis par leur criticité fonctionnelle et leur fragilité observable — non par leur taille. Deux fichiers concentrent l'essentiel du risque : `src/stats.js` (logique métier — le bug de médiane paire a été corrigé en CLA-184) et `bin/index.js` (point d'entrée sans garde-fous).

## Résumé exécutif — MISE À JOUR CLA-251 + CLA-292

**Hotspots résolus :**
1. ~~`src/stats.js:10-11` — Médiane paire~~ : **CORRIGÉ (CLA-184, commit `6ad241d`)**. Suite 3/3 verte.
2. ~~`bin/index.js:10` — Parsing sans validation~~ : **CORRIGÉ (CLA-251, commit `159f8bf`)**. `parseValues()` extraite et testée. Suite 5/5 verte.

**Hotspot résiduel :**
- `bin/index.js:8-9` : argument CLI et lecture de fichier sans garde. Pas modifié par CLA-251 (hors périmètre).

**Suite de tests** : `test/stats.test.js` maintenant 5 cas, tous verts. Couverture étendue : fichier vide, valeur non-numérique. Cas limites restant non testés : liste à 1 élément, NaN dans entrée, valeurs négatives.

## Constats détaillés

**`src/stats.js:10-14` — Médiane sur listes de taille paire — CORRIGÉE (CLA-184).** `CORRIGÉ` : `median()` intègre désormais une condition de parité. Pour une liste de taille paire `[1, 2, 3, 4]`, `mid = Math.floor(4/2) = 2`, retourne `(sorted[1] + sorted[2]) / 2 = (2 + 3) / 2 = 2.5` ✓. Confirmé `OBSERVÉ` par `npm test` (SHA `6ad241d`) : `pass 3 / fail 0`. Historique : au SHA seed `a7038b1`, cette implémentation retournait `sorted[mid] = 3` sans condition de parité — défaut désormais résolu.

**`bin/index.js:8-10` — Zone d'entrée partiellement corrigée (CLA-251).** `VÉRIFIÉ_CODE` (SHA `f1cb153`) :
- Ligne 8 : `process.argv[2]` non gardée (PERSISTE) — peut être `undefined`.
- Ligne 9 : `fs.readFileSync(chemin, "utf8")` non gardée (PERSISTE) — peut lancer `ENOENT`, `EACCES`.
- Ligne 13 : `parseValues(contenu)` appelée (NOUVEAU — CLA-251) — enveloppe dans `try/catch` (lignes 12-17).
- Validation stricte : `.map(Number)` remplacé par `parseValues()` qui lève une erreur explicite sur fichier vide ou valeur non-numérique.

**`test/stats.test.js` — 5 tests, couverture améliorée (CLA-251).** `VÉRIFIÉ_CODE` (SHA `f1cb153`) : la suite couvre maintenant cinq cas :
- `test/stats.test.js:5-7` — moyenne d'une liste simple ✓
- `test/stats.test.js:9-11` — médiane d'une liste impaire ✓
- `test/stats.test.js:13-16` — médiane d'une liste paire ✓ (CLA-184)
- `test/stats.test.js:22-23` — `parseValues()` fichier vide → erreur ✓ (CLA-251)
- `test/stats.test.js:24` — `parseValues()` valeur non-numérique → erreur ✓ (CLA-251)

Cas limites restant non testés : liste à un élément, tableau contenant `NaN`, valeurs négatives, comportement du CLI sur argument manquant ou fichier absent.

**`src/stats.js:3-5` — `mean()` correcte mais non testée sur NaN.** `VÉRIFIÉ_CODE` (SHA `f1cb153`) : `mean()` utilise `reduce((acc, v) => acc + v, 0)` puis divise par `values.length`. Comportement correct sur listes de nombres entiers/décimaux positifs. Sur tableau contenant `NaN` : `NaN + n = NaN` → résultat `NaN`. Cas du tableau vide : maintenant **impossible** car `parseValues()` le rejette avant calcul (CLA-251). Cas du NaN dans l'entrée : **impossible** car `parseValues()` rejette les valeurs non-numériques avant calcul (CLA-251).

## Forces

- `src/stats.js` est entièrement constitué de fonctions pures : pas d'état global, pas d'effet de bord, testables en isolation (`VÉRIFIÉ_CODE` — `test/stats.test.js:1-3` les importe directement).
- La logique de tri dans `median()` (`[...values].sort((a, b) => a - b)`) utilise correctement une copie du tableau (`[...values]`) pour éviter de muter l'entrée (`src/stats.js:9`).
- Le code est lisible sans ambiguïté en moins d'une minute — sa brièveté est une force de maintenabilité.

## Dettes techniques

- ~~Bug de `median` sur listes de taille paire~~ : **CORRIGÉE** (CLA-184, commit `6ad241d`) — `src/stats.js:10-14` gère désormais correctement la parité.
- ~~`bin/index.js:10` : parsing sans validation~~ : **CORRIGÉE** (CLA-251, commit `159f8bf`) — `parseValues()` extraite et validante, tests verts.
- `bin/index.js:8-9` sans garde : zone d'erreur I/O non traitée (argument absent, fichier inexistant). Hors périmètre de CLA-251.
- `test/stats.test.js` : couverture étendue (CLA-251) mais aucune protection sur les cas limites (un élément, NaN, valeurs négatives).

## Zones critiques

- **`src/stats.js:10-14`** : médiane paire désormais correctement implémentée (CLA-184). Plus de hotspot critique sur ce point.
- **`bin/index.js:8-9`** : zone d'entrée I/O non gardée (argument absent, fichier inexistant). Hotspot résiduel — crash natif Node.
- **`src/stats.js:17-28`** (parseValues) : validation stricte en place (CLA-251) — tous les accès au calcul passe par cette fonction.

## Risques

- ~~**Bug reproductible sur la fonctionnalité principale.**~~ **RÉSOLU** (CLA-184, commit `6ad241d`) : `npm test` vert au SHA `f1cb153` (5/5). La médiane sur listes paires et la validation d'entrée sont désormais correctes.
- ~~**Parsing silencieux de NaN/0**~~ : **RÉSOLU** (CLA-251, commit `159f8bf`). `parseValues()` rejette explicitement fichier vide et valeurs non-numériques.
- **Régression non détectable sur les cas limites.** Toute modification future sur les cas limites (liste à 1 élément, valeurs négatives, décimales) passera inaperçue — la suite n'y touche pas. Preuve : `test/stats.test.js` (5 tests, aucun sur un élément/négatifs/décimaux).

## Recommandations priorisées

1. ~~**Corriger `median()` pour les listes de taille paire**~~ : **FAIT** (CLA-184, commit `6ad241d`). Suite de référence verte, comportement aligné sur la spécification des tests.
2. ~~**Valider les entrées**~~ : **FAIT** (CLA-251, commit `159f8bf`). `parseValues()` rejette fichier vide et valeurs non-numériques. Suite de référence verte (5/5).
3. **Ajouter des tests sur les cas limites** (`test/stats.test.js`) : liste à un élément, valeurs négatives, décimales. Le README désignant la suite comme référence, son adéquation aux cas limites serait utile.
4. **Protéger `bin/index.js:8-9`** : argument absent, fichier inexistant. Voir recommandations de l'audit `SECURITY_ROBUSTNESS`.

## Questions ouvertes

- Faut-il tester le comportement du CLI (`bin/index.js`) lui-même, ou seulement les fonctions pures de `src/stats.js` ?
