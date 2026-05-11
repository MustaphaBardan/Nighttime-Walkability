import { CONFIG } from "./config.js";
import {
  getOrCreateSession,
  getProgress,
  hydrateSessionFromProgress,
  isMethodCompleted,
  updateSessionProfile,
} from "./storage.js";
import {
  METHOD_DEFINITIONS,
  TOTAL_SURVEY_STEPS,
  allMethodsCompleted,
  getAllMethodIds,
  removeMethodAnswers,
} from "./survey-methods.js";
import {
  renderDetailedRating,
  renderIdealSceneBuilder,
  renderRealismCheck,
} from "./simple-methods.js";
import { byId, createElement } from "./utils.js";
import { renderPairwiseComparison } from "./pairwise-comparison.js";

const app = byId("app");
const session = getOrCreateSession();
hydrateSessionFromProgress(session);

byId("session-chip").textContent = "Anonymous session";
byId("protocol-version").textContent = CONFIG.protocolLabel;
initThemeToggle();

async function init() {
  try {
    const [images, questions] = await Promise.all([
      fetchJson("data/images.json"),
      fetchJson("data/questions.json"),
    ]);

    window.surveyContext = {
      session,
      images,
      questions,
    };

    renderWelcome(window.surveyContext);
  } catch (error) {
    app.innerHTML = "";
    app.append(
      createElement("section", {
        className: "panel error-panel",
        html: `<h2>Could not load survey data</h2><p>${error.message}</p>`,
      }),
    );
  }
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

function renderWelcome(context) {
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel welcome-panel" });
  panel.append(
    createElement("p", { className: "step-label", text: `Step 1 of ${TOTAL_SURVEY_STEPS}` }),
    createElement("h2", { text: "Welcome" }),
    createElement("p", {
      text:
        "This survey studies how people perceive simulated night-time urban scenes. You will answer short questions about safety, comfort, visibility, and route preference.",
    }),
    createElement("p", {
      text:
        "The survey follows one fixed path: scene comparisons, detailed scene ratings, an ideal-scene builder, and a short realism check.",
    }),
  );

  const actions = createElement("div", { className: "completion-actions" });
  const start = createElement("button", {
    className: "primary-button",
    text: "Start survey",
    attrs: { type: "button" },
  });

  start.addEventListener("click", () => routeAfterWelcome(context));
  actions.append(start);
  panel.append(actions);
  app.append(panel);
}

function routeAfterWelcome(context) {
  const progress = getProgress();

  if (!progress.profile_completed) {
    renderProfile(context);
    return;
  }

  if (allMethodsCompleted()) {
    renderCompletedPrompt(context);
    return;
  }

  routeToNextProtocolStep(context);
}

function renderCompletedPrompt(context) {
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  const actions = createElement("div", { className: "completion-actions" });
  const back = createElement("button", {
    className: "secondary-button",
    text: "Keep my existing response",
    attrs: { type: "button" },
  });
  const redo = createElement("button", {
    className: "primary-button",
    text: "Redo and replace my answers",
    attrs: { type: "button" },
  });

  back.addEventListener("click", () => renderFinalThanks());
  redo.addEventListener("click", () => {
    getAllMethodIds().forEach((methodId) => removeMethodAnswers(methodId));
    routeToNextProtocolStep(context);
  });

  actions.append(back, redo);
  panel.append(
    createElement("h2", { text: "You already completed this survey" }),
    createElement("p", {
      text: "This browser already has a completed response for the current protocol version. If you redo the survey, your saved answers for this browser will be replaced.",
    }),
    actions,
  );
  app.append(panel);
}

function routeToNextProtocolStep(context) {
  const progress = getProgress();

  if (!progress.profile_completed) {
    renderProfile(context);
    return;
  }

  const nextMethod = METHOD_DEFINITIONS.find((method) => !isMethodCompleted(method.id));

  if (!nextMethod) {
    renderFinalThanks();
    return;
  }

  startMethod(context, nextMethod.id);
}

function renderProfile(context) {
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel form-panel" });
  const form = createElement("form", { className: "profile-form" });

  form.append(
    createElement("p", { className: "step-label", text: `Step 2 of ${TOTAL_SURVEY_STEPS}` }),
    createElement("h2", { text: "General information" }),
    createElement("p", {
      text: "These questions are anonymous and help interpret the survey results.",
    }),
    renderSelect("age_range", "Age range", [
      ["", "Select an option"],
      ["under_18", "Under 18"],
      ["18_24", "18-24"],
      ["25_34", "25-34"],
      ["35_44", "35-44"],
      ["45_54", "45-54"],
      ["55_64", "55-64"],
      ["65_plus", "65+"],
      ["prefer_not_to_say", "Prefer not to say"],
    ]),
    renderSelect("gender", "Gender", [
      ["", "Select an option"],
      ["woman", "Woman"],
      ["man", "Man"],
      ["non_binary", "Non-binary"],
      ["self_describe", "Prefer to self-describe"],
      ["prefer_not_to_say", "Prefer not to say"],
    ]),
    renderSelect("night_walk_frequency", "How often do you walk at night?", [
      ["", "Select an option"],
      ["rarely", "Rarely"],
      ["sometimes", "Sometimes"],
      ["weekly", "Weekly"],
      ["almost_daily", "Almost daily"],
      ["prefer_not_to_say", "Prefer not to say"],
    ]),
    renderSelect("place_familiarity", "Are you familiar with Nantes or similar urban environments?", [
      ["", "Select an option"],
      ["not_familiar", "Not familiar"],
      ["somewhat_familiar", "Somewhat familiar"],
      ["familiar", "Familiar"],
      ["very_familiar", "Very familiar"],
      ["prefer_not_to_say", "Prefer not to say"],
    ]),
    renderSelect("night_walking_comfort", "In general, how comfortable do you feel walking alone at night?", [
      ["", "Select an option"],
      ["very_uncomfortable", "Very uncomfortable"],
      ["uncomfortable", "Uncomfortable"],
      ["neutral", "Neutral"],
      ["comfortable", "Comfortable"],
      ["very_comfortable", "Very comfortable"],
      ["prefer_not_to_say", "Prefer not to say"],
    ]),
    renderSelect("vision_or_display_issue", "Did anything about your vision or screen make image judgment difficult?", [
      ["", "No issue to report"],
      ["minor_issue", "A minor difficulty"],
      ["significant_issue", "A significant difficulty"],
      ["prefer_not_to_say", "Prefer not to say"],
    ], false),
  );

  const actions = createElement("div", { className: "completion-actions" });
  const back = createElement("button", {
    className: "secondary-button",
    text: "Back",
    attrs: { type: "button" },
  });
  const next = createElement("button", {
    className: "primary-button",
    text: "Continue",
    attrs: { type: "submit" },
  });

  back.addEventListener("click", () => renderWelcome(context));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    updateSessionProfile(context.session, {
      age_range: formData.get("age_range"),
      gender: formData.get("gender"),
      night_walk_frequency: formData.get("night_walk_frequency"),
      place_familiarity: formData.get("place_familiarity"),
      night_walking_comfort: formData.get("night_walking_comfort"),
      vision_or_display_issue: formData.get("vision_or_display_issue"),
    });

    routeToNextProtocolStep(context);
  });

  actions.append(back, next);
  form.append(actions);
  panel.append(form);
  app.append(panel);
}

function renderSelect(name, label, options, required = true) {
  const field = createElement("label", { className: "form-field" });
  const attrs = { name };

  if (required) {
    attrs.required = "required";
  }

  const select = createElement("select", {
    attrs,
  });

  options.forEach(([value, text], index) => {
    const option = createElement("option", { text, attrs: { value } });

    if (index === 0) {
      option.disabled = true;
      option.selected = true;
    }

    if (index === 0 && !required) {
      option.disabled = false;
    }

    select.append(option);
  });

  field.append(createElement("span", { text: label }), select);
  return field;
}

function startMethod(context, methodId) {
  if (methodId === "pairwise_comparison") {
    renderPairwiseComparison(app, context, routeToNextProtocolStep);
    return;
  }

  if (methodId === "detailed_rating") {
    renderDetailedRating(app, context, routeToNextProtocolStep);
    return;
  }

  if (methodId === "ideal_scene_builder") {
    renderIdealSceneBuilder(app, context, routeToNextProtocolStep);
    return;
  }

  if (methodId === "realism_check") {
    renderRealismCheck(app, context, routeToNextProtocolStep);
  }
}

function renderFinalThanks() {
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  panel.append(
    createElement("h2", { text: "Thank you for your time" }),
    createElement("p", {
      text: "Your participation in this proposed-methodology version is complete. Your answers have been recorded for the research team.",
    }),
    createElement("p", { className: "status-strip", text: CONFIG.protocolLabel }),
  );
  app.append(panel);
}

init();

function initThemeToggle() {
  const button = byId("theme-toggle");
  const savedTheme = localStorage.getItem(CONFIG.themeStorageKey);
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const initialTheme = savedTheme || (prefersLight ? "light" : "dark");

  setTheme(initialTheme, button);
  button.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme, button);
  });
}

function setTheme(theme, button) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(CONFIG.themeStorageKey, theme);
  button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  button.setAttribute("aria-pressed", String(theme === "dark"));
}
