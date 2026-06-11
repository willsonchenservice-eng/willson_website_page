const fs = require("fs");
const path = require("path");
const assert = require("assert");

const contentSource = fs.readFileSync(path.join(process.cwd(), "lib", "content.ts"), "utf8");
const notionSource = fs.readFileSync(path.join(process.cwd(), "lib", "notion.ts"), "utf8");

assert(
  contentSource.includes("allWorks.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))"),
  "getAllWork should sort Work previews by the numeric order field."
);

assert(
  notionSource.includes("const orderProp = getProp(props, workOrderPropertyNames);"),
  "Notion Work mapping should read the same numeric order aliases used for sorting."
);

assert(
  notionSource.includes("return [{ property, direction: \"ascending\" as const }];"),
  "Notion Work queries should request ascending order for the numeric order field."
);

console.log("PASS: Work items are ordered by the numeric Notion column.");
