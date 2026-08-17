import { buildBaseResponse } from "./storage.js";
import { TOTAL_SURVEY_STEPS, completeMethod, renderSurveyProgress } from "./survey-methods.js";
import { getContextLanguage, questionText, t } from "./i18n.js";
import {
  createElement,
  hashString,
  makeBalancedScenarioPairs,
  makeFixedQuestionAssignments,
  makeScenarioQuestionPairs,
} from "./utils.js";
import { renderSceneMedia } from "./panorama-viewer.js";
import { isScenarioPool } from "./scenario-protocol.js";

// this function is for showing the pairwise comparison section
export function renderPairwiseComparison(root, context, onComplete, onRerenderReady = () => {}) {
  renderProtocolIntro(root, context, onComplete, onRerenderReady);
}

// this function is for showing the pairwise comparison questions after their intro
function renderPairwiseQuestions(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "pairwise_comparison";
  const questions = context.questions.pairwise_comparison;
  const methodStartedAt = Date.now();

  // pair selection is seeded, while questions always follow the protocol order
  const pairs = isScenarioPool(context.images)
    ? makeBalancedScenarioPairs(context.images, context.session.participant_id, questions.length)
    : makeScenarioQuestionPairs(context.images, context.session.participant_id, Number.MAX_SAFE_INTEGER);
  const trials = makeFixedQuestionAssignments(
    pairs,
    questions,
    context.session.participant_id,
    "pairwise-question-assignment",
    questions.length,
    true,
  ).map((assignment) => {
    const pair = assignment.item;
    // we also randomize which image is shown as scene A or scene B
    const shouldFlipSides = hashString(`${context.session.participant_id}:${pair[0].image_id}:${pair[1].image_id}:pair-side`) % 2 === 0;
    const [first, second] = shouldFlipSides ? [pair[1], pair[0]] : pair;

    return {
      imageA: first,
      imageB: second,
      question: assignment.question,
      displayOrder: assignment.displayOrder,
    };
  });

  let currentIndex = 0;
  let trialStartedAt = Date.now();
  let activeScene = "A";
  let syncedViewState = {};
  let selectedAnswer = "";
  let yawCoverageDegrees = 0;
  let viewingTrace = [];
  let rotationCount = 0;
  let fullscreenUsed = false;
  let panoramaInteractiveAvailable = true;
  let yawCoverageState = {};
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
  const normalQuestion = createElement("div", { className: "question-prompt" });
  const shell = createElement("section", {
    className: "pairwise-viewer-shell",
    attrs: { "data-active-scene": activeScene },
  });
  const pairGrid = createElement("div", { className: "pair-grid pairwise-fullscreen-grid" });
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
  const overlayQuestion = createElement("div", { className: "pairwise-overlay-question question-prompt" });
  const overlayAnswers = createElement("div", { className: "pairwise-response-controls pairwise-overlay-answers" });
  const normalAnswers = createElement("div", { className: "pairwise-response-controls" });

  shell.append(pairGrid, overlay);
  overlayControls.append(exitFullscreenButton);
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
    renderPairwiseQuestions(root, context, onComplete, onRerenderReady);
  });
  updateTrial();

  // this function is for drawing the current pairwise trial
  function updateTrial() {
    const language = getContextLanguage(context);

    if (currentIndex >= trials.length) {
      document.removeEventListener("fullscreenchange", updateActiveScene);
      const blockTime = Date.now() - methodStartedAt;
      sessionResponses.forEach((response) => { response.block_time_ms = blockTime; });
      completeMethod(root, context, methodId, sessionResponses, onComplete, onRerenderReady, () => {
        currentIndex -= 1;
        sessionResponses.pop();
        root.innerHTML = "";
        root.append(toolbar, panel);
        document.addEventListener("fullscreenchange", updateActiveScene);
        updateTrial();
      });
      return;
    }

    const trial = trials[currentIndex];
    trialStartedAt = Date.now();
    activeScene = "A";
    syncedViewState = {};
    selectedAnswer = "";
    yawCoverageDegrees = 0;
    viewingTrace = [];
    rotationCount = 0;
    fullscreenUsed = false;
    panoramaInteractiveAvailable = true;
    yawCoverageState = {};

    // we update the text, progress, images, and answer buttons
    toolbarTitle.innerHTML = `<h2>${t(language, "pairwiseTitle")}</h2><p>${t(language, "pairwiseIntro")}</p>`;
    back.textContent = t(language, "back");
    exitFullscreenButton.textContent = t(language, "exitFullScreen");
    progressSlot.replaceChildren(renderSurveyProgress(currentIndex + 1, trials.length, language));
    normalQuestion.replaceChildren(...renderQuestionPrompt(trial.question, language));
    overlayProgress.textContent = `${t(language, "progress")} ${currentIndex + 1} / ${trials.length}`;
    overlayQuestion.replaceChildren(...renderQuestionPrompt(trial.question, language));

    pairGrid.replaceChildren(
      renderScene("A", trial.imageA, language, enterComparisonFullscreen, syncedViewState, {
        yawCoverageState,
        onYawCoverageChange: updateYawCoverage,
        onInteractiveAvailabilityChange: updateInteractiveAvailability,
      }),
      renderScene("B", trial.imageB, language, enterComparisonFullscreen, syncedViewState, {
        yawCoverageState,
        onYawCoverageChange: updateYawCoverage,
        onInteractiveAvailabilityChange: updateInteractiveAvailability,
      }),
    );
    normalAnswers.replaceChildren(renderResponseControls(language));
    overlayAnswers.replaceChildren(renderResponseControls(language));
    updateActiveScene();
    updateResponseState();
  }

  // this function is for creating the answer, comment, and continue controls
  function renderResponseControls(language) {
    const wrapper = createElement("div", { className: "response-controls" });
    const answerRow = createElement("div", { className: "answer-row" });
    const actions = createElement("div", { className: "completion-actions" });
    const continueButton = createElement("button", {
      className: "primary-button response-continue-button",
      text: t(language, "continue"),
      attrs: { type: "button", disabled: "disabled" },
    });

    [
      [t(language, "sceneA"), "A"],
      [t(language, "sceneB"), "B"],
      [t(language, "noClearDifference"), "no_clear_difference"],
    ].forEach(([label, value]) => {
      answerRow.append(renderAnswerButton(label, value, language));
    });
    continueButton.addEventListener("click", submitAnswer);
    actions.append(continueButton);
    wrapper.append(
      answerRow,
      actions,
    );
    return wrapper;
  }

  // this function is for creating one answer button
  function renderAnswerButton(label, value, language) {
    const isSelected = selectedAnswer === value;
    const button = createElement("button", {
      className: isSelected ? "choice-button selected" : "choice-button",
      text: label,
      attrs: { type: "button", "data-value": value, "aria-pressed": String(isSelected) },
    });

    button.addEventListener("click", () => {
      selectedAnswer = value;
      updateResponseState();
    });

    return button;
  }

  // this function is for saving the selected pairwise answer
  function submitAnswer() {
    if (!canContinue()) {
      return;
    }

    const trial = trials[currentIndex];
    // we build the answer row that will be saved in local storage and google sheets
    const response = buildBaseResponse(
      context.session,
      methodId,
      trial.question,
      trial.displayOrder,
      trialStartedAt,
    );

    response.image_left = trial.imageA.image_id;
    response.image_right = trial.imageB.image_id;
    response.answer = selectedAnswer;
    response.answer_value = selectedAnswer === "A" ? 1 : selectedAnswer === "B" ? 2 : 0;
    response.yaw_coverage_degrees = Math.round(yawCoverageDegrees);
    response.panorama_interactive_available = panoramaInteractiveAvailable;
    response.viewing_trace_json = JSON.stringify(viewingTrace);
    response.rotation_interaction_count = rotationCount;
    response.fullscreen_used = fullscreenUsed;
    response.fullscreen_at_answer = Boolean(document.fullscreenElement);
    sessionResponses.push(response);
    currentIndex += 1;
    updateTrial();
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
    fullscreenUsed = fullscreenUsed || document.fullscreenElement === shell || shell.contains(document.fullscreenElement);
    shell.dataset.activeScene = activeScene;
    pairGrid.querySelectorAll(".scene-option").forEach((scene) => {
      scene.classList.toggle("active", scene.dataset.sceneLabel === activeScene);
    });
  }

  // this function is for keeping normal and fullscreen answer controls in sync
  function updateResponseState() {
    root.querySelectorAll(".choice-button").forEach((button) => {
      const isSelected = button.dataset.value === selectedAnswer;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
    root.querySelectorAll(".response-continue-button").forEach((button) => {
      button.disabled = !canContinue();
    });
  }

  function updateYawCoverage(metrics) {
    yawCoverageDegrees = Number(metrics.yawCoverageDegrees) || 0;
    viewingTrace = metrics.viewingTrace || [];
    rotationCount = Number(metrics.rotationCount) || 0;
    updateResponseState();
  }

  function updateInteractiveAvailability(available) {
    if (available === false) {
      panoramaInteractiveAvailable = false;
      updateResponseState();
    }
  }

  function canContinue() {
    return Boolean(selectedAnswer);
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

  start.addEventListener("click", () => renderPairwiseQuestions(root, context, onComplete, onRerenderReady));
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
function renderScene(label, image, language, onFullscreenRequest, viewState, trackingOptions = {}) {
  const displayLabel = label === "A" ? t(language, "sceneA") : t(language, "sceneB");
  const wrapper = createElement("article", {
    className: "scene-option",
    attrs: { "data-scene-label": label },
  });
  const frame = renderSceneMedia(image, {
    alt: `${t(language, "surveyScene")} ${displayLabel}`,
    compact: true,
    viewState,
    yawCoverageState: trackingOptions.yawCoverageState,
    onYawCoverageChange: trackingOptions.onYawCoverageChange,
    onInteractiveAvailabilityChange: trackingOptions.onInteractiveAvailabilityChange,
    fullscreenLabel: t(language, "fullScreen"),
    onFullscreenRequest: (frame) => onFullscreenRequest(label, frame),
  });

  const footer = createElement("div", { className: "scene-footer" });
  footer.append(createElement("span", { className: "scene-label", text: displayLabel }));

  wrapper.append(frame, footer);
  return wrapper;
}

// this function is for rendering a short question without helper text
function renderQuestionPrompt(question, language) {
  return [
    createElement("p", { className: "question-text", text: questionText(question, language) }),
  ];
}
