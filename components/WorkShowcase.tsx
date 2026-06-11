"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import type { WorkMeta } from "@/lib/content";
import {
  getShowcaseImageFit,
  getShowcaseImageFitClass,
  isShowcaseVideoSource,
} from "@/components/workShowcaseFit";

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function ShowcaseMedia({
  work,
  priority = false,
  className = "",
}: {
  work: WorkMeta;
  priority?: boolean;
  className?: string;
}) {
  const isVideo = work.coverType === "video" || isShowcaseVideoSource(work.cover);
  const [fitClass, setFitClass] = useState(() =>
    getShowcaseImageFitClass(getShowcaseImageFit(0, 0, work.cover))
  );

  useEffect(() => {
    setFitClass(getShowcaseImageFitClass(getShowcaseImageFit(0, 0, work.cover)));
  }, [work.cover]);

  if (isVideo) {
    return (
      <video
        src={work.cover}
        className={`h-full w-full object-contain ${className}`}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-label={work.title}
      />
    );
  }

  return (
    <Image
      src={work.cover!}
      alt={work.title}
      fill
      priority={priority}
      sizes="(min-width: 1024px) 760px, 92vw"
      className={`${fitClass} ${className}`}
      unoptimized
      onLoad={(event) => {
        const image = event.currentTarget;
        setFitClass(
          getShowcaseImageFitClass(
            getShowcaseImageFit(image.naturalWidth, image.naturalHeight, work.cover)
          )
        );
      }}
    />
  );
}

function showcaseFrameBackground(_work: WorkMeta) {
  return "bg-black";
}

export default function WorkShowcase({ works }: { works: WorkMeta[] }) {
  const visibleWorks = useMemo(
    () => works.filter((work) => work.cover),
    [works]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const leftRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLAnchorElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);
  const pendingDirectionRef = useRef(0);

  const active = visibleWorks[wrapIndex(activeIndex, visibleWorks.length)];
  const previous = visibleWorks[wrapIndex(activeIndex - 1, visibleWorks.length)];
  const next = visibleWorks[wrapIndex(activeIndex + 1, visibleWorks.length)];
  const hasSiblings = visibleWorks.length > 1;

  useEffect(() => {
    const center = centerRef.current;
    const sides = [leftRef.current, rightRef.current].filter(Boolean);
    if (!center) return;

    const direction = pendingDirectionRef.current;
    if (!direction) {
      animatingRef.current = false;
      gsap.set(center, { xPercent: -50, yPercent: -50, x: 0, scale: 1, opacity: 1 });
      gsap.set(sides, { yPercent: -50, scale: 0.94, opacity: 1 });
      gsap.set(copyRef.current, { y: 0, opacity: 1 });
      return;
    }

    gsap.set(center, {
      xPercent: -50,
      yPercent: -50,
      x: direction * 52,
      scale: 1.045,
      opacity: 1,
    });
    gsap.set(sides, { yPercent: -50, scale: 0.9, opacity: 1 });
    gsap.set(copyRef.current, { y: 18, opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        pendingDirectionRef.current = 0;
        animatingRef.current = false;
        gsap.set(copyRef.current, { y: 0, opacity: 1 });
      },
    });

    tl.to(center, {
      x: 0,
      scale: 1,
      duration: 0.5,
    })
      .to(
        sides,
        {
          scale: 0.94,
          duration: 0.48,
          stagger: 0.035,
        },
        "<"
      )
      .to(
        copyRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.34,
        },
        "<0.1"
      );

    return () => {
      tl.kill();
    };
  }, [activeIndex]);

  if (visibleWorks.length === 0) return null;

  function changeWork(direction: number) {
    if (!hasSiblings) return;
    if (animatingRef.current) return;

    const center = centerRef.current;
    if (!center) return;

    const outgoingSide = direction > 0 ? rightRef.current : leftRef.current;
    const restingSide = direction > 0 ? leftRef.current : rightRef.current;
    const animatedItems = [center, outgoingSide, restingSide, copyRef.current].filter(Boolean);

    gsap.killTweensOf(animatedItems);
    animatingRef.current = true;
    pendingDirectionRef.current = direction;

    gsap
      .timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => setActiveIndex((index) => index + direction),
      })
      .to(center, {
        x: direction * -52,
        scale: 0.92,
        duration: 0.26,
      })
      .to(
        outgoingSide,
        {
          scale: 1.05,
          duration: 0.26,
        },
        "<"
      )
      .to(
        restingSide,
        {
          scale: 0.88,
          duration: 0.26,
        },
        "<"
      )
      .to(
        copyRef.current,
        {
          y: -16,
          opacity: 0,
          duration: 0.18,
        },
        "<"
      );
  }

  return (
    <section className="relative mt-10 overflow-hidden pb-14 sm:pb-18">
      <div className="relative mx-auto h-[360px] max-w-[1180px] sm:h-[500px] lg:h-[590px]">
        {hasSiblings && (
          <>
            <div
              ref={leftRef}
              aria-hidden
              className={`pointer-events-none absolute -left-10 top-1/2 hidden aspect-[4434/2986] w-[min(30vw,360px)] overflow-hidden rounded-[24px] shadow-[0_18px_50px_-34px_rgba(0,0,0,0.35)] md:block lg:-left-20 ${showcaseFrameBackground(previous)}`}
            >
              <ShowcaseMedia
                work={previous}
                className="saturate-[0.88] transition duration-500"
              />
            </div>

            <div
              ref={rightRef}
              aria-hidden
              className={`pointer-events-none absolute -right-10 top-1/2 hidden aspect-[4434/2986] w-[min(30vw,360px)] overflow-hidden rounded-[24px] shadow-[0_18px_50px_-34px_rgba(0,0,0,0.35)] md:block lg:-right-20 ${showcaseFrameBackground(next)}`}
            >
              <ShowcaseMedia
                work={next}
                className="saturate-[0.88] transition duration-500"
              />
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[15%] bg-gradient-to-r from-[var(--background)] via-[color-mix(in_srgb,var(--background)_52%,transparent)] to-transparent md:block"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[15%] bg-gradient-to-l from-[var(--background)] via-[color-mix(in_srgb,var(--background)_52%,transparent)] to-transparent md:block"
            />

            <button
              type="button"
              aria-label={`查看上一个作品：${previous.title}`}
              onClick={() => changeWork(-1)}
              className="absolute left-0 top-1/2 z-30 hidden h-[min(42vw,320px)] w-[28%] -translate-y-1/2 cursor-pointer rounded-[24px] bg-transparent md:block"
            />
            <button
              type="button"
              aria-label={`查看下一个作品：${next.title}`}
              onClick={() => changeWork(1)}
              className="absolute right-0 top-1/2 z-30 hidden h-[min(42vw,320px)] w-[28%] -translate-y-1/2 cursor-pointer rounded-[24px] bg-transparent md:block"
            />
          </>
        )}

        <Link
          ref={centerRef}
          href={`/work/${active.slug}`}
          data-cursor-text="VIEW"
          className={`group absolute left-1/2 top-1/2 z-20 block aspect-[4434/2986] w-[min(90vw,760px)] overflow-hidden rounded-[28px] shadow-[0_24px_70px_-42px_rgba(0,0,0,0.55)] ${showcaseFrameBackground(active)}`}
        >
          <ShowcaseMedia work={active} priority />
        </Link>
      </div>

      <div ref={copyRef} className="mx-auto flex max-w-3xl flex-col items-center pt-6 text-center">
        <h2
          className="max-w-[720px] text-balance font-semibold leading-[1.15] text-foreground"
          style={{
            fontFamily: 'Helvetica, "Courier New", Courier, monospace',
            fontSize: "clamp(2rem, 4vw, 3.15rem)",
          }}
        >
          {active.title}
        </h2>

        {active.summary && (
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">
            {active.summary}
          </p>
        )}

        <Link
          href={`/work/${active.slug}`}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)] px-6 text-sm font-semibold text-foreground transition hover:bg-[color-mix(in_srgb,var(--foreground)_11%,transparent)]"
        >
          查看作品
          <span aria-hidden className="text-lg leading-none">
            ↗
          </span>
        </Link>
      </div>
    </section>
  );
}
