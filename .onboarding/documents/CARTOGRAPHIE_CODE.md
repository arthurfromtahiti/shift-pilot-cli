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
│   └── stats.js                       [logique métier : mean, median, parseValues]
└── test/
    └── stats.test.js                  [suite de tests, 5 cas, 0 RED]
```

**5 fichiers versionnés** ; ~40 lignes de code productif ; zéro dépendance externe npm.

## Fichiers par domaine

### Domaine `calcul-statistique`

**Rôle** : logique métier pure, module réutilisable.

**Fichier principal** : `src/stats.js` (31 lignes)

**Exports** :
```javascript
module.exports = { mean, median, parseValues }
```

**Fonctions** :
- `mean(values)` — moyenne arithmétique
  - Ligne 3-5
  - Signature : `Array<number>` → `number | NaN`
  - Implémentation : `reduce((acc, v) => acc + v, 0) / values.length`
  - ✓ Correct, testé, preuve `test/stats.test.js:5-7`
  
- `median(values)` — médiane
  - Ligne 8-14
  - Signature : `Array<number>` → `number | NaN`
  - Implémentation : copie du tableau, tri croissant, condition de parité — retourne moyenne des deux centraux si pair, élément central si impair
  - ✓ Correct sur listes impaires et paires, preuve `test/stats.test.js:9-11` et `test/stats.test.js:13-16`, SHA `f1cb153`
  
- `parseValues(content)` — validation et parsing du contenu du fichier (NOUVEAU — CLA-251)
  - Ligne 17-28
  - Signature : `string` → `Array<number>` ou lève `Error`
  - Implémentation : `.trim()` le contenu, rejette si vide, `.split("\n")` en lignes, `.map(Number)` chaque ligne, filtre les invalides (où `Number.isNaN(values[i])`), lève une erreur si invalides détectées
  - ✓ Validation stricte, tests verts `test/stats.test.js:22-24`, SHA `f1cb153`

**Dépendances** : aucune.

**État observable** : 5 tests passent (`mean`, `median` impair, `median` pair, fichier vide, valeur non-numérique). Tous verts depuis CLA-184.

**Zone sensible** : aucune. Le code est stable et tous les tests passent.

---

### Domaine `application-cli`

**Rôle** : orchestration complète, point d'entrée, packaging, distribution.

**Fichiers** :
- `bin/index.js` (19 lignes) — point d'entrée CLI
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
   
3. **Parsing et validation** (ligne 13) : `valeurs = parseValues(contenu)` (CORRIGÉ — CLA-251)
   - Délègue à `src/stats.js:17-28` la validation complète
   - Lève une erreur explicite si fichier vide ou contient des valeurs non-numériques
   - Le `try/catch` (ligne 12-17) intercepte et affiche l'erreur sur stderr, puis quitte avec code 1
   - Comportement amélioré : rejet des entrées invalides au lieu d'injection silencieuse de NaN
   
4. **Calcul et affichage** (ligne 19) : `console.log(\`n=${valeurs.length} moyenne=${mean(valeurs)} mediane=${median(valeurs)}\`);`
   - Appel des fonctions `mean` et `median` du module `src/stats.js`
   - Format de sortie invariant : `n=<nombre> moyenne=<m> mediane=<d>`
   - Pas de formatage décimal supplémentaire

**Imports** (ligne 5-6) :
```javascript
const fs = require("node:fs");
const { mean, median, parseValues } = require("../src/stats");
```

**Dépendances** : `src/stats.js` (logique métier) ; module natif `fs`.

**Observé** :
- Absence de gestion d'erreur I/O : crash natif Node sur argument absent ou fichier inexistant (non modifié par CLA-251)
- Validation d'entrée améliorée (CLA-251) : `parseValues()` extraite et testée en isolation
- Responsabilités concentrées (I/O, orchestration, affichage) mais parsing validant extrait vers `src/stats.js`
- Parsing maintenant testable indépendamment de CLI (tests `test/stats.test.js:22-24`)

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
const { mean, median, parseValues } = require("../src/stats");
```

**Tests** (5 total, mise à jour CLA-251) :

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
- État : ✓ **PASS** (CORRIGÉ — CLA-184, commit `6ad241d`)
- Preuve : code retourne maintenant `2.5` (`if (parité paire) return (sorted[mid-1] + sorted[mid]) / 2`)
- Preuves : commit `6ad241d`, test vert, audit `FUNCTIONAL_AUDIT` §Anomalie (CORRIGÉE)

#### Test 4 — parseValues — fichier vide → erreur
- Ligne 22-23 (NOUVEAU — CLA-251)
- Cas : `parseValues("")`
- Attendu : levée de `Error("Le fichier est vide.")`
- État : ✓ PASS
- Preuve : `src/stats.js:18-20` lève l'erreur, test intercepte et valide

#### Test 5 — parseValues — valeur non-numérique → erreur
- Ligne 24 (NOUVEAU — CLA-251)
- Cas : `parseValues("1\nabc\n3")`
- Attendu : levée de `Error("Valeurs non-numériques : abc")`
- État : ✓ PASS
- Preuve : `src/stats.js:24-27` détecte `"abc"` comme invalide, lève l'erreur

**Rapport** : `npm test` → `tests 5 · pass 5 · fail 0`, exit code `0` (tous verts — CLA-251 + CLA-184 corrigés).

**Dépendances** : `src/stats.js` (module testé) ; modules natifs.

**Critères d'acceptation du domaine** :
- Tous les 5 tests passent ✓
- Couverture : « moyenne simple », « médiane impaire », « médiane paire », « fichier vide », « valeur non-numérique »
- Aucun test sur cas limites (un élément, NaN dans l'entrée) — hors périmètre actuel

**Zone critique** : tests 4-5 (nouveaux, validation de `parseValues()` — CLA-251).

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
**Observation** : implémentation corrigée (CLA-184) — retourne maintenant `(sorted[mid-1] + sorted[mid]) / 2` pour les listes paires.

**Test associé** : `test/stats.test.js:13-16` passe depuis CLA-184 (AssertionError résolu).

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

### Zone C — Gestion d'erreur partielle (`bin/index.js`, `src/stats.js`)
**Observation** : `parseValues()` (`src/stats.js:17-28`) valide les lignes non-numériques et le fichier vide — levée d'erreur explicite. `bin/index.js:12-17` entoure l'appel à `parseValues()` d'un `try/catch` (→ `stderr` + `exit 1`). **Subsistent non gardés** : argument absent (TypeError brut) et fichier absent (ENOENT brut).

**Comportement observé** :
- Argument absent → TypeError Node brut (non capturé)
- Fichier absent → ENOENT Node brut (non capturé)
- Ligne non numérique → `Error("Valeurs non-numériques : ...")` → `stderr` + `exit 1` (CLA-251)
- Fichier vide → `Error("Le fichier est vide.")` → `stderr` + `exit 1` (CLA-251)

**Preuves** : `bin/index.js:12-17` (try/catch) ; `src/stats.js:17-28` (`parseValues`) ; `test/stats.test.js:18-24` (2 tests CLA-251, verts).

## Schéma d'import et dépendances

```
bin/index.js
  ├── require("fs")                   [natif Node]
  └── require("../src/stats")
      ├── mean()                       [fonction exportée]
      ├── median()                     [fonction exportée]
      └── parseValues()                [fonction exportée]

test/stats.test.js
  ├── require("node:test")            [natif Node ≥ 18]
  ├── require("node:assert/strict")   [natif Node ≥ 18]
  └── require("../src/stats")
      ├── mean()
      ├── median()
      └── parseValues()

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
| `src/stats.js` | Cœur métier — calcul + validation | Moyenne ✓, médiane ✓, parseValues() ✓ | Tests 5/5 verts (CLA-251 + CLA-184) |
| `bin/index.js` | Point d'entrée — orchestration | Golden path ✓, validation appelée, I/O non gardée | `try/catch` autour parseValues ; pas de garde argument/fichier |
| `test/stats.test.js` | Autorité comportementale | 5 cas, tous passent (verts) | Exécution `npm test` → tests 5 / pass 5 / fail 0 |
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
| Fonction(s) exportée(s) | 3 (`mean`, `median`, `parseValues`) | API claire et nommée |

---

## Architecture globale et qualité

**Découpe** : `bin/` (IO + orchestration) vs. `src/` (logique pure) vs. `test/` (vérification).

**Qualité** :
- ✓ Module métier testé en isolation
- ✓ Zéro dépendance externe
- ✓ Fonction nommée `parseValues()` pour testing du parsing (CLA-251)
- ✓ Gestion d'erreur au point d'entrée (try/catch dans bin/index.js)
- ✗ Responsabilités mélangées dans `bin/index.js` (IO et orchestration)

**Adaptation au rôle** : architecture juste pour la taille et le rôle (banc d'essai minimaliste). Serait problématique si le périmètre doublait.

---

## Mises à jour de la cartographie

Cette cartographie a été **reconfrontée au code courant le 2026-08-04** (réconciliation CLA-164), puis **mise à jour post-CLA-251 (SHA `f1cb153`)**. 

Changements appliqués :
- `src/stats.js` : ajout de la fonction `parseValues()` (CLA-251), implémentation de validation stricte
- `bin/index.js` : appel à `parseValues()` au lieu de parsing direct, ajout du `try/catch`
- `test/stats.test.js` : 2 nouveaux tests pour `parseValues()` fichier vide et valeur non-numérique (CLA-251)
- Artefact `.onboarding/` : mis à jour pour refléter le code actuel (cette cartographie)

La présente cartographie est à jour au SHA `f1cb153`.
