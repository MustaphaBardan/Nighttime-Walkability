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
      "This survey is part of the LUNNE project, which studies night-time urban ambiances and night walkability. Walkability refers to how easily a space can be travelled on foot. At night, it depends in particular on visibility, spatial legibility, comfort, perceived safety, and lighting conditions.",
    welcomePath:
      "For each 360 degree night-time urban scene, explore the scene using the panoramic view and look carefully around you before answering. Imagine that you are standing at that exact location at night. You can look around, but you cannot move through the scene. Fullscreen mode is recommended.",
    welcomePrivacy:
      "There are no right or wrong answers. We are interested in your first impression. The collected data are anonymous and used only for research analysis.",
    desktopOnlyTitle: "Larger display required",
    desktopOnlyBody:
      "This survey requires a browser area of at least 900 by 600 pixels to observe the night scenes correctly. Please enlarge the window or try again from a computer, tablet, or sufficiently large display.",
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
    pairwiseIntro:
      "Compare the two scenes and answer based on your first impression after looking around.",
    pairwiseStart: "Start pairwise comparison",
    pairwiseIntroBody:
      "Compare the two scenes and answer based on your first impression after looking around.",
    scene: "Scene",
    sceneA: "Scene A",
    sceneB: "Scene B",
    left: "Left",
    right: "Right",
    noClearDifference: "No discernible difference",
    progress: "Progress",
    trainingTitle: "360 degree and route-continuation tutorial",
    trainingIntro:
      "Use these two practice scenes to learn how to explore a 360 degree panorama and how to assess route continuation. Use fullscreen if possible, then rotate either scene to inspect the surroundings. The two views are coupled and synchronized: when you rotate one, the other follows the same movement. In the first scene, the route is readable, while in the second it is unreadable because its continuation is hidden or ambiguous. You can look around from the fixed viewpoint, but you cannot move through the scene.",
    routeExamplesTitle: "Understanding route-continuation examples",
    routeExamplesIntro:
      "These examples show the difference between a route that is easy to follow and one whose continuation is hidden or ambiguous.",
    clearRouteTitle: "Readable route continuity",
    clearRouteDescription:
      "The walking path remains readable as it continues forward. You can easily understand where you could go next.",
    unclearRouteTitle: "Unreadable route continuity",
    unclearRouteDescription:
      "The walking path is unreadable because it is interrupted, hidden, ambiguous, or visually confusing. It is difficult to understand where the route continues.",
    fullScreen: "Full screen",
    exitFullScreen: "Exit full screen",
    yawCoverageLabel: "360 degree coverage",
    yawCoverageValue: "{current} / 360 degrees covered",
    yawRequirement: "Rotate the panorama to inspect at least {required}°. Current coverage: {current}°.",
    panoramaFallbackNotice: "Interactive panorama viewing is unavailable. You may continue after answering.",
    neutralCommentRequirement: "A neutral answer requires an explanation of at least {minimum} characters.",
    responseReady: "The response is ready to continue.",
    detailedTitle: "Detailed scene rating",
    detailedIntro:
      "You will inspect one 360 degree scene at a time and rate statements from your first impression after looking around.",
    detailedStart: "Start detailed ratings",
    builderTitle: "Ideal scene builder",
    builderIntro:
      "Choose the characteristics of the night-time scene where you would prefer to walk. There is no correct answer: choose the variables that would make you more willing to walk at night.",
    builderOptionalTitle: "Optional ideal scene activity",
    builderOptionalIntro:
      "You may build your preferred night-time walking scene, or skip this optional activity and continue the survey.",
    buildScene: "Build a scene",
    skipSceneBuilder: "Skip this optional activity",
    validateContinue: "Validate and continue",
    finalSection: "Final section",
    realismTitle: "Realism check",
    realismIntro:
      "These last questions help interpret whether the simulated scenes and lighting were plausible enough for perception analysis.",
    finishSurvey: "Finish survey",
    saveSurvey: "Save responses",
    viewSummary: "View my summary",
    responseSummary: "Your response summary",
    summaryCompleted: "Survey completed",
    summaryIntro: "Here is a concise reading of the preferences reflected in your answers.",
    summaryTendencies: "What stood out",
    summaryPreferences: "Your ideal scene",
    summaryNote: "How to read this",
    creditsTitle: "Legal notice and asset credits",
    acknowledgementsTitle: "Acknowledgements",
    softwareLicense: "Website software — MIT License",
    close: "Close",
    optionalComment: "Optional comment",
    responseCommentPrompt: "Why this choice?",
    requiredCommentPrompt: "Why this neutral choice? (required)",
    requiredCommentPlaceholder: "Enter at least 10 characters",
    initialImpression:
      "Before seeing the scenes, what comes to mind when you think about walking outside at night?",
    showParameters: "Show parameters",
    hideParameters: "Hide parameters",
    characterLimit: "{current} / {limit} characters",
    stronglyDisagree: "Strongly disagree",
    disagree: "Disagree",
    neitherAgreeNorDisagree: "Neither agree nor disagree",
    agree: "Agree",
    stronglyAgree: "Strongly agree",
    sectionComplete: "Section complete",
    savingComplete: "Saving your complete response...",
    savingProgress: "Saving your response",
    savingSummary: "Saving your response...",
    sectionSaved: "This section is saved on this browser.",
    completeRecorded: "Your complete response has been recorded.",
    completeSavedLocal:
      "Your response is saved on this browser, but delivery to the research team is not yet confirmed.",
    submissionConnectionWarningTitle: "Response service could not be reached",
    submissionConnectionWarningBody:
      "Your network, VPN, or browser may prevent delivery to Google. You may continue, but please retry this check or change networks before finishing.",
    retryConnection: "Retry connection check",
    checkingConnection: "Checking connection...",
    deliveryStatusTitle: "Response delivery",
    submissionConfirmed: "Google confirmed that your complete response was recorded.",
    submissionRetrying: "Trying to confirm delivery of your response...",
    submissionUnconfirmed: "Delivery is not yet confirmed. Your anonymous browser copy is available for retry.",
    retrySubmission: "Retry sending response",
    ageRange: "Age range",
    gender: "Gender",
    nightWalkFrequency: "How often do you usually walk outside at night?",
    placeFamiliarity: "Are you familiar with Nantes or with similar urban environments?",
    nightWalkingComfort: "In general, how comfortable do you feel walking alone at night?",
    activityExpertise: "What is your field of activity or expertise?",
    selectAllThatApply: "Select all that apply.",
    selectAtLeastOneOption: "Please select at least one option.",
    lightingKnowledge: "What is your level of knowledge about lighting?",
    expertiseUrbanDesign: "Urban planning / architecture / landscape",
    expertiseLighting: "Lighting / public lighting / lighting design",
    expertiseResearch: "Research / higher education",
    expertiseStudent: "Student",
    expertisePublicAuthority: "Public authority / local government",
    expertiseManufacturer: "Light manufacturer",
    noSpecificExpertise: "No specific expertise related to the topic",
    lightingKnowledgeNone: "No particular knowledge",
    lightingKnowledgeBasic: "Basic knowledge",
    lightingKnowledgeFamiliar: "Familiar with the topic",
    lightingKnowledgeExpert: "Professional or expert level",
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
      "Cette enquête s'inscrit dans le cadre du projet LUNNE, consacré à l'étude des ambiances nocturnes et de la marchabilité la nuit. La marchabilité désigne la facilité avec laquelle un espace peut être parcouru à pied. La nuit, elle dépend notamment de la visibilité, de la lisibilité de l'espace, du confort, du sentiment de sécurité et des conditions lumineuses.",
    welcomePath:
      "Pour chaque scène urbaine nocturne à 360 degrés, explorez la scène de façon panoramique et regardez attentivement autour de vous avant de répondre. Imaginez que vous vous trouvez exactement à cet endroit la nuit. Vous pouvez regarder autour de vous, mais vous ne pouvez pas vous déplacer. Le plein écran est recommandé.",
    welcomePrivacy:
      "Il n'y a pas de bonne ou de mauvaise réponse. Nous nous intéressons à votre première impression. Les données collectées sont anonymes et utilisées uniquement pour l'analyse de recherche.",
    desktopOnlyTitle: "Écran plus grand requis",
    desktopOnlyBody:
      "Cette enquête nécessite une zone de navigateur d'au moins 900 par 600 pixels. Agrandissez la fenêtre ou réessayez depuis un ordinateur, une tablette ou un écran suffisamment grand.",
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
    pairwiseIntro:
      "Comparez les deux scènes et répondez selon votre première impression après avoir regardé autour de vous.",
    pairwiseStart: "Commencer la comparaison",
    pairwiseIntroBody:
      "Comparez les deux scènes et répondez selon votre première impression après avoir regardé autour de vous.",
    scene: "Scène",
    sceneA: "Scène A",
    sceneB: "Scène B",
    left: "Gauche",
    right: "Droite",
    noClearDifference: "Pas de différence discernable",
    progress: "Progression",
    trainingTitle: "Tutoriel à 360 degrés et continuité de l'itinéraire",
    trainingIntro:
      "Utilisez ces deux scènes d'entraînement pour apprendre à explorer un panorama à 360 degrés et à évaluer la continuité de l'itinéraire. Utilisez le plein écran si possible, puis faites pivoter l'une des scènes pour inspecter les environs. Les deux vues sont couplées et synchronisées : lorsque vous faites pivoter l'une, l'autre suit le même mouvement. Dans la première scène, la continuité est lisible, tandis que dans la seconde elle est illisible, car elle est cachée ou ambiguë. Vous pouvez regarder autour de vous depuis le point de vue fixe, mais vous ne pouvez pas vous déplacer dans la scène.",
    routeExamplesTitle: "Comprendre les exemples de continuité du parcours",
    routeExamplesIntro:
      "Ces exemples montrent la différence entre un parcours facile à suivre et un parcours dont la continuité est cachée ou ambiguë.",
    clearRouteTitle: "Continuité lisible",
    clearRouteDescription:
      "Le cheminement reste lisible lorsqu'il se poursuit vers l'avant. Vous pouvez facilement comprendre où aller ensuite.",
    unclearRouteTitle: "Continuité illisible",
    unclearRouteDescription:
      "Le cheminement est illisible, car il est interrompu, caché, ambigu ou visuellement confus. Il est difficile de comprendre où le parcours se poursuit.",
    fullScreen: "Plein écran",
    exitFullScreen: "Quitter le plein écran",
    yawCoverageLabel: "Couverture à 360 degrés",
    yawCoverageValue: "{current} / 360 degrés couverts",
    yawRequirement: "Faites pivoter le panorama pour inspecter au moins {required}°. Couverture actuelle : {current}°.",
    panoramaFallbackNotice: "La vue panoramique interactive est indisponible. Vous pouvez continuer après avoir répondu.",
    neutralCommentRequirement: "Une réponse neutre nécessite une explication d'au moins {minimum} caractères.",
    responseReady: "La réponse est prête à être validée.",
    detailedTitle: "Évaluation détaillée de la scène",
    detailedIntro:
      "Vous examinerez une scène à 360 degrés à la fois et évaluerez des affirmations selon votre première impression après avoir regardé autour de vous.",
    detailedStart: "Commencer les évaluations détaillées",
    builderTitle: "Construction de la scène idéale",
    builderIntro:
      "Choisissez les caractéristiques de la scène nocturne dans laquelle vous préféreriez marcher. Il n'y a pas de bonne réponse : choisissez les variables qui vous rendraient le plus disposé(e) à marcher la nuit.",
    builderOptionalTitle: "Activité facultative de scène idéale",
    builderOptionalIntro:
      "Vous pouvez construire votre scène de marche nocturne préférée ou ignorer cette activité facultative et continuer le questionnaire.",
    buildScene: "Construire une scène",
    skipSceneBuilder: "Ignorer cette activité facultative",
    validateContinue: "Valider et continuer",
    finalSection: "Dernière section",
    realismTitle: "Contrôle du réalisme",
    realismIntro:
      "Ces dernières questions aident à savoir si les scènes simulées et l'éclairage étaient suffisamment plausibles pour l'analyse des perceptions.",
    finishSurvey: "Terminer le questionnaire",
    saveSurvey: "Enregistrer les réponses",
    viewSummary: "Voir mon bilan",
    responseSummary: "Bilan de vos réponses",
    summaryCompleted: "Questionnaire terminé",
    summaryIntro: "Voici une lecture synthétique des préférences qui ressortent de vos réponses.",
    summaryTendencies: "Ce qui ressort",
    summaryPreferences: "Votre scène idéale",
    summaryNote: "Comment lire ce bilan",
    creditsTitle: "Mentions légales et crédits des ressources",
    acknowledgementsTitle: "Remerciements",
    softwareLicense: "Logiciel du site — licence MIT",
    close: "Fermer",
    optionalComment: "Commentaire facultatif",
    responseCommentPrompt: "Pourquoi ce choix ?",
    requiredCommentPrompt: "Pourquoi ce choix neutre ? (obligatoire)",
    requiredCommentPlaceholder: "Saisissez au moins 10 caractères",
    initialImpression:
      "Avant de voir les scènes, qu'est-ce qui vous vient à l'esprit quand vous pensez à marcher dehors la nuit ?",
    showParameters: "Afficher les paramètres",
    hideParameters: "Masquer les paramètres",
    characterLimit: "{current} / {limit} caractères",
    stronglyDisagree: "Pas du tout d'accord",
    disagree: "Pas d'accord",
    neitherAgreeNorDisagree: "Ni d'accord ni pas d'accord",
    agree: "D'accord",
    stronglyAgree: "Tout à fait d'accord",
    sectionComplete: "Section terminée",
    savingComplete: "Enregistrement de votre réponse complète...",
    savingProgress: "Enregistrement de votre réponse",
    savingSummary: "Enregistrement de votre réponse...",
    sectionSaved: "Cette section est enregistrée dans ce navigateur.",
    completeRecorded: "Votre réponse complète a été enregistrée.",
    completeSavedLocal:
      "Votre réponse est enregistrée dans ce navigateur, mais sa transmission à l'équipe de recherche n'est pas encore confirmée.",
    submissionConnectionWarningTitle: "Le service de réponse est inaccessible",
    submissionConnectionWarningBody:
      "Votre réseau, VPN ou navigateur peut empêcher la transmission à Google. Vous pouvez continuer, mais veuillez réessayer ce contrôle ou changer de réseau avant de terminer.",
    retryConnection: "Réessayer la connexion",
    checkingConnection: "Vérification de la connexion...",
    deliveryStatusTitle: "Transmission de la réponse",
    submissionConfirmed: "Google a confirmé l'enregistrement de votre réponse complète.",
    submissionRetrying: "Tentative de confirmation de la transmission de votre réponse...",
    submissionUnconfirmed: "La transmission n'est pas encore confirmée. La copie anonyme du navigateur reste disponible pour réessayer.",
    retrySubmission: "Réessayer l'envoi",
    ageRange: "Tranche d'âge",
    gender: "Genre",
    nightWalkFrequency: "À quelle fréquence marchez-vous habituellement dehors la nuit ?",
    placeFamiliarity: "Connaissez-vous Nantes ou des environnements urbains similaires ?",
    nightWalkingComfort: "En général, à quel point vous sentez-vous à l'aise en marchant seul(e) la nuit ?",
    activityExpertise: "Quel est votre domaine d'activité ou d'expertise ?",
    selectAllThatApply: "Sélectionnez toutes les réponses qui s'appliquent.",
    selectAtLeastOneOption: "Veuillez sélectionner au moins une réponse.",
    lightingKnowledge: "Quel est votre niveau de connaissance en éclairage ?",
    expertiseUrbanDesign: "Urbanisme / architecture / paysage",
    expertiseLighting: "Éclairage / éclairage public / conception lumière",
    expertiseResearch: "Recherche / enseignement supérieur",
    expertiseStudent: "Étudiant(e)",
    expertisePublicAuthority: "Collectivité / administration publique",
    expertiseManufacturer: "Fabricant de luminaires",
    noSpecificExpertise: "Pas d'expertise particulière liée au sujet",
    lightingKnowledgeNone: "Aucune connaissance particulière",
    lightingKnowledgeBasic: "Connaissances de base",
    lightingKnowledgeFamiliar: "Sujet familier",
    lightingKnowledgeExpert: "Niveau professionnel ou expert",
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
    slightlyComfortable: "Peu à l'aise",
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
    dont_know: { en: "I do not know", fr: "Je ne sais pas" },
  },
  preferred_lighting_distribution: {
    uniform: { en: "Even lighting along the path", fr: "Éclairage régulier le long du chemin" },
    contrasted: { en: "Some brighter and darker areas", fr: "Quelques zones plus claires et plus sombres" },
    punctual: { en: "A few punctual light sources", fr: "Quelques sources lumineuses ponctuelles" },
  },
  preferred_vegetation_density: {
    low: { en: "Little or no vegetation", fr: "Peu ou pas de végétation" },
    medium: { en: "Moderate vegetation", fr: "Végétation modérée" },
    high: { en: "A large amount of vegetation", fr: "Végétation importante" },
    none: { en: "No vegetation", fr: "Sans végétation" },
    half: { en: "Half-density vegetation", fr: "Végétation à densité moyenne" },
    full: { en: "Full-density vegetation", fr: "Végétation dense" },
    dont_know: { en: "I do not know", fr: "Je ne sais pas" },
  },
  preferred_vegetation_lighting: {
    dark: { en: "Dark vegetation edge", fr: "Lisière végétale sombre" },
    lit: { en: "Lit vegetation edge", fr: "Lisière végétale éclairée" },
    dont_know: { en: "I do not know", fr: "Je ne sais pas" },
  },
  preferred_path_lighting: {
    dark: { en: "Dark path", fr: "Cheminement sombre" },
    lit: { en: "Lit path", fr: "Cheminement éclairé" },
    dont_know: { en: "I do not know", fr: "Je ne sais pas" },
  },
  preferred_obstacle_condition: {
    clear: { en: "Clear path", fr: "Cheminement dégagé" },
    present: { en: "Obstacles present", fr: "Obstacles présents" },
    dont_know: { en: "I do not know", fr: "Je ne sais pas" },
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
    wide_continuous: { en: "Wide and continuous sidewalk", fr: "Trottoir large et continu" },
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
