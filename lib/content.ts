import fs from "node:fs";
import path from "node:path";
import { load as parseYaml } from "js-yaml";
import {
  fetchNotionWriting,
  fetchNotionWritingPreview,
  fetchNotionWork,
  fetchNotionBeliefs,
  fetchNotionSocial,
} from "./notion";

export interface WorkFull extends WorkMeta {
  content: string;
}

/**
 * 从 Markdown 内容中提取纯文本摘要
 */
function extractSummary(markdown: string, maxLength: number = 100): string {
  // 1. 去掉 HTML/JSX 标签（比如 <Bilibili>）
  let text = markdown.replace(/<[^>]+>/g, "");

  // 2. 去掉图片语法 ![]()
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, "");

  // 3. 去掉链接语法，只保留链接文字 [text](url) -> text
  text = text.replace(/\[([^\]]*)\]\([^)]+\)/g, "$1");

  // 4. 去掉 Markdown 格式字符（# * _ ~ ~）
  text = text.replace(/[#*_~`]/g, "");

  // 5. 去掉多余的空白字符
  text = text.replace(/\s+/g, " ").trim();

  // 6. 截取指定长度
  if (text.length > maxLength) {
    text = text.slice(0, maxLength) + "...";
  }

  return text;
}

export interface WorkMeta {
  slug: string;
  title: string;
  client?: string;
  role?: string;
  year?: string;
  summary: string;
  summaryIsGenerated?: boolean;
  cover?: string;
  coverType?: "image" | "video";
  coverFit?: "cover" | "contain";
  coverAspect?: string;
  tags?: string[];
  order?: number;
  draft?: boolean;
  externalLink?: string;
}

export interface WritingMeta {
  slug: string;
  title: string;
  date: string;
  summary: string;
  topic?: string;
  source?: string;
  sourceUrl?: string;
  draft?: boolean;
}

export interface WritingFull extends WritingMeta {
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content");
const REQUIRE_NOTION_CONTENT = process.env.REQUIRE_NOTION_CONTENT === "1";
const warnedFallbacks = new Set<string>();

type ParsedMdx = {
  slug: string;
  data: Record<string, unknown>;
  content: string;
};

function parseMdx(source: string) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) return { data: {}, content: source.trim() };

  const parsed = parseYaml(match[1]);
  const data = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
  return { data, content: source.slice(match[0].length).trim() };
}

function readLocalCollection(collection: "work" | "writing"): ParsedMdx[] {
  const directory = path.join(CONTENT_DIR, collection);
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .map((entry) => {
      const filePath = path.join(directory, entry.name);
      const parsed = parseMdx(fs.readFileSync(filePath, "utf8"));
      return {
        slug: entry.name.replace(/\.mdx$/i, ""),
        data: parsed.data,
        content: parsed.content,
      };
    });
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(asString).filter((item): item is string => Boolean(item));
  return values.length > 0 ? values : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function localWorkEntries(): WorkFull[] {
  return readLocalCollection("work").map(({ slug, data, content }) => ({
    slug,
    title: asString(data.title) || slug,
    client: asString(data.client),
    role: asString(data.role),
    year: asString(data.year),
    summary: asString(data.summary) || extractSummary(content),
    summaryIsGenerated: !asString(data.summary),
    cover: asString(data.cover),
    coverType: asString(data.coverType) as WorkFull["coverType"],
    coverFit: asString(data.coverFit) as WorkFull["coverFit"],
    coverAspect: asString(data.coverAspect),
    tags: asStringArray(data.tags),
    order: typeof data.order === "number" ? data.order : undefined,
    draft: asBoolean(data.draft),
    externalLink: asString(data.externalLink),
    content,
  }));
}

function localWritingEntries(): WritingFull[] {
  return readLocalCollection("writing").map(({ slug, data, content }) => ({
    slug,
    title: asString(data.title) || slug,
    date: asString(data.date) || "1970-01-01",
    summary: asString(data.summary) || extractSummary(content),
    topic: asString(data.topic),
    source: asString(data.source),
    sourceUrl: asString(data.sourceUrl),
    draft: asBoolean(data.draft),
    content,
  }));
}

let localWorkCache: WorkFull[] | undefined;
let localWritingCache: WritingFull[] | undefined;

function getLocalWorkEntries() {
  localWorkCache ??= localWorkEntries();
  return localWorkCache;
}

function getLocalWritingEntries() {
  localWritingCache ??= localWritingEntries();
  return localWritingCache;
}

function useLocalFallback(collection: "Work" | "Writing") {
  if (REQUIRE_NOTION_CONTENT) {
    throw new Error(
      `Required Notion ${collection} content is unavailable. Set valid Notion credentials or remove REQUIRE_NOTION_CONTENT=1 for local fallback.`
    );
  }

  if (!warnedFallbacks.has(collection)) {
    warnedFallbacks.add(collection);
    console.warn(`Notion ${collection} content unavailable. Using repository MDX fallback.`);
  }
}

function debugLog(...args: unknown[]) {
  if (process.env.DEBUG_NOTION === "1") {
    console.info(...args);
  }
}

const coverPathAliases: Record<string, string> = {
  "/wall/douyin-exam.png": "/work-covers/douyin-review.jpg",
  "/wall/douyin-review.png": "/work-covers/douyin-review.jpg",
  "/wall/douyin-reviewer-care.png": "/work-covers/douyin-reviewer-care.jpg",
  "/wall/feishu-network-security.png": "/work-covers/feishu-network-security.jpg",
  "/wall/feishu-open-platform.png": "/work-covers/feishu-open-platform.jpg",
  "/wall/feishu-security-overview.png": "/work-covers/feishu-security-overview.jpg",
  "/wall/feishu-security.png": "/work-covers/feishu-security.jpg",
  "/wall/stickers.png": "/wall/stickers.gif",
  "/wall/回见头图.JPG": "/work-covers/huijian.jpg",
};

function normalizeWorkCover<T extends WorkMeta>(work: T): T {
  if (!work.cover) return work;
  return {
    ...work,
    cover: coverPathAliases[work.cover] ?? work.cover,
  };
}

function assertUniqueSlugs(items: Array<{ slug: string; title: string }>, collectionName: "Work" | "Writing") {
  const seen = new Map<string, string>();

  for (const item of items) {
    const existing = seen.get(item.slug);
    if (existing) {
      throw new Error(
        `Duplicate ${collectionName} slug "${item.slug}" for "${existing}" and "${item.title}". Slugs must be unique because they are used as static route params.`
      );
    }
    seen.set(item.slug, item.title);
  }
}

export async function getAllWorkFull(): Promise<WorkFull[]> {
  debugLog("getAllWorkFull: Trying Notion...");
  const notionWorks = await fetchNotionWork();
  const works = notionWorks?.length ? (notionWorks as WorkFull[]) : getLocalWorkEntries();
  if (!notionWorks?.length) useLocalFallback("Work");
  assertUniqueSlugs(works, "Work");
  debugLog("getAllWorkFull: Using", notionWorks?.length ? "Notion" : "local", "data,", works.length, "works");
  return works
    .map(normalizeWorkCover)
    .filter((w: WorkFull) => !w.draft)
    .sort((a: WorkFull, b: WorkFull) => (a.order ?? 99) - (b.order ?? 99));
}

export async function getAllWork(): Promise<WorkMeta[]> {
  const notionWorks = await fetchNotionWork(false, false);
  const allWorks = (notionWorks?.length ? (notionWorks as WorkFull[]) : getLocalWorkEntries()).map(normalizeWorkCover);
  if (!notionWorks?.length) useLocalFallback("Work");
  assertUniqueSlugs(allWorks, "Work");
  return allWorks.filter((w) => !w.draft).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).map(w => ({
    slug: w.slug,
    title: w.title,
    client: w.client,
    role: w.role,
    year: w.year,
    summary: w.summary,
    summaryIsGenerated: w.summaryIsGenerated,
    cover: w.cover,
    coverType: w.coverType,
    coverFit: w.coverFit,
    coverAspect: w.coverAspect,
    tags: w.tags,
    order: w.order,
    draft: w.draft,
    externalLink: w.externalLink,
  }));
}

export async function getWork(slug: string) {
  const allWorks = await getAllWorkFull();
  const decodedSlug = safeDecodeURIComponent(slug);
  const work = allWorks.find(w => w.slug === slug || w.slug === decodedSlug);
  if (!work) return null;
  return { slug: work.slug, meta: work, content: work.content };
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function getAllWriting(): Promise<WritingMeta[]> {
  const notionWritings = await fetchNotionWritingPreview();
  const writings = notionWritings?.length ? (notionWritings as WritingFull[]) : getLocalWritingEntries();
  if (!notionWritings?.length) useLocalFallback("Writing");
  assertUniqueSlugs(writings, "Writing");
  return writings
    .filter((w) => !w.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getWriting(slug: string) {
  const allWritings = await getAllWritingFull();
  const writing = allWritings.find(w => w.slug === slug);
  if (!writing) return null;
  return { slug: writing.slug, meta: writing, content: writing.content };
}

export async function getAllWritingFull(): Promise<WritingFull[]> {
  debugLog("getAllWritingFull: Trying Notion...");
  const notionWritings = await fetchNotionWriting();
  const writings = notionWritings?.length ? (notionWritings as WritingFull[]) : getLocalWritingEntries();
  if (!notionWritings?.length) useLocalFallback("Writing");
  assertUniqueSlugs(writings, "Writing");
  debugLog("getAllWritingFull: Using", notionWritings?.length ? "Notion" : "local", "data,", writings.length, "posts");
  debugLog("getAllWritingFull: Posts:", writings.map((p: WritingFull) => ({ title: p.title, slug: p.slug })));
  return writings
    .filter((w) => !w.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export type Photo = {
  src: string;
  caption: string;
  href?: string;
  fit?: "cover" | "contain";
  imageScale?: number;
  rotate: number;
  leftPct: number;
  stringHeight: number;
  width: number;
  height: number;
  zIndex: number;
  hideOnMobile?: boolean;
};

const WALL_DIR = path.join(process.cwd(), "public", "wall");
const supportedWallAssetPattern = /\.(?:png|jpe?g|webp|gif|mp4|webm|mov)$/i;

const wallAssetMeta: Record<string, { caption: string; order: number }> = {
  "me-2025.mp4": { caption: "Me, 2025", order: 10 },
  "feishu_security.png": { caption: "飞书安全", order: 20 },
  "feishu_openplatform.png": { caption: "飞书开放平台", order: 30 },
  "beijiang.png": { caption: "北疆 Vlog", order: 40 },
  "stickers.gif": { caption: "表情包", order: 50 },
  "douyin-reviewer-care.png": { caption: "审核员关怀", order: 60 },
  "douyin-review.png": { caption: "抖音审核", order: 70 },
  "huijian.JPG": { caption: "回见", order: 80 },
};

const wallLayoutPresets: Array<Omit<Photo, "src" | "caption" | "href" | "fit" | "imageScale" | "hideOnMobile">> = [
  { rotate: -1.5, leftPct: 9, stringHeight: 32, width: 180, height: 285, zIndex: 5 },
  { rotate: 2.2, leftPct: 21, stringHeight: 70, width: 205, height: 168, zIndex: 2 },
  { rotate: -1.4, leftPct: 33, stringHeight: 48, width: 210, height: 170, zIndex: 4 },
  { rotate: 1.1, leftPct: 45, stringHeight: 82, width: 190, height: 150, zIndex: 1 },
  { rotate: -0.8, leftPct: 56, stringHeight: 48, width: 200, height: 200, zIndex: 7 },
  { rotate: 2.6, leftPct: 68, stringHeight: 92, width: 220, height: 168, zIndex: 3 },
  { rotate: -2.0, leftPct: 80, stringHeight: 60, width: 210, height: 164, zIndex: 6 },
  { rotate: 1.2, leftPct: 91, stringHeight: 76, width: 190, height: 250, zIndex: 4 },
];

function getWallFiles() {
  if (!fs.existsSync(WALL_DIR)) return [];
  return fs
    .readdirSync(WALL_DIR)
    .filter((file) => supportedWallAssetPattern.test(file))
    .sort((a, b) => {
      const orderA = wallAssetMeta[a]?.order ?? 999;
      const orderB = wallAssetMeta[b]?.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b, "en");
    });
}

function fallbackWallCaption(file: string) {
  return file
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toWallPhoto(file: string, index: number, total: number): Photo {
  const preset = wallLayoutPresets[index % wallLayoutPresets.length];
  const leftPct =
    total <= wallLayoutPresets.length
      ? preset.leftPct
      : Math.round((8 + (84 * index) / Math.max(1, total - 1)) * 10) / 10;
  return {
    ...preset,
    leftPct,
    src: `/wall/${file}`,
    caption: wallAssetMeta[file]?.caption ?? fallbackWallCaption(file),
    fit: "contain",
  };
}

const localPhotos = getWallFiles().map((file, index, files) =>
  toWallPhoto(file, index, files.length)
);

export async function getAllPhotos(): Promise<Photo[]> {
  return localPhotos;
}

export type Belief = {
  n: string;
  lead: string;
  tail: string;
};

const localBeliefs: Belief[] = [
  { n: "01", lead: "崇尚 极简主义 的设计风格。", tail: "少即是多，不是炫技口号——是审视每个元素的去留。" },
  { n: "02", lead: "追求更高的 产品易用性。", tail: "好设计最终是看不见的——用户顺畅完成事，才是判准。" },
  { n: "03", lead: "微交互数 × 产品体验，成正比。", tail: "在满足任务的可用性之外，那些细小的反馈和动效，是体验差距的真正所在。" },
  { n: "04", lead: "顺水推舟，不与之争。", tail: "设计师推进体验优化要依赖产品和研发——顺应阶段，比硬碰硬有效得多。" },
];

export async function getAllBeliefs(): Promise<Belief[]> {
  debugLog("getAllBeliefs: Trying Notion...");
  const notionBeliefs = await fetchNotionBeliefs();
  if (notionBeliefs && notionBeliefs.length > 0) {
    debugLog("getAllBeliefs: Using Notion data,", notionBeliefs.length, "beliefs");
    return notionBeliefs;
  }
  debugLog("getAllBeliefs: Falling back to local");
  return localBeliefs;
}

export type SocialPost = {
  src: string;
  href: string;
  postTitle: string;
  body: string;
  aspectRatio: string;
};

const localSocial: SocialPost[] = [
  {
    src: "/xhs-xinjiang.mp4",
    href: "https://www.xiaohongshu.com/explore/6a0091b30000000036033144",
    postTitle: "五一逃去北疆，找回了自由的我",
    body: "五一我用相机记录自己从赛里木湖到那拉提的所见所想。",
    aspectRatio: "16 / 9",
  },
  {
    src: "/xhs-hangzhou.mp4",
    href: "https://www.xiaohongshu.com/discovery/item/68e3f714000000000300c431",
    postTitle: "你还在公式化旅游？听听我的故事 — 杭州街溜子",
    body: "厌倦打卡式旅游？这次我没有清单、没有路线，只是在杭州的街巷里漫无目的地溜达。",
    aspectRatio: "16 / 9",
  },
];

export async function getAllSocial(): Promise<SocialPost[]> {
  debugLog("getAllSocial: Trying Notion...");
  const notionSocial = await fetchNotionSocial();
  if (notionSocial && notionSocial.length > 0) {
    debugLog("getAllSocial: Using Notion data,", notionSocial.length, "posts");
    return notionSocial;
  }
  debugLog("getAllSocial: Falling back to local");
  return localSocial;
}
