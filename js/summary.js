import { optionLabel } from "./i18n.js";

const DIMENSION_LABELS = {
  detailed_comfort_atmosphere: { en: "walking comfort", fr: "le confort de marche" },
  detailed_practical_visibility: { en: "practical visibility", fr: "la visibilité pratique" },
  detailed_route_continuation: { en: "route legibility", fr: "la lisibilité de l'itinéraire" },
  detailed_road_safety: { en: "protection from traffic", fr: "la protection face à la circulation" },
  detailed_personal_safety: { en: "safety from crime risk", fr: "la sécurité face au risque de criminalité" },
  detailed_willingness_to_walk: { en: "willingness to walk", fr: "l'envie de marcher" },
};

// this function is for creating a structured, cautious participant-facing summary
export function buildResponseSummaryModel(responses = [], language = "en") {
  const lang = language === "fr" ? "fr" : "en";
  const detailed = responses
    .filter((row) => row.method === "detailed_rating" && Number.isFinite(Number(row.answer_value)))
    .sort((a, b) => Number(b.answer_value) - Number(a.answer_value));
  const strongest = detailed.filter((row) => Number(row.answer_value) >= 4).slice(0, 2);
  const builder = responses.filter((row) => (
    row.method === "ideal_scene_builder"
    && row.question_id !== "ideal_scene_builder_participation"
    && row.answer
    && row.answer !== "dont_know"
  ));
  const insights = [];

  if (strongest.length) {
    const labels = strongest.map((row) => DIMENSION_LABELS[row.question_id]?.[lang]).filter(Boolean);
    if (labels.length) {
      insights.push({
        type: "tendencies",
        text: lang === "fr"
          ? `Parmi les scènes évaluées, vos réponses les plus positives concernent ${joinLabels(labels, lang)}.`
          : `Among the scenes you rated, your most positive responses concern ${joinLabels(labels, lang)}.`,
      });
    }
  }

  if (builder.length) {
    const preferences = builder.slice(0, 4).map((row) => optionLabel(row.answer, lang, row.question_id));
    insights.push({
      type: "preferences",
      text: lang === "fr"
        ? `Pour votre scène idéale, vous avez notamment choisi : ${preferences.join(", ")}.`
        : `For your ideal scene, you selected preferences including: ${preferences.join(", ")}.`,
    });
  }

  if (!insights.length) {
    insights.push({
      type: "tendencies",
      text: lang === "fr"
        ? "Vos réponses montrent des appréciations nuancées selon les scènes observées."
        : "Your answers show a nuanced assessment across the scenes you observed.",
    });
  }

  return {
    insights,
    disclaimer: lang === "fr"
      ? "Ce bilan est indicatif et ne constitue pas une analyse scientifique individuelle."
      : "This summary is indicative and is not an individual scientific assessment.",
  };
}

// this compatibility helper returns the summary as plain paragraphs
export function buildResponseSummary(responses = [], language = "en") {
  const model = buildResponseSummaryModel(responses, language);
  return [...model.insights.map((insight) => insight.text), model.disclaimer];
}

function joinLabels(labels, language) {
  if (labels.length < 2) {
    return labels[0] || "";
  }

  const conjunction = language === "fr" ? " et " : " and ";
  return `${labels.slice(0, -1).join(", ")}${conjunction}${labels.at(-1)}`;
}
