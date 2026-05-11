import { CONFIG } from "./config.js";
import { localize, normalizeLanguage } from "./i18n.js";
import { generateId, getDeviceType } from "./utils.js";

export function getOrCreateSession() {
  const existingParticipantId = localStorage.getItem(CONFIG.participantStorageKey);
  const participantId = existingParticipantId || generateId("p");
  const language = getStoredLanguage();
  localStorage.setItem(CONFIG.languageStorageKey, language);

  if (!existingParticipantId) {
    localStorage.setItem(CONFIG.participantStorageKey, participantId);
  }

  const session = {
    participant_id: participantId,
    session_id: generateId("s"),
    protocol_version: CONFIG.protocolVersion,
    started_at: new Date().toISOString(),
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

export function hydrateSessionFromProgress(session) {
  const progress = getProgress();
  session.profile = progress.profile || {};
  session.language = normalizeLanguage(progress.language || localStorage.getItem(CONFIG.languageStorageKey) || session.language);
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

export async function submitResponses(responses, options = {}) {
  if (!CONFIG.googleAppsScriptUrl) {
    return {
      savedLocal: true,
      submittedRemote: false,
      message: "Saved locally. Add a Google Apps Script URL in js/config.js to submit remotely.",
    };
  }

  try {
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

export function buildBaseResponse(session, method, question, displayOrder, startedAt) {
  return {
    protocol_version: session.protocol_version || CONFIG.protocolVersion,
    participant_id: session.participant_id,
    session_id: session.session_id,
    language: session.language,
    method,
    question_id: question.question_id,
    question_text: localize(question.text, "en"),
    image_id: null,
    image_A: null,
    image_B: null,
    answer: null,
    answer_value: null,
    display_order: displayOrder,
    reaction_time_ms: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
    device: session.device,
    user_agent: navigator.userAgent,
    profile_age_range: session.profile?.age_range || "",
    profile_gender: session.profile?.gender || "",
    profile_night_walk_frequency: session.profile?.night_walk_frequency || "",
    profile_place_familiarity: session.profile?.place_familiarity || "",
    profile_night_walking_comfort: session.profile?.night_walking_comfort || "",
    profile_vision_or_display_issue: session.profile?.vision_or_display_issue || "",
    method_completed_at: "",
  };
}
