import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import MdxBody from "@/components/MdxBody";
import { getAllWriting, getWriting } from "@/lib/content";

export async function generateStaticParams() {
  const writings = await getAllWriting();
  return writings.map((writing) => ({ slug: writing.slug }));
}

export const dynamicParams = false;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const writing = await getWriting(slug);
  if (!writing) return {};
  return { title: writing.meta.title, description: writing.meta.summary };
}

export default async function WritingDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const writing = await getWriting(slug);
  if (!writing) notFound();

  return (
    <article className="notebook-shell py-8 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/writing"
          className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span>回到 Blog</span>
        </Link>

        <header className="mt-10 border-b border-line pb-8 sm:mt-14 sm:pb-10">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <time dateTime={writing.meta.date}>{formatDate(writing.meta.date)}</time>
            {writing.meta.topic && <span>· {writing.meta.topic}</span>}
          </div>
          <h1
            className="mt-4 text-[2.4rem] font-semibold leading-[1.08] tracking-normal text-foreground sm:text-6xl"
            style={{ fontFamily: 'Helvetica, "Courier New", Courier, monospace' }}
          >
            {writing.meta.title}
          </h1>
          {writing.meta.summary && (
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {writing.meta.summary}
            </p>
          )}
        </header>

        <MdxBody source={writing.content} className="blog-detail-body mt-10 sm:mt-14" />
      </div>
    </article>
  );
}
