# Modèle de données — Audit

> Confiance : high

## Compréhension globale

`shift-pilot-cli` ne dispose d'aucun modèle de données persisté : ni base de données, ni ORM, ni schéma de migration, ni entité métier. Les seules données traitées sont en mémoire, éphémères, et structurées à la volée lors de chaque exécution : un tableau de `number` JavaScript dérivé d'un fichier texte passé en argument.

## Résumé exécutif

Il n'y a rien à auditer au sens classique du terme (tables, relations, contraintes, migrations). Ce constat est lui-même une information structurelle utile : le projet ne génère pas de dette de modèle de données, ne présente aucun risque de migration, et n'a pas besoin de couche ORM. La seule structure de données du projet — `Array<number>` — est implicite et non typée, ce qui génère les risques fonctionnels déjà documentés dans l'audit `SECURITY_ROBUSTNESS` (valeurs `NaN` et `0` silencieuses).

## Constats détaillés

**Aucune persistance.** `VÉRIFIÉ_CODE` : aucun import de pilote de base de données, aucun fichier de schéma, aucune migration dans les 5 fichiers versionnés. Recherche sur `sqlite`, `pg`, `mysql`, `mongoose`, `sequelize`, `prisma`, `typeorm`, `knex` — non localisé.

**Structure de données unique : `Array<number>`.** `VÉRIFIÉ_CODE` : `bin/index.js:10` produit `valeurs` = `contenu.trim().split("\n").map(Number)`. Ce tableau est la seule structure de données qui circule dans le programme. Elle est créée à chaque exécution, passée à `mean()` et `median()` (`src/stats.js`), et abandonnée en fin d'exécution. Aucune sérialisation, aucune mise en cache, aucun état global.

**Format d'entrée : texte brut, un nombre par ligne.** `VÉRIFIÉ_CODE` : le séparateur est `\n` (`bin/index.js:10`, `.split("\n")`). Le commentaire en tête de `bin/index.js` et le `package.json:4` évoquent « CSV », mais le parsing réel ne gère ni guillemets, ni séparateur `;` ou `,`, ni multi-colonnes. Le terme « CSV » est inexact ; le format réel est un fichier texte à une colonne de nombres.

**Format de sortie : chaîne formatée sur stdout.** `VÉRIFIÉ_CODE` : `console.log(\`n=${valeurs.length} moyenne=${mean(valeurs)} mediane=${median(valeurs)}\`)` (`bin/index.js:12`). Pas de sérialisation JSON, pas de fichier de sortie, pas de format structuré : une seule ligne texte sur stdout.

**Aucune entité métier.** Conformément à la carte des domaines (`.onboarding/domaines/CARTE_DES_DOMAINES.md`), aucun domaine n'est `Dépend de la base : oui`. Le fichier `CONTENU_<DOMAINE>.md` conditionnel n'est pas produit, ce qui est la disposition correcte.

## Forces

- Absence totale de complexité de modèle de données : zéro risque de migration, zéro dette ORM, zéro problème de schéma.
- Structure de données explicite et prévisible : `Array<number>`, produite en une ligne de code lisible.

## Dettes techniques

- Le type du tableau `valeurs` n'est pas validé en amont de `parseValues()` : il peut contenir `NaN` sans que le code de calcul le signale. `parseValues()` rejette les chaînes non-numériques, les lignes vides et, depuis SHA `dcdbf44` (SHIAAAAAAAAAAAAAAAAAAAAA-295), `"Infinity"` et `"-Infinity"` via `!Number.isFinite(Number(l))` (`src/stats.js:26`). Le NaN produit par d'autres vecteurs (ex. `Number("…")` dans `bin/index.js`) reste non géré.
- La description « CSV » (`package.json:4`, `bin/index.js:2`, `README.md`) est inexacte par rapport au parsing réel. Ce décalage terminologique peut induire en erreur un utilisateur qui tenterait de passer un vrai fichier CSV multi-colonnes.

## Zones critiques

Il n'existe pas de zone critique au sens du modèle de données. Le seul point d'attention est la ligne de parsing (`bin/index.js:10`), déjà couverte dans l'audit `SECURITY_ROBUSTNESS`.

## Risques

- **Terminologie « CSV » inexacte** : un utilisateur qui passe un fichier CSV standard (séparateur `,`, éventuellement plusieurs colonnes) obtiendra des `NaN` silencieux, filtrés par `parseValues()` qui demandera une erreur. Impact : faible (outil interne), mais source de confusion. Preuve : `bin/index.js:10` (`.split("\n")` sans gestion du `,`), `package.json:4`.
- **NaN propagé en entrée** : si `Number()` convertit une chaîne en `NaN` (cas limite non tracé), le NaN se propage dans les calculs. La validation de `parseValues()` (non-numériques) intercepte les chaînes explicitement invalides, mais pas les `NaN` qui résulteraient d'une entrée numérique malformée après parsing.

## Recommandations priorisées

1. **Corriger la terminologie** dans `package.json:4`, `bin/index.js:2` et `README.md` : remplacer « CSV » par « fichier texte, un nombre par ligne » pour aligner la description sur le comportement réel.

## Questions ouvertes

- Le format d'entrée est-il destiné à évoluer vers un vrai CSV (séparateur `,`, potentiellement multi-colonnes) ou restera-t-il un fichier texte à une colonne ?
- La sortie doit-elle un jour être structurée (JSON, CSV) plutôt qu'une ligne de texte libre ?
