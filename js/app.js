import { CONFIG } from "./config.js";
import {
  getOrCreateSession,
  getProgress,
  hydrateSessionFromProgress,
  isMethodCompleted,
  markSurveyStarted,
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
let rerenderCurrentView = () => {};

initThemeToggle();
applyLanguage(session.language);
renderHeaderLanguageSelector();

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
  const progress = getProgress();
  const hasPartialProgress = hasSavedPartialProgress(progress);
  setCurrentViewRenderer(() => renderWelcome(context));
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel welcome-panel" });
  panel.append(
    createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 1, total: TOTAL_SURVEY_STEPS }) }),
    createElement("h2", { text: t(language, "welcome") }),
    createElement("p", { text: t(language, "welcomeIntro") }),
    createElement("p", { text: t(language, "welcomePath") }),
  );

  const actions = createElement("div", { className: "completion-actions" });
  const start = createElement("button", {
    className: "primary-button",
    text: t(language, hasPartialProgress ? "continueSurvey" : "startSurvey"),
    attrs: { type: "button" },
  });

  start.addEventListener("click", () => {
    if (!allMethodsCompleted()) {
      markSurveyStarted(context.session);
    }

    routeAfterWelcome(context);
  });
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

function hasSavedPartialProgress(progress) {
  return !allMethodsCompleted() && (
    Boolean(progress.profile_completed) ||
    Object.values(progress.completed_methods || {}).some(Boolean)
  );
}

function renderCompletedPrompt(context) {
  const language = getContextLanguage(context);
  setCurrentViewRenderer(() => renderCompletedPrompt(context));
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
    markSurveyStarted(context.session, { reset: true });
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

function renderProfile(context, draft = null) {
  const language = getContextLanguage(context);
  setCurrentViewRenderer(() => renderProfile(context, readProfileDraft()));
  app.innerHTML = "";
  const values = draft || context.session.profile || {};

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
    ], true, values.age_range),
    renderSelect("gender", t(language, "gender"), [
      ["", t(language, "selectOption")],
      ["woman", t(language, "woman")],
      ["man", t(language, "man")],
      ["non_binary", t(language, "nonBinary")],
      ["self_describe", t(language, "selfDescribe")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], true, values.gender),
    renderSelect("night_walk_frequency", t(language, "nightWalkFrequency"), [
      ["", t(language, "selectOption")],
      ["rarely", t(language, "rarely")],
      ["sometimes", t(language, "sometimes")],
      ["weekly", t(language, "weekly")],
      ["almost_daily", t(language, "almostDaily")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], true, values.night_walk_frequency),
    renderSelect("place_familiarity", t(language, "placeFamiliarity"), [
      ["", t(language, "selectOption")],
      ["not_familiar", t(language, "notFamiliar")],
      ["somewhat_familiar", t(language, "somewhatFamiliar")],
      ["familiar", t(language, "familiar")],
      ["very_familiar", t(language, "veryFamiliar")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], true, values.place_familiarity),
    renderSelect("night_walking_comfort", t(language, "nightWalkingComfort"), [
      ["", t(language, "selectOption")],
      ["very_uncomfortable", t(language, "veryUncomfortable")],
      ["uncomfortable", t(language, "uncomfortable")],
      ["neutral", t(language, "neutral")],
      ["comfortable", t(language, "comfortable")],
      ["very_comfortable", t(language, "veryComfortable")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], true, values.night_walking_comfort),
    renderSelect("vision_or_display_issue", t(language, "visionOrDisplayIssue"), [
      ["", t(language, "noIssue")],
      ["minor_issue", t(language, "minorIssue")],
      ["significant_issue", t(language, "significantIssue")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], false, values.vision_or_display_issue),
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

function renderSelect(name, label, options, required = true, selectedValue = "") {
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

    if (index === 0 && !selectedValue) {
      option.disabled = true;
      option.selected = true;
    }

    if (index === 0 && !required) {
      option.disabled = false;
    }

    if (value === selectedValue) {
      option.selected = true;
    }

    select.append(option);
  });

  field.append(createElement("span", { text: label }), select);
  return field;
}

function startMethod(context, methodId) {
  if (methodId === "pairwise_comparison") {
    renderPairwiseComparison(app, context, routeToNextProtocolStep, setCurrentViewRenderer);
    return;
  }

  if (methodId === "detailed_rating") {
    renderDetailedRating(app, context, routeToNextProtocolStep, setCurrentViewRenderer);
    return;
  }

  if (methodId === "ideal_scene_builder") {
    renderIdealSceneBuilder(app, context, routeToNextProtocolStep, setCurrentViewRenderer);
    return;
  }

  if (methodId === "realism_check") {
    renderRealismCheck(app, context, routeToNextProtocolStep, setCurrentViewRenderer);
  }
}

function renderFinalThanks() {
  const language = getContextLanguage({ session });
  setCurrentViewRenderer(renderFinalThanks);
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel completion-panel" });
  panel.append(
    createElement("h2", { text: t(language, "thankYou") }),
    createElement("p", { text: t(language, "finalThanks") }),
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
  setTheme(document.documentElement.dataset.theme || "dark", byId("theme-toggle"));
}

function changeLanguage(context, language) {
  const previousLanguage = getContextLanguage(context);
  updateSessionLanguage(context.session, language);
  applyLanguage(context.session.language);
  renderHeaderLanguageSelector();

  if (context.session.language !== previousLanguage) {
    rerenderCurrentView();
  }
}

function setCurrentViewRenderer(callback) {
  rerenderCurrentView = callback;
}

function renderHeaderLanguageSelector() {
  const language = getContextLanguage({ session });
  const container = byId("header-language");
  container.innerHTML = "";
  container.setAttribute("aria-label", t(language, "languageLabel"));

  ["en", "fr"].forEach((value) => {
    const button = createElement("button", {
      className: value === language ? "header-language-option selected" : "header-language-option",
      text: value.toUpperCase(),
      attrs: {
        type: "button",
        "aria-pressed": String(value === language),
      },
    });
    button.addEventListener("click", () => {
      if (window.surveyContext) {
        changeLanguage(window.surveyContext, value);
      }
    });
    container.append(button);
  });
}

function readProfileDraft() {
  const form = app.querySelector(".profile-form");

  if (!form) {
    return session.profile || {};
  }

  const formData = new FormData(form);
  return {
    age_range: formData.get("age_range") || "",
    gender: formData.get("gender") || "",
    night_walk_frequency: formData.get("night_walk_frequency") || "",
    place_familiarity: formData.get("place_familiarity") || "",
    night_walking_comfort: formData.get("night_walking_comfort") || "",
    vision_or_display_issue: formData.get("vision_or_display_issue") || "",
  };
}
