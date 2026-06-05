export const SUPPORTED_LANGUAGES = ["en", "fr"];

// this object contains all interface text in english and french
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
      "You will see several night-time urban scenes in 360 degrees. For each scene, imagine that you are standing at this exact position at night.",
    welcomePath:
      "You cannot move forward, but you can rotate the view to look around. Before answering, please rotate the scene and judge it based on what you can see.",
    welcomePrivacy:
      "There are no right or wrong answers. We are interested in your first impression. The collected data are anonymous and used only for research analysis.",
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
      "Please evaluate the following two environments. Visualize yourself having to traverse one of these locations during the night.",
    scene: "Scene",
    noClearDifference: "No discernible difference",
    progress: "Progress",
    trainingTitle: "Training 360 degree scene",
    trainingIntro: "This serves as a practice scene. Please ensure you rotate the panoramic image before proceeding.",
    fullScreen: "Full screen",
    exitFullScreen: "Exit full screen",
    yawCoverageLabel: "360 degree coverage",
    yawCoverageValue: "{current} / 360 degrees covered",
    detailedTitle: "Detailed scene rating",
    builderTitle: "Ideal scene builder",
    builderIntro:
      "Build the type of night-time walking environment you would personally prefer. There is no correct answer. Choose the options that would make you more willing to walk there at night.",
    validateContinue: "Validate and continue",
    finalSection: "Final section",
    realismTitle: "Realism check",
    realismIntro:
      "These last questions help interpret whether the simulated scenes and lighting were plausible enough for perception analysis.",
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
    nightWalkFrequency: "How often do you usually walk outside at night?",
    placeFamiliarity: "Are you familiar with Nantes or similar urban environments?",
    nightWalkingComfort: "In general, how comfortable do you feel walking alone at night?",
    screenBrightness: "Before starting, is your screen brightness set to a comfortable level for judging night-time images?",
    deviceUsed: "What device are you using?",
    declaredDeviceOnlyTitle: "Computer / laptop required",
    declaredDeviceOnlyBody:
      "Please complete this questionnaire on a computer or laptop. Other devices cannot continue because the 360 degree scenes need a desktop viewing setup.",
    under18: "Under 18",
    sixtyFiveOrOlder: "65 or older",
    preferNotToSay: "Prefer not to say",
    woman: "Woman",
    man: "Man",
    nonBinary: "Non-binary / other",
    neverOrAlmostNever: "Never or almost never",
    rarelyLessThanMonthly: "Rarely, less than once a month",
    occasionallyFewTimesMonthly: "Occasionally, a few times per month",
    regularlyOneTwoWeekly: "Regularly, 1-2 times per week",
    oftenThreeFiveWeekly: "Often, 3-5 times per week",
    almostEveryNight: "Very often, almost every night",
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
      "Vous verrez plusieurs scènes urbaines nocturnes à 360 degrés. Pour chaque scène, imaginez que vous vous trouvez exactement à cette position la nuit.",
    welcomePath:
      "Vous ne pouvez pas avancer, mais vous pouvez faire pivoter la vue pour regarder autour de vous. Avant de répondre, veuillez faire pivoter la scène et la juger à partir de ce que vous pouvez voir.",
    welcomePrivacy:
      "Il n'y a pas de bonne ou de mauvaise réponse. Nous nous intéressons à votre première impression. Les données collectées sont anonymes et utilisées uniquement pour l'analyse de recherche.",
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
      "Veuillez évaluer les deux environnements suivants. Imaginez que vous devez traverser l'un de ces lieux pendant la nuit.",
    scene: "Scène",
    noClearDifference: "Pas de différence discernable",
    progress: "Progression",
    trainingTitle: "Scène d'entraînement à 360 degrés",
    trainingIntro: "Cette scène sert d'entraînement. Veuillez vous assurer de faire pivoter l'image panoramique avant de continuer.",
    fullScreen: "Plein écran",
    exitFullScreen: "Quitter le plein écran",
    yawCoverageLabel: "Couverture à 360 degrés",
    yawCoverageValue: "{current} / 360 degrés couverts",
    detailedTitle: "Évaluation détaillée de la scène",
    builderTitle: "Construction de la scène idéale",
    builderIntro:
      "Construisez le type d'environnement de marche nocturne que vous préféreriez personnellement. Il n'y a pas de bonne réponse. Choisissez les options qui vous donneraient davantage envie d'y marcher la nuit.",
    validateContinue: "Valider et continuer",
    finalSection: "Dernière section",
    realismTitle: "Contrôle du réalisme",
    realismIntro:
      "Ces dernières questions aident à savoir si les scènes simulées et l'éclairage étaient suffisamment plausibles pour l'analyse des perceptions.",
    finishSurvey: "Terminer le questionnaire",
    optionalComment: "Commentaire facultatif",
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
    declaredDeviceOnlyTitle: "Ordinateur requis",
    declaredDeviceOnlyBody:
      "Veuillez réaliser ce questionnaire sur un ordinateur. Les autres appareils ne peuvent pas continuer, car les scènes à 360 degrés nécessitent une configuration de visualisation de bureau.",
    under18: "Moins de 18 ans",
    sixtyFiveOrOlder: "65 ans ou plus",
    preferNotToSay: "Préfère ne pas répondre",
    woman: "Femme",
    man: "Homme",
    nonBinary: "Non binaire / autre",
    neverOrAlmostNever: "Jamais ou presque jamais",
    rarelyLessThanMonthly: "Rarement, moins d'une fois par mois",
    occasionallyFewTimesMonthly: "Occasionnellement, quelques fois par mois",
    regularlyOneTwoWeekly: "Régulièrement, 1 à 2 fois par semaine",
    oftenThreeFiveWeekly: "Souvent, 3 à 5 fois par semaine",
    almostEveryNight: "Très souvent, presque toutes les nuits",
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
    other: "Autre",
    questionNumber: "Question {number}",
  },
};

// this object contains labels for shared answer options
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
  none: { en: "None", fr: "Aucun" },
  few: { en: "Few", fr: "Quelques-uns" },
  many: { en: "Many", fr: "Nombreux" },
  empty: { en: "Empty", fr: "Vide" },
  some_activity: { en: "Some activity", fr: "Un peu d'activité" },
  active_frontage: { en: "Active frontage", fr: "Façade active" },
  partly: { en: "Partly", fr: "Partiellement" },
  slightly: { en: "Slightly", fr: "Légèrement" },
  moderately: { en: "Moderately", fr: "Modérément" },
  a_lot: { en: "A lot", fr: "Beaucoup" },
  dont_know: { en: "I do not know", fr: "Je ne sais pas" },
  yes: { en: "Yes", fr: "Oui" },
  no: { en: "No", fr: "Non" },
  not_sure: { en: "I do not know", fr: "Je ne sais pas" },
  no_clear_difference: { en: "No discernible difference", fr: "Pas de différence discernable" },
};

// this object contains labels that depend on the question
const QUESTION_OPTION_LABELS = {
  preferred_lighting_intensity: {
    low: { en: "Low lighting", fr: "Éclairage faible" },
    medium: { en: "Medium lighting", fr: "Éclairage moyen" },
    high: { en: "High lighting", fr: "Éclairage élevé" },
  },
  preferred_lighting_distribution: {
    uniform: { en: "Even lighting along the path", fr: "Éclairage régulier le long du chemin" },
    contrasted: { en: "Some brighter and darker areas", fr: "Quelques zones plus claires et plus sombres" },
    punctual: { en: "A few punctual light sources", fr: "Quelques sources lumineuses ponctuelles" },
  },
  preferred_vegetation_density: {
    low: { en: "Little or no vegetation", fr: "Peu ou pas de végétation" },
    medium: { en: "Moderate, well-lit vegetation", fr: "Végétation modérée et bien éclairée" },
    high: { en: "Dense vegetation", fr: "Végétation dense" },
  },
  preferred_spatial_openness: {
    open: { en: "Open, with long views", fr: "Ouvert, avec des vues longues" },
    balanced: {
      en: "Balanced, partly enclosed but still easy to see",
      fr: "Équilibré, partiellement fermé mais encore facile à voir",
    },
    enclosed: { en: "More enclosed and intimate", fr: "Plus fermé et intime" },
  },
  preferred_sidewalk_condition: {
    ordinary: { en: "Ordinary sidewalk", fr: "Trottoir ordinaire" },
    narrow_discontinuous: { en: "Narrow or discontinuous sidewalk", fr: "Trottoir étroit ou discontinu" },
  },
  preferred_obstacles: {
    none: { en: "No visible obstacles", fr: "Aucun obstacle visible" },
    few: { en: "A few minor obstacles", fr: "Quelques obstacles mineurs" },
    many: { en: "Many obstacles or irregular areas", fr: "De nombreux obstacles ou zones irrégulières" },
  },
  preferred_activity_indicators: {
    empty: { en: "Quiet and empty", fr: "Calme et vide" },
    some_activity: { en: "Some visible activity", fr: "Un peu d'activité visible" },
    active_frontage: { en: "Active / lively street", fr: "Rue active / animée" },
  },
};

// this object contains the descriptions shown for ideal builder options
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

// this function is for making sure the language is supported
export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : "en";
}

// this function is for getting the current language from the survey context
export function getContextLanguage(context) {
  return normalizeLanguage(context?.session?.language || document.documentElement.lang || "en");
}

// this function is for choosing the translated value from an object
export function localize(value, language) {
  const lang = normalizeLanguage(language);

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[lang] || value.en || Object.values(value)[0] || "";
  }

  return value ?? "";
}

// this function is for translating a text key and replacing variables
export function t(language, key, replacements = {}) {
  const template = UI_TEXT[normalizeLanguage(language)]?.[key] || UI_TEXT.en[key] || key;

  return Object.entries(replacements).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

// this function is for reading the translated question text
export function questionText(question, language) {
  return localize(question?.text, language);
}

// this function is for reading the translated option label
export function optionLabel(value, language, questionId = null) {
  return (
    localize(QUESTION_OPTION_LABELS[questionId]?.[value], language) ||
    localize(OPTION_LABELS[value], language) ||
    String(value).replaceAll("_", " ")
  );
}

// this function is for reading the preview text of a builder option
export function optionPreview(questionId, option, language) {
  return (
    localize(BUILDER_PREVIEWS[questionId]?.[option], language) ||
    (normalizeLanguage(language) === "fr"
      ? "Cette option sera enregistrée comme caractéristique préférée de votre scène."
      : "This option will be saved as your preferred scene characteristic.")
  );
}
