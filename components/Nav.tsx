import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";

const links = [
  { href: "/work", label: "作品" },
  { href: "/writing", label: "Blog" },
  { href: "/about", label: "关于" },
  { href: "/services", label: "服务" },
];

export default function Nav() {
  return (
    <header className="w-full">
      <div className="notebook-shell pt-8 pb-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="hover:opacity-70 transition inline-flex items-center leading-none"
          aria-label={`${site.name} — Home`}
        >
          {/* Signature logo remains wide for the header; the square browser tab icon is generated separately. */}
          <Image
            src="/brand/willson-chen-logo.png"
            alt={site.name}
            width={322}
            height={86}
            priority
            className="h-[34px] w-auto sm:h-[42px]"
          />
        </Link>
        <nav className="flex items-baseline gap-5 sm:gap-7 text-sm text-muted">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-foreground transition"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
