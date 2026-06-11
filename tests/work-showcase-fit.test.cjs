const assert = require("assert");
const { createJiti } = require("jiti");

const jiti = createJiti(process.cwd() + "/");
const {
  SHOWCASE_FRAME_ASPECT,
  getShowcaseImageFit,
  getShowcaseImageFitClass,
  isShowcaseVideoSource,
} = jiti("./components/workShowcaseFit.ts");

assert.strictEqual(
  getShowcaseImageFit(1600, 900, "/wall/landscape.png"),
  "contain",
  "landscape showcase covers should render fully with object-contain"
);

assert.strictEqual(
  getShowcaseImageFit(900, 1600, "/wall/portrait.png"),
  "cover-top",
  "covers taller than the fixed showcase frame should fill the frame and crop from the top"
);

assert.strictEqual(
  getShowcaseImageFit(0, 0, "/wall/loading.png"),
  "contain",
  "unknown image dimensions should use the safe full-image default"
);

assert.strictEqual(
  getShowcaseImageFit(900, 1600, "/wall/stickers.gif"),
  "contain",
  "animated image covers should keep the existing full-image behavior"
);

assert.strictEqual(
  isShowcaseVideoSource("/wall/demo.mp4"),
  true,
  "mp4 showcase covers should be treated as videos"
);

assert.strictEqual(
  isShowcaseVideoSource("/wall/demo.png"),
  false,
  "static image showcase covers should not be treated as videos"
);

assert.strictEqual(
  getShowcaseImageFitClass("cover-top"),
  "object-cover object-top",
  "portrait covers should use top-aligned cover classes"
);

assert.strictEqual(
  SHOWCASE_FRAME_ASPECT.toFixed(3),
  "1.485",
  "showcase frames should use the fixed Feishu business platform cover aspect ratio"
);

console.log("PASS: WorkShowcase image fit rules are covered.");
