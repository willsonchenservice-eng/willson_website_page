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
    <div className="notebook-shell pb-20 sm:pb-24">
      <header ref={heroRef} className="mx-auto max-w-6xl pt-10 text-center sm:pt-12">
        <h1
          className="text-[3.25rem] font-semibold leading-[0.95] tracking-normal text-foreground sm:text-[5rem] lg:text-[6.25rem]"
          style={{
            fontFamily: 'Helvetica, "Courier New", Courier, monospace',
          }}
        >
          Blog
        </h1>
        <p className="mx-auto mt-6 max-w-4xl text-balance text-base font-medium leading-7 text-foreground sm:mt-8 sm:text-2xl sm:leading-relaxed">
          这里记录一些读到的、想到的，以及做项目时冒出来的问题。先放下来，过一阵子再回头看。
        </p>
      </header>

      <div className="mt-14 grid min-w-0 gap-10 sm:mt-20 lg:mt-28 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-24">
        <aside ref={sidebarRef} className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
          <nav
            aria-label="文章分类"
            className="flex w-full min-w-0 gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0"
          >
            {topics.map((topic) => {
              const isActive = topic === activeTopic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setActiveTopic(topic)}
                  className={`min-h-11 shrink-0 rounded-md px-4 py-2.5 text-left text-sm font-semibold transition sm:px-5 sm:py-3 sm:text-base lg:w-full ${
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
          <div className="blog-list-sections overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
