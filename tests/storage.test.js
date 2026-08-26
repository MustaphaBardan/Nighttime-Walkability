import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBaseResponse,
  finalizeSurveyTiming,
  getLocalResponses,
  getProgress,
  getSubmissionState,
  getViewportResolution,
  hydrateSessionFromProgress,
  isInstructionViewed,
  markInstructionViewed,
  clearInstructionViewed,
  saveLocalBackup,
  saveSubmissionState,
  clearSubmissionState,
  updateSessionProfile,
} from "../js/storage.js";

test.beforeEach(() => {
  globalThis.localStorage = createStorageMock();
  globalThis.sessionStorage = createStorageMock();
  delete globalThis.screen;
  delete globalThis.window;
});

test("buildBaseResponse emits a complete long-format row with profile and comment fields", () => {
  const session = {
    participant_id: "p_20260609_test",
    language: "fr",
    profile: {
      age_range: "25_34",
      gender: "prefer_not_to_say",
      night_walk_frequency: "regularly_one_two_weekly",
      night_walking_comfort: "comfortable",
      activity_expertise: "research",
      lighting_knowledge: "familiar",
    },
  };
  const question = {
    question_id: "pairwise_road_safety",
    text: {
      en: "Which scene feels safer?",
      fr: "Quelle scène paraît plus sûre ?",
    },
  };
  const originalSession = structuredClone(session);
  const originalQuestion = structuredClone(question);
  const startedAt = Date.now() - 50;
  const row = buildBaseResponse(session, "pairwise_comparison", question, 3, startedAt);

  assert.equal(row.participant_id, session.participant_id);
  assert.equal(row.language, "fr");
  assert.equal(row.method, "pairwise_comparison");
  assert.equal(row.question_id, "pairwise_road_safety");
  assert.equal(row.question_text, "Which scene feels safer?");
  assert.equal(row.image_id, null);
  assert.equal(row.answer, null);
  assert.equal(row.answer_value, null);
  assert.equal(row.response_comment, "");
  assert.equal(row.yaw_coverage_degrees, "");
  assert.equal(row.panorama_interactive_available, "");
  assert.equal(row.viewport_resolution, "");
  assert.equal(row.display_order, 3);
  assert.ok(row.reaction_time_ms >= 0);
  assert.equal(row.profile_activity_expertise, "research");
  assert.equal(row.profile_lighting_knowledge, "familiar");
  assert.deepEqual(session, originalSession);
  assert.deepEqual(question, originalQuestion);
});

test("viewport resolution uses the current browser area", () => {
  globalThis.window = { innerWidth: 1536, innerHeight: 864 };
  assert.equal(getViewportResolution(), "1536x864");

  globalThis.window = { innerWidth: 0, innerHeight: 864 };
  assert.equal(getViewportResolution(), "");
});

test("buildBaseResponse fills every optional response/profile field with safe blanks", () => {
  const row = buildBaseResponse(
    { participant_id: "p_minimal", language: "en" },
    "detailed_rating",
    { question_id: "q_minimal", text: { en: "Minimal question" } },
    1,
    Date.now(),
  );

  assert.equal(row.image_id, null);
  assert.equal(row.image_left, null);
  assert.equal(row.image_right, null);
  assert.equal(row.answer, null);
  assert.equal(row.answer_value, null);
  assert.equal(row.response_comment, "");
  assert.equal(row.profile_age_range, "");
  assert.equal(row.profile_gender, "");
  assert.equal(row.profile_night_walk_frequency, "");
  assert.equal(row.profile_night_walking_comfort, "");
  assert.equal(row.profile_activity_expertise, "");
  assert.equal(row.profile_lighting_knowledge, "");
});

test("updateSessionProfile persists the opening impression in session and progress", () => {
  const session = {
    participant_id: "p_test",
    language: "en",
    profile: {},
  };
  const profile = {
    age_range: "35_44",
    gender: "woman",
    night_walk_frequency: "often_three_five_weekly",
    night_walking_comfort: "moderately_comfortable",
    activity_expertise: "urban_design",
    lighting_knowledge: "basic",
  };

  updateSessionProfile(session, profile);

  assert.deepEqual(session.profile, profile);
  assert.deepEqual(JSON.parse(sessionStorage.getItem("night_walkability_session_v1")).profile, profile);
  assert.equal(getProgress().profile_completed, true);
  assert.deepEqual(getProgress().profile, profile);
});

test("hydrateSessionFromProgress restores saved profile and language", () => {
  localStorage.setItem("night_walkability_progress_v1", JSON.stringify({
    language: "fr",
    survey_started_at: "2026-06-09T08:00:00.000Z",
    profile_completed: true,
    profile: {
      activity_expertise: "lighting",
      lighting_knowledge: "professional_expert",
    },
  }));
  const session = {
    participant_id: "p_test",
    survey_started_at: "",
    language: "en",
    profile: {},
  };

  const progress = hydrateSessionFromProgress(session);

  assert.equal(progress.profile_completed, true);
  assert.equal(session.language, "fr");
  assert.equal(session.survey_started_at, "2026-06-09T08:00:00.000Z");
  assert.equal(session.profile.lighting_knowledge, "professional_expert");
});

test("saveLocalBackup and finalizeSurveyTiming preserve response_comment on every row", () => {
  localStorage.setItem("night_walkability_progress_v1", JSON.stringify({
    survey_started_at: "2026-06-09T08:00:00.000Z",
    completed_methods: {},
  }));
  saveLocalBackup({
    participant_id: "p_test",
    method: "pairwise_comparison",
    response_comment: "Scene A has fewer hidden areas.",
  });
  saveLocalBackup({
    participant_id: "p_test",
    method: "detailed_rating",
    response_comment: "",
  });

  const finalized = finalizeSurveyTiming("2026-06-09T08:05:00.000Z");

  assert.equal(getLocalResponses().length, 2);
  assert.equal(finalized[0].response_comment, "Scene A has fewer hidden areas.");
  assert.equal(finalized[1].response_comment, "");
  assert.equal(finalized[0].survey_duration_ms, 300000);
  assert.equal(finalized[1].survey_completed_at, "2026-06-09T08:05:00.000Z");
});

test("saveLocalBackup appends responses in order without normalizing caller-specific fields", () => {
  saveLocalBackup({ method: "first", answer: "A", response_comment: "alpha" });
  saveLocalBackup({ method: "second", answer: "5", custom_field: "kept" });
  saveLocalBackup({ method: "third", answer: "", response_comment: "" });

  assert.deepEqual(getLocalResponses(), [
    { method: "first", answer: "A", response_comment: "alpha" },
    { method: "second", answer: "5", custom_field: "kept" },
    { method: "third", answer: "", response_comment: "" },
  ]);
});

test("getProgress tolerates malformed stored JSON and returns a usable default object", () => {
  localStorage.setItem("night_walkability_progress_v1", "{not valid json");

  assert.deepEqual(getProgress(), {
    profile_completed: false,
    profile: {},
    completed_methods: {},
    viewed_instructions: {},
  });
});

test("finalizeSurveyTiming never writes a negative duration and handles missing start time", () => {
  saveLocalBackup({ participant_id: "p_test", method: "one" });
  localStorage.setItem("night_walkability_progress_v1", JSON.stringify({
    survey_started_at: "2026-06-09T09:00:00.000Z",
  }));

  const finalizedEarly = finalizeSurveyTiming("2026-06-09T08:00:00.000Z");
  assert.equal(finalizedEarly[0].survey_duration_ms, 0);

  localStorage.clear();
  saveLocalBackup({ participant_id: "p_test", method: "one" });
  const finalizedWithoutStart = finalizeSurveyTiming("2026-06-09T08:00:00.000Z");
  assert.equal(finalizedWithoutStart[0].survey_duration_ms, 0);
});

test("Public V1 progress does not read unrelated legacy survey state", () => {
  localStorage.setItem("night_walkability_progress_legacy", JSON.stringify({
    profile_completed: true,
    completed_methods: { training_scene: "legacy" },
  }));

  assert.deepEqual(getProgress(), {
    profile_completed: false,
    profile: {},
    completed_methods: {},
    viewed_instructions: {},
  });
});

test("instruction progress is persisted separately from response rows", () => {
  assert.equal(isInstructionViewed("route_continuation_examples"), false);

  markInstructionViewed("route_continuation_examples", "2026-06-18T10:00:00.000Z");
  assert.equal(isInstructionViewed("route_continuation_examples"), true);
  assert.deepEqual(getLocalResponses(), []);

  clearInstructionViewed("route_continuation_examples");
  assert.equal(isInstructionViewed("route_continuation_examples"), false);
});

test("submission receipt state is persisted and can be cleared for a redo", () => {
  saveSubmissionState({
    submission_id: "123e4567-e89b-42d3-a456-426614174000",
    status: "confirmed",
    attempts: 2,
    confirmed_at: "2026-08-26T10:00:00.000Z",
    saved: 24,
  });

  assert.deepEqual(getSubmissionState(), {
    submission_id: "123e4567-e89b-42d3-a456-426614174000",
    status: "confirmed",
    attempts: 2,
    last_attempt_at: "",
    confirmed_at: "2026-08-26T10:00:00.000Z",
    saved: 24,
  });

  clearSubmissionState();
  assert.deepEqual(getSubmissionState(), {
    submission_id: "",
    status: "idle",
    attempts: 0,
    last_attempt_at: "",
    confirmed_at: "",
    saved: 0,
  });
});

function createStorageMock() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}
