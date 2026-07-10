import Link from "next/link";

export default async function AutoLink(props: any) {
  const href = typeof props.href === "string" ? props.href.trim() : "";
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const isSafeExternal = /^(https?:\/\/|mailto:)/i.test(href);

  if (isInternal) {
    return <Link href={href} {...props} />;
  }

  if (isSafeExternal) {
    return <a target="_blank" rel="noopener noreferrer" href={href} {...props} />;
  }

  return <span>{props.children}</span>;
}
