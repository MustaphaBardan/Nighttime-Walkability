import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { METHOD_DEFINITIONS } from "../js/survey-methods.js";

const scenarioCatalog = readJson("../data/scenario_catalog.json");
const images = [...readJson("../data/images.json"), ...scenarioCatalog.images];
const questions = {
  ...readJson("../data/questions.json"),
  ideal_scene_builder: readJson("../data/scenario_builder_questions.json"),
};
const idealSceneVariants = readJson("../data/ideal_scene_variants.json");

test("active survey methods all have question sections and no routed batch classification", () => {
  const methodIds = METHOD_DEFINITIONS.map((method) => method.id);

  assert.deepEqual(methodIds, [
    "training_scene",
    "pairwise_comparison",
    "detailed_rating",
    "ideal_scene_builder",
    "realism_check",
  ]);
  assert.ok(!methodIds.includes("batch_classification"));

  for (const methodId of methodIds) {
    assert.ok(Array.isArray(questions[methodId]), `${methodId} must have a question array`);
    assert.ok(questions[methodId].length > 0, `${methodId} must not be empty`);
  }
});

test("question ids are unique and every bilingual prompt has English and French text", () => {
  const seenIds = new Set();

  for (const [sectionId, sectionQuestions] of Object.entries(questions)) {
    for (const question of sectionQuestions) {
      assert.ok(question.question_id, `${sectionId} has a missing question_id`);
      assert.ok(!seenIds.has(question.question_id), `duplicate question_id: ${question.question_id}`);
      seenIds.add(question.question_id);
      assert.equal(typeof question.text?.en, "string", `${question.question_id} is missing English text`);
      assert.equal(typeof question.text?.fr, "string", `${question.question_id} is missing French text`);
      assert.ok(question.text.en.trim().length > 0, `${question.question_id} English text is empty`);
      assert.ok(question.text.fr.trim().length > 0, `${question.question_id} French text is empty`);
    }
  }
});

test("pairwise and detailed question structures match the current response controls", () => {
  assert.deepEqual(
    questions.pairwise_comparison.map((question) => question.question_id),
    [
      "pairwise_comfort_atmosphere",
      "pairwise_practical_visibility",
      "pairwise_route_continuation",
      "pairwise_road_safety",
      "pairwise_personal_safety",
      "pairwise_final_choice",
    ],
  );
  assert.deepEqual(
    questions.detailed_rating.map((question) => question.question_id),
    [
      "detailed_comfort_atmosphere",
      "detailed_practical_visibility",
      "detailed_route_continuation",
      "detailed_road_safety",
      "detailed_personal_safety",
      "detailed_willingness_to_walk",
    ],
  );

  for (const question of questions.pairwise_comparison) {
    assert.deepEqual(question.answers, ["A", "B", "no_clear_difference"]);
    assert.equal(question.helper, undefined);
  }

  for (const question of questions.detailed_rating) {
    assert.equal(question.scale, 5, `${question.question_id} should use the 1-5 detailed rating scale`);
    assert.equal(question.helper, undefined);
  }

  assert.equal(questions.realism_check.length, 6);
  assert.ok(questions.realism_check.some((question) => question.question_id === "lighting_ambiance_plausibility"));
  assert.deepEqual(questions.ideal_scene_builder.map((question) => question.question_id), [
    "preferred_vegetation_density",
    "preferred_vegetation_lighting",
    "preferred_path_lighting",
    "preferred_obstacle_condition",
  ]);
  assert.deepEqual(questions.ideal_scene_builder[0].options, ["none", "half", "full", "dont_know"]);
});

test("pairwise comfort wording is direct in both languages", () => {
  const comfortQuestion = questions.pairwise_comparison[0];

  assert.equal(comfortQuestion.question_id, "pairwise_comfort_atmosphere");
  assert.equal(comfortQuestion.text.en, "Which scene is more comfortable to walk in at night?");
  assert.equal(comfortQuestion.text.fr, "Quelle scène est plus confortable pour marcher la nuit ?");
});

test("route-continuation examples use two dedicated tutorial panoramas", () => {
  const readable = images.find((image) => image.image_id === "tutorial_readable_route");
  const unreadable = images.find((image) => image.image_id === "tutorial_unreadable_route");

  assert.equal(readable.role, "tutorial");
  assert.equal(unreadable.role, "tutorial");
});

test("image data has two tutorial panoramas and complete scenario groups", () => {
  const ids = new Set();
  const tutorials = images.filter((image) => image.role === "tutorial");
  const scenarios = images.filter((image) => image.role === "scenario");

  assert.equal(tutorials.length, 2);
  assert.ok(tutorials.every((image) => image.view_type === "panorama_360"));
  assert.equal(scenarios.length, 56);

  for (const image of images) {
    assert.ok(!ids.has(image.image_id), `duplicate image_id: ${image.image_id}`);
    ids.add(image.image_id);
    assert.equal(image.view_type, "panorama_360", `${image.image_id} must remain a 360 panorama`);
    assert.equal(Number(image.initial_yaw_degrees), 90, `${image.image_id} should start at the shared yaw`);
  }

  const groups = new Map();
  for (const image of scenarios) {
    if (!groups.has(image.scenario_group)) {
      groups.set(image.scenario_group, new Set());
    }
    groups.get(image.scenario_group).add(image.variant_key);
  }

  assert.deepEqual([...groups.keys()].sort(), ["A", "B", "C", "D"]);
  assert.deepEqual(Object.fromEntries([...groups].map(([group, variants]) => [group, variants.size])), {
    A: 16,
    B: 8,
    C: 24,
    D: 8,
  });
});

test("ideal scene variants contain all Scenario C parameter combinations", () => {
  const variantIds = new Set();
  assert.equal(idealSceneVariants.mode, "scenario_c");
  assert.equal(idealSceneVariants.default.view_type, "panorama_360");
  assert.equal(idealSceneVariants.variants.length, 24);

  for (const variant of idealSceneVariants.variants) {
    assert.ok(!variantIds.has(variant.image_id), `duplicate image_id: ${variant.image_id}`);
    variantIds.add(variant.image_id);
    assert.equal(variant.scenario_group, "C");
    assert.equal(Object.keys(variant.parameter_states).length, 4);
  }
});

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}
