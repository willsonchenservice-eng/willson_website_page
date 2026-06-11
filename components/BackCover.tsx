import { site } from "@/lib/site";
import Stamp from "@/components/notebook/Stamp";

/**
 * Notebook back cover: the closing page. Holds hand-written signature,
 * contact lines, a copyright stamp, and a page-number style line.
 * Replaces the old graphic-design BigFooter with magnetic signature.
 */
export default function BackCover() {
  return (
    <footer className="relative mt-24 border-t border-line">
      <div className="notebook-shell py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div
            className="leading-none"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "clamp(3.5rem, 8vw, 5.5rem)",
              color: "var(--foreground)",
              transform: "rotate(-2deg)",
              letterSpacing: "-0.01em",
            }}
          >
            {site.name}
            <span style={{ color: "var(--red-pen)" }}>.</span>
          </div>

          <div className="flex items-center gap-3 sm:translate-y-2 sm:justify-end">
            <Stamp size="xs" color="var(--muted-foreground)" rotate={-3}>
              © {new Date().getFullYear()}
            </Stamp>
            <span className="text-xs text-muted">All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
