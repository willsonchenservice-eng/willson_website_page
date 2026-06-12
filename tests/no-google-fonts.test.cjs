const fs = require("fs");
const path = require("path");
const assert = require("assert");

const layoutSource = fs.readFileSync(
  path.join(process.cwd(), "app", "layout.tsx"),
  "utf8"
);
const globalsSource = fs.readFileSync(
  path.join(process.cwd(), "app", "globals.css"),
  "utf8"
);

assert(
  !layoutSource.includes("next/font/google"),
  "Root layout should not depend on Google Fonts at build time."
);

assert(
  globalsSource.includes('--font-sans: "Inter"'),
  "Tailwind font-sans should use the local @fontsource Inter face."
);

console.log("PASS: site fonts are local and build without Google Fonts.");
