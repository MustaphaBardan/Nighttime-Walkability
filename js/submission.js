import { CONFIG } from "./config.js";
import { getSubmissionState, saveSubmissionState } from "./storage.js";

export const SUBMISSION_STATUS_EVENT = "survey-submission-status";

let scheduledSubmissionId = "";
let retryTimers = [];
let onlineRetryHandler = null;
let activeAttempt = null;

// this function is for checking whether google apps script can be reached from this browser
export async function checkSubmissionService(options = {}) {
  if (!CONFIG.googleAppsScriptUrl) return false;

  try {
    const result = await (options.jsonpImpl || requestJsonp)({ action: "health" }, options);
    return result?.ok === true;
  } catch {
    return false;
  }
}

// this function is for sending answers and accepting only a matching sheet receipt as success
export async function submitResponses(responses, options = {}) {
  if (activeAttempt) return activeAttempt;

  activeAttempt = runSubmissionAttempt(responses, options).finally(() => {
    activeAttempt = null;
  });
  return activeAttempt;
}

async function runSubmissionAttempt(responses, options = {}) {
  if (!CONFIG.googleAppsScriptUrl || !Array.isArray(responses) || responses.length === 0) {
    const state = saveSubmissionState({ status: "failed" });
    announceSubmissionState(state);
    return submissionResult(false, state, "Submission is not configured.");
  }

  const previous = getSubmissionState();
  const submissionId = previous.submission_id || createSubmissionId();
  const attemptState = saveSubmissionState({
    submission_id: submissionId,
    status: "submitting",
    attempts: previous.attempts + 1,
    last_attempt_at: new Date().toISOString(),
    confirmed_at: "",
    saved: 0,
  });
  announceSubmissionState(attemptState);

  const payload = {
    submission_id: submissionId,
    protocol_label: CONFIG.protocolLabel,
    participant_id: responses[0]?.participant_id || "",
    method: options.method || responses[0]?.method || "",
    replace_existing: Boolean(options.replaceExisting),
    replace_existing_all: Boolean(options.replaceExistingAll),
    responses,
  };

  // The opaque response is not proof of a write, but waiting briefly lets a cold Apps Script finish before receipt polling.
  const postRequest = Promise.resolve()
    .then(() => (options.fetchImpl || fetch)(CONFIG.googleAppsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    }))
    .catch(() => null);

  await Promise.race([
    postRequest,
    wait(options.postSettleWaitMs ?? CONFIG.submissionPostSettleWaitMs),
  ]);

  const receipt = await pollForReceipt(submissionId, options);
  const confirmed = receipt?.ok === true
    && receipt.receipt_id === submissionId
    && Number(receipt.saved) === responses.length;

  if (confirmed) {
    const state = saveSubmissionState({
      submission_id: submissionId,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      saved: responses.length,
    });
    stopAutomaticSubmissionRetries();
    announceSubmissionState(state);
    return submissionResult(true, state, "Remote submission confirmed.");
  }

  const state = saveSubmissionState({
    submission_id: submissionId,
    status: "failed",
    confirmed_at: "",
    saved: 0,
  });
  announceSubmissionState(state);
  return submissionResult(false, state, "Remote submission is not yet confirmed.");
}

// this function is for retrying an unconfirmed completed response while the page stays open
export function scheduleAutomaticSubmissionRetries(responses, options = {}) {
  const state = getSubmissionState();
  if (state.status === "confirmed" || !state.submission_id || scheduledSubmissionId === state.submission_id) return;

  stopAutomaticSubmissionRetries();
  scheduledSubmissionId = state.submission_id;
  const delays = options.retryDelays || CONFIG.submissionRetryDelaysMs;

  retryTimers = delays.map((delay) => setTimeout(async () => {
    if (getSubmissionState().status === "confirmed") return;
    await submitResponses(responses, options);
  }, delay));

  if (typeof window !== "undefined") {
    onlineRetryHandler = async () => {
      if (getSubmissionState().status !== "confirmed") {
        await submitResponses(responses, options);
      }
    };
    window.addEventListener("online", onlineRetryHandler);
  }
}

export function stopAutomaticSubmissionRetries() {
  retryTimers.forEach((timer) => clearTimeout(timer));
  retryTimers = [];
  scheduledSubmissionId = "";

  if (onlineRetryHandler && typeof window !== "undefined") {
    window.removeEventListener("online", onlineRetryHandler);
  }
  onlineRetryHandler = null;
}

async function pollForReceipt(submissionId, options = {}) {
  const delays = options.pollDelays || CONFIG.submissionReceiptPollDelaysMs;

  for (const delay of delays) {
    await wait(delay);

    try {
      const receipt = await (options.jsonpImpl || requestJsonp)({
        action: "receipt",
        submission_id: submissionId,
      }, options);

      if (receipt?.ok) return receipt;
    } catch {
      // A later poll or retry may still confirm a POST that reached Apps Script.
    }
  }

  return null;
}

export function requestJsonp(parameters, options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  const globalRef = options.globalRef || globalThis;
  const timeoutMs = options.jsonpTimeoutMs ?? 3000;

  if (!documentRef?.head) return Promise.reject(new Error("JSONP requires a document"));

  return new Promise((resolve, reject) => {
    const callbackName = createCallbackName();
    const script = documentRef.createElement("script");
    const url = new URL(CONFIG.googleAppsScriptUrl);
    let settled = false;

    Object.entries({ ...parameters, callback: callbackName, nonce: Date.now() }).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    function cleanup() {
      clearTimeout(timeout);
      script.remove();
      delete globalRef[callbackName];
    }

    function finish(callback, value) {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    }

    globalRef[callbackName] = (data) => finish(resolve, data);
    script.async = true;
    script.src = url.toString();
    script.addEventListener("error", () => finish(reject, new Error("Receipt check failed")), { once: true });
    const timeout = setTimeout(() => finish(reject, new Error("Receipt check timed out")), timeoutMs);
    documentRef.head.append(script);
  });
}

function createSubmissionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function createCallbackName() {
  const random = createSubmissionId().replaceAll("-", "_");
  return `surveyCallback_${random}`;
}

function submissionResult(submittedRemote, state, message) {
  return {
    savedLocal: true,
    submittedRemote,
    submissionState: state,
    message,
  };
}

function announceSubmissionState(state) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(SUBMISSION_STATUS_EVENT, { detail: state }));
}

function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(delay) || 0)));
}
