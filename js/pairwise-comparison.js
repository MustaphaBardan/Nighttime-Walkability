import { buildBaseResponse } from "./storage.js";
import { TOTAL_SURVEY_STEPS, completeMethod, renderSurveyProgress } from "./survey-methods.js";
import { getContextLanguage, questionText, t } from "./i18n.js";
import { createElement, hashString, makeScenarioQuestionPairs } from "./utils.js";
import { renderSceneMedia } from "./panorama-viewer.js";

const RESPONSE_COMMENT_CHARACTER_LIMIT = 300;

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
  let selectedAnswer = "";
  let responseComment = "";
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
    responseComment = "";

    // we update the text, progress, images, and answer buttons
    toolbarTitle.innerHTML = `<h2>${t(language, "pairwiseTitle")}</h2><p>${t(language, "pairwiseIntro")}</p>`;
    back.textContent = t(language, "back");
    exitFullscreenButton.textContent = t(language, "exitFullScreen");
    progressSlot.replaceChildren(renderSurveyProgress(currentIndex + 1, trials.length, language));
    normalQuestion.textContent = questionText(trial.question, language);
    overlayProgress.textContent = `${t(language, "progress")} ${currentIndex + 1} / ${trials.length}`;
    overlayQuestion.textContent = questionText(trial.question, language);

    pairGrid.replaceChildren(
      renderScene("A", trial.imageA, language, enterComparisonFullscreen, syncedViewState),
      renderScene("B", trial.imageB, language, enterComparisonFullscreen, syncedViewState),
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
      [t(language, "left"), "A"],
      [t(language, "right"), "B"],
      [t(language, "noClearDifference"), "no_clear_difference"],
    ].forEach(([label, value]) => {
      answerRow.append(renderAnswerButton(label, value, language));
    });
    continueButton.addEventListener("click", submitAnswer);
    actions.append(continueButton);
    wrapper.append(
      answerRow,
      renderOptionalCommentControl(language, responseComment, updateResponseComment),
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
    if (!selectedAnswer) {
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

    response.image_A = trial.imageA.image_id;
    response.image_B = trial.imageB.image_id;
    response.image_left = trial.imageA.image_id;
    response.image_right = trial.imageB.image_id;
    response.answer = selectedAnswer;
    response.answer_value = selectedAnswer === "A" ? 1 : selectedAnswer === "B" ? 2 : 0;
    response.response_comment = limitCharacters(responseComment.trim(), RESPONSE_COMMENT_CHARACTER_LIMIT);

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
      button.disabled = !selectedAnswer;
    });
    syncCommentTextareas();
  }

  // this function is for updating the shared optional pairwise comment
  function updateResponseComment(value) {
    responseComment = limitCharacters(value, RESPONSE_COMMENT_CHARACTER_LIMIT);
    syncCommentTextareas();
  }

  // this function is for keeping duplicate comment fields identical
  function syncCommentTextareas() {
    root.querySelectorAll(".response-comment-textarea").forEach((textarea) => {
      if (textarea.value !== responseComment) {
        textarea.value = responseComment;
      }
      textarea.dispatchEvent(new CustomEvent("comment-sync"));
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
  const displayLabel = label === "A" ? t(language, "left") : t(language, "right");
  const wrapper = createElement("article", {
    className: "scene-option",
    attrs: { "data-scene-label": label },
  });
  const frame = renderSceneMedia(image, {
    alt: `${t(language, "surveyScene")} ${displayLabel}`,
    compact: true,
    viewState,
    fullscreenLabel: t(language, "fullScreen"),
    onFullscreenRequest: (frame) => onFullscreenRequest(label, frame),
  });

  const footer = createElement("div", { className: "scene-footer" });
  footer.append(createElement("span", { className: "scene-label", text: displayLabel }));

  wrapper.append(frame, footer);
  return wrapper;
}

// this function is for rendering an optional comment field for one response
function renderOptionalCommentControl(language, value, onInput) {
  const label = createElement("label", { className: "form-field response-comment-field" });
  const textarea = createElement("textarea", {
    className: "response-comment-textarea",
    attrs: {
      rows: "3",
      placeholder: t(language, "optionalComment"),
    },
  });
  const counter = createElement("small", {
    className: "field-helper character-counter",
  });

  textarea.value = limitCharacters(value, RESPONSE_COMMENT_CHARACTER_LIMIT);
  label.append(createElement("span", { text: t(language, "responseCommentPrompt") }), textarea, counter);

  function updateCounter() {
    const limitedValue = limitCharacters(textarea.value, RESPONSE_COMMENT_CHARACTER_LIMIT);

    if (textarea.value !== limitedValue) {
      textarea.value = limitedValue;
    }

    counter.textContent = t(language, "characterLimit", {
      current: countCharacters(textarea.value),
      limit: RESPONSE_COMMENT_CHARACTER_LIMIT,
    });
  }

  textarea.addEventListener("input", () => {
    updateCounter();
    onInput(textarea.value);
  });
  textarea.addEventListener("comment-sync", updateCounter);
  updateCounter();

  return label;
}

// this function is for counting characters correctly
function countCharacters(value) {
  return Array.from(String(value)).length;
}

// this function is for cutting text at the character limit
function limitCharacters(value, limit) {
  return Array.from(String(value)).slice(0, limit).join("");
}
