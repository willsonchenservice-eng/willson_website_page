const fs = require("fs");
const path = require("path");
const assert = require("assert");

const repoRoot = process.cwd();
const placeholder = "/work/_placeholder.svg";

const workCoverImageSource = fs.readFileSync(
  path.join(repoRoot, "components", "WorkCoverImage.tsx"),
  "utf8"
);
assert(
  workCoverImageSource.includes(placeholder),
  `WorkCoverImage should use ${placeholder} as the failed-cover fallback.`
);
assert(
  workCoverImageSource.includes("onError") && workCoverImageSource.includes("setCurrentSrc(fallbackSrc)"),
  "WorkCoverImage should switch to the fallback source after failed cover image loads."
);

const workCardSource = fs.readFileSync(
  path.join(repoRoot, "components", "WorkCard.tsx"),
  "utf8"
);
assert(
  workCardSource.includes("WorkCoverImage"),
  "WorkCard should render image covers through WorkCoverImage."
);

const showcaseSource = fs.readFileSync(
  path.join(repoRoot, "components", "WorkShowcase.tsx"),
  "utf8"
);
assert(
  showcaseSource.includes("WORK_COVER_PLACEHOLDER") && showcaseSource.includes("onError"),
  "WorkShowcase should switch failed Next/Image covers to the shared placeholder."
);

const detailSource = fs.readFileSync(
  path.join(repoRoot, "app", "work", "[slug]", "page.tsx"),
  "utf8"
);

assert(
  detailSource.includes("WorkCoverImage"),
  "Work detail should render image covers through WorkCoverImage."
);

console.log("PASS: work cover renderers have image failure fallbacks.");
