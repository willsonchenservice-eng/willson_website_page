const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const testsDir = path.join(process.cwd(), "tests");
const skipByDefault = new Set(["photowall-browser-selfcheck.cjs", "run-all.cjs"]);
const files = fs
  .readdirSync(testsDir)
  .filter((file) => file.endsWith(".test.cjs") || file.endsWith("-selfcheck.cjs"))
  .sort();

let failed = false;

for (const file of files) {
  if (skipByDefault.has(file)) continue;

  const relative = path.join("tests", file);
  const result = spawnSync(process.execPath, [relative], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
