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

  const scenarioImages = getScenarioImages(images);
  const groups = groupScenarioImages(scenarioImages);
  const batchPairs = [[1, 2], [1, 3], [2, 3]];
  const pairs = Object.keys(groups).sort().flatMap((groupKey) => (
    batchPairs.map(([firstVariant, secondVariant]) => {
      const first = groups[groupKey].get(firstVariant);
      const second = groups[groupKey].get(secondVariant);
      return first && second ? [first, second] : null;
    })
  )).filter(Boolean);

  if (count >= pairs.length) {
    return seededShuffle(pairs, `${participantId}:scenario-pairs`);
  }

  return seededShuffle(pairs, `${participantId}:scenario-pairs`).slice(0, count);
}

export function takeDeterministicSubset(items, count, seedValue) {
  if (!count || count >= items.length) {
    return seededShuffle(items, seedValue);
  }

  return seededShuffle(items, seedValue).slice(0, count);
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
