// Statistiques élémentaires sur une liste de nombres.

function mean(values) {
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

module.exports = { mean, median };
