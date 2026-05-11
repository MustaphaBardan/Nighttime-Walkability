import {
  buildBaseResponse,
  clearMethodCompletion,
  getLocalResponses,
  getProgress,
  markMethodCompleted,
  removeLocalResponsesForMethod,
  saveLocalBackup,
  submitResponses,
} from "./storage.js";
import { createElement } from "./utils.js";

export const METHOD_DEFINITIONS = [
  {
    id: "pairwise_comparison",
    title: "Pairwise comparison",
    description: "Compare controlled scene pairs and choose the safer, clearer, or preferred route.",
  },
  {
    id: "detailed_rating",
    title: "Detailed scene rating",
    description: "Rate a short set of scenes on safety, comfort, visibility, and route choice.",
  },
  {
    id: "ideal_scene_builder",
    title: "Ideal scene builder",
    description: "Choose preferred lighting, vegetation, openness, sidewalk, obstacle, and activity conditions.",
  },
  {
    id: "realism_check",
    title: "Realism check",
    description: "Judge whether the simulated scenes and lighting felt plausible enough to evaluate.",
  },
];

export const TOTAL_SURVEY_STEPS = METHOD_DEFINITIONS.length + 2;

export function getAllMethodIds() {
  return METHOD_DEFINITIONS.map((method) => method.id);
}

export function getMethodTitle(methodId) {
  return METHOD_DEFINITIONS.find((method) => method.id === methodId)?.title || methodId;
}

export function removeMethodAnswers(methodId) {
  removeLocalResponsesForMethod(methodId);
  clearMethodCompletion(methodId);
}

export async function completeMethod(root, context, methodId, responses, onContinue) {
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
    text: isFinalSection ? "Saving your complete response..." : "This section is saved on this browser.",
  });
  panel.append(
    createElement("p", { className: "step-label", text: getMethodTitle(methodId) }),
    createElement("h2", { text: "Section complete" }),
    status,
  );

  const actions = createElement("div", { className: "completion-actions" });
  const continueButton = createElement("button", {
    className: "primary-button",
    text: isFinalSection ? "Finish survey" : "Continue",
    attrs: isFinalSection ? { type: "button", disabled: "disabled" } : { type: "button" },
  });

  continueButton.addEventListener("click", () => onContinue(context));
  actions.append(continueButton);
  panel.append(actions);
  root.append(panel);

  if (!isFinalSection) {
    return;
  }

  const result = await submitResponses(getLocalResponses(), {
    method: "complete_protocol",
    replaceExistingAll: true,
  });

  continueButton.disabled = false;
  status.textContent = result.submittedRemote
    ? "Your complete response has been recorded."
    : "Your complete response is saved on this browser. The research team can retry submission after checking the Google Sheets connection.";
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
