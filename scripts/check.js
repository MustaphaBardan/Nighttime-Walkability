import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// this list contains the json files that must stay valid
const jsonFiles = [
  "data/images.json",
  "data/ideal_scene_variants.json",
  "data/questions.json",
  "data/credits.json",
  "package.json",
];

// this list contains the javascript files checked for syntax errors
const jsFiles = [
  "js/app.js",
  "js/config.js",
  "js/i18n.js",
  "js/pairwise-comparison.js",
  "js/panorama-viewer.js",
  "js/simple-methods.js",
  "js/storage.js",
  "js/summary.js",
  "js/survey-methods.js",
  "js/utils.js",
  "scripts/dev-server.js",
  "scripts/generate-panorama-assets.js",
  "scripts/check.js",
  "tests/browser-smoke.test.js",
  "tests/deployment-data.test.js",
  "tests/i18n.test.js",
  "tests/panorama-tracking.test.js",
  "tests/protocol-data.test.js",
  "tests/response-schema.test.js",
  "tests/storage.test.js",
  "tests/summary.test.js",
  "tests/utils.test.js",
];

// we check that every json file can be parsed
for (const file of jsonFiles) {
  JSON.parse(readFileSync(file, "utf8"));
}

// we check that every javascript file has valid syntax
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
