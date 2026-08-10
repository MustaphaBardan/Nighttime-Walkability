import assert from "node:assert/strict";
import test from "node:test";

import { buildResponseSummary, buildResponseSummaryModel } from "../js/summary.js";

test("summary uses positive detailed tendencies and completed builder choices", () => {
  const summary = buildResponseSummary([
    { method: "detailed_rating", question_id: "detailed_route_continuation", answer_value: 5 },
    { method: "detailed_rating", question_id: "detailed_comfort_atmosphere", answer_value: 4 },
    { method: "ideal_scene_builder", question_id: "preferred_lighting_intensity", answer: "medium" },
    { method: "ideal_scene_builder", question_id: "preferred_obstacles", answer: "dont_know" },
  ], "en");

  assert.match(summary[0], /route legibility/);
  assert.ok(summary.some((line) => /Medium lighting/.test(line)));
  assert.doesNotMatch(summary.join(" "), /I do not know/);
  assert.match(summary.at(-1), /not an individual scientific assessment/);
});

test("summary has a bilingual generic fallback", () => {
  assert.match(buildResponseSummary([], "fr")[0], /appréciations nuancées/);
});

test("structured summary separates insights from the disclaimer", () => {
  const summary = buildResponseSummaryModel([], "en");

  assert.equal(summary.insights[0].type, "tendencies");
  assert.match(summary.insights[0].text, /nuanced assessment/);
  assert.match(summary.disclaimer, /not an individual scientific assessment/);
});
