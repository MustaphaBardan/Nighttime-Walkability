import { CONFIG } from "./config.js";
import {
  getOrCreateSession,
  getProgress,
  hydrateSessionFromProgress,
  isMethodCompleted,
  updateSessionLanguage,
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
import { getContextLanguage, t } from "./i18n.js";
import { byId, createElement } from "./utils.js";
import { renderPairwiseComparison } from "./pairwise-comparison.js";

const app = byId("app");
const session = getOrCreateSession();
hydrateSessionFromProgress(session);

initThemeToggle();
applyLanguage(session.language);

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
        html: `<h2>${t(session.language, "couldNotLoad")}</h2><p>${error.message}</p>`,
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
  const language = getContextLanguage(context);
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel welcome-panel" });
  panel.append(
    createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 1, total: TOTAL_SURVEY_STEPS }) }),
    createElement("h2", { text: t(language, "welcome") }),
    createElement("p", { text: t(language, "welcomeIntro") }),
    createElement("p", { text: t(language, "welcomePath") }),
    renderLanguageSelector(context),
  );

  const actions = createElement("div", { className: "completion-actions" });
  const start = createElement("button", {
    className: "primary-button",
    text: t(language, "startSurvey"),
    attrs: { type: "button" },
  });

  start.addEventListener("click", () => routeAfterWelcome(context));
  actions.append(start);
  panel.append(actions);
  app.append(panel);
}

function renderLanguageSelector(context) {
  const language = getContextLanguage(context);
  const wrapper = createElement("div", { className: "language-selector" });
  const label = createElement("p", { className: "language-label", text: t(language, "languageLabel") });
  const controls = createElement("div", { className: "language-options" });

  [
    ["en", t(language, "english")],
    ["fr", t(language, "french")],
  ].forEach(([value, text]) => {
    const button = createElement("button", {
      className: value === language ? "language-option selected" : "language-option",
      text,
      attrs: {
        type: "button",
        "aria-pressed": String(value === language),
      },
    });

    button.addEventListener("click", () => {
      updateSessionLanguage(context.session, value);
      applyLanguage(value);
      renderWelcome(context);
    });

    controls.append(button);
  });

  wrapper.append(label, controls);
  return wrapper;
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
  const language = getContextLanguage(context);
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  const actions = createElement("div", { className: "completion-actions" });
  const back = createElement("button", {
    className: "secondary-button",
    text: t(language, "keepExistingResponse"),
    attrs: { type: "button" },
  });
  const redo = createElement("button", {
    className: "primary-button",
    text: t(language, "redoReplaceAnswers"),
    attrs: { type: "button" },
  });

  back.addEventListener("click", () => renderFinalThanks());
  redo.addEventListener("click", () => {
    getAllMethodIds().forEach((methodId) => removeMethodAnswers(methodId));
    routeToNextProtocolStep(context);
  });

  actions.append(back, redo);
  panel.append(
    createElement("h2", { text: t(language, "alreadyCompleted") }),
    createElement("p", { text: t(language, "alreadyCompletedBody") }),
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
  const language = getContextLanguage(context);
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel form-panel" });
  const form = createElement("form", { className: "profile-form" });

  form.append(
    createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 2, total: TOTAL_SURVEY_STEPS }) }),
    createElement("h2", { text: t(language, "generalInformation") }),
    createElement("p", { text: t(language, "profileIntro") }),
    renderSelect("age_range", t(language, "ageRange"), [
      ["", t(language, "selectOption")],
      ["under_18", t(language, "under18")],
      ["18_24", "18-24"],
      ["25_34", "25-34"],
      ["35_44", "35-44"],
      ["45_54", "45-54"],
      ["55_64", "55-64"],
      ["65_plus", "65+"],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ]),
    renderSelect("gender", t(language, "gender"), [
      ["", t(language, "selectOption")],
      ["woman", t(language, "woman")],
      ["man", t(language, "man")],
      ["non_binary", t(language, "nonBinary")],
      ["self_describe", t(language, "selfDescribe")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ]),
    renderSelect("night_walk_frequency", t(language, "nightWalkFrequency"), [
      ["", t(language, "selectOption")],
      ["rarely", t(language, "rarely")],
      ["sometimes", t(language, "sometimes")],
      ["weekly", t(language, "weekly")],
      ["almost_daily", t(language, "almostDaily")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ]),
    renderSelect("place_familiarity", t(language, "placeFamiliarity"), [
      ["", t(language, "selectOption")],
      ["not_familiar", t(language, "notFamiliar")],
      ["somewhat_familiar", t(language, "somewhatFamiliar")],
      ["familiar", t(language, "familiar")],
      ["very_familiar", t(language, "veryFamiliar")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ]),
    renderSelect("night_walking_comfort", t(language, "nightWalkingComfort"), [
      ["", t(language, "selectOption")],
      ["very_uncomfortable", t(language, "veryUncomfortable")],
      ["uncomfortable", t(language, "uncomfortable")],
      ["neutral", t(language, "neutral")],
      ["comfortable", t(language, "comfortable")],
      ["very_comfortable", t(language, "veryComfortable")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ]),
    renderSelect("vision_or_display_issue", t(language, "visionOrDisplayIssue"), [
      ["", t(language, "noIssue")],
      ["minor_issue", t(language, "minorIssue")],
      ["significant_issue", t(language, "significantIssue")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], false),
  );

  const actions = createElement("div", { className: "completion-actions" });
  const back = createElement("button", {
    className: "secondary-button",
    text: t(language, "back"),
    attrs: { type: "button" },
  });
  const next = createElement("button", {
    className: "primary-button",
    text: t(language, "continue"),
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
  const language = getContextLanguage({ session });
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  panel.append(
    createElement("h2", { text: t(language, "thankYou") }),
    createElement("p", { text: t(language, "finalThanks") }),
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
  const language = session.language;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(CONFIG.themeStorageKey, theme);
  button.textContent = theme === "dark" ? t(language, "lightMode") : t(language, "darkMode");
  button.setAttribute("aria-pressed", String(theme === "dark"));
}

function applyLanguage(language) {
  document.documentElement.lang = language;
  byId("app-eyebrow").textContent = t(language, "appEyebrow");
  byId("app-title").textContent = t(language, "appTitle");
  byId("session-chip").textContent = t(language, "anonymousSession");
  byId("protocol-version").textContent = CONFIG.protocolLabel;
  setTheme(document.documentElement.dataset.theme || "dark", byId("theme-toggle"));
}
