# Relecture — CDC_FONCTIONNEL.md

## Verdict global
À corriger — le document est riche et utile, mais il introduit des comportements attendus non prouvés par l'amont. Un CDC peut poser des règles ; ici, plusieurs règles sont en réalité des prescriptions nouvelles que les workflows et audits ne documentent pas.

## Problèmes bloquants
- Les parcours `RISQUE : argument absent`, `RISQUE : fichier absent` et `RISQUE : entrée mal formée` inventent un **attendu cible** sous forme de messages d'erreur explicites (`Erreur : veuillez passer...`, `Erreur : le fichier ... n'existe pas...`, `Erreur : la ligne 2 ... n'est pas un nombre valide`). L'amont prouve l'inverse : absence de garde et crash/`NaN` actuels, voir `.onboarding/workflows/WORKFLOW_CALCULER_STATS.md` section `Risques` et `.onboarding/audits/SECURITY_ROBUSTNESS_AUDIT.md`. Ces messages n'existent ni dans le code ni dans les artefacts amont ; ils doivent être retirés ou requalifiés en hypothèses/recommandations.
- La section `Règles métier et exigences` transforme parfois des recommandations amont en exigences produit. Exemple : `Recommandation : corriger la documentation vers "un nombre par ligne"` est acceptable comme recommandation, mais les `Attendu` des parcours d'erreur sont formulés comme contrat fonctionnel sans source amont équivalente. Le document mélange donc état observé et cible de correction.

## Problèmes mineurs
- `HYPOTHÈSE DE RÉCONCILIATION : intention d'un pseudo-CSV monocolonne` est correctement marquée comme hypothèse, mais elle mériterait d'être déplacée dans une zone de limites/questions ouvertes pour ne pas brouiller la règle d'entrée prouvée (`split("\\n").map(Number)`).

## Points vérifiés et corrects
- Le cadrage général du produit, des acteurs et du format de sortie est bien traçable à `.onboarding/domaines/CARTE_DES_DOMAINES.md` et `.onboarding/workflows/WORKFLOW_CALCULER_STATS.md`.
- Les règles sur la moyenne correcte, la médiane impaire correcte et l'anomalie de médiane paire reprennent fidèlement `FUNCTIONAL_AUDIT.md` et `WORKFLOW_CALCULER_STATS.md`.
- La description de la contrainte Node >= 18 et du rôle de la suite de tests est cohérente avec `WORKFLOW_EXECUTER_SUITE_TESTS.md` et `TESTING_AUDIT.md`.

## Recommandations de correction
- Séparer strictement trois niveaux : comportement observé actuel, hypothèses d'interprétation, recommandations d'évolution.
- Supprimer des parcours d'erreur tout message utilisateur "attendu" qui n'est pas prouvé en amont.
- Si tu veux conserver une cible future, la descendre en `Questions ouvertes` ou `Recommandations`, jamais en exigence actuelle.
