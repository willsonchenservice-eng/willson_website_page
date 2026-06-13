const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const notionSource = fs.readFileSync(path.join(repoRoot, "lib", "notion.ts"), "utf8");
const workCardSource = fs.readFileSync(path.join(repoRoot, "components", "WorkCard.tsx"), "utf8");
const fallbackTable = notionSource.match(
  /const workCoverFallbackBySlug: Record<string, string> = \{[\s\S]*?\n\};/
)?.[0] || "";

assert.match(
  notionSource,
  /async function resolveNotionAssetUrl\(/,
  "Notion work covers should be resolved through a cache helper."
);

assert.match(
  notionSource,
  /await downloadImage\(\s*file\.file\.url,[\s\S]*notionFileCacheId\(pageId, index, file\.name, file\.file\.url\)/,
  "Notion file covers should be downloaded to local public assets instead of rendered as expiring S3 URLs."
);

assert.match(
  notionSource,
  /const downloadedCover =\s*\n\s*\(await resolveNotionAssetUrl\(pageCover, page\.id, 0, force\)\) \|\|[\s\S]*\(await resolveNotionAssetUrl\(coverFile, page\.id, 1, force\)\)/,
  "Work cover resolution should prefer the current Notion cover before falling back to local assets."
);

assert.match(
  notionSource,
  /const workCoverFallbackBySlug: Record<string, string>/,
  "Known works should have local cover fallbacks when Notion cover downloads fail."
);

assert.match(
  notionSource,
  /function sanitizeWorkCoverUrl\(url\?: string\)/,
  "Work cover URLs should be sanitized before reaching the client."
);

assert.match(
  notionSource,
  /prod-files-secure\.s3\.us-west-2\.amazonaws\.com/,
  "Expiring Notion S3 cover URLs should not be rendered directly."
);

assert.match(
  notionSource,
  /const cover = sanitizeWorkCoverUrl\(downloadedCover\) \|\| localCoverFallback \|\| "\/work\/_placeholder\.svg";/,
  "Work cover resolution should fall back to local assets or a placeholder after S3 sanitization."
);

assert.doesNotMatch(
  fallbackTable,
  /\/notion-images\//,
  "Stable work cover fallbacks should not point at ignored Notion cache files."
);

assert.match(
  workCardSource,
  /const coverAspect = "16 \/ 10";/,
  "Work list cards should use one fixed cover ratio so portrait works align with the grid."
);

console.log("PASS: work list covers are cached locally and use a fixed list ratio.");
