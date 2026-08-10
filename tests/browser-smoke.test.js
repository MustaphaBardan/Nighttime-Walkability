import assert from "node:assert/strict";
import test from "node:test";

import { CONFIG } from "../js/config.js";
import { submitResponses } from "../js/storage.js";
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
  const previousFetch = globalThis.fetch;
  let capturedRequest = null;

  globalThis.fetch = async (url, options) => {
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
  });

  assert.equal(result.savedLocal, true);
  assert.equal(result.submittedRemote, true);
  assert.equal(capturedRequest.url, CONFIG.googleAppsScriptUrl);
  assert.equal(capturedRequest.options.method, "POST");
  assert.equal(capturedRequest.options.mode, "no-cors");
  assert.equal(capturedRequest.options.headers["Content-Type"], "text/plain;charset=utf-8");

  const payload = JSON.parse(capturedRequest.options.body);
  assert.equal(payload.participant_id, "p_submit_smoke");
  assert.equal(payload.method, "complete_protocol");
  assert.equal(payload.replace_existing_all, true);
  assert.deepEqual(payload.responses, responses);

  if (previousFetch === undefined) {
    delete globalThis.fetch;
  } else {
    globalThis.fetch = previousFetch;
  }
});
