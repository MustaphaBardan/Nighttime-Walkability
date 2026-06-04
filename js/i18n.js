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
    desktopOnlyTitle: "Computer required",
    desktopOnlyBody:
      "This survey must be completed on a computer or laptop with a desktop-sized browser window. Please switch device or enlarge the browser window before starting.",
    languageLabel: "Choose language",
    english: "English",
    french: "Français",
    startSurvey: "Start survey",
    continueSurvey: "Continue survey",
    surveyScene: "Survey scene",
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
    pairwiseIntro: "Imagine that you have to walk through one of these places at night.",
    pairwiseStart: "Start pairwise comparison",
    pairwiseIntroBody:
      "You will compare pairs of static 360 degree night scenes. Rotate each view before choosing the scene that best matches each question.",
    scene: "Scene",
    noClearDifference: "No clear difference",
    progress: "Progress",
    trainingTitle: "Training 360 degree scene",
    trainingIntro: "Click Full screen to enter the 360 degree image, then rotate once before the real questions.",
    fullScreen: "Full screen",
    exitFullScreen: "Exit full screen",
    yawCoverageLabel: "360 degree coverage",
    yawCoverageValue: "{current} / 360 degrees covered",
    detailedTitle: "Detailed scene rating",
    builderTitle: "Ideal scene builder",
    validateContinue: "Validate and continue",
    finalSection: "Final section",
    realismTitle: "Realism check",
    realismIntro:
      "These last questions help interpret whether the simulated 360 degree scenes and lighting were plausible enough to judge.",
    finishSurvey: "Finish survey",
    optionalComment: "Comment",
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
    nightWalkFrequency: "How often do you usually walk outside at night?",
    placeFamiliarity: "Are you familiar with Nantes or similar urban environments?",
    nightWalkingComfort: "In general, how comfortable do you feel walking alone at night?",
    screenBrightness: "Before starting, is your screen brightness set to a comfortable level for judging night-time images?",
    deviceUsed: "What device are you using?",
    under18: "Under 18",
    preferNotToSay: "Prefer not to say",
    woman: "Woman",
    man: "Man",
    nonBinary: "Non-binary",
    selfDescribe: "Prefer to self-describe",
    neverOrAlmostNever: "Never or almost never",
    rarelyLessThanMonthly: "Rarely, less than once a month",
    occasionallyFewTimesMonthly: "Occasionally, a few times per month",
    regularlyOneTwoWeekly: "Regularly, 1-2 times per week",
    oftenThreeFiveWeekly: "Often, 3-5 times per week",
    almostEveryNight: "Almost every night",
    yesVeryFamiliarNantes: "Yes, very familiar with Nantes",
    somewhatFamiliarNantes: "Somewhat familiar with Nantes",
    similarUrbanEnvironment: "Not familiar with Nantes, but familiar with similar urban environments",
    notFamiliarEnvironment: "Not familiar with this type of environment",
    notComfortableAtAll: "Not comfortable at all",
    slightlyComfortable: "Slightly comfortable",
    moderatelyComfortable: "Moderately comfortable",
    comfortable: "Comfortable",
    veryComfortable: "Very comfortable",
    yes: "Yes",
    no: "No",
    notSure: "I am not sure",
    computerLaptop: "Computer / laptop",
    tablet: "Tablet",
    smartphone: "Smartphone",
    vrHeadset: "VR headset",
    other: "Other",
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
      "Vous êtes invité(e)s à répondre à ce questionnaire en ligne dans le cadre d'un projet de recherche sur la perception des environnements urbains nocturnes. Le temps de réponse estimé est d'environ 10 minutes.",
    welcomePath:
      "Vous répondrez à de courtes questions sur des scènes urbaines simulées, notamment sur la sécurité ressentie, le confort, la visibilité et la préférence d'itinéraire.",
    welcomePrivacy:
      "Afin de respecter les droits et la vie privée des participant(e)s, les données collectées sont anonymes et utilisées uniquement pour l'analyse de recherche.",
    desktopOnlyTitle: "Ordinateur requis",
    desktopOnlyBody:
      "Ce questionnaire doit être réalisé sur un ordinateur avec une fenêtre de navigateur de taille bureau. Veuillez changer d'appareil ou agrandir la fenêtre avant de commencer.",
    languageLabel: "Choisir la langue",
    english: "English",
    french: "Français",
    startSurvey: "Commencer le questionnaire",
    continueSurvey: "Continuer le questionnaire",
    surveyScene: "Scène du questionnaire",
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
    pairwiseIntro: "Imaginez que vous devez marcher dans l'un de ces lieux la nuit.",
    pairwiseStart: "Commencer la comparaison",
    pairwiseIntroBody:
      "Vous allez comparer des paires de scènes nocturnes simulées à 360 degrés. Faites pivoter chaque vue avant de choisir la scène qui correspond le mieux à chaque question.",
    scene: "Scène",
    noClearDifference: "Pas de différence claire",
    progress: "Progression",
    trainingTitle: "Scène d'entraînement à 360 degrés",
    trainingIntro: "Cliquez sur Plein écran pour entrer dans l'image à 360 degrés, puis faites un tour avant les vraies questions.",
    fullScreen: "Plein écran",
    exitFullScreen: "Quitter le plein écran",
    yawCoverageLabel: "Couverture à 360 degrés",
    yawCoverageValue: "{current} / 360 degrés couverts",
    detailedTitle: "Évaluation détaillée de la scène",
    builderTitle: "Construction de la scène idéale",
    validateContinue: "Valider et continuer",
    finalSection: "Dernière section",
    realismTitle: "Contrôle du réalisme",
    realismIntro:
      "Ces dernières questions aident à savoir si les scènes simulées à 360 degrés et l'éclairage étaient suffisamment plausibles pour être jugés.",
    finishSurvey: "Terminer le questionnaire",
    optionalComment: "Commentaire",
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
    nightWalkFrequency: "À quelle fréquence marchez-vous habituellement dehors la nuit ?",
    placeFamiliarity: "Connaissez-vous Nantes ou des environnements urbains similaires ?",
    nightWalkingComfort: "En général, à quel point vous sentez-vous à l'aise en marchant seul(e) la nuit ?",
    screenBrightness: "Avant de commencer, la luminosité de votre écran est-elle confortable pour juger des images nocturnes ?",
    deviceUsed: "Quel appareil utilisez-vous ?",
    under18: "Moins de 18 ans",
    preferNotToSay: "Préfère ne pas répondre",
    woman: "Femme",
    man: "Homme",
    nonBinary: "Non binaire",
    selfDescribe: "Préfère se décrire",
    neverOrAlmostNever: "Jamais ou presque jamais",
    rarelyLessThanMonthly: "Rarement, moins d'une fois par mois",
    occasionallyFewTimesMonthly: "Occasionnellement, quelques fois par mois",
    regularlyOneTwoWeekly: "Régulièrement, 1 à 2 fois par semaine",
    oftenThreeFiveWeekly: "Souvent, 3 à 5 fois par semaine",
    almostEveryNight: "Presque toutes les nuits",
    yesVeryFamiliarNantes: "Oui, très familier avec Nantes",
    somewhatFamiliarNantes: "Assez familier avec Nantes",
    similarUrbanEnvironment: "Pas familier avec Nantes, mais familier avec des environnements urbains similaires",
    notFamiliarEnvironment: "Pas familier avec ce type d'environnement",
    notComfortableAtAll: "Pas du tout à l'aise",
    slightlyComfortable: "Légèrement à l'aise",
    moderatelyComfortable: "Modérément à l'aise",
    comfortable: "À l'aise",
    veryComfortable: "Très à l'aise",
    yes: "Oui",
    no: "Non",
    notSure: "Je ne suis pas sûr(e)",
    computerLaptop: "Ordinateur",
    tablet: "Tablette",
    smartphone: "Smartphone",
    vrHeadset: "Casque VR",
    other: "Autre",
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
  dont_know: { en: "I do not know", fr: "Je ne sais pas" },
  yes: { en: "Yes", fr: "Oui" },
  no: { en: "No", fr: "Non" },
  not_sure: { en: "I do not know", fr: "Je ne sais pas" },
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
