const fs = require("fs");
const path = require("path");

const nextConfig = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");

if (!/trailingSlash:\s*true/.test(nextConfig)) {
  console.error("FAIL: next.config.ts should keep trailingSlash enabled for OSS/CDN static hosting.");
  process.exit(1);
}

function collectPages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectPages(entryPath);
    return entry.name === "page.tsx" && entryPath.includes("[") ? [entryPath] : [];
  });
}

const dynamicPages = collectPages(path.join(process.cwd(), "app"));

let failed = false;

for (const file of dynamicPages) {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(process.cwd(), file);

  if (!/export\s+async\s+function\s+generateStaticParams/.test(source)) {
    console.error(`FAIL: ${relative} must export generateStaticParams for static export.`);
    failed = true;
  }

  if (!/export\s+const\s+dynamicParams\s*=\s*false/.test(source)) {
    console.error(`FAIL: ${relative} must set dynamicParams = false for static export.`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("PASS: dynamic detail routes are compatible with static export.");
