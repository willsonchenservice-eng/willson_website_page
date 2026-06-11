const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(
  path.join(process.cwd(), "components", "WorkShowcase.tsx"),
  "utf8"
);

assert(
  source.includes("works.filter((work) => work.cover)"),
  "WorkShowcase should keep works with external links; only missing covers should be filtered out."
);

assert(
  !source.includes("!work.externalLink && work.cover"),
  "WorkShowcase must not remove linked works from the homepage carousel."
);

console.log("PASS: WorkShowcase keeps linked works in the carousel.");
