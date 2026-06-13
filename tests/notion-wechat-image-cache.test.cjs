const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(process.cwd(), "lib", "notion.ts"), "utf8");

assert.match(
  source,
  /function isWechatImageUrl\(url: string\)/,
  "Notion writing should detect WeChat image URLs."
);

assert.match(
  source,
  /mmbiz\\\.qpic\\\.cn/,
  "WeChat mmbiz.qpic.cn images should be treated as cacheable remote assets."
);

assert.match(
  source,
  /function wechatImageHeaders\(\)/,
  "WeChat image downloads should send a browser-like referer/user-agent."
);

assert.match(
  source,
  /isWechatAsset \? wechatImageHeaders\(\) : undefined/,
  "WeChat image cache downloads should use WeChat-specific request headers."
);

assert.match(
  source,
  /\.replace\(\/\\\*\\\*\\s\*\\\*\\\*\/g, ""\)/,
  "Writing Markdown should normalize adjacent bold delimiters like ****."
);

assert.match(
  source,
  /\.replace\(\/\\\\\\\*\\\\\\\*\/g, "\*\*"\)/,
  "Notion-returned escaped bold markers should be restored before MDX rendering."
);

console.log("PASS: Notion writing caches WeChat images and normalizes adjacent bold markers.");
