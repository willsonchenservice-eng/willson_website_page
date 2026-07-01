const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const source = fs.readFileSync(path.join(process.cwd(), "lib", "content.ts"), "utf8");
const notionSource = fs.readFileSync(path.join(process.cwd(), "lib", "notion.ts"), "utf8");

assert(
  !source.includes("readLocalWorkFull") && !source.includes("readLocalWritingFull"),
  "Work/Writing production content must not keep local MDX readers."
);

assert(
  !source.includes('readCollection("work")') && !source.includes('readCollection("writing")'),
  "Work/Writing production content must not read local MDX collections."
);

assert(
  source.includes("Notion Work content is required but no work entries were returned.") &&
    source.includes("Notion Writing content is required but no writing entries were returned."),
  "Work/Writing should fail fast when required Notion content is unavailable."
);

assert(
  !/Falling back to local MDX/.test(notionSource),
  "Notion Work/Writing unavailable messages should not imply local MDX fallback."
);

assert(
  source.includes("Duplicate Notion"),
  "Work/Writing must fail fast when Notion returns duplicate slugs for dynamic routes."
);

console.log("PASS: Work and Writing production content comes from Notion only.");
