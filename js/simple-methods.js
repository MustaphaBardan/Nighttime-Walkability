import { CONFIG } from "./config.js";
import { getContextLanguage, localize, optionLabel, optionPreview, questionText, t } from "./i18n.js";
import { markMethodCompleted, saveLocalBackup } from "./storage.js";
import { TOTAL_SURVEY_STEPS, completeMethod, makeResponse, renderSurveyProgress } from "./survey-methods.js";
import { createElement, takeRandomSubset } from "./utils.js";
import { renderSceneMedia } from "./panorama-viewer.js";

const FINAL_COMMENT_CHARACTER_LIMIT = 300;

export function renderTrainingScene(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "training_scene";
  const question = context.questions.training_scene?.[0] || {
    question_id: "training_360_scene_viewed",
    text: { en: "Rotate the 360 degree scene before continuing.", fr: "Faites pivoter la scène à 360 degrés avant de continuer." },
  };
  const image = context.images.find((item) => item.view_type === "panorama_360") || context.images[0];
  let startedAt = Date.now();

  function renderCurrent() {
    const language = getContextLanguage(context);
    onRerenderReady(renderCurrent);
    startedAt = Date.now();
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
    const continueButton = createElement("button", {
      className: "primary-button",
      text: t(language, "continue"),
      attrs: { type: "button" },
    });

    continueButton.addEventListener("click", () => {
      saveLocalBackup(makeResponse(context, methodId, question, 1, startedAt, {
        image_id: image.image_id,
        answer: "viewed",
        answer_value: 1,
      }));
      markMethodCompleted(methodId);
      onComplete(context);
    });

    actions.append(continueButton);
    panel.append(
      createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 3, total: TOTAL_SURVEY_STEPS }) }),
      createElement("p", { className: "question-text", text: questionText(question, language) }),
      renderSingleImage(image, language, { fullViewport: true }),
      actions,
    );
    root.append(toolbar, panel);
  }

  renderCurrent();
}

export function renderBatchClassification(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "batch_classification";
  const question = context.questions.batch_classification[0];
  const responses = [];
  let currentIndex = 0;
  let startedAt = Date.now();

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

export function renderDetailedRating(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "detailed_rating";
  const questions = context.questions.detailed_rating;
  const images = takeRandomSubset(context.images, CONFIG.detailedRatingSceneCount);
  const responses = [];
  let imageIndex = 0;
  let questionIndex = 0;
  let displayOrder = 1;
  let startedAt = Date.now();
  root.innerHTML = "";

  const toolbarSlot = createElement("div");
  const panel = createElement("section", { className: "panel question-panel detailed-rating-panel" });
  const questionTextElement = createElement("p", { className: "question-text" });
  const shell = createElement("section", { className: "detailed-rating-shell" });
  const mediaSlot = createElement("div", { className: "detailed-rating-media" });
  const exitFullscreenButton = createElement("button", {
    className: "fullscreen-exit-button",
    text: "Exit full screen",
    attrs: { type: "button" },
  });
  const overlay = createElement("div", { className: "detailed-rating-overlay" });
  const overlayProgress = createElement("p", { className: "step-label" });
  const overlayQuestion = createElement("p", { className: "detailed-overlay-question" });
  const overlayAnswers = createElement("div", { className: "detailed-overlay-answers" });
  const normalAnswers = createElement("div", { className: "detailed-normal-answers" });

  overlay.append(overlayProgress, overlayQuestion, overlayAnswers);
  shell.append(mediaSlot, exitFullscreenButton, overlay);
  panel.append(questionTextElement, shell, normalAnswers);
  root.append(toolbarSlot, panel);
  exitFullscreenButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.exitFullscreen?.();
  });

  function renderCurrent() {
    const language = getContextLanguage(context);
    onRerenderReady(renderCurrent);

    if (imageIndex >= images.length) {
      completeMethod(root, context, methodId, responses, onComplete, onRerenderReady, () => {
        responses.pop();
        displayOrder -= 1;
        questionIndex -= 1;

        if (questionIndex < 0) {
          imageIndex -= 1;
          questionIndex = questions.length - 1;
        }

        renderCurrent();
      });
      return;
    }

    const image = images[imageIndex];
    const question = questions[questionIndex];
    startedAt = Date.now();

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

        if (questionIndex < 0) {
          imageIndex -= 1;
          questionIndex = questions.length - 1;
        }

        renderCurrent();
      },
      displayOrder === 1,
      renderSurveyProgress(displayOrder, images.length * questions.length, language),
      language,
    );
    toolbarSlot.replaceChildren(toolbar);
    questionTextElement.textContent = questionText(question, language);
    overlayProgress.textContent = `${t(language, "progress")} ${displayOrder} / ${images.length * questions.length}`;
    overlayQuestion.textContent = questionText(question, language);
    mediaSlot.replaceChildren(renderSingleImage(image, language, {
      onFullscreenRequest: () => shell.requestFullscreen?.(),
    }));
    normalAnswers.replaceChildren(renderLikertRow(question, language, submitAnswer));
    overlayAnswers.replaceChildren(renderLikertRow(question, language, submitAnswer));
  }

  function submitAnswer(value) {
    const image = images[imageIndex];
    const question = questions[questionIndex];
    responses.push(makeResponse(context, methodId, question, displayOrder, startedAt, {
      image_id: image.image_id,
      answer: String(value),
      answer_value: value,
    }));

    displayOrder += 1;
    questionIndex += 1;

    if (questionIndex >= questions.length) {
      questionIndex = 0;
      imageIndex += 1;
    }

    renderCurrent();
  }

  renderCurrent();
}

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
  const overlayControls = createElement("div", { className: "ideal-builder-overlay-controls" });
  const exitFullscreenButton = createElement("button", {
    className: "fullscreen-exit-button",
    text: "Exit full screen",
    attrs: { type: "button" },
  });
  const parametersToggle = createElement("button", {
    className: "parameters-toggle-button",
    text: "Parameters",
    attrs: { type: "button", "aria-expanded": "true" },
  });
  const continueButton = createElement("button", {
    className: "primary-button",
    text: t(getContextLanguage(context), "validateContinue"),
    attrs: { type: "button", disabled: "disabled" },
  });

  preview.append(mediaSlot, exitFullscreenButton, parametersToggle, overlay);
  overlay.append(overlayControls);
  panel.append(preview, controls, createElement("div", { className: "completion-actions", html: "" }));
  panel.querySelector(".completion-actions").append(continueButton);
  root.append(toolbarSlot, panel);

  continueButton.addEventListener("click", () => {
    if (!allBuilderQuestionsAnswered()) {
      return;
    }

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
  });
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

  function renderCurrent() {
    const language = getContextLanguage(context);
    onRerenderReady(renderCurrent);

    const toolbar = renderQuestionToolbar(
      t(language, "builderTitle"),
      null,
      () => onComplete(context),
      true,
      renderSurveyProgress(countSelectedQuestions(), questions.length, language),
      language,
    );
    toolbarSlot.replaceChildren(toolbar);
    continueButton.textContent = t(language, "validateContinue");
    continueButton.disabled = !allBuilderQuestionsAnswered();
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
        selections[question.question_id] = answer;
        currentPreview = resolveIdealSceneVariant(variantConfig, selections);
        renderCurrent();
      };
      controls.append(renderBuilderParameterControl(question, language, selections[question.question_id], onSelect));
      overlayControls.append(renderBuilderParameterControl(question, language, selections[question.question_id], onSelect));
    });
    updateParametersCollapsedState();
  }

  function countSelectedQuestions() {
    return questions.filter((question) => Boolean(selections[question.question_id])).length;
  }

  function allBuilderQuestionsAnswered() {
    return countSelectedQuestions() === questions.length;
  }

  function updateParametersCollapsedState() {
    preview.classList.toggle("parameters-collapsed", parametersCollapsed);
    parametersToggle.setAttribute("aria-expanded", String(!parametersCollapsed));
  }

  renderCurrent();
}

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

function renderBuilderParameterControl(question, language, selectedAnswer, onSelect) {
  const fieldset = createElement("fieldset", { className: "builder-parameter" });
  const legend = createElement("legend", { text: questionText(question, language) });
  const options = createElement("div", { className: "builder-parameter-options" });

  question.options.forEach((option) => {
    const button = createElement("button", {
      className: option === selectedAnswer ? "builder-option selected" : "builder-option",
      text: optionLabel(option, language),
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

function resolveIdealSceneVariant(config = {}, selections = {}) {
  const variants = config.variants || [];
  const matchingVariant = variants
    .filter((variant) => variantMatchesSelections(variant, selections))
    .sort((first, second) => Object.keys(second.conditions || {}).length - Object.keys(first.conditions || {}).length)[0];

  return buildIdealPreviewImage(matchingVariant || config.default, "ideal_scene_default");
}

function variantMatchesSelections(variant, selections) {
  const conditions = variant.conditions || {};
  const entries = Object.entries(conditions);

  if (!entries.length) {
    return false;
  }

  return entries.every(([questionId, answer]) => selections[questionId] === answer);
}

function buildIdealPreviewImage(variant = {}, fallbackId = "ideal_scene_preview") {
  return {
    image_id: variant.variant_id || fallbackId,
    variant_id: variant.variant_id || fallbackId,
    path: variant.path || "assets/images/Test_image_panoramic.png",
    view_type: variant.view_type || "panorama_360",
    initial_yaw_degrees: variant.initial_yaw_degrees ?? 90,
    description: localize(variant.description, "en") || "Ideal scene preview.",
  };
}

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
      createElement("strong", { text: optionLabel(option, language) }),
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

function renderSingleImage(image, language = "en", options = {}) {
  const wrapper = createElement("article", { className: "scene-option single-scene" });
  const frame = renderSceneMedia(image, {
    alt: `${t(language, "surveyScene")} ${image.image_id || ""}`.trim(),
    ...options,
  });

  if (options.fullViewport) {
    wrapper.classList.add("training-scene-option");
  }

  wrapper.append(frame);
  return wrapper;
}

function renderChoiceRow(options, language, onSelect) {
  const row = createElement("div", { className: "answer-row" });
  options.forEach((option, index) => {
    const button = createElement("button", {
      className: "choice-button",
      text: optionLabel(option, language),
      attrs: { type: "button" },
    });
    button.addEventListener("click", () => onSelect(option, index));
    row.append(button);
  });
  return row;
}

function renderLikertRow(question, language, onSelect) {
  const scale = question.scale || 5;
  const wrapper = createElement("div", { className: "scale-block" });
  const row = createElement("div", { className: "answer-row likert-row" });

  for (let value = 1; value <= scale; value += 1) {
    const button = createElement("button", {
      className: "choice-button likert-button",
      text: String(value),
      attrs: { type: "button" },
    });
    button.addEventListener("click", () => onSelect(value));
    row.append(button);
  }

  wrapper.append(
    row,
    createElement("div", {
      className: "scale-anchors",
      html: renderScaleAnchors(question, language),
    }),
  );

  return wrapper;
}

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

    label.append(input, createElement("span", { text: optionLabel(option, language) }));
    row.append(label);
  });

  fieldset.append(
    legend,
    createElement("p", { className: "step-label", text: t(language, "questionNumber", { number: order }) }),
    row,
  );

  return fieldset;
}

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
  label.append(createElement("span", { text: questionText(question, language) }));

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

function renderScaleAnchors(question, language) {
  const min = localize(question.scale_labels?.min, language) || t(language, "stronglyDisagree");
  const max = localize(question.scale_labels?.max, language) || t(language, "stronglyAgree");

  return `<span>${min}</span><span>${max}</span>`;
}

function getChoiceAnswerValue(question, answer) {
  if (question.type !== "choice") {
    return null;
  }

  const index = question.options.indexOf(answer);
  return index >= 0 ? index + 1 : null;
}

function countCharacters(value) {
  return Array.from(String(value)).length;
}

function limitCharacters(value, limit) {
  return Array.from(String(value)).slice(0, limit).join("");
}

function readRealismDraft(root) {
  const form = root.querySelector(".profile-form");

  if (!form) {
    return {};
  }

  return Object.fromEntries(new FormData(form).entries());
}

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
      wide_continuous: "preview-tile-wide-sidewalk",
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
