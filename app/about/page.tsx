import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site";

export const metadata = {
  title: "About",
};

export default function About() {
  return (
    <div className="notebook-shell py-10 sm:py-14">
      <section className="grid gap-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-end md:gap-20">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">About</p>
          <h1
            className="mt-5 text-[3.25rem] font-semibold leading-none tracking-normal text-foreground sm:text-7xl"
            style={{ fontFamily: 'Helvetica, "Courier New", Courier, monospace' }}
          >
            关于我
          </h1>
        </div>
        <p className="max-w-2xl text-xl leading-relaxed text-muted sm:text-2xl">
          {site.tagline}
        </p>
      </section>

      <section className="mt-24 grid gap-8 border-t border-line pt-8 sm:mt-32 sm:grid-cols-2 sm:gap-12">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">现在在做什么</p>
          <p className="mt-5 text-lg leading-relaxed text-foreground">{site.intro}</p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">联系我</p>
          <div className="mt-5 flex flex-col items-start gap-3 text-lg">
            <a className="inline-flex items-center gap-2 hover:underline" href={`mailto:${site.email}`}>
              {site.email}
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
            <span>{site.wechatId}</span>
            <Link className="inline-flex items-center gap-2 hover:underline" href="/services">
              查看合作方式
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
