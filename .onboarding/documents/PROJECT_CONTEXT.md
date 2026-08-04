# PROJECT_CONTEXT — shift-pilot-cli

> **Confiance** : high

## Résumé de trois lignes

**shift-pilot-cli** est un outil CLI minimaliste — 5 fichiers, zéro dépendance externe — qui lit un fichier texte (un nombre par ligne) et calcule et affiche la moyenne et la médiane d'une série. Créé comme banc d'essai pour la chaîne SHIFT/Paperclip, il hérite d'une anomalie de calcul intentionnelle (médiane paire) et d'une divergence documentaire (« CSV » vs. réalité « un nombre par ligne »).

## Nature du projet

**Domaine** : outil de calcul statistique minimaliste.

**Taille** : 5 fichiers versionnés (`README.md`, `package.json`, `bin/index.js`, `src/stats.js`, `test/stats.test.js`) ; ~40 lignes de code productif.

**Rôle déclaré** : banc d'essai pour la chaîne d'intégration SHIFT/Paperclip — vérifier la chaîne d'onboarding elle-même par un cas d'usage réel, minimaliste mais non trivial (calcul, tests, lancement).

**Charge technique** : zéro — pas de base de données, pas d'API, pas d'état persisté, pas de dépendance externe npm. Trois domaines purs : logique de calcul, application CLI, suite de tests.

**Périmètre** : entrée = un fichier ; sortie = une ligne sur stdout ; aucune interface réseau, aucune configuration, aucune authentification.

## Domaines clés et leur rôle

### `calcul-statistique` — Logique métier pure
Cœur mathématique : moyenne arithmétique et médiane d'une liste de nombres. Exporté comme module réutilisable (`mean`, `median` dans `src/stats.js`).

**État** :
- Moyenne ✓ implémentée correctement
- Médiane sur listes impaires ✓ correcte
- Médiane sur listes paires ✗ ANOMALIE — retourne l'élément central supérieur au lieu de la moyenne des deux centraux (`median([1,2,3,4])` → `3` au lieu de `2.5`)

**Critère d'acceptation** : suite de tests de référence (voir `suite-tests` ci-dessous). Actuellement RED (2/3 tests passent).

### `application-cli` — Point d'entrée et packaging
Orchestration complète : argue CLI → lecture fichier → parsing → calcul → affichage. Contrat de distribution en `package.json` (binaire `pilot-stats`, moteur Node ≥ 18, type `commonjs`).

**État** :
- Lecture/parsing fonctionnels sur entrée bien formée ✓
- Gestion d'erreur absente — crash natif Node sur argument absent ou fichier inexistant ✗
- Décalage documentaire : package.json et README disent « CSV », code parse « un nombre par ligne » ✗

**Critère d'acceptation** : parcours golden path (fichier valide → statistiques correctes affichées).

### `suite-tests` — Référence comportementale
Trois tests unitaires en `node:test` + `node:assert/strict` (zéro dépendances externes). **Rôle explicite** : la suite est la source de vérité — « tout écart entre le comportement et les tests est une anomalie » (README). Actuellement RED (1 échoue sur le calcul de médiane paire).

**État** : tests 3 · pass 2 · fail 1.

**Critère d'acceptation** : tous les tests passent.

## Points d'attention transversaux

### Anomalie de calcul connue et assumée
La médiane d'une liste de taille paire renvoie l'index `Math.floor(n/2)` au lieu de la moyenne des deux centraux. Le commit de seed note explicitement : *« la médiane paire est en échec — état assumé du seed »*. C'est une **anomalie par conception**, pas un oubli. Elle qualifie d'anomalie tout résultat de médiane sur entrée paire.

**Impact** : entrées de taille **paire** produisent une médiane erronée sans avertissement (inférence dérivée de l'implémentation `src/stats.js:10-11` et du test RED `test/stats.test.js:13-16`).

**Preuve** : `src/stats.js:10-11` ; `test/stats.test.js:13-16` (test RED) ; observation directe `npm test` (fail 1).

### Décalage documentaire — « CSV »
`package.json:4` et `README.md` décrivent l'entrée comme « fichiers CSV » ; le code parse réellement « un nombre par ligne, séparateur `\n` uniquement ». Un CSV standard (`1,2,3` sur une ligne) serait parsé comme un seul `NaN`.

**Impact** : risque de confusion utilisateur sur le format accepté.

**Preuve** : `bin/index.js:10` (`.split("\n").map(Number)`) vs. `package.json:4` (« statistiques sur fichiers CSV ») ; aucune gestion de `,` ou guillemets.

### Absence de gestion d'erreur
Argument absent → `TypeError: The "path" argument must be of type string` non capturé. Fichier absent → `ENOENT` non capturé. Ligne non numérique → silencieusement convertie en `NaN`, injectée dans le calcul.

**Impact** : utilisateur sans feedback explicite sur l'erreur ; résultats silencieusement faussés sur entrées mal formées.

**Preuve** : `bin/index.js:8-10`, pas de `try/catch` ni de validation.

## Zones critiques (priorité pour les modifications)

- **`src/stats.js:10-11`** — Médiane paire. Correction : ajouter condition sur parité pour moyenner les deux valeurs centrales. Localisée, testable, dépendance forte.
- **`bin/index.js:8-10`** — Parsing + orchestration. Zone où l'absence de gestion d'erreur rend le comportement opaque sur entrées malformées. Toute évolution (validations, options CLI) passe ici.
- **Documentation (`package.json:4`, `bin/index.js:2`, `README.md`)** — Terminologie incohérente « CSV ». Correction : remplacer par « un nombre par ligne ».

## Matrice de confiance

| Aspect | Confiance | Raison |
|--------|-----------|--------|
| Moyenne arithmétique | high | Implémentation standard, testée ✓ |
| Médiane impaire | high | Logique correcte, testée ✓ |
| Médiane paire | low | Anomalie connue, test RED |
| Gestion d'erreur | low | Absente, crash natif non piloté |
| Parsing d'entrée | medium | Fonctionne sur entrée bien formée ; silencieusement dégradé sur entrées mal formées |
| Documentation | medium | Terminologie incohérente (CSV vs. réalité) |
| Architecture | high | Découpe logique bin/src, pas de dépendance externe, adapted à la taille |

## Questions ouvertes récurrentes (relecture + amont)

1. **La médiane paire doit-elle être corrigée à court terme ?** Ou cet état rouge initial est-il voulu pour valider la chaîne CI/Paperclip (le commit de seed le laisse supposer) ?
2. **Le projet est-il destiné à rester figé** (pur banc d'essai) **ou à grandir** (d'autres agrégats, options CLI) ? Cela conditionne l'importance relative de la gestion d'erreur et de la flexibilité d'entrée.
3. **Cas limites à spécifier** : comportement attendu sur fichier vide, liste à un élément, décimal vs. entier, locales (`.` vs. `,` comme séparateur décimal).

## Preuves et références

- **Domaines** : `.onboarding/domaines/CARTE_DES_DOMAINES.md` (réconciliation complète 2026-08-04)
- **Workflows** : `.onboarding/workflows/WORKFLOW_CALCULER_STATS.md`, `WORKFLOW_EXECUTER_SUITE_TESTS.md`
- **Audits détaillés** : `FUNCTIONAL_AUDIT.md`, `ARCHITECTURE_AUDIT.md`, `SECURITY_ROBUSTNESS_AUDIT.md` (en `.onboarding/audits/`)
