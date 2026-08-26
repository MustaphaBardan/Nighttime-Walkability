import {
  buildBaseResponse,
  clearMethodCompletion,
  finalizeSurveyTiming,
  getProgress,
  markMethodCompleted,
  removeLocalResponsesForMethod,
  saveLocalBackup,
} from "./storage.js";
import { scheduleAutomaticSubmissionRetries, submitResponses } from "./submission.js";
import { getContextLanguage, t } from "./i18n.js";
import { createElement } from "./utils.js";

// this list defines the order of the survey sections
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
    description: "Choose Scenario C vegetation density, vegetation lighting, path lighting, and obstacle conditions.",
  },
  {
    id: "realism_check",
    titleKey: "realismTitle",
    description: "Judge whether the simulated scenes and lighting felt plausible enough to evaluate.",
  },
];

export const TOTAL_SURVEY_STEPS = METHOD_DEFINITIONS.length + 2;

// this function is for getting all method ids
export function getAllMethodIds() {
  return METHOD_DEFINITIONS.map((method) => method.id);
}

// this function is for getting the translated title of a method
export function getMethodTitle(methodId, language = "en") {
  const method = METHOD_DEFINITIONS.find((item) => item.id === methodId);
  return method ? t(language, method.titleKey) : methodId;
}

// this function is for removing answers and progress for one method
export function removeMethodAnswers(methodId) {
  removeLocalResponsesForMethod(methodId);
  clearMethodCompletion(methodId);
}

// this function is for rendering the progress bar
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

// this function is for saving a section and showing the section complete screen
export async function completeMethod(root, context, methodId, responses, onContinue, onRerenderReady = () => {}, onBack = null) {
  const completedAt = new Date().toISOString();
  // we save every answer locally before moving to the next section
  responses.forEach((response) => saveLocalBackup(response));
  markMethodCompleted(methodId, completedAt);

  const isFinalSection = allMethodsCompleted();
  let finalStatusKey = isFinalSection ? "savingComplete" : "sectionSaved";
  let continueDisabled = isFinalSection;
  let canRetrySubmission = false;

  // this function is for drawing the completion message for the current section
  function renderCompletion() {
    const language = getContextLanguage(context);
    const isSavingFinalResponse = isFinalSection && continueDisabled;
    root.innerHTML = "";

    const panel = createElement("section", { className: "panel completion-panel" });
    const status = createElement("p", {
      text: t(language, finalStatusKey),
      attrs: { role: "status", "aria-live": "polite" },
    });
    panel.append(
      createElement("p", { className: "step-label", text: getMethodTitle(methodId, language) }),
      createElement("h2", { text: t(language, "sectionComplete") }),
      status,
    );

    if (isSavingFinalResponse) {
      const savingProgress = createElement("div", {
        className: "saving-progress",
        attrs: {
          role: "progressbar",
          "aria-label": t(language, "savingProgress"),
          "aria-valuetext": t(language, "savingProgress"),
        },
      });
      savingProgress.append(createElement("div", { className: "saving-progress-bar" }));
      panel.append(savingProgress);
    }

    const actions = createElement("div", { className: "completion-actions" });
    const continueButton = createElement("button", {
      className: `primary-button${isSavingFinalResponse ? " saving-summary-button" : ""}`,
      attrs: continueDisabled ? { type: "button", disabled: "disabled" } : { type: "button" },
    });

    if (isSavingFinalResponse) {
      continueButton.append(
        createElement("span", { className: "button-spinner", attrs: { "aria-hidden": "true" } }),
        createElement("span", { text: t(language, "savingSummary") }),
      );
    } else {
      continueButton.textContent = isFinalSection ? t(language, "viewSummary") : t(language, "continue");
    }

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

    if (isFinalSection && canRetrySubmission) {
      const retryButton = createElement("button", {
        className: "secondary-button",
        text: t(language, "retrySubmission"),
        attrs: { type: "button" },
      });
      retryButton.addEventListener("click", async () => {
        canRetrySubmission = false;
        finalStatusKey = "submissionRetrying";
        renderCompletion();
        const retryResult = await submitResponses(finalizedResponses, {
          method: "complete_protocol",
          replaceExistingAll: true,
        });
        finalStatusKey = retryResult.submittedRemote ? "completeRecorded" : "completeSavedLocal";
        canRetrySubmission = !retryResult.submittedRemote;
        renderCompletion();
      });
      actions.append(retryButton);
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

  // we submit only when all survey methods are completed
  const finalizedResponses = finalizeSurveyTiming(completedAt);
  const result = await submitResponses(finalizedResponses, {
    method: "complete_protocol",
    replaceExistingAll: true,
  });

  continueDisabled = false;
  finalStatusKey = result.submittedRemote ? "completeRecorded" : "completeSavedLocal";
  canRetrySubmission = !result.submittedRemote;
  renderCompletion();

  if (!result.submittedRemote) {
    scheduleAutomaticSubmissionRetries(finalizedResponses, {
      method: "complete_protocol",
      replaceExistingAll: true,
    });
  }
}

// this function is for checking if the whole survey is completed
export function allMethodsCompleted() {
  const completed = getProgress().completed_methods || {};
  return getAllMethodIds().every((methodId) => Boolean(completed[methodId]));
}

// this function is for adding method specific values to the common response row
export function makeResponse(context, methodId, question, displayOrder, startedAt, values = {}) {
  return {
    ...buildBaseResponse(context.session, methodId, question, displayOrder, startedAt),
    ...values,
  };
}
