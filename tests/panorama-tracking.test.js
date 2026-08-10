import assert from "node:assert/strict";
import test from "node:test";

import { createYawCoverageTracker, getInitialPanoramaYawDegrees } from "../js/panorama-viewer.js";

test("all panoramas start 90 degrees to the right of their configured heading", () => {
  assert.equal(getInitialPanoramaYawDegrees({ initial_yaw_degrees: 90 }), 0);
  assert.equal(getInitialPanoramaYawDegrees({ initial_yaw_degrees: 180 }), 90);
  assert.equal(getInitialPanoramaYawDegrees({}), -90);
});

const radians = (degrees) => degrees * Math.PI / 180;

test("yaw tracker records unique coverage without double-counting revisited headings", () => {
  const updates = [];
  const tracker = createYawCoverageTracker(radians(90), (metrics) => updates.push(metrics), {});

  tracker.notify();
  tracker.startRotation();
  tracker.record(radians(90), radians(210));
  tracker.record(radians(210), radians(150));

  const latest = updates.at(-1);
  assert.equal(latest.yawCoverageDegrees, 121);
  assert.equal(latest.rotationCount, 1);
  assert.ok(latest.viewingTrace.length >= 1);
});

test("yaw tracker handles wraparound and does not count revisited headings twice", () => {
  const updates = [];
  const tracker = createYawCoverageTracker(radians(350), (metrics) => updates.push(metrics), {});

  tracker.record(radians(350), radians(370));
  tracker.record(radians(370), radians(350));

  const latest = updates.at(-1);
  assert.equal(latest.yawCoverageDegrees, 21);
});
