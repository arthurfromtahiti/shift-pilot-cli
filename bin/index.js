#!/usr/bin/env node
// Usage : pilot-stats <fichier.csv>
// Le fichier contient un nombre par ligne.

const fs = require("node:fs");
const { mean, median } = require("../src/stats");

const chemin = process.argv[2];
const contenu = fs.readFileSync(chemin, "utf8");
const valeurs = contenu.trim().split("\n").map(Number);

console.log(`n=${valeurs.length} moyenne=${mean(valeurs)} mediane=${median(valeurs)}`);
