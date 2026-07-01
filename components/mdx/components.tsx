import Bilibili from "@/components/mdx/Bilibili";
import AutoLink from "@/components/mdx/AutoLink";
import { CodeBlock, InlineCode } from "@/components/mdx/CodeBlock";
import MdxImage from "@/components/mdx/MdxImage";

export const mdxComponents = {
  Bilibili,
  a: AutoLink,
  img: MdxImage,
  pre: CodeBlock,
  code: InlineCode,
};
