import { getAllWork } from "@/lib/content";
import WorkCard from "@/components/WorkCard";

export const metadata = { title: "Work" };

export default async function WorkIndex() {
  const works = await getAllWork();

  return (
    <div className="notebook-shell pb-24">
      <header className="grid gap-10 pt-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:items-start lg:gap-20">
        <h1
          className="max-w-2xl font-semibold leading-[1.05] tracking-normal text-foreground"
          style={{
            fontFamily: 'Helvetica, "Courier New", Courier, monospace',
            fontSize: "clamp(3rem, 6vw, 5.2rem)",
          }}
        >
          作品
        </h1>
        <p className="max-w-2xl text-xl leading-relaxed text-muted sm:text-2xl">
          这些项目横跨 B 端平台、审核工具、独立产品和内容实验。每个作品都尽量保留问题背景、关键判断和最后落到界面里的取舍。
        </p>
      </header>

      <section className="mt-20">
        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {works.map((w, i) => (
            <WorkCard key={w.slug} work={w} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
