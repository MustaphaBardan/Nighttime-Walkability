import assert from "node:assert/strict";
import test from "node:test";

import {
  getScenarioImages,
  getTrainingImage,
  hashString,
  isSurveyViewportAllowed,
  makeBalancedScenarioImages,
  makeBalancedScenarioPairs,
  makeFixedQuestionAssignments,
  makeScenarioQuestionPairs,
  makeSeededQuestionAssignments,
  seededShuffle,
  takeDeterministicSubset,
} from "../js/utils.js";

test("fixed question assignments preserve protocol order across participants", () => {
  const items = Array.from({ length: 8 }, (_, index) => image(`scenario-${index + 1}`));
  const questions = Array.from({ length: 6 }, (_, index) => ({ question_id: `question-${index + 1}` }));
  const first = makeFixedQuestionAssignments(items, questions, "participant-one", "detailed", 6);
  const firstAgain = makeFixedQuestionAssignments(items, questions, "participant-one", "detailed", 6);
  const second = makeFixedQuestionAssignments(items, questions, "participant-two", "detailed", 6);

  assert.deepEqual(first.map((assignment) => assignment.question.question_id), questions.map((question) => question.question_id));
  assert.deepEqual(second.map((assignment) => assignment.question.question_id), questions.map((question) => question.question_id));
  assert.notDeepEqual(first.map((assignment) => assignment.item.image_id), second.map((assignment) => assignment.item.image_id));
  assert.deepEqual(first.map((assignment) => assignment.item.image_id), firstAgain.map((assignment) => assignment.item.image_id));
  assert.equal(new Set(first.map((assignment) => assignment.item.image_id)).size, 6);
});

test("survey viewport gate checks both minimum dimensions", () => {
  assert.equal(isSurveyViewportAllowed(900, 600), true);
  assert.equal(isSurveyViewportAllowed(899, 600), false);
  assert.equal(isSurveyViewportAllowed(900, 599), false);
});

test("getScenarioImages returns only records explicitly marked as scenario", () => {
  const records = [
    image("training", { role: "training" }),
    image("scenario-a", { role: "scenario" }),
    image("scenario-b", { role: "scenario" }),
    image("missing-role", { role: undefined }),
    image("upper-case-role", { role: "Scenario" }),
    image("empty-role", { role: "" }),
  ];

  assert.deepEqual(getScenarioImages(records).map(id), ["scenario-a", "scenario-b"]);
  assert.deepEqual(getScenarioImages([]), []);
  assert.deepEqual(getScenarioImages(), []);
});

test("getTrainingImage prefers training role, falls back to first panorama, then first record", () => {
  const training = image("training-role", { role: "training", view_type: "flat" });
  const panorama = image("first-panorama", { role: "other", view_type: "panorama_360" });
  const flat = image("first-flat", { role: "other", view_type: "flat" });

  assert.equal(getTrainingImage([flat, panorama, training]).image_id, "training-role");
  assert.equal(getTrainingImage([flat, panorama]).image_id, "first-panorama");
  assert.equal(getTrainingImage([flat]).image_id, "first-flat");
  assert.equal(getTrainingImage([]), undefined);
});

test("hashString is stable, unsigned, order-sensitive, and handles non-string values consistently", () => {
  const samples = [
    "",
    "participant:pairwise",
    "participant:pairwise ",
    "Participant:pairwise",
    "abc",
    "acb",
    12345,
    null,
  ];

  for (const sample of samples) {
    assert.equal(hashString(sample), hashString(sample), `hash must be deterministic for ${String(sample)}`);
    assert.ok(Number.isInteger(hashString(sample)));
    assert.ok(hashString(sample) >= 0);
    assert.ok(hashString(sample) <= 0xFFFFFFFF);
  }

  assert.notEqual(hashString("abc"), hashString("acb"));
  assert.notEqual(hashString("participant:pairwise"), hashString("participant:detailed"));
  assert.equal(hashString(12345), hashString("12345"));
});

test("seededShuffle is deterministic, non-mutating, preserves duplicates, and changes with seed", () => {
  const original = Object.freeze(["A", "B", "B", "C", "D", "E", "F", "G"]);
  const first = seededShuffle(original, "seed-one");
  const second = seededShuffle(original, "seed-one");
  const third = seededShuffle(original, "seed-two");

  assert.deepEqual(first, second);
  assert.notStrictEqual(first, original);
  assert.deepEqual(original, ["A", "B", "B", "C", "D", "E", "F", "G"]);
  assert.deepEqual(multiset(first), multiset(original));
  assert.deepEqual(multiset(third), multiset(original));
  assert.notDeepEqual(first, third);
});

test("makeScenarioQuestionPairs builds only within-group pairs from complete variant groups", () => {
  const records = [
    ...scenarioGroup("A", [1, 2, 3]),
    ...scenarioGroup("B", [1, 2, 3]),
    ...scenarioGroup("C", [1, 3]),
    image("training", { role: "training", scenario_group: "A", scenario_variant: 1 }),
    image("malformed", { role: "scenario", scenario_group: "D", scenario_variant: "not-a-number" }),
  ];

  const pairs = makeScenarioQuestionPairs(records, "participant-alpha", 999);
  const normalizedPairs = pairs.map(normalizedPairKey).sort();

  assert.deepEqual(normalizedPairs, [
    "A1::A2",
    "A1::A3",
    "A2::A3",
    "B1::B2",
    "B1::B3",
    "B2::B3",
  ]);

  for (const [left, right] of pairs) {
    assert.equal(left.role, "scenario");
    assert.equal(right.role, "scenario");
    assert.equal(left.scenario_group, right.scenario_group);
    assert.notEqual(left.scenario_variant, right.scenario_variant);
  }
});

test("makeScenarioQuestionPairs respects requested count, remains deterministic, and never repeats a pair", () => {
  const records = [
    ...scenarioGroup("A", [1, 2, 3]),
    ...scenarioGroup("B", [1, 2, 3]),
    ...scenarioGroup("C", [1, 2, 3]),
  ];
  const first = makeScenarioQuestionPairs(records, "participant-sample", 4);
  const second = makeScenarioQuestionPairs(records, "participant-sample", 4);
  const differentParticipant = makeScenarioQuestionPairs(records, "participant-gamma", 4);

  assert.equal(first.length, 4);
  assert.deepEqual(first.map(pairIds), second.map(pairIds));
  assert.equal(new Set(first.map(normalizedPairKey)).size, first.length);
  assert.notDeepEqual(first.map(pairIds), differentParticipant.map(pairIds));
  assert.deepEqual(makeScenarioQuestionPairs(records, "participant-sample", 0), []);
  assert.deepEqual(makeScenarioQuestionPairs(records, "participant-sample", -10), []);
});

test("makeScenarioQuestionPairs caps oversized counts at the available balanced pair pool", () => {
  const records = [
    ...scenarioGroup("A", [1, 2, 3]),
    ...scenarioGroup("B", [1, 2, 3]),
    ...scenarioGroup("C", [1, 2]),
  ];

  const pairs = makeScenarioQuestionPairs(records, "participant-delta", 100);
  const normalizedPairs = pairs.map(normalizedPairKey);

  assert.equal(pairs.length, 6);
  assert.equal(new Set(normalizedPairs).size, pairs.length);
  assert.deepEqual([...normalizedPairs].sort(), [
    "A1::A2",
    "A1::A3",
    "A2::A3",
    "B1::B2",
    "B1::B3",
    "B2::B3",
  ]);
});

test("balanced pair sampling is deterministic, same-scenario, and distributed 2-2-1-1", () => {
  const records = [
    ...scenarioGroup("A", [1, 2, 3]),
    ...scenarioGroup("B", [1, 2, 3, 4]),
    ...scenarioGroup("C", [1, 2, 3, 4, 5]),
    ...scenarioGroup("D", [1, 2, 3]),
  ];
  const first = makeBalancedScenarioPairs(records, "participant-v1", 6);
  const repeated = makeBalancedScenarioPairs(records, "participant-v1", 6);

  assert.deepEqual(first.map(pairIds), repeated.map(pairIds));
  assert.equal(first.length, 6);
  assert.equal(new Set(first.map(normalizedPairKey)).size, 6);
  assert.ok(first.every(([left, right]) => left.scenario_group === right.scenario_group));
  assert.deepEqual(
    [...multiset(first.map(([left]) => left.scenario_group)).map(([, count]) => count)].sort(),
    [1, 1, 2, 2],
  );
});

test("balanced detailed sampling returns six unique images with 2-2-1-1 exposure", () => {
  const records = [
    ...scenarioGroup("A", [1, 2, 3]),
    ...scenarioGroup("B", [1, 2, 3]),
    ...scenarioGroup("C", [1, 2, 3, 4]),
    ...scenarioGroup("D", [1, 2, 3]),
  ];
  const first = makeBalancedScenarioImages(records, "participant-v1", 6);
  const repeated = makeBalancedScenarioImages(records, "participant-v1", 6);

  assert.deepEqual(first.map(id), repeated.map(id));
  assert.equal(first.length, 6);
  assert.equal(new Set(first.map(id)).size, 6);
  assert.deepEqual(
    [...multiset(first.map((record) => record.scenario_group)).map(([, count]) => count)].sort(),
    [1, 1, 2, 2],
  );
});

test("takeDeterministicSubset returns exactly the requested repeatable subset without mutating input", () => {
  const records = Array.from({ length: 12 }, (_, index) => image(`item-${index + 1}`));
  const originalIds = records.map(id);
  const first = takeDeterministicSubset(records, 5, "subset-seed");
  const second = takeDeterministicSubset(records, 5, "subset-seed");
  const differentSeed = takeDeterministicSubset(records, 5, "other-seed");

  assert.equal(first.length, 5);
  assert.equal(new Set(first.map(id)).size, 5);
  assert.deepEqual(first.map(id), second.map(id));
  assert.notDeepEqual(first.map(id), differentSeed.map(id));
  assert.deepEqual(records.map(id), originalIds);
});

test("takeDeterministicSubset handles boundary counts explicitly", () => {
  const records = [image("one"), image("two"), image("three")];

  assert.deepEqual(takeDeterministicSubset(records, 0, "seed").map(id), []);
  assert.deepEqual(takeDeterministicSubset(records, -1, "seed").map(id), []);
  assert.deepEqual(
    [...takeDeterministicSubset(records, records.length, "seed").map(id)].sort(),
    ["one", "three", "two"],
  );
  assert.deepEqual(
    [...takeDeterministicSubset(records, records.length + 10, "seed").map(id)].sort(),
    ["one", "three", "two"],
  );
});

test("makeSeededQuestionAssignments independently assigns seeded items to seeded questions", () => {
  const items = Array.from({ length: 8 }, (_, index) => image(`scenario-${index + 1}`));
  const questions = Array.from({ length: 5 }, (_, index) => ({ question_id: `question-${index + 1}` }));
  const originalItemIds = items.map(id);
  const originalQuestionIds = questions.map((question) => question.question_id);
  const first = makeSeededQuestionAssignments(items, questions, "participant-one", "detailed", 5);
  const second = makeSeededQuestionAssignments(items, questions, "participant-one", "detailed", 5);
  const differentParticipant = makeSeededQuestionAssignments(items, questions, "participant-two", "detailed", 5);

  assert.equal(first.length, 5);
  assert.deepEqual(assignmentKeys(first), assignmentKeys(second));
  assert.equal(new Set(first.map((assignment) => assignment.item.image_id)).size, first.length);
  assert.equal(new Set(first.map((assignment) => assignment.question.question_id)).size, first.length);
  assert.deepEqual(first.map((assignment) => assignment.displayOrder), [1, 2, 3, 4, 5]);
  assert.notDeepEqual(assignmentKeys(first), assignmentKeys(differentParticipant));
  assert.deepEqual(items.map(id), originalItemIds);
  assert.deepEqual(questions.map((question) => question.question_id), originalQuestionIds);
  assert.ok(first.every((assignment) => items.includes(assignment.item)));
  assert.ok(first.every((assignment) => questions.includes(assignment.question)));
});

test("makeSeededQuestionAssignments separates assignment streams by key for the same participant", () => {
  const items = Array.from({ length: 7 }, (_, index) => image(`scenario-${index + 1}`));
  const questions = Array.from({ length: 5 }, (_, index) => ({ question_id: `question-${index + 1}` }));

  const pairwise = makeSeededQuestionAssignments(items, questions, "same-participant", "pairwise", 5);
  const detailed = makeSeededQuestionAssignments(items, questions, "same-participant", "detailed", 5);

  assert.equal(pairwise.length, 5);
  assert.equal(detailed.length, 5);
  assert.notDeepEqual(assignmentKeys(pairwise), assignmentKeys(detailed));
});

test("makeSeededQuestionAssignments caps requested counts at available items and cycles questions when needed", () => {
  const items = [image("scenario-a"), image("scenario-b"), image("scenario-c"), image("scenario-d")];
  const questions = [{ question_id: "safety" }, { question_id: "comfort" }];

  const assignments = makeSeededQuestionAssignments(items, questions, "participant-count", "coverage", 10);

  assert.equal(assignments.length, items.length);
  assert.equal(new Set(assignments.map((assignment) => assignment.item.image_id)).size, items.length);
  assert.deepEqual(assignments.map((assignment) => assignment.displayOrder), [1, 2, 3, 4]);
  assert.ok(assignments.every((assignment) => assignment.question));
  assert.equal(
    assignments.filter((assignment) => assignment.question.question_id === "safety").length,
    2,
  );
  assert.equal(
    assignments.filter((assignment) => assignment.question.question_id === "comfort").length,
    2,
  );
});

test("makeSeededQuestionAssignments supports all item/question combinations over many participants", () => {
  const items = [image("scenario-a"), image("scenario-b"), image("scenario-c")];
  const questions = [
    { question_id: "safety" },
    { question_id: "comfort" },
    { question_id: "visibility" },
  ];
  const seen = new Set();

  for (let index = 0; index < 250; index += 1) {
    const assignments = makeSeededQuestionAssignments(items, questions, `participant-${index}`, "coverage", 3);

    for (const assignment of assignments) {
      seen.add(`${assignment.item.image_id}::${assignment.question.question_id}`);
    }
  }

  assert.deepEqual([...seen].sort(), [
    "scenario-a::comfort",
    "scenario-a::safety",
    "scenario-a::visibility",
    "scenario-b::comfort",
    "scenario-b::safety",
    "scenario-b::visibility",
    "scenario-c::comfort",
    "scenario-c::safety",
    "scenario-c::visibility",
  ]);
});

test("makeSeededQuestionAssignments handles empty inputs and non-positive counts", () => {
  const items = [image("scenario-a")];
  const questions = [{ question_id: "safety" }];

  assert.deepEqual(makeSeededQuestionAssignments([], questions, "p", "key", 1), []);
  assert.deepEqual(makeSeededQuestionAssignments(items, [], "p", "key", 1), []);
  assert.deepEqual(makeSeededQuestionAssignments(items, questions, "p", "key", 0), []);
  assert.deepEqual(makeSeededQuestionAssignments(items, questions, "p", "key", -1), []);
});

test("makeSeededQuestionAssignments rejects non-array items and questions", () => {
  const items = [image("scenario-a")];
  const questions = [{ question_id: "safety" }];

  assert.throws(
    () => makeSeededQuestionAssignments({ 0: items[0], length: 1 }, questions, "p", "key", 1),
    /items/i,
  );
  assert.throws(
    () => makeSeededQuestionAssignments(items, questions.length, "p", "key", 1),
    /questions/i,
  );
});

function image(imageId, overrides = {}) {
  return {
    image_id: imageId,
    role: "scenario",
    scenario_group: "",
    scenario_variant: "",
    view_type: "panorama_360",
    ...overrides,
  };
}

function scenarioGroup(group, variants) {
  return variants.map((variant) => image(`${group}${variant}`, {
    role: "scenario",
    scenario_group: group,
    scenario_variant: variant,
  }));
}

function id(record) {
  return record.image_id;
}

function pairIds(pair) {
  return pair.map(id).join("::");
}

function normalizedPairKey(pair) {
  return pair.map(id).sort().join("::");
}

function multiset(values) {
  const counts = new Map();

  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()].sort(([left], [right]) => String(left).localeCompare(String(right)));
}

function assignmentKeys(assignments) {
  return assignments.map((assignment) => `${assignment.item.image_id}::${assignment.question.question_id}`);
}
