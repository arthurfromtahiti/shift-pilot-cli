# Architecture — Audit

> Confiance : high

## Compréhension globale

`shift-pilot-cli` est un outil CLI mono-usage, minimaliste par conception : 5 fichiers versionnés (`README.md`, `package.json`, `bin/index.js`, `src/stats.js`, `test/stats.test.js`), aucune dépendance externe, aucun build. L'architecture est plate, à deux niveaux : un point d'entrée (`bin/`) et une bibliothèque de calcul (`src/`). Sa taille et son rôle déclaré (banc d'essai SHIFT/Paperclip) suggèrent que cette platitude est intentionnelle, non un déficit.

## Résumé exécutif

L'architecture est cohérente avec la mission déclarée. Un seul module de logique métier (`src/stats.js`, 14 lignes) est séparé du point d'entrée CLI (`bin/index.js`, 12 lignes), ce qui constitue la découpe la plus naturelle et la plus suffisante à cette échelle. Il n'y a ni couche inutile, ni abstraction prématurée.

La seule dette structurelle observable est que `bin/index.js` concentre lecture de fichier, parsing, orchestration et formatage de sortie en 12 lignes non décomposées — ce qui est négligeable aujourd'hui mais deviendrait problématique si le périmètre de l'outil devait s'étendre (gestion des erreurs, multi-colonnes, options CLI). Aucune couche de validation d'entrée n'existe entre le système de fichiers et la logique de calcul ; l'absence de traitement des erreurs est fonctionnellement lisible dans `bin/index.js:8-10` sans `try/catch`.

Le package est déclaré `private: true` et `UNLICENSED` (`package.json:9-10`), il n'y a pas de build step ni de publication npm. `HYPOTHÈSE` : avec `private: true` et sans publication, la clé `bin` n'est activée que via `npm link` ou `npm install -g` en local — ce n'est pas observable dans ce dépôt seul, et d'autres modes d'installation locale pourraient aussi l'activer.

## Constats détaillés

**Découpe bin / src.** `VÉRIFIÉ_CODE` : `bin/index.js` importe `{ mean, median }` depuis `../src/stats` (`bin/index.js:6`). Ce découpage respecte la séparation entre code IO (lecture de fichier, affichage) et logique pure (calcul statistique). Pour un projet de cette taille, c'est la granularité juste : un dossier supplémentaire (`lib/`, `utils/`) ne ferait qu'ajouter du bruit.

**Absence de dépendances externes.** `VÉRIFIÉ_CODE` : `package.json` ne déclare ni `dependencies` ni `devDependencies` — les modules utilisés (`node:fs`, `node:test`, `node:assert/strict`) sont tous natifs Node ≥ 18 (`bin/index.js:5`, `test/stats.test.js:1-2`). C'est une force pour un outil de ce type : zéro surface d'attaque via la chaîne d'approvisionnement npm, zéro `node_modules` à gérer.

**Module CommonJS.** `VÉRIFIÉ_CODE` : `package.json:5` déclare `"type": "commonjs"`. Ce choix est cohérent avec l'utilisation de `require()` (`bin/index.js:5-6`, `test/stats.test.js:1-3`). Pas de mélange ESM/CJS détecté.

**bin/index.js mêle quatre responsabilités.** `VÉRIFIÉ_CODE` : les 12 lignes de `bin/index.js` font en séquence (1) lecture d'argument CLI, (2) lecture synchrone du fichier, (3) parsing ligne-par-ligne + conversion, (4) appel de calcul + formatage de sortie. Toutes dans un seul flux sans fonction nommée intermédiaire. Ce n'est pas un défaut bloquant à cette échelle, mais la moindre évolution (gestion d'erreurs, option `--separator`, sortie JSON) imposerait de tout découper.

**Contrainte Node ≥ 18 non outillée.** `HYPOTHÈSE` : la contrainte `"engines": {"node": ">=18"}` (`package.json:8`) est déclarative et ne sera vérifiée par npm que si l'appelant passe `--engine-strict`. Sur un environnement Node 16 ou 17, `require('node:test')` lèverait vraisemblablement `Error: Cannot find module 'node:test'` — message explicite mais qui n'indique pas la contrainte de version requise. Ce comportement n'a pas été reproduit dans cette analyse (l'environnement courant est Node ≥ 18).

## Forces

- Séparation nette entre logique de calcul (`src/stats.js`) et I/O (`bin/index.js`) : la fonction `median` peut être testée en isolation sans invoquer le CLI (`VÉRIFIÉ_CODE` — `test/stats.test.js:3`, `require("../src/stats")`).
- Zéro dépendance externe : pas de chaîne d'approvisionnement npm à auditer, pas de `node_modules`.
- `module.exports = { mean, median }` (`src/stats.js:14`) expose une API de module propre et nommée, non une exportation par défaut anonyme.

## Dettes techniques

- `bin/index.js` mélange sans découpe lecture de fichier, parsing, orchestration et affichage (`bin/index.js:8-12`) : toute évolution nécessiterait une refonte.
- Absence totale de gestion d'erreurs dans le point d'entrée (`bin/index.js`) : crash natif Node sur argument manquant, fichier absent ou lignes non numériques — voir audit `SECURITY_ROBUSTNESS`.

## Zones critiques

- `bin/index.js` : fichier d'entrée unique et non décomposé. Si ce projet grandit, c'est ici que la dette s'accumulera en premier.
- `src/stats.js:10-11` : implémentation de `median` avec un bug connu sur listes de taille paire — la logique de calcul est le cœur de valeur du projet, et elle contient l'anomalie principale.

## Risques

- **Rigidité de `bin/index.js` à l'évolution.** Si l'outil doit supporter plus d'un cas d'usage (autre séparateur, sortie JSON, plusieurs fichiers), le fichier sera difficile à faire évoluer sans réécriture complète. Impact : moyen. Preuve : `bin/index.js` (12 lignes, sans fonction nommée, sans option de commande).
- **Contrainte de version Node non enforced.** `HYPOTHÈSE` : un `node:test` absent sur Node < 18 ferait vraisemblablement échouer la suite avec `Error: Cannot find module 'node:test'` — erreur explicite mais peu lisible sans connaître la matrice de compatibilité. Impact : faible (l'écosystème Node 18+ est large). Preuve structurelle : `package.json:7-8` (contrainte non enforced).

## Recommandations priorisées

1. **Ne pas toucher à l'architecture pour l'instant** — elle est adaptée à la taille et au rôle du projet. Toute réorganisation serait prématurée avant de savoir si le périmètre fonctionnel va s'étendre.
2. **Si et seulement si le projet grandit** : extraire la lecture/parsing de `bin/index.js` dans une fonction nommée (`parseInputFile(chemin)`) pour permettre des tests unitaires sans invocation CLI (`bin/index.js:8-10`).
3. **Ajouter un garde de version explicite** en tête de `bin/index.js` si des environnements < 18 sont réellement en jeu (ex. `if (process.versions.node.split('.')[0] < 18) { ... exit(1) }`).

## Questions ouvertes

- Le projet est-il destiné à grandir (nouvelles statistiques, multi-fichiers, options CLI) ou à rester figé comme banc d'essai ? La réponse conditionne si la dette de `bin/index.js` mérite d'être traitée.
- La clé `bin` de `package.json` est-elle utilisée en pratique (via `npm link`) ou le dépôt est-il toujours invoqué en `node bin/index.js` direct ?
