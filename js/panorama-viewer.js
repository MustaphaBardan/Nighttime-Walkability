import { createElement } from "./utils.js";

const DRAG_SENSITIVITY = 0.0045;
const KEY_STEP = Math.PI / 36;
export const MAX_PITCH = 50 * Math.PI / 180;
const MIN_FOV = 42;
const MAX_FOV = 94;
const imageCache = new Map();
const renderedAssetCache = new WeakMap();
const textureSourceCache = new WeakMap();

// this function is for preloading image files before they are shown
export function preloadSurveyImages(images = []) {
  const paths = [...new Set(images.map((image) => resolveSceneImageSource(image).path).filter(Boolean))];
  return Promise.allSettled(paths.map((path) => loadCachedImage(path)));
}

// this function is for warming up one panorama texture before the real questions
export function warmUpPanoramaTextures(images = []) {
  const panorama = images.find((image) => image.view_type === "panorama_360");

  if (!panorama || !document.body) {
    return;
  }

  const warmup = createElement("div", {
    className: "panorama-warmup",
    attrs: { "aria-hidden": "true" },
  });
  warmup.append(renderSceneMedia(panorama, {
    fullscreenControl: false,
    loading: "eager",
  }));
  document.body.append(warmup);
  window.setTimeout(() => warmup.remove(), 1800);
}

// this function is for deciding if we show a 360 panorama or a normal image
export function renderSceneMedia(image, options = {}) {
  if (image?.view_type === "panorama_360") {
    return renderPanoramaViewer(image, {
      initialYaw: degreesToRadians(image.initial_yaw_degrees || 0),
      ...options,
    });
  }

  return renderFlatImage(image, options);
}

// this function is for getting the image file metadata used in saved responses
export function getImageAssetMetadata(image) {
  const source = getRenderedImageSource(image) || resolveSceneImageSource(image);

  return {
    path: source.path || "",
    variant: source.variant || "",
    width: source.width || "",
    height: source.height || "",
    format: source.format || getFileExtension(source.path),
  };
}

// this function is for choosing the correct image source for the current device
export function resolveSceneImageSource(image = {}) {
  const responsiveSources = image.responsive_sources || {};
  const desktopSource = responsiveSources.desktop;

  if (desktopSource?.path) {
    return normalizeImageSource(desktopSource, "desktop");
  }

  return normalizeImageSource({
    path: image.path,
    width: image.width,
    height: image.height,
    format: image.format,
  }, "default");
}

// this function is for rendering a normal flat image
function renderFlatImage(image, options = {}) {
  const source = resolveSceneImageSource(image);
  rememberRenderedImageSource(image, source);
  const frame = createElement("div", {
    className: "scene-frame",
    attrs: { tabindex: "0" },
  });
  const img = createElement("img", {
    attrs: {
      src: source.path,
      alt: options.alt || image.description || "Survey scene",
      loading: options.loading || "eager",
    },
  });

  frame.append(img);
  appendFullscreenButton(frame, options);
  return frame;
}

// this function is for rendering a 360 panorama viewer
function renderPanoramaViewer(image, options = {}) {
  const source = resolveSceneImageSource(image);
  rememberRenderedImageSource(image, source);
  const classNames = ["scene-frame", "panorama-frame"];

  if (options.compact) {
    classNames.push("compact-panorama");
  }

  if (options.fullViewport) {
    classNames.push("full-panorama");
  }

  const frame = createElement("div", {
    className: classNames.join(" "),
    attrs: {
      tabindex: "0",
      role: "img",
      "aria-label": options.alt || image.description || "360 degree survey scene",
    },
  });
  const canvas = createElement("canvas", {
    className: "panorama-canvas",
    attrs: { "aria-hidden": "true" },
  });
  const badge = createElement("span", {
    className: "panorama-badge",
    text: "360",
    attrs: { "aria-hidden": "true" },
  });

  frame.append(canvas, badge);

  if (options.overlayElement instanceof HTMLElement) {
    frame.append(options.overlayElement);
  }

  appendFullscreenButton(frame, options);

  createSphericalViewer(frame, canvas, source.path, options);
  return frame;
}

// this function is for reading the rendered source stored for an image
function getRenderedImageSource(image) {
  return image && typeof image === "object" ? renderedAssetCache.get(image) : null;
}

// this function is for remembering which source was actually rendered
function rememberRenderedImageSource(image, source) {
  if (image && typeof image === "object") {
    renderedAssetCache.set(image, source);
  }
}

// this function is for making an image source object consistent
function normalizeImageSource(source = {}, variant) {
  return {
    path: source.path || "",
    variant: source.variant || variant,
    width: source.width || "",
    height: source.height || "",
    format: source.format || getFileExtension(source.path),
  };
}

// this function is for reading the file extension from a path
function getFileExtension(path = "") {
  return path.split(".").pop()?.toLowerCase() || "";
}

// this function is for adding the fullscreen button to an image frame
function appendFullscreenButton(frame, options = {}) {
  if (options.fullscreenControl === false || !document.fullscreenEnabled) {
    return;
  }

  let requestedOnPointerDown = false;
  const fullscreenButton = createElement("button", {
    className: "panorama-fullscreen-button",
    text: options.fullscreenLabel || "Full screen",
    attrs: { type: "button" },
  });

  fullscreenButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!options.onFullscreenRequest || document.fullscreenElement === frame) {
      requestedOnPointerDown = false;
      return;
    }

    requestedOnPointerDown = true;
    options.onFullscreenRequest(frame);
  });
  fullscreenButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (requestedOnPointerDown) {
      requestedOnPointerDown = false;
      return;
    }

    if (document.fullscreenElement === frame) {
      document.exitFullscreen?.();
      return;
    }

    if (options.onFullscreenRequest) {
      options.onFullscreenRequest(frame);
      return;
    }

    frame.requestFullscreen?.();
  });
  frame.append(fullscreenButton);
}

// this function is for creating the webgl spherical panorama viewer
function createSphericalViewer(frame, canvas, imagePath, options) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    preserveDrawingBuffer: true,
  }) || canvas.getContext("experimental-webgl", {
    alpha: false,
    antialias: true,
    preserveDrawingBuffer: true,
  });

  if (!gl) {
    renderImageFallback(frame, imagePath, options);
    return;
  }

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

  if (!program) {
    renderImageFallback(frame, imagePath, options);
    return;
  }

  options.onInteractiveAvailabilityChange?.(true);

  const locations = {
    position: gl.getAttribLocation(program, "a_position"),
    rotation: gl.getUniformLocation(program, "u_rotation"),
    tanHalfFov: gl.getUniformLocation(program, "u_tanHalfFov"),
    aspect: gl.getUniformLocation(program, "u_aspect"),
    texture: gl.getUniformLocation(program, "u_texture"),
  };
  const sharedView = createSharedViewState(options.viewState, options.initialYaw || 0);
  const viewerId = Symbol("panorama-viewer");
  const state = {
    yaw: sharedView?.yaw ?? options.initialYaw ?? 0,
    pitch: sharedView?.pitch ?? 0,
    fov: sharedView?.fov ?? 72,
    dragging: false,
    lastX: 0,
    lastY: 0,
    textureReady: false,
    renderQueued: false,
  };
  const yawCoverage = createYawCoverageTracker(state.yaw, options.onYawCoverageChange, options.yawCoverageState);
  const vertexBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  const unsubscribeSharedView = subscribeSharedViewState(sharedView, viewerId, (nextView) => {
    state.yaw = nextView.yaw;
    state.pitch = clamp(nextView.pitch, -MAX_PITCH, MAX_PITCH);
    state.fov = clamp(nextView.fov, MIN_FOV, MAX_FOV);
    requestRender();
  });

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([8, 10, 10, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(locations.texture, 0);

  loadCachedImage(imagePath).then((panoramaImage) => {
    // we upload the panorama image into the webgl texture
    const textureSource = getTextureSource(gl, panoramaImage);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSource);
    state.textureReady = true;
    requestRender();
  }).catch(() => renderImageFallback(frame, imagePath, options));

  // this function is for resizing the canvas to the visible frame
  function resizeCanvas() {
    const rect = frame.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * window.devicePixelRatio));
    const height = Math.max(1, Math.round(rect.height * window.devicePixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    requestRender();
  }

  // this function is for scheduling a redraw
  function requestRender() {
    if (state.renderQueued) {
      return;
    }

    state.renderQueued = true;
    requestAnimationFrame(render);
  }

  // this function is for drawing the panorama frame
  function render() {
    state.renderQueued = false;

    if (!canvas.width || !canvas.height) {
      return;
    }

    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.02, 0.03, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix3fv(locations.rotation, false, makeRotationMatrix(state.yaw, state.pitch));
    gl.uniform1f(locations.tanHalfFov, Math.tan((state.fov * Math.PI / 180) / 2));
    gl.uniform1f(locations.aspect, canvas.width / canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // this function is for changing the yaw and pitch
  function setView(nextYaw, nextPitch) {
    const previousYaw = state.yaw;
    state.yaw = nextYaw;
    state.pitch = clamp(nextPitch, -MAX_PITCH, MAX_PITCH);
    yawCoverage.record(previousYaw, state.yaw, state.pitch);
    notifySharedViewState(sharedView, viewerId, state);
    requestRender();
  }

  frame.addEventListener("pointerdown", (event) => {
    // we start dragging when the participant presses on the panorama
    state.dragging = true;
    yawCoverage.startRotation();
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    frame.classList.add("dragging");
    frame.setPointerCapture?.(event.pointerId);
  });

  frame.addEventListener("pointermove", (event) => {
    // we rotate the view while the participant drags
    if (!state.dragging) {
      return;
    }

    const deltaX = event.clientX - state.lastX;
    const deltaY = event.clientY - state.lastY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    setView(state.yaw - deltaX * DRAG_SENSITIVITY, state.pitch + deltaY * DRAG_SENSITIVITY);
  });

  frame.addEventListener("pointerup", () => endDrag(frame, state));
  frame.addEventListener("pointercancel", () => endDrag(frame, state));
  frame.addEventListener("lostpointercapture", () => endDrag(frame, state));
  frame.addEventListener("keydown", (event) => {
    // we allow arrow keys to rotate the panorama
    const handlers = {
      ArrowLeft: () => setView(state.yaw + KEY_STEP, state.pitch),
      ArrowRight: () => setView(state.yaw - KEY_STEP, state.pitch),
      ArrowUp: () => setView(state.yaw, state.pitch - KEY_STEP),
      ArrowDown: () => setView(state.yaw, state.pitch + KEY_STEP),
    };

    if (!handlers[event.key]) {
      return;
    }

    event.preventDefault();
    yawCoverage.startRotation();
    handlers[event.key]();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeCanvas).observe(frame);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }

  requestAnimationFrame(resizeCanvas);
  yawCoverage.notify();

  frame.addEventListener("panorama-viewer-destroy", unsubscribeSharedView, { once: true });
}

// this function is for showing a normal image if webgl fails
function renderImageFallback(frame, imagePath, options) {
  options.onInteractiveAvailabilityChange?.(false);
  frame.innerHTML = "";
  frame.classList.add("panorama-fallback");
  frame.append(renderFlatImage({ path: imagePath }, options).firstElementChild);
}

// this function is for stopping drag mode
function endDrag(frame, state) {
  state.dragging = false;
  frame.classList.remove("dragging");
}

// this function is for keeping a value inside a min and max
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// this function is for sharing the same view between two panoramas
function createSharedViewState(viewState, initialYaw) {
  if (!viewState || typeof viewState !== "object") {
    return null;
  }

  if (!viewState.listeners) {
    Object.defineProperty(viewState, "listeners", {
      value: new Set(),
      enumerable: false,
      configurable: true,
    });
  }

  if (!viewState.initialized) {
    viewState.yaw = Number.isFinite(viewState.yaw) ? viewState.yaw : initialYaw;
    viewState.pitch = Number.isFinite(viewState.pitch) ? viewState.pitch : 0;
    viewState.fov = Number.isFinite(viewState.fov) ? viewState.fov : 72;
    viewState.initialized = true;
  }

  return viewState;
}

// this function is for subscribing one viewer to the shared view state
function subscribeSharedViewState(sharedView, viewerId, applyView) {
  if (!sharedView?.listeners) {
    return () => {};
  }

  const listener = ({ sourceId }) => {
    if (sourceId === viewerId) {
      return;
    }

    applyView(sharedView);
  };

  sharedView.listeners.add(listener);
  return () => sharedView.listeners.delete(listener);
}

// this function is for telling the other viewers that the view changed
function notifySharedViewState(sharedView, sourceId, state) {
  if (!sharedView?.listeners) {
    return;
  }

  sharedView.yaw = state.yaw;
  sharedView.pitch = state.pitch;
  sharedView.fov = state.fov;
  sharedView.listeners.forEach((listener) => listener({ sourceId }));
}

// this function is for converting degrees to radians
function degreesToRadians(value) {
  return Number(value || 0) * Math.PI / 180;
}

// this function is for converting radians to degrees
function radiansToDegrees(value) {
  return Number(value || 0) * 180 / Math.PI;
}

// this function is for tracking how much of the 360 view was visited
export function createYawCoverageTracker(initialYaw, onChange, coverageState = {}) {
  const visitedBins = coverageState.visitedBins instanceof Set ? coverageState.visitedBins : new Set();

  if (!visitedBins.size) {
    visitedBins.add(yawToDegreeBin(initialYaw));
  }

  coverageState.visitedBins = visitedBins;
  coverageState.hasMoved = Boolean(coverageState.hasMoved);
  coverageState.rotationCount = Number(coverageState.rotationCount) || 0;
  coverageState.startedAt = Number(coverageState.startedAt) || Date.now();
  coverageState.lastSampleAt = Number(coverageState.lastSampleAt) || 0;
  coverageState.viewingTrace = Array.isArray(coverageState.viewingTrace) ? coverageState.viewingTrace : [];

  function emit(yaw, pitch = 0, forceSample = false) {
    // we send the coverage value back to the training screen
    if (typeof onChange !== "function") {
      return;
    }

    const now = Date.now();
    if (forceSample || now - coverageState.lastSampleAt >= 250) {
      coverageState.viewingTrace.push([
        now - coverageState.startedAt,
        Math.round(normalizeDegrees(radiansToDegrees(yaw))),
        Math.round(radiansToDegrees(pitch)),
      ]);
      coverageState.lastSampleAt = now;
    }
    onChange({
      yawCoverageDegrees: coverageState.hasMoved ? Math.min(360, visitedBins.size) : 0,
      yawDegrees: normalizeDegrees(radiansToDegrees(yaw)),
      pitchDegrees: radiansToDegrees(pitch),
      rotationCount: coverageState.rotationCount,
      viewingTrace: coverageState.viewingTrace,
    });
  }

  return {
    notify() {
      emit(initialYaw, 0, true);
    },

    startRotation() {
      coverageState.rotationCount += 1;
    },

    record(previousYaw, nextYaw, pitch = 0) {
      const deltaDegrees = radiansToDegrees(nextYaw - previousYaw);

      if (!Number.isFinite(deltaDegrees) || Math.abs(deltaDegrees) < 0.001) {
        return;
      }

      coverageState.hasMoved = true;
      const steps = Math.max(1, Math.ceil(Math.abs(deltaDegrees)));

      for (let index = 0; index <= steps; index += 1) {
        const ratio = index / steps;
        visitedBins.add(yawToDegreeBin(previousYaw + (nextYaw - previousYaw) * ratio));
      }

      emit(nextYaw, pitch);
    },
  };
}

// this function is for converting yaw to a one degree bin
function yawToDegreeBin(yaw) {
  return Math.floor(normalizeDegrees(radiansToDegrees(yaw)));
}

// this function is for keeping degrees between 0 and 359
function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

// this function is for loading an image once and reusing it
function loadCachedImage(path) {
  if (imageCache.has(path)) {
    return imageCache.get(path).promise;
  }

  const image = new Image();
  image.decoding = "async";
  image.loading = "eager";
  const promise = new Promise((resolve, reject) => {
    image.addEventListener("load", async () => {
      try {
        await image.decode?.();
      } catch {
        // The load event is enough if decode() is unsupported or already complete.
      }

      resolve(image);
    }, { once: true });
    image.addEventListener("error", reject, { once: true });
  });

  image.src = path;
  imageCache.set(path, { image, promise });
  return promise;
}

// this function is for resizing a texture if the image is too large for webgl
function getTextureSource(gl, image) {
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const cachedSources = textureSourceCache.get(image) || new Map();

  if (image.naturalWidth <= maxTextureSize && image.naturalHeight <= maxTextureSize) {
    return image;
  }

  if (cachedSources.has(maxTextureSize)) {
    return cachedSources.get(maxTextureSize);
  }

  const scale = Math.min(maxTextureSize / image.naturalWidth, maxTextureSize / image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  cachedSources.set(maxTextureSize, canvas);
  textureSourceCache.set(image, cachedSources);
  return canvas;
}

// this function is for creating the rotation matrix used by the panorama shader
function makeRotationMatrix(yaw, pitch) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  return new Float32Array([
    cy, 0, -sy,
    sy * sp, cp, cy * sp,
    sy * cp, -sp, cy * cp,
  ]);
}

// this function is for creating the webgl shader program
function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null;
  }

  return program;
}

// this function is for compiling one webgl shader
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return null;
  }

  return shader;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
uniform mat3 u_rotation;
uniform float u_tanHalfFov;
uniform float u_aspect;
varying vec3 v_direction;

void main() {
  vec3 ray = normalize(vec3(
    a_position.x * u_aspect * u_tanHalfFov,
    a_position.y * u_tanHalfFov,
    -1.0
  ));
  v_direction = u_rotation * ray;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_texture;
varying vec3 v_direction;

const float PI = 3.1415926535897932384626433832795;

void main() {
  vec3 direction = normalize(v_direction);
  float u = atan(direction.x, -direction.z) / (2.0 * PI) + 0.5;
  float v = 0.5 - asin(clamp(direction.y, -1.0, 1.0)) / PI;
  gl_FragColor = texture2D(u_texture, vec2(u, v));
}
`;
