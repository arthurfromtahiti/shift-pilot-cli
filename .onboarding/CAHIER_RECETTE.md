# CAHIER_RECETTE — shift-pilot-cli

> **Confiance** : high

Parcours de test et critères d'acceptation pour valider le comportement fonctionnel de l'outil.

## Vue d'ensemble

**Modes de test** :
1. **Tests unitaires** (automatisés) — `npm test` → `node:test` + `node:assert/strict`
2. **Tests d'intégration** (manuels) — invocation CLI avec fichiers de test, observation directe
3. **Tests de régression** (critique) — ensemble de cas qui doivent rester corrects après modification

**Environnement requis** : Node.js ≥ 18.

**Setup** : cloner le dépôt, `npm install` (installe aucune dépendance externe), on est prêt.

---

## Cas de test automatisés (unitaires)

Exécutés via `npm test` (`node --test test/*.test.js`).

### TC-AUTO-001 — Moyenne simple (UNITAIRE)

**Objectif** : vérifier que `mean()` calcule correctement la moyenne arithmétique.

**Cas de test** : `mean([2, 4, 6])`

**Condition d'exécution** : test implémenté en `test/stats.test.js:5-7`.

**Entrée** : tableau `[2, 4, 6]`.

**Attendu** : `4`.

**Réel** : `4` ✓

**Statut** : **PASS** — critère d'acceptation valide.

**Commande** : `npm test` → affiche résultat du test 1.

**Preuves** :
- Code : `src/stats.js:3-5` (implémentation de `mean`)
- Test : `test/stats.test.js:5-7`

---

### TC-AUTO-002 — Médiane impaire (UNITAIRE)

**Objectif** : vérifier que `median()` calcule correctement la médiane d'une liste de taille impaire.

**Cas de test** : `median([9, 1, 5])`

**Condition d'exécution** : test implémenté en `test/stats.test.js:9-11`.

**Entrée** : tableau `[9, 1, 5]` (non trié).

**Attendu** : `5` (l'élément central après tri `[1, 5, 9]`).

**Réel** : `5` ✓

**Statut** : **PASS** — critère d'acceptation valide.

**Commande** : `npm test` → affiche résultat du test 2.

**Preuves** :
- Code : `src/stats.js:8-11` (implémentation de `median`)
- Test : `test/stats.test.js:9-11`

---

### TC-AUTO-003 — Médiane paire (UNITAIRE) — ANOMALIE

**Objectif** : vérifier que `median()` calcule correctement la médiane d'une liste de taille paire (moyenne des deux valeurs centrales).

**Cas de test** : `median([1, 2, 3, 4])`

**Condition d'exécution** : test implémenté en `test/stats.test.js:13-16`.

**Entrée** : tableau `[1, 2, 3, 4]`.

**Attendu** : `2.5` (moyenne des deux valeurs centrales : `(2 + 3) / 2 = 2.5`).

**Réel** : `3` (index `Math.floor(4/2) = 2`, soit `sorted[2] = 3`).

**Statut** : **FAIL** ✗ — anomalie connue, assumée au seed.

**Erreur rapportée par `node:test`** :
```
✖ médiane d'une liste de taille paire
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  3 !== 2.5   (actual: 3, expected: 2.5)
  code: 'ERR_ASSERTION'
```

**Commande** : `npm test` → affiche résultat du test 3 (fail).

**Impact** : tout résultat de médiane sur fichier d'un nombre pair d'éléments est statistiquement incorrect.

**Recommandation** : corriger `src/stats.js:10-11` pour ajouter condition de parité avant cette recette passe.

**Preuves** :
- Code : `src/stats.js:10-11` (implémentation erronée de `median` paire)
- Test : `test/stats.test.js:13-16` (test RED)
- Commit : `a7038b1` (« état assumé du seed »)

---

## Cas de test d'intégration (manuels, CLI)

### TC-CLI-001 — Parcours golden path (impair)

**Objectif** : vérifier qu'invoquer le binaire avec un fichier valide (taille impaire) produit la sortie correcte.

**Condition d'exécution** : fichier de test, exécution manuelle ou scripted.

**Setup** :
1. Créer fichier `test-data-odd.txt` :
   ```
   9
   1
   5
   ```
2. Exécuter : `node bin/index.js test-data-odd.txt`

**Attendu** :
```
n=3 moyenne=5 mediane=5
```

**Étapes détaillées** :
1. Argument `test-data-odd.txt` accepté
2. Fichier chargé en UTF-8
3. Parsing : ligne par ligne → `[9, 1, 5]`
4. Calcul : `mean([9, 1, 5]) = 5`, `median([9, 1, 5]) = 5`
5. Affichage : format invariant `n=3 moyenne=5 mediane=5`
6. Exit code : 0 (succès)

**Réel attendu** : identique.

**Critère d'acceptation** : sortie exacte, exit code 0.

**Preuves** :
- CDC_FONCTIONNEL §Parcours 1 (golden path impair)
- WORKFLOW_CALCULER_STATS §Étapes principales

---

### TC-CLI-002 — Parcours golden path (pair) — ANOMALIE

**Objectif** : vérifier qu'invoquer le binaire avec un fichier valide (taille paire) produit la sortie, bien qu'erronée pour la médiane.

**Condition d'exécution** : fichier de test, exécution manuelle.

**Setup** :
1. Créer fichier `test-data-even.txt` :
   ```
   1
   2
   3
   4
   ```
2. Exécuter : `node bin/index.js test-data-even.txt`

**Attendu (par spécification correcte)** :
```
n=4 moyenne=2.5 mediane=2.5
```

**Réel (code actuel)** :
```
n=4 moyenne=2.5 mediane=3
```

**Différence** : médiane erronée (`3` au lieu de `2.5`).

**Étapes détaillées** :
1. Fichier chargé, parsing → `[1, 2, 3, 4]`
2. Calcul : `mean([1, 2, 3, 4]) = 2.5` ✓
3. Calcul : `median([1, 2, 3, 4])` :
   - Tri → `[1, 2, 3, 4]`
   - Index `Math.floor(4/2) = 2` → `sorted[2] = 3` ✗ (devrait être `2.5`)
4. Affichage : `n=4 moyenne=2.5 mediane=3`
5. Exit code : 0 (succès du process, mais résultat incorrect)

**Critère d'acceptation (actuel)** :
- ✓ Sortie formatée correctement
- ✓ Moyenne correcte
- ✗ Médiane erronée (anomalie connue)

**Critère d'acceptation (post-correction)** :
- Après correction de `src/stats.js:10-11`, médiane doit être `2.5`

**Preuves** :
- CDC_FONCTIONNEL §Parcours 3 (anomalie médiane paire)
- WORKFLOW_CALCULER_STATS §Risques

---

### TC-CLI-003 — Cas limite : moyenne avec décimales

**Objectif** : vérifier que l'outil accepte et traite correctement les nombres décimaux.

**Condition d'exécution** : fichier de test, exécution manuelle.

**Setup** :
1. Créer fichier `test-data-decimals.txt` :
   ```
   1.5
   2.5
   3.5
   ```
2. Exécuter : `node bin/index.js test-data-decimals.txt`

**Attendu** :
```
n=3 moyenne=2.5 mediane=2.5
```

**Étapes** :
1. Parsing : `[1.5, 2.5, 3.5]`
2. Moyenne : `(1.5 + 2.5 + 3.5) / 3 = 2.5` ✓
3. Médiane : tri → `[1.5, 2.5, 3.5]`, index 1 → `2.5` ✓ (impair)

**Critère d'acceptation** : sortie correcte, pas de perte de précision.

**Preuves** : CDC_FONCTIONNEL §Cas limites (non spécifiés mais doivent fonctionner).

---

### TC-CLI-004 — Cas limite : nombres négatifs

**Objectif** : vérifier que l'outil accepte et traite correctement les nombres négatifs.

**Setup** :
1. Créer fichier `test-data-negative.txt` :
   ```
   -10
   0
   10
   ```
2. Exécuter : `node bin/index.js test-data-negative.txt`

**Attendu** :
```
n=3 moyenne=0 mediane=0
```

**Critère d'acceptation** : sortie correcte, pas d'erreur sur négatifs.

---

### TC-CLI-005 — Argument absent — RISQUE

**Objectif** : vérifier la gestion d'erreur quand aucun argument n'est passé.

**Condition d'exécution** : pas de fichier créé.

**Setup** :
1. Exécuter : `node bin/index.js` (sans argument)

**Attendu (idéal)** :
```
Erreur : veuillez passer un chemin de fichier en argument.
Usage : node bin/index.js <fichier>
```
Exit code : 1

**Réel (code actuel)** :
```
TypeError: The "path" argument must be of type string
<stack trace>
```
Exit code : 1

**Critère d'acceptation (actuel)** :
- Process échoue (exit ≠ 0)
- Message d'erreur peu explicite

**Critère d'acceptation (post-amélioration)** :
- Message d'erreur clair et utilisateur
- Exit code 1

**Preuves** :
- CDC_FONCTIONNEL §Parcours 4
- WORKFLOW_CALCULER_STATS §Risques (Argument absent)

---

### TC-CLI-006 — Fichier inexistant — RISQUE

**Objectif** : vérifier la gestion d'erreur quand le fichier n'existe pas.

**Setup** :
1. Exécuter : `node bin/index.js nonexistent-file.txt`

**Attendu (idéal)** :
```
Erreur : le fichier 'nonexistent-file.txt' n'existe pas ou n'est pas accessible.
```
Exit code : 1

**Réel (code actuel)** :
```
Error: ENOENT: no such file or directory, open 'nonexistent-file.txt'
<stack trace>
```
Exit code : 1

**Critère d'acceptation (actuel)** :
- Process échoue avec message technique

**Critère d'acceptation (post-amélioration)** :
- Message explicite et localisable

**Preuves** :
- CDC_FONCTIONNEL §Parcours 5
- WORKFLOW_CALCULER_STATS §Risques (Fichier inexistant)

---

### TC-CLI-007 — Fichier contenant une ligne non numérique — RISQUE

**Objectif** : vérifier le comportement quand le fichier contient une ligne non numérique.

**Setup** :
1. Créer fichier `test-data-invalid.txt` :
   ```
   10
   abc
   20
   ```
2. Exécuter : `node bin/index.js test-data-invalid.txt`

**Attendu (idéal)** :
```
Erreur : la ligne 2 ("abc") n'est pas un nombre valide.
```
Exit code : 1

**Réel (code actuel)** :
```
n=3 moyenne=NaN mediane=NaN
```
Exit code : 0 (succès du process, mais résultats NaN)

**Problème** : pas d'erreur levée, NaN silencieusement injecté dans les calculs.

**Critère d'acceptation (actuel)** :
- Process ne crash pas (survie acceptable pour banc d'essai)
- Résultats NaN révèlent le problème à l'observation

**Critère d'acceptation (post-amélioration)** :
- Validation explicite avec rejet et message d'erreur

**Preuves** :
- CDC_FONCTIONNEL §Parcours 6
- WORKFLOW_CALCULER_STATS §Risques (Lignes non numériques)

---

### TC-CLI-008 — Fichier vide — CAS LIMITE

**Objectif** : vérifier le comportement sur fichier vide ou ne contenant que des espaces.

**Setup** :
1. Créer fichier vide `test-data-empty.txt`
2. Exécuter : `node bin/index.js test-data-empty.txt`

**Réel (code actuel)** :
- `contenu.trim()` → `""`
- `.split("\n")` → `[""]`
- `.map(Number)` → `[0]` (pas un tableau vide !)
- Résultat : `n=1 moyenne=0 mediane=0`

**Comportement** : légèrement contre-intuitif (fichier vide → 1 zéro au lieu de 0 éléments).

**Statut** : non spécifié, pas testé, mais fonctionnel. À clarifier si comportement attendu.

**Preuves** :
- CDC_FONCTIONNEL §Règle 2 (lignes vides)
- WORKFLOW_CALCULER_STATS §Risques (Tableau vide)

---

### TC-CLI-009 — Fichier avec une seule valeur

**Objectif** : vérifier le comportement sur liste d'un seul élément.

**Setup** :
1. Créer fichier `test-data-single.txt` : `42`
2. Exécuter : `node bin/index.js test-data-single.txt`

**Attendu** :
```
n=1 moyenne=42 mediane=42
```

**Critère d'acceptation** : sortie correcte, pas d'erreur.

---

## Cas de test de régression (critiques)

Ces cas doivent **toujours passer** après toute modification, même mineure.

### TC-REG-001 — Moyenne reste correcte
**Test** : TC-AUTO-001 + TC-CLI-001 (fichier avec 3 nombres)
**Vérification** : `npm test` passe test 1 ; invocation CLI produit moyenne correcte.

### TC-REG-002 — Médiane impaire reste correcte
**Test** : TC-AUTO-002 + TC-CLI-001
**Vérification** : `npm test` passe test 2 ; invocation CLI sur fichier impair produit médiane correcte.

### TC-REG-003 — Suite de tests ne gagne pas d'erreur
**Test** : `npm test` → exit code et résumé
**Vérification** : ne jamais avoir plus de 1 test en échec (actuellement TC-AUTO-003 est attendu en échec).

---

## Matrice de test

| ID | Type | Description | État | Priorité | Blocage |
|----|------|-------------|------|----------|---------|
| TC-AUTO-001 | Unitaire | Moyenne simple | ✓ PASS | Critique | Non |
| TC-AUTO-002 | Unitaire | Médiane impaire | ✓ PASS | Critique | Non |
| TC-AUTO-003 | Unitaire | Médiane paire | ✗ FAIL | Critique | **OUI** (anomalie connue) |
| TC-CLI-001 | Intégration | Golden path (impair) | ✓ PASS | Critique | Non |
| TC-CLI-002 | Intégration | Golden path (pair) | ⚠ PARTIAL (médiane erronée) | Critique | **OUI** (anomalie) |
| TC-CLI-003 | Intégration | Décimales | ✓ Supposé OK | Moyen | Non |
| TC-CLI-004 | Intégration | Négatifs | ✓ Supposé OK | Moyen | Non |
| TC-CLI-005 | Intégration | Argument absent | ✗ FAIL (crash) | Moyen | Non (attendu) |
| TC-CLI-006 | Intégration | Fichier absent | ✗ FAIL (crash) | Moyen | Non (attendu) |
| TC-CLI-007 | Intégration | Ligne non numérique | ⚠ PARTIAL (NaN silencieux) | Moyen | Non (attendu) |
| TC-CLI-008 | Intégration | Fichier vide | ⚠ PARTIAL (comportement insolite) | Bas | Non |
| TC-CLI-009 | Intégration | Un seul élément | ✓ Supposé OK | Bas | Non |

---

## Critères d'acceptation finaux pour le produit

Une version du code sera **acceptée en recette** si et seulement si :

1. ✓ **Tous les tests automatisés passent** : `npm test` → exit code 0, tous les 3 tests passent (y compris TC-AUTO-003).
2. ✓ **Golden path (fichier valide impair)** : TC-CLI-001 passe.
3. ✓ **Golden path (fichier valide pair)** : TC-CLI-002 passe avec médiane correcte (`2.5`).
4. ✓ **Aucun test de régression cassé** : cas qui passaient continuent de passer.
5. ✓ **Pas de dépendance npm ajoutée** : seuls modules natifs Node.
6. ✓ **Module `src/stats.js` testable** : reste requête sans invocation CLI.

---

## Déroulement de recette recommandé

### Phase 1 — Vérification des tests unitaires
```bash
npm test
```
Attendu : `tests 3 · pass 2 · fail 1` (avant correction médiane) → `tests 3 · pass 3 · fail 0` (après correction).

### Phase 2 — Test CLI : golden paths
```bash
# Impair
node bin/index.js test-data-odd.txt
# Attendu : n=3 moyenne=5 mediane=5

# Pair
node bin/index.js test-data-even.txt
# Attendu : n=4 moyenne=2.5 mediane=2.5 (après correction)
```

### Phase 3 — Test CLI : cas limites (optionnel)
```bash
node bin/index.js test-data-decimals.txt
node bin/index.js test-data-negative.txt
# Attendu : comportement correct sans crash
```

### Phase 4 — Test CLI : erreurs (optionnel, diagnostic)
```bash
node bin/index.js                          # Argument absent
node bin/index.js nonexistent.txt          # Fichier absent
node bin/index.js test-data-invalid.txt    # Ligne non numérique
```
Observé : crash Node + message technique. Attendu (si amélioration) : message explicite + exit code 1.

---

## Environnement de test

**Prérequis** :
- Node.js ≥ 18
- Dépôt cloné
- Aucune dépendance npm à installer (zéro `dependencies`)

**Cleanup** : supprimer les fichiers `test-data-*.txt` créés manuellement après recette.

---

## Preuves et traçabilité

| Cas | Preuve amont | Référence CDC | Référence CARTOGRAPHIE |
|-----|-------------|---|---|
| TC-AUTO-001 | test unitaire | §Règles métier (Moyenne) | `test/stats.test.js:5-7` |
| TC-AUTO-002 | test unitaire | §Règles métier (Médiane impaire) | `test/stats.test.js:9-11` |
| TC-AUTO-003 | test unitaire RED | §Règles métier (Médiane paire — ANOMALIE) | `test/stats.test.js:13-16` |
| TC-CLI-001 | workflow calcul | §Parcours 1 | `WORKFLOW_CALCULER_STATS` |
| TC-CLI-002 | workflow calcul | §Parcours 3 (anomalie) | `WORKFLOW_CALCULER_STATS` |
| TC-CLI-005..007 | workflow calcul | §Risques | `WORKFLOW_CALCULER_STATS` |
