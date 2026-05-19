export const SUPPORTED_LANGUAGES = ["en", "fr"];

const UI_TEXT = {
  en: {
    appEyebrow: "Research Survey",
    appTitle: "Night Walkability Survey",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    couldNotLoad: "Could not load survey data",
    welcome: "Welcome",
    stepOf: "Step {current} of {total}",
    welcomeIntro:
      "You are invited to answer this online questionnaire as part of a research project on the perception of night-time urban environments. The estimated completion time is about 10 minutes.",
    welcomePath:
      "You will answer short questions about simulated urban scenes, including safety, comfort, visibility, and route preference.",
    welcomePrivacy:
      "To respect participants' rights and privacy, the collected data are anonymous and used only for research analysis.",
    languageLabel: "Choose language",
    english: "English",
    french: "Français",
    startSurvey: "Start survey",
    continueSurvey: "Continue survey",
    generalInformation: "General information",
    profileIntro: "These questions are anonymous and help interpret the survey results.",
    selectOption: "Select an option",
    back: "Back",
    continue: "Continue",
    keepExistingResponse: "Keep my existing response",
    redoReplaceAnswers: "Redo and replace my answers",
    alreadyCompleted: "You already completed this survey",
    alreadyCompletedBody:
      "This browser already has a completed response for the current protocol version. If you redo the survey, your saved answers for this browser will be replaced.",
    thankYou: "Thank you for your time",
    finalThanks:
      "Your participation in this proposed-methodology version is complete. Your answers have been recorded for the research team.",
    pairwiseTitle: "Pairwise comparison",
    pairwiseIntro: "Choose the scene that better matches each question.",
    pairwiseStart: "Start pairwise comparison",
    pairwiseIntroBody:
      "You will compare short pairs of simulated night scenes. Choose the scene that best matches each question.",
    scene: "Scene",
    noClearDifference: "No clear difference",
    progress: "Progress",
    detailedTitle: "Detailed scene rating",
    builderTitle: "Ideal scene builder",
    validateContinue: "Validate and continue",
    finalSection: "Final section",
    realismTitle: "Realism check",
    realismIntro:
      "These last questions help interpret whether the simulated images were clear enough to judge.",
    finishSurvey: "Finish survey",
    optionalComment: "Optional comment",
    characterLimit: "{current} / {limit} characters",
    stronglyDisagree: "Strongly disagree",
    stronglyAgree: "Strongly agree",
    sectionComplete: "Section complete",
    savingComplete: "Saving your complete response...",
    sectionSaved: "This section is saved on this browser.",
    completeRecorded: "Your complete response has been recorded.",
    completeSavedLocal:
      "Your complete response is saved on this browser. The research team can retry submission after checking the Google Sheets connection.",
    ageRange: "Age range",
    gender: "Gender",
    nightWalkFrequency: "How often do you walk at night?",
    placeFamiliarity: "Are you familiar with Nantes or similar urban environments?",
    nightWalkingComfort: "In general, how comfortable do you feel walking alone at night?",
    visionOrDisplayIssue: "Did anything about your vision or screen make image judgment difficult?",
    under18: "Under 18",
    preferNotToSay: "Prefer not to say",
    woman: "Woman",
    man: "Man",
    nonBinary: "Non-binary",
    selfDescribe: "Prefer to self-describe",
    rarely: "Rarely",
    sometimes: "Sometimes",
    weekly: "Weekly",
    almostDaily: "Almost daily",
    notFamiliar: "Not familiar",
    somewhatFamiliar: "Somewhat familiar",
    familiar: "Familiar",
    veryFamiliar: "Very familiar",
    veryUncomfortable: "Very uncomfortable",
    uncomfortable: "Uncomfortable",
    neutral: "Neutral",
    comfortable: "Comfortable",
    veryComfortable: "Very comfortable",
    noIssue: "No issue to report",
    minorIssue: "A minor difficulty",
    significantIssue: "A significant difficulty",
    questionNumber: "Question {number}",
  },
  fr: {
    appEyebrow: "Questionnaire de recherche",
    appTitle: "Questionnaire sur la marchabilité nocturne",
    lightMode: "Mode clair",
    darkMode: "Mode sombre",
    couldNotLoad: "Impossible de charger les données du questionnaire",
    welcome: "Bienvenue",
    stepOf: "Étape {current} sur {total}",
    welcomeIntro:
      "Vous êtes invité(e) à répondre à ce questionnaire en ligne dans le cadre d'un projet de recherche sur la perception des environnements urbains nocturnes. Le temps de réponse estimé est d'environ 10 minutes.",
    welcomePath:
      "Vous répondrez à de courtes questions sur des scènes urbaines simulées, notamment sur la sécurité ressentie, le confort, la visibilité et la préférence d'itinéraire.",
    welcomePrivacy:
      "Afin de respecter les droits et la vie privée des participant(e)s, les données collectées sont anonymes et utilisées uniquement pour l'analyse de recherche.",
    languageLabel: "Choisir la langue",
    english: "English",
    french: "Français",
    startSurvey: "Commencer le questionnaire",
    continueSurvey: "Continuer le questionnaire",
    generalInformation: "Informations générales",
    profileIntro: "Ces questions sont anonymes et aident à interpréter les résultats.",
    selectOption: "Sélectionner une option",
    back: "Retour",
    continue: "Continuer",
    keepExistingResponse: "Conserver ma réponse existante",
    redoReplaceAnswers: "Refaire et remplacer mes réponses",
    alreadyCompleted: "Vous avez déjà terminé ce questionnaire",
    alreadyCompletedBody:
      "Ce navigateur contient déjà une réponse complète pour la version actuelle du protocole. Si vous refaites le questionnaire, vos réponses enregistrées dans ce navigateur seront remplacées.",
    thankYou: "Merci pour votre participation",
    finalThanks:
      "Votre participation à cette version du protocole est terminée. Vos réponses ont été enregistrées pour l'équipe de recherche.",
    pairwiseTitle: "Comparaison par paires",
    pairwiseIntro: "Choisissez la scène qui correspond le mieux à chaque question.",
    pairwiseStart: "Commencer la comparaison",
    pairwiseIntroBody:
      "Vous allez comparer de courtes paires de scènes nocturnes simulées. Choisissez la scène qui correspond le mieux à chaque question.",
    scene: "Scène",
    noClearDifference: "Pas de différence claire",
    progress: "Progression",
    detailedTitle: "Évaluation détaillée de la scène",
    builderTitle: "Construction de la scène idéale",
    validateContinue: "Valider et continuer",
    finalSection: "Dernière section",
    realismTitle: "Contrôle du réalisme",
    realismIntro:
      "Ces dernières questions aident à savoir si les images simulées étaient suffisamment claires pour être jugées.",
    finishSurvey: "Terminer le questionnaire",
    optionalComment: "Commentaire optionnel",
    characterLimit: "{current} / {limit} caractères",
    stronglyDisagree: "Pas du tout d'accord",
    stronglyAgree: "Tout à fait d'accord",
    sectionComplete: "Section terminée",
    savingComplete: "Enregistrement de votre réponse complète...",
    sectionSaved: "Cette section est enregistrée dans ce navigateur.",
    completeRecorded: "Votre réponse complète a été enregistrée.",
    completeSavedLocal:
      "Votre réponse complète est enregistrée dans ce navigateur. L'équipe de recherche pourra réessayer l'envoi après vérification de la connexion à Google Sheets.",
    ageRange: "Tranche d'âge",
    gender: "Genre",
    nightWalkFrequency: "À quelle fréquence marchez-vous la nuit ?",
    placeFamiliarity: "Connaissez-vous Nantes ou des environnements urbains similaires ?",
    nightWalkingComfort: "En général, à quel point vous sentez-vous à l'aise en marchant seul(e) la nuit ?",
    visionOrDisplayIssue: "Votre vision ou votre écran ont-ils rendu le jugement des images difficile ?",
    under18: "Moins de 18 ans",
    preferNotToSay: "Préfère ne pas répondre",
    woman: "Femme",
    man: "Homme",
    nonBinary: "Non binaire",
    selfDescribe: "Préfère se décrire",
    rarely: "Rarement",
    sometimes: "Parfois",
    weekly: "Chaque semaine",
    almostDaily: "Presque tous les jours",
    notFamiliar: "Pas familier",
    somewhatFamiliar: "Plutôt familier",
    familiar: "Familier",
    veryFamiliar: "Très familier",
    veryUncomfortable: "Très mal à l'aise",
    uncomfortable: "Mal à l'aise",
    neutral: "Neutre",
    comfortable: "À l'aise",
    veryComfortable: "Très à l'aise",
    noIssue: "Aucune difficulté à signaler",
    minorIssue: "Une difficulté mineure",
    significantIssue: "Une difficulté importante",
    questionNumber: "Question {number}",
  },
};

const OPTION_LABELS = {
  low: { en: "Low", fr: "Faible" },
  medium: { en: "Medium", fr: "Moyenne" },
  high: { en: "High", fr: "Élevée" },
  uniform: { en: "Uniform", fr: "Uniforme" },
  contrasted: { en: "Contrasted", fr: "Contrastée" },
  punctual: { en: "Punctual", fr: "Ponctuelle" },
  enclosed: { en: "Enclosed", fr: "Fermée" },
  balanced: { en: "Balanced", fr: "Équilibrée" },
  open: { en: "Open", fr: "Ouverte" },
  narrow_discontinuous: { en: "Narrow/discontinuous", fr: "Étroit/discontinu" },
  ordinary: { en: "Ordinary", fr: "Ordinaire" },
  wide_continuous: { en: "Wide/continuous", fr: "Large/continu" },
  none: { en: "None", fr: "Aucun" },
  few: { en: "Few", fr: "Quelques-uns" },
  many: { en: "Many", fr: "Nombreux" },
  empty: { en: "Empty", fr: "Vide" },
  some_activity: { en: "Some activity", fr: "Un peu d'activité" },
  active_frontage: { en: "Active frontage", fr: "Façade active" },
  no_clear_difference: { en: "No clear difference", fr: "Pas de différence claire" },
};

const BUILDER_PREVIEWS = {
  preferred_lighting_intensity: {
    low: {
      en: "Soft lighting with some shadows, keeping the scene subdued while preserving basic visibility.",
      fr: "Un éclairage doux avec quelques ombres, qui garde une ambiance calme tout en conservant une visibilité de base.",
    },
    medium: {
      en: "Balanced lighting where the walking path is readable without feeling over-lit.",
      fr: "Un éclairage équilibré où le cheminement reste lisible sans paraître trop éclairé.",
    },
    high: {
      en: "Bright lighting that makes the path and surroundings easier to see.",
      fr: "Un éclairage plus fort qui rend le cheminement et les abords plus faciles à voir.",
    },
  },
  preferred_lighting_distribution: {
    uniform: {
      en: "Even lighting across the walking path and its edges.",
      fr: "Un éclairage régulier sur le cheminement et ses abords.",
    },
    contrasted: {
      en: "Visible differences between lit areas and darker areas.",
      fr: "Des différences visibles entre les zones éclairées et les zones plus sombres.",
    },
    punctual: {
      en: "Localized light sources that create pools of light along the route.",
      fr: "Des sources lumineuses localisées qui créent des zones de lumière le long du parcours.",
    },
  },
  preferred_vegetation_density: {
    low: {
      en: "Few trees or planted edges, with fewer hidden areas.",
      fr: "Peu d'arbres ou de bordures plantées, avec moins de zones cachées.",
    },
    medium: {
      en: "Some vegetation while keeping the route readable.",
      fr: "Un peu de végétation tout en gardant le parcours lisible.",
    },
    high: {
      en: "Dense vegetation and a stronger night-time atmosphere.",
      fr: "Une végétation dense et une ambiance nocturne plus marquée.",
    },
  },
  preferred_spatial_openness: {
    enclosed: {
      en: "A corridor-like route with strong edges and limited long-distance visibility.",
      fr: "Un parcours en couloir, avec des limites fortes et une visibilité lointaine limitée.",
    },
    balanced: {
      en: "A mix of enclosure and openness, with a defined path and some wider views.",
      fr: "Un équilibre entre fermeture et ouverture, avec un cheminement défini et quelques vues plus larges.",
    },
    open: {
      en: "A broad, open route with long views and fewer enclosing edges.",
      fr: "Un parcours large et ouvert, avec des vues lointaines et moins de limites latérales.",
    },
  },
  preferred_sidewalk_condition: {
    narrow_discontinuous: {
      en: "A narrower or interrupted walking surface.",
      fr: "Une surface de marche plus étroite ou discontinue.",
    },
    ordinary: {
      en: "A standard continuous walking surface.",
      fr: "Une surface de marche continue et ordinaire.",
    },
    wide_continuous: {
      en: "A wider continuous route with more room to walk.",
      fr: "Un parcours continu plus large, avec davantage d'espace pour marcher.",
    },
  },
  preferred_obstacles: {
    none: {
      en: "No visible obstacles on or near the walking path.",
      fr: "Aucun obstacle visible sur le cheminement ou à proximité.",
    },
    few: {
      en: "A small number of elements to notice while walking.",
      fr: "Un petit nombre d'éléments à repérer en marchant.",
    },
    many: {
      en: "Several objects or risky areas that may need attention.",
      fr: "Plusieurs objets ou zones à risque qui peuvent demander de l'attention.",
    },
  },
  preferred_activity_indicators: {
    empty: {
      en: "No visible signs of activity.",
      fr: "Aucun signe visible d'activité.",
    },
    some_activity: {
      en: "Some lit windows, signs, or traces of nearby activity.",
      fr: "Quelques fenêtres éclairées, enseignes ou traces d'activité proche.",
    },
    active_frontage: {
      en: "Visible active frontage such as shops, windows, or entrances.",
      fr: "Une façade active visible, comme des commerces, fenêtres ou entrées.",
    },
  },
};

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : "en";
}

export function getContextLanguage(context) {
  return normalizeLanguage(context?.session?.language || document.documentElement.lang || "en");
}

export function localize(value, language) {
  const lang = normalizeLanguage(language);

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[lang] || value.en || Object.values(value)[0] || "";
  }

  return value ?? "";
}

export function t(language, key, replacements = {}) {
  const template = UI_TEXT[normalizeLanguage(language)]?.[key] || UI_TEXT.en[key] || key;

  return Object.entries(replacements).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function questionText(question, language) {
  return localize(question?.text, language);
}

export function optionLabel(value, language) {
  return localize(OPTION_LABELS[value], language) || String(value).replaceAll("_", " ");
}

export function optionPreview(questionId, option, language) {
  return (
    localize(BUILDER_PREVIEWS[questionId]?.[option], language) ||
    (normalizeLanguage(language) === "fr"
      ? "Cette option sera enregistrée comme caractéristique préférée de votre scène."
      : "This option will be saved as your preferred scene characteristic.")
  );
}
