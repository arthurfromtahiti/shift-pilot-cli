const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

test("pilot-stats sans argument → usage sur stderr + exit 1", () => {
  const result = spawnSync("node", ["bin/index.js"], {
    cwd: path.join(__dirname, ".."),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr.toString(), /Usage/i);
});

test("pilot-stats sans argument → message usage sans extension .csv (SHIAAAAAAAAAAAAAAAAAAAAAAAA-71)", () => {
  const result = spawnSync("node", ["bin/index.js"], {
    cwd: path.join(__dirname, ".."),
  });
  assert.doesNotMatch(result.stderr.toString(), /\.csv/);
});

test("pilot-stats fichier inexistant → message clair sur stderr + exit 1", () => {
  const result = spawnSync("node", ["bin/index.js", "/tmp/fichier-inexistant-xyz.csv"], {
    cwd: path.join(__dirname, ".."),
  });
  assert.equal(result.status, 1);
  const stderr = result.stderr.toString();
  assert.match(stderr, /introuvable|fichier|ENOENT/i);
  assert.doesNotMatch(stderr, /at Object\.<anonymous>/);
});

test("pilot-stats chemin vers un dossier → exit 1 + stderr non-ENOENT (EISDIR)", () => {
  const result = spawnSync("node", ["bin/index.js", "/tmp"], {
    cwd: path.join(__dirname, ".."),
  });
  assert.equal(result.status, 1);
  const stderr = result.stderr.toString();
  assert.doesNotMatch(stderr, /introuvable/i);
  assert.match(stderr, /EISDIR|illegal operation/i);
});
