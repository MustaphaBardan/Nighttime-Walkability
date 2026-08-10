export const SCENARIO_ORDER = ["A", "B", "C", "D"];

export const EXPECTED_SCENARIO_COUNTS = {
  A: 16,
  B: 8,
  C: 24,
  D: 8,
};

export const SCENARIO_C_BUILDER_FIELDS = {
  preferred_vegetation_density: {
    parameter: "vegetation_density",
    options: ["none", "half", "full", "dont_know"],
  },
  preferred_vegetation_lighting: {
    parameter: "vegetation_lighting",
    options: ["dark", "lit", "dont_know"],
  },
  preferred_path_lighting: {
    parameter: "path_lighting",
    options: ["dark", "lit", "dont_know"],
  },
  preferred_obstacle_condition: {
    parameter: "obstacles",
    options: ["clear", "present", "dont_know"],
  },
};

const SCENARIO_DEFINITIONS = {
  A: {
    tokens: ["Dc", "W", "C", "O"],
    canonicalOrder: ["W", "Dc", "C", "O"],
    defaults: {
      facade_window_lighting: "dark",
      lighting_distribution: "discontinuous",
      route_exit_readability: "unreadable",
      obstacles: "clear",
    },
    active: {
      W: ["facade_window_lighting", "lit"],
      Dc: ["lighting_distribution", "continuous"],
      C: ["route_exit_readability", "readable"],
      O: ["obstacles", "present"],
    },
  },
  B: {
    tokens: ["Vo", "Cl", "Cp"],
    canonicalOrder: ["Vo", "Cl", "Cp"],
    defaults: {
      vehicle_presence: "absent",
      corner_lighting: "dark",
      path_continuation: "unreadable",
    },
    active: {
      Vo: ["vehicle_presence", "present"],
      Cl: ["corner_lighting", "lit"],
      Cp: ["path_continuation", "readable"],
    },
  },
  C: {
    tokens: ["Lg", "Pl", "O"],
    canonicalOrder: ["Lg", "Pl", "O"],
    defaults: {
      vegetation_lighting: "dark",
      path_lighting: "dark",
      obstacles: "clear",
    },
    active: {
      Lg: ["vegetation_lighting", "lit"],
      Pl: ["path_lighting", "lit"],
      O: ["obstacles", "present"],
    },
  },
  D: {
    tokens: ["Sl", "Ob", "Ol"],
    canonicalOrder: ["Sl", "Ob", "Ol"],
    defaults: {
      streetlight_level: "dim",
      obstacles_parking: "clear",
      overlighting_contrast: "controlled",
    },
    active: {
      Sl: ["streetlight_level", "moderate"],
      Ob: ["obstacles_parking", "present"],
      Ol: ["overlighting_contrast", "harsh"],
    },
  },
};

// Parse one source filename into the normalized scenario parameter-state interface.
export function parseScenarioSourceFilename(scenarioGroup, filename) {
  const group = String(scenarioGroup || "").toUpperCase();
  const definition = SCENARIO_DEFINITIONS[group];

  if (!definition) {
    throw new Error(`Unsupported scenario group: ${scenarioGroup}`);
  }

  if (!String(filename).toLowerCase().endsWith(".png")) {
    return { status: "excluded", reason: "not a PNG panorama" };
  }

  let stem = String(filename).slice(0, -4);
  const states = { ...definition.defaults };
  let densityToken = "";

  if (group === "C") {
    if (stem.startsWith("T1")) {
      densityToken = "T1";
      states.vegetation_density = "full";
      stem = stem.slice(2);
    } else if (stem.startsWith("T2")) {
      densityToken = "T2";
      states.vegetation_density = "half";
      stem = stem.slice(2);
    } else {
      states.vegetation_density = "none";
    }
  }

  if (stem.toLowerCase() === "nth") {
    stem = "";
  }

  const presentTokens = parseTokens(stem, definition.tokens, group, filename);
  for (const token of presentTokens) {
    const [parameter, value] = definition.active[token];
    states[parameter] = value;
  }

  const orderedTokens = definition.canonicalOrder.filter((token) => presentTokens.includes(token));
  const variantKey = `${densityToken}${orderedTokens.join("")}` || "baseline";

  return {
    status: "included",
    scenarioGroup: group,
    variantKey,
    parameterStates: states,
  };
}

// Return only Scenario C variants that agree with every known builder answer.
export function getCompatibleScenarioCVariants(variants = [], selections = {}) {
  return variants.filter((variant) => {
    if (variant.scenario_group !== "C") {
      return false;
    }

    return Object.entries(SCENARIO_C_BUILDER_FIELDS).every(([questionId, field]) => {
      const selection = selections[questionId];
      return !selection
        || selection === "dont_know"
        || variant.parameter_states?.[field.parameter] === selection;
    });
  });
}

// Check which options still lead to at least one exact known-state preview.
export function getScenarioCOptionAvailability(variants, selections, questionId) {
  const field = SCENARIO_C_BUILDER_FIELDS[questionId];
  if (!field) {
    return {};
  }

  return Object.fromEntries(field.options.map((option) => {
    if (option === "dont_know") {
      return [option, true];
    }

    const candidateSelections = { ...selections, [questionId]: option };
    return [option, getCompatibleScenarioCVariants(variants, candidateSelections).length > 0];
  }));
}

// Pick a stable compatible preview, preferring half density and fewer active unknown flags.
export function chooseScenarioCPreview(variants = [], selections = {}) {
  const compatible = getCompatibleScenarioCVariants(variants, selections);
  const knownParameters = new Set(Object.entries(SCENARIO_C_BUILDER_FIELDS)
    .filter(([questionId]) => selections[questionId] && selections[questionId] !== "dont_know")
    .map(([, field]) => field.parameter));

  return [...compatible].sort((left, right) => {
    const scoreDifference = previewScore(left, knownParameters) - previewScore(right, knownParameters);
    return scoreDifference || String(left.variant_key).localeCompare(String(right.variant_key));
  })[0];
}

export function validateScenarioCatalog(images = []) {
  const counts = Object.fromEntries(SCENARIO_ORDER.map((group) => [group, 0]));

  for (const image of images) {
    if (image.role === "scenario" && Object.hasOwn(counts, image.scenario_group)) {
      counts[image.scenario_group] += 1;
    }
  }

  const missingScenarios = SCENARIO_ORDER.filter((group) => counts[group] < EXPECTED_SCENARIO_COUNTS[group]);
  const unexpectedCounts = SCENARIO_ORDER.filter((group) => counts[group] > EXPECTED_SCENARIO_COUNTS[group]);
  const pairCapacity = Object.values(counts)
    .reduce((total, imageCount) => total + imageCount * (imageCount - 1) / 2, 0);
  return {
    ready: missingScenarios.length === 0 && unexpectedCounts.length === 0,
    counts,
    missing_scenarios: missingScenarios,
    unexpected_counts: unexpectedCounts,
    pair_capacity: pairCapacity,
  };
}

export function isScenarioPool(images = []) {
  const scenarios = images.filter((image) => image.role === "scenario");
  return scenarios.length > 0 && scenarios.every((image) => (
    SCENARIO_ORDER.includes(image.scenario_group)
    && typeof image.variant_key === "string"
    && image.variant_key.length > 0
    && image.parameter_states
    && typeof image.parameter_states === "object"
  ));
}

function parseTokens(stem, allowedTokens, group, filename) {
  const tokens = [];
  let remainder = stem;

  while (remainder) {
    const token = allowedTokens.find((candidate) => remainder.startsWith(candidate));
    if (!token || tokens.includes(token)) {
      throw new Error(`Invalid Scenario ${group} filename: ${filename}`);
    }
    tokens.push(token);
    remainder = remainder.slice(token.length);
  }

  return tokens;
}

function previewScore(variant, knownParameters) {
  const states = variant.parameter_states || {};
  let score = 0;

  if (!knownParameters.has("vegetation_density")) {
    score += { half: 0, none: 1, full: 2 }[states.vegetation_density] ?? 3;
  }
  if (!knownParameters.has("vegetation_lighting") && states.vegetation_lighting === "lit") score += 1;
  if (!knownParameters.has("path_lighting") && states.path_lighting === "lit") score += 1;
  if (!knownParameters.has("obstacles") && states.obstacles === "present") score += 1;
  return score;
}
