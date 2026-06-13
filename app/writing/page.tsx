import { getAllWritingFull } from "@/lib/content";
import WritingIndexClient from "@/components/WritingIndexClient";
import MdxBody from "@/components/MdxBody";

export const metadata = { title: "Blog" };

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getTopic(post: { topic?: string }) {
  return post.topic || "随笔";
}

export default async function WritingIndex() {
  const entries = await getAllWritingFull();
  const topics = ["All Articles", ...Array.from(new Set(entries.map(getTopic)))];

  return (
    <WritingIndexClient topics={topics}>
      {entries.map((post) => (
        <article
          key={post.slug}
          data-writing-article
          data-writing-topic={getTopic(post)}
          className="min-w-0 py-14 first:pt-0 sm:py-20"
        >
          <h2
            className="max-w-5xl text-[1.85rem] font-semibold leading-[1.16] tracking-normal text-foreground sm:text-4xl"
            style={{ fontFamily: 'Helvetica, "Courier New", Courier, monospace' }}
          >
            {post.title}
          </h2>
          <p className="mt-4 text-sm leading-none text-muted sm:mt-5 sm:text-base">
            {formatDate(post.date)}
          </p>
          <MdxBody source={post.content} className="blog-list-body mt-6 sm:mt-8" />
        </article>
      ))}
    </WritingIndexClient>
  );
}
