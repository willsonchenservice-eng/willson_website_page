const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const mdxComponents = fs.readFileSync(
  path.join(repoRoot, "components", "mdx", "components.tsx"),
  "utf8"
);
const codeBlock = fs.readFileSync(
  path.join(repoRoot, "components", "mdx", "CodeBlock.tsx"),
  "utf8"
);
const css = fs.readFileSync(path.join(repoRoot, "app", "globals.css"), "utf8");

assert.match(
  mdxComponents,
  /pre:\s*CodeBlock/,
  "MDX fenced code should render through the CodeBlock component."
);

assert.match(
  mdxComponents,
  /code:\s*InlineCode/,
  "MDX inline code should render through the InlineCode component."
);

assert.match(
  codeBlock,
  /language-\(\[A-Za-z0-9_-\]\+\)/,
  "CodeBlock should read language-* class names from fenced code."
);

assert.match(
  codeBlock,
  /navigator\.clipboard\?\.writeText/,
  "CodeBlock should support one-click copy."
);

assert.match(
  codeBlock,
  /document\.execCommand\("copy"\)/,
  "CodeBlock should fall back to legacy copy for browsers that block Clipboard API."
);

assert.match(
  codeBlock,
  /aria-label=\{copied \? "代码已复制" : "复制代码"\}/,
  "CodeBlock copy button should expose an accessible label."
);

assert.match(
  css,
  /\.mdx-code-block\s*\{[\s\S]*background:\s*#0b0f14;/,
  "Code blocks should have a dedicated dark block treatment."
);

assert.match(
  css,
  /\.mdx-code-block__pre\s*\{[\s\S]*max-height:\s*calc\(\(1\.58em \* 12\) \+ 1\.7rem\);[\s\S]*overflow:\s*auto;[\s\S]*white-space:\s*pre-wrap;/,
  "Code blocks should wrap long lines and cap visible height to roughly 12 lines."
);

assert.match(
  css,
  /\.blog-list-body h1\s*\{[\s\S]*font-size:/,
  "Blog Markdown h1 headings should have explicit typography."
);

assert.match(
  css,
  /\.prose-work-detail h4,[\s\S]*\.prose-work-detail h6\s*\{/,
  "Lower-level Markdown headings should have explicit detail-page styles."
);

console.log("PASS: MDX code block rendering and heading styles are wired.");
