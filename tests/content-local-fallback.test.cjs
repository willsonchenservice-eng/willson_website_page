const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const source = fs.readFileSync(path.join(process.cwd(), "lib", "content.ts"), "utf8");
const notionSource = fs.readFileSync(path.join(process.cwd(), "lib", "notion.ts"), "utf8");

assert(
  source.includes("readLocalCollection") && source.includes("localWorkEntries") && source.includes("localWritingEntries"),
  "Work/Writing must retain repository MDX readers for offline and degraded builds."
);

assert(
  source.includes("REQUIRE_NOTION_CONTENT") && source.includes("Using repository MDX fallback"),
  "Notion content strictness must be explicit while local fallback remains available."
);

assert(
  source.includes('useLocalFallback("Work")') && source.includes('useLocalFallback("Writing")'),
  "Work/Writing should use the local fallback when Notion is unavailable."
);

assert(
  notionSource.includes("Returning no work entries") && notionSource.includes("Returning no writing entries"),
  "Notion fetchers should return a controlled empty result for the content layer to handle."
);

assert(
  source.includes("Duplicate ${collectionName} slug"),
  "Work/Writing must fail fast when duplicate slugs would create ambiguous routes."
);

console.log("PASS: Work and Writing prefer Notion and retain a strict local MDX fallback.");
