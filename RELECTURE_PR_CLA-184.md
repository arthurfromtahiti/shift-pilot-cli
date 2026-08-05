# Relecture PR — CLA-184 Corriger la médiane paire dans `src/stats.js` — mode : correction

## Verdict global
À CORRIGER — le correctif dans `src/stats.js` traite bien la cause et la preuve rouge→vert est établie, mais l'impact onboarding annoncé `OUI` n'est pas répercuté : plusieurs artefacts `.onboarding` décrivent encore la médiane paire erronée comme comportement actuel.

SHA relu : `6ad241dc735e734ff971cff8345533de04cc583e`

## Tests (re-exécutés)
Verts — correction : rouge avant fix = OUI ; vert après = OUI.

- Avant fix (`HEAD^` = `767e28a`) : `npm test` rouge avec échec sur `test/stats.test.js:13` ; assertion observée `3 !== 2.5`.
- Après fix (`HEAD` = `6ad241d`) : `npm test` vert, `pass 3`, `fail 0`.

## 4 principes
- Réfléchir avant de coder : OK — le diff traite exactement la cause établie en `src/stats.js:10-13`, sans hypothèse additionnelle.
- Simplicité : OK — une condition de parité locale dans [src/stats.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/src/stats.js:10) suffit ; pas d'abstraction superflue.
- Changements chirurgicaux : RÉSERVE — le diff code de la branche par rapport à `origin/onboarding/artifacts` est bien limité à [src/stats.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/src/stats.js:10), mais l'impact onboarding déclaré `OUI` n'est pas suivi dans les artefacts cités.
- Exécution guidée par l'objectif : RÉSERVE — la preuve rouge→vert est bonne, mais l'objectif du ticket inclut explicitement un impact onboarding ; l'état courant du dépôt reste incohérent avec le comportement corrigé.

## Problèmes bloquants
- Impact onboarding non répercuté. Le ticket annonce `Impact onboarding : OUI`, pourtant plusieurs documents du dépôt décrivent encore l'ancien défaut comme état actuel, par exemple [CDC_FONCTIONNEL.md](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/.onboarding/documents/CDC_FONCTIONNEL.md:96), [FUNCTIONAL_AUDIT.md](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/.onboarding/audits/FUNCTIONAL_AUDIT.md:19) et [CODE_HOTSPOTS_AUDIT.md](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/.onboarding/audits/CODE_HOTSPOTS_AUDIT.md:19). En l'état, la branche corrige le code mais laisse la documentation de référence contradictoire avec le comportement testé.

## Problèmes mineurs
- Aucun sur le correctif lui-même : la formule paire dans [src/stats.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/src/stats.js:10) est correcte et ne change pas le cas impair.

## Points vérifiés et corrects
- Le test de reproduction existait déjà avant le fix dans `test/stats.test.js:13-16` et échoue avant correction pour la bonne raison (`3 !== 2.5`).
- Le correctif traite bien la cause établie : [src/stats.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/src/stats.js:10) moyenne désormais les deux valeurs centrales sur longueur paire.
- Le comportement voisin reste préservé : `npm test` valide toujours la moyenne simple et la médiane impaire.
- Le diff fonctionnel de la branche par rapport à `origin/onboarding/artifacts` est limité à `src/stats.js`.

## Recommandations
- `.onboarding/documents/CDC_FONCTIONNEL.md:96` — retirer ou réécrire les sections qui présentent la médiane paire comme anomalie courante.
- `.onboarding/audits/FUNCTIONAL_AUDIT.md:19` — mettre à jour le constat fonctionnel pour refléter que l'anomalie n'est plus présente sur le SHA corrigé.
- `.onboarding/audits/CODE_HOTSPOTS_AUDIT.md:19` — supprimer le hotspot devenu obsolète ou le requalifier en historique/résolu.
