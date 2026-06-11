const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(path.join(process.cwd(), "app", "page.tsx"), "utf8");

assert(
  source.includes("getAllWritingFull"),
  "Home Blog cards should read full writing content instead of preview summaries."
);

assert(
  source.includes("function getPostExcerpt"),
  "Home Blog cards should extract details from original post content."
);

assert(
  source.includes("post.content?.trim() || post.summary?.trim()"),
  "Home Blog cards should prefer original content before summary fallback."
);

assert(
  source.includes("line-clamp-2"),
  "Home Blog card details should be visible but capped at two lines."
);

assert(
  source.includes("{getPostExcerpt(post)}"),
  "Home Blog cards should render a detail line for each post."
);

assert(
  !source.includes("关于「"),
  "Home Blog cards should not render generated fallback teaser copy."
);

console.log("PASS: Home Blog teasers show original-content excerpts.");
