import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";

import { CONFIG } from "../js/config.js";
import { submitResponses } from "../js/submission.js";
import { getDeviceType } from "../js/utils.js";

test("desktop gate classifies mobile, tablet, and desktop viewport widths", () => {
  const previousWindow = globalThis.window;

  globalThis.window = { innerWidth: 719 };
  assert.equal(getDeviceType(), "mobile");

  globalThis.window = { innerWidth: 720 };
  assert.equal(getDeviceType(), "tablet");

  globalThis.window = { innerWidth: 1099 };
  assert.equal(getDeviceType(), "tablet");

  globalThis.window = { innerWidth: 1100 };
  assert.equal(getDeviceType(), "desktop");

  if (previousWindow === undefined) {
    delete globalThis.window;
  } else {
    globalThis.window = previousWindow;
  }
});

test("remote submission sends the expected long-format payload envelope", async () => {
  const previousLocalStorage = globalThis.localStorage;
  const previousCrypto = globalThis.crypto;
  let capturedRequest = null;
  globalThis.localStorage = createStorageMock();
  globalThis.crypto = webcrypto;
  const fetchImpl = async (url, options) => {
    capturedRequest = { url, options };
    return { ok: true };
  };

  const responses = [
    {
      participant_id: "p_submit_smoke",
      method: "realism_check",
      question_id: "realism_overall",
      answer: "4",
      answer_value: 4,
    },
  ];
  const result = await submitResponses(responses, {
    method: "complete_protocol",
    replaceExistingAll: true,
    fetchImpl,
    postSettleWaitMs: 0,
    pollDelays: [0],
    jsonpImpl: async (parameters) => ({
      ok: true,
      receipt_id: parameters.submission_id,
      saved: responses.length,
    }),
  });

  assert.equal(result.savedLocal, true);
  assert.equal(result.submittedRemote, true);
  assert.equal(capturedRequest.url, CONFIG.googleAppsScriptUrl);
  assert.equal(capturedRequest.options.method, "POST");
  assert.equal(capturedRequest.options.mode, "no-cors");
  assert.equal(capturedRequest.options.headers["Content-Type"], "text/plain;charset=utf-8");

  const payload = JSON.parse(capturedRequest.options.body);
  assert.equal(payload.participant_id, "p_submit_smoke");
  assert.equal(payload.protocol_label, CONFIG.protocolLabel);
  assert.match(payload.submission_id, /^[0-9a-f-]{36}$/i);
  assert.equal(payload.method, "complete_protocol");
  assert.equal(payload.replace_existing_all, true);
  assert.deepEqual(payload.responses, responses);

  if (previousLocalStorage === undefined) {
    delete globalThis.localStorage;
  } else {
    globalThis.localStorage = previousLocalStorage;
  }
  if (previousCrypto === undefined) {
    delete globalThis.crypto;
  } else {
    globalThis.crypto = previousCrypto;
  }
});

function createStorageMock() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}
