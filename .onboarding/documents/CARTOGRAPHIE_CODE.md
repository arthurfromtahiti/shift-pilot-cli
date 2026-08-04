# CARTOGRAPHIE_CODE — shift-pilot-cli

> **Confiance** : high

## Vue d'ensemble : structure plate et minimaliste

```
shift-pilot-cli/
├── README.md                          [documentation, usage, seed state]
├── package.json                       [manifeste, scripts, constraints]
├── bin/
│   └── index.js                       [point d'entrée CLI, orchestration]
├── src/
│   └── stats.js                       [logique métier : mean, median]
└── test/
    └── stats.test.js                  [suite de tests, 3 cas, 1 RED]
```

**5 fichiers versionnés** ; ~40 lignes de code productif ; zéro dépendance externe npm.

## Fichiers par domaine

### Domaine `calcul-statistique`

**Rôle** : logique métier pure, module réutilisable.

**Fichier principal** : `src/stats.js` (14 lignes)

**Exports** :
```javascript
module.exports = { mean, median }
```

**Fonctions** :
- `mean(values)` — moyenne arithmétique
  - Ligne 3-5
  - Signature : `Array<number>` → `number | NaN`
  - Implémentation : `reduce((acc, v) => acc + v, 0) / values.length`
  - ✓ Correct, testé, preuve `test/stats.test.js:5-7`
  
- `median(values)` — médiane
  - Ligne 8-11
  - Signature : `Array<number>` → `number | NaN`
  - Implémentation : copie du tableau, tri croissant, retour index `Math.floor(length/2)`
  - ✓ Correct sur listes impaires, preuve `test/stats.test.js:9-11`
  - ✗ **ANOMALIE sur listes paires** : retourne index supérieur au lieu de moyenne des deux centraux, preuve `test/stats.test.js:13-16` (RED)

**Dépendances** : aucune.

**État observable** : 2 tests passent (`mean`, `median` impair), 1 échoue (`median` pair, test RED `test/stats.test.js:13-16`).

**Zone sensible** : ligne 10-11 (implémentation de médiane paire, source du test RED).

---

### Domaine `application-cli`

**Rôle** : orchestration complète, point d'entrée, packaging, distribution.

**Fichiers** :
- `bin/index.js` (12 lignes) — point d'entrée CLI
- `package.json` (entier) — manifeste et distribution
- `README.md` (entier) — documentation utilisateur et spécification

#### `bin/index.js`

**Rôle** : point d'entrée exécutable, orchestration complète.

**Shebang** : ligne 1 — `#!/usr/bin/env node` (exécutable directement).

**Responsabilités** (concentrées, non décomposées) :
1. **Lecture d'argument CLI** (ligne 8) : `const chemin = process.argv[2];`
   - Non validé — peut être `undefined`
   - Pas de option parsing (ex. `--help`, `--format`)
   
2. **Chargement du fichier** (ligne 9) : `const contenu = fs.readFileSync(chemin, "utf8");`
   - Synchrone, bloquant
   - Pas de `try/catch` — exceptions ENOENT/EACCES non gérées
   - Flux de sortie : crash process sur erreur
   
3. **Parsing et conversion** (ligne 10) : `const valeurs = contenu.trim().split("\n").map(Number);`
   - `trim()` → supprime espaces/retours en tête/queue
   - `split("\n")` → séparateur dur, pas de support `,` ou autres séparateurs
   - `map(Number)` → conversion native (ligne vide → `0`, non-numérique → `NaN`)
   - Pas de validation — NaN injecté silencieusement
   
4. **Calcul et affichage** (ligne 12) : `console.log(\`n=${valeurs.length} moyenne=${mean(valeurs)} mediane=${median(valeurs)}\`);`
   - Appel des fonctions `mean` et `median` du module `src/stats.js`
   - Format de sortie invariant : `n=<nombre> moyenne=<m> mediane=<d>`
   - Pas de formatage décimal supplémentaire

**Imports** (ligne 5-6) :
```javascript
const fs = require("fs");
const { mean, median } = require("../src/stats");
```

**Dépendances** : `src/stats.js` (logique métier) ; module natif `fs`.

**Observé** :
- Absence de gestion d'erreur : crash natif Node sur argument absent ou fichier inexistant
- Absence de validation d'entrée : NaN silencieusement injecté via `map(Number)`
- Responsabilités concentrées (I/O, parsing, orchestration, affichage) — 12 lignes non décomposées
- Pas de extraction de fonction testable pour parsing indépendant de CLI

**État du golden path** : fichier valide bien formé → résultat correct sur stdout (observable `npm test`, tests TC-CLI-001 et TC-CLI-002 en CAHIER_RECETTE).

**Zone sensible** : ligne 8-10 (argument absent, I/O, parsing — aucune garde).

---

#### `package.json`

**Rôle** : manifeste npm, déclaration de scripts et d'environnement, distribution.

**Clés essentielles** :

| Clé | Valeur | Rôle |
|-----|--------|------|
| `name` | `shift-pilot-cli` | Identifiant du package |
| `description` | `Pilote de test SHIFT/Paperclip — statistiques sur fichiers CSV` | Titre (contient terminologie imprécise « CSV ») |
| `type` | `commonjs` | Module system (CJS, pas ESM) |
| `engines.node` | `>=18` | Contrainte de moteur (non enforced par défaut) |
| `private` | `true` | Pas de publication npm prévue |
| `scripts.test` | `node --test test/*.test.js` | Lancement de la suite |
| `bin.pilot-stats` | `./bin/index.js` | Alias installable du binaire |

**Dépendances** :
- `dependencies` : aucune (module natif uniquement)
- `devDependencies` : aucune (tests en `node:test` natif)

**Zéro surface d'attaque chaîne d'approvisionnement npm** — aucune dépendance externe.

**Imprécision documentaire** : clé `description` mentionne « fichiers CSV » ; réalité = « un nombre par ligne ». Écart identifié entre déclaration et implémentation.

---

#### `README.md`

**Rôle** : documentation utilisateur et spécification comportementale.

**Sections essentielles** :

| Section | Contenu | Remarques |
|---------|---------|-----------|
| Titre | `shift-pilot-cli` | ✓ Clair |
| Description | Pilote de test SHIFT/Paperclip | ✓ Explicite ; état RED accepté |
| Usage | `node bin/index.js data.csv` | ⚠ Terminologie « CSV » imprécise ; réalité = un nombre par ligne |
| Suite de référence | *« La suite de tests fait référence : tout écart entre le comportement et les tests est une anomalie »* | ✓ Critique — renverse l'autorité, tests > code |
| Commentaire sur état RED | *« état assumé du seed »* (via commit) | ✓ Transparent sur médiane paire |

**Imprécision** : exemple `data.csv` et usage « CSV » ; fichier réel = un nombre par ligne (`data.txt` serait plus exact).

---

### Domaine `suite-tests`

**Rôle** : vérification comportementale, source de vérité du produit.

**Fichier principal** : `test/stats.test.js` (17 lignes)

**Framework** : `node:test` (natif Node ≥ 18) + `node:assert/strict`.

**Imports** (ligne 1-3) :
```javascript
const test = require("node:test");
const assert = require("node:assert/strict");
const { mean, median } = require("../src/stats");
```

**Tests** (3 total) :

#### Test 1 — Moyenne
- Ligne 5-7
- Cas : `mean([2, 4, 6])`
- Attendu : `4`
- État : ✓ PASS
- Preuve : moyenne correcte

#### Test 2 — Médiane impaire
- Ligne 9-11
- Cas : `median([9, 1, 5])`
- Attendu : `5`
- État : ✓ PASS
- Preuve : médiane impaire correcte

#### Test 3 — Médiane paire
- Ligne 13-16
- Cas : `median([1, 2, 3, 4])`
- Attendu : `2.5` (moyenne des deux centraux `2` et `3`)
- État : ✗ **RED**
- Raison : code retourne `3` (`sorted[Math.floor(4/2)] = sorted[2] = 3`)
- Preuves : commit `a7038b1` (« état assumé »), audit `FUNCTIONAL_AUDIT` §Anomalie

**Rapport** : `npm test` → `tests 3 · pass 2 · fail 1`, exit code `1`.

**Dépendances** : `src/stats.js` (module testé) ; modules natifs.

**Critères d'acceptation du domaine** :
- Tous les 3 tests passent
- Couverture des cas « moyenne simple », « médiane impaire », « médiane paire »
- Aucun test sur cas limites (vide, un élément, NaN) — hors périmètre actuel

**Zone critique** : test 3 (diagnostic de l'anomalie, rejet actuel du code).

---

## Points d'entrée (déclenchement)

### Point d'entrée principal — CLI
**Chemin** : `bin/index.js`

**Invocation** :
- `node bin/index.js <chemin-fichier>` — direct
- `pilot-stats <chemin-fichier>` — via alias npm (si `npm link` ou `npm install -g` utilisé)

**Arguments** :
- Positionnel `argv[2]` : chemin du fichier (aucune validation, aucune option)

**Sortie** : une seule ligne stdout : `n=<nombre> moyenne=<m> mediane=<d>`

**Code de sortie** :
- 0 : succès (improbable sans gestion d'erreur ; crash natif sur erreur)
- ≠ 0 : crash Node non piloté

---

### Point d'entrée secondaire — Tests
**Chemin** : `test/stats.test.js`

**Invocation** :
- `npm test` → résout `node --test test/*.test.js`
- `node --test test/stats.test.js` — direct

**Rapport** : stdout TAP-like avec résumé `tests <N> · pass <P> · fail <F>`, exit code 0 ou 1.

---

## Zones de concentration — éléments sensibles

### Zone A — Médiane paire (`src/stats.js:10-11`)
**Observation** : implémentation retourne l'élément à l'index `Math.floor(length/2)` au lieu de moyenner les deux centraux.

**Test RED associé** : `test/stats.test.js:13-16` échoue (AssertionError: 3 !== 2.5).

**Dépendances** : aucune dépendance depuis d'autres modules — changement localisé et isolé.

---

### Zone B — Terminologie « CSV »
**Incohérence** :
- `package.json:4` (clé `description`) dit « statistiques sur fichiers CSV »
- `bin/index.js:2` (commentaire) dit « CSV stats »
- `README.md` (section Usage) dit « `data.csv` »
- Implémentation réelle : `.split("\n").map(Number)` — parse un nombre par ligne uniquement

**Impact** : divergence entre intention déclarée (pseudo-CSV monocolonne) et fait observé.

**Dépendances** : aucune — problème de documentation, pas de code productif.

---

### Zone C — Gestion d'erreur absente (`bin/index.js:8-10`)
**Observation** : pas de `try/catch` pour captures ENOENT (fichier absent) ou TypeError (argument absent). Pas de validation pour lignes non numériques.

**Comportement observé** :
- Argument absent → TypeError Node brut
- Fichier absent → ENOENT Node brut
- Ligne non numérique → `Number()` → NaN silencieux

**Preuves** : `bin/index.js:8-10` (code brut) ; résultats observables via tests manuels (cas d'erreur non testés).

## Schéma d'import et dépendances

```
bin/index.js
  ├── require("fs")                   [natif Node]
  └── require("../src/stats")
      ├── mean()                       [fonction exportée]
      └── median()                     [fonction exportée]

test/stats.test.js
  ├── require("node:test")            [natif Node ≥ 18]
  ├── require("node:assert/strict")   [natif Node ≥ 18]
  └── require("../src/stats")
      ├── mean()
      └── median()

src/stats.js
  [aucune dépendance — fonctions pures]
```

**Observations** :
- Graphe d'import simple, pas de cycle, pas de dépendance externe npm
- `src/stats.js` testable en isolation
- `bin/index.js` dépend de `src/stats.js` mais contient aussi I/O non testée isolément

---

## Fichiers — Rôle et état

| Fichier | Rôle | État observé | Preuve |
|---------|------|--|---|
| `src/stats.js` | Cœur métier — calcul | Moyenne ✓, médiane impaire ✓, médiane paire ✗ | Test RED `test/stats.test.js:13-16` |
| `bin/index.js` | Point d'entrée — orchestration | Golden path ✓, gestion d'erreur absente | Pas de `try/catch` ; crashes bruts observés |
| `test/stats.test.js` | Autorité comportementale | 3 cas, 2 passent, 1 échoue (RED) | Exécution `npm test` |
| `package.json` | Manifeste de distribution | Dépendances nulles ; description incohérente | Zéro `dependencies` ; « CSV » vs. réalité |
| `README.md` | Documentation utilisateur | Incohérence terminologie | « CSV » vs. « un nombre par ligne » |

---

## Métriques structurelles

| Métrique | Valeur | Interprétation |
|----------|--------|-----------------|
| Fichiers versionnés | 5 | Minimaliste |
| Lignes de code productif | ~40 | Très court |
| Dépendances npm externes | 0 | Zéro risque chaîne d'approvisionnement |
| Modules Node natifs utilisés | 3 (`fs`, `test`, `assert/strict`) | Tous standard ≥ 18 |
| Niveaux de répertoires | 2 (`bin/`, `src/`, `test/`) | Plat, pas d'abstraction prématurée |
| Fonction(s) exportée(s) | 2 (`mean`, `median`) | API claire et nommée |

---

## Architecture globale et qualité

**Découpe** : `bin/` (IO + orchestration) vs. `src/` (logique pure) vs. `test/` (vérification).

**Qualité** :
- ✓ Module métier testé en isolation
- ✓ Zéro dépendance externe
- ✗ Pas de gestion d'erreur dans le point d'entrée
- ✗ Responsabilités mélangées dans `bin/index.js`
- ✗ Pas de fonction nommée intermédiaire pour testing du parsing

**Adaptation au rôle** : architecture juste pour la taille et le rôle (banc d'essai minimaliste). Serait problématique si le périmètre doublait.

---

## Mises à jour de la cartographie

Cette cartographie a été **reconfrontée au code courant le 2026-08-04** (réconciliation CLA-164). Aucun changement structural détecté depuis la première passe — code inchangé au SHA `a7038b1`, aucun artefact d'onboarding sur le distant. La présente cartographie est à jour.
