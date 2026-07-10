const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const source = fs.readFileSync(
  path.join(process.cwd(), ".github", "workflows", "deploy-oss.yml"),
  "utf8"
);

assert(source.includes("permissions:\n  contents: read"), "Deploy workflow should use least-privilege repository permissions.");
assert(source.includes("persist-credentials: false"), "Checkout should not persist a writable GitHub token.");
assert(source.includes("actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683"), "Checkout must be pinned to an immutable commit.");
assert(source.includes("actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020"), "Setup Node must be pinned to an immutable commit.");
assert(source.includes("run: npm test"), "Deploy workflow must run regression tests before building.");
assert(!/curl[^\n]*\|\s*sudo\s+bash/.test(source), "Installers must not be piped directly into sudo bash.");

console.log("PASS: deployment workflow has regression, permission, and installer safeguards.");
