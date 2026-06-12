"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { WorkMeta } from "@/lib/content";
import { ArrowUpRight } from "lucide-react";
import WorkCoverImage from "@/components/WorkCoverImage";

function normalizeAspectRatio(value?: string) {
  if (!value) return "16 / 10";
  const normalized = value.trim().replace(":", " / ");
  if (/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test(normalized)) return normalized;
  if (/^\d+(\.\d+)?$/.test(normalized)) return normalized;
  return "16 / 10";
}

export default function WorkCard({
  work,
  index = 0,
}: {
  work: WorkMeta;
  index?: number;
  // legacy prop, ignored
  flip?: boolean;
}) {
  const cover = work.cover;
  const coverAspect = normalizeAspectRatio(work.coverAspect);
  const isVideo = work.coverType === "video";
  const imageFit = work.coverFit === "contain" ? "object-contain" : "object-cover";
  const mediaFit = isVideo ? "object-contain" : imageFit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.035,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <Link
        href={`/work/${work.slug}`}
        data-cursor-text="READ"
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-background"
      >
        {cover && (
          <div className="p-3">
            <div
              className={`overflow-hidden rounded-md ${isVideo ? "bg-black" : "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"}`}
              style={{ aspectRatio: coverAspect }}
            >
              {isVideo ? (
                <video
                  src={cover}
                  className={`h-full w-full object-center transition-transform duration-700 ease-out group-hover:scale-[1.035] ${mediaFit}`}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  aria-label={work.title}
                />
              ) : (
                <WorkCoverImage
                  src={cover}
                  alt={work.title}
                  className={`h-full w-full object-top transition-transform duration-700 ease-out group-hover:scale-[1.035] ${mediaFit}`}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col px-6 pb-7 pt-5 sm:px-7 sm:pb-8">
          <h3
            className="font-semibold leading-[1.12] tracking-normal text-foreground"
            style={{
              fontFamily: 'Helvetica, "Courier New", Courier, monospace',
              fontSize: "clamp(1.65rem, 2.2vw, 2.25rem)",
            }}
          >
            {work.title}
          </h3>

          <p className="mt-5 line-clamp-2 text-base leading-relaxed text-muted sm:text-lg">
            {work.summary}
          </p>

          <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-medium text-foreground">
            查看作品
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
