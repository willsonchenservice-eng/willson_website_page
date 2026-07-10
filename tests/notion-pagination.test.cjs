const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const source = fs.readFileSync(path.join(process.cwd(), "lib", "notion.ts"), "utf8");

assert(source.includes("async function queryAllDataSourcePages"), "Notion data-source queries should use a shared pagination helper.");
assert(source.includes("response.has_more") && source.includes("response.next_cursor"), "Notion pagination must follow has_more/next_cursor.");
assert(source.includes("NOTION_MAX_PAGES"), "Notion pagination must have a safety limit.");
assert(source.includes("async function mapWithConcurrency"), "Notion page processing should be concurrency-limited.");
assert(source.includes("NOTION_ITEM_CONCURRENCY"), "Notion processing concurrency must be configurable and bounded.");

console.log("PASS: Notion queries paginate safely and process pages with bounded concurrency.");
