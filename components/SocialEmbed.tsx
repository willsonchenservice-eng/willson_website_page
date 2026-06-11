"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

export interface SocialPost {
  /** Path to the local mp4 (or other browser-playable source). */
  src: string;
  /** Link to the original post on the platform. */
  href: string;
  /** Title as it appears on the platform — wrapped in 「」 visually. */
  postTitle: string;
  /** 1–3 sentence body. Why this post exists, what it's about. */
  body: string;
  poster?: string;
  /** CSS aspect-ratio string, e.g. "9/16" or "16/9". Defaults to "16/9". */
  aspectRatio?: string;
}

/**
 * SocialEmbed — video cards from a social platform. The preview auto-plays
 * muted on hover/focus, then opens a fullscreen player on click.
 */

export default function SocialEmbed({
  posts,
  platform = "小红书",
}: {
  posts: SocialPost[];
  platform?: string;
}) {
  const [openPost, setOpenPost] = useState<SocialPost | null>(null);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((p, i) => (
          <PostCard
            key={p.src}
            post={p}
            index={i}
            platform={platform}
            onOpen={() => setOpenPost(p)}
          />
        ))}
      </div>

      <VideoLightbox
        post={openPost}
        platform={platform}
        onClose={() => setOpenPost(null)}
      />
    </>
  );
}

function PostCard({
  post,
  index,
  platform,
  onOpen,
}: {
  post: SocialPost;
  index: number;
  platform: string;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  const play = () => {
    ref.current?.play().catch(() => {
      /* autoplay-after-interaction always works; swallow any race */
    });
  };
  const pause = () => {
    const v = ref.current;
    if (!v) return;
    v.pause();
    try {
      v.currentTime = 0;
    } catch {
      /* ignore if not seekable yet */
    }
  };

  return (
    <article className="rounded-lg border border-line bg-background p-4 sm:p-5">
      <div className="relative">
        <button
          type="button"
          onClick={onOpen}
          onMouseEnter={play}
          onMouseLeave={pause}
          onFocus={play}
          onBlur={pause}
          data-cursor-text="PLAY"
          aria-label={`播放《${post.postTitle}》`}
          className="relative block w-full cursor-pointer overflow-hidden rounded-md border border-line bg-line text-left"
        >
          <div
            className="relative overflow-hidden bg-line"
            style={{ aspectRatio: post.aspectRatio || "16 / 9" }}
          >
            <video
              ref={ref}
              src={post.src}
              poster={post.poster}
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              <Play className="size-3 fill-current" aria-hidden />
              {platform}
            </span>
          </div>
        </button>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          0{index + 1}
        </p>
        <h3 className="mt-3 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
          {post.postTitle}
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          {post.body}
        </p>

        <Link
          href={post.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground"
        >
          在{platform}看完整版
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/**
 * Fullscreen video lightbox. Plays the mp4 with native controls, unmuted by
 * default. Closes on: backdrop click, close button, Escape key. Locks body
 * scroll while open.
 */
function VideoLightbox({
  post,
  platform,
  onClose,
}: {
  post: SocialPost | null;
  platform: string;
  onClose: () => void;
}) {
  const open = post !== null;

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !post) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={post.postTitle}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 sm:px-8"
      style={{ background: "rgba(8, 8, 6, 0.88)", backdropFilter: "blur(6px)" }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭"
        className="absolute top-5 right-5 sm:top-7 sm:right-7 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 6 L18 18 M18 6 L6 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Stop propagation so clicks on the player don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1200px] max-h-full flex flex-col gap-4"
      >
        <div
          className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: post.aspectRatio || "16 / 9" }}
        >
          <video
            // key forces React to mount a fresh video element each open
            key={post.src}
            src={post.src}
            poster={post.poster}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        </div>

        {/* Caption strip below the player */}
        <div className="flex flex-wrap items-baseline justify-between gap-3 text-white/85">
          <h3 className="serif italic text-lg sm:text-xl">
            「{post.postTitle}」
          </h3>
          <Link
            href={post.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            在{platform}看完整版
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
