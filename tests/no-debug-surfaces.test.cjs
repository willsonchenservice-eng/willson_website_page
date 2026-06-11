const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const appApiDir = path.join(process.cwd(), "app", "api");
const apiRoutes = fs.existsSync(appApiDir)
  ? fs
      .readdirSync(appApiDir, { recursive: true })
      .map(String)
      .filter((route) => route.endsWith("route.ts"))
  : [];

assert(
  !apiRoutes.some((route) => route.startsWith("test-")),
  "Public test/debug API route handlers should not be present in app/api."
);

function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [entryPath] : [];
  });
}

const appSource = collectSourceFiles(path.join(process.cwd(), "app"))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

assert(
  !appSource.includes("WritingDetail Debug") &&
    !appSource.includes("Available slugs") &&
    !appSource.includes("Requested slug"),
  "App pages should not log debug slug information in production code."
);

console.log("OK: no public debug API routes or writing detail debug logs.");
