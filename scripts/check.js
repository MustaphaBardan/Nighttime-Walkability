import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const jsonFiles = [
  "data/images.json",
  "data/ideal_scene_variants.json",
  "data/questions.json",
  "package.json",
];

const jsFiles = [
  "js/app.js",
  "js/config.js",
  "js/i18n.js",
  "js/pairwise-comparison.js",
  "js/panorama-viewer.js",
  "js/simple-methods.js",
  "js/storage.js",
  "js/survey-methods.js",
  "js/utils.js",
  "scripts/dev-server.js",
  "scripts/check.js",
];

for (const file of jsonFiles) {
  JSON.parse(readFileSync(file, "utf8"));
}

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log("Static survey checks passed.");
