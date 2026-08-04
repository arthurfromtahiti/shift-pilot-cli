# Fonctionnel — Audit

> Confiance : high

## Compréhension globale

`shift-pilot-cli` remplit une mission unique et déclarée : lire un fichier texte à raison d'un nombre par ligne et afficher sur stdout le nombre d'éléments, la moyenne et la médiane. Sur entrée valide et bien formée (un nombre entier ou décimal par ligne, sans ligne vide, sans en-tête), le produit est fonctionnellement presque complet — la moyenne est correcte, la médiane sur listes impaires est correcte — à l'exception d'un défaut de calcul avéré : la médiane sur listes paires. Ce défaut est la divergence principale entre ce que le code produit et ce que la spécification (les tests de référence) attend. Par ailleurs, un décalage de contrat existe entre la description « CSV » (README, package.json) et le parsing réel « un nombre par ligne » : ce n'est pas un bug de calcul, mais un écart documentaire aux effets potentiellement trompeurs.

## Résumé exécutif

Le produit répond à sa mission déclarée avec une seule anomalie connue et reproductible : `median([1,2,3,4])` retourne `3` au lieu de `2.5`. Cette anomalie est documentée dans le message de commit de seed comme « état assumé » — elle ne résulte pas d'un oubli mais d'un choix délibéré de laisser cet état rouge pour l'étape de correction aval. Le `README.md` désigne la suite de tests comme source de vérité, ce qui confère une clarté fonctionnelle bienvenue : la spec est dans les tests, le code doit s'y aligner.

Par ailleurs, le produit souffre d'un décalage entre sa description (« CSV ») et son comportement réel (un nombre par ligne, sans gestion du séparateur `,`). Ce décalage n'affecte pas le fonctionnement sur entrées correctes mais peut créer de la confusion pour un utilisateur qui s'attendrait à pouvoir passer un vrai fichier CSV.

## Constats détaillés

**Fonctionnalité principale : calcul de statistiques sur une liste de nombres.** `VÉRIFIÉ_CODE` : `bin/index.js` orchestre la chaîne complète — lecture de fichier (`bin/index.js:9`), parsing (`bin/index.js:10`), calcul (`bin/index.js:12` via `mean()` et `median()` de `src/stats.js`), affichage (`bin/index.js:12`). Sur une entrée valide, la chaîne fonctionne correctement pour la moyenne et pour les listes impaires.

**Anomalie fonctionnelle sur la médiane paire.** `OBSERVÉ` : `npm test` au SHA `a7038b1` confirme `3 !== 2.5`. `VÉRIFIÉ_CODE` : `src/stats.js:10-11` retourne `sorted[Math.floor(sorted.length / 2)]` sans condition sur la parité. Pour tout fichier d'entrée contenant un nombre pair de lignes, la médiane affichée sera l'élément central supérieur (index `n/2`) et non la moyenne des deux éléments centraux (`(sorted[n/2-1] + sorted[n/2]) / 2`). Sur entrée bien formée (un nombre par ligne, sans ligne vide), c'est la seule anomalie de calcul avérée.

**Conformité de la moyenne.** `VÉRIFIÉ_CODE` : `mean()` calcule la somme via `reduce` puis divise par `values.length` (`src/stats.js:3-5`). Confirmé par `test/stats.test.js:5-7` (test passant : `mean([2,4,6]) === 4`). Implémentation mathématiquement correcte pour la moyenne arithmétique.

**Conformité de la médiane impaire.** `VÉRIFIÉ_CODE` : `median([9,1,5])` → tri de `[9,1,5]` en `[1,5,9]`, index `Math.floor(3/2) = 1`, résultat `5`. Confirmé par `test/stats.test.js:9-11` (test passant). Correct pour les listes impaires.

**Affichage du résultat.** `VÉRIFIÉ_CODE` : le format de sortie est `n=<longueur> moyenne=<valeur> mediane=<valeur>` (`bin/index.js:12`). Ce format est informel mais lisible. Aucun formatage décimal (ex. `toFixed(2)`) n'est appliqué — les résultats flottants sont affichés avec la précision native JavaScript.

**Décalage terminologique « CSV ».** `VÉRIFIÉ_CODE` : `package.json:4` (« statistiques sur fichiers CSV »), `bin/index.js:2` (commentaire « Usage : pilot-stats <fichier.csv> »), `README.md:3` (section « Usage » avec `data.csv`). Le parsing réel ne gère qu'un nombre par ligne, séparateur `\n` exclusivement (`bin/index.js:10`). Un fichier CSV standard (`1,2,3` sur une ligne) serait parsé comme un seul élément `NaN` (ou une chaîne non numérique).

**Cas limites fonctionnellement non spécifiés.** `HYPOTHÈSE` : le comportement attendu sur fichier vide, fichier à une seule valeur, fichier avec des valeurs négatives ou décimales n'est ni documenté ni testé. Le code accepte silencieusement les valeurs décimales et négatives (correctement, au sens JavaScript), mais les cas dégénérés (vide, NaN) ne sont pas spécifiés.

**Aucune fonctionnalité inachevée ou partiellement implémentée.** `VÉRIFIÉ_CODE` : le code ne contient pas de commentaires `TODO`, `FIXME`, `WIP`, ni de branche morte visible. Le projet ne prétend faire qu'une chose, et il la fait sur entrée bien formée — à l'exception de la médiane paire.

## Forces

- Périmètre fonctionnel clair et restreint : une commande, une entrée, une sortie. Pas de feature creep.
- La suite de tests est explicitement érigée en source de vérité (`README.md`) : le contrat comportemental est lisible par tous.
- Moyenne arithmétique standard correctement implémentée et testée.
- Médiane sur listes impaires correctement implémentée et testée.

## Dettes techniques

- Médiane sur listes paires incorrecte : défaut fonctionnel sur 50 % des tailles d'entrée possibles (`src/stats.js:10-11`).
- Décalage entre la description « CSV » et le parsing réel « un nombre par ligne » : risque de confusion utilisateur (`package.json:4`, `bin/index.js:2`, `README.md`).
- Comportement sur entrées dégénérées non spécifié et non testé : liste vide, valeurs NaN, argument CLI absent.

## Zones critiques

- **`src/stats.js:10-11`** : la médiane paire est le seul défaut de calcul avéré sur entrée valide. Sa correction est localisée et prévisible.
- **La chaîne de parsing `bin/index.js:10`** : zone où la rigueur fonctionnelle peut être compromise silencieusement (lignes vides → `0`, lignes non numériques → `NaN`).

## Risques

- **Résultats silencieusement incorrects sur entrées paires.** Tout utilisateur passant un fichier de 2, 4, 6, … valeurs obtient une médiane incorrecte sans message d'erreur. Impact : élevé si l'outil est utilisé pour des décisions basées sur la médiane. Preuve : `src/stats.js:10-11`, `OBSERVÉ npm test`.
- **Confusion utilisateur sur le format d'entrée.** Le terme « CSV » dans la documentation peut conduire un utilisateur à passer un fichier multi-colonnes et recevoir des `NaN` sans explication. Impact : faible pour un outil interne, mais problème de qualité documentaire.

## Recommandations priorisées

1. **Corriger `median()` dans `src/stats.js:10-11`** : ajouter la condition de parité pour retourner la moyenne des deux valeurs centrales sur les listes de taille paire. C'est la priorité fonctionnelle absolue — elle rend la suite de référence verte et aligne le comportement sur la spécification.
2. **Corriger la terminologie** dans `package.json`, `bin/index.js` et `README.md` : « un nombre par ligne » plutôt que « CSV ».
3. **Documenter et tester les cas limites** : spécifier le comportement attendu pour liste vide, valeur NaN, argument absent, et l'implémenter ou le rejeter explicitement.

## Questions ouvertes

- La correction de la médiane paire est-elle prévue dans le chantier aval immédiat, ou cet état rouge est-il maintenu délibérément pour une raison de processus (ex. valider la chaîne de détection CI) ?
- Le projet est-il destiné à rester un banc d'essai figé (périmètre constant) ou à évoluer vers d'autres agrégats (min, max, écart-type) ? La réponse conditionne l'importance relative de la couverture des cas limites.
- Quel est le comportement souhaité pour un fichier à zéro ligne, ou un fichier ne contenant qu'une valeur numérique ? Ces cas doivent être spécifiés avant d'être implémentés.
