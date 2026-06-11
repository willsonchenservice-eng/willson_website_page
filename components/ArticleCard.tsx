import type { WritingMeta } from "@/lib/content";
import Link from "next/link";
import Stamp from "@/components/notebook/Stamp";

function parseDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return {
    y: d.getFullYear(),
    m: String(d.getMonth() + 1).padStart(2, "0"),
    day: String(d.getDate()).padStart(2, "0"),
  };
}

/**
 * Compact diary-entry preview line for the home page's Blog teaser.
 * Date as a small ink stamp on the left, -serif title in the middle,
 * muted summary on a second line. Dashed bottom border like a notebook
 * underline.
 */
export default function ArticleCard({
  post,
  index = 0,
}: {
  post: WritingMeta;
  index?: number;
}) {
  const d = parseDate(post.date);
  const rotate = index % 2 === 0 ? -3 : 2;

  const inner = (
    <div className="flex items-baseline gap-4 sm:gap-6">
      <div className="shrink-0">
        {d ? (
          <Stamp size="xs" color="var(--red-pen)" rotate={rotate} className="!font-mono">
            {d.y} · {d.m} · {d.day}
          </Stamp>
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="serif  text-lg sm:text-xl leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-muted mt-1 line-clamp-1">{post.summary}</p>
      </div>
    </div>
  );

  const cls = "block py-4 border-b border-dashed border-line last:border-0";

  return (
    <article className={cls}>
      <Link href={`/writing/${post.slug}`} className="block transition hover:opacity-70">
        {inner}
      </Link>
    </article>
  );
}
