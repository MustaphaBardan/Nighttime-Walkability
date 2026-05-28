import { CONFIG } from "./config.js";
import { buildBaseResponse } from "./storage.js";
import { TOTAL_SURVEY_STEPS, completeMethod, renderSurveyProgress } from "./survey-methods.js";
import { getContextLanguage, questionText, t } from "./i18n.js";
import { createElement, makePairs } from "./utils.js";
import { getImageAssetMetadata, renderSceneMedia } from "./panorama-viewer.js";

export function renderPairwiseComparison(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "pairwise_comparison";
  const questions = context.questions.pairwise_comparison;
  const pairs = makePairs(context.images, CONFIG.pairwiseTrialCount);
  const trials = pairs.flatMap((pair, pairIndex) => {
    const [first, second] = Math.random() > 0.5 ? pair : [pair[1], pair[0]];
    return questions.map((question, questionIndex) => ({
      imageA: first,
      imageB: second,
      pairOrder: pairIndex + 1,
      questionOrder: questionIndex + 1,
      question,
      displayOrder: pairIndex * questions.length + questionIndex + 1,
    }));
  });

  let currentIndex = 0;
  let trialStartedAt = Date.now();
  let activeScene = "A";
  const sessionResponses = [];

  root.innerHTML = "";

  const toolbar = createElement("section", { className: "toolbar" });
  const toolbarTitle = createElement("div");
  const back = createElement("button", {
    className: "secondary-button",
    text: t(getContextLanguage(context), "back"),
    attrs: { type: "button" },
  });
  const progressSlot = createElement("div");
  const panel = createElement("section", { className: "panel question-panel pairwise-panel" });
  const normalQuestion = createElement("div", { className: "question-text" });
  const shell = createElement("section", {
    className: "pairwise-viewer-shell",
    attrs: { "data-active-scene": activeScene },
  });
  const pairGrid = createElement("div", { className: "pair-grid pairwise-fullscreen-grid" });
  const switchButton = createElement("button", {
    className: "pairwise-switch-button",
    attrs: { type: "button" },
  });
  const exitFullscreenButton = createElement("button", {
    className: "fullscreen-exit-button",
    text: "Exit full screen",
    attrs: { type: "button" },
  });
  const overlay = createElement("div", { className: "pairwise-fullscreen-overlay" });
  const overlayProgress = createElement("p", { className: "step-label" });
  const overlayQuestion = createElement("p", { className: "pairwise-overlay-question" });
  const overlayAnswers = createElement("div", { className: "answer-row pairwise-overlay-answers" });
  const normalAnswers = createElement("div", { className: "answer-row" });

  shell.append(pairGrid, switchButton, exitFullscreenButton, overlay);
  overlay.append(overlayProgress, overlayQuestion, overlayAnswers);
  toolbar.append(toolbarTitle, back, progressSlot);
  panel.append(normalQuestion, shell, normalAnswers);
  root.append(toolbar, panel);

  back.addEventListener("click", () => {
    if (currentIndex === 0) {
      renderProtocolIntro(root, context, onComplete, onRerenderReady);
      return;
    }

    currentIndex -= 1;
    sessionResponses.pop();
    updateTrial();
  });

  switchButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    activeScene = activeScene === "A" ? "B" : "A";
    updateActiveScene();
  });
  exitFullscreenButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.exitFullscreen?.();
  });

  document.addEventListener("fullscreenchange", updateActiveScene);
  onRerenderReady(() => {
    document.removeEventListener("fullscreenchange", updateActiveScene);
    renderPairwiseComparison(root, context, onComplete, onRerenderReady);
  });
  updateTrial();

  function updateTrial() {
    const language = getContextLanguage(context);

    if (currentIndex >= trials.length) {
      document.removeEventListener("fullscreenchange", updateActiveScene);
      completeMethod(root, context, methodId, sessionResponses, onComplete, onRerenderReady, () => {
        currentIndex -= 1;
        sessionResponses.pop();
        renderPairwiseComparison(root, context, onComplete, onRerenderReady);
      });
      return;
    }

    const trial = trials[currentIndex];
    trialStartedAt = Date.now();
    activeScene = "A";

    toolbarTitle.innerHTML = `<h2>${t(language, "pairwiseTitle")}</h2><p>${t(language, "pairwiseIntro")}</p>`;
    back.textContent = t(language, "back");
    progressSlot.replaceChildren(renderSurveyProgress(currentIndex + 1, trials.length, language));
    normalQuestion.textContent = questionText(trial.question, language);
    overlayProgress.textContent = `${t(language, "progress")} ${currentIndex + 1} / ${trials.length}`;
    overlayQuestion.textContent = questionText(trial.question, language);

    pairGrid.replaceChildren(
      renderScene("A", trial.imageA, language, enterComparisonFullscreen),
      renderScene("B", trial.imageB, language, enterComparisonFullscreen),
    );
    normalAnswers.replaceChildren(...renderAnswerButtons(language));
    overlayAnswers.replaceChildren(...renderAnswerButtons(language));
    updateActiveScene();
  }

  function renderAnswerButtons(language) {
    return [
      renderAnswerButton("A", "A", language),
      renderAnswerButton("B", "B", language),
      renderAnswerButton(t(language, "noClearDifference"), "no_clear_difference", language),
    ];
  }

  function renderAnswerButton(label, value, language) {
    const button = createElement("button", {
      className: "choice-button",
      text: label === "A" || label === "B" ? `${t(language, "scene")} ${label}` : label,
      attrs: { type: "button" },
    });

    button.addEventListener("click", () => {
      const trial = trials[currentIndex];
      const response = buildBaseResponse(
        context.session,
        methodId,
        trial.question,
        trial.displayOrder,
        trialStartedAt,
      );

      response.image_A = trial.imageA.image_id;
      response.image_B = trial.imageB.image_id;
      Object.assign(response, pairImageAssetFields("image_A", trial.imageA));
      Object.assign(response, pairImageAssetFields("image_B", trial.imageB));
      response.answer = value;
      response.answer_value = value === "A" ? 1 : value === "B" ? 2 : 0;
      response.pair_order = trial.pairOrder;
      response.pair_question_order = trial.questionOrder;

      setButtonsDisabled(true);
      sessionResponses.push(response);
      currentIndex += 1;
      updateTrial();
    });

    return button;
  }

  function enterComparisonFullscreen(sceneLabel) {
    activeScene = sceneLabel;
    updateActiveScene();
    shell.requestFullscreen?.();
  }

  function updateActiveScene() {
    const language = getContextLanguage(context);
    const nextScene = activeScene === "A" ? "B" : "A";
    shell.dataset.activeScene = activeScene;
    switchButton.textContent = `${t(language, "scene")} ${nextScene}`;
    pairGrid.querySelectorAll(".scene-option").forEach((scene) => {
      scene.classList.toggle("active", scene.dataset.sceneLabel === activeScene);
    });
  }

  function setButtonsDisabled(disabled) {
    root.querySelectorAll(".choice-button").forEach((button) => {
      button.disabled = disabled;
    });
  }
}

function pairImageAssetFields(prefix, image) {
  const asset = getImageAssetMetadata(image);

  return {
    [`${prefix}_asset_path`]: asset.path,
    [`${prefix}_asset_variant`]: asset.variant,
    [`${prefix}_asset_width`]: asset.width,
    [`${prefix}_asset_height`]: asset.height,
    [`${prefix}_asset_format`]: asset.format,
  };
}

function renderProtocolIntro(root, context, onComplete, onRerenderReady = () => {}) {
  const language = getContextLanguage(context);
  onRerenderReady(() => renderProtocolIntro(root, context, onComplete, onRerenderReady));
  root.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  const start = createElement("button", {
    className: "primary-button",
    text: t(language, "pairwiseStart"),
    attrs: { type: "button" },
  });

  start.addEventListener("click", () => renderPairwiseComparison(root, context, onComplete, onRerenderReady));
  panel.append(
    createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 4, total: TOTAL_SURVEY_STEPS }) }),
    createElement("h2", { text: t(language, "pairwiseTitle") }),
    createElement("p", { text: t(language, "pairwiseIntroBody") }),
    createElement("div", { className: "completion-actions" }),
  );
  panel.querySelector(".completion-actions").append(start);
  root.append(panel);
}

function renderScene(label, image, language, onFullscreenRequest) {
  const wrapper = createElement("article", {
    className: "scene-option",
    attrs: { "data-scene-label": label },
  });
  const frame = renderSceneMedia(image, {
    alt: `${t(language, "surveyScene")} ${label}`,
    compact: true,
    onFullscreenRequest: () => onFullscreenRequest(label),
  });

  const footer = createElement("div", { className: "scene-footer" });
  footer.append(createElement("span", { className: "scene-label", text: `${t(language, "scene")} ${label}` }));

  wrapper.append(frame, footer);
  return wrapper;
}
