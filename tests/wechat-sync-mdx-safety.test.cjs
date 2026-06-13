const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "scripts", "sync-wechat-writing.mjs"),
  "utf8"
);

assert.match(
  source,
  /function makeMdxSafe\(markdown\)/,
  "WeChat sync should sanitize generated Markdown before writing MDX."
);

assert.match(
  source,
  /isStandaloneJsonLine\(safeLine\) \? \["```json", safeLine, "```"\]/,
  "WeChat sync should wrap standalone JSON lines in fenced code blocks."
);

assert.match(
  source,
  /if \(inFence\) return \[line\]/,
  "WeChat sync should not rewrite JSON or JSX-looking text that is already inside fenced code."
);

assert.match(
  source,
  /replace\(\s*\/<\(\[A-Za-z\]\[A-Za-z0-9_-\]\*\)>\/g,\s*"`<\$1>`"\s*\)/,
  "WeChat sync should escape placeholder tags like <agentId> before MDX compilation."
);

assert.match(
  source,
  /<pre\\b\[\^>\]\*>\(\[\\s\\S\]\*\?\)<\\\/pre>/,
  "WeChat sync should preserve WeChat <pre> blocks as Markdown code fences."
);

assert.match(
  source,
  /<code\\b\[\^>\]\*>\(\[\\s\\S\]\*\?\)<\\\/code>/,
  "WeChat sync should preserve WeChat <code> blocks instead of stripping code markup."
);

assert.match(
  source,
  /function splitMarkdownParts\(markdown\)/,
  "WeChat sync should parse Markdown without splitting fenced code blocks on blank lines."
);

assert.match(
  source,
  /type: "code",\s*\n\s*code: \{/,
  "WeChat sync should write fenced code blocks to Notion as native code blocks."
);

assert.match(
  source,
  /const remoteMarkdown = makeMdxSafe\(htmlToMarkdown/,
  "WeChat sync should sanitize remote Markdown for Notion writes."
);

assert.match(
  source,
  /const localMarkdown = makeMdxSafe\(htmlToMarkdown/,
  "WeChat sync should sanitize local Markdown for MDX files."
);

console.log("PASS: WeChat sync protects generated MDX and preserves code blocks for Notion.");
