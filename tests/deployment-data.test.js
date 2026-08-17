import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import sharp from "sharp";

import { CONFIG } from "../js/config.js";

const projectRoot = new URL("../", import.meta.url);
const tutorials = readJson("../data/images.json");
const scenarioCatalog = readJson("../data/scenario_catalog.json");
const images = [...tutorials, ...scenarioCatalog.images];
const idealSceneVariants = readJson("../data/ideal_scene_variants.json");
const credits = readJson("../data/credits.json");

test("every configured survey image asset exists and matches declared panorama dimensions", async () => {
  for (const image of images) {
    await assertImageAsset(image, image.image_id);
  }
});

test("every configured ideal-preview asset exists and matches declared panorama dimensions", async () => {
  await assertImageAsset(idealSceneVariants.default, "ideal default");

  for (const variant of idealSceneVariants.variants || []) {
    await assertImageAsset(variant, variant.image_id);
  }
});

test("index entrypoint references the expected app shell assets", () => {
  const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");

  assert.match(indexHtml, /<main[^>]+id=["']app["']/);
  assert.match(indexHtml, /css\/style\.css/);
  assert.match(indexHtml, /js\/app\.js/);
  assert.ok(existsSync(new URL("../css/style.css", import.meta.url)));
  assert.ok(existsSync(new URL("../js/app.js", import.meta.url)));
});

test("public credits acknowledge Observatoire de la Nuit and Obscura without changing authorship", () => {
  const acknowledgementText = credits.acknowledgements
    .flatMap((acknowledgement) => Object.values(acknowledgement.text || {}))
    .join(" ");
  const license = readFileSync(new URL("../LICENSE", import.meta.url), "utf8");
  const packageMetadata = readJson("../package.json");

  assert.match(acknowledgementText, /Observatoire de la Nuit/);
  assert.match(acknowledgementText, /Obscura/);
  assert.equal(packageMetadata.author, "Mustapha Bardan");
  assert.match(license, /Copyright \(c\) 2026 Mustapha Bardan/);
  assert.doesNotMatch(license, /Observatoire de la Nuit|Obscura/);
});

test("ideal scene builder renders dropdowns and keeps completion inside scrollable panels", () => {
  const methodSource = readFileSync(new URL("../js/simple-methods.js", import.meta.url), "utf8");
  const styleSource = readFileSync(new URL("../css/style.css", import.meta.url), "utf8");

  assert.match(methodSource, /createElement\("select"/);
  assert.match(methodSource, /select\.addEventListener\("change"/);
  assert.match(methodSource, /controls\.append\(controlsCompletion\)/);
  assert.match(methodSource, /overlayControls\.append\(fullscreenCompletion\)/);
  assert.match(styleSource, /\.ideal-builder-controls\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(styleSource, /\.ideal-builder-preview:fullscreen \.ideal-builder-fullscreen-overlay\s*\{[\s\S]*?overflow:\s*auto/);
});

test("training combines synchronized 360 navigation with readable and unreadable route examples", () => {
  const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  const methodSource = readFileSync(new URL("../js/simple-methods.js", import.meta.url), "utf8");

  assert.doesNotMatch(appSource, /renderRouteContinuationExamples/);
  assert.match(methodSource, /tutorial_readable_route/);
  assert.match(methodSource, /tutorial_unreadable_route/);
  assert.match(methodSource, /viewState: sharedViewState/);
  assert.match(methodSource, /image_left: clearImage/);
  assert.match(methodSource, /image_right: unclearImage/);
});

test("Public V1 uses isolated browser storage and the deployed Apps Script endpoint", () => {
  assert.match(CONFIG.protocolLabel, /V1/);
  assert.match(CONFIG.googleAppsScriptUrl, /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/);
  assert.match(CONFIG.localStorageKey, /_v1$/);
  assert.match(CONFIG.progressStorageKey, /_v1$/);
  assert.match(CONFIG.participantStorageKey, /_v1$/);
  assert.match(CONFIG.sessionStorageKey, /_v1$/);
  assert.match(CONFIG.languageStorageKey, /_v1$/);
});

test("Public V1 loads the scenario catalog and four Scenario C questions", () => {
  const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  const questions = readJson("../data/scenario_builder_questions.json");

  assert.match(appSource, /scenario_catalog\.json/);
  assert.match(appSource, /ideal_scene_variants\.json/);
  assert.match(appSource, /scenario_builder_questions\.json/);
  assert.deepEqual(questions.map((question) => question.question_id), [
    "preferred_vegetation_density",
    "preferred_vegetation_lighting",
    "preferred_path_lighting",
    "preferred_obstacle_condition",
  ]);
});

test("pairwise and detailed prompts render without methodological helpers", () => {
  const pairwiseSource = readFileSync(new URL("../js/pairwise-comparison.js", import.meta.url), "utf8");
  const detailedSource = readFileSync(new URL("../js/simple-methods.js", import.meta.url), "utf8");

  assert.match(pairwiseSource, /normalQuestion\.replaceChildren\(\.\.\.renderQuestionPrompt/);
  assert.match(pairwiseSource, /overlayQuestion\.replaceChildren\(\.\.\.renderQuestionPrompt/);
  assert.match(detailedSource, /questionTextElement\.replaceChildren\(\.\.\.renderQuestionPrompt/);
  assert.match(detailedSource, /overlayQuestion\.replaceChildren\(\.\.\.renderQuestionPrompt/);
  assert.match(detailedSource, /renderScaleAnchors\(question, language\)/);
  assert.doesNotMatch(pairwiseSource, /localize\(question\.helper/);
  assert.doesNotMatch(detailedSource, /localize\(question\.helper/);
});

test("pairwise and detailed sections show their intro before the first question and preserve bonus view state", () => {
  const pairwiseSource = readFileSync(new URL("../js/pairwise-comparison.js", import.meta.url), "utf8");
  const detailedSource = readFileSync(new URL("../js/simple-methods.js", import.meta.url), "utf8");

  assert.match(pairwiseSource, /export function renderPairwiseComparison[\s\S]*?renderProtocolIntro\(root, context, onComplete, onRerenderReady\)/);
  assert.match(pairwiseSource, /function renderPairwiseQuestions/);
  assert.match(pairwiseSource, /renderProtocolIntro\(root, context, onComplete, onRerenderReady\);/);
  assert.match(detailedSource, /export function renderDetailedRating[\s\S]*?renderDetailedRatingIntro\(root, context, onComplete, onRerenderReady\)/);
  assert.match(detailedSource, /function renderDetailedRatingQuestions/);
  assert.match(detailedSource, /function renderDetailedRatingIntro/);
  assert.match(detailedSource, /const sharedViewState = \{\};/);
  assert.match(detailedSource, /fullViewport: true,[\s\S]*?viewState: sharedViewState/);
});

async function assertImageAsset(record, label) {
  assert.equal(record.view_type, "panorama_360", `${label} must be a 360 panorama`);
  assert.equal(Number(record.initial_yaw_degrees), 90, `${label} must use the shared initial yaw`);

  for (const [assetLabel, asset] of listAssets(record)) {
    const assetUrl = new URL(asset.path, projectRoot);
    assert.ok(existsSync(assetUrl), `${label} ${assetLabel} is missing: ${asset.path}`);

    const metadata = await sharp(assetUrl.pathname).metadata();
    assert.equal(metadata.format, "webp", `${label} ${assetLabel} must be WebP`);
    assert.equal(metadata.width, asset.width, `${label} ${assetLabel} width metadata is stale`);
    assert.equal(metadata.height, asset.height, `${label} ${assetLabel} height metadata is stale`);
    assert.equal(metadata.width, metadata.height * 2, `${label} ${assetLabel} must be 2:1`);
  }
}

function listAssets(record) {
  const assets = [];

  if (record.responsive_sources) {
    for (const [key, source] of Object.entries(record.responsive_sources)) {
      assets.push([key, source]);
    }
  } else {
    assets.push(["primary", record]);
  }

  return assets;
}

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}
