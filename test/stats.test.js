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

test('parseValues — valeurs entre guillemets doubles (export CSV Excel) → nombres corrects (SHIAAAAAAAAAAAAAAAAAAAAAAAA-398)', () => {
  // Number('"10"') === NaN → sans dépouillage, parseValues rejette ces lignes
  const values = parseValues('"10"\n"20"\n"30"');
  assert.deepEqual(values, [10, 20, 30]);
});

test('parseValues — guillemets englobants + valeur non-numérique → erreur avec la valeur brute sans guillemets (SHIAAAAAAAAAAAAAAAAAAAAAAAA-398)', () => {
  assert.throws(() => parseValues('"10"\n"abc"\n"30"'), /abc/);
});

test('parseValues — cellule vide entre guillemets ("" export Excel) → erreur (SHIAAAAAAAAAAAAAAAAAAAAAAAA-405)', () => {
  assert.throws(() => parseValues('5\n""\n10'), /non.num/i);
});

test('parseValues — notation hexadécimale → erreur mentionnant la valeur (SHIAAAAAAAAAAAAAAAAAAAAAAAA-448)', () => {
  assert.throws(() => parseValues('5\n0x10\n15'), /0x10/);
});

test('parseValues — notation scientifique → erreur mentionnant la valeur (SHIAAAAAAAAAAAAAAAAAAAAAAAA-448)', () => {
  assert.throws(() => parseValues('5\n1e2\n15'), /1e2/);
});

test('parseValues — notation octale préfixée → erreur mentionnant la valeur (SHIAAAAAAAAAAAAAAAAAAAAAAAA-448)', () => {
  assert.throws(() => parseValues('5\n0o17\n15'), /0o17/);
});

test('parseValues — notation binaire préfixée → erreur mentionnant la valeur (SHIAAAAAAAAAAAAAAAAAAAAAAAA-448)', () => {
  assert.throws(() => parseValues('5\n0b101\n15'), /0b101/);
});

test('parseValues — guillemets + espaces intérieurs (export tableur) → nombres corrects (SHIAAAAAAAAAAAAAAAAAAAAAAAA-532)', () => {
  // '" 12 "' doit être accepté comme 12 ; le trim() après stripSurroundingQuotes est nécessaire.
  const values = parseValues('" 12 "\n" 34 "\n" 56 "');
  assert.deepEqual(values, [12, 34, 56]);
});
