const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const navSource = fs.readFileSync(path.join(root, "components", "Nav.tsx"), "utf8");
const layoutSource = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", `${filePath} must be a PNG file.`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const logoPath = path.join(root, "public", "brand", "willson-chen-logo.png");
const iconPath = path.join(root, "app", "icon.png");

assert.ok(fs.existsSync(logoPath), "Header logo image must exist under public/brand.");
assert.ok(fs.existsSync(iconPath), "App Router tab icon must exist at app/icon.png.");

const logoSize = readPngSize(logoPath);
assert.ok(logoSize.width > logoSize.height * 2, "Header logo should keep the wide signature aspect ratio.");

const iconSize = readPngSize(iconPath);
assert.equal(iconSize.width, iconSize.height, "Browser tab icon should be square for favicon rendering.");
assert.ok(iconSize.width >= 256, "Browser tab icon should be large enough for modern favicon generation.");

assert.match(navSource, /from "next\/image"/, "Nav should use next/image for the brand logo asset.");
assert.match(navSource, /willson-chen-logo\.png/, "Nav should render the signature logo image.");
assert.match(navSource, /Signature logo remains wide/, "Nav should document why the header logo keeps the wide image.");
assert.match(layoutSource, /icons:\s*\{[\s\S]*icon:\s*"\/icon\.png"/, "Metadata should point browsers to the generated tab icon.");

console.log("PASS: signature logo and browser tab icon are wired.");
