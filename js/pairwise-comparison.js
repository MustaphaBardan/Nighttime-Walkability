import { buildBaseResponse } from "./storage.js";
import { TOTAL_SURVEY_STEPS, completeMethod, renderSurveyProgress } from "./survey-methods.js";
import { getContextLanguage, questionText, t } from "./i18n.js";
import { createElement, hashString, makeScenarioQuestionPairs } from "./utils.js";
import { renderSceneMedia } from "./panorama-viewer.js";

// this function is for showing the pairwise comparison section
export function renderPairwiseComparison(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "pairwise_comparison";
  const questions = context.questions.pairwise_comparison;

  // we create one random pair for each pairwise question
  const pairs = makeScenarioQuestionPairs(context.images, context.session.participant_id, questions.length);
  const questionOffset = questions.length ? hashString(`${context.session.participant_id}:pairwise-questions`) % questions.length : 0;
  const trials = pairs.map((pair, pairIndex) => {
    // we also randomize which image is shown as scene A or scene B
    const shouldFlipSides = hashString(`${context.session.participant_id}:${pair[0].image_id}:${pair[1].image_id}:pair-side`) % 2 === 0;
    const [first, second] = shouldFlipSides ? [pair[1], pair[0]] : pair;
    const questionIndex = (pairIndex + questionOffset) % questions.length;

    return {
      imageA: first,
      imageB: second,
      question: questions[questionIndex],
      displayOrder: pairIndex + 1,
    };
  });

  let currentIndex = 0;
  let trialStartedAt = Date.now();
  let activeScene = "A";
  let syncedViewState = {};
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
  const sceneAButton = createElement("button", {
    className: "pairwise-scene-button",
    attrs: { type: "button" },
  });
  const sceneBButton = createElement("button", {
    className: "pairwise-scene-button",
    attrs: { type: "button" },
  });
  const exitFullscreenButton = createElement("button", {
    className: "fullscreen-exit-button",
    text: t(getContextLanguage(context), "exitFullScreen"),
    attrs: { type: "button" },
  });
  const overlay = createElement("div", { className: "pairwise-fullscreen-overlay" });
  const overlayToggleButton = createElement("button", {
    className: "pairwise-overlay-toggle",
    text: "v",
    attrs: { type: "button", "aria-expanded": "true" },
  });
  const overlayContent = createElement("div", { className: "pairwise-fullscreen-content" });
  const overlayControls = createElement("div", { className: "pairwise-fullscreen-controls" });
  const overlayProgress = createElement("p", { className: "step-label" });
  const overlayQuestion = createElement("p", { className: "pairwise-overlay-question" });
  const overlayAnswers = createElement("div", { className: "answer-row pairwise-overlay-answers" });
  const normalAnswers = createElement("div", { className: "answer-row" });

  shell.append(pairGrid, overlay);
  overlayControls.append(exitFullscreenButton, sceneAButton, sceneBButton);
  overlayContent.append(overlayControls, overlayProgress, overlayQuestion, overlayAnswers);
  overlay.append(overlayToggleButton, overlayContent);
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

  sceneAButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    activeScene = "A";
    updateActiveScene();
  });
  sceneBButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    activeScene = "B";
    updateActiveScene();
  });
  overlayToggleButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    overlay.classList.toggle("collapsed");
    const collapsed = overlay.classList.contains("collapsed");
    overlayToggleButton.textContent = collapsed ? "^" : "v";
    overlayToggleButton.setAttribute("aria-expanded", String(!collapsed));
  });
  exitFullscreenButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.exitFullscreen?.();
  });

  document.addEventListener("fullscreenchange", updateActiveScene);
  onRerenderReady(() => {
    // we remove the listener before re-rendering to avoid duplicate fullscreen handlers
    document.removeEventListener("fullscreenchange", updateActiveScene);
    renderPairwiseComparison(root, context, onComplete, onRerenderReady);
  });
  updateTrial();

  // this function is for drawing the current pairwise trial
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
    syncedViewState = {};

    // we update the text, progress, images, and answer buttons
    toolbarTitle.innerHTML = `<h2>${t(language, "pairwiseTitle")}</h2><p>${t(language, "pairwiseIntro")}</p>`;
    back.textContent = t(language, "back");
    exitFullscreenButton.textContent = t(language, "exitFullScreen");
    sceneAButton.textContent = `${t(language, "scene")} A`;
    sceneBButton.textContent = `${t(language, "scene")} B`;
    progressSlot.replaceChildren(renderSurveyProgress(currentIndex + 1, trials.length, language));
    normalQuestion.textContent = questionText(trial.question, language);
    overlayProgress.textContent = `${t(language, "progress")} ${currentIndex + 1} / ${trials.length}`;
    overlayQuestion.textContent = questionText(trial.question, language);

    pairGrid.replaceChildren(
      renderScene("A", trial.imageA, language, enterComparisonFullscreen, syncedViewState),
      renderScene("B", trial.imageB, language, enterComparisonFullscreen, syncedViewState),
    );
    normalAnswers.replaceChildren(...renderAnswerButtons(language));
    overlayAnswers.replaceChildren(...renderAnswerButtons(language));
    updateActiveScene();
  }

  // this function is for creating the three answer buttons
  function renderAnswerButtons(language) {
    return [
      renderAnswerButton("A", "A", language),
      renderAnswerButton("B", "B", language),
      renderAnswerButton(t(language, "noClearDifference"), "no_clear_difference", language),
    ];
  }

  // this function is for creating one answer button and saving the answer
  function renderAnswerButton(label, value, language) {
    const button = createElement("button", {
      className: "choice-button",
      text: label === "A" || label === "B" ? `${t(language, "scene")} ${label}` : label,
      attrs: { type: "button" },
    });

    button.addEventListener("click", () => {
      const trial = trials[currentIndex];
      // we build the answer row that will be saved in local storage and google sheets
      const response = buildBaseResponse(
        context.session,
        methodId,
        trial.question,
        trial.displayOrder,
        trialStartedAt,
      );

      response.image_A = trial.imageA.image_id;
      response.image_B = trial.imageB.image_id;
      response.image_left = trial.imageA.image_id;
      response.image_right = trial.imageB.image_id;
      response.answer = value;
      response.answer_value = value === "A" ? 1 : value === "B" ? 2 : 0;

      setButtonsDisabled(true);
      sessionResponses.push(response);
      currentIndex += 1;
      updateTrial();
    });

    return button;
  }

  // this function is for entering fullscreen on the comparison viewer
  async function enterComparisonFullscreen(sceneLabel, fallbackFrame) {
    activeScene = sceneLabel;
    updateActiveScene();

    if (document.fullscreenElement === shell) {
      return;
    }

    try {
      await shell.requestFullscreen?.();
    } catch (error) {
      console.warn("Pairwise fullscreen request failed.", error);
      await fallbackFrame?.requestFullscreen?.();
    }
  }

  // this function is for marking which scene is active in fullscreen
  function updateActiveScene() {
    shell.dataset.activeScene = activeScene;
    sceneAButton.classList.toggle("selected", activeScene === "A");
    sceneBButton.classList.toggle("selected", activeScene === "B");
    sceneAButton.setAttribute("aria-pressed", String(activeScene === "A"));
    sceneBButton.setAttribute("aria-pressed", String(activeScene === "B"));
    pairGrid.querySelectorAll(".scene-option").forEach((scene) => {
      scene.classList.toggle("active", scene.dataset.sceneLabel === activeScene);
    });
  }

  // this function is for blocking double clicks while the next trial is rendering
  function setButtonsDisabled(disabled) {
    root.querySelectorAll(".choice-button").forEach((button) => {
      button.disabled = disabled;
    });
  }
}

// this function is for showing the intro screen before pairwise comparison
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

// this function is for rendering one scene in the pairwise comparison
function renderScene(label, image, language, onFullscreenRequest, viewState) {
  const wrapper = createElement("article", {
    className: "scene-option",
    attrs: { "data-scene-label": label },
  });
  const frame = renderSceneMedia(image, {
    alt: `${t(language, "surveyScene")} ${label}`,
    compact: true,
    viewState,
    fullscreenLabel: t(language, "fullScreen"),
    onFullscreenRequest: (frame) => onFullscreenRequest(label, frame),
  });

  const footer = createElement("div", { className: "scene-footer" });
  footer.append(createElement("span", { className: "scene-label", text: `${t(language, "scene")} ${label}` }));

  wrapper.append(frame, footer);
  return wrapper;
}
