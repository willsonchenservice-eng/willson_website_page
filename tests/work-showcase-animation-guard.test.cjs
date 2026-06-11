const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(
  path.join(process.cwd(), "components", "WorkShowcase.tsx"),
  "utf8"
);

assert(
  /function\s+changeWork\(direction:\s*number\)[\s\S]*if\s*\(\s*animatingRef\.current\s*\)\s*return;/.test(source),
  "WorkShowcase should ignore carousel clicks while a transition is already running."
);

const visibleCopyResets = source.match(/gsap\.set\(copyRef\.current,\s*\{\s*y:\s*0,\s*opacity:\s*1\s*\}\);/g) || [];

assert(
  visibleCopyResets.length >= 2,
  "WorkShowcase should force the title/link copy back to visible at rest and after transitions."
);

console.log("PASS: WorkShowcase guards repeated clicks and restores copy visibility.");
