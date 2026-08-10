// this function is for making a new id with a date and random part
export function generateId(prefix) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 6);
  return `${prefix}_${date}_${random}`;
}

// this function is for knowing if the screen is mobile, tablet, or desktop
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

// this function is for checking whether the usable browser area is large enough for the survey
export function isSurveyViewportAllowed(width = window.innerWidth, height = window.innerHeight) {
  return Number(width) >= 900 && Number(height) >= 600;
}

// this function is for shuffling items in a normal random way
export function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

// this function is for shuffling items in a repeatable way using a seed
export function seededShuffle(items, seedValue) {
  const copy = [...items];
  const random = createSeededRandom(seedValue);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

// this function is for converting text into a number used as a seed
export function hashString(value = "") {
  let hash = 2166136261;
  const text = String(value);

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

// this function is for keeping only the scenario images
export function getScenarioImages(images = []) {
  return images.filter((image) => image.role === "scenario");
}

// this function is for finding the training image
export function getTrainingImage(images = []) {
  return images.find((image) => image.role === "training") || images.find((image) => image.view_type === "panorama_360") || images[0];
}

// this function is for creating one scenario pair per group
export function makeScenarioBatchPairs(images, participantId) {
  return makeScenarioQuestionPairs(images, participantId, Object.keys(groupScenarioImages(getScenarioImages(images))).length);
}

// this function is for creating random scenario pairs inside each scenario group
export function makeScenarioQuestionPairs(images, participantId, count) {
  if (!count || count <= 0) {
    return [];
  }

  // we group images by scenario group then create variant pairs like 1-2, 1-3, 2-3
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

// this function balances pairwise exposure before drawing a seeded pair inside each scenario
export function makeBalancedScenarioPairs(images, participantId, count, scenarioOrder = ["A", "B", "C", "D"]) {
  const groups = groupScenarioImageArrays(getScenarioImages(images), scenarioOrder)
    .filter((group) => group.images.length >= 2);
  const sequence = makeCapacityBalancedGroupSequence(
    groups.map((group) => ({ key: group.key, capacity: group.images.length * (group.images.length - 1) / 2 })),
    count,
    `${participantId}:balanced-pairs`,
  );
  const pairPools = new Map(groups.map((group) => [
    group.key,
    seededShuffle(makeAllPairs(group.images), `${participantId}:balanced-pairs:${group.key}`),
  ]));
  const offsets = new Map();

  return sequence.map((groupKey) => {
    const offset = offsets.get(groupKey) || 0;
    const pair = pairPools.get(groupKey)?.[offset];
    offsets.set(groupKey, offset + 1);
    return pair;
  }).filter(Boolean);
}

// this function balances detailed-scene exposure and never repeats an image
export function makeBalancedScenarioImages(images, participantId, count, scenarioOrder = ["A", "B", "C", "D"]) {
  const groups = groupScenarioImageArrays(getScenarioImages(images), scenarioOrder)
    .filter((group) => group.images.length > 0);
  const sequence = makeCapacityBalancedGroupSequence(
    groups.map((group) => ({ key: group.key, capacity: group.images.length })),
    count,
    `${participantId}:balanced-images`,
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

// this function is for taking a repeatable subset for one participant
export function takeDeterministicSubset(items, count, seedValue) {
  if (!count || count <= 0) {
    return [];
  }

  if (count >= items.length) {
    return seededShuffle(items, seedValue);
  }

  return seededShuffle(items, seedValue).slice(0, count);
}

// this function is for independently assigning seeded items to seeded questions
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

// this function is for selecting repeatable items while preserving question order
export function makeFixedQuestionAssignments(items, questions, participantId, assignmentKey, count = questions.length) {
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
  const selectedItems = takeDeterministicSubset(items, safeCount, `${participantId}:${assignmentKey}:items`);

  return selectedItems.map((item, index) => ({
    item,
    question: questions[index % questions.length],
    displayOrder: index + 1,
  }));
}

// this function is for making all possible pairs then selecting some randomly
export function makePairs(images, count) {
  const pairs = [];

  for (let left = 0; left < images.length; left += 1) {
    for (let right = left + 1; right < images.length; right += 1) {
      pairs.push([images[left], images[right]]);
    }
  }

  return shuffle(pairs).slice(0, Math.min(count, pairs.length));
}

// this function is for taking a normal random subset
export function takeRandomSubset(items, count) {
  if (!count || count >= items.length) {
    return shuffle(items);
  }

  return shuffle(items).slice(0, count);
}

// this function is for creating the repeatable random number generator
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

// this function is for grouping scenario images by their group and variant number
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

function makeCapacityBalancedGroupSequence(groups, count, seedValue) {
  if (!count || count <= 0 || !groups.length) return [];
  const sequence = [];
  const usage = new Map(groups.map((group) => [group.key, 0]));

  while (sequence.length < count) {
    const available = groups.filter((group) => usage.get(group.key) < group.capacity);
    if (!available.length) break;
    const minimumUsage = Math.min(...available.map((group) => usage.get(group.key)));
    const leastUsed = available.filter((group) => usage.get(group.key) === minimumUsage);
    const selected = seededShuffle(leastUsed, `${seedValue}:position-${sequence.length}`)[0];
    sequence.push(selected.key);
    usage.set(selected.key, usage.get(selected.key) + 1);
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

// this function is for requiring the same 1-2, 1-3, 2-3 pair pool in every scenario group
function hasCompleteVariantSet(group) {
  return [1, 2, 3].every((variant) => group.has(variant));
}

// this function is for getting an element by id
export function byId(id) {
  return document.getElementById(id);
}

// this function is for creating html elements with text, classes, or attributes
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
