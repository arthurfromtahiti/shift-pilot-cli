# WORKFLOW_CALCULER_STATS — Calcul de la moyenne et de la médiane d'un fichier de nombres

## Classification
- **Type** : `technical_flow`
- **Sous-type** : outil CLI de calcul statistique
- **Visibilité** : `technical`
- **Acteur principal** : utilisateur technique (développeur ou pipeline CI) qui invoque le binaire
- **Acteurs** : utilisateur CLI, système de fichiers local, stdout
- **Criticité** : Haute — c'est la raison d'être unique de l'outil ; tout le dépôt existe pour ce flux
- **Confiance** : high
- **Justification** : les 19 lignes de `bin/index.js` et les 31 lignes de `src/stats.js` ont été lues en intégralité — le flux est court et sans branche cachée. Plusieurs cas limites non triviaux sont présents (argument absent, fichier absent, fichier vide, valeur non-numérique, médiane paire) ; chacun est tracé en section Risques et Règles métier avec preuves.

## Objectif
Permettre à un utilisateur technique de passer un fichier texte contenant un nombre par ligne et d'obtenir immédiatement sur la sortie standard le nombre d'éléments (`n`), la moyenne arithmétique (`moyenne`) et la médiane (`mediane`) de cette série. Aucun état n'est persisté ; le flux produit uniquement une ligne sur stdout puis se termine.

## Acteurs
- **Utilisateur technique** : déclenche le binaire en passant le chemin de fichier en argument
- **Système de fichiers local** : source des données (lecture synchrone)
- **stdout** : destination unique du résultat

## Points d'entrée
- Commande documentée : `node bin/index.js data.csv` (`README.md`, section « Usage »)
- Alias npm installable : `pilot-stats <fichier>` via la clé `bin: { "pilot-stats": "./bin/index.js" }` (`package.json:6`)
- Déclenchement direct du script Node : shebang `#!/usr/bin/env node` (`bin/index.js:1`)

## Étapes principales
1. **Lecture de l'argument** : `process.argv[2]` est affecté à `chemin` (`bin/index.js:8`). Aucune vérification de présence ou de validité.
2. **Chargement du fichier** : `fs.readFileSync(chemin, "utf8")` (`bin/index.js:9`) — lecture synchrone, bloquante. Si le fichier est absent ou inaccessible, Node lève une erreur native non capturée (`ENOENT` / `EACCES`) et le processus se termine avec un code d'erreur non nul.
3. **Validation et parsing** : `parseValues(contenu)` (`bin/index.js:13`) → `src/stats.js:17-28` (CORRIGÉ — CLA-251)
   - `.trim()` supprime les espaces/retours en tête/queue
   - Rejette si le fichier est vide → lève `Error("Le fichier est vide.")`
   - `.split("\n")` découpe ligne par ligne
   - `.map(Number)` convertit chaque ligne en nombre
   - Filtre les invalides (où `Number.isNaN(values[i])`) et lève `Error("Valeurs non-numériques : ...")` si au moins une est trouvée
   - Le `try/catch` (`bin/index.js:12-17`) intercepte les erreurs, écrit sur stderr, et quitte avec code 1
4. **Calcul de la moyenne** : appel à `mean(valeurs)` (`bin/index.js:19`) → `src/stats.js:3-5`. Somme tous les éléments par `reduce((acc, v) => acc + v, 0)` puis divise par `values.length`. Sur tableau vide : `0 / 0 = NaN` (impossible maintenant — `parseValues` rejette fichier vide).
5. **Calcul de la médiane** : appel à `median(valeurs)` (`bin/index.js:19`) → `src/stats.js:8-14`. Copie le tableau (`[...values]`), trie par ordre croissant (`sort((a, b) => a - b)`), condition de parité : retourne `(sorted[mid-1] + sorted[mid]) / 2` si pair, `sorted[mid]` si impair (CORRIGÉ — CLA-184).
6. **Impression du résultat** : `console.log(\`n=${valeurs.length} moyenne=${mean(valeurs)} mediane=${median(valeurs)}\`)` (`bin/index.js:19`) — une seule ligne sur stdout ; aucun formatage décimal supplémentaire.

## Règles métier
- **Format d'entrée strict : un nombre par ligne.** Le séparateur est exclusivement `\n` (`src/stats.js:22` — `.split("\n")`). Pas de gestion du séparateur `;` ni des guillemets CSV. La description « CSV » dans `package.json:4` et `README.md:3` est inexacte : c'est un fichier texte à une colonne, pas un CSV.
- **Validation stricte des entrées (CLA-251).** Fichier vide → rejet avec `Error("Le fichier est vide.")` ; ligne non-numérique → rejet avec `Error("Valeurs non-numériques : ...")` ; implémentation : `src/stats.js:17-28` (`VÉRIFIÉ_CODE` — SHA `f1cb153`). Le comportement silencieux de conversion NaN est éliminé.
- **Médiane d'une liste de taille paire : moyenne des deux valeurs centrales (CORRIGÉE — CLA-184).** `src/stats.js:11-12` retourne `(sorted[mid-1] + sorted[mid]) / 2` si la liste est de taille paire. Pour `[1,2,3,4]`, `mid = Math.floor(4/2) = 2`, soit `(sorted[1] + sorted[2]) / 2 = (2 + 3) / 2 = 2.5` ✓ (VÉRIFIÉ — test vert `test/stats.test.js:13-16`, SHA `f1cb153`).
- **Moyenne arithmétique standard.** `mean([2,4,6])` → `4` (`VÉRIFIÉ_CODE` — `src/stats.js:3-5` ; confirmé par `test/stats.test.js:5-7`).
- **Gestion d'erreur partielle.** `parseValues()` lève des erreurs explicites sur fichier vide ou valeur non-numérique — capturées et affichées sur stderr avec code exit 1. Erreurs I/O (argument absent, fichier inexistant) : toujours crash natif Node, non gardées (OBSERVÉ — `bin/index.js:8-9`, aucune garde).

## Données
- **Chemin de fichier** : argument positionnel `process.argv[2]` (`bin/index.js:8`) — chaîne de caractères, non validée
- **Contenu brut** : chaîne UTF-8 lue par `fs.readFileSync` (`bin/index.js:9`)
- **`valeurs`** : `Array<number>` produit par `parseValues()` (`src/stats.js:22-23`, `.split("\n").map(Number)`) — validation stricte, pas de `NaN` (erreur lancée si présent)
- **`mean`** : nombre (flottant ou `NaN`) — `src/stats.js:3-5`
- **`median`** : nombre (élément du tableau trié) — `src/stats.js:8-11`

## Intégrations
Aucune intégration externe explicite visible. Le flux est entièrement local : système de fichiers → calcul en mémoire → stdout.

## Risques
- **Argument absent** : `process.argv[2]` vaut `undefined` → `fs.readFileSync(undefined)` → `TypeError: The "path" argument must be of type string` non capturée, processus en échec immédiat. Scénario : invocation sans argument (`node bin/index.js`). Preuve : `bin/index.js:8-9`, absence de garde. PERSISTE après CLA-251 (non dans le périmètre).
- **Fichier inexistant ou inaccessible** : `fs.readFileSync` lève `ENOENT`/`EACCES` non capturée. Scénario : chemin erroné ou permissions manquantes. Preuve : `bin/index.js:9`, pas de `try/catch` autour de `readFileSync`. PERSISTE après CLA-251 (non dans le périmètre).
- **Lignes non numériques ou vides** : ~~`Number("")` → `0`, `Number("abc")` → `NaN`, injecté silencieusement~~ — **RÉSOLU (CLA-251)**. Maintenant : `parseValues()` détecte et rejette explicitement. Test : `test/stats.test.js:22-24` (vert).
- ~~**Médiane paire erronée (anomalie connue)**~~ : **RÉSOLU (CLA-184)**. `src/stats.js:11-12` retourne correctement `(sorted[mid-1] + sorted[mid]) / 2` pour listes paires. Test : `test/stats.test.js:13-16` (vert).
- ~~**Tableau vide**~~ : **RÉSOLU (CLA-251)**. `parseValues()` lève `Error("Le fichier est vide.")` avant d'atteindre le calcul. Test : `test/stats.test.js:22` (vert).

## Questions ouvertes
- **Fichier vide** : maintenant documenté et testé (CLA-251) — lève `Error("Le fichier est vide.")`.
- **Liste à un seul élément** : comportement non documenté ni testé. Qu'attend-on pour ce cas limite ?
- **Séparateur décimal** : toujours `.` (JS natif) — aucun support pour `,` (locales européennes).
- **Distribution du binaire** : est-il destiné à être installé globalement (`npm link` / `npm install -g`) ou uniquement invoqué via `node bin/index.js` ? Le `private: true` de `package.json:10` suggère qu'aucune publication npm n'est prévue, mais la clé `bin` laisse la porte ouverte.
- **Médiane paire** : correction complète depuis CLA-184 — plus aucune anomalie à ce sujet.

## Preuves
- `bin/index.js` — fichier entier (19 lignes), lu à cette session
- `src/stats.js` — fichier entier (31 lignes), lu à cette session
- `package.json` — fichier entier, lu à cette session
- `README.md` — fichier entier, lu à cette session
- `test/stats.test.js` — lu pour corroborer les règles métier de `mean`/`median`
- `.onboarding/domaines/CARTE_DES_DOMAINES.md` — lu pour le contexte domaine (réconciliation)
