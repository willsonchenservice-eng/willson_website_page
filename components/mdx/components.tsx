import Bilibili from "@/components/mdx/Bilibili";
import AutoLink from "@/components/mdx/AutoLink";
import { CodeBlock, InlineCode } from "@/components/mdx/CodeBlock";

export const mdxComponents = {
  Bilibili,
  a: AutoLink,
  pre: CodeBlock,
  code: InlineCode,
};
