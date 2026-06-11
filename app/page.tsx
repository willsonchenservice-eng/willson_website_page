import Link from "next/link";
import { getAllWork, getAllWritingFull, getAllBeliefs, getAllSocial, getAllPhotos } from "@/lib/content";
import WorkShowcase from "@/components/WorkShowcase";
import { Contact7 } from "@/components/contact7";
import Hero from "@/components/Hero";
import SocialEmbed from "@/components/SocialEmbed";
import { site } from "@/lib/site";
import { ArrowUpRight, Boxes, CalendarDays, MousePointerClick, ShieldCheck, Sparkles } from "lucide-react";

const beliefIcons = [ShieldCheck, MousePointerClick, Sparkles, Boxes];

function formatPostDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function getPostExcerpt(post: { content?: string; summary?: string }) {
  const source = post.content?.trim() || post.summary?.trim() || "";
  return source
    .replace(/<[^>]+>/g, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]*)]\([^)]+\)/g, "$1")
    .replace(/[#*_~`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function Home() {
  const [allWorks, allPosts, beliefs, social, photos] = await Promise.all([
    getAllWork(),
    getAllWritingFull(),
    getAllBeliefs(),
    getAllSocial(),
    getAllPhotos(),
  ]);
  const works = allWorks.slice(0, 4);
  const posts = allPosts.slice(0, 5);

  return (
    <>
      <Hero photos={photos} />

      <div className="notebook-shell">
        {/* ── Selected Work ───────────────────────────── */}
          <section className="my-[200px]">
            <WorkShowcase works={works} />
          </section>

        {/* ── Manifesto ───────────────────────────── */}
          <section className="my-[200px]">
            <ul className="mt-8 grid border-l border-t border-line sm:grid-cols-2 xl:grid-cols-4">
              {beliefs.map((b, i) => (
                <li
                  key={b.n}
                  className="min-h-[340px] border-b border-r border-line px-8 py-10 sm:min-h-[430px] lg:px-10 lg:py-12"
                >
                  {(() => {
                    const Icon = beliefIcons[i % beliefIcons.length];
                    return <Icon className="size-10 stroke-[2.2]" aria-hidden />;
                  })()}
                  <h3
                    className="mt-20 text-balance font-semibold leading-[1.16] text-foreground sm:mt-24"
                    style={{
                      fontFamily: 'Helvetica, "Courier New", Courier, monospace',
                      fontSize: "clamp(1.75rem, 2.35vw, 2.55rem)",
                    }}
                  >
                    {b.lead}
                  </h3>
                  <p className="mt-12 text-base leading-relaxed text-muted sm:text-lg">
                    {b.tail}
                  </p>
                </li>
              ))}
            </ul>
          </section>

        {/* ── Latest from the Notebook ───────────────────────────── */}
          <section className="my-[200px]">
            <div className="relative grid gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
              <div className="top-28 h-fit md:sticky">
                <h2
                  className="leading-none"
                  style={{
                    fontFamily: 'Helvetica, "Courier New", Courier, monospace',
                    fontSize: "clamp(3.2rem, 7vw, 6rem)",
                  }}
                >
                  Blog
                </h2>
                <p className="mt-6 max-w-sm text-base leading-relaxed text-muted sm:text-lg">
                  读到的、想到的、做项目时被刺到的。把这些碎片按时间收起来，留给之后的自己回看。
                </p>
                <Link
                  href="/writing"
                  className="mt-8 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium transition hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  看全部 Blog
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>

              <div className="relative">
                <div className="absolute bottom-6 left-[15px] top-6 hidden w-px bg-line sm:block" />
                <div className="flex flex-col gap-6">
                  {posts.map((post) => (
                    <article
                      key={post.slug}
                      className="relative block rounded-lg border border-line bg-background p-6 sm:ml-10 sm:p-7"
                    >
                      <span
                        aria-hidden
                        className="absolute -left-[31px] top-8 hidden size-3 rounded-full border border-foreground bg-background sm:block"
                      />
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {formatPostDate(post.date)}
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                        {post.title}
                      </h3>
                      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted sm:text-base">
                        {getPostExcerpt(post)}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

        {/* ── On Xiaohongshu ───────────────────────────── */}
          <section className="my-[200px]">
            <SocialEmbed platform="小红书" posts={social} />
          </section>

        {/* ── Services teaser ───────────────────────────── */}
          <section className="mt-[100px] mb-4">
            <Contact7
              className="py-0"
              title="想合作？"
              description="项目合作或作品集指导，欢迎私聊。你可以直接发邮件、加微信，也可以先看委托单了解服务方式。"
              items={[
                {
                  icon: "mail",
                  label: "邮箱",
                  description: "适合发送需求背景、项目资料或作品集链接。",
                  value: site.email,
                  href: `mailto:${site.email}`,
                },
                {
                  icon: "message",
                  label: "微信",
                  description: "适合快速沟通时间、问题和下一步安排。",
                  value: site.wechatId,
                },
                {
                  icon: "list",
                  label: "作品集咨询",
                  description: "适合准备跳槽、转岗、求职前整理作品集。",
                  value: "查看委托单",
                  href: "/services",
                },
                {
                  icon: "briefcase",
                  label: "项目合作",
                  description: "适合独立产品、B 端体验、内容工具等方向。",
                  value: "发邮件聊聊",
                  href: `mailto:${site.email}`,
                },
              ]}
            />
          </section>
      </div>
    </>
  );
}
