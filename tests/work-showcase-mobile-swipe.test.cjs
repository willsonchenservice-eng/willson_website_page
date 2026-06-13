const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "components", "WorkShowcase.tsx"),
  "utf8"
);

assert.match(
  source,
  /onPointerDown=\{handlePointerDown\}/,
  "WorkShowcase center card should listen for touch pointer starts."
);

assert.match(
  source,
  /onPointerUp=\{handlePointerUp\}/,
  "WorkShowcase center card should listen for touch pointer ends."
);

assert.match(
  source,
  /touch-pan-y/,
  "WorkShowcase center card should preserve vertical page scrolling while supporting horizontal swipes."
);

assert.doesNotMatch(
  source,
  /pointerType === "mouse"/,
  "WorkShowcase should allow pointer swipes to be browser-testable while preserving click navigation."
);

assert.match(
  source,
  /suppressClickRef\.current = true/,
  "WorkShowcase should suppress link navigation after a successful swipe."
);

assert.match(
  source,
  /changeWork\(deltaX < 0 \? 1 : -1\)/,
  "WorkShowcase should map left swipes to next work and right swipes to previous work."
);

console.log("PASS: WorkShowcase supports mobile horizontal swipe navigation.");
