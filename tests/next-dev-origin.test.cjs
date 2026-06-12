const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(
  path.join(process.cwd(), "next.config.ts"),
  "utf8"
);

assert(
  source.includes("allowedDevOrigins") && source.includes('"127.0.0.1"'),
  "Next dev server should allow the in-app browser 127.0.0.1 origin."
);

console.log("PASS: Next dev allows the in-app browser origin.");
