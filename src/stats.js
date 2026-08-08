// Statistiques élémentaires sur une liste de nombres.

function mean(values) {
  if (values.length === 0) {
    throw new Error("Aucune valeur numérique à analyser dans ce fichier.");
  }
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function median(values) {
  if (values.length === 0) {
    throw new Error("Aucune valeur numérique à analyser dans ce fichier.");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function stripSurroundingQuotes(s) {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  }
  return s;
}

// Accepte uniquement les décimaux stricts (entiers ou virgule flottante), avec signe optionnel.
// Rejette hex (0x…), octal (0o…), binaire (0b…), scientifique (1e2), Infinity, NaN.
const DECIMAL_RE = /^[+-]?\d+(\.\d+)?$/;

function parseValues(content) {
  const trimmed = content.trim();
  if (trimmed === "") {
    throw new Error("Le fichier est vide.");
  }
  const lines = trimmed.split("\n").filter(l => l.trim() !== "");
  const stripped = lines.map(l => stripSurroundingQuotes(l.trim()).trim());
  const invalides = stripped.filter(l => !DECIMAL_RE.test(l));
  if (invalides.length > 0) {
    throw new Error(`Valeurs non-numériques : ${invalides.join(", ")}`);
  }
  return stripped.map(Number);
}

module.exports = { mean, median, parseValues };
