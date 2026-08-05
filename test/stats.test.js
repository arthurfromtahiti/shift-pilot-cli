const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mean, median, parseValues } = require("../src/stats");

test("moyenne d'une liste simple", () => {
  assert.equal(mean([2, 4, 6]), 4);
});

test("médiane d'une liste de taille impaire", () => {
  assert.equal(median([9, 1, 5]), 5);
});

test("médiane d'une liste de taille paire", () => {
  // Convention standard : moyenne des deux valeurs centrales.
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test("parseValues — fichier vide → erreur", () => {
  assert.throws(() => parseValues(""), /vide/i);
});

test("parseValues — valeur non-numérique → erreur mentionnant la valeur invalide", () => {
  assert.throws(() => parseValues("1\nabc\n3"), /abc/);
});
