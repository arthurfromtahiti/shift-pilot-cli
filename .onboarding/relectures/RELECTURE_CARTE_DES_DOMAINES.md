# Relecture — CARTE_DES_DOMAINES.md

## Verdict global
Bon — la carte corrigée est désormais cohérente avec le dépôt réel, correctement granulaire et suffisamment prouvée. Les trois domaines retenus correspondent à trois zones disjointes du code et je n'ai trouvé ni domaine inventé ni pan fonctionnel significatif oublié en rouvrant `bin/index.js`, `src/stats.js`, `test/stats.test.js`, `package.json` et `README.md`.

## Problèmes bloquants
Aucun. Le point précédemment contesté a été corrigé : le packaging n'est plus isolé artificiellement et est maintenant rattaché au même exécutable que `bin/index.js`, avec preuve dans `package.json:6-9` (`bin`, `scripts`, `engines`, `private`) et `bin/index.js:1-12`.

## Problèmes mineurs
Aucun défaut mineur supplémentaire relevé à cette passe. Le resserrement de la formulation sur l'ingestion est correct : la carte parle bien d'un fichier lu puis découpé par `contenu.trim().split("\n").map(Number)` tel qu'observé dans `bin/index.js:10`, sans sur-promettre un parsing CSV multi-colonnes.

## Points vérifiés et corrects
- `calcul-statistique` est un vrai domaine métier autonome : les seules primitives métier du dépôt sont `mean` et `median`, définies dans `src/stats.js:3-14`, puis consommées par la CLI en `bin/index.js:6,12`. Le pattern `mean|median` matche `src/stats.js`, `bin/index.js` et `test/stats.test.js`, ce qui confirme un noyau métier distinct plutôt qu'une catégorie plaquée.
- `application-cli` est correctement délimité : lecture de l'argument `process.argv[2]`, chargement par `fs.readFileSync`, transformation ligne par ligne et sortie `console.log` sont regroupés dans `bin/index.js:1-12`; le contrat de distribution du même binaire est dans `package.json:4-9` avec `bin: { "pilot-stats": "./bin/index.js" }`. Le regroupement application + packaging est donc mieux défendu que l'ancien découpage.
- `suite-tests` reste un domaine technique honnête et distinct : script `npm test` en `package.json:7`, assertions comportementales en `test/stats.test.js:1-15`, et rôle de référence explicite en `README.md:14`. Le pattern `node:test` ne matche que `test/stats.test.js:1`, ce qui confirme un périmètre net.
- Je n'ai trouvé aucun domaine omis en réouvrant l'inventaire git (`git ls-files` → `README.md`, `bin/index.js`, `package.json`, `src/stats.js`, `test/stats.test.js`) : pas de route web, pas de persistance, pas d'auth, pas d'intégration externe, pas de job ou de configuration métier cachée.
- La note transverse sur l'état réel des tests est correcte et bien attribuée : `test/stats.test.js:13-15` attend `2.5` pour la médiane paire alors que `src/stats.js:8-11` renvoie l'élément central supérieur. C'est une anomalie du code métier, pas un faux domaine.

## Recommandations de correction
- Aucune correction supplémentaire requise sur `CARTE_DES_DOMAINES.md` à ce stade.
