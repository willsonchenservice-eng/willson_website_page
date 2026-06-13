const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const workDetail = fs.readFileSync(
  path.join(repoRoot, "app", "work", "[slug]", "page.tsx"),
  "utf8"
);
const writingPage = fs.readFileSync(
  path.join(repoRoot, "app", "writing", "page.tsx"),
  "utf8"
);
const writingClient = fs.readFileSync(
  path.join(repoRoot, "components", "WritingIndexClient.tsx"),
  "utf8"
);
const globals = fs.readFileSync(path.join(repoRoot, "app", "globals.css"), "utf8");

assert.match(
  workDetail,
  /text-\[2\.35rem\][\s\S]*sm:text-\[3\.6rem\][\s\S]*lg:text-\[5\.4rem\]/,
  "Work detail title should use explicit responsive sizes instead of viewport-scaled type."
);

assert.match(
  workDetail,
  /inline-flex min-h-12 w-full[\s\S]*sm:w-auto/,
  "Work detail external link button should be full-width and touch-friendly on mobile."
);

assert.match(
  workDetail,
  /rounded-md[\s\S]*sm:rounded-lg/,
  "Work detail cover media should use tighter mobile rounding while keeping desktop rounding."
);

assert.match(
  workDetail,
  /const imageCoverFit = meta\.coverFit === "contain" \? "object-contain" : "object-cover";/,
  "Work detail image covers should respect cover fit metadata."
);

assert.match(
  workDetail,
  /<WorkCoverImage[\s\S]*className=\{`h-full w-full \$\{imageCoverFit\}`\}/,
  "Work detail image covers should render inside a stable aspect-ratio frame."
);

assert.match(
  writingClient,
  /text-\[3\.25rem\][\s\S]*sm:text-\[5rem\][\s\S]*lg:text-\[6\.25rem\]/,
  "Writing page hero should use explicit responsive sizes instead of viewport-scaled type."
);

assert.match(
  writingClient,
  /flex w-full min-w-0 gap-2 overflow-x-auto[\s\S]*lg:overflow-visible/,
  "Writing topic nav should remain horizontally scrollable without widening the mobile page."
);

assert.match(
  writingPage,
  /className="min-w-0 py-14 first:pt-0 sm:py-20"/,
  "Writing article blocks should prevent mobile overflow."
);

assert.match(
  globals,
  /\.blog-list-body[\s\S]*overflow-wrap:\s*anywhere;/,
  "Blog detail body should wrap long fields and links on mobile."
);

assert.match(
  globals,
  /\.prose-work-detail[\s\S]*overflow-wrap:\s*anywhere;/,
  "Work detail body should wrap long fields and links on mobile."
);

assert.match(
  globals,
  /@media \(max-width:\s*639px\)[\s\S]*\.blog-list-body[\s\S]*font-size:\s*0\.975rem;[\s\S]*\.prose-work-detail[\s\S]*font-size:\s*1rem;/,
  "Detail prose should include mobile-specific reading styles."
);

console.log("PASS: detail pages have mobile responsive safeguards.");
