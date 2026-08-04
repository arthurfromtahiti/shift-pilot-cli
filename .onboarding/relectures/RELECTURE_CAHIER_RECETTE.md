# Relecture — CAHIER_RECETTE.md

## Verdict global
À corriger — le document est utile, mais il embarque plusieurs cas de recette et attentes non dérivés d'un workflow réel ni prouvés par l'amont. Le principal défaut est d'étendre la recette à des comportements supposés plutôt qu'à des parcours déjà établis.

## Problèmes bloquants
- Les cas `TC-CLI-003 — décimales` et `TC-CLI-004 — nombres négatifs` ne sont pas traçables à un workflow réel ni à un audit qui les aurait explicitement établis comme parcours de recette. L'amont mentionne au contraire ces cas comme **questions ouvertes / cas limites non spécifiés**, voir `.onboarding/documents/PROJECT_CONTEXT.md` section `Questions ouvertes récurrentes`, `.onboarding/audits/FUNCTIONAL_AUDIT.md` section `Questions ouvertes`, et `WORKFLOW_CALCULER_STATS.md` section `Questions ouvertes`. En faire des tests avec `Attendu` ferme est une invention de périmètre.
- La preuve citée pour `TC-CLI-003` est elle-même révélatrice du problème : `CDC_FONCTIONNEL §Cas limites (non spécifiés mais doivent fonctionner)`. Si le cas est "non spécifié", il ne peut pas servir de base de recette normative. Le cahier de recette hérite ici d'une extrapolation du CDC au lieu d'un parcours amont prouvé.

## Problèmes mineurs
- Le `Setup : cloner le dépôt, npm install` n'est pas faux, mais l'amont insiste surtout sur l'absence de dépendances externes. Le `npm install` n'apporte rien de démontré à la recette ; `npm test` suffit à prouver l'exécution automatisée.

## Points vérifiés et corrects
- Les trois cas automatisés `TC-AUTO-001` à `TC-AUTO-003` sont correctement dérivés de `test/stats.test.js` et de `TESTING_AUDIT.md`.
- Les deux parcours CLI `golden path impair` et `golden path pair` sont bien alignés avec `.onboarding/workflows/WORKFLOW_CALCULER_STATS.md` et le `CDC_FONCTIONNEL.md` sur sa partie observée.
- La mise en évidence de l'anomalie de médiane paire est cohérente avec `FUNCTIONAL_AUDIT.md` et `TESTING_AUDIT.md`.

## Recommandations de correction
- Ramener le cahier de recette aux parcours réellement prouvés en amont : tests automatisés existants, golden path impair, golden path pair, et éventuellement cas d'erreur déjà observés si tu les assumes comme recette d'état actuel.
- Retirer les cas `décimales` et `négatifs`, ou les requalifier explicitement en pistes de recette futures / questions ouvertes, pas en critères d'acceptation actuels.
- Vérifier que chaque cas de recette renvoie soit à un workflow réel, soit à un test existant, soit à une observation explicitement documentée.
