import { CONFIG } from "./config.js";
import { localize, normalizeLanguage } from "./i18n.js";
import { generateId, getDeviceType } from "./utils.js";

// this function is for creating or reading the participant session
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

// this function is for reading the saved language or guessing it from the browser
export function getStoredLanguage() {
  const savedLanguage = localStorage.getItem(CONFIG.languageStorageKey);

  if (savedLanguage) {
    return normalizeLanguage(savedLanguage);
  }

  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

// this function is for saving the language in the session and progress
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

// this function is for saving when the survey started
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

// this function is for saving the profile answers
export function updateSessionProfile(session, profile) {
  session.profile = profile;
  sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(session));

  const progress = getProgress();
  progress.profile_completed = true;
  progress.profile = profile;
  progress.language = session.language;
  saveProgress(progress);
}

// this function is for reading all answers saved in the browser
export function getLocalResponses() {
  return JSON.parse(localStorage.getItem(CONFIG.localStorageKey) || "[]");
}

// this function is for adding one answer to the browser backup
export function saveLocalBackup(response) {
  const existing = getLocalResponses();
  existing.push(response);
  localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(existing));
}

// this function is for replacing all saved answers in the browser
export function saveLocalResponses(responses) {
  localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(responses));
}

// this function is for deleting answers from one survey method
export function removeLocalResponsesForMethod(method) {
  const remaining = getLocalResponses().filter((response) => response.method !== method);
  localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(remaining));
}

// this function is for clearing all saved answers
export function clearLocalResponses() {
  localStorage.removeItem(CONFIG.localStorageKey);
}

// this function is for clearing the survey state for a fresh participant
export function resetSurveyState() {
  localStorage.removeItem(CONFIG.localStorageKey);
  localStorage.removeItem(CONFIG.progressStorageKey);
  localStorage.removeItem(CONFIG.participantStorageKey);
  sessionStorage.removeItem(CONFIG.sessionStorageKey);
}

// this function is for reading progress from local storage
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

// this function is for saving progress in local storage
export function saveProgress(progress) {
  localStorage.setItem(CONFIG.progressStorageKey, JSON.stringify(progress));
}

// this function is for putting saved progress back into the active session
export function hydrateSessionFromProgress(session) {
  const progress = getProgress();
  session.profile = progress.profile || {};
  session.language = normalizeLanguage(progress.language || localStorage.getItem(CONFIG.languageStorageKey) || session.language);
  session.survey_started_at = progress.survey_started_at || session.survey_started_at || "";
  sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(session));
  return progress;
}

// this function is for checking if one method is already completed
export function isMethodCompleted(method) {
  return Boolean(getProgress().completed_methods?.[method]);
}

// this function is for marking a method as completed
export function markMethodCompleted(method, completedAt = new Date().toISOString()) {
  const progress = getProgress();
  progress.completed_methods = progress.completed_methods || {};
  progress.completed_methods[method] = completedAt;
  saveProgress(progress);
}

// this function is for undoing the completion of one method
export function clearMethodCompletion(method) {
  const progress = getProgress();

  if (progress.completed_methods) {
    delete progress.completed_methods[method];
  }

  saveProgress(progress);
}

// this function is for checking whether a non-response instruction screen was viewed
export function isInstructionViewed(instructionId) {
  return Boolean(getProgress().viewed_instructions?.[instructionId]);
}

// this function is for remembering a non-response instruction screen
export function markInstructionViewed(instructionId, viewedAt = new Date().toISOString()) {
  const progress = getProgress();
  progress.viewed_instructions = progress.viewed_instructions || {};
  progress.viewed_instructions[instructionId] = viewedAt;
  saveProgress(progress);
}

// this function is for showing an instruction again when a participant redoes the protocol
export function clearInstructionViewed(instructionId) {
  const progress = getProgress();

  if (progress.viewed_instructions) {
    delete progress.viewed_instructions[instructionId];
  }

  saveProgress(progress);
}

// this function is for sending the final responses to google apps script
export async function submitResponses(responses, options = {}) {
  if (!CONFIG.googleAppsScriptUrl) {
    return {
      savedLocal: true,
      submittedRemote: false,
      message: "Saved locally. Add a Google Apps Script URL in js/config.js to submit remotely.",
    };
  }

  try {
    // we use no-cors because google apps script does not return normal cors headers
    await fetch(CONFIG.googleAppsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        participant_id: responses[0]?.participant_id || "",
        method: options.method || responses[0]?.method || "",
        replace_existing: Boolean(options.replaceExisting),
        replace_existing_all: Boolean(options.replaceExistingAll),
        responses,
      }),
    });

    return {
      savedLocal: true,
      submittedRemote: true,
      message: "Saved locally and sent to the configured endpoint.",
    };
  } catch (error) {
    return {
      savedLocal: true,
      submittedRemote: false,
      message: `Saved locally. Remote submission failed: ${error.message}`,
    };
  }
}

// this function is for adding final timing info to every response
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

// this function is for making the common response row used by all questions
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
    preview_variant_id: "",
    yaw_coverage_degrees: "",
    panorama_interactive_available: "",
    viewing_trace_json: "",
    rotation_count: "",
    fullscreen_used: "",
    fullscreen_at_answer: "",
    scene_time_ms: "",
    block_time_ms: "",
    screen_resolution: getScreenResolution(),
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

// this function is for reading the browser-reported display resolution safely
export function getScreenResolution() {
  const width = Number(globalThis.screen?.width);
  const height = Number(globalThis.screen?.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "";
  }

  return `${Math.round(width)}x${Math.round(height)}`;
}

// this function records the usable browser area in CSS pixels
export function getViewportResolution() {
  const width = Number(globalThis.window?.innerWidth);
  const height = Number(globalThis.window?.innerHeight);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "";
  }

  return `${Math.round(width)}x${Math.round(height)}`;
}
