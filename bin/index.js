#!/usr/bin/env node
// Usage : pilot-stats <fichier.csv>
// Le fichier contient un nombre par ligne.

const fs = require("node:fs");
const { mean, median, parseValues } = require("../src/stats");

const chemin = process.argv[2];
if (!chemin) {
  process.stderr.write("Usage : pilot-stats <fichier.csv>\n");
  process.exit(1);
}
let contenu;
try {
  contenu = fs.readFileSync(chemin, "utf8");
} catch (err) {
  process.stderr.write(`Erreur : fichier introuvable "${chemin}"\n`);
  process.exit(1);
}

let valeurs;
try {
  valeurs = parseValues(contenu);
} catch (err) {
  process.stderr.write(err.message + "\n");
  process.exit(1);
}

console.log(`n=${valeurs.length} moyenne=${mean(valeurs)} mediane=${median(valeurs)}`);
