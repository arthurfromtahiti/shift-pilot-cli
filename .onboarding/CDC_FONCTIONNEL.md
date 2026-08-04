# CDC_FONCTIONNEL — shift-pilot-cli

> **Confiance** : high

> Synthèse définitive du comportement attendu de l'outil, la suite de tests en source de vérité.

## Contexte métier et usages

### Nature de l'usage
**shift-pilot-cli** est un outil de calcul statistique destiné à des utilisateurs techniques — développeurs ou pipelines CI qui manipulent une série de nombres et ont besoin de calculs rapides de tendance centrale (moyenne, médiane). Ce n'est pas un analyseur de données au sens large, ni un outil de business intelligence : c'est un calculateur en ligne de commande, minimaliste et sans état.

**Cas d'usage primaire** : « J'ai un fichier texte listant des nombres (un par ligne) ; je veux connaître instantanément le compte, la moyenne et la médiane. »

**Rôle du dépôt lui-même** : banc d'essai pour la chaîne SHIFT/Paperclip — un cas réel minimaliste mais non trivial (calcul mathématique, suite de tests de référence, packaging CLI) pour valider le processus d'onboarding.

### Contexte organisationnel
Aucun — le projet n'est pas adossé à une organisation décisionnelle. L'état RED (médiane paire erronée) est intentionnel au départ du seed, objectif pédagogique pour la chaîne.

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
3. `bin/index.js:10` — `.trim().split("\n").map(Number)` → tableau `[9, 1, 5]`
4. `bin/index.js:12` — `mean([9, 1, 5])` → `(9 + 1 + 5) / 3 = 5`
5. `bin/index.js:12` — `median([9, 1, 5])` → tri `[1, 5, 9]`, index `Math.floor(3/2) = 1`, résultat `5` ✓
6. Affichage : `n=3 moyenne=5 mediane=5`

**Résultat** : sortie correcte, process exit 0.

**Preuves** : `WORKFLOW_CALCULER_STATS` §Étapes ; test passant `test/stats.test.js:9-11`.

---

### Parcours 2 — Calcul de moyenne

**Déclencheur** : utilisateur avec fichier :
```
2
4
6
```

**Déroulement** :
1. Parsing → `[2, 4, 6]`
2. `mean([2, 4, 6])` — `src/stats.js:3-5` — `reduce((acc, v) => acc + v, 0) / 3` → `12 / 3 = 4` ✓
3. Affichage : `n=3 moyenne=4 mediane=<valeur_médiane>`

**Résultat** : moyenne correcte (confirmé par test passant `test/stats.test.js:5-7`).

**Règle applicable** : `Moyenne arithmétique standard` (ci-dessous).

---

### Parcours 3 — ANOMALIE : calcul de médiane sur entrée paire

**Déclencheur** : utilisateur avec fichier :
```
1
2
3
4
```

**Déroulement réel** (et divergence attendue) :
1. Parsing → `[1, 2, 3, 4]`
2. Tri → `[1, 2, 3, 4]`
3. `median([1, 2, 3, 4])` — `src/stats.js:10-11` — retourne `sorted[Math.floor(4/2)] = sorted[2] = 3` ✗
4. Affichage : `n=4 moyenne=2.5 mediane=3`

**Attendu par la suite de référence** : médiane `2.5` (moyenne des deux valeurs centrales `[2, 3]`).

**Réel** : médiane `3`.

**Résultat** : test RED `test/stats.test.js:13-16` (AssertionError: 3 !== 2.5).

**Preuves** : `FUNCTIONAL_AUDIT` §Anomalie fonctionnelle ; `WORKFLOW_CALCULER_STATS` §Risques ; commit `a7038b1` (« état assumé »).

**Impact métier** : tout résultat de médiane sur fichier pair est statistiquement incorrect. L'utilisateur n'en est pas avisé.

---

### Parcours 4 — RISQUE : argument absent

**Déclencheur** : `node bin/index.js` (pas d'argument).

**Déroulement réel** :
1. `process.argv[2]` vaut `undefined`
2. `fs.readFileSync(undefined, "utf8")` → TypeError non capturé
3. Processus crash, exit code ≠ 0

**Affichage utilisateur** : `TypeError: The "path" argument must be of type string` (cryptique).

**Attendu** : message explicite « Erreur : veuillez passer un chemin de fichier en argument. Usage : node bin/index.js <fichier> ».

**Preuves** : `WORKFLOW_CALCULER_STATS` §Risques ; `bin/index.js:8-9`, pas de garde.

---

### Parcours 5 — RISQUE : fichier absent

**Déclencheur** : `node bin/index.js nonexistent.txt`.

**Déroulement réel** :
1. `fs.readFileSync("nonexistent.txt", "utf8")` → ENOENT non capturé
2. Processus crash, exit code ≠ 0

**Affichage utilisateur** : `Error: ENOENT: no such file or directory, open 'nonexistent.txt'`.

**Attendu** : message explicite « Erreur : le fichier 'nonexistent.txt' n'existe pas ou n'est pas accessible. »

**Preuves** : `bin/index.js:9`, pas de `try/catch`.

---

### Parcours 6 — RISQUE : entrée mal formée (ligne non numérique)

**Déclencheur** : fichier contenant :
```
10
abc
20
```

**Déroulement réel** :
1. Parsing → `[10, NaN, 20]`
2. `mean([10, NaN, 20])` → `reduce(...) → 10 + NaN + 20 = NaN ; NaN / 3 = NaN`
3. `median([10, NaN, 20])` → tri → `[NaN, 10, 20]` (NaN sort first en JS), médiane calculée sur valeur NaN ou à côté de NaN

**Affichage** : `n=3 moyenne=NaN mediane=<NaN ou value incohérente>`

**Attendu** : rejet explicite avec message « Erreur : la ligne 2 ("abc") n'est pas un nombre valide. »

**Preuves** : `WORKFLOW_CALCULER_STATS` §Risques ; `bin/index.js:10`, pas de filtre.

---

## Règles métier et exigences

### Format d'entrée — Strict
**Règle 1** : L'entrée est un fichier texte UTF-8 contenant **un nombre par ligne**, séparateur `\n` uniquement.

**Codification** : `bin/index.js:10` — `.split("\n").map(Number)`.

**Non géré** :
- Fichier CSV réel (`.csv` avec colonnes, guillemets, séparateur `,`)
- Fichiers avec BOM (Byte Order Mark)
- Encodages non-UTF-8

**Incohérence documentaire** : `package.json:4` dit « statistiques sur fichiers CSV » ; `README.md` dit « `data.csv` ». La réalité est « un nombre par ligne ». `HYPOTHÈSE DE RÉCONCILIATION` : intention d'un pseudo-CSV monocolonne ; nomination maladroite.

**Recommandation** : corriger la documentation vers « un nombre par ligne » pour éviter la confusion utilisateur.

---

### Format d'entrée — Lignes vides et non numériques
**Règle 2** : Lignes vides et non numériques sont silencieusement converties via `Number()`.

- Ligne vide (`""`) → `Number("") = 0` (injecté dans le calcul)
- Ligne non numérique (`"abc"`) → `Number("abc") = NaN` (injecté dans le calcul)

**Codification** : `bin/index.js:10` — `.map(Number)`, comportement natif JavaScript.

**Cas problématique** : un utilisateur passant un fichier avec une ligne vide obtient un résultat faussé sans avertissement. Exemple : fichier `[10, "", 20]` → parsing `[10, 0, 20]` → moyenne `10` au lieu de `15`.

**Recommandation** : ajouter validation explicite (rejet ou conversion en 0 avec warning).

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

### Calcul de médiane paire — ANOMALIE
**Règle 5 — ACTUELLE (ERRONÉE)** : Médiane de liste de taille paire = élément à l'index `Math.floor(length/2)` après tri croissant.

**Codification** : `src/stats.js:10-11` — retourne `sorted[Math.floor(sorted.length / 2)]`.

**Exemple réel** : `median([1, 2, 3, 4])` → tri `[1, 2, 3, 4]`, index `Math.floor(4/2) = 2`, résultat `sorted[2] = 3` ✗.

**Attendu (par test de référence)** : `2.5` (moyenne des deux centraux : `(2 + 3) / 2`).

**Impact** : tout résultat de médiane sur fichier pair est statistiquement incorrect — l'utilisateur choisit toujours le quartile supérieur sans le savoir.

**Preuves** : test RED `test/stats.test.js:13-16` ; audit `FUNCTIONAL_AUDIT` §Anomalie fonctionnelle.

**État** : ✗ erronée, test RED, anomalie connue assumée au seed.

**Recommandation** : corriger `src/stats.js:10-11` pour ajouter condition :
```javascript
if (sorted.length % 2 === 0) {
  const mid = sorted.length / 2;
  return (sorted[mid - 1] + sorted[mid]) / 2;
}
return sorted[Math.floor(sorted.length / 2)];
```

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

**Codification** : `package.json` clé `scripts.test` → `node --test test/*.test.js` ; `test/stats.test.js` (3 tests).

**État actuel** : 3 tests · 2 passent · 1 échoue (médiane paire).

**Implications** :
- Le test échoué (`test/stats.test.js:13-16`) est une **preuve de l'anomalie**, pas un bug du test.
- Toute modification du code qui ferait passer ce test est valide ; toute modification qui le ferait échouer est une régression.
- Les 2 tests passants sont des critères d'acceptation incontournables pour la moyenne et la médiane impaire.

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

### Hors périmètre — Non implémenté et non prévu d'implémenter
- Options CLI (`--decimal`, `--format json`, `--verbose`)
- Multi-fichier en une invocation
- Autres séparateurs d'entrée (`,`, `;`, whitespace)
- Autres agrégats statistiques (min, max, écart-type, quantiles)
- Persistance des résultats (logs, fichier de sortie)
- Interface graphique ou web
- Authentification / contrôle d'accès (binaire sans état)

### Inachevé et indéterminable
- **Cas limites non spécifiés** : comportement attendu sur fichier vide, liste à un seul élément, valeurs négatives, décimales, très grandes valeurs (overflow). Aucun test, aucune documentation.
- **Interaction avec les locales** : le séparateur décimal est toujours `.` (JavaScript natif) ; pas de support de `,` pour les locales européennes, non documenté.
- **Gestion d'erreur** : message d'erreur non piloté, crash natif Node.

### Scénarios documentés comme supposément OK mais non testés
- Fichier vide
- Liste à un seul nombre
- Nombres négatifs
- Nombres décimaux avec haute précision

---

## Critères d'acceptation définitifs

Une modification du code sera acceptée si et seulement si :

1. ✓ Tous les 3 tests de `test/stats.test.js` passent (`npm test` → exit 0)
2. ✓ La chaîne golden path (fichier valide, entrée bien formée) produit résultat correct affichage `n=<nombre> moyenne=<m> mediane=<d>`
3. ✓ Aucune dépendance npm externe ajoutée
4. ✓ Module `src/stats.js` reste testable en isolation (imports clairs, pas d'effet de bord)
5. ✓ Pas de régression sur les comportements existants (moyenne impaire + médiane impaire resteront corrects)

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

## Questions ouvertes pour l'implémentation aval

1. **Médiane paire** : correction programmée dans le chantier aval ? Ou maintien volontaire de l'état RED pour la chaîne Paperclip ?
2. **Gestion d'erreur** : ajouter des gardes (argument absent, fichier absent, ligne non numérique) et messages explicites ?
3. **Documentation** : corriger « CSV » → « un nombre par ligne » ?
4. **Cas limites** : spécifier et tester comportement sur fichier vide, liste d'un élément ?
5. **Granularité des domaines** : suite-tests doit-elle s'étendre ou rester à 3 cas ?
