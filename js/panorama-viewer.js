import { createElement } from "./utils.js";

const DRAG_SENSITIVITY = 0.0045;
const KEY_STEP = Math.PI / 36;
const MAX_PITCH = Math.PI * 0.47;
const MIN_FOV = 42;
const MAX_FOV = 94;
const MOBILE_IMAGE_QUERY = "(max-width: 719px)";
const imageCache = new Map();
const renderedAssetCache = new WeakMap();
const textureSourceCache = new WeakMap();

export function preloadSurveyImages(images = []) {
  const paths = [...new Set(images.map((image) => resolveSceneImageSource(image).path).filter(Boolean))];
  return Promise.allSettled(paths.map((path) => loadCachedImage(path)));
}

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

export function renderSceneMedia(image, options = {}) {
  if (image?.view_type === "panorama_360") {
    return renderPanoramaViewer(image, {
      initialYaw: degreesToRadians(image.initial_yaw_degrees || 0),
      ...options,
    });
  }

  return renderFlatImage(image, options);
}

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

export function resolveSceneImageSource(image = {}) {
  const responsiveSources = image.responsive_sources || {};
  const mobileSource = responsiveSources.mobile;
  const desktopSource = responsiveSources.desktop;

  if (mobileSource?.path && isMobileImageViewport()) {
    return normalizeImageSource(mobileSource, "mobile");
  }

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

  appendFullscreenButton(frame, options);

  createSphericalViewer(frame, canvas, source.path, options);
  return frame;
}

function getRenderedImageSource(image) {
  return image && typeof image === "object" ? renderedAssetCache.get(image) : null;
}

function rememberRenderedImageSource(image, source) {
  if (image && typeof image === "object") {
    renderedAssetCache.set(image, source);
  }
}

function isMobileImageViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.matchMedia?.(MOBILE_IMAGE_QUERY).matches || window.innerWidth < 720);
}

function normalizeImageSource(source = {}, variant) {
  return {
    path: source.path || "",
    variant: source.variant || variant,
    width: source.width || "",
    height: source.height || "",
    format: source.format || getFileExtension(source.path),
  };
}

function getFileExtension(path = "") {
  return path.split(".").pop()?.toLowerCase() || "";
}

function appendFullscreenButton(frame, options = {}) {
  if (options.fullscreenControl === false || !document.fullscreenEnabled) {
    return;
  }

  const fullscreenButton = createElement("button", {
    className: "panorama-fullscreen-button",
    text: "Full screen",
    attrs: { type: "button" },
  });

  fullscreenButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  fullscreenButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

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

  const locations = {
    position: gl.getAttribLocation(program, "a_position"),
    rotation: gl.getUniformLocation(program, "u_rotation"),
    tanHalfFov: gl.getUniformLocation(program, "u_tanHalfFov"),
    aspect: gl.getUniformLocation(program, "u_aspect"),
    texture: gl.getUniformLocation(program, "u_texture"),
  };
  const state = {
    yaw: options.initialYaw || 0,
    pitch: 0,
    fov: 72,
    dragging: false,
    lastX: 0,
    lastY: 0,
    textureReady: false,
    renderQueued: false,
  };
  const vertexBuffer = gl.createBuffer();
  const texture = gl.createTexture();

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
    const textureSource = getTextureSource(gl, panoramaImage);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSource);
    state.textureReady = true;
    requestRender();
  }).catch(() => renderImageFallback(frame, imagePath, options));

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

  function requestRender() {
    if (state.renderQueued) {
      return;
    }

    state.renderQueued = true;
    requestAnimationFrame(render);
  }

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

  function setView(nextYaw, nextPitch) {
    state.yaw = nextYaw;
    state.pitch = clamp(nextPitch, -MAX_PITCH, MAX_PITCH);
    requestRender();
  }

  frame.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    frame.classList.add("dragging");
    frame.setPointerCapture?.(event.pointerId);
  });

  frame.addEventListener("pointermove", (event) => {
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
  frame.addEventListener("wheel", (event) => {
    event.preventDefault();
    state.fov = clamp(state.fov + Math.sign(event.deltaY) * 4, MIN_FOV, MAX_FOV);
    requestRender();
  }, { passive: false });
  frame.addEventListener("keydown", (event) => {
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
    handlers[event.key]();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeCanvas).observe(frame);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }

  requestAnimationFrame(resizeCanvas);
}

function renderImageFallback(frame, imagePath, options) {
  frame.innerHTML = "";
  frame.classList.add("panorama-fallback");
  frame.append(renderFlatImage({ path: imagePath }, options).firstElementChild);
}

function endDrag(frame, state) {
  state.dragging = false;
  frame.classList.remove("dragging");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function degreesToRadians(value) {
  return Number(value || 0) * Math.PI / 180;
}

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
