# WORKFLOW_CALCULER_STATS — Calcul de la moyenne et de la médiane d'un fichier de nombres

## Classification
- **Type** : `technical_flow`
- **Sous-type** : outil CLI de calcul statistique
- **Visibilité** : `technical`
- **Acteur principal** : utilisateur technique (développeur ou pipeline CI) qui invoque le binaire
- **Acteurs** : utilisateur CLI, système de fichiers local, stdout
- **Criticité** : Haute — c'est la raison d'être unique de l'outil ; tout le dépôt existe pour ce flux
- **Confiance** : high
- **Justification** : les 12 lignes de `bin/index.js` et les 14 lignes de `src/stats.js` ont été lues en intégralité — le flux est court et sans branche cachée. Plusieurs cas limites non triviaux sont présents (argument absent, ligne vide → `0`, ligne non numérique → `NaN`, médiane paire) ; chacun est tracé en section Risques et Règles métier avec preuves.

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
3. **Découpage et conversion** : `contenu.trim().split("\n").map(Number)` (`bin/index.js:10`) — supprime les espaces et retours de chariot en tête/queue, découpe ligne par ligne (séparateur `\n`), convertit chaque ligne en nombre via `Number()`. Une ligne vide donne `0` (`Number("") === 0`) ; une ligne non numérique comme `"abc"` donne `NaN` — les deux silencieusement, sans avertissement ni rejet.
4. **Calcul de la moyenne** : appel à `mean(valeurs)` (`bin/index.js:12`) → `src/stats.js:3-5`. Somme tous les éléments par `reduce((acc, v) => acc + v, 0)` puis divise par `values.length`. Sur tableau vide : `0 / 0 = NaN`.
5. **Calcul de la médiane** : appel à `median(valeurs)` (`bin/index.js:12`) → `src/stats.js:8-11`. Copie le tableau (`[...values]`), trie par ordre croissant (`sort((a, b) => a - b)`), retourne `sorted[Math.floor(sorted.length / 2)]`. Voir « Règles métier » pour le comportement sur listes de taille paire.
6. **Impression du résultat** : `console.log(\`n=${valeurs.length} moyenne=${mean(valeurs)} mediane=${median(valeurs)}\`)` (`bin/index.js:12`) — une seule ligne sur stdout ; aucun formatage décimal supplémentaire.

## Règles métier
- **Format d'entrée strict : un nombre par ligne.** Le séparateur est exclusivement `\n` (`bin/index.js:10` — `.split("\n")`). Pas de gestion du séparateur `;` ni des guillemets CSV. La description « CSV » dans `package.json:4` et `README.md:3` est inexacte : c'est un fichier texte à une colonne, pas un CSV.
- **Conversion silencieuse des entrées non numériques ou vides.** `Number("")` (ligne vide) vaut `0`, pas `NaN` ; `Number("texte")` vaut `NaN` — aucun rejet ni avertissement dans `bin/index.js` ni `src/stats.js` (`VÉRIFIÉ_CODE` — comportement natif JavaScript).
- **Médiane d'une liste de taille paire : élément central supérieur, pas la moyenne des deux centraux.** `src/stats.js:10-11` retourne `sorted[Math.floor(length/2)]` sans condition sur la parité. Pour `[1,2,3,4]`, l'index est `Math.floor(4/2) = 2`, soit `sorted[2] = 3`. La convention standard (moyenne des deux valeurs centrales → `2.5`) n'est pas implémentée. `OBSERVÉ` : `node -e "const {median}=require('./src/stats'); console.log(median([1,2,3,4]))"` → `3`. Ce comportement est une anomalie par rapport au test de référence (`test/stats.test.js:15` attend `2.5`).
- **Moyenne arithmétique standard.** `mean([2,4,6])` → `4` (`VÉRIFIÉ_CODE` — `src/stats.js:3-5` ; confirmé par `test/stats.test.js:6`).
- **Aucune gestion d'erreur.** Fichier absent, argument manquant (`process.argv[2]` undefined → `fs.readFileSync(undefined)`) : crash natif Node, code de sortie non nul, pas de message utilisateur explicite.

## Données
- **Chemin de fichier** : argument positionnel `process.argv[2]` (`bin/index.js:8`) — chaîne de caractères, non validée
- **Contenu brut** : chaîne UTF-8 lue par `fs.readFileSync` (`bin/index.js:9`)
- **`valeurs`** : `Array<number>` produit par `.trim().split("\n").map(Number)` (`bin/index.js:10`) — peut contenir des `NaN`
- **`mean`** : nombre (flottant ou `NaN`) — `src/stats.js:3-5`
- **`median`** : nombre (élément du tableau trié) — `src/stats.js:8-11`

## Intégrations
Aucune intégration externe explicite visible. Le flux est entièrement local : système de fichiers → calcul en mémoire → stdout.

## Risques
- **Argument absent** : `process.argv[2]` vaut `undefined` → `fs.readFileSync(undefined)` → `TypeError: The "path" argument must be of type string` non capturée, processus en échec immédiat. Scénario : invocation sans argument (`node bin/index.js`). Preuve : `bin/index.js:8-9`, absence de garde.
- **Fichier inexistant ou inaccessible** : `fs.readFileSync` lève `ENOENT`/`EACCES` non capturée. Scénario : chemin erroné ou permissions manquantes. Preuve : `bin/index.js:9`, pas de `try/catch`.
- **Lignes non numériques ou vides** : `Number("")` → `0`, `Number("abc")` → `NaN`, injecté silencieusement dans `valeurs`. La moyenne et la médiane deviennent alors `NaN` ou faussées. Preuve : `bin/index.js:10`, pas de filtre.
- **Médiane paire erronée (anomalie connue)** : sur toute liste de taille paire, la médiane retournée suit l'index `Math.floor(n/2)` plutôt que la moyenne des deux valeurs centrales (`src/stats.js:10-11`). La suite de référence échoue sur ce cas (`test/stats.test.js:13-15`). Impact : résultat statistiquement incorrect pour toute entrée paire, sans avertissement.
- **Tableau vide** : si le fichier est vide ou ne contient que des espaces, `contenu.trim()` vaut `""`, `.split("\n")` donne `[""]`, `.map(Number)` donne `[0]` — pas un tableau vide mais un tableau `[0]`. Scénario légèrement moins dangereux qu'attendu, mais non documenté et non testé.

## Questions ouvertes
- Le comportement attendu sur un fichier vide ou à une seule ligne n'est ni documenté ni testé. Qu'attend-on pour ces cas limites ?
- Le séparateur décimal est-il toujours `.` (JS natif) ou doit-il supporter `,` (locales européennes) ?
- Est-ce que le binaire est destiné à être installé globalement (`npm link` / `npm install -g`) ou uniquement invoqué via `node bin/index.js` ? Le `private: true` de `package.json:10` suggère qu'aucune publication npm n'est prévue, mais la clé `bin` laisse la porte ouverte.
- La correction de la médiane paire est-elle prévue ou cet état est-il assumé durablement (le commit de seed le nomme « état assumé du seed ») ?

## Preuves
- `bin/index.js` — fichier entier (12 lignes), lu à cette session
- `src/stats.js` — fichier entier (14 lignes), lu à cette session
- `package.json` — fichier entier, lu à cette session
- `README.md` — fichier entier, lu à cette session
- `test/stats.test.js` — lu pour corroborer les règles métier de `mean`/`median`
- `.onboarding/domaines/CARTE_DES_DOMAINES.md` — lu pour le contexte domaine (réconciliation)
