const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(
  path.join(process.cwd(), "components", "WorkShowcase.tsx"),
  "utf8"
);

assert(
  source.includes("left-1/2 top-1/2 z-20 block") &&
    source.includes("-translate-x-1/2 -translate-y-1/2"),
  "WorkShowcase center card should be centered by CSS before GSAP runs."
);

assert(
  source.includes("top-1/2 hidden") &&
    source.includes("-translate-y-1/2"),
  "WorkShowcase side cards should be vertically centered by CSS before GSAP runs."
);

console.log("PASS: WorkShowcase has a CSS layout fallback before JS animation.");
