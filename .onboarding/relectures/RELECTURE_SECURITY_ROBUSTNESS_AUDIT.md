# Relecture — SECURITY_ROBUSTNESS_AUDIT.md

## Verdict global
À corriger — le fond de l'audit est globalement juste, mais la discipline de preuve n'est pas tenue sur un point central. Des comportements runtime précis sont présentés en `VÉRIFIÉ_CODE` alors qu'ils exigent une observation d'exécution, et un autre comportement démontrable reste relégué en `HYPOTHÈSE`.

## Problèmes bloquants
- Le constat "Absence d'argument CLI" mélange lecture de code et symptôme runtime exact sous le statut `VÉRIFIÉ_CODE`. Ouvrir [bin/index.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/bin/index.js:8) permet de prouver que `process.argv[2]` est utilisé sans garde et que `fs.readFileSync` recevra `undefined`; en revanche, le type d'exception exact, son message complet et l'affichage d'une stack trace relèvent de l'exécution. J'ai observé `node bin/index.js` le 2026-08-04: `TypeError [ERR_INVALID_ARG_TYPE]` à [bin/index.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/bin/index.js:9). L'audit doit donc soit scinder `VÉRIFIÉ_CODE` / `OBSERVÉ`, soit retirer les détails runtime non observés.

## Problèmes mineurs
- Le constat "Ligne vide → `0` silencieux" est sous-qualifié en `HYPOTHÈSE` alors qu'il est vérifiable. Lecture de [bin/index.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/bin/index.js:10): `split(\"\\n\").map(Number)` suffit déjà à le démontrer. Reproduction observée le 2026-08-04 avec un fichier `1`, ligne vide, `3`: sortie `n=3 moyenne=1.3333333333333333 mediane=1`.
- Le constat "fichier vide interprété comme `[0]`" est correctement fondé, et il gagnerait à être élevé au statut `OBSERVÉ` puisque `node bin/index.js <fichier vide>` a produit `n=1 moyenne=0 mediane=0` le 2026-08-04.

## Points vérifiés et corrects
- L'absence de dépendances externes est exacte à la lecture de [package.json](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/package.json:1).
- L'absence d'exposition réseau et de secrets recopiés est cohérente avec l'ouverture de [bin/index.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/bin/index.js:1), [src/stats.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/src/stats.js:1) et [package.json](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/package.json:1).
- Le risque `NaN` silencieux est concret et correctement rattaché à [bin/index.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/bin/index.js:10) et [src/stats.js](/paperclip/instances/default/projects/be2f6065-a710-4a1d-8bb7-531efdbc6f23/98b69238-8403-474b-b5ae-b7d85608bd00/shift-pilot-cli/src/stats.js:3).

## Recommandations de correction
- Réécrire le constat sur l'argument manquant en séparant ce que la lecture du code prouve de ce que l'exécution a montré.
- Requalifier "ligne vide → `0`" en `VÉRIFIÉ_CODE` ou `OBSERVÉ`.
- Si tu gardes des détails d'erreur exacts (`ERR_INVALID_ARG_TYPE`, `ENOENT`, texte stderr), ajoute la commande observée et marque-les `OBSERVÉ`.
