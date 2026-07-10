const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(process.cwd(), "components", "ArticleCard.tsx"), "utf8");
const writingRoute = path.join(process.cwd(), "app", "writing", "[slug]", "page.tsx");

if (!/href=\{`\/writing\/\$\{post\.slug\}`\}/.test(source)) {
  console.error("FAIL: ArticleCard must link each teaser to /writing/${post.slug}.");
  process.exit(1);
}

if (!fs.existsSync(writingRoute)) {
  console.error("FAIL: ArticleCard links must resolve to app/writing/[slug]/page.tsx.");
  process.exit(1);
}

console.log("PASS: ArticleCard links to writing detail pages.");
