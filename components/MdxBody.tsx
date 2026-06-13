import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/components";

export default function MdxBody({
  source,
  className = "prose-mdx",
}: {
  source: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <MDXRemote source={source} components={mdxComponents} />
    </div>
  );
}
