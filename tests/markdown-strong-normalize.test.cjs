const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const contentSource = fs.readFileSync(path.join(process.cwd(), "lib", "content.ts"), "utf8");
const notionSource = fs.readFileSync(path.join(process.cwd(), "lib", "notion.ts"), "utf8");
const syncSource = fs.readFileSync(path.join(process.cwd(), "scripts", "sync-wechat-writing.mjs"), "utf8");

assert.match(
  contentSource,
  /function normalizeMarkdownStrongDelimiters\(markdown: string\)/,
  "Local writing content should normalize malformed adjacent bold delimiters."
);

assert.match(
  contentSource,
  /const normalizedContent = normalizeMarkdownStrongDelimiters\(content\)/,
  "Local writing MDX should be normalized before rendering and summary extraction."
);

assert.match(
  contentSource,
  /replace\(\/\\\*\\\*\(\[\^\*\\n\]\*\?\\S\)\\s\+\\\*\\\*\(\?=\\S\)\/g, "\*\*\$1\*\* "\)/,
  "Local writing content should normalize bold delimiters that close after a stray inner space."
);

assert.match(
  notionSource,
  /replace\(\/\\\*\\\*\(\[\^\*\\n\]\*\?\\S\)\\s\+\\\*\\\*\(\?=\\S\)\/g, "\*\*\$1\*\* "\)/,
  "Notion writing content should normalize bold delimiters that close after a stray inner space."
);

assert.match(
  syncSource,
  /\.replace\(\/\\\*\\\*\\s\*\\\*\\\*\/g, ""\)/,
  "WeChat sync should avoid generating adjacent bold delimiters like ****."
);

console.log("PASS: malformed adjacent Markdown bold delimiters are normalized.");
