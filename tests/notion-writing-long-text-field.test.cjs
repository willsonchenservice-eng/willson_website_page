const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(path.join(process.cwd(), "lib", "notion.ts"), "utf8");

assert(
  source.includes('"超长字段"'),
  "Notion writing should read the long-text field that stores original blog text."
);

assert(
  source.includes('["Content", "内容", "正文", "Body", "超长字段"]'),
  "Notion writing should recognize common original-content field names."
);

assert(
  source.includes("propPlainText(contentProp) || mdResponse.markdown"),
  "Notion writing should prefer the original content field before page markdown."
);

assert(
  source.includes("prop.rich_text?.map"),
  "Notion rich_text extraction should join all long-text chunks."
);

console.log("PASS: Notion writing original long-text field is supported.");
