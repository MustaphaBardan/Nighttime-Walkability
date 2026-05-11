import {
  buildBaseResponse,
  clearMethodCompletion,
  finalizeSurveyTiming,
  getProgress,
  markMethodCompleted,
  removeLocalResponsesForMethod,
  saveLocalBackup,
  submitResponses,
} from "./storage.js";
import { getContextLanguage, t } from "./i18n.js";
import { createElement } from "./utils.js";

export const METHOD_DEFINITIONS = [
  {
    id: "pairwise_comparison",
    titleKey: "pairwiseTitle",
    description: "Compare controlled scene pairs and choose the safer, clearer, or preferred route.",
  },
  {
    id: "detailed_rating",
    titleKey: "detailedTitle",
    description: "Rate a short set of scenes on safety, comfort, visibility, and route choice.",
  },
  {
    id: "ideal_scene_builder",
    titleKey: "builderTitle",
    description: "Choose preferred lighting, vegetation, openness, sidewalk, obstacle, and activity conditions.",
  },
  {
    id: "realism_check",
    titleKey: "realismTitle",
    description: "Judge whether the simulated scenes and lighting felt plausible enough to evaluate.",
  },
];

export const TOTAL_SURVEY_STEPS = METHOD_DEFINITIONS.length + 2;

export function getAllMethodIds() {
  return METHOD_DEFINITIONS.map((method) => method.id);
}

export function getMethodTitle(methodId, language = "en") {
  const method = METHOD_DEFINITIONS.find((item) => item.id === methodId);
  return method ? t(language, method.titleKey) : methodId;
}

export function removeMethodAnswers(methodId) {
  removeLocalResponsesForMethod(methodId);
  clearMethodCompletion(methodId);
}

export async function completeMethod(root, context, methodId, responses, onContinue) {
  const language = getContextLanguage(context);
  const completedAt = new Date().toISOString();
  responses.forEach((response) => {
    response.method_completed_at = completedAt;
  });
  responses.forEach((response) => saveLocalBackup(response));
  markMethodCompleted(methodId, completedAt);

  const isFinalSection = allMethodsCompleted();
  root.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  const status = createElement("p", {
    text: isFinalSection ? t(language, "savingComplete") : t(language, "sectionSaved"),
  });
  panel.append(
    createElement("p", { className: "step-label", text: getMethodTitle(methodId, language) }),
    createElement("h2", { text: t(language, "sectionComplete") }),
    status,
  );

  const actions = createElement("div", { className: "completion-actions" });
  const continueButton = createElement("button", {
    className: "primary-button",
    text: isFinalSection ? t(language, "finishSurvey") : t(language, "continue"),
    attrs: isFinalSection ? { type: "button", disabled: "disabled" } : { type: "button" },
  });

  continueButton.addEventListener("click", () => onContinue(context));
  actions.append(continueButton);
  panel.append(actions);
  root.append(panel);

  if (!isFinalSection) {
    return;
  }

  const finalizedResponses = finalizeSurveyTiming(completedAt);
  const result = await submitResponses(finalizedResponses, {
    method: "complete_protocol",
    replaceExistingAll: true,
  });

  continueButton.disabled = false;
  status.textContent = result.submittedRemote
    ? t(language, "completeRecorded")
    : t(language, "completeSavedLocal");
}

export function allMethodsCompleted() {
  const completed = getProgress().completed_methods || {};
  return getAllMethodIds().every((methodId) => Boolean(completed[methodId]));
}

export function makeResponse(context, methodId, question, displayOrder, startedAt, values = {}) {
  return {
    ...buildBaseResponse(context.session, methodId, question, displayOrder, startedAt),
    ...values,
  };
}
