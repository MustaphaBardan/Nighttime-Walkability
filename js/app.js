import { CONFIG } from "./config.js";
import {
  getOrCreateSession,
  getLocalResponses,
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
import { byId, createElement, isSurveyViewportAllowed } from "./utils.js";
import { renderPairwiseComparison } from "./pairwise-comparison.js";
import { preloadSurveyImages, warmUpPanoramaTextures } from "./panorama-viewer.js";
import { buildResponseSummaryModel } from "./summary.js";

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
    // Load the tutorial panoramas, complete scenario catalog, and survey content.
    const [tutorialImages, scenarioCatalog, baseQuestions, builderQuestions, idealSceneVariants, credits] = await Promise.all([
      fetchJson("data/images.json"),
      fetchJson("data/scenario_catalog.json"),
      fetchJson("data/questions.json"),
      fetchJson("data/scenario_builder_questions.json"),
      fetchJson("data/ideal_scene_variants.json"),
      fetchJson("data/credits.json"),
    ]);
    const images = [...tutorialImages, ...(scenarioCatalog.images || [])];
    const questions = {
      ...baseQuestions,
      ideal_scene_builder: builderQuestions,
    };

    // we keep the survey data in one context object used by all sections
    window.surveyContext = {
      session,
      images,
      questions,
      idealSceneVariants,
      credits,
    };

    // Load only the two tutorial panoramas up front; scenario images load on demand.
    preloadSurveyImages(tutorialImages);

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
  const allowedDevice = isAllowedSurveyViewport(context);
  setCurrentViewRenderer(() => renderWelcome(context));
  app.innerHTML = "";

  const panel = createElement("section", { className: "panel welcome-panel" });
  panel.append(
    createElement("p", { className: "step-label", text: t(language, "stepOf", { current: 1, total: TOTAL_SURVEY_STEPS }) }),
    createElement("h2", { text: t(language, "welcome") }),
    createElement("p", { text: t(language, "welcomeIntro") }),
    createElement("p", { text: t(language, "welcomePath") }),
    createElement("p", { text: t(language, "welcomePrivacy") }),
    renderProjectIdentity(context),
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
  if (!isAllowedSurveyViewport(context)) {
    renderWelcome(context);
    return;
  }

  const progress = getProgress();

  if (!progress.profile_completed) {
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

  back.addEventListener("click", () => renderSurveySummary(context));
  redo.addEventListener("click", () => {
    if (!isAllowedSurveyViewport(context)) {
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
  if (!isAllowedSurveyViewport(context)) {
    renderWelcome(context);
    return;
  }

  const progress = getProgress();

  if (!progress.profile_completed) {
    renderProfile(context);
    return;
  }

  const nextMethod = METHOD_DEFINITIONS.find((method) => !isMethodCompleted(method.id));

  if (!nextMethod) {
    renderSurveySummary(context);
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
  if (!isAllowedSurveyViewport(context)) {
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
    renderSelect("activity_expertise", t(language, "activityExpertise"), [
      ["", t(language, "selectOption")],
      ["urban_design", t(language, "expertiseUrbanDesign")],
      ["lighting", t(language, "expertiseLighting")],
      ["research", t(language, "expertiseResearch")],
      ["student", t(language, "expertiseStudent")],
      ["public_authority", t(language, "expertisePublicAuthority")],
      ["light_manufacturer", t(language, "expertiseManufacturer")],
      ["no_specific_expertise", t(language, "noSpecificExpertise")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], true, values.activity_expertise),
    renderSelect("lighting_knowledge", t(language, "lightingKnowledge"), [
      ["", t(language, "selectOption")],
      ["none", t(language, "lightingKnowledgeNone")],
      ["basic", t(language, "lightingKnowledgeBasic")],
      ["familiar", t(language, "lightingKnowledgeFamiliar")],
      ["professional_expert", t(language, "lightingKnowledgeExpert")],
      ["prefer_not_to_say", t(language, "preferNotToSay")],
    ], true, values.lighting_knowledge),
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
      night_walking_comfort: formData.get("night_walking_comfort"),
      activity_expertise: formData.get("activity_expertise"),
      lighting_knowledge: formData.get("lighting_knowledge"),
    });

    routeToNextProtocolStep(context);
  });

  actions.append(back, next);
  form.append(actions);
  panel.append(form);
  app.append(panel);
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

// this function is for calling the renderer of each survey method
function startMethod(context, methodId) {
  if (!isAllowedSurveyViewport(context)) {
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

// this function is for checking if the usable browser area is large enough
function isAllowedSurveyViewport(context) {
  const allowed = isSurveyViewportAllowed();
  if (context?.session) {
    context.session.viewport_allowed = allowed;
  }
  return allowed;
}

// this function is for showing the desktop only message from the welcome screen
function renderDesktopOnlyNotice(context) {
  const language = getContextLanguage(context);

  return createElement("div", {
    className: "device-block-notice",
    html: `<strong>${t(language, "desktopOnlyTitle")}</strong><p>${t(language, "desktopOnlyBody")}</p>`,
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

// this function is for showing the indicative response summary before the final thank-you page
function renderSurveySummary(context) {
  const language = getContextLanguage(context);
  setCurrentViewRenderer(() => renderSurveySummary(context));
  app.innerHTML = "";
  const panel = createElement("section", { className: "panel completion-panel summary-panel" });
  const summary = buildResponseSummaryModel(getLocalResponses(), language);
  const hero = createElement("header", { className: "summary-hero" });
  const completedMark = createElement("span", {
    className: "summary-completed-mark",
    text: "✓",
    attrs: { "aria-hidden": "true" },
  });
  const heading = createElement("div", { className: "summary-heading" });
  heading.append(
    createElement("p", { className: "summary-eyebrow", text: t(language, "summaryCompleted") }),
    createElement("h2", { text: t(language, "responseSummary") }),
    createElement("p", { className: "summary-intro", text: t(language, "summaryIntro") }),
  );
  hero.append(completedMark, heading);

  const insightGrid = createElement("div", { className: "summary-insight-grid" });
  summary.insights.forEach((insight) => {
    const card = createElement("article", { className: `summary-insight-card summary-insight-${insight.type}` });
    const icon = createElement("span", {
      className: "summary-insight-icon",
      text: insight.type === "preferences" ? "◇" : "◎",
      attrs: { "aria-hidden": "true" },
    });
    const copy = createElement("div");
    copy.append(
      createElement("h3", {
        text: t(language, insight.type === "preferences" ? "summaryPreferences" : "summaryTendencies"),
      }),
      createElement("p", { text: insight.text }),
    );
    card.append(icon, copy);
    insightGrid.append(card);
  });

  const disclaimer = createElement("aside", { className: "summary-disclaimer" });
  disclaimer.append(
    createElement("span", { className: "summary-disclaimer-icon", text: "i", attrs: { "aria-hidden": "true" } }),
    createElement("div", {
      html: `<strong>${t(language, "summaryNote")}</strong><p>${summary.disclaimer}</p>`,
    }),
  );
  const actions = createElement("div", { className: "completion-actions" });
  const finish = createElement("button", {
    className: "primary-button",
    text: t(language, "finishSurvey"),
    attrs: { type: "button" },
  });
  finish.addEventListener("click", renderFinalThanks);
  actions.append(finish);
  panel.append(hero, insightGrid, disclaimer, actions);
  app.append(panel);
}

// this function is for rendering the logos and project links on the introduction screen
function renderProjectIdentity(context) {
  const language = getContextLanguage(context);
  const wrapper = createElement("section", { className: "project-identity" });
  const logos = createElement("div", { className: "project-logo-strip" });
  const links = createElement("div", { className: "project-links" });
  (context.credits?.logos || []).forEach((logo) => {
    logos.append(createElement("img", { attrs: { src: logo.path, alt: logo.alt } }));
  });
  (context.credits?.project_links || []).forEach((link) => {
    links.append(makeExternalLink(link.label?.[language] || link.label?.en || link.url, link.url));
  });
  wrapper.append(logos, links);
  return wrapper;
}

// this function is for filling the footer credits dialog from the tracked credit data
function renderCreditsDialog(context) {
  const language = getContextLanguage(context);
  const content = byId("credits-content");
  content.replaceChildren(createElement("h2", { text: t(language, "creditsTitle") }));
  const acknowledgements = context.credits?.acknowledgements || [];
  if (acknowledgements.length) {
    content.append(createElement("h3", { text: t(language, "acknowledgementsTitle") }));
    acknowledgements.forEach((acknowledgement) => {
      content.append(createElement("p", {
        text: acknowledgement.text?.[language] || acknowledgement.text?.en || "",
      }));
    });
  }
  (context.credits?.asset_credits || []).forEach((credit) => {
    const item = createElement("p");
    item.append(
      makeExternalLink(`“${credit.title}”`, credit.source_url),
      document.createTextNode(language === "fr" ? ` par ${credit.author} — ` : ` by ${credit.author} — `),
      makeExternalLink(credit.license_name, credit.license_url),
    );
    content.append(item);
  });
  const software = createElement("p");
  software.append(makeExternalLink(t(language, "softwareLicense"), "LICENSE"));
  content.append(software);
  byId("credits-close").textContent = t(language, "close");
}

function makeExternalLink(label, url) {
  return createElement("a", {
    text: label,
    attrs: { href: url, target: "_blank", rel: "noopener noreferrer" },
  });
}

init();
initDeviceGateResizeWatcher();
initCreditsDialog();

function initCreditsDialog() {
  byId("credits-button").addEventListener("click", () => {
    if (!window.surveyContext) return;
    renderCreditsDialog(window.surveyContext);
    byId("credits-dialog").showModal();
  });
  byId("credits-close").addEventListener("click", () => byId("credits-dialog").close());
}

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

    const allowedDevice = isSurveyViewportAllowed();

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
    activity_expertise: formData.get("activity_expertise") || "",
    lighting_knowledge: formData.get("lighting_knowledge") || "",
  };
}
