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
