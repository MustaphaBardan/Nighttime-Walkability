import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import sharp from "sharp";

import {
  chooseScenarioCPreview,
  getCompatibleScenarioCVariants,
  getScenarioCOptionAvailability,
  isScenarioPool,
  parseScenarioSourceFilename,
  validateScenarioCatalog,
} from "../js/scenario-protocol.js";

test("filename parser normalizes scenario metadata and baseline states", () => {
  const scenarioA = included("A", "WDcCO.png");
  assert.equal(scenarioA.variantKey, "WDcCO");
  assert.deepEqual(scenarioA.parameterStates, {
    facade_window_lighting: "lit",
    lighting_distribution: "continuous",
    route_exit_readability: "readable",
    obstacles: "present",
  });

  const scenarioB = included("B", "VoCp.png");
  assert.equal(scenarioB.parameterStates.vehicle_presence, "present");
  assert.equal(scenarioB.parameterStates.corner_lighting, "dark");
  assert.equal(scenarioB.parameterStates.path_continuation, "readable");

  assert.equal(included("C", "nth.png").parameterStates.vegetation_density, "none");
  assert.equal(included("D", "nth.png").variantKey, "baseline");
  assert.throws(() => parseScenarioSourceFilename("C", "T3Lg.png"), /Invalid Scenario C filename/);
});

test("Scenario C parser supports none, half, and full vegetation density", () => {
  const noVegetation = included("C", "LgPl.png");
  const halfVegetation = included("C", "T2O.png");
  const fullVegetation = included("C", "T1Lg.png");

  assert.equal(noVegetation.parameterStates.vegetation_density, "none");
  assert.equal(halfVegetation.parameterStates.vegetation_density, "half");
  assert.equal(halfVegetation.parameterStates.obstacles, "present");
  assert.equal(fullVegetation.parameterStates.vegetation_density, "full");
  assert.equal(fullVegetation.parameterStates.vegetation_lighting, "lit");
});

test("Scenario C compatibility treats unknown as unconstrained", () => {
  const variants = [
    variant("T2", { vegetation_density: "half", vegetation_lighting: "dark", path_lighting: "dark", obstacles: "clear" }),
    variant("T2Lg", { vegetation_density: "half", vegetation_lighting: "lit", path_lighting: "dark", obstacles: "clear" }),
    variant("T1LgPlO", { vegetation_density: "full", vegetation_lighting: "lit", path_lighting: "lit", obstacles: "present" }),
  ];
  const selections = {
    preferred_vegetation_density: "half",
    preferred_vegetation_lighting: "dont_know",
    preferred_path_lighting: "dark",
    preferred_obstacle_condition: "clear",
  };

  assert.deepEqual(getCompatibleScenarioCVariants(variants, selections).map((item) => item.variant_key), ["T2", "T2Lg"]);
  assert.deepEqual(
    getScenarioCOptionAvailability(variants, selections, "preferred_vegetation_density"),
    { none: false, half: true, full: false, dont_know: true },
  );
  assert.equal(chooseScenarioCPreview(variants, selections).variant_key, "T2");
});

test("catalog readiness requires the exact public scenario counts", () => {
  const incomplete = [
    ...catalogGroup("A", 16),
    ...catalogGroup("B", 8),
    ...catalogGroup("C", 23),
    ...catalogGroup("D", 8),
  ];
  assert.equal(validateScenarioCatalog(incomplete).ready, false);
  assert.deepEqual(validateScenarioCatalog(incomplete).missing_scenarios, ["C"]);

  const complete = [...incomplete, ...catalogGroup("C", 1, 23)];
  const validation = validateScenarioCatalog(complete);
  assert.equal(validation.ready, true);
  assert.deepEqual(validation.counts, { A: 16, B: 8, C: 24, D: 8 });
});

test("scenario pool detection requires normalized metadata", () => {
  const normalized = ["A", "B", "C", "D"].map((group) => ({
    role: "scenario",
    scenario_group: group,
    variant_key: "baseline",
    parameter_states: {},
  }));

  assert.equal(isScenarioPool(normalized), true);
  assert.equal(isScenarioPool([{ role: "tutorial" }, ...normalized]), true);
  assert.equal(isScenarioPool(normalized.map(({ variant_key, ...record }) => record)), false);
  assert.equal(isScenarioPool([]), false);
});

test("public catalog contains 56 unique 4K WebP panoramas", async () => {
  const catalog = readJson("../data/scenario_catalog.json");

  assert.equal(catalog.protocol, "v1");
  assert.equal(catalog.validation.ready, true);
  assert.deepEqual(catalog.validation.counts, { A: 16, B: 8, C: 24, D: 8 });
  assert.equal(catalog.images.length, 56);
  assert.equal(new Set(catalog.images.map((image) => image.image_id)).size, 56);

  for (const image of catalog.images) {
    const assetUrl = new URL(`../${image.path}`, import.meta.url);
    assert.ok(existsSync(assetUrl), `missing public asset ${image.path}`);
    const metadata = await sharp(assetUrl.pathname).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 4096);
    assert.equal(metadata.height, 2048);
    assert.equal(image.source_path, image.path);
    assert.ok(image.variant_key);
    assert.ok(image.parameter_states);
  }
});

test("all enabled Scenario C builder paths retain a compatible preview", () => {
  const config = readJson("../data/ideal_scene_variants.json");
  const questions = readJson("../data/scenario_builder_questions.json");
  let states = [{}];

  for (const question of questions) {
    const nextStates = [];
    for (const selections of states) {
      const availability = getScenarioCOptionAvailability(config.variants, selections, question.question_id);
      for (const option of question.options.filter((value) => availability[value])) {
        const nextSelections = { ...selections, [question.question_id]: option };
        const preview = chooseScenarioCPreview(config.variants, nextSelections);
        assert.ok(preview, `no preview for ${JSON.stringify(nextSelections)}`);
        nextStates.push(nextSelections);
      }
    }
    states = nextStates;
  }

  assert.ok(states.length > 0);
  assert.ok(states.some((selections) => Object.values(selections).includes("dont_know")));
});

test("Public V1 uses isolated storage and two dedicated tutorial panoramas", () => {
  const tutorials = readJson("../data/images.json");
  const configSource = readFileSync(new URL("../js/config.js", import.meta.url), "utf8");
  const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

  assert.match(configSource, /Public protocol V1/);
  assert.match(configSource, /_v1/);
  assert.match(appSource, /scenario_catalog\.json/);
  assert.deepEqual(tutorials.map((image) => image.image_id), [
    "tutorial_readable_route",
    "tutorial_unreadable_route",
  ]);
});

function included(group, filename) {
  const result = parseScenarioSourceFilename(group, filename);
  assert.equal(result.status, "included");
  return result;
}

function variant(variantKey, parameterStates) {
  return {
    image_id: `scenario_C_${variantKey}`,
    role: "scenario",
    scenario_group: "C",
    variant_key: variantKey,
    parameter_states: parameterStates,
  };
}

function catalogGroup(group, count, offset = 0) {
  return Array.from({ length: count }, (_, index) => ({
    image_id: `scenario_${group}_${offset + index + 1}`,
    role: "scenario",
    scenario_group: group,
  }));
}

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}
