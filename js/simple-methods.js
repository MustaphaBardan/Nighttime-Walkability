import { CONFIG } from "./config.js";
import { getContextLanguage, localize, optionLabel, optionPreview, questionText, t } from "./i18n.js";
import { completeMethod, makeResponse, renderSurveyProgress } from "./survey-methods.js";
import { createElement, takeRandomSubset } from "./utils.js";

const FINAL_COMMENT_CHARACTER_LIMIT = 300;

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
    root.innerHTML = "";

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
    const panel = createElement("section", { className: "panel question-panel" });
    panel.append(
      createElement("p", { className: "question-text", text: questionText(question, language) }),
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
    );

    root.append(toolbar, panel);
  }

  renderCurrent();
}

export function renderIdealSceneBuilder(root, context, onComplete, onRerenderReady = () => {}) {
  const methodId = "ideal_scene_builder";
  const questions = context.questions.ideal_scene_builder;
  const responses = [];
  let currentIndex = 0;
  let startedAt = Date.now();
  let selectedAnswer = null;
  let selectedIndex = -1;

  function renderCurrent() {
    const language = getContextLanguage(context);
    onRerenderReady(renderCurrent);

    if (currentIndex >= questions.length) {
      completeMethod(root, context, methodId, responses, onComplete, onRerenderReady, () => {
        currentIndex -= 1;
        responses.pop();
        renderCurrent();
      });
      return;
    }

    const question = questions[currentIndex];
    startedAt = Date.now();
    selectedAnswer = null;
    selectedIndex = -1;
    root.innerHTML = "";

    const toolbar = renderQuestionToolbar(
      t(language, "builderTitle"),
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
      renderSurveyProgress(currentIndex + 1, questions.length, language),
      language,
    );
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
      createElement("p", { className: "question-text", text: questionText(question, language) }),
      renderPreviewChoiceGrid(question, language, (answer, index) => {
        selectedAnswer = answer;
        selectedIndex = index;
        continueButton.disabled = false;
      }),
      createElement("div", { className: "completion-actions", html: "" }),
    );
    panel.querySelector(".completion-actions").append(continueButton);

    root.append(toolbar, panel);
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
        answer_value: question.type === "scale" ? Number(value) : null,
      });
    });

    completeMethod(root, context, methodId, responses, onComplete, onRerenderReady);
  });

  panel.append(form);
  root.append(toolbar, panel);
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
      html: `<span>${t(language, "stronglyDisagree")}</span><span>${t(language, "stronglyAgree")}</span>`,
    }),
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
