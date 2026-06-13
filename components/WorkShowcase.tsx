"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import type { WorkMeta } from "@/lib/content";
import {
  getShowcaseImageFit,
  getShowcaseImageFitClass,
  isShowcaseVideoSource,
} from "@/components/workShowcaseFit";
import { WORK_COVER_PLACEHOLDER } from "@/components/WorkCoverImage";

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
  const [imageSrc, setImageSrc] = useState(work.cover ?? WORK_COVER_PLACEHOLDER);
  const [fitClass, setFitClass] = useState(() =>
    getShowcaseImageFitClass(getShowcaseImageFit(0, 0, work.cover))
  );

  useEffect(() => {
    setImageSrc(work.cover ?? WORK_COVER_PLACEHOLDER);
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
      src={imageSrc}
      alt={work.title}
      fill
      priority={priority}
      sizes="(min-width: 1024px) 760px, 92vw"
      className={`${fitClass} ${className}`}
      unoptimized
      onError={() => {
        if (imageSrc !== WORK_COVER_PLACEHOLDER) {
          setImageSrc(WORK_COVER_PLACEHOLDER);
          setFitClass("object-contain");
        }
      }}
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
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const suppressClickRef = useRef(false);

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
      gsap.set(center, { "--work-x": "0px", "--work-scale": 1, opacity: 1 });
      gsap.set(sides, { "--work-scale": 0.94, opacity: 1 });
      gsap.set(copyRef.current, { y: 0, opacity: 1 });
      return;
    }

    gsap.set(center, {
      "--work-x": `${direction * 52}px`,
      "--work-scale": 1.045,
      opacity: 1,
    });
    gsap.set(sides, { "--work-scale": 0.9, opacity: 1 });
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
      "--work-x": "0px",
      "--work-scale": 1,
      duration: 0.5,
    })
      .to(
        sides,
        {
          "--work-scale": 0.94,
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
        "--work-x": `${direction * -52}px`,
        "--work-scale": 0.92,
        duration: 0.26,
      })
      .to(
        outgoingSide,
        {
          "--work-scale": 1.05,
          duration: 0.26,
        },
        "<"
      )
      .to(
        restingSide,
        {
          "--work-scale": 0.88,
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

  function handlePointerDown(event: PointerEvent<HTMLAnchorElement>) {
    if (!hasSiblings) return;

    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  }

  function handlePointerUp(event: PointerEvent<HTMLAnchorElement>) {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);
    const minSwipeDistance = 48;

    if (horizontalDistance < minSwipeDistance || horizontalDistance < verticalDistance * 1.25) {
      return;
    }

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 250);
    changeWork(deltaX < 0 ? 1 : -1);
  }

  function handlePointerCancel() {
    swipeStartRef.current = null;
  }

  return (
    <section className="relative mt-10 overflow-hidden pb-14 max-md:overflow-visible sm:pb-18">
      <div className="relative mx-auto h-[360px] max-w-[1180px] sm:h-[500px] lg:h-[590px]">
        {hasSiblings && (
          <>
            <div
              ref={leftRef}
              aria-hidden
              className={`work-showcase-side-card work-showcase-side-left pointer-events-none absolute -left-10 top-1/2 hidden aspect-[4434/2986] w-[min(30vw,360px)] overflow-hidden rounded-[24px] shadow-[0_18px_50px_-34px_rgba(0,0,0,0.35)] max-md:block max-md:aspect-[1400/1051] max-md:w-[46vw] max-md:rounded-[16px] md:block lg:-left-20 ${showcaseFrameBackground(previous)}`}
            >
              <ShowcaseMedia
                work={previous}
                className="saturate-[0.88] transition duration-500"
              />
            </div>

            <div
              ref={rightRef}
              aria-hidden
              className={`work-showcase-side-card work-showcase-side-right pointer-events-none absolute -right-10 top-1/2 hidden aspect-[4434/2986] w-[min(30vw,360px)] overflow-hidden rounded-[24px] shadow-[0_18px_50px_-34px_rgba(0,0,0,0.35)] max-md:block max-md:aspect-[1400/1051] max-md:w-[46vw] max-md:rounded-[16px] md:block lg:-right-20 ${showcaseFrameBackground(next)}`}
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
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClick={(event) => {
            if (!suppressClickRef.current) return;
            event.preventDefault();
            suppressClickRef.current = false;
          }}
          className={`work-showcase-center-card group absolute left-1/2 top-1/2 z-20 block aspect-[4434/2986] w-[min(90vw,760px)] touch-pan-y overflow-hidden rounded-[28px] shadow-[0_24px_70px_-42px_rgba(0,0,0,0.55)] max-md:aspect-[1400/1051] max-md:w-[min(82vw,760px)] max-md:rounded-[16px] ${showcaseFrameBackground(active)}`}
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
