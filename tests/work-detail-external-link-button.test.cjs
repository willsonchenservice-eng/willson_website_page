const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(path.join(process.cwd(), "app", "work", "[slug]", "page.tsx"), "utf8");

assert(
  source.includes("meta.externalLink"),
  "Work detail pages should render a project link when externalLink exists."
);

assert(
  source.includes("打开作品链接"),
  "Work detail project link should use an explicit action label."
);

assert(
  source.includes('target="_blank"') && source.includes('rel="noopener noreferrer"'),
  "Work detail project links should open safely in a new tab."
);

assert(
  source.includes("aria-label={`打开作品链接：${meta.title}`}"),
  "Work detail project link button should have a descriptive accessible label."
);

console.log("PASS: Work detail external link button is rendered in the header.");
