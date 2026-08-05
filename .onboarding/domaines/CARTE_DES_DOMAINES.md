# Carte des domaines — shift-pilot-cli

> **Confiance globale : high** — dépôt minuscule (**5 fichiers versionnés** d'après `git ls-files` : `README.md`, `package.json` + 3 fichiers de code — `bin/index.js`, `src/stats.js`, `test/stats.test.js`), entièrement lu ligne à ligne. La carte est complète, pas un échantillon.
> **Mode d'onboarding : réconciliation** — la carte a été **produite une première fois en page blanche**, puis **reconfrontée au code courant le 2026-08-04** dans le cadre de CLA-164. À la reconfrontation, le distant `origin` ne porte toujours **aucun artefact d'onboarding** (`git ls-remote --heads origin 'onboarding/*'` vide ; seule `refs/heads/main` au SHA `a7038b1`), et le code est **inchangé depuis la première passe** (même SHA de tête `a7038b1`). La confrontation confirme la carte sans changement de fond : aucun domaine inventé, aucun pan fonctionnel manquant, état rouge de la suite réobservé à l'identique (voir note transverse). Le seul écart corrigé en réconciliation est le décompte de fichiers (4 → 5) ci-dessus.
> **Périmètre** : workspace `shift-pilot-cli` uniquement. Branche par défaut `main`, tête `f1cb153` (mise à jour post-CLA-251 et CLA-292).

## Nature du projet

Outil **CLI mono-usage** (`type: commonjs`, Node ≥ 18), présenté par son propre `package.json` comme un **« Pilote de test SHIFT/Paperclip »**. Sa description évoque un **CSV à une colonne de nombres**, mais l'ingestion réelle est plus étroite : le binaire lit un fichier passé en argument et le découpe **ligne par ligne** (`contenu.trim().split("\n").map(Number)`, `bin/index.js:10`) — pas de séparateur, pas de guillemets, pas de multi-colonnes ; « CSV » est ici, dans les faits, **un nombre par ligne**. Il en calcule la **moyenne** et la **médiane**, puis les imprime sur la sortie standard. Ce n'est ni une application web, ni une API, ni un SaaS : **aucune entité persistée, aucune route, aucune base de données, aucune authentification**. Le `README` en fait explicitement un banc d'essai : *« La suite de tests fait référence : tout écart entre le comportement et les tests est une anomalie. »* La valeur du dépôt tient donc autant à son **comportement de calcul** qu'à sa **suite de tests de référence**.

## Domaines

### Calcul statistique (`calcul-statistique`)
- **Catégorie** : métier
- **Priorité** : cœur
- **Confiance** : high
- **Description** : logique métier pure du produit — calcul de la **moyenne** (`mean`) et de la **médiane** (`median`) d'une liste de nombres. C'est la raison d'être de l'outil ; tout le reste (CLI, packaging, tests) existe pour l'exposer ou la vérifier.
- **Entités** : aucune (fonctions pures sur `Array<number>`, sans état ni persistance).
- **Routes / points d'entrée** : aucune route ; consommé en interne par `bin/index.js` via `require("../src/stats")`. API du module : `module.exports = { mean, median, parseValues }` (`VÉRIFIÉ_CODE` — `src/stats.js:31`, SHA `f1cb153`).
- **Indices de rattachement** : `src/stats.js`, symboles `mean` / `median`, `reduce`, `sort`, `Math.floor`.
- **Types de workflows attendus** : « calculer une statistique sur une série de nombres » (moyenne, médiane) ; extensions probables (autres agrégats : min/max/écart-type) si le produit grandit.
- **Preuves** : `src/stats.js` (module entier, 14 lignes) ; consommation `bin/index.js:6,12`.
- **Dépend de la base** : non.
- **Note d'observation (`OBSERVÉ`, hors périmètre de correction)** : la médiane d'une liste de **taille paire** ne suit **pas** la convention standard (moyenne des deux valeurs centrales). `median([1,2,3,4])` renvoie **`3`** — vérifié en exécutant `node -e '...median([1,2,3,4])'` → `3` — car `src/stats.js:10-11` retourne `sorted[Math.floor(length/2)]` sans moyenner. Voir la note transverse « État de la suite de tests » ci-dessous ; le *diagnostic* et la *correction* relèvent des étapes aval, pas de cette cartographie.

### Application CLI — point d'entrée, ingestion & packaging (`application-cli`)
- **Catégorie** : métier
- **Priorité** : cœur
- **Confiance** : high
- **Description** : l'enveloppe applicative complète, du manifeste jusqu'à la sortie standard. Le point d'entrée exécutable **lit l'argument de ligne de commande** (`process.argv[2]`), **charge le fichier** en synchrone (`fs.readFileSync`), **valide et parse l'entrée** via `parseValues(contenu)` qui extrait et valide les nombres, lève une erreur si le fichier est vide ou contient des valeurs non-numériques, puis délègue le calcul au domaine `calcul-statistique`, et **formate et imprime** le résultat (`n=… moyenne=… mediane=…`). Le **contrat de distribution** de ce même binaire vit dans `package.json` : déclaration `bin` (`pilot-stats` → `./bin/index.js`), contrainte de runtime (`engines.node >= 18`), type de modules (`type: commonjs`), statut (`private: true`, `UNLICENSED`). Ingestion, orchestration, rendu et packaging décrivent tous le **même exécutable** ; sur un dépôt à 5 fichiers versionnés (dont 3 de code), sans build ni publication npm observée, le manifeste est un **attribut de cette application CLI**, pas un domaine autonome — d'où leur regroupement (fusion de l'ex-`packaging-distribution` sur recommandation de relecture).
- **Entités** : aucune.
- **Routes / points d'entrée** : le binaire lui-même — shebang `#!/usr/bin/env node` (`bin/index.js:1`), exposé sous le nom `pilot-stats` via la clé `bin` de `package.json`. Invocation documentée : `node bin/index.js data.csv` (`README.md`).
- **Indices de rattachement** : `bin/index.js`, `process.argv`, `fs.readFileSync`, `split("\n")`, `map(Number)`, `console.log` ; `package.json` — clés `bin`, `engines`, `type`, `scripts`, symbole `pilot-stats`.
- **Types de workflows attendus** : « passer un fichier (un nombre par ligne) et obtenir n / moyenne / médiane » ; installation/liaison du binaire et contrainte de version Node ; gestion des cas limites d'entrée (fichier absent, entrée vide, lignes non numériques → `NaN`) — non gérés aujourd'hui, terrain probable d'évolution ; publication npm si le statut `private` change un jour.
- **Preuves** : `bin/index.js` (fichier entier, 12 lignes) ; `package.json` (fichier entier — clés `bin`, `engines`, `type`, `scripts`) ; `README.md` (section « Usage »).
- **Dépend de la base** : non.

### Suite de tests de référence (`suite-tests`)
- **Catégorie** : technique
- **Priorité** : support
- **Confiance** : high
- **Description** : filet de sécurité et **référence comportementale** du produit. Utilise le lanceur natif `node:test` + `node:assert/strict`, sans dépendance externe. Le `README` érige explicitement cette suite en source de vérité (*« tout écart entre le comportement et les tests est une anomalie »*), ce qui en fait un domaine à part entière et non un simple accessoire.
- **Entités** : aucune.
- **Routes / points d'entrée** : script npm `test` → `node --test test/*.test.js` (`package.json`). Trois cas : moyenne, médiane impaire, médiane paire.
- **Indices de rattachement** : `test/`, `*.test.js`, `node:test`, `node:assert/strict`, `npm test`.
- **Types de workflows attendus** : « lancer la suite et vérifier le comportement de `mean`/`median` » ; ajout de cas au fil des évolutions du domaine de calcul.
- **Preuves** : `test/stats.test.js` (fichier entier, 3 tests) ; `package.json` (`scripts.test`).
- **Dépend de la base** : non.

> **Note de granularité (relecture appliquée)** : un ex-domaine `packaging-distribution` (adossé au seul `package.json`) a été **fusionné dans `application-cli`**. Sur un dépôt à 5 fichiers versionnés, sans build ni publication, le manifeste décrit *comment s'installe et s'invoque le même binaire* que `bin/index.js` — un attribut de l'application CLI, pas un domaine autonome. La carte compte donc **3 domaines**, pas 4.

## Contenu piloté par la base

**Aucun.** Les trois signaux du §6 de `cartographier-domaines` ont été cherchés et **aucun n'est présent** : pas d'accès base (donc pas de signal schéma) ; aucune entité métier étendue d'un champ layout/builder/blocks/config (il n'y a aucune entité du tout) ; aucun service décodant une structure arborescente récursive (le seul code exécutable est `mean`/`median` sur des listes plates). Tous les domaines sont donc `Dépend de la base : non` — non par précaution, mais par absence vérifiée de signal.

## Note transverse — État de la suite de tests (`OBSERVÉ`)

Point d'attention explicite du board. **État réel observé le 2026-08-04, rapporté tel quel :**

`npm test` au SHA `a7038b1` → **ROUGE** : `tests 3 · pass 2 · fail 1`. Le test en échec est **« médiane d'une liste de taille paire »** (`test/stats.test.js:13-16`) :

```
✖ médiane d'une liste de taille paire
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  3 !== 2.5   (actual: 3, expected: 2.5)
  code: 'ERR_ASSERTION', exit=1
```

Le test attend `2.5` (moyenne des deux valeurs centrales de `[1,2,3,4]`) ; le code renvoie `3`. Ce n'est pas un flake : reproduit à l'identique en exécutant directement `median([1,2,3,4]) → 3`. Cohérent avec le message de commit de seed (*« la médiane paire est en échec — état assumé du seed »*). Le `README` désignant la suite comme référence, l'écart qualifie une **anomalie du code de calcul**, pas du test. **Aucune correction n'est apportée ici** (hors périmètre de l'étape 1 — lecture seule) ; le fait est consigné pour les étapes aval.

## Incertitudes

- **Granularité arbitrée à 3 domaines** (relecture appliquée). Une première version isolait `packaging-distribution` (adossé à `package.json`) comme 4ᵉ domaine ; sur un dépôt à 5 fichiers versionnés, il a été fusionné dans `application-cli` car le manifeste ne fait que décrire la distribution du même binaire. Le grain retenu distingue désormais du *comportement* (`calcul-statistique`), de l'*application* (`application-cli`) et de la *vérification* (`suite-tests`) — trois preuves réellement disjointes, sans sur-découper `bin/index.js`.
- **Intention produit.** S'agit-il d'un vrai outil destiné à grandir (d'où des domaines à faire mûrir) ou d'un pur banc d'essai figé pour la chaîne SHIFT/Paperclip (le nom et la description le suggèrent) ? Cela change la lecture de la « valeur » des domaines mais pas leur existence.
- **Cas limites d'entrée non spécifiés.** Comportement attendu pour fichier manquant, CSV vide, lignes non numériques (`Number("") → 0`, `Number("x") → NaN`) : ni codé, ni testé, ni documenté. Question ouverte pour l'analyse de workflows.
