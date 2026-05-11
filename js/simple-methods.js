import { CONFIG } from "./config.js";
import { completeMethod, makeResponse } from "./survey-methods.js";
import { createElement, takeRandomSubset } from "./utils.js";

export function renderBatchClassification(root, context, onComplete) {
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
      createElement("p", { className: "question-text", text: question.text }),
      renderBackButton(() => {
        if (currentIndex === 0) {
          onComplete(context);
          return;
        }

        currentIndex -= 1;
        responses.pop();
        renderCurrent();
      }, currentIndex === 0),
      renderSingleImage(image),
      renderChoiceRow(question.answers, (answer, index) => {
        responses.push(makeResponse(context, methodId, question, currentIndex + 1, startedAt, {
          image_id: image.image_id,
          answer,
          answer_value: index + 1,
        }));
        currentIndex += 1;
        renderCurrent();
      }),
      renderProgressText(currentIndex + 1, context.images.length),
    );

    root.append(panel);
  }

  renderCurrent();
}

export function renderDetailedRating(root, context, onComplete) {
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
      createElement("h2", { text: "Detailed scene rating" }),
      createElement("p", { className: "question-text", text: question.text }),
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
      }, displayOrder === 1),
      renderSingleImage(image),
      renderLikertRow(question, (value) => {
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
      renderProgressText(displayOrder, images.length * questions.length),
    );

    root.append(panel);
  }

  renderCurrent();
}

export function renderIdealSceneBuilder(root, context, onComplete) {
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
      text: "Validate and continue",
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
      createElement("h2", { text: "Ideal scene builder" }),
      createElement("p", { className: "question-text", text: question.text }),
      renderBackButton(() => {
        if (currentIndex === 0) {
          onComplete(context);
          return;
        }

        currentIndex -= 1;
        responses.pop();
        renderCurrent();
      }, currentIndex === 0),
      renderPreviewChoiceGrid(question, (answer, index) => {
        selectedAnswer = answer;
        selectedIndex = index;
        continueButton.disabled = false;
      }),
      createElement("div", { className: "completion-actions", html: "" }),
      renderProgressText(currentIndex + 1, questions.length),
    );
    panel.querySelector(".completion-actions").append(continueButton);

    root.append(panel);
  }

  renderCurrent();
}

export function renderRealismCheck(root, context, onComplete) {
  const methodId = "realism_check";
  const questions = context.questions.realism_check;
  const startedAt = Date.now();
  root.innerHTML = "";

  const panel = createElement("section", { className: "panel form-panel" });
  const form = createElement("form", { className: "profile-form" });

  form.append(
    createElement("p", { className: "step-label", text: "Final section" }),
    createElement("h2", { text: "Realism check" }),
    createElement("p", {
      text: "These last questions help interpret whether the simulated images were clear enough to judge.",
    }),
  );

  questions.forEach((question, index) => {
    if (question.type === "textarea") {
      form.append(renderTextArea(question));
      return;
    }

    form.append(renderScaleField(question, index + 1));
  });

  const actions = createElement("div", { className: "completion-actions" });
  const submit = createElement("button", {
    className: "primary-button",
    text: "Finish survey",
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

function renderBackButton(onBack, disabled = false) {
  const actions = createElement("div", { className: "page-actions" });
  const back = createElement("button", {
    className: "secondary-button",
    text: "Back",
    attrs: disabled ? { type: "button", disabled: "disabled" } : { type: "button" },
  });
  if (!disabled) {
    back.addEventListener("click", onBack);
  }
  actions.append(back);
  return actions;
}

function renderPreviewChoiceGrid(question, onSelect) {
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
      createElement("strong", { text: formatChoice(option) }),
      createElement("span", { text: getOptionPreview(question.question_id, option) }),
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

function renderChoiceRow(options, onSelect) {
  const row = createElement("div", { className: "answer-row" });
  options.forEach((option, index) => {
    const button = createElement("button", {
      className: "choice-button",
      text: formatChoice(option),
      attrs: { type: "button" },
    });
    button.addEventListener("click", () => onSelect(option, index));
    row.append(button);
  });
  return row;
}

function renderLikertRow(question, onSelect) {
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
      html: "<span>Strongly disagree</span><span>Strongly agree</span>",
    }),
  );

  return wrapper;
}

function renderScaleField(question, order) {
  const fieldset = createElement("fieldset", { className: "scale-field" });
  const legend = createElement("legend", { text: question.text });
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
    createElement("p", { className: "step-label", text: `Question ${order}` }),
    row,
    createElement("div", {
      className: "scale-anchors",
      html: "<span>Strongly disagree</span><span>Strongly agree</span>",
    }),
  );

  return fieldset;
}

function renderTextArea(question) {
  const label = createElement("label", { className: "form-field" });
  const textarea = createElement("textarea", {
    attrs: {
      name: question.question_id,
      rows: "4",
      placeholder: "Optional comment",
    },
  });

  if (!question.optional) {
    textarea.required = true;
  }

  label.append(createElement("span", { text: question.text }), textarea);
  return label;
}

function renderProgressText(current, total) {
  return createElement("div", {
    className: "status-strip participant-status",
    text: `${Math.min(current, total)} of ${total}`,
  });
}

function formatChoice(value) {
  return String(value).replaceAll("_", " ");
}

function getOptionPreview(questionId, option) {
  const previews = {
    preferred_lighting_intensity: {
      low: "Soft lighting with some shadows, keeping the scene subdued while preserving basic visibility.",
      medium: "Balanced lighting where the walking path is readable without feeling over-lit.",
      high: "Bright lighting that makes the path and surroundings easier to see.",
    },
    preferred_lighting_distribution: {
      uniform: "Even lighting across the walking path and its edges.",
      contrasted: "Visible differences between lit areas and darker areas.",
      punctual: "Localized light sources that create pools of light along the route.",
    },
    preferred_vegetation_density: {
      low: "Few trees or planted edges, with fewer hidden areas.",
      medium: "Some vegetation while keeping the route readable.",
      high: "Dense vegetation and a stronger night-time atmosphere.",
    },
    preferred_spatial_openness: {
      enclosed: "A corridor-like route with strong edges and limited long-distance visibility.",
      balanced: "A mix of enclosure and openness, with a defined path and some wider views.",
      open: "A broad, open route with long views and fewer enclosing edges.",
    },
    preferred_sidewalk_condition: {
      narrow_discontinuous: "A narrower or interrupted walking surface.",
      ordinary: "A standard continuous walking surface.",
      wide_continuous: "A wider continuous route with more room to walk.",
    },
    preferred_obstacles: {
      none: "No visible obstacles on or near the walking path.",
      few: "A small number of elements to notice while walking.",
      many: "Several objects or risky areas that may need attention.",
    },
    preferred_activity_indicators: {
      empty: "No visible signs of activity.",
      some_activity: "Some lit windows, signs, or traces of nearby activity.",
      active_frontage: "Visible active frontage such as shops, windows, or entrances.",
    },
  };

  return previews[questionId]?.[option] || "This option will be saved as your preferred scene characteristic.";
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
