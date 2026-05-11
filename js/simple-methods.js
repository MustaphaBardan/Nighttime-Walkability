import { CONFIG } from "./config.js";
import { getContextLanguage, optionLabel, optionPreview, questionText, t } from "./i18n.js";
import { completeMethod, makeResponse } from "./survey-methods.js";
import { createElement, takeRandomSubset } from "./utils.js";

export function renderBatchClassification(root, context, onComplete) {
  const language = getContextLanguage(context);
  const methodId = "batch_classification";
  const question = context.questions.batch_classification[0];
  const responses = [];
  let currentIndex = 0;
  let startedAt = Date.now();

  function renderCurrent() {
    if (currentIndex >= context.images.length) {
      completeMethod(root, context, methodId, responses, onComplete);
      return;
    }

    const image = context.images[currentIndex];
    startedAt = Date.now();
    root.innerHTML = "";

    const panel = createElement("section", { className: "panel question-panel" });
    panel.append(
      createElement("h2", { text: "Batch classification" }),
      createElement("p", { className: "question-text", text: questionText(question, language) }),
      renderBackButton(() => {
        if (currentIndex === 0) {
          onComplete(context);
          return;
        }

        currentIndex -= 1;
        responses.pop();
        renderCurrent();
      }, currentIndex === 0, language),
      renderSingleImage(image),
      renderChoiceRow(question.answers, language, (answer, index) => {
        responses.push(makeResponse(context, methodId, question, currentIndex + 1, startedAt, {
          image_id: image.image_id,
          answer,
          answer_value: index + 1,
        }));
        currentIndex += 1;
        renderCurrent();
      }),
      renderProgressText(currentIndex + 1, context.images.length, language),
    );

    root.append(panel);
  }

  renderCurrent();
}

export function renderDetailedRating(root, context, onComplete) {
  const language = getContextLanguage(context);
  const methodId = "detailed_rating";
  const questions = context.questions.detailed_rating;
  const images = takeRandomSubset(context.images, CONFIG.detailedRatingSceneCount);
  const responses = [];
  let imageIndex = 0;
  let questionIndex = 0;
  let displayOrder = 1;
  let startedAt = Date.now();

  function renderCurrent() {
    if (imageIndex >= images.length) {
      completeMethod(root, context, methodId, responses, onComplete);
      return;
    }

    const image = images[imageIndex];
    const question = questions[questionIndex];
    startedAt = Date.now();
    root.innerHTML = "";

    const panel = createElement("section", { className: "panel question-panel" });
    panel.append(
      createElement("h2", { text: t(language, "detailedTitle") }),
      createElement("p", { className: "question-text", text: questionText(question, language) }),
      renderBackButton(() => {
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
      }, displayOrder === 1, language),
      renderSingleImage(image),
      renderLikertRow(question, language, (value) => {
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
      }),
      renderProgressText(displayOrder, images.length * questions.length, language),
    );

    root.append(panel);
  }

  renderCurrent();
}

export function renderIdealSceneBuilder(root, context, onComplete) {
  const language = getContextLanguage(context);
  const methodId = "ideal_scene_builder";
  const questions = context.questions.ideal_scene_builder;
  const responses = [];
  let currentIndex = 0;
  let startedAt = Date.now();
  let selectedAnswer = null;
  let selectedIndex = -1;

  function renderCurrent() {
    if (currentIndex >= questions.length) {
      completeMethod(root, context, methodId, responses, onComplete);
      return;
    }

    const question = questions[currentIndex];
    startedAt = Date.now();
    selectedAnswer = null;
    selectedIndex = -1;
    root.innerHTML = "";

    const panel = createElement("section", { className: "panel question-panel" });
    const continueButton = createElement("button", {
      className: "primary-button",
      text: t(language, "validateContinue"),
      attrs: { type: "button", disabled: "disabled" },
    });

    continueButton.addEventListener("click", () => {
      if (!selectedAnswer) {
        return;
      }

      responses.push(makeResponse(context, methodId, question, currentIndex + 1, startedAt, {
        answer: selectedAnswer,
        answer_value: selectedIndex + 1,
      }));
      currentIndex += 1;
      renderCurrent();
    });

    panel.append(
      createElement("h2", { text: t(language, "builderTitle") }),
      createElement("p", { className: "question-text", text: questionText(question, language) }),
      renderBackButton(() => {
        if (currentIndex === 0) {
          onComplete(context);
          return;
        }

        currentIndex -= 1;
        responses.pop();
        renderCurrent();
      }, currentIndex === 0, language),
      renderPreviewChoiceGrid(question, language, (answer, index) => {
        selectedAnswer = answer;
        selectedIndex = index;
        continueButton.disabled = false;
      }),
      createElement("div", { className: "completion-actions", html: "" }),
      renderProgressText(currentIndex + 1, questions.length, language),
    );
    panel.querySelector(".completion-actions").append(continueButton);

    root.append(panel);
  }

  renderCurrent();
}

export function renderRealismCheck(root, context, onComplete) {
  const language = getContextLanguage(context);
  const methodId = "realism_check";
  const questions = context.questions.realism_check;
  const startedAt = Date.now();
  root.innerHTML = "";

  const panel = createElement("section", { className: "panel form-panel" });
  const form = createElement("form", { className: "profile-form" });

  form.append(
    createElement("p", { className: "step-label", text: t(language, "finalSection") }),
    createElement("h2", { text: t(language, "realismTitle") }),
    createElement("p", { text: t(language, "realismIntro") }),
  );

  questions.forEach((question, index) => {
    if (question.type === "textarea") {
      form.append(renderTextArea(question, language));
      return;
    }

    form.append(renderScaleField(question, index + 1, language));
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
      const value = String(formData.get(question.question_id) || "").trim();
      return makeResponse(context, methodId, question, index + 1, startedAt, {
        answer: value,
        answer_value: question.type === "scale" ? Number(value) : null,
      });
    });

    completeMethod(root, context, methodId, responses, onComplete);
  });

  panel.append(form);
  root.append(panel);
}

function renderBackButton(onBack, disabled = false, language = "en") {
  const actions = createElement("div", { className: "page-actions" });
  const back = createElement("button", {
    className: "secondary-button",
    text: t(language, "back"),
    attrs: disabled ? { type: "button", disabled: "disabled" } : { type: "button" },
  });
  if (!disabled) {
    back.addEventListener("click", onBack);
  }
  actions.append(back);
  return actions;
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

function renderSingleImage(image) {
  const wrapper = createElement("article", { className: "scene-option single-scene" });
  const frame = createElement("div", { className: "scene-frame" });
  const img = createElement("img", {
    attrs: {
      src: image.path,
      alt: "Survey scene",
      loading: "eager",
    },
  });

  frame.append(img);
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
      html: `<span>${t(language, "stronglyDisagree")}</span><span>${t(language, "stronglyAgree")}</span>`,
    }),
  );

  return wrapper;
}

function renderScaleField(question, order, language) {
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

    label.append(input, createElement("span", { text: String(value) }));
    row.append(label);
  }

  fieldset.append(
    legend,
    createElement("p", { className: "step-label", text: t(language, "questionNumber", { number: order }) }),
    row,
    createElement("div", {
      className: "scale-anchors",
      html: `<span>${t(language, "stronglyDisagree")}</span><span>${t(language, "stronglyAgree")}</span>`,
    }),
  );

  return fieldset;
}

function renderTextArea(question, language) {
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

  label.append(createElement("span", { text: questionText(question, language) }), textarea);
  return label;
}

function renderProgressText(current, total, language = "en") {
  return createElement("div", {
    className: "status-strip participant-status",
    text: t(language, "ofTotal", { current: Math.min(current, total), total }),
  });
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
