const fs = require("fs");
const path = require("path");
const assert = require("assert");

const source = fs.readFileSync(
  path.join(process.cwd(), "components", "WorkShowcase.tsx"),
  "utf8"
);
const css = fs.readFileSync(
  path.join(process.cwd(), "app", "globals.css"),
  "utf8"
);

assert(
  source.includes("work-showcase-center-card") &&
    css.includes(".work-showcase-center-card") &&
    css.includes("translate(calc(-50% + var(--work-x, 0px)), -50%)"),
  "WorkShowcase center card should be centered by CSS variables before GSAP runs."
);

assert(
  source.includes("work-showcase-side-card") &&
    source.includes("md:block") &&
    css.includes(".work-showcase-side-card") &&
    css.includes("translateY(-50%) scale(var(--work-scale, 0.94))"),
  "WorkShowcase side cards should keep the original desktop visibility and CSS centering."
);

assert(
  source.includes("w-[min(90vw,760px)]") &&
    source.includes("max-md:w-[min(82vw,760px)]"),
  "WorkShowcase center card should keep the desktop width and only shrink on mobile."
);

assert(
  source.includes("w-[min(30vw,360px)]") &&
    source.includes("max-md:w-[46vw]") &&
    source.includes("max-md:block"),
  "WorkShowcase side cards should keep desktop sizing and only peek on mobile."
);

assert(
  source.includes("max-md:rounded-[16px]"),
  "WorkShowcase mobile cards should use 16px rounding."
);

assert(
  css.includes("left: calc(50% - 87vw - 12px);") &&
    css.includes("right: calc(50% - 87vw - 12px);"),
  "WorkShowcase mobile side cards should sit outside the center card with a gap."
);

assert(
  !source.includes("yPercent") &&
    !source.includes("xPercent"),
  "WorkShowcase should not let GSAP replace CSS centering transforms."
);

assert(
  source.includes("overflow-hidden") &&
    source.includes("max-md:overflow-visible"),
  "WorkShowcase should restore desktop clipping and relax it only on mobile."
);

console.log("PASS: WorkShowcase has a CSS layout fallback before JS animation.");
