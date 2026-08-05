#!/usr/bin/env node
// Usage : pilot-stats <fichier.csv>
// Le fichier contient un nombre par ligne.

const fs = require("node:fs");
const { mean, median, parseValues } = require("../src/stats");

const chemin = process.argv[2];
const contenu = fs.readFileSync(chemin, "utf8");

let valeurs;
try {
  valeurs = parseValues(contenu);
} catch (err) {
  process.stderr.write(err.message + "\n");
  process.exit(1);
}

console.log(`n=${valeurs.length} moyenne=${mean(valeurs)} mediane=${median(valeurs)}`);
