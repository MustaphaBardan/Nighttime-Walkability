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
  renderTrainingScene,
} from "./simple-methods.js";
import { getContextLanguage, t } from "./i18n.js";
import { byId, createElement, getDeviceType } from "./utils.js";
import { renderPairwiseComparison } from "./pairwise-comparison.js";
import { preloadSurveyImages, warmUpPanoramaTextures } from "./panorama-viewer.js";

const TEXT_INPUT_CHARACTER_LIMIT = 300;

const app = byId("app");
const session = getOrCreateSession();
hydrateSessionFromProgress(session);

// this keeps the last screen renderer so we can redraw it when language/device changes
let rerenderCurrentView = () => {};
let mediaWarmupStarted = false;
let lastAllowedDeviceState = null;

initThemeToggle();
applyLanguage(session.language);
renderHeaderLanguageSelector();

// this function is for starting the survey app and loading the json files
async function init() {
  try {
    // we call the json files needed by the website
    const [images, questions, idealSceneVariants] = await Promise.all([
      fetchJson("data/images.json"),
      fetchJson("data/questions.json"),
      fetchJson("data/ideal_scene_variants.json"),
    ]);

    // we keep the survey data in one context object used by all sections
    window.surveyContext = {
      session,
      images,
      questions,
      idealSceneVariants,
    };

    // we start loading images early so the survey feels faster
    preloadSurveyImages([
      ...images,
      idealSceneVariants.default,
      ...(idealSceneVariants.variants || []),
    ]);

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

// this function is for reading a json file and checking if it loaded correctly
async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

// this function is for showing the first welcome screen
function renderWelcome(context) {
  const language = getContextLanguage(context);
  const progress = getProgress();
  const hasPartialProgress = hasSavedPartialProgress(progress);
  const allowedDevice = isDesktopSurveyDevice(context);
  setCurrentViewRenderer(() => renderWelcome(context));
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel welcome-panel" });
  panel.append(
    createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 1, total: TOTAL_SURVEY_STEPS }) }),
    createElement("h2", { text: t(language, "welcome") }),
    createElement("p", { text: t(language, "welcomeIntro") }),
    createElement("p", { text: t(language, "welcomePath") }),
    createElement("p", { text: t(language, "welcomePrivacy") }),
  );

  if (!allowedDevice) {
    panel.append(renderDesktopOnlyNotice(context));
  }

  const actions = createElement("div", { className: "completion-actions" });
  const start = createElement("button", {
    className: "primary-button",
    text: t(language, hasPartialProgress ? "continueSurvey" : "startSurvey"),
    attrs: allowedDevice ? { type: "button" } : { type: "button", disabled: "disabled" },
  });

  start.addEventListener("click", () => {
    // we save the starting time only when the survey is not finished yet
    if (!allMethodsCompleted()) {
      markSurveyStarted(context.session);
    }

    routeAfterWelcome(context);
  });
  actions.append(start);
  panel.append(actions);
  app.append(panel);
}

// this function is for deciding where the user goes after the welcome screen
function routeAfterWelcome(context) {
  if (!isDesktopSurveyDevice(context)) {
    renderWelcome(context);
    return;
  }

  const progress = getProgress();

  if (!progress.profile_completed) {
    renderProfile(context);
    return;
  }

  if (!hasAllowedDeclaredDevice(context)) {
    renderProfile(context);
    return;
  }

  warmUpSurveyMedia(context);

  if (allMethodsCompleted()) {
    renderCompletedPrompt(context);
    return;
  }

  routeToNextProtocolStep(context);
}

// this function is for knowing if the browser already has unfinished answers
function hasSavedPartialProgress(progress) {
  return !allMethodsCompleted() && (
    Boolean(progress.profile_completed) ||
    Object.values(progress.completed_methods || {}).some(Boolean)
  );
}

// this function is for showing the message when the survey was already completed
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
    if (!isDesktopSurveyDevice(context)) {
      renderWelcome(context);
      return;
    }

    // we remove old method answers before starting the survey again
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

// this function is for routing to the next unfinished survey section
function routeToNextProtocolStep(context) {
  if (!isDesktopSurveyDevice(context)) {
    renderWelcome(context);
    return;
  }

  const progress = getProgress();

  if (!progress.profile_completed) {
    renderProfile(context);
    return;
  }

  if (!hasAllowedDeclaredDevice(context)) {
    renderProfile(context);
    return;
  }

  const nextMethod = METHOD_DEFINITIONS.find((method) => !isMethodCompleted(method.id));

  if (!nextMethod) {
    renderFinalThanks();
    return;
  }

  warmUpSurveyMedia(context);
  startMethod(context, nextMethod.id);
}

// this function is for preparing panorama textures once after the profile
function warmUpSurveyMedia(context) {
  if (mediaWarmupStarted) {
    return;
  }

  mediaWarmupStarted = true;
  warmUpPanoramaTextures(context.images);
}

// this function is for showing the anonymous profile questions
function renderProfile(context, draft = null) {
  const language = getContextLanguage(context);
  if (!isDesktopSurveyDevice(context)) {
    renderWelcome(context);
    return;
  }

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
      ["65_plus", t(language, "sixtyFiveOrOlder")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], true, values.age_range),
    renderSelect("gender", t(language, "gender"), [
      ["", t(language, "selectOption")],
      ["woman", t(language, "woman")],
      ["man", t(language, "man")],
      ["non_binary", t(language, "nonBinary")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], true, values.gender),
    renderSelect("night_walk_frequency", t(language, "nightWalkFrequency"), [
      ["", t(language, "selectOption")],
      ["never_or_almost_never", t(language, "neverOrAlmostNever")],
      ["rarely_less_than_monthly", t(language, "rarelyLessThanMonthly")],
      ["occasionally_few_times_monthly", t(language, "occasionallyFewTimesMonthly")],
      ["regularly_one_two_weekly", t(language, "regularlyOneTwoWeekly")],
      ["often_three_five_weekly", t(language, "oftenThreeFiveWeekly")],
      ["almost_every_night", t(language, "almostEveryNight")],
    ], true, values.night_walk_frequency),
    renderSelect("night_walking_comfort", t(language, "nightWalkingComfort"), [
      ["", t(language, "selectOption")],
      ["not_comfortable_at_all", t(language, "notComfortableAtAll")],
      ["slightly_comfortable", t(language, "slightlyComfortable")],
      ["moderately_comfortable", t(language, "moderatelyComfortable")],
      ["comfortable", t(language, "comfortable")],
      ["very_comfortable", t(language, "veryComfortable")],
    ], true, values.night_walking_comfort),
    renderSelect("place_familiarity", t(language, "placeFamiliarity"), [
      ["", t(language, "selectOption")],
      ["yes_very_familiar_nantes", t(language, "yesVeryFamiliarNantes")],
      ["somewhat_familiar_nantes", t(language, "somewhatFamiliarNantes")],
      ["similar_urban_environment", t(language, "similarUrbanEnvironment")],
      ["not_familiar_environment", t(language, "notFamiliarEnvironment")],
    ], true, values.place_familiarity),
    renderSelect("screen_brightness", t(language, "screenBrightness"), [
      ["", t(language, "selectOption")],
      ["yes", t(language, "yes")],
      ["no", t(language, "no")],
      ["not_sure", t(language, "notSure")],
    ], true, values.screen_brightness),
    renderSelect("device_used", t(language, "deviceUsed"), [
      ["", t(language, "selectOption")],
      ["computer_laptop", t(language, "computerLaptop")],
      ["tablet", t(language, "tablet")],
      ["smartphone", t(language, "smartphone")],
      ["other", t(language, "other")],
    ], true, values.device_used),
    renderLimitedTextArea("initial_impression", t(language, "initialImpression"), language, values.initial_impression || ""),
  );

  const declaredDeviceNotice = renderDeclaredDeviceOnlyNotice(context);
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
  const deviceSelect = form.querySelector('[name="device_used"]');

  // this function is for blocking the survey if the declared device is not a computer
  function updateDeclaredDeviceGate() {
    const deviceAllowed = isAllowedDeclaredDevice(deviceSelect.value);
    const deviceSelected = Boolean(deviceSelect.value);
    declaredDeviceNotice.hidden = !deviceSelected || deviceAllowed;
    next.disabled = deviceSelected && !deviceAllowed;
  }

  back.addEventListener("click", () => renderWelcome(context));
  deviceSelect.addEventListener("change", updateDeclaredDeviceGate);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const declaredDevice = formData.get("device_used");

    // we do not continue if the user says they are not using a computer
    if (!isAllowedDeclaredDevice(declaredDevice)) {
      declaredDeviceNotice.hidden = false;
      next.disabled = true;
      deviceSelect.focus();
      return;
    }

    updateSessionProfile(context.session, {
      age_range: formData.get("age_range"),
      gender: formData.get("gender"),
      night_walk_frequency: formData.get("night_walk_frequency"),
      night_walking_comfort: formData.get("night_walking_comfort"),
      place_familiarity: formData.get("place_familiarity"),
      screen_brightness: formData.get("screen_brightness"),
      device_used: declaredDevice,
      initial_impression: limitCharacters(String(formData.get("initial_impression") || "").trim(), TEXT_INPUT_CHARACTER_LIMIT),
    });

    routeToNextProtocolStep(context);
  });

  actions.append(back, next);
  form.append(declaredDeviceNotice);
  form.append(actions);
  panel.append(form);
  app.append(panel);
  updateDeclaredDeviceGate();
}

// this function is for making a select input with translated options
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

// this function is for optional profile text answers with the shared character limit
function renderLimitedTextArea(name, label, language, value = "") {
  const field = createElement("label", { className: "form-field" });
  const textarea = createElement("textarea", {
    attrs: {
      name,
      rows: "4",
      placeholder: t(language, "optionalComment"),
    },
  });
  const counter = createElement("small", {
    className: "field-helper character-counter",
  });

  textarea.value = limitCharacters(value, TEXT_INPUT_CHARACTER_LIMIT);
  field.append(createElement("span", { text: label }), textarea, counter);

  function updateCounter() {
    const limitedValue = limitCharacters(textarea.value, TEXT_INPUT_CHARACTER_LIMIT);

    if (textarea.value !== limitedValue) {
      textarea.value = limitedValue;
    }

    counter.textContent = t(language, "characterLimit", {
      current: countCharacters(textarea.value),
      limit: TEXT_INPUT_CHARACTER_LIMIT,
    });
  }

  textarea.addEventListener("input", updateCounter);
  updateCounter();

  return field;
}

// this function is for calling the renderer of each survey method
function startMethod(context, methodId) {
  if (!isDesktopSurveyDevice(context)) {
    renderWelcome(context);
    return;
  }

  if (methodId === "training_scene") {
    renderTrainingScene(app, context, routeToNextProtocolStep, setCurrentViewRenderer);
    return;
  }

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

// this function is for checking if the current browser width is allowed
function isDesktopSurveyDevice(context) {
  const currentDevice = getDeviceType();

  if (context?.session) {
    context.session.device = currentDevice;
  }

  return currentDevice === "desktop";
}

// this function is for checking the device answer saved in the profile
function hasAllowedDeclaredDevice(context) {
  const progress = getProgress();
  const declaredDevice = context?.session?.profile?.device_used || progress.profile?.device_used || "";
  return isAllowedDeclaredDevice(declaredDevice);
}

// this function is for allowing only computer/laptop answers
function isAllowedDeclaredDevice(device) {
  return device === "computer_laptop";
}

// this function is for showing the desktop only message from the welcome screen
function renderDesktopOnlyNotice(context) {
  const language = getContextLanguage(context);

  return createElement("div", {
    className: "device-block-notice",
    html: `<strong>${t(language, "desktopOnlyTitle")}</strong><p>${t(language, "desktopOnlyBody")}</p>`,
  });
}

// this function is for showing the device warning inside the profile form
function renderDeclaredDeviceOnlyNotice(context) {
  const language = getContextLanguage(context);

  return createElement("div", {
    className: "device-block-notice",
    attrs: { hidden: "hidden" },
    html: `<strong>${t(language, "declaredDeviceOnlyTitle")}</strong><p>${t(language, "declaredDeviceOnlyBody")}</p>`,
  });
}

// this function is for showing the final thank you page
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
initDeviceGateResizeWatcher();

// this function is for preparing the dark/light mode button
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

// this function is for applying and saving the theme
function setTheme(theme, button) {
  const language = session.language;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(CONFIG.themeStorageKey, theme);
  button.textContent = theme === "dark" ? t(language, "lightMode") : t(language, "darkMode");
  button.setAttribute("aria-pressed", String(theme === "dark"));
}

// this function is for applying the current language to the fixed header
function applyLanguage(language) {
  document.documentElement.lang = language;
  byId("app-eyebrow").textContent = t(language, "appEyebrow");
  byId("app-title").textContent = t(language, "appTitle");
  setTheme(document.documentElement.dataset.theme || "dark", byId("theme-toggle"));
}

// this function is for changing language and redrawing the current page
function changeLanguage(context, language) {
  const previousLanguage = getContextLanguage(context);
  updateSessionLanguage(context.session, language);
  applyLanguage(context.session.language);
  renderHeaderLanguageSelector();

  if (context.session.language !== previousLanguage) {
    rerenderCurrentView();
  }
}

// this function is for remembering how to redraw the active screen
function setCurrentViewRenderer(callback) {
  rerenderCurrentView = callback;
}

// this function is for blocking the survey again if the window becomes too small
function initDeviceGateResizeWatcher() {
  window.addEventListener("resize", () => {
    if (document.fullscreenElement) {
      return;
    }

    const allowedDevice = getDeviceType() === "desktop";

    if (allowedDevice === lastAllowedDeviceState) {
      return;
    }

    lastAllowedDeviceState = allowedDevice;

    if (!window.surveyContext) {
      return;
    }

    if (!allowedDevice) {
      renderWelcome(window.surveyContext);
      return;
    }

    rerenderCurrentView();
  });
}

// this function is for rendering the EN/FR buttons in the header
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

// this function is for keeping the profile draft when the language changes
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
    night_walking_comfort: formData.get("night_walking_comfort") || "",
    place_familiarity: formData.get("place_familiarity") || "",
    screen_brightness: formData.get("screen_brightness") || "",
    device_used: formData.get("device_used") || "",
    initial_impression: formData.get("initial_impression") || "",
  };
}

// this function is for counting characters correctly
function countCharacters(value) {
  return Array.from(String(value)).length;
}

// this function is for cutting text at the character limit
function limitCharacters(value, limit) {
  return Array.from(String(value)).slice(0, limit).join("");
}
