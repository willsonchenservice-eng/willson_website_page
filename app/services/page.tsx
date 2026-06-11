import ContactBlock from "@/components/ContactBlock";
import Chapter from "@/components/notebook/Chapter";
import Stamp from "@/components/notebook/Stamp";
import Doodle from "@/components/notebook/Doodle";

export const metadata = { title: "Services" };

const service = {
  title: "作品集咨询",
  tagline:
    "适合在准备跳槽、转岗、正在求职的同学。一对一辅导，帮你把作品集从「自我陈述」优化成「招聘方能读懂的故事」。一起做一次深度复盘：哪些项目值得写、怎么写、视觉怎么改等",
  duration: "60 分钟",
  deliver: [
    "一份逐项批注的 PDF",
    "一次 60 分钟视频沟通",
    "后续一周内邮件追问",
  ],
};

const flow = [
  "加微信或邮件，告诉我你的诉求、当前阶段、希望的时间。",
  "我评估能不能帮上，给你报价和排期。不合适会直接说。",
  "确认后预付 50%，约定时间。结束后交付材料、结清尾款。",
];

export default function Services() {
  return (
    <div className="notebook-shell py-10 sm:py-14">
      <Chapter
        title={<>作品集咨询或项目合作</>}
        titleFontFamily='Helvetica, "Courier New", Courier, monospace'
        arrow={false}
        meta={<span>面向在校学生、职场跳槽等场景进行作品集咨询</span>}
      />

      <section className="mt-[100px] mb-12">
        <div
          className="relative border border-line bg-background/35 shadow-[0_18px_36px_-24px_rgba(0,0,0,0.18)]"
          style={{ padding: "2.25rem 2rem" }}
        >
          <div className="mb-3 flex flex-wrap items-baseline justify-end gap-4">
            <div className="flex items-center gap-2">
              <Stamp size="sm" color="var(--foreground)" rotate={-3}>
                {service.duration}
              </Stamp>
              <Stamp size="sm" color="var(--red-pen)" rotate={2}>
                价格私聊
              </Stamp>
            </div>
          </div>

          <h2
            className="mb-4 leading-tight"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              letterSpacing: "-0.01em",
            }}
          >
            {service.title}
          </h2>

          <p className="mb-8 w-full text-xl leading-relaxed text-muted">
            {service.tagline}
          </p>

          <div className="mb-6 pt-2">
            <div className="mb-3 text-xl leading-relaxed text-muted">
              你会拿到
            </div>
            <ul className="space-y-2">
              {service.deliver.map((d, i) => (
                <li key={d} className="flex items-start gap-3 text-base">
                  <Stamp
                    size="xs"
                    color="var(--red-pen)"
                    rotate={i % 2 === 0 ? -4 : 3}
                    className="mt-0.5 shrink-0"
                  >
                    ✓
                  </Stamp>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-muted">
                Signed by
              </div>
              <div
                className="inline-block leading-none"
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "2.5rem",
                  color: "var(--foreground)",
                  transform: "rotate(-2deg)",
                  letterSpacing: "-0.01em",
                }}
              >
                Willson Chen
                <span style={{ color: "var(--red-pen)" }}>.</span>
              </div>
            </div>
            <Doodle
              kind="asterisk"
              size={40}
              color="var(--red-pen)"
              strokeWidth={1.4}
              className="opacity-80"
            />
          </div>
        </div>
      </section>

      <section className="mt-[100px] mb-10">
        <div className="mb-7">
          <h2
            className="leading-none"
            style={{
              fontFamily: 'Helvetica, "Courier New", Courier, monospace',
              fontSize: "clamp(2.3rem, 5vw, 4rem)",
            }}
          >
            你可以这样
          </h2>
        </div>

        <ol className="space-y-4">
          {flow.map((step, i) => (
            <li key={i} className="flex items-baseline gap-5">
              <div
                className="shrink-0 leading-none"
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "3rem",
                  color: "var(--red-pen)",
                  transform: `rotate(${i % 2 === 0 ? -4 : 3}deg)`,
                  width: "3rem",
                }}
              >
                {i + 1}.
              </div>
              <p className="text-lg leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <ContactBlock />
    </div>
  );
}
