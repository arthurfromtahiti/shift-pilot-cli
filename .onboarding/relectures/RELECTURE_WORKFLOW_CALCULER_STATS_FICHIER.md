# Relecture — WORKFLOW_CALCULER_STATS_FICHIER.md

## Verdict global
À corriger — le déroulement décrit correspond bien au code, mais ce document redocumente le même workflow que `WORKFLOW_CALCULER_STATS.md` avec une classification incompatible et plusieurs formulations plus spéculatives que prouvées. Le problème est de lot, pas seulement de style.

## Problèmes bloquants
- **Doublon fonctionnel avec `WORKFLOW_CALCULER_STATS.md`.** Les deux documents partent du même exécutable (`bin/index.js:1-12`), du même alias `pilot-stats` (`package.json:6`) et du même usage `node bin/index.js data.csv` (`README.md:6-10`). Les étapes 1 à 6 sont le même flux observé dans le code. Il n'y a pas deux workflows distincts prouvés ici, mais deux descriptions concurrentes du même.
- **Classification non défendue par les preuves du dépôt.** Le document classe ce flux en `user_journey` avec visibilité `external_user`, alors que le manifeste du dépôt indique `private: true` et `UNLICENSED` (`package.json:9-10`) et que le `README.md` parle d'un « Pilote de test SHIFT/Paperclip » (`README.md:3-4`). Ces éléments ne prouvent pas un parcours utilisateur externe ; ils pointent plutôt vers un outil interne ou de test. Présenter `external_user` comme un fait manque d'appui code/doc.

## Problèmes mineurs
- Le point d'entrée `pilot-stats <fichier>` « après npm link ou installation globale » relève de la sémantique npm générale, pas d'une intention explicitement documentée dans ce dépôt. La preuve locale sûre est seulement l'existence de la clé `bin` en `package.json:6`.

## Points vérifiés et corrects
- Le flux de calcul lui-même est exact : `process.argv[2]` (`bin/index.js:8`), `fs.readFileSync` (`bin/index.js:9`), `trim().split("\n").map(Number)` (`bin/index.js:10`), `mean` (`src/stats.js:3-5`), `median` (`src/stats.js:8-11`), puis sortie formatée (`bin/index.js:12`).
- Le risque « fichier vide » est correctement décrit : avec le parsing actuel, `"" -> [""] -> [0]`, donc la sortie devient artificiellement `n=1 moyenne=0 mediane=0` au lieu d'un rejet explicite (`bin/index.js:10-12`).
- Le conflit entre code et test sur la médiane paire est bien identifié et prouvé par `src/stats.js:8-11` et `test/stats.test.js:13-15`.

## Recommandations de correction
- Supprimer le doublon avec `WORKFLOW_CALCULER_STATS.md` ou fusionner les deux en un seul workflow CLI.
- Si une classification orientée utilisateur est conservée, la reformuler comme hypothèse ou la justifier avec une preuve explicite du dépôt ; sinon rester sur une qualification technique/internal plus défendable au vu de `README.md` et `package.json`.
