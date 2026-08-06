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

test("mean — liste vide → erreur compréhensible, pas de NaN (SHIAAAAAAAAAAAAAAAAAAAAAAAA-243)", () => {
  assert.throws(() => mean([]), /aucune valeur/i);
});

test("parseValues — Infinity → erreur mentionnant Infinity (SHIAAAAAAAAAAAAAAAAAAAAAAAA-295)", () => {
  assert.throws(() => parseValues("Infinity"), /Infinity/);
});

test("parseValues — -Infinity → erreur mentionnant -Infinity (SHIAAAAAAAAAAAAAAAAAAAAAAAA-295)", () => {
  assert.throws(() => parseValues("-Infinity"), /-Infinity/);
});

test("median — liste vide → erreur compréhensible (SHIAAAAAAAAAAAAAAAAAAAAAAAA-329)", () => {
  assert.throws(() => median([]), /aucune valeur/i);
});

test("parseValues — ligne vide ignorée, médiane calculée sans le zéro parasite", () => {
  // "10\n\n20\n30" → Number("") vaut 0 → sans filtre, valeurs = [10, 0, 20, 30], médiane = 15
  // Avec filtre lignes vides, valeurs = [10, 20, 30], médiane = 20
  const values = parseValues("10\n\n20\n30");
  assert.deepEqual(values, [10, 20, 30]);
  assert.equal(median(values), 20);
});
