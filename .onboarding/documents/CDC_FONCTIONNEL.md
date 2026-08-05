# CDC_FONCTIONNEL — shift-pilot-cli

> **Confiance** : high

> Synthèse définitive du comportement attendu de l'outil, la suite de tests en source de vérité.

## Contexte métier et usages

### Nature de l'usage
**shift-pilot-cli** est un outil de calcul statistique destiné à des utilisateurs techniques — développeurs ou pipelines CI qui manipulent une série de nombres et ont besoin de calculs rapides de tendance centrale (moyenne, médiane). Ce n'est pas un analyseur de données au sens large, ni un outil de business intelligence : c'est un calculateur en ligne de commande, minimaliste et sans état.

**Cas d'usage primaire** : « J'ai un fichier texte listant des nombres (un par ligne) ; je veux connaître instantanément le compte, la moyenne et la médiane. »

**Rôle du dépôt lui-même** : banc d'essai pour la chaîne SHIFT/Paperclip — un cas réel minimaliste mais non trivial (calcul mathématique, suite de tests de référence, packaging CLI) pour valider le processus d'onboarding.

### Contexte organisationnel
Aucun — le projet n'est pas adossé à une organisation décisionnelle. L'état RED (médiane paire erronée) était intentionnel au départ du seed, objectif pédagogique pour la chaîne ; l'anomalie a été corrigée dans le commit `6ad241d` (CLA-184).

## Acteurs et leurs capacités

### Utilisateur technique (développeur, pipeline CI)
**Peut faire** :
- Invoquer le binaire en passant le chemin d'un fichier en argument : `pilot-stats data.txt` ou `node bin/index.js data.txt`
- Lire le résultat sur stdout : ligne unique `n=<nombre> moyenne=<valeur> mediane=<valeur>`

**Cannot do** :
- Passer des options (ex. `--decimal 2`, `--format json`, `--separator ,`)
- Traiter plusieurs fichiers en une invocation
- Piloter le séparateur d'entrée (toujours `\n`)
- Capturer les erreurs de fichier manquant ou argument absent — reçoit une exception Node non gérée

**Voir aussi** : risques et limitations en section Règles métier.

### Système de fichiers local
**Rôle** : source de l'entrée brute (lecture synchrone en UTF-8).

**Capabilities** :
- Fournit le contenu du fichier désigné par l'argument
- Lève une erreur (ENOENT, EACCES) si le fichier est absent ou inaccessible

### Moteur Node.js (≥ 18)
**Rôle** : runtime d'exécution.

**Contrainte** : `node:test` et `node:assert/strict` existent uniquement en Node ≥ 18. Pas d'enforcement visible (npm ne vérifie pas `engines` par défaut).

### stdout
**Rôle** : canal de sortie unique.

**Contrat** : une seule ligne imprimée, format invariant : `n=<nombre> moyenne=<valeur> mediane=<valeur>`.

## Parcours fonctionnels critiques

### Parcours 1 — Golden Path : calcul sur entrée valide, taille impaire

**Déclencheur** : utilisateur exécute `node bin/index.js data.txt` avec `data.txt` contenant :
```
9
1
5
```

**Déroulement attendu** :
1. `bin/index.js:8` — `process.argv[2]` = `"data.txt"` (valide)
2. `bin/index.js:9` — `fs.readFileSync("data.txt", "utf8")` charge le contenu brut
3. `bin/index.js:13` — `parseValues(contenu)` → `src/stats.js:17-28` — valide le contenu, retourne `[9, 1, 5]`
4. `bin/index.js:19` — `mean([9, 1, 5])` → `(9 + 1 + 5) / 3 = 5`
5. `bin/index.js:19` — `median([9, 1, 5])` → tri `[1, 5, 9]`, index `Math.floor(3/2) = 1`, résultat `5` ✓
6. Affichage : `n=3 moyenne=5 mediane=5`

**Résultat** : sortie correcte, process exit 0.

**Preuves** : `WORKFLOW_CALCULER_STATS` §Étapes ; test passant `test/stats.test.js:9-11` ; code `bin/index.js:6-19`, `src/stats.js:17-28`, SHA `f1cb153`.

---

### Parcours 2 — Calcul de moyenne

**Déclencheur** : utilisateur avec fichier :
```
2
4
6
```

**Déroulement** :
1. Validation et parsing via `parseValues()` → `[2, 4, 6]` (VÉRIFIÉ_CODE — `src/stats.js:17-28`)
2. `mean([2, 4, 6])` — `src/stats.js:3-5` — `reduce((acc, v) => acc + v, 0) / 3` → `12 / 3 = 4` ✓
3. Affichage : `n=3 moyenne=4 mediane=<valeur_médiane>`

**Résultat** : moyenne correcte (confirmé par test passant `test/stats.test.js:5-7`).

**Règle applicable** : `Moyenne arithmétique standard` (ci-dessous).

---

### Parcours 3 — CORRIGÉ : calcul de médiane sur entrée paire

**Déclencheur** : utilisateur avec fichier :
```
1
2
3
4
```

**Déroulement après correction** (commit `6ad241d`, CLA-184) :
1. Parsing → `[1, 2, 3, 4]`
2. Tri → `[1, 2, 3, 4]`
3. `median([1, 2, 3, 4])` — `src/stats.js:10-14` — parité détectée, retourne `(sorted[1] + sorted[2]) / 2 = (2 + 3) / 2 = 2.5` ✓
4. Affichage : `n=4 moyenne=2.5 mediane=2.5`

**Attendu par la suite de référence** : médiane `2.5` (moyenne des deux valeurs centrales `[2, 3]`).

**Réel** : médiane `2.5` ✓

**Résultat** : test GREEN `test/stats.test.js:13-16` (pass 3 / fail 0).

**Preuves** : `FUNCTIONAL_AUDIT` §Anomalie fonctionnelle (CORRIGÉ) ; commit `a7038b1` (seed RED), commit `6ad241d` (fix CLA-184).

**Historique** : avant le fix, le parcours retournait médiane `3` au lieu de `2.5` — voir commit `a7038b1` (état seed intentionnel).

---

### Parcours 4 — RISQUE : argument absent

**Déclencheur** : `node bin/index.js` (pas d'argument).

**Déroulement réel** :
1. `process.argv[2]` vaut `undefined`
2. `fs.readFileSync(undefined, "utf8")` → TypeError non capturé
3. Processus crash, exit code ≠ 0
4. Affichage utilisateur : `TypeError: The "path" argument must be of type string` (message technique Node.js, cryptique)

**Comportement actuel** : crash Node non piloté, pas de garde en `bin/index.js:8-9` (VÉRIFIÉ_CODE — SHA `f1cb153`).

**État** : ⚠ risque documenté, anomalie assumée (zone critique, pas d'error handling).

**Preuves** : `WORKFLOW_CALCULER_STATS` §Risques ; `bin/index.js:8-9`, pas de garde.

---

### Parcours 5 — RISQUE : fichier absent

**Déclencheur** : `node bin/index.js nonexistent.txt`.

**Déroulement réel** :
1. `fs.readFileSync("nonexistent.txt", "utf8")` → ENOENT non capturé
2. Processus crash, exit code ≠ 0
3. Affichage utilisateur : `Error: ENOENT: no such file or directory, open 'nonexistent.txt'` (message système, non piloté)

**Comportement actuel** : crash Node non piloté, pas de `try/catch` en `bin/index.js:9`.

**État** : ⚠ risque documenté, anomalie assumée (zone critique, pas de gestion d'erreur I/O).

**Preuves** : `bin/index.js:9`, pas de `try/catch`.

---

### Parcours 6 — CORRIGÉ : entrée mal formée (ligne non numérique)

**Déclencheur** : fichier contenant :
```
10
abc
20
```

**Déroulement après correction (CLA-251)** :
1. `bin/index.js:13` — `parseValues(contenu)` appelé
2. `src/stats.js:22-27` — détecte la ligne non-numérique `"abc"`, lève `Error("Valeurs non-numériques : abc")`
3. `bin/index.js:14-16` — le `catch` capte l'erreur, écrit le message sur stderr et quitte avec code 1
4. Affichage : `Valeurs non-numériques : abc` (stderr), process exit 1

**Comportement amélioré** : validation stricte, erreur explicite, exit code non-zéro (VÉRIFIÉ_CODE — `src/stats.js:17-28`, SHA `f1cb153`).

**État** : ✓ CORRIGÉ — voir règle métier « Validation des valeurs » ci-dessous.

**Preuves** : `test/stats.test.js:23-24` (test vert « parseValues — valeur non-numérique → erreur ») ; `bin/index.js:6-19`, `src/stats.js:17-28`.

---

## Règles métier et exigences

### Format d'entrée — Strict
**Règle 1** : L'entrée est un fichier texte UTF-8 contenant **un nombre par ligne**, séparateur `\n` uniquement.

**Codification** : `src/stats.js:22-23` (dans `parseValues()`) — `.split("\n").map(Number)`.

**Non géré** :
- Fichier CSV réel (`.csv` avec colonnes, guillemets, séparateur `,`)
- Fichiers avec BOM (Byte Order Mark)
- Encodages non-UTF-8

**Incohérence documentée** : `package.json:4` dit « statistiques sur fichiers CSV » ; `README.md` dit « `data.csv` ». L'implémentation parse « un nombre par ligne » seulement. Écart identifié entre déclaration (CSV) et implémentation réelle (newline-separated).

---

### Format d'entrée — Validation et rejet des entrées invalides
**Règle 2 — CORRIGÉE (CLA-251)** : Les lignes vides et non numériques déclenchent une erreur explicite et arrêtent l'exécution.

- Ligne non numérique (`"abc"`) → `parseValues()` lève `Error("Valeurs non-numériques : abc")`
- Fichier entièrement vide → `parseValues()` lève `Error("Le fichier est vide.")`

**Codification** : `src/stats.js:17-28` — `parseValues()` valide les lignes (VÉRIFIÉ_CODE — SHA `f1cb153`).

**Implémentation** :
- `src/stats.js:18-20` : rejette le fichier vide après `.trim()`
- `src/stats.js:22-27` : compare chaque ligne à son résultat `Number()`, accumule les invalides, lève une erreur liste si au moins une est non-numérique
- `bin/index.js:12-17` : enveloppe l'appel à `parseValues()` dans un `try/catch`, écrit l'erreur sur stderr et quitte avec code 1

**État** : ✓ rejet explicite des entrées invalides (conforme aux tests `test/stats.test.js:22-24`).

---

### Calcul de moyenne — Correct
**Règle 3** : La moyenne arithmétique est la somme de tous les éléments divisée par le compte.

**Codification** : `src/stats.js:3-5` — `reduce((acc, v) => acc + v, 0) / values.length`.

**Cas particulier** :
- Tableau vide → `0 / 0 = NaN`
- Contient NaN → résultat `NaN`

**Preuves** : test passant `test/stats.test.js:5-7` ; audit `FUNCTIONAL_AUDIT` §Conformité de la moyenne.

**État** : ✓ correcte, testée.

---

### Calcul de médiane impaire — Correct
**Règle 4** : Médiane de liste de taille impaire = élément central après tri croissant.

**Codification** : `src/stats.js:8-11` — tri, index `Math.floor(length/2)`.

**Exemple** : `median([9, 1, 5])` → tri `[1, 5, 9]`, index `1`, résultat `5` ✓.

**Preuves** : test passant `test/stats.test.js:9-11`.

**État** : ✓ correcte, testée.

---

### Calcul de médiane paire — CORRIGÉE (CLA-184)
**Règle 5 — CORRIGÉE** : Médiane de liste de taille paire = moyenne des deux éléments centraux après tri croissant.

**Codification** : `src/stats.js:10-12` — retourne `(sorted[mid - 1] + sorted[mid]) / 2` pour les listes paires.

**Exemple réel** : `median([1, 2, 3, 4])` → tri `[1, 2, 3, 4]`, index `mid = 2`, résultat `(sorted[1] + sorted[2]) / 2 = (2 + 3) / 2 = 2.5` ✓.

**Conforme au test de référence** : `2.5` (moyenne des deux centraux : `(2 + 3) / 2`).

**Impact** : la médiane sur fichier pair retourne maintenant la valeur correcte.

**Preuves** : test passant `test/stats.test.js:13-16` (depuis CLA-184, commit `6ad241d`) ; suite complète 5/5 verte.

**État** : ✗ erronée, test RED, anomalie connue assumée au seed.

---

### Format de sortie — Invariant
**Règle 6** : Une seule ligne imprimée sur stdout, format fixe : `n=<nombre> moyenne=<valeur> mediane=<valeur>`.

**Codification** : `bin/index.js:12` — template literal.

**Exemple** : `n=3 moyenne=5 mediane=5`.

**Précision décimale** : pas de formatage — affichage JavaScript natif (ex. `2.5` s'affiche `2.5`, `2.3333...` s'affiche avec tous les chiffres).

**Preuves** : `WORKFLOW_CALCULER_STATS` §Étapes ; audit `FUNCTIONAL_AUDIT` §Affichage.

---

### Suite de tests — Source de vérité
**Règle 7** : La suite de tests est l'autorité comportementale du produit, pas le code.

**Déclaration explicite** : `README.md` — *« La suite de tests fait référence : tout écart entre le comportement et les tests est une anomalie »*.

**Codification** : `package.json` clé `scripts.test` → `node --test test/*.test.js` ; `test/stats.test.js` (5 tests, mise à jour CLA-251).

**État actuel** : 5 tests · 5 passent · 0 échouent.

**Interprétation** :
- Tous les tests passent depuis CLA-184 (correction de médiane paire) et CLA-251 (ajout parseValues).
- Tests couverts : moyenne, médiane impaire, médiane paire, fichier vide (erreur), valeur non-numérique (erreur).

**Preuves** : audit `FUNCTIONAL_AUDIT` §Résumé exécutif ; `WORKFLOW_EXECUTER_SUITE_TESTS`.

---

### Contrainte d'environnement
**Règle 8** : Moteur Node.js ≥ 18.

**Codification** : `package.json` clé `engines: { node: ">=18" }`.

**Justification** : modules natifs utilisés (`node:test`, `node:assert/strict`) existent uniquement en Node ≥ 18.

**Non enforced automatiquement** : npm n'applique pas `engines` par défaut sauf avec flag `--engine-strict`.

**Risque** : sur Node < 18, `require('node:test')` lèverait `Error: Cannot find module`.

**Preuves** : audit `ARCHITECTURE_AUDIT` §Contrainte de version Node.

---

## Modèle de données

**Notion : fichier d'entrée**
- Identifiant : chemin passé en argument (`process.argv[2]`)
- Contenu : chaîne UTF-8, lignes séparées par `\n`, chaque ligne contenant un nombre (ou convertible en nombre via `Number()`)
- États : inexistant (ENOENT), accessible (parsable), corrompu (non UTF-8, non numérique)

**Notion : série numérique**
- Identifiant : `valeurs` (produit du parsing)
- Type : `Array<number>` (peut contenir `NaN`)
- Durée de vie : calcul en mémoire, jetée après affichage
- Opérations : tri (pour médiane), reduction (pour moyenne), length (pour compte)

**Notion : résultat statistique**
- Composants : `n` (nombre d'éléments), `moyenne` (nombre ou `NaN`), `mediane` (nombre ou `NaN`)
- Représentation : une seule, sur stdout
- Durée de vie : affichée puis oubliée (pas de persistance)

**Pas de notion persistée** — aucune base de données, aucun cache, aucun état entre invocations.

---

## Périmètre et limitations

### Hors périmètre — Non implémenté
- Options CLI (`--decimal`, `--format json`, `--verbose`)
- Multi-fichier en une invocation
- Autres séparateurs d'entrée (`,`, `;`, whitespace)
- Autres agrégats statistiques (min, max, écart-type, quantiles)
- Persistance des résultats (logs, fichier de sortie)
- Interface graphique ou web
- Authentification / contrôle d'accès (binaire sans état)

### Inachevé et indéterminable
- **Cas limites non testés** : liste à un seul élément, valeurs négatives, décimales, très grandes valeurs (overflow). Aucun test, comportement non documenté.
- **Fichier vide** : testé depuis CLA-251 (`test/stats.test.js:18-20`), lève `Error: Le fichier est vide.`
- **Interaction avec les locales** : le séparateur décimal observé est toujours `.` (JavaScript natif) ; pas de support pour `,` (locales européennes).
- **Gestion d'erreur** : erreurs I/O et argument absent remontent comme crashes Node bruts, non capturées en `bin/index.js`.

### Scénarios documentés comme supposément OK mais non testés
- Fichier vide
- Liste à un seul nombre
- Nombres négatifs
- Nombres décimaux avec haute précision

---

## État de référence — Comportement observé

L'état courant du dépôt peut être résumé par :

1. Tests actuels : `test/stats.test.js` contient 5 cas (moyenne, médiane impaire, médiane paire, fichier vide, valeur non-numérique) — tous verts
2. Golden path : fichier valide bien formé → affichage `n=<nombre> moyenne=<m> mediane=<d>`
3. Dépendances : zéro dépendance npm externe
4. Testabilité : `src/stats.js` exporte fonctions pures (`mean`, `median`, `parseValues`)
5. Comportements observés : moyenne correcte, médiane impaire correcte, médiane paire correcte (CLA-184), validation stricte (CLA-251)

---

## Preuves et traçabilité

| Aspect | Preuve(s) | Statut |
|--------|-----------|--------|
| Format d'entrée | `bin/index.js:10` (`.split("\n").map(Number)`) | VÉRIFIÉ |
| Moyenne | `src/stats.js:3-5` + test `test/stats.test.js:5-7` (pass) | VÉRIFIÉ ✓ |
| Médiane impaire | `src/stats.js:8-11` + test `test/stats.test.js:9-11` (pass) | VÉRIFIÉ ✓ |
| Médiane paire ANOMALIE | `src/stats.js:10-11` + test `test/stats.test.js:13-16` (RED) | VÉRIFIÉ ✗ |
| Suite de référence | `README.md` + `package.json` clé `scripts.test` | VÉRIFIÉ |
| Gestion d'erreur absente | `bin/index.js` (pas de `try/catch`) | OBSERVÉ |
| Décalage documentaire CSV | `package.json:4`, `bin/index.js:2`, `README.md` vs. réalité | VÉRIFIÉ |

---

## Questions ouvertes persistantes

1. **Gestion d'erreur** : argument absent et fichier absent remontent comme crashes Node bruts (non capturés en `bin/index.js`).
2. **Incohérence documentaire** : « CSV » vs. « un nombre par ligne » reste divergente dans `package.json` et `README.md`.
3. **Cas limites non testés** : liste d'un seul élément, valeurs négatives, décimales, très grandes valeurs — comportement non spécifié ni testé.
4. **Couverture de tests** : suite actuellement à 5 cas (moyenne, médiane impaire, médiane paire, fichier vide, valeur non-numérique).
