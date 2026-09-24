import { CONFIG } from "./config.js";
import { localize, normalizeLanguage } from "./i18n.js";
import { generateId, getDeviceType } from "./utils.js";

export function getOrCreateSession() {
  const existingParticipantId = localStorage.getItem(CONFIG.participantStorageKey);
  const participantId = existingParticipantId || generateId("p");
  const language = getStoredLanguage();
  const progress = getProgress();
  localStorage.setItem(CONFIG.languageStorageKey, language);

  if (!existingParticipantId) {
    localStorage.setItem(CONFIG.participantStorageKey, participantId);
  }

  const session = {
    participant_id: participantId,
    survey_started_at: progress.survey_started_at || "",
    language,
    device: getDeviceType(),
    profile: {},
  };

  sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(session));
  return session;
}

export function getStoredLanguage() {
  const savedLanguage = localStorage.getItem(CONFIG.languageStorageKey);

  if (savedLanguage) {
    return normalizeLanguage(savedLanguage);
  }

  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function updateSessionLanguage(session, language) {
  const nextLanguage = normalizeLanguage(language);
  session.language = nextLanguage;
  document.documentElement.lang = nextLanguage;
  localStorage.setItem(CONFIG.languageStorageKey, nextLanguage);
  sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(session));

  const progress = getProgress();
  progress.language = nextLanguage;
  saveProgress(progress);
}

export function markSurveyStarted(session, options = {}) {
  const progress = getProgress();

  if (!progress.survey_started_at || options.reset) {
    progress.survey_started_at = new Date().toISOString();
  }

  session.survey_started_at = progress.survey_started_at;
  saveProgress(progress);
  sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(session));

  return progress.survey_started_at;
}

export function updateSessionProfile(session, profile) {
  session.profile = profile;
  sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(session));

  const progress = getProgress();
  progress.profile_completed = true;
  progress.profile = profile;
  progress.language = session.language;
  saveProgress(progress);
}

export function getLocalResponses() {
  return JSON.parse(localStorage.getItem(CONFIG.localStorageKey) || "[]");
}

export function saveLocalBackup(response) {
  const existing = getLocalResponses();
  existing.push(response);
  localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(existing));
}

export function saveLocalResponses(responses) {
  localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(responses));
}

export function removeLocalResponsesForMethod(method) {
  const remaining = getLocalResponses().filter((response) => response.method !== method);
  localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(remaining));
}

export function clearLocalResponses() {
  localStorage.removeItem(CONFIG.localStorageKey);
}

export function resetSurveyState() {
  localStorage.removeItem(CONFIG.localStorageKey);
  localStorage.removeItem(CONFIG.progressStorageKey);
  localStorage.removeItem(CONFIG.participantStorageKey);
  sessionStorage.removeItem(CONFIG.sessionStorageKey);
}

export function getProgress() {
  const defaults = {
    profile_completed: false,
    profile: {},
    completed_methods: {},
    viewed_instructions: {},
  };

  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(CONFIG.progressStorageKey) || "{}"),
    };
  } catch {
    return defaults;
  }
}

export function saveProgress(progress) {
  localStorage.setItem(CONFIG.progressStorageKey, JSON.stringify(progress));
}

export function getSubmissionState() {
  const submission = getProgress().submission;

  return {
    submission_id: submission?.submission_id || "",
    status: submission?.status || "idle",
    attempts: Number(submission?.attempts) || 0,
    last_attempt_at: submission?.last_attempt_at || "",
    confirmed_at: submission?.confirmed_at || "",
    saved: Number(submission?.saved) || 0,
  };
}

export function saveSubmissionState(submission) {
  const progress = getProgress();
  progress.submission = {
    ...getSubmissionState(),
    ...submission,
  };
  saveProgress(progress);
  return progress.submission;
}

export function clearSubmissionState() {
  const progress = getProgress();
  delete progress.submission;
  saveProgress(progress);
}

export function hydrateSessionFromProgress(session) {
  const progress = getProgress();
  session.profile = progress.profile || {};
  session.language = normalizeLanguage(progress.language || localStorage.getItem(CONFIG.languageStorageKey) || session.language);
  session.survey_started_at = progress.survey_started_at || session.survey_started_at || "";
  sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(session));
  return progress;
}

export function isMethodCompleted(method) {
  return Boolean(getProgress().completed_methods?.[method]);
}

export function markMethodCompleted(method, completedAt = new Date().toISOString()) {
  const progress = getProgress();
  progress.completed_methods = progress.completed_methods || {};
  progress.completed_methods[method] = completedAt;
  saveProgress(progress);
}

export function clearMethodCompletion(method) {
  const progress = getProgress();

  if (progress.completed_methods) {
    delete progress.completed_methods[method];
  }

  saveProgress(progress);
}

export function isInstructionViewed(instructionId) {
  return Boolean(getProgress().viewed_instructions?.[instructionId]);
}

export function markInstructionViewed(instructionId, viewedAt = new Date().toISOString()) {
  const progress = getProgress();
  progress.viewed_instructions = progress.viewed_instructions || {};
  progress.viewed_instructions[instructionId] = viewedAt;
  saveProgress(progress);
}

export function clearInstructionViewed(instructionId) {
  const progress = getProgress();

  if (progress.viewed_instructions) {
    delete progress.viewed_instructions[instructionId];
  }

  saveProgress(progress);
}

export function finalizeSurveyTiming(completedAt = new Date().toISOString()) {
  const responses = getLocalResponses();
  const progress = getProgress();
  const startedAt = progress.survey_started_at || completedAt;
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const safeDurationMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : "";

  const finalized = responses.map((response) => ({
    ...response,
    survey_completed_at: completedAt,
    survey_duration_ms: safeDurationMs,
  }));

  saveLocalResponses(finalized);
  return finalized;
}

export function buildBaseResponse(session, method, question, displayOrder, startedAt) {
  return {
    participant_id: session.participant_id,
    survey_completed_at: "",
    survey_duration_ms: "",
    language: session.language,
    method,
    question_id: question.question_id,
    question_text: localize(question.text, "en"),
    image_id: null,
    image_left: null,
    image_right: null,
    answer: null,
    answer_value: null,
    response_comment: "",
    yaw_coverage_degrees: "",
    panorama_interactive_available: "",
    viewing_trace_json: "",
    rotation_interaction_count: "",
    fullscreen_used: "",
    fullscreen_at_answer: "",
    block_time_ms: "",
    viewport_resolution: getViewportResolution(),
    display_order: displayOrder,
    reaction_time_ms: Date.now() - startedAt,
    profile_age_range: session.profile?.age_range || "",
    profile_gender: session.profile?.gender || "",
    profile_night_walk_frequency: session.profile?.night_walk_frequency || "",
    profile_night_walking_comfort: session.profile?.night_walking_comfort || "",
    profile_activity_expertise: session.profile?.activity_expertise || "",
    profile_lighting_knowledge: session.profile?.lighting_knowledge || "",
  };
}

export function getViewportResolution() {
  const width = Number(globalThis.window?.innerWidth);
  const height = Number(globalThis.window?.innerHeight);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "";
  }

  return `${Math.round(width)}x${Math.round(height)}`;
}
