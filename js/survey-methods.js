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
    id: "training_scene",
    titleKey: "trainingTitle",
    description: "Practice rotating a static 360 degree night scene before answering the main survey.",
  },
  {
    id: "pairwise_comparison",
    titleKey: "pairwiseTitle",
    description: "Compare controlled scene pairs and choose the safer, clearer, or preferred scene.",
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

export function renderSurveyProgress(current, total, language = "en") {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeCurrent = safeTotal > 0 ? Math.min(Math.max(0, Number(current) || 0), safeTotal) : 0;
  const percent = safeTotal > 0 ? Math.round((safeCurrent / safeTotal) * 100) : 0;
  const wrapper = createElement("div", { className: "progress-wrap" });

  wrapper.innerHTML = `
    <div class="progress-label">
      <span>${t(language, "progress")}</span>
      <span>${safeCurrent} / ${safeTotal}</span>
    </div>
    <div class="progress-bar" aria-hidden="true">
      <div class="progress-fill" style="width: ${percent}%"></div>
    </div>
  `;

  return wrapper;
}

export async function completeMethod(root, context, methodId, responses, onContinue, onRerenderReady = () => {}, onBack = null) {
  const completedAt = new Date().toISOString();
  responses.forEach((response) => saveLocalBackup(response));
  markMethodCompleted(methodId, completedAt);

  const isFinalSection = allMethodsCompleted();
  let finalStatusKey = isFinalSection ? "savingComplete" : "sectionSaved";
  let continueDisabled = isFinalSection;
  let continueButton = null;
  let status = null;

  function renderCompletion() {
    const language = getContextLanguage(context);
    root.innerHTML = "";

    const panel = createElement("section", { className: "panel completion-panel" });
    status = createElement("p", {
      text: t(language, finalStatusKey),
    });
    panel.append(
      createElement("p", { className: "step-label", text: getMethodTitle(methodId, language) }),
      createElement("h2", { text: t(language, "sectionComplete") }),
      status,
    );

    const actions = createElement("div", { className: "completion-actions" });
    continueButton = createElement("button", {
      className: "primary-button",
      text: isFinalSection ? t(language, "finishSurvey") : t(language, "continue"),
      attrs: continueDisabled ? { type: "button", disabled: "disabled" } : { type: "button" },
    });

    if (onBack && !isFinalSection) {
      const backButton = createElement("button", {
        className: "secondary-button",
        text: t(language, "back"),
        attrs: { type: "button" },
      });
      backButton.addEventListener("click", () => {
        removeMethodAnswers(methodId);
        onBack();
      });
      actions.append(backButton);
    }

    continueButton.addEventListener("click", () => onContinue(context));
    actions.append(continueButton);
    panel.append(actions);
    root.append(panel);
  }

  onRerenderReady(renderCompletion);
  renderCompletion();

  if (!isFinalSection) {
    return;
  }

  const finalizedResponses = finalizeSurveyTiming(completedAt);
  const result = await submitResponses(finalizedResponses, {
    method: "complete_protocol",
    replaceExistingAll: true,
  });

  continueDisabled = false;
  finalStatusKey = result.submittedRemote ? "completeRecorded" : "completeSavedLocal";
  continueButton.disabled = false;
  status.textContent = t(getContextLanguage(context), finalStatusKey);
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
