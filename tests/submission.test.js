import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";

import { CONFIG } from "../js/config.js";
import { getSubmissionState } from "../js/storage.js";
import {
  checkSubmissionService,
  requestJsonp,
  scheduleAutomaticSubmissionRetries,
  stopAutomaticSubmissionRetries,
  submitResponses,
} from "../js/submission.js";

test.beforeEach(() => {
  globalThis.localStorage = createStorageMock();
  globalThis.crypto = webcrypto;
  stopAutomaticSubmissionRetries();
});

test.afterEach(() => {
  stopAutomaticSubmissionRetries();
  delete globalThis.localStorage;
  delete globalThis.crypto;
});

test("health checks trust only an explicit ok receipt", async () => {
  assert.equal(await checkSubmissionService({ jsonpImpl: async () => ({ ok: true }) }), true);
  assert.equal(await checkSubmissionService({ jsonpImpl: async () => ({ ok: false }) }), false);
  assert.equal(await checkSubmissionService({ jsonpImpl: async () => { throw new Error("blocked"); } }), false);
});

test("a matching receipt confirms and persists a remote submission", async () => {
  const responses = sampleResponses();
  let requestBody = null;
  const result = await submitResponses(responses, {
    method: "complete_protocol",
    replaceExistingAll: true,
    postSettleWaitMs: 0,
    pollDelays: [0],
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return { type: "opaque" };
    },
    jsonpImpl: async (parameters) => ({
      ok: true,
      receipt_id: parameters.submission_id,
      saved: responses.length,
    }),
  });

  assert.equal(result.submittedRemote, true);
  assert.equal(requestBody.protocol_label, CONFIG.protocolLabel);
  assert.equal(requestBody.submission_id, result.submissionState.submission_id);
  assert.deepEqual(getSubmissionState(), result.submissionState);
  assert.equal(result.submissionState.status, "confirmed");
  assert.equal(result.submissionState.attempts, 1);
});

test("a mismatched receipt stays unconfirmed and retry reuses the submission id", async () => {
  const responses = sampleResponses();
  const postedIds = [];
  const options = {
    method: "complete_protocol",
    replaceExistingAll: true,
    postSettleWaitMs: 0,
    pollDelays: [0],
    fetchImpl: async (_url, request) => {
      postedIds.push(JSON.parse(request.body).submission_id);
      return { type: "opaque" };
    },
    jsonpImpl: async () => ({ ok: true, receipt_id: "wrong", saved: responses.length }),
  };

  const first = await submitResponses(responses, options);
  const second = await submitResponses(responses, options);

  assert.equal(first.submittedRemote, false);
  assert.equal(second.submittedRemote, false);
  assert.equal(postedIds.length, 2);
  assert.equal(postedIds[0], postedIds[1]);
  assert.equal(getSubmissionState().attempts, 2);
});

test("automatic retry can confirm a previously failed submission", async () => {
  const responses = sampleResponses();
  let receiptAvailable = false;
  const options = {
    method: "complete_protocol",
    replaceExistingAll: true,
    postSettleWaitMs: 0,
    pollDelays: [0],
    fetchImpl: async () => ({ type: "opaque" }),
    jsonpImpl: async (parameters) => receiptAvailable
      ? { ok: true, receipt_id: parameters.submission_id, saved: responses.length }
      : { ok: false },
  };

  await submitResponses(responses, options);
  receiptAvailable = true;
  scheduleAutomaticSubmissionRetries(responses, { ...options, retryDelays: [0] });
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(getSubmissionState().status, "confirmed");
  assert.equal(getSubmissionState().attempts, 2);
});

test("the first receipt check waits for a cold Apps Script POST to settle", async () => {
  const responses = sampleResponses();
  let writeFinished = false;
  const result = await submitResponses(responses, {
    method: "complete_protocol",
    replaceExistingAll: true,
    postSettleWaitMs: 50,
    pollDelays: [0],
    fetchImpl: async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
      writeFinished = true;
      return { type: "opaque" };
    },
    jsonpImpl: async (parameters) => writeFinished
      ? { ok: true, receipt_id: parameters.submission_id, saved: responses.length }
      : { ok: false },
  });

  assert.equal(result.submittedRemote, true);
  assert.equal(getSubmissionState().status, "confirmed");
});

test("JSONP installs a validated callback URL and cleans it up after receipt", async () => {
  const globalRef = {};
  let appendedScript = null;
  const documentRef = {
    createElement() {
      return {
        removed: false,
        addEventListener() {},
        remove() { this.removed = true; },
      };
    },
    head: {
      append(script) {
        appendedScript = script;
        const callback = new URL(script.src).searchParams.get("callback");
        queueMicrotask(() => globalRef[callback]({ ok: true }));
      },
    },
  };

  const result = await requestJsonp({ action: "health" }, {
    documentRef,
    globalRef,
    jsonpTimeoutMs: 50,
  });

  const callback = new URL(appendedScript.src).searchParams.get("callback");
  assert.deepEqual(result, { ok: true });
  assert.match(callback, /^surveyCallback_[A-Za-z0-9_]{8,80}$/);
  assert.equal(appendedScript.removed, true);
  assert.equal(globalRef[callback], undefined);
});

test("JSONP timeout removes the script and callback", async () => {
  const globalRef = {};
  let appendedScript = null;
  const documentRef = {
    createElement() {
      return {
        removed: false,
        addEventListener() {},
        remove() { this.removed = true; },
      };
    },
    head: { append: (script) => { appendedScript = script; } },
  };

  await assert.rejects(
    requestJsonp({ action: "health" }, { documentRef, globalRef, jsonpTimeoutMs: 0 }),
    /timed out/,
  );
  const callback = new URL(appendedScript.src).searchParams.get("callback");
  assert.equal(appendedScript.removed, true);
  assert.equal(globalRef[callback], undefined);
});

function sampleResponses() {
  return [{
    participant_id: "p_20260826_test",
    method: "realism_check",
    question_id: "simulation_realism",
    answer: "4",
  }];
}

function createStorageMock() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}
