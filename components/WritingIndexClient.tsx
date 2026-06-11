"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function WritingIndexClient({
  topics,
  children,
}: {
  topics: string[];
  children: ReactNode;
}) {
  const [activeTopic, setActiveTopic] = useState("All Articles");
  const heroRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const items = [heroRef.current, sidebarRef.current].filter(Boolean);
    gsap.fromTo(
      items,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.08 }
    );
  }, []);

  useEffect(() => {
    const articles = Array.from(
      mainRef.current?.querySelectorAll<HTMLElement>("[data-writing-article]") ?? []
    );
    const visibleArticles = articles.filter((article) => {
      const visible =
        activeTopic === "All Articles" || article.dataset.writingTopic === activeTopic;
      article.hidden = !visible;
      return visible;
    });

    gsap.fromTo(
      visibleArticles,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.48, ease: "power3.out", stagger: 0.055 }
    );
  }, [activeTopic]);

  return (
    <div className="notebook-shell pb-24">
      <header ref={heroRef} className="mx-auto max-w-6xl pt-12 text-center">
        <h1
          className="font-semibold leading-[0.95] tracking-normal text-foreground"
          style={{
            fontFamily: 'Helvetica, "Courier New", Courier, monospace',
            fontSize: "clamp(3.5rem, 7vw, 6.25rem)",
          }}
        >
          Blog
        </h1>
        <p className="mx-auto mt-8 max-w-4xl text-balance text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
          断断续续写下读到的、想到的、做项目时被刺到的。这里收起那些后来还值得回看的问题和线索。
        </p>
      </header>

      <div className="mt-28 grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-24">
        <aside ref={sidebarRef} className="lg:sticky lg:top-24 lg:h-fit">
          <nav
            aria-label="文章分类"
            className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0"
          >
            {topics.map((topic) => {
              const isActive = topic === activeTopic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setActiveTopic(topic)}
                  className={`shrink-0 rounded-md px-5 py-3 text-left text-base font-semibold transition lg:w-full ${
                    isActive
                      ? "bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-foreground"
                      : "text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </nav>
        </aside>

        <main ref={mainRef} className="min-w-0">
          <div className="divide-y divide-line">{children}</div>
        </main>
      </div>
    </div>
  );
}
