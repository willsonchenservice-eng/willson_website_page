const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(
  path.join(process.cwd(), "components", "PhotoWall.tsx"),
  "utf8"
);

assert(
  source.includes("const mediaFrameStyle"),
  "PhotoWall should keep media frame sizing in one explicit style object."
);

assert(
  !source.includes("height: `calc(var(--mh) * var(--scale, 1))`"),
  "PhotoWall contain media frames should not force a fixed height."
);

assert(
  !source.includes("absolute inset-0 w-full h-full"),
  "PhotoWall images should stay in normal flow so the frame height follows the media content."
);

console.log("PASS: PhotoWall media frames follow content height.");
