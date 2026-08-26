// this object contains the main settings used by the survey website
export const CONFIG = {
  protocolLabel: "Public protocol V1",
  googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycbztOko8hIfqh-oAJp9Q9aRLPWiTDOKx6TLMJoMJPsObjnM293KlErOyUvdXYJkAzvG2/exec",
  submissionPostSettleWaitMs: 12000,
  submissionReceiptPollDelaysMs: [1000, 2000, 4000, 8000],
  submissionRetryDelaysMs: [10000, 60000],
  localStorageKey: "night_walkability_responses_v1",
  progressStorageKey: "night_walkability_progress_v1",
  participantStorageKey: "night_walkability_participant_id_v1",
  sessionStorageKey: "night_walkability_session_v1",
  languageStorageKey: "night_walkability_language_v1",
  themeStorageKey: "night_walkability_theme",
};
