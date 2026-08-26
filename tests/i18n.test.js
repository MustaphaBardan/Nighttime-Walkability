import assert from "node:assert/strict";
import test from "node:test";

import {
  getContextLanguage,
  localize,
  normalizeLanguage,
  optionLabel,
  optionPreview,
  questionText,
  t,
} from "../js/i18n.js";

test("normalizeLanguage accepts supported languages and falls back to English", () => {
  assert.equal(normalizeLanguage("en"), "en");
  assert.equal(normalizeLanguage("fr"), "fr");
  assert.equal(normalizeLanguage("FR"), "en");
  assert.equal(normalizeLanguage("de"), "en");
  assert.equal(normalizeLanguage(""), "en");
  assert.equal(normalizeLanguage(null), "en");
  assert.equal(normalizeLanguage(undefined), "en");
});

test("getContextLanguage prefers session language, then document language, then English", () => {
  const previousDocument = globalThis.document;

  globalThis.document = { documentElement: { lang: "fr" } };
  assert.equal(getContextLanguage({ session: { language: "en" } }), "en");
  assert.equal(getContextLanguage({}), "fr");
  assert.equal(getContextLanguage({ session: { language: "missing" } }), "en");

  globalThis.document = { documentElement: { lang: "unsupported" } };
  assert.equal(getContextLanguage({}), "en");

  if (previousDocument === undefined) {
    delete globalThis.document;
  } else {
    globalThis.document = previousDocument;
  }
});

test("localize and questionText use requested language with English/object fallback", () => {
  const value = { en: "English", fr: "Français" };

  assert.equal(localize(value, "fr"), "Français");
  assert.deepEqual(value, { en: "English", fr: "Français" });
  assert.equal(localize({ en: "English" }, "fr"), "English");
  assert.equal(localize({ es: "Español" }, "fr"), "Español");
  assert.equal(localize("literal", "fr"), "literal");
  assert.equal(localize(0, "fr"), 0);
  assert.equal(localize(false, "fr"), false);
  assert.equal(localize(null, "fr"), "");
  assert.equal(localize(undefined, "fr"), "");
  assert.equal(questionText({ text: { en: "Question", fr: "Question FR" } }, "fr"), "Question FR");
  assert.equal(questionText({}, "fr"), "");
  assert.equal(questionText(null, "fr"), "");
});

test("t interpolates placeholders, leaves missing placeholders visible, and falls back for unknown keys", () => {
  assert.equal(t("en", "stepOf", { current: 2, total: 7 }), "Step 2 of 7");
  assert.equal(t("fr", "characterLimit", { current: 12, limit: 300 }), "12 / 300 caractères");
  assert.equal(t("en", "stepOf", { current: 2 }), "Step 2 of {total}");
  assert.equal(t("fr", "unknownTranslationKey"), "unknownTranslationKey");
});

test("t exposes qualitative and pairwise navigation prompts in both supported languages", () => {
  assert.equal(t("en", "responseCommentPrompt"), "Why this choice?");
  assert.equal(t("fr", "responseCommentPrompt"), "Pourquoi ce choix ?");
  assert.equal(t("en", "left"), "Left");
  assert.equal(t("fr", "right"), "Droite");
  assert.match(t("en", "initialImpression"), /Before seeing the scenes/);
  assert.match(t("fr", "initialImpression"), /Avant de voir les scènes/);
  assert.match(t("en", "yawRequirement", { current: 90, required: 180 }), /90°/);
  assert.match(t("fr", "neutralCommentRequirement", { minimum: 10 }), /10/);
  assert.equal(t("en", "buildScene"), "Build a scene");
  assert.equal(t("en", "detailedStart"), "Start detailed ratings");
  assert.equal(t("fr", "detailedStart"), "Commencer les évaluations détaillées");
  assert.match(t("en", "detailedIntro"), /one 360 degree scene at a time/);
  assert.match(t("fr", "detailedIntro"), /scène à 360 degrés à la fois/);
  assert.equal(t("en", "sceneA"), "Scene A");
  assert.equal(t("fr", "sceneB"), "Scène B");
  assert.equal(t("en", "disagree"), "Disagree");
  assert.equal(t("en", "neitherAgreeNorDisagree"), "Neither agree nor disagree");
  assert.equal(t("fr", "agree"), "D'accord");
  assert.equal(t("en", "clearRouteTitle"), "Readable route continuity");
  assert.equal(t("en", "unclearRouteTitle"), "Unreadable route continuity");
  assert.equal(t("fr", "clearRouteTitle"), "Continuité lisible");
  assert.equal(t("fr", "unclearRouteTitle"), "Continuité illisible");
  assert.match(t("en", "clearRouteDescription"), /remains readable/);
  assert.match(t("fr", "unclearRouteDescription"), /illisible/);
  assert.equal(t("en", "screenBrightness"), "Before starting, is your screen brightness set to a comfortable level for judging night-time images?");
  assert.equal(t("en", "slightlyComfortable"), "Slightly comfortable");
  assert.equal(t("en", "selectAllThatApply"), "Select all that apply.");
  assert.equal(t("en", "moderatelyComfortable"), "Moderately comfortable");
});

test("welcome and training copy explain walkability and synchronized panoramic exploration", () => {
  assert.match(t("en", "welcomeIntro"), /how easily a space can be travelled on foot/);
  assert.match(t("fr", "welcomeIntro"), /facilité avec laquelle un espace peut être parcouru à pied/);
  assert.match(t("en", "welcomePath"), /explore the scene using the panoramic view/);
  assert.match(t("fr", "welcomePath"), /explorez la scène de façon panoramique/);
  assert.match(t("en", "trainingIntro"), /coupled and synchronized/);
  assert.match(t("fr", "trainingIntro"), /couplées et synchronisées/);
});

test("submission delivery states are available in english and french", () => {
  assert.match(t("en", "submissionConnectionWarningBody"), /VPN/);
  assert.match(t("fr", "submissionConnectionWarningBody"), /VPN/);
  assert.match(t("en", "submissionConfirmed"), /confirmed/i);
  assert.match(t("fr", "submissionConfirmed"), /confirmé/i);
  assert.equal(t("en", "retrySubmission"), "Retry sending response");
  assert.equal(t("fr", "retrySubmission"), "Réessayer l'envoi");
});

test("optionLabel applies question-specific labels before generic labels and raw fallback", () => {
  assert.equal(optionLabel("medium", "en", "preferred_lighting_intensity"), "Medium lighting");
  assert.equal(optionLabel("medium", "fr", "preferred_lighting_intensity"), "Éclairage moyen");
  assert.equal(optionLabel("medium", "en"), "Medium");
  assert.equal(optionLabel("no_clear_difference", "fr"), "Pas de différence discernable");
  assert.equal(optionLabel("unlisted_value", "en"), "unlisted value");
  assert.equal(optionLabel("two_word_value", "unsupported"), "two word value");
  assert.equal(optionLabel("half", "en", "preferred_vegetation_density"), "Half-density vegetation");
  assert.equal(optionLabel("lit", "fr", "preferred_path_lighting"), "Cheminement éclairé");
  assert.equal(optionLabel("present", "en", "preferred_obstacle_condition"), "Obstacles present");
});

test("optionPreview returns configured builder copy or a language-specific fallback", () => {
  assert.match(optionPreview("preferred_lighting_intensity", "low", "en"), /Soft lighting/);
  assert.match(optionPreview("preferred_lighting_intensity", "low", "fr"), /éclairage doux/i);
  assert.notEqual(
    optionPreview("preferred_lighting_intensity", "low", "en"),
    optionPreview("preferred_lighting_intensity", "high", "en"),
  );
  assert.equal(
    optionPreview("unknown_question", "unknown_option", "en"),
    "This option will be saved as your preferred scene characteristic.",
  );
  assert.equal(
    optionPreview("unknown_question", "unknown_option", "fr"),
    "Cette option sera enregistrée comme caractéristique préférée de votre scène.",
  );
});
