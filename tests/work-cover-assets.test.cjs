const fs = require("fs");
const path = require("path");
const assert = require("assert");

const repoRoot = process.cwd();
const contentSource = fs.readFileSync(path.join(repoRoot, "lib", "content.ts"), "utf8");

const expectedCovers = [
  "/work-covers/douyin-review.jpg",
  "/work-covers/douyin-reviewer-care.jpg",
  "/work-covers/feishu-network-security.jpg",
  "/work-covers/feishu-open-platform.jpg",
  "/work-covers/feishu-security-overview.jpg",
  "/work-covers/feishu-security.jpg",
  "/work-covers/huijian.jpg",
];

for (const cover of expectedCovers) {
  assert(
    contentSource.includes(`"${cover}"`),
    `Expected lib/content.ts to normalize work cover ${cover}.`
  );

  const assetPath = path.join(repoRoot, "public", cover);
  assert(fs.existsSync(assetPath), `Expected generated cover asset to exist: ${cover}.`);

  const stat = fs.statSync(assetPath);
  assert(
    stat.size <= 400 * 1024,
    `Expected ${cover} to stay under 400 KB, got ${(stat.size / 1024).toFixed(1)} KB.`
  );
}

assert(
  contentSource.includes('"/wall/stickers.png": "/wall/stickers.gif"'),
  "Animated stickers should keep the original GIF cover."
);

console.log("PASS: work covers use lightweight generated assets.");
