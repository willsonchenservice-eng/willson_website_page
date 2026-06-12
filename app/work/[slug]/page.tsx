import { notFound } from "next/navigation";
import Link from "next/link";
import { AlignLeft, ArrowLeft, ExternalLink } from "lucide-react";
import { getAllWork, getWork } from "@/lib/content";
import MdxBody from "@/components/MdxBody";
import { Badge } from "@/components/ui/badge";
import WorkCoverImage from "@/components/WorkCoverImage";

export async function generateStaticParams() {
  const works = await getAllWork();
  return works.map((w) => ({ slug: w.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getWork(slug);
  if (!post) return {};
  return { title: post.meta.title, description: post.meta.summary };
}

interface ExtendedMeta {
  title: string;
  client?: string;
  role?: string;
  year?: string;
  summary?: string;
  summaryIsGenerated?: boolean;
  cover?: string;
  coverType?: "image" | "video";
  coverFit?: "cover" | "contain";
  coverAspect?: string;
  externalLink?: string;
  tags?: string[];
}

function normalizeAspectRatio(value?: string) {
  if (!value) return "4430 / 3328";
  const normalized = value.trim().replace(":", " / ");
  if (/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test(normalized)) return normalized;
  if (/^\d+(\.\d+)?$/.test(normalized)) return normalized;
  return "4430 / 3328";
}

function getWorkSections(content: string) {
  return Array.from(content.matchAll(/^##\s+(.+)$/gm)).map((match, index) => ({
    id: `section-${index + 1}`,
    title: match[1].replace(/[#*_`]/g, "").trim(),
  }));
}

function addSectionAnchors(content: string, sections: ReturnType<typeof getWorkSections>) {
  let sectionIndex = 0;
  return content.replace(/^##\s+(.+)$/gm, (heading) => {
    const section = sections[sectionIndex];
    sectionIndex += 1;
    if (!section) return heading;
    return `<span id="${section.id}" className="block scroll-mt-28" />\n${heading}`;
  });
}

export default async function WorkDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getWork(slug);
  if (!post) notFound();

  const meta = post.meta as unknown as ExtendedMeta;
  const coverAspect = normalizeAspectRatio(meta.coverAspect);
  const isVideoCover = meta.coverType === "video";
  const sections = getWorkSections(post.content);
  const content = addSectionAnchors(post.content, sections);
  const projectFacts = [
    { label: "客户", value: meta.client },
    { label: "角色", value: meta.role },
    { label: "时间", value: meta.year },
  ].filter((item) => item.value);

  return (
    <div className="notebook-shell py-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/work"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span>回到作品</span>
        </Link>

        <article className="relative mt-8 grid-cols-[minmax(0,1fr)_260px] gap-16 lg:grid">
          <div className="min-w-0">
            <header>
              <div className="flex flex-wrap gap-2">
                {(meta.tags ?? []).slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1
                className="mt-4 max-w-4xl font-semibold leading-[1.02] tracking-normal"
                style={{
                  fontFamily: 'Helvetica, "Courier New", Courier, monospace',
                  fontSize: "clamp(2.6rem, 6vw, 5.4rem)",
                }}
              >
                {meta.title}
              </h1>

              {meta.summary && !meta.summaryIsGenerated && (
                <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {meta.summary}
                </p>
              )}

              {meta.externalLink && (
                <a
                  href={meta.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background shadow-[0_12px_30px_-24px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:bg-[var(--red-pen)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--red-pen)]"
                  aria-label={`打开作品链接：${meta.title}`}
                >
                  打开作品链接
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              )}
            </header>

            {meta.cover && (
              <figure className="my-10">
                {isVideoCover ? (
                  <div
                    className="relative overflow-hidden rounded-lg bg-black shadow-[0_24px_70px_-48px_rgba(0,0,0,0.55)]"
                    style={{ aspectRatio: coverAspect }}
                  >
                    <video
                      src={meta.cover}
                      className="h-full w-full object-contain"
                      muted
                      loop
                      playsInline
                      autoPlay
                      controls
                      preload="metadata"
                      aria-label={meta.title}
                    />
                  </div>
                ) : (
                  <WorkCoverImage
                    src={meta.cover}
                    alt={meta.title}
                    className="block h-auto w-full rounded-lg shadow-[0_24px_70px_-48px_rgba(0,0,0,0.55)]"
                  />
                )}
              </figure>
            )}

            <MdxBody source={content} className="prose-work-detail" />
          </div>

          <aside className="sticky top-8 hidden h-fit lg:block">
            <div>
              {projectFacts.length > 0 && (
                <dl className="space-y-5 text-sm">
                  {projectFacts.map((item) => (
                    <div key={item.label}>
                      <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="mt-1 leading-relaxed text-foreground">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {sections.length > 0 && (
                <div className="mt-10">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <AlignLeft className="size-4" aria-hidden />
                    本页内容
                  </span>
                  <nav className="mt-3 text-sm">
                    <ul className="space-y-1">
                      {sections.map((section) => (
                        <li key={section.id}>
                          <a
                            href={`#${section.id}`}
                            className="block py-1 leading-relaxed text-muted-foreground transition hover:text-foreground"
                          >
                            {section.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </aside>
        </article>
      </div>
    </div>
  );
}
