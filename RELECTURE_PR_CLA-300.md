# Relecture — CLA-300 : mise à jour .onboarding/ après CLA-251 et CLA-292

---

## Verdict — Passe 3 (2026-08-05, commit `0c1f009`)

> Relecteur : agent d2fa6c95 (Relecteur de documents)
> Branche relue : `onboarding/CLA-251-CLA-292-doc-updates`, tête `0c1f009`
> Code de référence relu : `src/stats.js` (31 lignes), `bin/index.js` (19 lignes), `test/stats.test.js` (24 lignes) — SHA `f1cb153`

### Verdict global

**À corriger** — 1 défaut bloquant subsiste (RB4 de passe 2 non appliqué) + 1 nouveau défaut mineur découvert.

---

### Corrections de passe 2 correctement appliquées ✓

- **[RB1]** CDC_FONCTIONNEL.md:256 — État Règle 5 : `✓ corrigée, test VERT depuis CLA-184` ✓
- **[RB2]** CDC_FONCTIONNEL.md:370 — Table preuves : `Médiane paire CORRIGÉE (CLA-184)` + `VÉRIFIÉ ✓` ✓
- **[RB3]** CDC_FONCTIONNEL.md:367 et :372 — Format d'entrée → `src/stats.js:22-23` ; gestion d'erreur → `try/catch autour de parseValues()` ✓
- **[RB5]** CDC_FONCTIONNEL.md:344-348 — "Fichier vide" retiré de la liste "non testés" ✓
- **[RM1]** CARTOGRAPHIE_CODE.md:16 — `[5 cas, 0 RED]` ✓
- **[RM2]** CARTOGRAPHIE_CODE.md:66 — `bin/index.js (19 lignes)` ✓
- **[RM3]** WORKFLOW_CALCULER_STATS.md:72-73 — `19 lignes` et `31 lignes` ✓

---

### Problème bloquant restant

#### RB4 — CARTOGRAPHIE_CODE.md Zone C (lignes 282–290) — Toujours stale

La Zone C n'a PAS été modifiée. Citation actuelle (tête `0c1f009`) :

```
### Zone C — Gestion d'erreur absente (`bin/index.js:8-10`)
**Observation** : pas de `try/catch` pour captures ENOENT (fichier absent) ou TypeError (argument absent). Pas de validation pour lignes non numériques.
**Comportement observé** :
- Ligne non numérique → `Number()` → NaN silencieux
**Preuves** : `bin/index.js:8-10` (code brut) ; résultats observables via tests manuels (cas d'erreur non testés).
```

**Trois affirmations factuellement fausses après CLA-251** (VÉRIFIÉ_CODE SHA `f1cb153`) :
1. "pas de try/catch" — FAUX : `bin/index.js:12-17` contient un `try/catch` autour de `parseValues()`.
2. "Pas de validation pour lignes non numériques" — FAUX : `parseValues()` (`src/stats.js:17-28`) lève `Error("Valeurs non-numériques : ...")`.
3. "Ligne non numérique → NaN silencieux" — FAUX : erreur explicite → `stderr` + `exit 1`.
4. "cas d'erreur non testés" — PARTIELLEMENT FAUX : 2 tests CLA-251 existent (`test/stats.test.js:18-24`).

**Ce qui reste vrai** : ENOENT et argument absent ne sont pas gardés (crashes Node bruts).

**Correction attendue** :
```markdown
### Zone C — Gestion d'erreur partielle (`bin/index.js`, `src/stats.js`)
**Observation** : `parseValues()` (`src/stats.js:17-28`) valide les lignes non-numériques et le fichier vide — levée d'erreur explicite. `bin/index.js:12-17` entoure l'appel à `parseValues()` d'un `try/catch` (→ `stderr` + `exit 1`). **Subsistent non gardés** : argument absent (TypeError brut) et fichier absent (ENOENT brut).

**Comportement observé** :
- Argument absent → TypeError Node brut (non capturé)
- Fichier absent → ENOENT Node brut (non capturé)
- Ligne non numérique → `Error("Valeurs non-numériques : ...")` → `stderr` + `exit 1` (CLA-251)
- Fichier vide → `Error("Le fichier est vide.")` → `stderr` + `exit 1` (CLA-251)

**Preuves** : `bin/index.js:12-17` (try/catch) ; `src/stats.js:17-28` (`parseValues`) ; `test/stats.test.js:18-24` (2 tests CLA-251, verts).
```

---

### Nouveau problème mineur

#### NM1 — CDC_FONCTIONNEL.md:263 — Numéro de ligne stale pour template literal

**Citation actuelle** : `**Codification** : \`bin/index.js:12\` — template literal.`

**Réalité** : Après CLA-251, la ligne 12 de `bin/index.js` est `try {`. Le template literal `console.log(...)` est désormais à la **ligne 19** (VÉRIFIÉ_CODE SHA `f1cb153`).

**Correction** : remplacer `bin/index.js:12` par `bin/index.js:19`.

---

### Recommandations de correction (ordonnées)

1. **[RB4]** CARTOGRAPHIE_CODE.md:282-290 — Réécrire Zone C (voir texte de remplacement ci-dessus).
2. **[NM1]** CDC_FONCTIONNEL.md:263 — `bin/index.js:12` → `bin/index.js:19`.

---

> Relecteur : agent d2fa6c95 (Relecteur de documents)
> Branche relue : `onboarding/CLA-251-CLA-292-doc-updates`, tête `0c1f009`
> Code de référence relu : `src/stats.js`, `bin/index.js`, `test/stats.test.js` — SHA `f1cb153`

---

## Verdict — Passe 2 (2026-08-05, commit `f4942d1`)

> Relecteur : agent d2fa6c95 (Relecteur de documents)
> Branche relue : `onboarding/CLA-251-CLA-292-doc-updates`, tête `f4942d1`
> Code de référence relu : `src/stats.js` (31 lignes), `bin/index.js` (19 lignes), `test/stats.test.js` (24 lignes) — SHA `f1cb153`

### Verdict global

**À corriger** — 5 défauts bloquants subsistent. Les 8 corrections demandées en passe 1 ont été majoritairement appliquées, mais plusieurs sections de table (preuves CDC) et une zone entière (Zone C de CARTOGRAPHIE_CODE.md) n'ont pas été mises à jour. 4 nouveaux défauts mineurs sont également identifiés.

---

### Corrections de passe 1 correctement appliquées ✓

- **[B1]** CLA-292 retirée de CARTE_DES_DOMAINES.md:5, CARTOGRAPHIE_CODE.md:361, CODE_HOTSPOTS_AUDIT.md:9 ✓
- **[B2]** WORKFLOW:37 — `(CORRIGÉ — CLA-184)` uniquement ✓
- **[B3]** CDC Règle 5 titre CORRIGÉE, Règle 7 → 5 tests/0 fail, État de référence → 5 cas corrects, question médiane paire retirée ✓
- **[B4]** CARTOGRAPHIE_CODE.md : 31 lignes src/stats.js, 5 tests, imports `parseValues` (test + bin), 3 exports, Zone A stable ✓
- **[M1]** CDC:187 → `src/stats.js:22-23` ✓ (corps du texte uniquement — table manquée, voir RB3 ci-dessous)
- **[M2]** CDC:339 — fichier vide noté comme testé ✓ (mais contradiction dans la liste 344-348, voir RB5)
- **[M4]** WORKFLOW:11 → 31 lignes src/stats.js, WORKFLOW:50 → `src/stats.js:22-23` ✓
- **[M5]** WORKFLOW:65 → "Fichier vide maintenant documenté et testé" ✓

---

### Problèmes bloquants restants

#### RB1 — CDC_FONCTIONNEL.md:256 — État contradictoire sous Règle 5 CORRIGÉE

**Contexte** : Règle 5 a été correctement renommée « CORRIGÉE » mais la ligne État à la fin de la section n'a pas été mise à jour.

**Citation actuelle** : `**État** : ✗ erronée, test RED, anomalie connue assumée au seed.`

**Réalité** : médiane paire correcte depuis CLA-184, test vert (`test/stats.test.js:13-16`, SHA `f1cb153`).

**Correction attendue** : `**État** : ✓ corrigée, test VERT depuis CLA-184 (commit \`6ad241d\`).`

---

#### RB2 — CDC_FONCTIONNEL.md:371 — Table preuves stale (médiane paire)

**Citation actuelle** : `| Médiane paire ANOMALIE | src/stats.js:10-11 + test test/stats.test.js:13-16 (RED) | VÉRIFIÉ ✗ |`

**Réalité** : médiane paire CORRIGÉE, test VERT (SHA `f1cb153`).

**Correction attendue** : `| Médiane paire CORRIGÉE (CLA-184) | src/stats.js:10-12 + test/stats.test.js:13-16 (VERT) | VÉRIFIÉ ✓ |`

---

#### RB3 — CDC_FONCTIONNEL.md:368 et :373 — Table preuves stale (format d'entrée + gestion d'erreur)

Deux entrées de la table de preuves n'ont pas été mises à jour :

| Ligne | Citation actuelle | Réalité (SHA f1cb153) |
|-------|-------------------|-----------------------|
| 368 | `\| Format d'entrée \| bin/index.js:10 (.split("\n").map(Number)) \| VÉRIFIÉ \|` | `parseValues()` est dans `src/stats.js:22-23` depuis CLA-251 |
| 373 | `\| Gestion d'erreur absente \| bin/index.js (pas de try/catch) \| OBSERVÉ \|` | `bin/index.js` a un `try/catch` autour de `parseValues()` depuis CLA-251 (lignes 12-17) |

**Correction attendue** :
- Ligne 368 → `| Format d'entrée | src/stats.js:22-23 (dans parseValues()) | VÉRIFIÉ ✓ |`
- Ligne 373 → retirer cette ligne ou la reformuler : `| Gestion d'erreur partielle | try/catch autour de parseValues() (bin/index.js:12-17) ; ENOENT et argument absent non gardés | OBSERVÉ |`

---

#### RB4 — CARTOGRAPHIE_CODE.md Zone C (lignes 282–290) — Entièrement stale après CLA-251

**Section complète** :
```
### Zone C — Gestion d'erreur absente (bin/index.js:8-10)
Observation : pas de try/catch pour captures ENOENT (fichier absent) ou TypeError (argument absent). Pas de validation pour lignes non numériques.
Comportement observé :
- Argument absent → TypeError Node brut
- Fichier absent → ENOENT Node brut
- Ligne non numérique → Number() → NaN silencieux
Preuves : bin/index.js:8-10 (code brut) ; résultats observables via tests manuels (cas d'erreur non testés).
```

**Trois affirmations fausses après CLA-251** (VÉRIFIÉ_CODE SHA `f1cb153`) :
1. "pas de try/catch" — FAUX : `bin/index.js:12-17` contient un `try/catch` autour de `parseValues()`.
2. "Pas de validation pour lignes non numériques" — FAUX : `parseValues()` lève `Error("Valeurs non-numériques : ...")`.
3. "Ligne non numérique → NaN silencieux" — FAUX : erreur explicite levée + stderr + exit 1.
4. "cas d'erreur non testés" — PARTIELLEMENT FAUX : 2 tests ajoutés par CLA-251 (`test/stats.test.js:18-24`).

**Ce qui reste vrai** : ENOENT et argument absent ne sont toujours pas gardés.

**Correction attendue** : réécrire Zone C pour distinguer ce qui a été résolu (validation non-numérique, try/catch) de ce qui persiste (ENOENT, argument absent) — en citant `bin/index.js:12-17` et `src/stats.js:17-28`.

---

#### RB5 — CDC_FONCTIONNEL.md:344-348 — "Fichier vide" dans liste "Scénarios non testés"

**Contexte** : La ligne 340 a été correctement mise à jour pour noter que le fichier vide est testé. Mais la liste "Scénarios documentés comme supposément OK mais non testés" (lignes 344-348) contient encore :
```
- Fichier vide
```

**Contradiction interne** : ligne 340 dit testé, ligne 345 dit non testé.

**Correction attendue** : retirer "Fichier vide" de la liste (lignes 344-348).

---

### Problèmes mineurs restants

#### RM1 — CARTOGRAPHIE_CODE.md:16 — Arbre de fichiers stale

**Citation** : `└── stats.test.js [suite de tests, 3 cas, 1 RED]`
**Réalité** : 5 cas, 0 RED (depuis CLA-184 + CLA-251).
**Correction** : `[suite de tests, 5 cas, 0 RED]`

---

#### RM2 — CARTOGRAPHIE_CODE.md:66 — Décompte de lignes stale pour bin/index.js

**Citation** : `bin/index.js (12 lignes)`
**Réalité** : 19 lignes (`wc -l bin/index.js` → 19, SHA `f1cb153`).
**Correction** : `bin/index.js (19 lignes)`

---

#### RM3 — WORKFLOW_CALCULER_STATS.md:72-73 — Décomptes de lignes stale dans section Preuves

**Citations** :
- Ligne 72 : `bin/index.js — fichier entier (12 lignes), lu à cette session`
- Ligne 73 : `src/stats.js — fichier entier (14 lignes), lu à cette session`

**Réalité** : bin/index.js → 19 lignes ; src/stats.js → 31 lignes.
**Correction** : mettre à jour les deux décomptes.

---

### Recommandations de correction (ordonnées)

1. **[RB4]** Réécrire CARTOGRAPHIE_CODE.md Zone C — c'est la section la plus trompeuse pour un nouvel arrivant.
2. **[RB1]** CDC_FONCTIONNEL.md:256 — corriger l'État de Règle 5.
3. **[RB2]** CDC_FONCTIONNEL.md:371 — corriger la ligne "Médiane paire ANOMALIE" dans la table preuves.
4. **[RB3]** CDC_FONCTIONNEL.md:368 et :373 — corriger les deux entrées stale de la table preuves.
5. **[RB5]** CDC_FONCTIONNEL.md:345 — retirer "Fichier vide" de la liste "non testés".
6. **[RM1]** CARTOGRAPHIE_CODE.md:16 — "[5 cas, 0 RED]".
7. **[RM2]** CARTOGRAPHIE_CODE.md:66 — "19 lignes".
8. **[RM3]** WORKFLOW_CALCULER_STATS.md:72-73 — "19 lignes" et "31 lignes".

---

> Relecteur : agent d2fa6c95 (Relecteur de documents)
> Branche relue : `onboarding/CLA-251-CLA-292-doc-updates`, tête `710431b`
> Code de référence relu : `src/stats.js`, `bin/index.js`, `test/stats.test.js` — SHA `f1cb153` (tête de `main`)
> Preuve CLA-292 : `git merge-base --is-ancestor abd4f12 HEAD` → **NOT ancestor**
> Artefacts couverts : CARTE_DES_DOMAINES.md, CARTOGRAPHIE_CODE.md, CDC_FONCTIONNEL.md, CODE_HOTSPOTS_AUDIT.md, WORKFLOW_CALCULER_STATS.md

---

## Verdict global

**À corriger** — 4 défauts bloquants. L'exécuteur a correctement documenté CLA-251 dans l'essentiel des sections, mais les artefacts contiennent des affirmations fausses sur CLA-292 (non mergée sur `main`), une contradiction interne grave dans CDC_FONCTIONNEL.md, et des sections stale non mises à jour dans CARTOGRAPHIE_CODE.md.

---

## Problèmes bloquants

### B1 — CLA-292 présentée comme mergée sur `main` alors qu'elle ne l'est pas

**Fichiers** : CARTE_DES_DOMAINES.md:5, CARTOGRAPHIE_CODE.md:361, CODE_HOTSPOTS_AUDIT.md:9

**Preuve** : `git merge-base --is-ancestor abd4f12 HEAD` → `abd4f12 is NOT ancestor of HEAD`. La branche `fix/CLA-292-filtrer-lignes-vides` porte `abd4f12` (Merge PR #4) mais n'a pas été mergée dans `main` (tête `f1cb153`) ni dans la branche documentaire courante.

- CARTE_DES_DOMAINES.md:5 : *« tête `f1cb153` (mise à jour post-CLA-251 et CLA-292) »* — faux, `f1cb153` est uniquement post-CLA-251.
- CARTOGRAPHIE_CODE.md:361 : *« mise à jour post-CLA-251 et CLA-292 (SHA `f1cb153`) »* — même erreur.
- CODE_HOTSPOTS_AUDIT.md:9 : titre *« MISE À JOUR CLA-251 + CLA-292 »* — CLA-292 n'est pas dans le code relu.

**Correction attendue** : retirer "et CLA-292" de toutes ces mentions (la doc reflète l'état `f1cb153`, soit CLA-251 uniquement), ou bloquer et attendre le merge réel de PR #4 dans `main`.

---

### B2 — Fausse attribution de CLA-292 à la correction de `median()`

**Fichier** : WORKFLOW_CALCULER_STATS.md:37

**Citation** : *« condition de parité : retourne `(sorted[mid-1] + sorted[mid]) / 2` si pair, `sorted[mid]` si impair (CORRIGÉ — CLA-184 + CLA-292) »*

**Preuve** : `git show 1953dd6 --stat` → seuls `src/stats.js` (parseValues) et `test/stats.test.js` sont touchés par CLA-292 ; `median()` est **intacte**. CLA-292 ajoute uniquement `.filter(l => l.trim() !== "")` dans `parseValues`, elle ne corrige pas `median()`. Seul CLA-184 (commit `6ad241d`) a corrigé la médiane.

**Correction attendue** : remplacer `(CORRIGÉ — CLA-184 + CLA-292)` par `(CORRIGÉ — CLA-184)`.

---

### B3 — Contradiction interne grave dans CDC_FONCTIONNEL.md

**Fichier** : CDC_FONCTIONNEL.md

Trois sections se contredisent frontalement :

| Section | Ligne | Ce qu'elle dit |
|---------|-------|----------------|
| Parcours 3 | 96 | Médiane paire **CORRIGÉ** (CLA-184) — comportement correct `2.5` décrit |
| Règle 5 | 243 | *« ACTUELLE (ERRONÉE) »* — décrit l'ancien bug (retourne `3` au lieu de `2.5`) |
| Règle 7 | 278 | *« 3 tests · 2 passent · 1 échoue (médiane paire) »* |
| État de référence | 355 | *« médiane paire erronée (test RED) »* |

**Preuve** : `src/stats.js:11-12` VÉRIFIÉ_CODE SHA `f1cb153` → `if (sorted.length % 2 === 0) { return (sorted[mid - 1] + sorted[mid]) / 2; }` — la parité est correctement gérée. `npm test` → 5 tests, 5 passent (dont médiane paire, `test/stats.test.js:13-16`).

**Correction attendue** : mettre à jour Règle 5 (la transformer en "CORRIGÉE — CLA-184", décrire le comportement correct), Règle 7 (5 tests, 0 fail), l'état de référence (5 cas, tous corrects).

---

### B4 — Sections stale non mises à jour dans CARTOGRAPHIE_CODE.md

**Fichier** : CARTOGRAPHIE_CODE.md

| Ligne | Affirmation | Réalité (VÉRIFIÉ_CODE SHA f1cb153) |
|-------|-------------|-------------------------------------|
| 27 | `src/stats.js (14 lignes)` | 31 lignes (`wc -l` : 31 lignes effectives avec parseValues) |
| 55 | *« 2 tests passent, 1 échoue (médiane pair, test RED) »* | 5 tests, 5 passent (`npm test` → pass 5 / fail 0) |
| 173 | `const { mean, median } = require("../src/stats")` | `test/stats.test.js:3` : `const { mean, median, parseValues } = require("../src/stats")` — `parseValues` manquant |
| 294–316 | Schéma d'imports : `parseValues` absent des imports de `test/stats.test.js` | Même erreur que ci-dessus |
| 340 | *« Fonction(s) exportée(s) : 2 (`mean`, `median`) »* | 3 : `module.exports = { mean, median, parseValues }` (`src/stats.js:31`) |
| 352–353 | *« ✗ Pas de fonction nommée intermédiaire pour testing du parsing »* | FAUX après CLA-251 — `parseValues` est précisément cette fonction, testée en isolation |
| 260–265 | Zone A : *« Test RED associé : test/stats.test.js:13-16 échoue (AssertionError: 3 !== 2.5) »* | Stale — ce test passe depuis CLA-184 |

---

## Problèmes mineurs

### M1 — CDC_FONCTIONNEL.md:187 — référence stale à `bin/index.js:10`

**Citation** : *« Codification : `bin/index.js:10` — `.split("\n").map(Number)` »* (Règle 1)

**Réalité** : `bin/index.js:10` est maintenant `try {`. Le split/map est dans `src/stats.js:22-23` (`parseValues`). Même erreur en ligne 367 (tableau de preuves).

---

### M2 — CDC_FONCTIONNEL.md:339 — fichier vide classé comme "non testé"

**Citation** : *« Cas limites non testés : fichier vide, liste à un seul élément… »*

**Réalité** : le fichier vide est testé depuis CLA-251 (`test/stats.test.js:18-20`). À retirer de la liste.

---

### M3 — CDC_FONCTIONNEL.md:383 — question ouverte obsolète

**Citation** : *« Médiane paire : le test RED est-il volontaire (seed pédagogique) ou non ? »*

La médiane paire est corrigée depuis CLA-184 ; le test est vert. Cette question n'a plus d'objet.

---

### M4 — WORKFLOW_CALCULER_STATS.md:11 et :50 — décompte de lignes et référence stale

- Ligne 11 : *« les 14 lignes de `src/stats.js` »* → 31 lignes.
- Ligne 50 : *« `valeurs` produit par `.trim().split("\n").map(Number)` (`bin/index.js:10`) »* → stale, désormais dans `parseValues()`, `src/stats.js:22-23`.

---

### M5 — WORKFLOW_CALCULER_STATS.md:65 — question ouverte erronée

**Citation** : *« Le comportement attendu sur un fichier vide ou à une seule ligne n'est ni documenté ni testé. »*

Le fichier vide est documenté et testé depuis CLA-251. Seul le cas "liste à un seul élément" reste ouvert.

---

## Points vérifiés et corrects

- **CLA-251 correctement documentée** dans la majorité des sections de chaque artefact : extraction de `parseValues`, validation stricte (fichier vide, valeur non-numérique), 2 nouveaux tests, `try/catch` dans `bin/index.js`.
- **CARTE_DES_DOMAINES.md:19** : `module.exports = { mean, median, parseValues }` — citation correcte avec SHA `f1cb153`.
- **CARTE_DES_DOMAINES.md section `application-cli`** : description de `parseValues(contenu)` comme délégation correcte (ligne 30).
- **CDC_FONCTIONNEL.md Parcours 3 et 6** : mises à jour correctes.
- **CDC_FONCTIONNEL.md Règle 2** : validation CLA-251 correctement décrite (`src/stats.js:17-28`).
- **CODE_HOTSPOTS_AUDIT.md** : document le mieux mis à jour des 5 ; les résolutions CLA-184 et CLA-251 sont bien retracées ; les numéros de lignes de `bin/index.js` (8-9, 13) sont corrects.
- **WORKFLOW_CALCULER_STATS.md §Risques** : barrements CLA-251 et CLA-184 corrects.

---

## Recommandations de correction (ordonnées)

1. **[B1]** Retirer "et CLA-292"/"+ CLA-292" de CARTE_DES_DOMAINES.md:5, CARTOGRAPHIE_CODE.md:361 et du titre CODE_HOTSPOTS_AUDIT.md:9. Ne documenter que ce qui est prouvé dans le code relu (SHA `f1cb153`).
2. **[B2]** WORKFLOW_CALCULER_STATS.md:37 — remplacer `(CORRIGÉ — CLA-184 + CLA-292)` par `(CORRIGÉ — CLA-184)`.
3. **[B3]** CDC_FONCTIONNEL.md — mettre à jour Règle 5 (médiane paire → CORRIGÉE), Règle 7 (5 tests, 0 fail), État de référence (ligne 355-360), Questions ouvertes (retirer M3 ci-dessus).
4. **[B4]** CARTOGRAPHIE_CODE.md — corriger les 7 points du tableau B4 ci-dessus (comptage lignes, état tests, imports test, schéma d'imports, exports, qualité, Zone A).
5. **[M1]** CDC_FONCTIONNEL.md:187 et :367 — pointer `src/stats.js:22-23` au lieu de `bin/index.js:10`.
6. **[M2]** CDC_FONCTIONNEL.md:339 — retirer "fichier vide" des cas limites non testés.
7. **[M4]** WORKFLOW_CALCULER_STATS.md:11 et :50 — mettre à jour le décompte de lignes et la référence au split/map.
8. **[M5]** WORKFLOW_CALCULER_STATS.md:65 — corriger la question ouverte (fichier vide est testé).
