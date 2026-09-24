export function generateId(prefix) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 6);
  return `${prefix}_${date}_${random}`;
}

export function getDeviceType() {
  const width = window.innerWidth;

  if (width < 720) {
    return "mobile";
  }

  if (width < 1100) {
    return "tablet";
  }

  return "desktop";
}

export function isSurveyViewportAllowed(width = window.innerWidth, height = window.innerHeight) {
  return Number(width) >= 900 && Number(height) >= 600;
}

export function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function seededShuffle(items, seedValue) {
  const copy = [...items];
  const random = createSeededRandom(seedValue);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function hashString(value = "") {
  let hash = 2166136261;
  const text = String(value);

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getScenarioImages(images = []) {
  return images.filter((image) => image.role === "scenario");
}

export function getTrainingImage(images = []) {
  return images.find((image) => image.role === "training") || images.find((image) => image.view_type === "panorama_360") || images[0];
}

export function makeScenarioBatchPairs(images, participantId) {
  return makeScenarioQuestionPairs(images, participantId, Object.keys(groupScenarioImages(getScenarioImages(images))).length);
}

export function makeScenarioQuestionPairs(images, participantId, count) {
  if (!count || count <= 0) {
    return [];
  }

  // Only compare variants from the same scenario group.
  const scenarioImages = getScenarioImages(images);
  const groups = groupScenarioImages(scenarioImages);
  const batchPairs = [[1, 2], [1, 3], [2, 3]];
  const pairs = Object.keys(groups).sort().flatMap((groupKey) => (
    hasCompleteVariantSet(groups[groupKey])
      ? batchPairs.map(([firstVariant, secondVariant]) => {
        const first = groups[groupKey].get(firstVariant);
        const second = groups[groupKey].get(secondVariant);
        return [first, second];
      })
      : []
  )).filter(Boolean);

  if (count >= pairs.length) {
    return seededShuffle(pairs, `${participantId}:scenario-pairs`);
  }

  return seededShuffle(pairs, `${participantId}:scenario-pairs`).slice(0, count);
}

const DEFAULT_PAIR_CATEGORY_WEIGHTS = {
  singleFactor: 0.65,
  twoFactor: 0.25,
  exploratory: 0.10,
};

const PAIR_CATEGORIES = ["singleFactor", "twoFactor", "exploratory"];

// Favor one-parameter contrasts while keeping scenario groups evenly represented.
export function makeBalancedScenarioPairs(
  images,
  participantId,
  count,
  scenarioOrder = ["A", "B", "C", "D"],
  options = {},
) {
  const groups = groupScenarioImageArrays(getScenarioImages(images), scenarioOrder)
    .filter((group) => group.images.length >= 2);
  const sequence = makeCapacityBalancedGroupSequence(
    groups.map((group) => ({ key: group.key, capacity: group.images.length * (group.images.length - 1) / 2 })),
    count,
    `${participantId}:balanced-pairs`,
    options,
  );
  const pairPools = new Map(groups.map((group) => [
    group.key,
    makeConstrainedPairPools(group.images, `${participantId}:balanced-pairs:${group.key}`),
  ]));
  const offsets = new Map(groups.map((group) => [
    group.key,
    new Map(PAIR_CATEGORIES.map((category) => [category, 0])),
  ]));
  const groupOccurrences = new Map();

  return sequence.map((groupKey, position) => {
    const occurrence = groupOccurrences.get(groupKey) || 0;
    groupOccurrences.set(groupKey, occurrence + 1);
    const desiredCategory = choosePairCategory(
      `${participantId}:balanced-pairs:${groupKey}:occurrence-${occurrence}:position-${position}`,
      options.pairCategoryWeights,
    );
    const pools = pairPools.get(groupKey);
    const groupOffsets = offsets.get(groupKey);
    const availableCategories = PAIR_CATEGORIES.filter((category) => (
      (groupOffsets.get(category) || 0) < (pools.get(category)?.length || 0)
    ));
    const category = availableCategories.includes(desiredCategory)
      ? desiredCategory
      : seededShuffle(availableCategories, `${participantId}:balanced-pairs:${groupKey}:fallback-${occurrence}`)[0];
    const offset = groupOffsets.get(category) || 0;
    const pair = pools.get(category)?.[offset];
    groupOffsets.set(category, offset + 1);
    return pair;
  }).filter(Boolean);
}

// Spread detailed ratings across scenario groups without reusing an image.
export function makeBalancedScenarioImages(
  images,
  participantId,
  count,
  scenarioOrder = ["A", "B", "C", "D"],
  options = {},
) {
  const groups = groupScenarioImageArrays(getScenarioImages(images), scenarioOrder)
    .filter((group) => group.images.length > 0);
  const sequence = makeCapacityBalancedGroupSequence(
    groups.map((group) => ({ key: group.key, capacity: group.images.length })),
    count,
    `${participantId}:balanced-images`,
    options,
  );
  const imagePools = new Map(groups.map((group) => [
    group.key,
    seededShuffle(group.images, `${participantId}:balanced-images:${group.key}`),
  ]));
  const offsets = new Map();

  return sequence.map((groupKey) => {
    const offset = offsets.get(groupKey) || 0;
    const image = imagePools.get(groupKey)?.[offset];
    offsets.set(groupKey, offset + 1);
    return image;
  }).filter(Boolean);
}

export function takeDeterministicSubset(items, count, seedValue) {
  if (!count || count <= 0) {
    return [];
  }

  if (count >= items.length) {
    return seededShuffle(items, seedValue);
  }

  return seededShuffle(items, seedValue).slice(0, count);
}

export function makeSeededQuestionAssignments(items, questions, participantId, assignmentKey, count = questions.length) {
  if (!Array.isArray(items)) {
    throw new TypeError("makeSeededQuestionAssignments expects items to be an array");
  }

  if (!Array.isArray(questions)) {
    throw new TypeError("makeSeededQuestionAssignments expects questions to be an array");
  }

  if (!count || count <= 0 || !items.length || !questions.length) {
    return [];
  }

  const safeCount = Math.min(count, items.length);
  const selectedItems = takeDeterministicSubset(items, safeCount, `${participantId}:${assignmentKey}:items`);
  const questionOrder = seededShuffle(questions, `${participantId}:${assignmentKey}:questions`);

  return selectedItems.map((item, index) => ({
    item,
    question: questionOrder[index % questionOrder.length],
    displayOrder: index + 1,
  }));
}

export function makeFixedQuestionAssignments(
  items,
  questions,
  participantId,
  assignmentKey,
  count = questions.length,
  preserveItemOrder = false,
) {
  if (!Array.isArray(items)) {
    throw new TypeError("makeFixedQuestionAssignments expects items to be an array");
  }

  if (!Array.isArray(questions)) {
    throw new TypeError("makeFixedQuestionAssignments expects questions to be an array");
  }

  if (!count || count <= 0 || !items.length || !questions.length) {
    return [];
  }

  const safeCount = Math.min(count, items.length);
  const selectedItems = preserveItemOrder
    ? items.slice(0, safeCount)
    : takeDeterministicSubset(items, safeCount, `${participantId}:${assignmentKey}:items`);

  return selectedItems.map((item, index) => ({
    item,
    question: questions[index % questions.length],
    displayOrder: index + 1,
  }));
}

export function makePairs(images, count) {
  const pairs = [];

  for (let left = 0; left < images.length; left += 1) {
    for (let right = left + 1; right < images.length; right += 1) {
      pairs.push([images[left], images[right]]);
    }
  }

  return shuffle(pairs).slice(0, Math.min(count, pairs.length));
}

export function takeRandomSubset(items, count) {
  if (!count || count >= items.length) {
    return shuffle(items);
  }

  return shuffle(items).slice(0, count);
}

function createSeededRandom(seedValue) {
  let seed = hashString(seedValue) || 1;

  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function groupScenarioImages(images) {
  return images.reduce((groups, image) => {
    const groupKey = image.scenario_group;
    const variant = Number(image.scenario_variant);

    if (!groupKey || !Number.isFinite(variant)) {
      return groups;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = new Map();
    }

    groups[groupKey].set(variant, image);
    return groups;
  }, {});
}

function groupScenarioImageArrays(images, scenarioOrder) {
  const byGroup = images.reduce((groups, image) => {
    if (!groups.has(image.scenario_group)) groups.set(image.scenario_group, []);
    groups.get(image.scenario_group).push(image);
    return groups;
  }, new Map());

  return scenarioOrder
    .filter((groupKey) => byGroup.has(groupKey))
    .map((groupKey) => ({ key: groupKey, images: byGroup.get(groupKey) }));
}

function makeCapacityBalancedGroupSequence(groups, count, seedValue, { previousGroup = "" } = {}) {
  if (!count || count <= 0 || !groups.length) return [];
  const sequence = [];
  const usage = new Map(groups.map((group) => [group.key, 0]));
  let lastGroup = previousGroup;

  while (sequence.length < count) {
    const available = groups.filter((group) => usage.get(group.key) < group.capacity);
    if (!available.length) break;
    const alternateGroups = available.filter((group) => group.key !== lastGroup);
    const eligibleGroups = alternateGroups.length ? alternateGroups : available;
    const minimumUsage = Math.min(...eligibleGroups.map((group) => usage.get(group.key)));
    const leastUsed = eligibleGroups.filter((group) => usage.get(group.key) === minimumUsage);
    const selected = seededShuffle(leastUsed, `${seedValue}:position-${sequence.length}`)[0];
    sequence.push(selected.key);
    usage.set(selected.key, usage.get(selected.key) + 1);
    lastGroup = selected.key;
  }

  return sequence;
}

function makeAllPairs(images) {
  const pairs = [];
  for (let left = 0; left < images.length; left += 1) {
    for (let right = left + 1; right < images.length; right += 1) {
      pairs.push([images[left], images[right]]);
    }
  }
  return pairs;
}

// Hamming distance counts changed experimental parameters between two scenes.
export function parameterStateHammingDistance(first, second) {
  const firstStates = first?.parameter_states || {};
  const secondStates = second?.parameter_states || {};
  const keys = new Set([...Object.keys(firstStates), ...Object.keys(secondStates)]);
  return [...keys].filter((key) => firstStates[key] !== secondStates[key]).length;
}

function makeConstrainedPairPools(images, seedValue) {
  const pools = new Map(PAIR_CATEGORIES.map((category) => [category, []]));

  for (const pair of makeAllPairs(images)) {
    const distance = parameterStateHammingDistance(pair[0], pair[1]);
    const category = distance === 1 ? "singleFactor" : distance === 2 ? "twoFactor" : "exploratory";
    pools.get(category).push(pair);
  }

  for (const category of PAIR_CATEGORIES) {
    pools.set(category, seededShuffle(pools.get(category), `${seedValue}:${category}`));
  }

  return pools;
}

function choosePairCategory(seedValue, configuredWeights = {}) {
  const weights = {
    ...DEFAULT_PAIR_CATEGORY_WEIGHTS,
    ...(configuredWeights || {}),
  };
  const normalized = PAIR_CATEGORIES.map((category) => Math.max(0, Number(weights[category]) || 0));
  const total = normalized.reduce((sum, weight) => sum + weight, 0);
  const safeWeights = total > 0
    ? normalized
    : PAIR_CATEGORIES.map((category) => DEFAULT_PAIR_CATEGORY_WEIGHTS[category]);
  const safeTotal = safeWeights.reduce((sum, weight) => sum + weight, 0);
  const draw = (hashString(seedValue) / 4294967296) * safeTotal;
  let cumulative = 0;

  for (let index = 0; index < PAIR_CATEGORIES.length; index += 1) {
    cumulative += safeWeights[index];
    if (draw < cumulative) return PAIR_CATEGORIES[index];
  }

  return PAIR_CATEGORIES.at(-1);
}

function hasCompleteVariantSet(group) {
  return [1, 2, 3].every((variant) => group.has(variant));
}

export function byId(id) {
  return document.getElementById(id);
}

export function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text) {
    element.textContent = options.text;
  }

  if (options.html) {
    element.innerHTML = options.html;
  }

  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  return element;
}
