import { Client, LogLevel } from "@notionhq/client";
import fs from "fs";
import path from "path";
import https from "https";

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

const NOTION_TIMEOUT_MS = envNumber("NOTION_TIMEOUT_MS", 10000);
const NOTION_MAX_RETRIES = envNumber("NOTION_MAX_RETRIES", 1);
const NOTION_IMAGE_DOWNLOAD_TIMEOUT_MS = envNumber("NOTION_IMAGE_DOWNLOAD_TIMEOUT_MS", 15000);

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  logLevel: LogLevel.ERROR,
  timeoutMs: NOTION_TIMEOUT_MS,
  retry: NOTION_MAX_RETRIES === 0 ? false : { maxRetries: NOTION_MAX_RETRIES },
});

function debugLog(...args: unknown[]) {
  if (process.env.DEBUG_NOTION === "1") {
    console.info(...args);
  }
}

const CACHE_VERSION = "markdown-strong-work-cover-2026-06-13";

// 内存缓存，避免重复请求 Notion
// 用 globalThis 避免热更新时缓存丢失
const getCache = () => {
  if (!(globalThis as any).__notionCache || (globalThis as any).__notionCache.version !== CACHE_VERSION) {
    (globalThis as any).__notionCache = {
      version: CACHE_VERSION,
      writings: null,
      writingPreviews: null,
      works: null,
      workPreviews: null,
      photos: null,
      beliefs: null,
      social: null,
      dataSources: {},
      time: 0
    };
  }
  return (globalThis as any).__notionCache;
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟;

function formatNotionError(error: unknown) {
  if (error && typeof error === "object") {
    const err = error as { code?: string; message?: string };
    const code = err.code ? `${err.code}: ` : "";
    return `${code}${err.message || "Unknown Notion error"}`;
  }
  return String(error);
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

const workSlugByTitle: Record<string, string> = {
  "飞书安全": "feishu-security",
  "飞书开放平台": "feishu-open-platform",
  "飞书内网识别": "feishu-network-security",
  "飞书内网识别服务": "feishu-network-security",
  "飞书安全措施完成度": "feishu-security-overview",
  "字节审核员培训系统": "douyin-exam",
  "抖音审核员考试 · 分析报告": "douyin-exam",
  "字节审核员关怀专项": "douyin-reviewer-care",
  "抖音审核员关怀文案": "douyin-reviewer-care",
  "字节审核平台": "douyin-review",
  "抖音审核平台": "douyin-review",
  "回见": "huijian-app",
  "微信表情包合集": "stickers",
};

const workCoverFallbackBySlug: Record<string, string> = {
  "douyin-exam": "/work-covers/douyin-review.jpg",
  "douyin-review": "/work-covers/douyin-review.jpg",
  "douyin-reviewer-care": "/work-covers/douyin-reviewer-care.jpg",
  "feishu-network-security": "/work-covers/feishu-network-security.jpg",
  "feishu-open-platform": "/work-covers/feishu-open-platform.jpg",
  "feishu-security-overview": "/work-covers/feishu-security-overview.jpg",
  "feishu-security": "/work-covers/feishu-security.jpg",
  "huijian-app": "/work-covers/huijian.jpg",
  stickers: "/wall/stickers.gif",
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9一-龥-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function workSlugFromTitle(title: string, fallbackId: string) {
  return workSlugByTitle[title] || slugPart(title) || slugPart(fallbackId);
}

function resolveWorkSlug(title: string, slugFromProp: string | undefined, fallbackId: string) {
  const mappedSlug = workSlugByTitle[title];
  if (mappedSlug) return mappedSlug;
  return slugFromProp ? normalizeSlug(slugFromProp) : workSlugFromTitle(title, fallbackId);
}

function ensureUniqueWorkSlugs<T extends { slug: string; title: string }>(works: T[]) {
  const seen = new Map<string, number>();
  return works.map((work) => {
    const count = seen.get(work.slug) ?? 0;
    seen.set(work.slug, count + 1);
    if (count === 0) return work;

    const suffix = slugPart(work.title) || String(count + 1);
    return {
      ...work,
      slug: `${work.slug}-${suffix}`,
    };
  });
}

function extensionFromFilename(filename?: string) {
  const ext = filename?.match(/\.([a-z0-9]{2,5})(?:$|\?)/i)?.[1];
  if (!ext) return "png";
  return normalizeImageExtension(ext);
}

function normalizeImageExtension(ext: string) {
  const normalized = ext.toLowerCase();
  if (normalized === "jpeg") return "jpg";
  return normalized;
}

function extensionFromImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    const wxFormat = parsed.searchParams.get("wx_fmt") || parsed.searchParams.get("tp");
    if (wxFormat) return normalizeImageExtension(wxFormat.replace(/^image\//, ""));
    return extensionFromFilename(parsed.pathname);
  } catch {
    return "png";
  }
}

function stableHash(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function legacyNotionFileCacheId(pageId: string, index: number, filename?: string) {
  const base = filename?.replace(/\.[a-z0-9]{2,5}$/i, "") || `img-${index}`;
  return `${slugPart(pageId)}-${index}-${slugPart(base) || "file"}`;
}

function notionFileCacheId(pageId: string, index: number, filename?: string, sourceUrl?: string) {
  const base = filename?.replace(/\.[a-z0-9]{2,5}$/i, "") || `img-${index}`;
  const sourcePath = sourceUrl ? new URL(sourceUrl).pathname : "";
  const sourcePart = sourcePath ? `-${stableHash(sourcePath)}` : "";
  return `${slugPart(pageId)}-${index}${sourcePart}-${slugPart(base) || "file"}`;
}

type ResolvedDataSource = {
  id: string;
  properties: Record<string, any>;
};

function findSchemaPropertyName(properties: Record<string, any>, names: string[]) {
  for (const name of names) {
    if (properties[name]) return name;
  }
  return undefined;
}

const workOrderPropertyNames = [
  "Order",
  "order",
  "排序",
  "排序值",
  "作品排序",
  "作品顺序",
  "顺序",
  "序号",
  "排名",
  "Rank",
  "Number",
  "number",
  "数字",
  "数字列",
  "Sort",
  "Index",
  "Priority",
  "优先级",
];

function buildStatusFilter(properties: Record<string, any>) {
  const property = findSchemaPropertyName(properties, ["Status", "status", "状态"]);
  if (!property) return undefined;

  const type = properties[property]?.type;
  if (type === "status") {
    return { property, status: { equals: "完成" } };
  }
  if (type === "select") {
    return { property, select: { equals: "完成" } };
  }
  return undefined;
}

function buildOrderSort(properties: Record<string, any>) {
  const property = findSchemaPropertyName(properties, workOrderPropertyNames);
  if (!property) return undefined;

  return [{ property, direction: "ascending" as const }];
}

function buildDateSort(properties: Record<string, any>) {
  const property = findSchemaPropertyName(properties, ["date", "Date", "日期"]);
  if (!property) return undefined;

  return [{ property, direction: "descending" as const }];
}

async function resolveDataSource(id: string, force: boolean = false): Promise<ResolvedDataSource> {
  const cache = getCache();
  if (!force && cache.dataSources?.[id]) {
    return cache.dataSources[id];
  }

  try {
    const database = await notion.databases.retrieve({ database_id: id });
    const dataSourceId = (database as any).data_sources?.[0]?.id;
    if (dataSourceId) {
      const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
      const resolved = {
        id: dataSourceId,
        properties: "properties" in dataSource ? dataSource.properties : {},
      };
      cache.dataSources[id] = resolved;
      return resolved;
    }
  } catch {}

  const dataSource = await notion.dataSources.retrieve({ data_source_id: id });
  const resolved = {
    id,
    properties: "properties" in dataSource ? dataSource.properties : {},
  };
  cache.dataSources[id] = resolved;
  return resolved;
}

// 确保图片目录存在
function ensureImagesDir() {
  const imagesDir = path.join(process.cwd(), "public", "notion-images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  return imagesDir;
}

// 下载图片到本地
async function downloadImage(
  url: string,
  fileId: string,
  force: boolean = false,
  filenameHint?: string,
  fallbackFileId?: string,
  headers?: Record<string, string>
): Promise<string> {
  const imagesDir = ensureImagesDir();

  // 检查是否已经有这个 fileId 的图片（不关心后缀）
  const existingFiles = fs.readdirSync(imagesDir);
  const existingFile = existingFiles.find(f => f.startsWith(fileId));
  const fallbackFile = fallbackFileId
    ? existingFiles.find(f => f.startsWith(fallbackFileId))
    : undefined;
  if (existingFile && !force) {
    debugLog(`Using cached image: ${existingFile} for fileId: ${fileId}`);
    return `/notion-images/${existingFile}`;
  }

  // 如果强制刷新，删除旧文件
  if (existingFile && force) {
    debugLog(`Deleting old image: ${existingFile}`);
    fs.unlinkSync(path.join(imagesDir, existingFile));
  }

  const filename = `${fileId}.${extensionFromFilename(filenameHint)}`;
  const localPath = path.join(imagesDir, filename);

  debugLog(`Downloading image: ${filename} from ${url.substring(0, 80)}...`);

  return new Promise((resolve, reject) => {
    let settled = false;
    const resolveOnce = (value: string) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const rejectOrFallback = (err: Error) => {
      if (settled) return;
      if (fallbackFile) {
        debugLog(`Using fallback cached image: ${fallbackFile} for fileId: ${fileId}`);
        settled = true;
        resolve(`/notion-images/${fallbackFile}`);
        return;
      }
      settled = true;
      reject(err);
    };

    const request = https.get(url, { headers }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        rejectOrFallback(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(localPath);
      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        debugLog(`Downloaded: ${filename}`);
        resolveOnce(`/notion-images/${filename}`);
      });

      fileStream.on("error", (err) => {
        fs.unlink(localPath, () => {}); // 删除可能的不完整文件
        rejectOrFallback(err);
      });
    });

    request.setTimeout(NOTION_IMAGE_DOWNLOAD_TIMEOUT_MS, () => {
      request.destroy(new Error(`Image download timed out after ${NOTION_IMAGE_DOWNLOAD_TIMEOUT_MS}ms`));
    });

    request.on("error", (err) => {
      fs.unlink(localPath, () => {});
      rejectOrFallback(err);
    });
  });
}

/**
 * 处理 Notion 图片：下载到本地并替换链接
 */
async function processNotionImages(markdown: string, force: boolean = false): Promise<string> {
  // 匹配 ![]() 格式的图片
  const imgRegex = /!\[([^\]]*)\]\(([^\)]+)\)/g;
  let match;
  let index = 0;
  const replacements: Array<{ original: string; localUrl: string }> = [];

  while ((match = imgRegex.exec(markdown)) !== null) {
    const original = match[0];
    const url = match[2];

    const isNotionAsset = url.includes("prod-files-secure.s3.us-west-2.amazonaws.com");
    const isWechatAsset = isWechatImageUrl(url);

    if (isNotionAsset || isWechatAsset) {
      try {
        const filename = imageFilenameFromUrl(url, index);
        const localUrl = await downloadImage(
          url,
          notionFileCacheId(`markdown-${index}`, index, filename, url),
          force,
          filename,
          legacyNotionFileCacheId(`markdown-${index}`, index, filename),
          isWechatAsset ? wechatImageHeaders() : undefined
        );
        replacements.push({ original, localUrl });
        index += 1;
      } catch (e) {
        console.warn("Failed to process image:", e);
      }
    }
  }

  // 替换链接
  let result = markdown;
  for (const { original, localUrl } of replacements) {
    const altMatch = original.match(/!\[([^\]]*)\]/);
    const alt = altMatch ? altMatch[1] : "";
    result = result.replace(original, `![${alt}](${localUrl})`);
  }

  return result;
}

function isWechatImageUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return /(^|\.)mmbiz\.qpic\.cn$/i.test(hostname) || /(^|\.)qpic\.cn$/i.test(hostname);
  } catch {
    return false;
  }
}

function imageFilenameFromUrl(url: string, index: number) {
  try {
    const parsed = new URL(url);
    const pathFilename = decodeURIComponent(parsed.pathname.split("/").pop() || "");
    const hasExtension = /\.[a-z0-9]{2,5}$/i.test(pathFilename);
    if (pathFilename && hasExtension) return pathFilename;
    return `img-${index}.${extensionFromImageUrl(url)}`;
  } catch {
    return `img-${index}.png`;
  }
}

function wechatImageHeaders() {
  return {
    referer: "https://mp.weixin.qq.com/",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  };
}

/**
 * 从 Markdown 内容中提取纯文本摘要
 */
function extractSummary(markdown: string, maxLength: number = 100): string {
  // 1. 去掉 HTML/JSX 标签（比如 <Bilibili>）
  let text = markdown.replace(/<[^>]+>/g, "");

  // 2. 去掉图片语法 ![]()
  text = text.replace(/!\[[^\]]*]\([^)]+\)/g, "");

  // 3. 去掉链接语法，只保留链接文字 [text](url) -> text
  text = text.replace(/\[([^\]]*)]\([^)]+\)/g, "$1");

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

/**
 * 把 Markdown 中的 B 站链接转换成 <Bilibili> 组件
 */
function convertBilibiliLinks(markdown: string): string {
  // 匹配 [text](url) 格式的 B 站链接
  return markdown.replace(
    /\[([^\]]*)]\((https?:\/\/[^\)]*bilibili\.[^\)]+|https?:\/\/[^\)]*b23\.tv[^\)]*)\)/g,
    (match, text, url) => {
      try {
        const u = new URL(url);
        let bvid = "";

        // 处理 b23.tv 短链接 (这里只能做简单处理，因为不做实际网络请求)
        if (u.hostname.includes("b23.tv")) {
          // 暂时保持原样，因为需要重定向解析
          return match;
        }

        // 处理普通视频链接: /video/BVxxxxx
        const matchBV = u.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
        if (matchBV) {
          bvid = matchBV[1];
          return `\n\n<Bilibili bvid="${bvid}" />\n\n`;
        }

        // 处理 Cheese (课程) 链接: /cheese/play/epxxxxx
        const matchEp = u.pathname.match(/\/cheese\/play\/(ep[0-9]+)/);
        if (matchEp) {
          // 对于 ep 链接，我们也用 bvid 参数传递，然后在组件里处理
          bvid = matchEp[1];
          return `\n\n<Bilibili bvid="${bvid}" />\n\n`;
        }
      } catch (e) {
        // 无效 URL，保持原样
      }

      return match;
    }
  );
}

function normalizeWorkMarkdown(markdown: string) {
  return markdown
    .replace(/<br>/g, "<br/>")
    .replace(/<hr>/g, "<hr/>")
    .replace(/<img([^>]*)>/g, "<img$1/>")
    .replace(/^##\s+(.{42,})$/gm, "$1");
}

function normalizeBasicMarkdown(markdown: string) {
  return markdown
    .replace(/<br>/g, "<br/>")
    .replace(/<hr>/g, "<hr/>")
    .replace(/<img([^>]*)>/g, "<img$1/>")
    .replace(/\\\*\\\*/g, "**")
    .replace(/\*\*\s*\*\*/g, "")
    .replace(/\*\*([^*\n]*?\S)\s+\*\*(?=\S)/g, "**$1** ")
    .replace(/\*\*([^*\n]*?\S)\s+\*\*/g, "**$1**");
}

export async function fetchNotionWritingPreview(force: boolean = false) {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId || !process.env.NOTION_API_KEY) {
    console.warn("Missing Notion environment variables. Falling back to local MDX.");
    return null;
  }

  const now = Date.now();
  const cache = getCache();
  if (!force && cache.writingPreviews && (now - cache.time < CACHE_DURATION)) {
    return cache.writingPreviews;
  }

  try {
    const dataSource = await resolveDataSource(databaseId, force);
    const filter = buildStatusFilter(dataSource.properties);
    const sorts = buildDateSort(dataSource.properties);
    const response = await notion.dataSources.query({
      data_source_id: dataSource.id,
      ...(filter ? { filter } : {}),
      ...(sorts ? { sorts } : {}),
    });

    const writings = response.results
      .filter((item): item is { id: string; properties: Record<string, any>; object: "page" } =>
        item.object === "page"
      )
      .map((page) => {
        const props = page.properties;
        const titleProp = getProp(props, ["名称", "Name", "Title"]);
        const slugProp = getProp(props, ["Slug"]);
        const dateProp = getProp(props, ["date", "Date", "日期"]);
        const topicProp = getProp(props, ["Topic", "话题"]);
        const summaryProp = getProp(props, ["Summary", "摘要"]);

        const title = titleProp?.title?.[0]?.plain_text || "Untitled";
        let slug = slugProp?.rich_text?.[0]?.plain_text || page.id;
        slug = slug.replace(/\s+/g, "-").replace(/[^\w一-龥-]/g, "");

        return {
          slug,
          title,
          date: dateProp?.date?.start || new Date().toISOString(),
          summary: summaryProp?.rich_text?.[0]?.plain_text || "",
          topic: topicProp?.multi_select?.[0]?.name,
          source: undefined,
          sourceUrl: undefined,
        };
      });

    cache.writingPreviews = writings;
    cache.time = now;
    return writings;
  } catch (error) {
    console.warn(`Notion writing preview unavailable. Falling back to local MDX. ${formatNotionError(error)}`);
    return null;
  }
}

export async function fetchNotionWriting(force: boolean = false) {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId || !process.env.NOTION_API_KEY) {
    console.warn("Missing Notion environment variables. Falling back to local MDX.");
    return null;
  }

  const now = Date.now();
  const cache = getCache();
  if (!force && cache.writings && (now - cache.time < CACHE_DURATION)) {
    return cache.writings;
  }

  debugLog("Notion: Fetching from database...");

  try {
    const dataSource = await resolveDataSource(databaseId, force);
    const filter = buildStatusFilter(dataSource.properties);
    const sorts = buildDateSort(dataSource.properties);
    const response = await notion.dataSources.query({
      data_source_id: dataSource.id,
      ...(filter ? { filter } : {}),
      ...(sorts ? { sorts } : {}),
    });

    const writings = await Promise.all(
      response.results
        .filter((item): item is { id: string; properties: Record<string, any>; object: "page" } =>
          item.object === "page"
        )
        .map(async (page) => {
          const props = page.properties;

          const titleProp = getProp(props, ["名称", "Name", "Title"]);
          const slugProp = getProp(props, ["Slug"]);
          const dateProp = getProp(props, ["date", "Date", "日期"]);
          const topicProp = getProp(props, ["Topic", "话题"]);
          const summaryProp = getProp(props, ["Summary", "摘要"]);
          const contentProp = getProp(props, ["Content", "内容", "正文", "Body", "超长字段"]);

          const title = titleProp?.title?.[0]?.plain_text || "Untitled";
          let slug = slugProp?.rich_text?.[0]?.plain_text || page.id;
          slug = slug.replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '');
          const date = dateProp?.date?.start || new Date().toISOString();

          let topic: string | undefined;
          if (topicProp?.multi_select?.[0]) topic = topicProp.multi_select[0].name;

          const mdResponse = await notion.pages.retrieveMarkdown({ page_id: page.id });
          let content = propPlainText(contentProp) || mdResponse.markdown || "";
          content = normalizeBasicMarkdown(content);
          content = await processNotionImages(content, force);
          content = convertBilibiliLinks(content);

          const summaryFromProp = summaryProp?.rich_text?.[0]?.plain_text;
          const summary = summaryFromProp || extractSummary(content);

          return {
            slug,
            title,
            date,
            summary,
            topic,
            source: undefined,
            sourceUrl: undefined,
            content,
          };
        })
    );

    cache.writings = writings;
    cache.time = now;

    return writings;
  } catch (error) {
    console.warn(`Notion writing unavailable. Falling back to local MDX. ${formatNotionError(error)}`);
    return null;
  }
}

function getProp(props: Record<string, any>, names: string[]) {
  for (const name of names) {
    if (props[name]) return props[name];
  }
  return undefined;
}

function propPlainText(prop: any): string | undefined {
  if (!prop) return undefined;
  if (prop.type === "rich_text") return prop.rich_text?.map((item: any) => item.plain_text || "").join("");
  if (prop.type === "title") return prop.title?.map((item: any) => item.plain_text || "").join("");
  if (prop.type === "select") return prop.select?.name;
  if (prop.type === "status") return prop.status?.name;
  if (prop.type === "number") return String(prop.number);
  if (prop.rich_text) return prop.rich_text?.map((item: any) => item.plain_text || "").join("");
  if (prop.title) return prop.title?.map((item: any) => item.plain_text || "").join("");
  if (prop.select) return prop.select?.name;
  if (prop.status) return prop.status?.name;
  if (typeof prop.number === "number") return String(prop.number);
  return undefined;
}

function propUrl(prop: any): string | undefined {
  if (!prop) return undefined;
  if (prop.type === "url") return normalizeUrlValue(prop.url);
  if (prop.url) return normalizeUrlValue(prop.url);
  const text = propPlainText(prop)?.trim();
  return normalizeUrlValue(text);
}

function normalizeUrlValue(value?: string): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  return /^(https?:\/\/|\/)/i.test(url) ? url : undefined;
}

function propNumber(prop: any): number | undefined {
  if (!prop) return undefined;
  if (typeof prop.number === "number") return prop.number;
  const text = propPlainText(prop);
  if (!text) return undefined;
  const value = Number(text.trim());
  return Number.isFinite(value) ? value : undefined;
}

function mediaTypeFromSource(source?: string): "image" | "video" {
  if (!source) return "image";
  const path = source.split("?")[0]?.toLowerCase() || "";
  if (/\.(mp4|webm|mov|m4v|ogg|ogv)$/.test(path)) return "video";
  return "image";
}

function mediaTypeFromNotionFile(file: any): "image" | "video" {
  const name = file?.name;
  const url = notionAssetUrl(file);
  return mediaTypeFromSource(name || url);
}

function notionAssetUrl(file: any): string | undefined {
  if (!file) return undefined;
  if (file.type === "file" && file.file?.url) return file.file.url;
  if (file.type === "external" && file.external?.url) return file.external.url;
  return undefined;
}

async function resolveNotionAssetUrl(
  file: any,
  pageId: string,
  index: number,
  force: boolean
): Promise<string | undefined> {
  if (!file) return undefined;
  if (file.type === "external" && file.external?.url) return file.external.url;
  if (file.type !== "file" || !file.file?.url) return undefined;

  try {
    return await downloadImage(
      file.file.url,
      notionFileCacheId(pageId, index, file.name, file.file.url),
      force,
      file.name,
      legacyNotionFileCacheId(pageId, index, file.name)
    );
  } catch {
    return file.file.url;
  }
}

export async function fetchNotionBeliefs(force: boolean = false) {
  const databaseId = process.env.NOTION_BELIEFS_DATABASE_ID;
  if (!databaseId || !process.env.NOTION_API_KEY) {
    console.warn("Missing Notion Beliefs database env vars. Falling back to local.");
    return null;
  }

  const now = Date.now();
  const cache = getCache();
  if (!force && cache.beliefs && (now - cache.time < CACHE_DURATION)) {
    return cache.beliefs;
  }

  debugLog("Notion: Fetching beliefs from database...");

  try {
    const response = await notion.dataSources.query({
      data_source_id: databaseId,
      filter: {
        property: "Status",
        status: {
          equals: "完成",
        },
      },
      sorts: [
        {
          property: "Order",
          direction: "ascending",
        },
      ],
    });

    const beliefs = response.results
      .filter((item): item is { id: string; properties: Record<string, any>; object: "page" } =>
        item.object === "page"
      )
      .map((page, index) => {
        const props = page.properties;

        const titleProp = getProp(props, ["名称", "Name", "Title", "Lead", "标题"]);
        const tailProp = getProp(props, ["Tail", "Description", "描述"]);
        const orderProp = getProp(props, ["Order", "排序"]);

        const lead = titleProp?.title?.[0]?.plain_text || "";
        const tail = tailProp?.rich_text?.[0]?.plain_text || "";

        return {
          n: String(orderProp?.number ?? index + 1).padStart(2, "0"),
          lead,
          tail,
        };
      });

    cache.beliefs = beliefs;
    cache.time = now;
    return beliefs;
  } catch (error) {
    console.warn(`Notion beliefs unavailable. Falling back to local. ${formatNotionError(error)}`);
    return null;
  }
}

export async function fetchNotionSocial(force: boolean = false) {
  const databaseId = process.env.NOTION_SOCIAL_DATABASE_ID;
  if (!databaseId || !process.env.NOTION_API_KEY) {
    console.warn("Missing Notion Social database env vars. Falling back to local.");
    return null;
  }

  const now = Date.now();
  const cache = getCache();
  if (!force && cache.social && (now - cache.time < CACHE_DURATION)) {
    return cache.social;
  }

  debugLog("Notion: Fetching social from database...");

  try {
    const response = await notion.dataSources.query({
      data_source_id: databaseId,
      filter: {
        property: "Status",
        status: {
          equals: "完成",
        },
      },
      sorts: [
        {
          property: "Order",
          direction: "ascending",
        },
      ],
    });

    const social = await Promise.all(
      response.results
        .filter((item): item is { id: string; properties: Record<string, any>; object: "page" } =>
          item.object === "page"
        )
        .map(async (page) => {
          const props = page.properties;

          const titleProp = getProp(props, ["名称", "Name", "Title", "标题"]);
          const fileProp = getProp(props, ["File", "Video", "视频"]);
          const externalUrlProp = getProp(props, ["ExternalUrl", "外部链接"]);
          const linkProp = getProp(props, ["Link", "链接"]);
          const bodyProp = getProp(props, ["Body", "Description", "描述"]);
          const aspectProp = getProp(props, ["Aspect", "比例"]);

          const postTitle = titleProp?.title?.[0]?.plain_text || "";
          const body = bodyProp?.rich_text?.[0]?.plain_text || "";
          const href = linkProp?.url || "";
          const aspectRatio = aspectProp?.rich_text?.[0]?.plain_text || "16 / 9";

          let src: string | undefined;
          if (fileProp?.files?.[0]) {
            const file = fileProp.files[0];
            if (file.type === "file" && file.file?.url) {
              try {
                src = await downloadImage(
                  file.file.url,
                  notionFileCacheId(page.id, 0, file.name, file.file.url),
                  force,
                  file.name,
                  legacyNotionFileCacheId(page.id, 0, file.name)
                );
              } catch (e) {}
            } else if (file.type === "external" && file.external?.url) {
              src = file.external.url;
            }
          }
          if (!src && externalUrlProp?.url) {
            src = externalUrlProp.url;
          }

          return {
            src: src || "",
            href,
            postTitle,
            body,
            aspectRatio,
          };
        })
    );

    cache.social = social;
    cache.time = now;
    return social;
  } catch (error) {
    console.warn(`Notion social unavailable. Falling back to local. ${formatNotionError(error)}`);
    return null;
  }
}

export async function fetchNotionWork(force: boolean = false, includeContent: boolean = true) {
  const databaseId = process.env.NOTION_WORK_DATABASE_ID;
  if (!databaseId || !process.env.NOTION_API_KEY) {
    console.warn("Missing Notion Work database env vars. Falling back to local MDX.");
    return null;
  }

  const now = Date.now();
  const cache = getCache();
  const cacheKey = includeContent ? "works" : "workPreviews";
  if (!force && cache[cacheKey] && (now - cache.time < CACHE_DURATION)) {
    return cache[cacheKey];
  }

  debugLog("Notion: Fetching work from database...");

  try {
    const dataSource = await resolveDataSource(databaseId, force);
    const filter = buildStatusFilter(dataSource.properties);
    const sorts = buildOrderSort(dataSource.properties);
    const response = await notion.dataSources.query({
      data_source_id: dataSource.id,
      ...(filter ? { filter } : {}),
      ...(sorts ? { sorts } : {}),
    });

    const works = await Promise.all(
      response.results
        .filter((item): item is { id: string; properties: Record<string, any>; object: "page" } =>
          item.object === "page"
        )
        .map(async (page) => {
          const props = page.properties;

          const titleProp = getProp(props, ["名称", "Name", "Title"]);
          const slugProp = getProp(props, ["Slug"]);
          const coverProp = getProp(props, ["cover", "Cover", "封面"]);
          const clientProp = getProp(props, ["Client", "客户"]);
          const roleProp = getProp(props, ["Role", "角色"]);
          const yearProp = getProp(props, ["Year", "年份"]);
          const summaryProp = getProp(props, ["Summary", "摘要"]);
          const coverFitProp = getProp(props, ["CoverFit", "适配"]);
          const coverAspectProp = getProp(props, ["Aspect", "比例", "CoverAspect", "图片比例", "封面比例"]);
          const tagsProp = getProp(props, ["Tags", "标签"]);
          const orderProp = getProp(props, workOrderPropertyNames);
          const externalLinkProp = getProp(props, [
            "ExternalLink",
            "External Link",
            "Project Link",
            "Work Link",
            "URL",
            "Url",
            "作品链接",
            "项目链接",
            "链接",
          ]);

          const title = titleProp?.title?.[0]?.plain_text || "Untitled";
          const slugFromProp = slugProp?.rich_text?.[0]?.plain_text;
          const slug = resolveWorkSlug(title, slugFromProp, page.id);

          const client = clientProp?.select?.name;
          const role = roleProp?.rich_text?.[0]?.plain_text;
          const year = yearProp?.rich_text?.[0]?.plain_text;
          const summaryFromProp = summaryProp?.rich_text?.[0]?.plain_text;
          const coverFit = coverFitProp?.select?.name as "cover" | "contain";
          const coverAspect = propPlainText(coverAspectProp);
          const tags = tagsProp?.multi_select?.map((t: any) => t.name);
          const order = propNumber(orderProp);
          const externalLink = propUrl(externalLinkProp);

          const pageCover = (page as any).cover;
          const coverFile = coverProp?.files?.[0];
          const localCoverFallback = workCoverFallbackBySlug[slug];
          const downloadedCover =
            (await resolveNotionAssetUrl(pageCover, page.id, 0, force)) ||
            (await resolveNotionAssetUrl(coverFile, page.id, 1, force));
          const cover = sanitizeWorkCoverUrl(downloadedCover) || localCoverFallback || "/work/_placeholder.svg";
          const coverType = mediaTypeFromSource(cover);

          let content = "";
          if (includeContent) {
            const mdResponse = await notion.pages.retrieveMarkdown({ page_id: page.id });
            content = normalizeWorkMarkdown(mdResponse.markdown || "");
          }

          return {
            slug,
            title,
            client,
            role,
            year,
            summary: summaryFromProp || (content ? extractSummary(content) : ""),
            summaryIsGenerated: !summaryFromProp,
            cover,
            coverType,
            coverFit,
            coverAspect,
            tags,
            order,
            externalLink,
            content,
          };
        })
    );

    const uniqueWorks = ensureUniqueWorkSlugs(works).sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999)
    );

    cache[cacheKey] = uniqueWorks;
    cache.time = now;
    return uniqueWorks;
  } catch (error) {
    console.warn(`Notion work unavailable. Falling back to local MDX. ${formatNotionError(error)}`);
    return null;
  }
}

function sanitizeWorkCoverUrl(url?: string) {
  if (!url) return undefined;
  try {
    const hostname = new URL(url).hostname;
    if (hostname === "prod-files-secure.s3.us-west-2.amazonaws.com") return undefined;
  } catch {}
  return url;
}

export async function fetchNotionPhotos(force: boolean = false) {
  const databaseId = process.env.NOTION_PHOTOS_DATABASE_ID;
  if (!databaseId || !process.env.NOTION_API_KEY) {
    console.warn("Missing Notion Photos database env vars. Falling back to local photos.");
    return null;
  }

  const now = Date.now();
  const cache = getCache();
  if (!force && cache.photos && (now - cache.time < CACHE_DURATION)) {
    return cache.photos;
  }

  debugLog("Notion: Fetching photos from database...");

  try {
    const dataSource = await resolveDataSource(databaseId, force);
    const filter = buildStatusFilter(dataSource.properties);
    const sorts = buildOrderSort(dataSource.properties);
    const response = await notion.dataSources.query({
      data_source_id: dataSource.id,
      ...(filter ? { filter } : {}),
      ...(sorts ? { sorts } : {}),
    });

    const photos = await Promise.all(
      response.results
        .filter((item): item is { id: string; properties: Record<string, any>; object: "page" } =>
          item.object === "page"
        )
        .map(async (page, index) => {
          const props = page.properties;

          const titleProp = getProp(props, ["名称", "Name", "Title", "Caption"]);
          const fileProp = getProp(props, ["File", "文件", "文件和媒体", "Files & media", "Photo", "Image", "Video"]);
          const externalUrlProp = getProp(props, ["ExternalUrl", "外部链接", "External URL"]);
          const rotateProp = getProp(props, ["Rotate", "旋转", "Rotation"]);
          const leftPctProp = getProp(props, ["LeftPct", "位置", "Left Percent", "Left"]);
          const stringHeightProp = getProp(props, ["StringHeight", "绳长", "String Height"]);
          const widthProp = getProp(props, ["Width", "宽度"]);
          const heightProp = getProp(props, ["Height", "高度"]);
          const zIndexProp = getProp(props, ["ZIndex", "层级", "Z-index", "Z Index"]);
          const fitProp = getProp(props, ["Fit", "适配"]);
          const imageScaleProp = getProp(props, ["ImageScale", "缩放", "Scale"]);
          const hideOnMobileProp = getProp(props, ["HideOnMobile", "移动端隐藏", "Hide on Mobile"]);
          const linkProp = getProp(props, ["Link", "链接", "URL", "External Link"]);

          const caption = titleProp?.title?.[0]?.plain_text || "";

          let src: string | undefined;
          if (fileProp?.files?.[0]) {
            const file = fileProp.files[0];
            if (file.type === "file" && file.file?.url) {
              try {
                const url = file.file.url;
                src = await downloadImage(
                  url,
                  notionFileCacheId(page.id, index, file.name, url),
                  force,
                  file.name,
                  legacyNotionFileCacheId(page.id, index, file.name)
                );
              } catch (e) {}
            } else if (file.type === "external" && file.external?.url) {
              src = file.external.url;
            }
          }
          if (!src && externalUrlProp?.url) {
            src = externalUrlProp.url;
          }

          return {
            src: src || "",
            caption,
            href: linkProp?.url,
            fit: fitProp?.select?.name as "cover" | "contain",
            imageScale: imageScaleProp?.number,
            rotate: rotateProp?.number ?? 0,
            leftPct: leftPctProp?.number ?? 50,
            stringHeight: stringHeightProp?.number ?? 50,
            width: widthProp?.number ?? 200,
            height: heightProp?.number ?? 200,
            zIndex: zIndexProp?.number ?? index + 1,
            hideOnMobile: hideOnMobileProp?.checkbox ?? false,
          };
        })
    );

    cache.photos = photos;
    cache.time = now;
    return photos;
  } catch (error) {
    console.warn(`Notion photos unavailable. Falling back to local photos. ${formatNotionError(error)}`);
    return null;
  }
}
