const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(
  path.join(process.cwd(), "components", "WorkShowcase.tsx"),
  "utf8"
);

assert(
  !source.includes("aspect-video"),
  "WorkShowcase should not use a fixed 16:9 frame."
);

assert(
  source.includes("aspect-[4434/2986]"),
  "WorkShowcase should use the fixed Feishu business platform cover ratio."
);

assert(
  !source.includes("style={{ aspectRatio:"),
  "WorkShowcase frames should not change aspect ratio per media item."
);

assert(
  source.includes("<video") &&
    source.includes("muted") &&
    source.includes("loop") &&
    source.includes("playsInline") &&
    source.includes("autoPlay") &&
    source.includes('preload="metadata"'),
  "WorkShowcase should render video covers with expected inline playback attributes."
);

assert(
  source.includes("showcaseFrameBackground") &&
    source.includes('return "bg-black";') &&
    !source.includes('"bg-white"'),
  "WorkShowcase should use a black frame background for all media covers."
);

console.log("PASS: WorkShowcase media frame and video safeguards are present.");
