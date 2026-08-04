# Sécurité & Robustesse — Audit

> Confiance : high

## Compréhension globale

`shift-pilot-cli` est un outil CLI invoqué localement, sans réseau, sans authentification, sans base de données et sans surface web. La surface d'attaque est réduite à son minimum : un fichier texte sur le système de fichiers et un argument de ligne de commande. En revanche, la robustesse opérationnelle est très faible : aucun cas d'erreur attendu n'est traité, tout problème d'entrée provoque un crash natif Node non instrumenté.

## Résumé exécutif

Sur le plan de la **sécurité**, le projet est propre par construction : aucun secret, aucune authentification, aucune donnée personnelle, aucune dépendance externe, aucune exposition réseau. Le seul vecteur envisageable (injection via le contenu du fichier) ne présente aucun risque dans ce contexte d'exécution — `Number()` ne peut pas exécuter de code.

Sur le plan de la **robustesse**, le tableau est plus sévère. `bin/index.js` ne défend aucun cas d'erreur prévisible : argument manquant, fichier absent, lignes non numériques, tableau vide — tous sont des chemins d'exécution qui produisent soit une erreur native non gérée, soit une valeur silencieuse (`NaN`, `0`) sans avertissement. Pour un banc d'essai interne, le risque opérationnel est faible ; pour un outil destiné à être intégré dans un pipeline CI, ce serait bloquant.

## Constats détaillés

**Absence d'argument CLI (`process.argv[2]` undefined).** `VÉRIFIÉ_CODE` : `bin/index.js:8` affecte `process.argv[2]` à `chemin` sans vérifier sa présence. À la ligne suivante, `fs.readFileSync(chemin, "utf8")` (`bin/index.js:9`) recevra `undefined` — la lecture du code suffit à le prouver. `OBSERVÉ (2026-08-04)` : l'exécution de `node bin/index.js` sans argument produit immédiatement `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined` à `bin/index.js:9`, avec un stack trace Node complet sur stderr et un exit code non nul.

**Fichier absent ou inaccessible.** `VÉRIFIÉ_CODE` : même chemin de code (`bin/index.js:9`), `fs.readFileSync` est appelé sans `try/catch` — toute erreur système est non capturée et remonte comme exception Node non gérée. `INFÉRENCE (comportement Node documenté)` : le cas typique lève `Error: ENOENT: no such file or directory` pour un fichier absent, ou `Error: EACCES: permission denied` pour un fichier inaccessible.

**Lignes non numériques injectées silencieusement.** `VÉRIFIÉ_CODE` : `bin/index.js:10` applique `.map(Number)` sur chaque ligne. `Number("abc")` vaut `NaN`, `Number("")` vaut `0` — sans rejet ni avertissement. Ces valeurs traversent ensuite `mean()` et `median()` : `mean([1, NaN, 3])` vaut `NaN` (`src/stats.js:3-5`), affiché tel quel sur stdout. Il n'y a ni validation au moment du parsing, ni assertion dans `mean`/`median`.

**Ligne vide → `0` silencieux.** `VÉRIFIÉ_CODE` : `bin/index.js:10` applique `.split("\n").map(Number)` — `Number("") === 0` est un comportement garanti du langage, donc une ligne vide interne produit nécessairement un `0` dans le tableau. `contenu.trim()` supprime les espaces en tête et queue du fichier entier mais ne filtre pas les lignes vides internes. `OBSERVÉ (2026-08-04)` : avec un fichier contenant `1`, une ligne vide, puis `3`, la sortie est `n=3 moyenne=1.3333333333333333 mediane=1` — le `0` fausse silencieusement les calculs sans aucun avertissement.

**Tableau vide impossible mais sous-spécifié.** `VÉRIFIÉ_CODE` : si le fichier ne contient que des espaces, `contenu.trim()` produit `""`, puis `.split("\n")` produit `[""]`, puis `.map(Number)` produit `[0]` — la lecture du code le prouve. `OBSERVÉ (2026-08-04)` : l'exécution de `node bin/index.js <fichier vide>` produit `n=1 moyenne=0 mediane=0`. Le tableau n'est donc jamais strictement vide via ce chemin — mais le comportement (interpréter un fichier vide comme `[0]`) est non documenté et non testé.

**Aucun secret en clair.** `VÉRIFIÉ_CODE` : recherche sur `password`, `token`, `secret`, `key`, `api` dans les 5 fichiers versionnés — non localisé. Aucun secret dans le code.

**Aucune dépendance externe.** `VÉRIFIÉ_CODE` : `package.json` ne déclare aucun champ `dependencies` ni `devDependencies`. Surface de supply-chain nulle.

**Aucune exposition réseau.** `VÉRIFIÉ_CODE` : aucun import de `http`, `https`, `net`, `fetch` dans les 3 fichiers de code. L'outil ne communique qu'avec le système de fichiers local et stdout.

## Forces

- Zéro dépendance externe : surface de supply chain npm nulle, aucun paquet tiers à auditer.
- Aucun secret dans le code source.
- Aucune exposition réseau, pas d'authentification à gérer.
- `Number()` ne peut pas exécuter de code arbitraire — aucun risque d'injection via le contenu du fichier.

## Dettes techniques

- Aucune gestion des erreurs dans `bin/index.js` : argument manquant, fichier absent, lignes non numériques — toutes ces branches crash sans message utilisateur (`bin/index.js:8-10`).
- Aucune validation de l'entrée avant le calcul : `NaN` et `0` (ligne vide) peuvent traverser silencieusement vers les fonctions de calcul et produire des résultats incorrects sans avertissement (`bin/index.js:10`, `src/stats.js`).

## Zones critiques

- `bin/index.js:8-10` : les trois lignes qui lisent, parsent et produisent le tableau `valeurs` concentrent tous les points de faiblesse de robustesse du projet. Un `try/catch` global, un garde sur `process.argv[2]`, et un filtre `isFinite()` avant le calcul couvriraient la majorité des cas d'erreur prévisibles.

## Risques

- **Crash non instrumenté sur argument manquant** : `node bin/index.js` sans argument produit une stack trace Node opaque. Impact : faible pour usage interne, rédhibitoire si intégré dans un pipeline CI. Preuve code : `bin/index.js:8-9`. `OBSERVÉ (2026-08-04)` : `TypeError [ERR_INVALID_ARG_TYPE]` à `bin/index.js:9`.
- **`NaN` silencieux en résultat** : une ligne non numérique produit un résultat `NaN` affiché sans avertissement, que l'utilisateur peut interpréter comme un résultat valide. Preuve : `bin/index.js:10`, comportement natif de `Number()`.
- **Ligne vide → `0` inattendu** : un fichier avec des lignes vides internes fausse silencieusement les calculs. Preuve code : `bin/index.js:10`, `Number("") === 0`. `OBSERVÉ (2026-08-04)` : sortie `n=3 moyenne=1.333... mediane=1` pour un fichier `1\n\n3`.

## Recommandations priorisées

1. **Ajouter un garde sur `process.argv[2]`** avant `fs.readFileSync` (`bin/index.js:8`) : `if (!chemin) { console.error("Usage: pilot-stats <fichier>"); process.exit(1); }` — une ligne, zéro ambiguïté.
2. **Encapsuler `fs.readFileSync` dans un `try/catch`** (`bin/index.js:9`) pour retourner un message d'erreur lisible sur `ENOENT`/`EACCES` plutôt qu'une stack trace native.
3. **Rejeter les entrées invalides avant le calcul** (`bin/index.js:10`) : deux problèmes distincts qui exigent deux filtres à deux niveaux différents — l'ordre est impératif.
   - **Lignes vides → `0` silencieux** : `Number("") === 0`, donc `.filter(Number.isFinite)` appliqué *après* `.map(Number)` ne détecte pas les lignes vides — elles ont déjà été converties en `0`, valeur finie et non nulle. Le filtrage des lignes vides doit s'opérer *avant* la conversion numérique, au niveau de la chaîne : `.filter(s => s.trim() !== "")`.
   - **Valeurs non numériques (ex. `"abc"`) → `NaN`** : `Number("abc")` vaut `NaN`. Appliqué *après* `.map(Number)`, `.filter(Number.isFinite)` éjecte ces `NaN` résiduels. Ce filtre n'a aucun effet sur les lignes vides (déjà converties en `0` fini).
   - Chaîne complète couvrant les deux cas : `.split("\n").filter(s => s.trim() !== "").map(Number).filter(Number.isFinite)`. Inverser l'ordre — `.map(Number)` puis tenter de filtrer les chaînes — est impossible et ne permettrait pas de distinguer une ligne vide (`0`) d'un zéro légitime.

## Questions ouvertes

- Le comportement attendu pour une ligne non numérique est-il `NaN` (erreur silencieuse), une erreur explicite (exit 1), ou un filtrage silencieux ?
- Les lignes vides doivent-elles être ignorées ou interprétées comme `0` ?
- Un usage CI de cet outil est-il prévu ? Si oui, un exit code `0`/`1` fiable (avec gestion d'erreurs) devient indispensable.
