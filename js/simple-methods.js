import { getContextLanguage, localize, optionLabel, optionPreview, questionText, t } from "./i18n.js";
import { markMethodCompleted, saveLocalBackup } from "./storage.js";
import { TOTAL_SURVEY_STEPS, completeMethod, makeResponse, renderSurveyProgress } from "./survey-methods.js";
import { createElement, getScenarioImages, getTrainingImage, makeSeededQuestionAssignments } from "./utils.js";
import { renderSceneMedia } from "./panorama-viewer.js";

const FINAL_COMMENT_CHARACTER_LIMIT = 300;

// this function is for showing the training 360 scene before the real questions
export function renderTrainingScene(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "training_scene";
  const question = context.questions.training_scene?.[0] || {
    question_id: "training_360_scene_viewed",
    text: { en: "Rotate the 360 degree scene before continuing.", fr: "Faites pivoter la scène à 360 degrés avant de continuer." },
  };
  const image = getTrainingImage(context.images);
  let startedAt = Date.now();
  let yawCoverageDegrees = 0;
  let selectedAnswer = "";
  const yawCoverageState = {};

  // this function is for redrawing the training screen
  function renderCurrent() {
    const language = getContextLanguage(context);
    onRerenderReady(renderCurrent);
    startedAt = Date.now();
    selectedAnswer = "";
    root.innerHTML = "";

    const toolbar = renderQuestionToolbar(
      t(language, "trainingTitle"),
      t(language, "trainingIntro"),
      () => {},
      true,
      renderSurveyProgress(1, 1, language),
      language,
    );
    const panel = createElement("section", { className: "panel question-panel training-panel" });
    const actions = createElement("div", { className: "completion-actions" });
    const coverageValue = createElement("strong", { text: t(language, "yawCoverageValue", { current: yawCoverageDegrees }) });
    const fullscreenCoverageValue = createElement("div", {
      className: "training-yaw-fullscreen",
      text: t(language, "yawCoverageValue", { current: yawCoverageDegrees }),
    });
    const coverageRange = createElement("input", {
      className: "training-yaw-range",
      attrs: {
        type: "range",
        min: "0",
        max: "360",
        value: String(yawCoverageDegrees),
        disabled: "disabled",
        "aria-label": t(language, "yawCoverageLabel"),
      },
    });
    const coverageMeter = createElement("div", { className: "training-yaw-meter" });
    const continueButton = createElement("button", {
      className: "primary-button",
      text: t(language, "continue"),
      attrs: { type: "button", disabled: "disabled" },
    });
    const answerRow = renderChoiceRow(question.options || ["yes", "partly", "no"], language, (answer) => {
      // we save which training answer is selected before enabling continue
      selectedAnswer = answer;
      answerRow.querySelectorAll(".choice-button").forEach((button) => {
        const isSelected = button.dataset.value === answer;
        button.classList.toggle("selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });
      continueButton.disabled = false;
    }, question.question_id);

    // this function is for updating how many degrees the user has seen
    function updateYawCoverage({ yawCoverageDegrees: nextCoverage }) {
      yawCoverageDegrees = Math.max(0, Math.min(360, Math.round(nextCoverage || 0)));
      coverageRange.value = String(yawCoverageDegrees);
      coverageValue.textContent = t(language, "yawCoverageValue", { current: yawCoverageDegrees });
      fullscreenCoverageValue.textContent = t(language, "yawCoverageValue", { current: yawCoverageDegrees });
    }

    continueButton.addEventListener("click", () => {
      if (!selectedAnswer) {
        return;
      }

      // we save the training answer and the 360 rotation coverage
      const answerValue = (question.options || []).indexOf(selectedAnswer) + 1;
      saveLocalBackup(makeResponse(context, methodId, question, 1, startedAt, {
        image_id: image.image_id,
        answer: selectedAnswer,
        answer_value: answerValue || null,
        yaw_coverage_degrees: yawCoverageDegrees,
      }));
      markMethodCompleted(methodId);
      onComplete(context);
    });

    coverageMeter.append(
      createElement("div", {
        className: "training-yaw-meter-label",
        html: `<span>${t(language, "yawCoverageLabel")}</span>`,
      }),
      coverageValue,
      coverageRange,
    );
    actions.append(continueButton);
    panel.append(
      createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 3, total: TOTAL_SURVEY_STEPS }) }),
      renderSingleImage(image, language, {
        fullViewport: true,
        onYawCoverageChange: updateYawCoverage,
        yawCoverageState,
        overlayElement: fullscreenCoverageValue,
      }),
      coverageMeter,
      createElement("p", { className: "question-text training-question-text", text: questionText(question, language) }),
      answerRow,
      actions,
    );
    root.append(toolbar, panel);
  }

  renderCurrent();
}

// this function is for the old batch classification section
export function renderBatchClassification(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "batch_classification";
  const question = context.questions.batch_classification[0];
  const responses = [];
  let currentIndex = 0;
  let startedAt = Date.now();

  // this function is for showing one image at a time in batch classification
  function renderCurrent() {
    const language = getContextLanguage(context);
    onRerenderReady(renderCurrent);

    if (currentIndex >= context.images.length) {
      completeMethod(root, context, methodId, responses, onComplete, onRerenderReady, () => {
        currentIndex -= 1;
        responses.pop();
        renderCurrent();
      });
      return;
    }

    const image = context.images[currentIndex];
    startedAt = Date.now();
    root.innerHTML = "";

    const toolbar = renderQuestionToolbar(
      "Batch classification",
      null,
      () => {
        if (currentIndex === 0) {
          onComplete(context);
          return;
        }

        currentIndex -= 1;
        responses.pop();
        renderCurrent();
      },
      currentIndex === 0,
      renderSurveyProgress(currentIndex + 1, context.images.length, language),
      language,
    );
    const panel = createElement("section", { className: "panel question-panel" });
    panel.append(
      createElement("p", { className: "question-text", text: questionText(question, language) }),
      renderSingleImage(image, language),
      renderChoiceRow(question.answers, language, (answer, index) => {
        responses.push(makeResponse(context, methodId, question, currentIndex + 1, startedAt, {
          image_id: image.image_id,
          answer,
          answer_value: index + 1,
        }));
        currentIndex += 1;
        renderCurrent();
      }),
    );

    root.append(toolbar, panel);
  }

  renderCurrent();
}

// this function is for showing detailed rating questions with one scene per question
export function renderDetailedRating(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "detailed_rating";
  const questions = context.questions.detailed_rating;

  // we seed both scenario selection and which question each selected scenario receives
  const assignments = makeSeededQuestionAssignments(
    getScenarioImages(context.images),
    questions,
    context.session.participant_id,
    "detailed-rating-question-assignment",
    questions.length,
  );
  const responses = [];
  let questionIndex = 0;
  let displayOrder = 1;
  let startedAt = Date.now();
  let selectedRating = null;
  let responseComment = "";
  root.innerHTML = "";

  const toolbarSlot = createElement("div");
  const panel = createElement("section", { className: "panel question-panel detailed-rating-panel" });
  const questionTextElement = createElement("p", { className: "question-text" });
  const shell = createElement("section", { className: "detailed-rating-shell" });
  const mediaSlot = createElement("div", { className: "detailed-rating-media" });
  const exitFullscreenButton = createElement("button", {
    className: "fullscreen-exit-button",
    text: t(getContextLanguage(context), "exitFullScreen"),
    attrs: { type: "button" },
  });
  const overlay = createElement("div", { className: "detailed-rating-overlay" });
  const overlayToggleButton = createElement("button", {
    className: "detailed-overlay-toggle",
    text: "v",
    attrs: { type: "button", "aria-expanded": "true" },
  });
  const overlayContent = createElement("div", { className: "detailed-fullscreen-content" });
  const overlayControls = createElement("div", { className: "detailed-fullscreen-controls" });
  const overlayProgress = createElement("p", { className: "step-label" });
  const overlayQuestion = createElement("p", { className: "detailed-overlay-question" });
  const overlayAnswers = createElement("div", { className: "detailed-overlay-answers" });
  const normalAnswers = createElement("div", { className: "detailed-normal-answers" });

  overlayControls.append(exitFullscreenButton);
  overlayContent.append(overlayControls, overlayProgress, overlayQuestion, overlayAnswers);
  overlay.append(overlayToggleButton, overlayContent);
  shell.append(mediaSlot, overlay);
  panel.append(questionTextElement, shell, normalAnswers);
  root.append(toolbarSlot, panel);
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

  // this function is for rendering the current detailed rating question
  function renderCurrent() {
    const language = getContextLanguage(context);
    onRerenderReady(renderCurrent);

    if (questionIndex >= assignments.length) {
      completeMethod(root, context, methodId, responses, onComplete, onRerenderReady, () => {
        responses.pop();
        displayOrder -= 1;
        questionIndex -= 1;

        root.innerHTML = "";
        root.append(toolbarSlot, panel);
        renderCurrent();
      });
      return;
    }

    const assignment = assignments[questionIndex];
    const image = assignment.item;
    const question = assignment.question;
    startedAt = Date.now();
    selectedRating = null;
    responseComment = "";

    const toolbar = renderQuestionToolbar(
      t(language, "detailedTitle"),
      null,
      () => {
        if (displayOrder === 1) {
          onComplete(context);
          return;
        }

        responses.pop();
        displayOrder -= 1;
        questionIndex -= 1;

        renderCurrent();
      },
      displayOrder === 1,
      renderSurveyProgress(displayOrder, assignments.length, language),
      language,
    );
    toolbarSlot.replaceChildren(toolbar);
    questionTextElement.textContent = questionText(question, language);
    overlayProgress.textContent = `${t(language, "progress")} ${displayOrder} / ${assignments.length}`;
    overlayQuestion.textContent = questionText(question, language);
    mediaSlot.replaceChildren(renderSingleImage(image, language, {
      onFullscreenRequest: () => shell.requestFullscreen?.(),
    }));
    normalAnswers.replaceChildren(renderDetailedAnswerControls(question, language));
    overlayAnswers.replaceChildren(renderDetailedAnswerControls(question, language));
    updateDetailedAnswerState();
  }

  // this function is for selecting a detailed rating without immediately advancing
  function selectAnswer(value) {
    selectedRating = value;
    updateDetailedAnswerState();
  }

  // this function is for saving one detailed rating answer
  function submitAnswer() {
    if (!selectedRating) {
      return;
    }

    const assignment = assignments[questionIndex];
    const image = assignment.item;
    const question = assignment.question;
    responses.push(makeResponse(context, methodId, question, displayOrder, startedAt, {
      image_id: image.image_id,
      answer: String(selectedRating),
      answer_value: selectedRating,
      response_comment: limitCharacters(responseComment.trim(), FINAL_COMMENT_CHARACTER_LIMIT),
    }));

    displayOrder += 1;
    questionIndex += 1;

    renderCurrent();
  }

  // this function is for rendering the answer, comment, and continue controls
  function renderDetailedAnswerControls(question, language) {
    const wrapper = createElement("div", { className: "response-controls" });
    const continueButton = createElement("button", {
      className: "primary-button response-continue-button",
      text: t(language, "continue"),
      attrs: { type: "button", disabled: "disabled" },
    });

    continueButton.addEventListener("click", submitAnswer);
    wrapper.append(
      renderLikertRow(question, language, selectAnswer, selectedRating),
      renderOptionalCommentControl(language, responseComment, updateResponseComment),
      createElement("div", { className: "completion-actions" }),
    );
    wrapper.querySelector(".completion-actions").append(continueButton);
    return wrapper;
  }

  // this function is for keeping normal and fullscreen detailed controls in sync
  function updateDetailedAnswerState() {
    root.querySelectorAll(".likert-button").forEach((button) => {
      const isSelected = Number(button.dataset.value) === selectedRating;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
    root.querySelectorAll(".response-continue-button").forEach((button) => {
      button.disabled = !selectedRating;
    });
    syncCommentTextareas();
  }

  // this function is for updating the shared detailed comment value
  function updateResponseComment(value) {
    responseComment = limitCharacters(value, FINAL_COMMENT_CHARACTER_LIMIT);
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

  renderCurrent();
}

// this function is for the ideal scene builder section
export function renderIdealSceneBuilder(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "ideal_scene_builder";
  const questions = context.questions.ideal_scene_builder;
  let startedAt = Date.now();
  const selections = {};
  const variantConfig = context.idealSceneVariants || {};
  let currentPreview = buildIdealPreviewImage(variantConfig.default, "ideal_scene_default");
  let parametersCollapsed = false;

  root.innerHTML = "";

  const toolbarSlot = createElement("div");
  const panel = createElement("section", { className: "panel question-panel ideal-builder-panel" });
  const preview = createElement("section", { className: "ideal-builder-preview" });
  const mediaSlot = createElement("div", { className: "ideal-builder-media" });
  const controls = createElement("section", { className: "ideal-builder-controls" });
  const overlay = createElement("section", { className: "ideal-builder-fullscreen-overlay" });
  const overlayActions = createElement("div", { className: "ideal-builder-overlay-actions" });
  const overlayControls = createElement("div", { className: "ideal-builder-overlay-controls" });
  const exitFullscreenButton = createElement("button", {
    className: "fullscreen-exit-button",
    text: t(getContextLanguage(context), "exitFullScreen"),
    attrs: { type: "button" },
  });
  const parametersToggle = createElement("button", {
    className: "parameters-toggle-button",
    text: "<",
    attrs: { type: "button", "aria-expanded": "true", "aria-label": t(getContextLanguage(context), "hideParameters") },
  });
  const continueButton = createElement("button", {
    className: "primary-button",
    text: t(getContextLanguage(context), "validateContinue"),
    attrs: { type: "button", disabled: "disabled" },
  });
  const fullscreenContinueButton = createElement("button", {
    className: "primary-button",
    text: t(getContextLanguage(context), "validateContinue"),
    attrs: { type: "button", disabled: "disabled" },
  });

  overlayActions.append(exitFullscreenButton, fullscreenContinueButton);
  preview.append(mediaSlot, parametersToggle, overlay);
  overlay.append(overlayActions, overlayControls);
  panel.append(preview, controls, createElement("div", { className: "completion-actions", html: "" }));
  panel.querySelector(".completion-actions").append(continueButton);
  root.append(toolbarSlot, panel);

  function submitBuilder() {
    // we only continue after all builder parameters are answered
    if (!allBuilderQuestionsAnswered()) {
      return;
    }

    // we save one response row per builder question
    const responses = questions.map((question, index) => {
      const answer = selections[question.question_id];
      return makeResponse(context, methodId, question, index + 1, startedAt, {
        answer,
        answer_value: question.options.indexOf(answer) + 1,
        image_id: currentPreview.image_id,
        preview_variant_id: currentPreview.variant_id || "",
      });
    });

    completeMethod(root, context, methodId, responses, onComplete, onRerenderReady);
  }

  continueButton.addEventListener("click", submitBuilder);
  fullscreenContinueButton.addEventListener("click", submitBuilder);
  exitFullscreenButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.exitFullscreen?.();
  });
  parametersToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    parametersCollapsed = !parametersCollapsed;
    updateParametersCollapsedState();
  });

  // this function is for rendering the builder image and controls
  function renderCurrent() {
    const language = getContextLanguage(context);
    onRerenderReady(renderCurrent);

    const toolbar = renderQuestionToolbar(
      t(language, "builderTitle"),
      t(language, "builderIntro"),
      () => onComplete(context),
      true,
      renderSurveyProgress(countSelectedQuestions(), questions.length, language),
      language,
    );
    toolbarSlot.replaceChildren(toolbar);
    continueButton.textContent = t(language, "validateContinue");
    fullscreenContinueButton.textContent = t(language, "validateContinue");
    continueButton.disabled = !allBuilderQuestionsAnswered();
    fullscreenContinueButton.disabled = !allBuilderQuestionsAnswered();
    exitFullscreenButton.textContent = t(language, "exitFullScreen");
    mediaSlot.replaceChildren(
      renderSingleImage(currentPreview, language, {
        fullViewport: true,
        onFullscreenRequest: () => preview.requestFullscreen?.(),
      }),
    );
    controls.replaceChildren();
    overlayControls.replaceChildren();
    questions.forEach((question) => {
      const onSelect = (answer) => {
        // we save the selected option and update the preview image
        selections[question.question_id] = answer;
        currentPreview = resolveIdealSceneVariant(variantConfig, selections);
        renderCurrent();
      };
      controls.append(renderBuilderParameterControl(question, language, selections[question.question_id], onSelect));
      overlayControls.append(renderBuilderParameterControl(question, language, selections[question.question_id], onSelect));
    });
    updateParametersCollapsedState();
  }

  // this function is for counting how many builder questions are answered
  function countSelectedQuestions() {
    return questions.filter((question) => Boolean(selections[question.question_id])).length;
  }

  // this function is for checking if all builder questions are answered
  function allBuilderQuestionsAnswered() {
    return countSelectedQuestions() === questions.length;
  }

  // this function is for hiding or showing parameters in fullscreen
  function updateParametersCollapsedState() {
    preview.classList.toggle("parameters-collapsed", parametersCollapsed);
    parametersToggle.setAttribute("aria-expanded", String(!parametersCollapsed));
    parametersToggle.setAttribute("aria-label", t(getContextLanguage(context), parametersCollapsed ? "showParameters" : "hideParameters"));
    parametersToggle.textContent = parametersCollapsed ? ">" : "<";
  }

  renderCurrent();
}

// this function is for the final realism and viewing quality questions
export function renderRealismCheck(root, context, onComplete, onRerenderReady = () => {}, draft = null) {
  const language = getContextLanguage(context);
  const methodId = "realism_check";
  const questions = context.questions.realism_check;
  const startedAt = Date.now();
  onRerenderReady(() => renderRealismCheck(root, context, onComplete, onRerenderReady, readRealismDraft(root)));
  root.innerHTML = "";

  const toolbar = createElement("section", { className: "toolbar" });
  toolbar.append(
    createElement("div", {
      html: `<h2>${t(language, "realismTitle")}</h2><p>${t(language, "realismIntro")}</p>`,
    }),
  );

  const panel = createElement("section", { className: "panel form-panel" });
  const form = createElement("form", { className: "profile-form" });

  form.append(
    createElement("p", { className: "step-label", text: t(language, "finalSection") }),
  );

  questions.forEach((question, index) => {
    if (question.type === "textarea") {
      form.append(renderTextArea(question, language, draft?.[question.question_id] || ""));
      return;
    }

    if (question.type === "choice") {
      form.append(renderChoiceField(question, index + 1, language, draft?.[question.question_id] || ""));
      return;
    }

    form.append(renderScaleField(question, index + 1, language, draft?.[question.question_id] || ""));
  });

  const actions = createElement("div", { className: "completion-actions" });
  const submit = createElement("button", {
    className: "primary-button",
    text: t(language, "finishSurvey"),
    attrs: { type: "submit" },
  });

  actions.append(submit);
  form.append(actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // we read the final form and create one response per question
    const formData = new FormData(form);
    const responses = questions.map((question, index) => {
      const rawValue = String(formData.get(question.question_id) || "").trim();
      const value = question.type === "textarea"
        ? limitCharacters(rawValue, FINAL_COMMENT_CHARACTER_LIMIT)
        : rawValue;
      return makeResponse(context, methodId, question, index + 1, startedAt, {
        answer: value,
        answer_value: question.type === "scale" ? Number(value) : getChoiceAnswerValue(question, value),
      });
    });

    completeMethod(root, context, methodId, responses, onComplete, onRerenderReady);
  });

  panel.append(form);
  root.append(toolbar, panel);
}

// this function is for rendering one control in the ideal scene builder
function renderBuilderParameterControl(question, language, selectedAnswer, onSelect) {
  const fieldset = createElement("fieldset", { className: "builder-parameter" });
  const legend = createElement("legend", { text: questionText(question, language) });
  const options = createElement("div", { className: "builder-parameter-options" });

  question.options.forEach((option) => {
    const button = createElement("button", {
      className: option === selectedAnswer ? "builder-option selected" : "builder-option",
      text: optionLabel(option, language, question.question_id),
      attrs: {
        type: "button",
        "aria-pressed": String(option === selectedAnswer),
      },
    });

    button.addEventListener("click", () => onSelect(option));
    options.append(button);
  });

  fieldset.append(legend, options);
  return fieldset;
}

// this function is for finding the preview image that matches the builder selections
function resolveIdealSceneVariant(config = {}, selections = {}) {
  const variants = config.variants || [];
  const matchingVariant = variants
    .filter((variant) => variantMatchesSelections(variant, selections))
    .sort((first, second) => Object.keys(second.conditions || {}).length - Object.keys(first.conditions || {}).length)[0];

  return buildIdealPreviewImage(matchingVariant || config.default, "ideal_scene_default");
}

// this function is for checking if a preview variant matches the selected answers
function variantMatchesSelections(variant, selections) {
  const conditions = variant.conditions || {};
  const entries = Object.entries(conditions);

  if (!entries.length) {
    return false;
  }

  return entries.every(([questionId, answer]) => selections[questionId] === answer);
}

// this function is for building a panorama image object for the preview
function buildIdealPreviewImage(variant = {}, fallbackId = "ideal_scene_preview") {
  return {
    image_id: variant.variant_id || fallbackId,
    variant_id: variant.variant_id || fallbackId,
    path: variant.path || "assets/images/Test_image_panoramic.png",
    source_path: variant.source_path || variant.path || "assets/images/Test_image_panoramic.png",
    responsive_sources: variant.responsive_sources || {},
    width: variant.width || "",
    height: variant.height || "",
    format: variant.format || "",
    view_type: variant.view_type || "panorama_360",
    initial_yaw_degrees: variant.initial_yaw_degrees ?? 90,
    description: localize(variant.description, "en") || "Ideal scene preview.",
  };
}

// this function is for rendering the toolbar used by question screens
function renderQuestionToolbar(title, intro, onBack, backDisabled, progress, language = "en") {
  const toolbar = createElement("section", { className: "toolbar" });
  const heading = createElement("div", {
    html: `<h2>${title}</h2>${intro ? `<p>${intro}</p>` : ""}`,
  });
  const back = createElement("button", {
    className: "secondary-button",
    text: t(language, "back"),
    attrs: backDisabled ? { type: "button", disabled: "disabled" } : { type: "button" },
  });

  if (!backDisabled) {
    back.addEventListener("click", onBack);
  }

  toolbar.append(heading, back, progress);
  return toolbar;
}

// this function is for rendering old preview choice cards
function renderPreviewChoiceGrid(question, language, onSelect) {
  const grid = createElement("div", { className: "preview-option-grid" });

  question.options.forEach((option, index) => {
    const button = createElement("button", {
      className: "preview-option-card",
      attrs: { type: "button", "aria-pressed": "false" },
    });

    button.append(
      createElement("span", {
        className: `preview-card-image ${getPreviewClass(question.question_id, option)}`,
        attrs: { "aria-hidden": "true" },
      }),
      createElement("strong", { text: optionLabel(option, language, question.question_id) }),
      createElement("span", { text: optionPreview(question.question_id, option, language) }),
    );

    button.addEventListener("click", () => {
      grid.querySelectorAll(".preview-option-card").forEach((card) => {
        card.classList.remove("selected");
        card.setAttribute("aria-pressed", "false");
      });
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
      onSelect(option, index);
    });

    grid.append(button);
  });

  return grid;
}

// this function is for rendering one image or panorama in a question
function renderSingleImage(image, language = "en", options = {}) {
  const wrapper = createElement("article", { className: "scene-option single-scene" });
  const frame = renderSceneMedia(image, {
    alt: `${t(language, "surveyScene")} ${image.image_id || ""}`.trim(),
    fullscreenLabel: t(language, "fullScreen"),
    ...options,
  });

  if (options.fullViewport) {
    wrapper.classList.add("training-scene-option");
  }

  wrapper.append(frame);
  return wrapper;
}

// this function is for rendering a row of choice buttons
function renderChoiceRow(options, language, onSelect, questionId = null) {
  const row = createElement("div", { className: "answer-row" });
  options.forEach((option, index) => {
    const button = createElement("button", {
      className: "choice-button",
      text: optionLabel(option, language, questionId),
      attrs: { type: "button", "data-value": option, "aria-pressed": "false" },
    });
    button.addEventListener("click", () => onSelect(option, index));
    row.append(button);
  });
  return row;
}

// this function is for rendering the 1 to 5 rating buttons
function renderLikertRow(question, language, onSelect, selectedValue = null) {
  const scale = question.scale || 5;
  const wrapper = createElement("div", { className: "scale-block" });
  const scaleLine = createElement("div", { className: "scale-line" });
  const row = createElement("div", { className: "answer-row likert-row" });

  for (let value = 1; value <= scale; value += 1) {
    const isSelected = Number(selectedValue) === value;
    const button = createElement("button", {
      className: isSelected ? "choice-button likert-button selected" : "choice-button likert-button",
      text: String(value),
      attrs: { type: "button", "data-value": String(value), "aria-pressed": String(isSelected) },
    });
    button.addEventListener("click", () => onSelect(value));
    row.append(button);
  }

  scaleLine.innerHTML = renderScaleAnchors(question, language, row);
  scaleLine.querySelector(".scale-anchor-min").after(row);
  wrapper.append(scaleLine);

  return wrapper;
}

// this function is for rendering an optional comment field for a response
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

  textarea.value = limitCharacters(value, FINAL_COMMENT_CHARACTER_LIMIT);
  label.append(createElement("span", { text: t(language, "responseCommentPrompt") }), textarea, counter);

  function updateCounter() {
    const limitedValue = limitCharacters(textarea.value, FINAL_COMMENT_CHARACTER_LIMIT);

    if (textarea.value !== limitedValue) {
      textarea.value = limitedValue;
    }

    counter.textContent = t(language, "characterLimit", {
      current: countCharacters(textarea.value),
      limit: FINAL_COMMENT_CHARACTER_LIMIT,
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

// this function is for rendering a radio scale field in the final form
function renderScaleField(question, order, language, selectedValue = "") {
  const fieldset = createElement("fieldset", { className: "scale-field" });
  const legend = createElement("legend", { text: questionText(question, language) });
  const row = createElement("div", { className: "answer-row likert-row" });
  const scale = question.scale || 5;

  for (let value = 1; value <= scale; value += 1) {
    const label = createElement("label", { className: "radio-scale-option" });
    const input = createElement("input", {
      attrs: {
        type: "radio",
        name: question.question_id,
        value: String(value),
        required: "required",
      },
    });

    if (String(value) === String(selectedValue)) {
      input.checked = true;
    }

    label.append(input, createElement("span", { text: String(value) }));
    row.append(label);
  }

  fieldset.append(
    legend,
    createElement("p", { className: "step-label", text: t(language, "questionNumber", { number: order }) }),
    row,
    createElement("div", {
      className: "scale-anchors",
      html: renderScaleAnchors(question, language),
    }),
  );

  return fieldset;
}

// this function is for rendering a radio choice field in the final form
function renderChoiceField(question, order, language, selectedValue = "") {
  const fieldset = createElement("fieldset", { className: "scale-field" });
  const legend = createElement("legend", { text: questionText(question, language) });
  const row = createElement("div", { className: "answer-row likert-row" });

  question.options.forEach((option, index) => {
    const label = createElement("label", { className: "radio-choice-option" });
    const input = createElement("input", {
      attrs: {
        type: "radio",
        name: question.question_id,
        value: option,
        required: "required",
      },
    });

    if (String(option) === String(selectedValue)) {
      input.checked = true;
    }

    label.append(input, createElement("span", { text: optionLabel(option, language, question.question_id) }));
    row.append(label);
  });

  fieldset.append(
    legend,
    createElement("p", { className: "step-label", text: t(language, "questionNumber", { number: order }) }),
    row,
  );

  return fieldset;
}

// this function is for rendering a text area with character limit
function renderTextArea(question, language, value = "") {
  const label = createElement("label", { className: "form-field" });
  const textarea = createElement("textarea", {
    attrs: {
      name: question.question_id,
      rows: "4",
      placeholder: t(language, "optionalComment"),
    },
  });

  if (!question.optional) {
    textarea.required = true;
  }

  textarea.value = limitCharacters(value, FINAL_COMMENT_CHARACTER_LIMIT);
  const labelText = question.optional
    ? `${questionText(question, language)}`
    : questionText(question, language);
  label.append(createElement("span", { text: labelText }));

  const helper = localize(question.helper, language);
  if (helper) {
    label.append(createElement("small", { className: "field-helper", text: helper }));
  }

  label.append(textarea);

  const counter = createElement("small", {
    className: "field-helper character-counter",
    text: t(language, "characterLimit", {
      current: countCharacters(textarea.value),
      limit: FINAL_COMMENT_CHARACTER_LIMIT,
    }),
  });
  textarea.addEventListener("input", () => {
    // we cut the text if it goes above the character limit
    const limitedValue = limitCharacters(textarea.value, FINAL_COMMENT_CHARACTER_LIMIT);

    if (textarea.value !== limitedValue) {
      textarea.value = limitedValue;
    }

    counter.textContent = t(language, "characterLimit", {
      current: countCharacters(textarea.value),
      limit: FINAL_COMMENT_CHARACTER_LIMIT,
    });
  });
  label.append(counter);

  return label;
}

// this function is for rendering the min and max labels under a scale
function renderScaleAnchors(question, language) {
  const min = localize(question.scale_labels?.min, language) || t(language, "stronglyDisagree");
  const max = localize(question.scale_labels?.max, language) || t(language, "stronglyAgree");

  return `<span class="scale-anchor-min">${min}</span><span class="scale-anchor-max">${max}</span>`;
}

// this function is for converting a choice answer into a number
function getChoiceAnswerValue(question, answer) {
  if (question.type !== "choice") {
    return null;
  }

  const index = question.options.indexOf(answer);
  return index >= 0 ? index + 1 : null;
}

// this function is for counting characters correctly
function countCharacters(value) {
  return Array.from(String(value)).length;
}

// this function is for cutting text at the character limit
function limitCharacters(value, limit) {
  return Array.from(String(value)).slice(0, limit).join("");
}

// this function is for keeping realism answers when language changes
function readRealismDraft(root) {
  const form = root.querySelector(".profile-form");

  if (!form) {
    return {};
  }

  return Object.fromEntries(new FormData(form).entries());
}

// this function is for choosing the css preview class for builder options
function getPreviewClass(questionId, option) {
  const classes = {
    preferred_lighting_intensity: {
      low: "preview-tile-low-light",
      medium: "preview-tile-medium-light",
      high: "preview-tile-high-light",
    },
    preferred_lighting_distribution: {
      uniform: "preview-tile-uniform-light",
      contrasted: "preview-tile-contrasted-light",
      punctual: "preview-tile-punctual-light",
    },
    preferred_vegetation_density: {
      low: "preview-tile-low-vegetation",
      medium: "preview-tile-medium-vegetation",
      high: "preview-tile-high-vegetation",
    },
    preferred_spatial_openness: {
      enclosed: "preview-tile-enclosed",
      balanced: "preview-tile-balanced-open",
      open: "preview-tile-open",
    },
    preferred_sidewalk_condition: {
      narrow_discontinuous: "preview-tile-narrow-sidewalk",
      ordinary: "preview-tile-ordinary-sidewalk",
    },
    preferred_obstacles: {
      none: "preview-tile-no-obstacles",
      few: "preview-tile-few-obstacles",
      many: "preview-tile-many-obstacles",
    },
    preferred_activity_indicators: {
      empty: "preview-tile-empty-activity",
      some_activity: "preview-tile-some-activity",
      active_frontage: "preview-tile-active-frontage",
    },
  };

  return classes[questionId]?.[option] || "preview-default";
}
