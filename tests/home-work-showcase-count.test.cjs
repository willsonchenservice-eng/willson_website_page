const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(path.join(process.cwd(), "app", "page.tsx"), "utf8");

assert(
  source.includes("const works = allWorks.slice(0, 5);"),
  "Homepage should pass the first five sorted works into WorkShowcase."
);

console.log("PASS: homepage WorkShowcase uses the first five works.");
