const fs = require("fs");
const path = require("path");

const configPath = path.join(process.cwd(), "vercel.json");

if (!fs.existsSync(configPath)) {
  console.error("FAIL: vercel.json is required to keep the Vercel deployment deterministic.");
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (error) {
  console.error(`FAIL: vercel.json must be valid JSON. ${error.message}`);
  process.exit(1);
}

const requiredEntries = {
  framework: "nextjs",
  buildCommand: "npm run build",
  outputDirectory: "out",
  trailingSlash: true,
};

for (const [key, expected] of Object.entries(requiredEntries)) {
  if (config[key] !== expected) {
    console.error(`FAIL: vercel.json ${key} must be ${JSON.stringify(expected)}.`);
    process.exit(1);
  }
}

if ("env" in config || "build" in config) {
  console.error("FAIL: vercel.json must not contain inline env/build secrets.");
  process.exit(1);
}

const headers = Array.isArray(config.headers) ? config.headers : [];
const nextStaticHeader = headers.find((entry) => entry.source === "/_next/static/:path*");
const cacheControl = nextStaticHeader?.headers?.find((header) => header.key.toLowerCase() === "cache-control");

if (cacheControl?.value !== "public, max-age=31536000, immutable") {
  console.error("FAIL: /_next/static assets should use a long immutable cache on Vercel.");
  process.exit(1);
}

const htmlWideImmutable = headers.some((entry) => {
  const source = entry.source || "";
  const value = entry.headers
    ?.find((header) => header.key.toLowerCase() === "cache-control")
    ?.value || "";

  return source === "/:path*" && /immutable|max-age=31536000/.test(value);
});

if (htmlWideImmutable) {
  console.error("FAIL: HTML routes must not receive a broad immutable cache header.");
  process.exit(1);
}

for (const source of ["/work-covers/:path*", "/notion-images/:path*", "/wechat-images/:path*", "/wall/:path*"]) {
  const entry = headers.find((header) => header.source === source);
  const value = entry?.headers?.find((header) => header.key.toLowerCase() === "cache-control")?.value || "";

  if (!/s-maxage=604800/.test(value) || !/stale-while-revalidate=86400/.test(value)) {
    console.error(`FAIL: ${source} should use bounded edge caching for Vercel.`);
    process.exit(1);
  }
}

console.log("PASS: Vercel static deployment config is deterministic and cache-safe.");
