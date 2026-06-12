const fs = require("fs");
const path = require("path");
const assert = require("assert");

const heroSource = fs.readFileSync(
  path.join(process.cwd(), "components", "Hero.tsx"),
  "utf8"
);
const photoWallSource = fs.readFileSync(
  path.join(process.cwd(), "components", "PhotoWall.tsx"),
  "utf8"
);

assert(
  !heroSource.includes("initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}"),
  "Hero intro copy should not be invisible before client animation runs."
);

assert(
  !heroSource.includes("opacity: 0, y: 24, rotate: -6"),
  "Hero sticky note should not be invisible before client animation runs."
);

assert(
  !photoWallSource.includes("initial={{ opacity: 0, rotate: 0 }}"),
  "PhotoWall cards should not be invisible before client animation runs."
);

console.log("PASS: homepage hero content is visible by default.");
