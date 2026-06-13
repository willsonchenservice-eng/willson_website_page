const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const writingPage = fs.readFileSync(path.join(repoRoot, "app", "writing", "page.tsx"), "utf8");
const writingClient = fs.readFileSync(
  path.join(repoRoot, "components", "WritingIndexClient.tsx"),
  "utf8"
);
const globals = fs.readFileSync(path.join(repoRoot, "app", "globals.css"), "utf8");

assert.match(
  writingPage,
  /className="min-w-0 py-14 first:pt-0 sm:py-20"/,
  "Writing articles should have roomier vertical spacing between posts."
);

assert.match(
  writingClient,
  /className="blog-list-sections overflow-hidden"/,
  "Writing list should use a dedicated wrapper for article separators."
);

assert.match(
  globals,
  /\.blog-list-sections > \[data-writing-article\]\s*\{[\s\S]*border-top:\s*1px solid color-mix\(in srgb, var\(--foreground\) 14%, transparent\);/,
  "Writing articles should have a visible custom separator."
);

console.log("PASS: writing blog article spacing and separators are explicit.");
