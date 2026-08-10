import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildBaseResponse } from "../js/storage.js";
import { buildIdealSceneBuilderResponses } from "../js/simple-methods.js";
import { METHOD_DEFINITIONS } from "../js/survey-methods.js";
import { makeBalancedScenarioPairs, makeFixedQuestionAssignments } from "../js/utils.js";

const scenarioCatalog = readJson("../data/scenario_catalog.json");
const images = [...readJson("../data/images.json"), ...scenarioCatalog.images];
const questions = {
  ...readJson("../data/questions.json"),
  ideal_scene_builder: readJson("../data/scenario_builder_questions.json"),
};
const idealSceneVariants = readJson("../data/ideal_scene_variants.json");

const session = {
  participant_id: "p_deployment_schema",
  language: "en",
  profile: {
    age_range: "25_34",
    gender: "prefer_not_to_say",
    night_walk_frequency: "regularly_one_two_weekly",
    night_walking_comfort: "comfortable",
    activity_expertise: "research",
    lighting_knowledge: "familiar",
  },
};

test("all active survey sections can produce complete long-format response rows", () => {
  const rows = [
    ...buildTrainingRows(),
    ...buildPairwiseRows(),
    ...buildDetailedRows(),
    ...buildBuilderRows(),
    ...buildRealismRows(),
  ];

  assert.equal(rows.length, 1 + 6 + 6 + 5 + 6);
  assert.deepEqual([...new Set(rows.map((row) => row.method))], METHOD_DEFINITIONS.map((method) => method.id));

  for (const row of rows) {
    assertResponseSchema(row);
  }
});

test("deployment payload contains one row per expected question and no orphan method ids", () => {
  const rows = [
    ...buildTrainingRows(),
    ...buildPairwiseRows(),
    ...buildDetailedRows(),
    ...buildBuilderRows(),
    ...buildRealismRows(),
  ];
  const byMethod = groupBy(rows, (row) => row.method);

  assert.equal(byMethod.training_scene.length, questions.training_scene.length);
  assert.equal(byMethod.pairwise_comparison.length, questions.pairwise_comparison.length);
  assert.equal(byMethod.detailed_rating.length, questions.detailed_rating.length);
  assert.equal(byMethod.ideal_scene_builder.length, questions.ideal_scene_builder.length + 1);
  assert.equal(byMethod.realism_check.length, questions.realism_check.length);

  for (const methodId of Object.keys(byMethod)) {
    assert.ok(METHOD_DEFINITIONS.some((method) => method.id === methodId), `orphan method id: ${methodId}`);
  }
});

test("optional builder exports one skipped row or participation plus all completed parameters", () => {
  const context = { session };
  const skipped = buildIdealSceneBuilderResponses({
    context,
    questions: questions.ideal_scene_builder,
    participation: "skipped",
    entryStartedAt: Date.now(),
  });
  const selections = Object.fromEntries(
    questions.ideal_scene_builder.map((question) => [question.question_id, question.options[0]]),
  );
  const completed = buildIdealSceneBuilderResponses({
    context,
    questions: questions.ideal_scene_builder,
    selections,
    preview: {
      image_id: idealSceneVariants.default.image_id,
      variant_id: idealSceneVariants.default.image_id,
    },
    participation: "completed",
    entryStartedAt: Date.now(),
    builderStartedAt: Date.now(),
  });

  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].answer, "skipped");
  assert.equal(completed.length, questions.ideal_scene_builder.length + 1);
  assert.equal(completed[0].answer, "completed");
  assert.equal(completed[0].yaw_coverage_degrees, "");
  assert.equal(completed[0].rotation_interaction_count, "");
  assert.ok(completed.slice(1).every((row) => row.image_id === idealSceneVariants.default.image_id));
});

function buildTrainingRows() {
  const question = questions.training_scene[0];
  return [{
    ...base("training_scene", question, 1),
    image_left: "tutorial_readable_route",
    image_right: "tutorial_unreadable_route",
    answer: question.options[0],
    answer_value: 1,
    yaw_coverage_degrees: 360,
    panorama_interactive_available: true,
  }];
}

function buildPairwiseRows() {
  const pairs = makeBalancedScenarioPairs(images, session.participant_id, questions.pairwise_comparison.length);
  return makeFixedQuestionAssignments(
    pairs,
    questions.pairwise_comparison,
    session.participant_id,
    "pairwise-question-assignment",
    questions.pairwise_comparison.length,
  ).map((assignment) => ({
    ...base("pairwise_comparison", assignment.question, assignment.displayOrder),
    image_left: assignment.item[0].image_id,
    image_right: assignment.item[1].image_id,
    answer: "A",
    answer_value: 1,
    response_comment: "schema check",
    yaw_coverage_degrees: 180,
    panorama_interactive_available: true,
  }));
}

function buildDetailedRows() {
  const scenarios = images.filter((image) => image.role === "scenario");
  return makeFixedQuestionAssignments(
    scenarios,
    questions.detailed_rating,
    session.participant_id,
    "detailed-rating-question-assignment",
    questions.detailed_rating.length,
  ).map((assignment) => ({
    ...base("detailed_rating", assignment.question, assignment.displayOrder),
    image_id: assignment.item.image_id,
    answer: "4",
    answer_value: 4,
    response_comment: "schema check",
    yaw_coverage_degrees: 180,
    panorama_interactive_available: true,
  }));
}

function buildBuilderRows() {
  const preview = idealSceneVariants.default;
  return [{
    ...base("ideal_scene_builder", {
      question_id: "ideal_scene_builder_participation",
      text: { en: "Did the participant complete the optional ideal scene builder?" },
    }, 1),
    answer: "completed",
    answer_value: 1,
    yaw_coverage_degrees: 180,
    panorama_interactive_available: true,
  }, ...questions.ideal_scene_builder.map((question, index) => ({
    ...base("ideal_scene_builder", question, index + 2),
    image_id: preview.image_id,
    answer: question.options[0],
    answer_value: 1,
  }))];
}

function buildRealismRows() {
  return questions.realism_check.map((question, index) => {
    const answer = question.type === "scale"
      ? "4"
      : question.type === "choice"
        ? question.options[0]
        : "Short deployment comment.";

    return {
      ...base("realism_check", question, index + 1),
      answer,
      answer_value: question.type === "scale" ? 4 : question.type === "choice" ? 1 : 0,
    };
  });
}

function base(methodId, question, displayOrder) {
  return buildBaseResponse(session, methodId, question, displayOrder, Date.now());
}

function assertResponseSchema(row) {
  const requiredKeys = [
    "participant_id",
    "survey_completed_at",
    "survey_duration_ms",
    "language",
    "method",
    "question_id",
    "question_text",
    "image_id",
    "image_left",
    "image_right",
    "answer",
    "answer_value",
    "response_comment",
    "yaw_coverage_degrees",
    "panorama_interactive_available",
    "viewport_resolution",
    "display_order",
    "reaction_time_ms",
    "profile_age_range",
    "profile_gender",
    "profile_night_walk_frequency",
    "profile_night_walking_comfort",
    "profile_activity_expertise",
    "profile_lighting_knowledge",
    "viewing_trace_json",
    "rotation_interaction_count",
    "fullscreen_used",
    "fullscreen_at_answer",
    "block_time_ms",
  ];

  for (const key of requiredKeys) {
    assert.ok(Object.hasOwn(row, key), `${row.method}/${row.question_id} missing ${key}`);
  }

  assert.equal(row.participant_id, session.participant_id);
  assert.equal(row.language, "en");
  assert.equal(typeof row.question_text, "string");
  assert.ok(row.question_text.length > 0);
  assert.ok(Number.isInteger(row.display_order));
  assert.ok(row.display_order > 0);
  assert.ok(Number.isFinite(row.reaction_time_ms));
  assert.ok(row.reaction_time_ms >= 0);
  assert.notEqual(row.answer, null, `${row.method}/${row.question_id} has no answer`);
  assert.notEqual(row.answer_value, null, `${row.method}/${row.question_id} has no answer value`);
  assert.equal(row.profile_activity_expertise, "research");
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}
