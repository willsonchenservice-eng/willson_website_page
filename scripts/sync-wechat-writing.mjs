import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Client } from "@notionhq/client";

const ROOT = process.cwd();
const WRITING_DIR = path.join(ROOT, "content", "writing");
const WECHAT_IMAGE_DIR = path.join(ROOT, "public", "wechat-images");

loadEnvFile(path.join(ROOT, ".env.local"));

const config = {
  urls: process.argv.filter((arg) => /^https?:\/\//.test(arg)),
  wechatAppId: process.env.WECHAT_MP_APP_ID,
  wechatAppSecret: process.env.WECHAT_MP_APP_SECRET,
  notionApiKey: process.env.NOTION_API_KEY,
  notionDatabaseId: process.env.NOTION_DATABASE_ID,
  source: process.env.WECHAT_SYNC_SOURCE || "published",
  limit: envNumber("WECHAT_SYNC_LIMIT", 20),
  topic: process.env.WECHAT_SYNC_TOPIC || "公众号",
  localOnly: process.argv.includes("--local-only"),
  dryRun: process.argv.includes("--dry-run"),
  updateExisting: process.argv.includes("--update-existing"),
};

if (!config.urls.length && (!config.wechatAppId || !config.wechatAppSecret)) {
  fail("Missing WECHAT_MP_APP_ID or WECHAT_MP_APP_SECRET.");
}

if (!config.localOnly && (!config.notionApiKey || !config.notionDatabaseId)) {
  fail("Missing NOTION_API_KEY or NOTION_DATABASE_ID. Use --local-only to skip Notion.");
}

const notion = config.localOnly
  ? null
  : new Client({ auth: config.notionApiKey, timeoutMs: envNumber("NOTION_TIMEOUT_MS", 10000) });

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  ensureDir(WRITING_DIR);
  ensureDir(WECHAT_IMAGE_DIR);

  const articles = config.urls.length
    ? await fetchWechatUrlArticles(config.urls)
    : await fetchWechatApiArticles();
  const selected = articles.slice(0, config.limit);
  const dataSource = notion ? await resolveNotionDataSource(config.notionDatabaseId) : null;

  console.log(
    `Wechat sync: ${selected.length} article(s), source=${config.urls.length ? "url" : config.source}`
  );

  for (const article of selected) {
    const normalized = await normalizeArticle(article);
    if (!normalized.title || !normalized.remoteMarkdown.trim()) continue;

    if (config.dryRun) {
      console.log(
        `[dry-run] ${normalized.date} ${normalized.title} (${normalized.remoteMarkdown.length} chars, ${normalized.imageCount} images)`
      );
      continue;
    }

    if (dataSource && notion) {
      const existing = await findExistingNotionPage(dataSource, normalized.slug);
      if (existing) {
        if (config.updateExisting) {
          await updateNotionWritingPage(existing.id, dataSource, normalized);
          console.log(`Notion updated: ${normalized.title}`);
        } else {
          console.log(`Notion exists: ${normalized.title}`);
        }
      } else {
        await createNotionWritingPage(dataSource, normalized);
        console.log(`Notion created: ${normalized.title}`);
      }
    }

    writeLocalMdx(normalized);
    console.log(`Local written: ${normalized.localFilename}`);
  }
}

async function fetchWechatApiArticles() {
  const token = await getWechatAccessToken();
  return fetchWechatArticles(token);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function fail(message) {
  console.error(`Wechat sync error: ${message}`);
  process.exit(1);
}

async function getWechatAccessToken() {
  const url = new URL("https://api.weixin.qq.com/cgi-bin/token");
  url.searchParams.set("grant_type", "client_credential");
  url.searchParams.set("appid", config.wechatAppId);
  url.searchParams.set("secret", config.wechatAppSecret);

  const data = await fetchJson(url);
  if (!data.access_token) {
    throw new Error(`Wechat token failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function fetchWechatArticles(accessToken) {
  try {
    return await fetchWechatArticlesFromSource(accessToken, config.source);
  } catch (error) {
    if (config.source === "published" && /48001/.test(String(error?.message || error))) {
      console.warn("Wechat published API unauthorized; falling back to permanent news material.");
      return fetchWechatArticlesFromSource(accessToken, "material");
    }
    throw error;
  }
}

async function fetchWechatArticlesFromSource(accessToken, source) {
  const endpoint =
    source === "draft"
      ? "https://api.weixin.qq.com/cgi-bin/draft/batchget"
      : source === "material"
        ? "https://api.weixin.qq.com/cgi-bin/material/batchget_material"
        : "https://api.weixin.qq.com/cgi-bin/freepublish/batchget";

  const articles = [];
  let offset = 0;

  while (articles.length < config.limit) {
    const batchSize = Math.min(20, config.limit - articles.length);
    const data = await fetchJson(`${endpoint}?access_token=${accessToken}`, {
      method: "POST",
      body: JSON.stringify({
        ...(source === "material" ? { type: "news" } : {}),
        offset,
        count: batchSize,
        no_content: 0,
      }),
    });

    if (data.errcode) {
      throw new Error(formatWechatApiError(data, source));
    }

    const items = Array.isArray(data.item) ? data.item : [];
    if (!items.length) break;

    for (const item of items) {
      const newsItems = item?.content?.news_item || item?.news_item || [];
      for (const news of newsItems) {
        articles.push({
          ...news,
          publish_time: news.publish_time || item.publish_time || item.update_time,
          article_id: item.article_id,
          media_id: item.media_id,
        });
        if (articles.length >= config.limit) break;
      }
      if (articles.length >= config.limit) break;
    }

    offset += items.length;
    if (items.length < batchSize) break;
  }

  return articles;
}

async function fetchWechatUrlArticles(urls) {
  const articles = [];
  for (const url of urls) {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        referer: "https://mp.weixin.qq.com/",
      },
    });
    if (!response.ok) {
      throw new Error(`Wechat URL fetch failed: ${url} HTTP ${response.status}`);
    }
    const html = await response.text();
    articles.push(parseWechatHtmlArticle(url, html));
  }
  return articles;
}

function parseWechatHtmlArticle(url, html) {
  const title =
    extractWechatJsString(html, "msg_title") ||
    extractMetaContent(html, "og:title") ||
    cleanText(extractElementById(html, "activity-name")) ||
    "Untitled";
  const digest =
    extractWechatJsString(html, "msg_desc") ||
    extractMetaContent(html, "description") ||
    "";
  const content = extractElementById(html, "js_content");
  const publishTime =
    extractWechatJsString(html, "publish_time") ||
    extractWechatJsString(html, "ct") ||
    extractMetaContent(html, "article:published_time") ||
    "";
  const articleId = new URL(url).pathname.split("/").filter(Boolean).at(-1) || url;

  if (!content) {
    throw new Error(`Could not find article content in WeChat URL: ${url}`);
  }

  return {
    title,
    digest,
    content,
    url,
    article_id: articleId,
    publish_time: publishTime,
  };
}

function extractWechatJsString(html, name) {
  const patterns = [
    new RegExp(`var\\s+${name}\\s*=\\s*'((?:\\\\'|[^'])*)'(?:\\.html\\([^)]*\\))?\\s*;`),
    new RegExp(`var\\s+${name}\\s*=\\s*"((?:\\\\"|[^"])*)"(?:\\.html\\([^)]*\\))?\\s*;`),
    new RegExp(`${name}\\s*:\\s*'((?:\\\\'|[^'\\n])*)'`),
    new RegExp(`${name}\\s*:\\s*"((?:\\\\"|[^"\\n])*)"`),
  ];
  for (const pattern of patterns) {
    const match = String(html || "").match(pattern);
    if (match) return decodeJsString(match[1]);
  }
  return "";
}

function extractMetaContent(html, property) {
  const pattern = new RegExp(
    `<meta\\s+[^>]*(?:property|name)=["']${escapeRegExp(property)}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapeRegExp(property)}["'][^>]*>`,
    "i"
  );
  const match = String(html || "").match(pattern) || String(html || "").match(reversePattern);
  return match ? decodeHtml(match[1]) : "";
}

function extractElementById(html, id) {
  const source = String(html || "");
  const openPattern = new RegExp(`<([a-z0-9]+)\\b[^>]*id=["']${escapeRegExp(id)}["'][^>]*>`, "i");
  const match = openPattern.exec(source);
  if (!match) return "";

  const tag = match[1].toLowerCase();
  let depth = 0;
  const tagPattern = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  tagPattern.lastIndex = match.index;

  let tagMatch;
  while ((tagMatch = tagPattern.exec(source))) {
    if (tagMatch[0][1] === "/") depth -= 1;
    else depth += 1;
    if (depth === 0) {
      return source.slice(match.index, tagPattern.lastIndex);
    }
  }

  return source.slice(match.index);
}

function decodeJsString(input) {
  return decodeHtml(
    String(input || "")
      .replace(/\\x([0-9a-f]{2})/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
      .replace(/\\u([0-9a-f]{4})/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
      .replace(/\\(["'\\/])/g, "$1")
  );
}

function escapeRegExp(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatWechatApiError(data, source) {
  const hint =
    data.errcode === 48001
      ? "This account/app does not have permission for the old article/material API. Check the WeChat admin console API permissions, or use a newer subscription API/import-by-url flow."
      : "";
  return `Wechat article fetch failed (${source}): ${JSON.stringify(data)}${hint ? ` ${hint}` : ""}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 200)}`);
  }
  return data;
}

async function normalizeArticle(article) {
  const title = cleanText(article.title || "Untitled");
  const date = formatWechatDate(article.publish_time || article.update_time || Date.now() / 1000);
  const baseSlug = slugify(article.article_id || article.url || title);
  const slug = baseSlug || crypto.createHash("sha1").update(title).digest("hex").slice(0, 10);
  const summary = cleanText(article.digest || extractText(article.content || "").slice(0, 120));
  const sourceUrl = article.url || article.content_source_url || "";
  const imageCount = extractImageUrls(article.content || "").length;
  const remoteMarkdown = htmlToMarkdown(article.content || "", { imageMap: new Map() });
  const imageMap = config.dryRun
    ? new Map()
    : await downloadImages(article.content || "", `${date}-${slug}`);
  const localMarkdown = htmlToMarkdown(article.content || "", { imageMap });
  const localFilename = `${date}-${slug}.mdx`;

  return {
    title,
    date,
    slug,
    summary,
    topic: config.topic,
    source: "公众号",
    sourceUrl,
    imageCount,
    remoteMarkdown,
    localMarkdown,
    localFilename,
  };
}

function formatWechatDate(value) {
  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function slugify(input) {
  return decodeHtml(String(input))
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\?.*$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w一-龥-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function cleanText(input) {
  return decodeHtml(stripTags(String(input || ""))).replace(/\s+/g, " ").trim();
}

function extractText(html) {
  return cleanText(html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n"));
}

function htmlToMarkdown(html, { imageMap }) {
  let markdown = String(html || "");

  markdown = markdown.replace(/<script[\s\S]*?<\/script>/gi, "");
  markdown = markdown.replace(/<style[\s\S]*?<\/style>/gi, "");
  markdown = markdown.replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, body) => {
    const level = Number(tag.slice(1));
    return `\n\n${"#".repeat(Math.min(level, 3))} ${cleanText(body)}\n\n`;
  });
  markdown = markdown.replace(/<img\b([^>]*)>/gi, (_, attrs) => {
    const src = getWechatImageUrl(attrs);
    if (!src) return "";
    const alt = cleanText(getHtmlAttr(attrs, "alt") || "");
    return `\n\n![${escapeMarkdownText(alt)}](${imageMap.get(src) || src})\n\n`;
  });
  markdown = markdown.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, body) => {
    const href = getHtmlAttr(attrs, "href");
    const text = cleanText(body);
    return href && text ? `[${escapeMarkdownText(text)}](${href})` : text;
  });
  markdown = markdown.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, body) => {
    const text = cleanText(body);
    return text ? `**${text}**` : "";
  });
  markdown = markdown.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, body) => {
    const text = cleanText(body);
    return text ? `*${text}*` : "";
  });
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, body) => {
    return `\n\n${cleanText(body)
      .split(/\n+/)
      .map((line) => `> ${line}`)
      .join("\n")}\n\n`;
  });
  markdown = markdown.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, body) => `\n- ${cleanText(body)}`);
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
  markdown = markdown.replace(/<\/(p|section|div|ul|ol)>/gi, "\n\n");
  markdown = markdown.replace(/<[^>]+>/g, "");
  markdown = decodeHtml(markdown);
  markdown = markdown
    .split(/\n/)
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return markdown;
}

async function downloadImages(html, slug) {
  const imageMap = new Map();
  const urls = extractImageUrls(html);

  for (const [index, url] of urls.entries()) {
    try {
      const response = await fetch(url, {
        headers: {
          referer: "https://mp.weixin.qq.com/",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = extensionFromContentType(response.headers.get("content-type")) || extensionFromUrl(url) || "jpg";
      const filename = `${slug}-${String(index + 1).padStart(2, "0")}.${ext}`;
      const filePath = path.join(WECHAT_IMAGE_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      imageMap.set(url, `/wechat-images/${filename}`);
    } catch (error) {
      console.warn(`Image kept remote: ${url} (${error.message})`);
    }
  }

  return imageMap;
}

function extractImageUrls(html) {
  const urls = [];
  const seen = new Set();
  for (const match of String(html || "").matchAll(/<img\b([^>]*)>/gi)) {
    const src = getWechatImageUrl(match[1]);
    if (src && !seen.has(src)) {
      seen.add(src);
      urls.push(src);
    }
  }
  return urls;
}

function getWechatImageUrl(attrs) {
  const candidates = [
    "data-src",
    "data-backsrc",
    "data-original",
    "data-actualsrc",
    "data-lazy-src",
    "data-ratio-src",
    "src",
  ];
  for (const name of candidates) {
    const url = normalizeWechatAssetUrl(getHtmlAttr(attrs, name));
    if (url) return url;
  }

  const srcset = getHtmlAttr(attrs, "srcset") || getHtmlAttr(attrs, "data-srcset");
  for (const part of srcset.split(",")) {
    const url = normalizeWechatAssetUrl(part.trim().split(/\s+/)[0]);
    if (url) return url;
  }

  return "";
}

function normalizeWechatAssetUrl(url) {
  const value = decodeHtml(String(url || "")).trim();
  if (!value || value.startsWith("data:")) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  return "";
}

function getHtmlAttr(attrs, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = String(attrs || "").match(pattern);
  return match ? decodeHtml(match[2] || match[3] || match[4] || "") : "";
}

function extensionFromContentType(contentType = "") {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "";
}

function extensionFromUrl(url) {
  const match = new URL(url).pathname.match(/\.([a-z0-9]{3,4})$/i);
  return match ? match[1].toLowerCase().replace("jpeg", "jpg") : "";
}

function stripTags(input) {
  return input.replace(/<[^>]*>/g, "");
}

function decodeHtml(input) {
  const entities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return String(input).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity) => {
    if (entity[0] === "#") {
      const code = entity[1]?.toLowerCase() === "x"
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    }
    return entities[entity.toLowerCase()] ?? `&${entity};`;
  });
}

function escapeMarkdownText(input) {
  return String(input).replace(/[[\]]/g, "\\$&");
}

async function resolveNotionDataSource(id) {
  try {
    const dataSource = await notion.dataSources.retrieve({ data_source_id: id });
    return { id: dataSource.id, properties: dataSource.properties || {} };
  } catch {
    const database = await notion.databases.retrieve({ database_id: id });
    const dataSourceId = database.data_sources?.[0]?.id;
    if (!dataSourceId) return { id, properties: database.properties || {} };
    const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
    return { id: dataSource.id, properties: dataSource.properties || database.properties || {} };
  }
}

async function findExistingNotionPage(dataSource, slug) {
  const slugName = findPropertyName(dataSource.properties, ["Slug"], "rich_text");
  if (!slugName) return null;
  const response = await notion.dataSources.query({
    data_source_id: dataSource.id,
    filter: {
      property: slugName,
      rich_text: { equals: slug },
    },
    page_size: 1,
  });
  return response.results?.[0] || null;
}

async function createNotionWritingPage(dataSource, article) {
  const properties = buildNotionProperties(dataSource.properties, article);
  const page = await notion.pages.create({
    parent: { data_source_id: dataSource.id },
    properties,
  });

  await appendNotionMarkdown(page.id, article.remoteMarkdown);
}

async function updateNotionWritingPage(pageId, dataSource, article) {
  const properties = buildNotionProperties(dataSource.properties, article);
  await notion.pages.update({
    page_id: pageId,
    properties,
  });

  await archiveNotionChildren(pageId);
  await appendNotionMarkdown(pageId, article.remoteMarkdown);
}

async function appendNotionMarkdown(pageId, markdown) {
  const blocks = markdownToNotionBlocks(markdown);
  for (const chunk of chunkArray(blocks, 80)) {
    await notion.blocks.children.append({
      block_id: pageId,
      children: chunk,
    });
  }
}

async function archiveNotionChildren(blockId) {
  let cursor;
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const block of response.results || []) {
      await notion.blocks.update({
        block_id: block.id,
        archived: true,
      });
    }

    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
}

function buildNotionProperties(schema, article) {
  const properties = {};
  const titleName = findPropertyName(schema, ["名称", "Name", "Title"], "title");
  if (!titleName) throw new Error("Notion Writing database needs a title property.");
  properties[titleName] = { title: richText(article.title, 100) };

  addProperty(properties, schema, ["Slug"], "rich_text", { rich_text: richText(article.slug, 100) });
  addProperty(properties, schema, ["date", "Date", "日期"], "date", { date: { start: article.date } });
  addProperty(properties, schema, ["Topic", "话题"], "multi_select", { multi_select: [{ name: article.topic }] });
  addProperty(properties, schema, ["Summary", "摘要"], "rich_text", { rich_text: richText(article.summary, 100) });
  addProperty(properties, schema, ["Source", "来源"], "select", { select: { name: article.source } });
  addProperty(properties, schema, ["Source URL", "SourceUrl", "sourceUrl", "链接", "原文链接"], "url", {
    url: article.sourceUrl || null,
  });
  addProperty(properties, schema, ["Status", "状态"], "select", { select: { name: "完成" } });
  addProperty(properties, schema, ["Status", "状态"], "status", { status: { name: "完成" } });

  return properties;
}

function addProperty(target, schema, names, type, value) {
  const name = findPropertyName(schema, names, type);
  if (name) target[name] = value;
}

function findPropertyName(schema, names, type) {
  for (const name of names) {
    if (schema[name]?.type === type) return name;
  }
  for (const [name, prop] of Object.entries(schema)) {
    if (prop?.type === type && names.some((candidate) => name.toLowerCase() === candidate.toLowerCase())) {
      return name;
    }
  }
  return "";
}

function richText(input, maxChunks = 20) {
  const chunks = splitText(String(input || ""), 1900).slice(0, maxChunks);
  return chunks.map((text) => ({ type: "text", text: { content: text } }));
}

function markdownToNotionBlocks(markdown) {
  const blocks = [];
  const parts = String(markdown || "").split(/\n{2,}/);

  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;
    const image = text.match(/^!\[[^\]]*]\(([^)]+)\)$/);
    if (image && /^https?:\/\//.test(image[1])) {
      blocks.push({
        object: "block",
        type: "image",
        image: { type: "external", external: { url: image[1] } },
      });
      continue;
    }

    const heading = text.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const type = `heading_${heading[1].length}`;
      blocks.push({
        object: "block",
        type,
        [type]: { rich_text: richText(heading[2]) },
      });
      continue;
    }

    if (text.startsWith("> ")) {
      blocks.push({
        object: "block",
        type: "quote",
        quote: { rich_text: richText(text.replace(/^>\s?/gm, "")) },
      });
      continue;
    }

    if (/^-\s+/m.test(text)) {
      for (const line of text.split(/\n/).filter(Boolean)) {
        blocks.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: richText(line.replace(/^-\s+/, "")) },
        });
      }
      continue;
    }

    for (const chunk of splitText(text, 1900)) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: richText(chunk) },
      });
    }
  }

  return blocks.length ? blocks : [{ object: "block", type: "paragraph", paragraph: { rich_text: [] } }];
}

function splitText(text, size) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function writeLocalMdx(article) {
  const frontmatter = [
    "---",
    `title: ${yamlString(article.title)}`,
    `date: ${yamlString(article.date)}`,
    `summary: ${yamlString(article.summary)}`,
    `topic: ${yamlString(article.topic)}`,
    `source: ${yamlString(article.source)}`,
    article.sourceUrl ? `sourceUrl: ${yamlString(article.sourceUrl)}` : "",
    `slug: ${yamlString(article.slug)}`,
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  fs.writeFileSync(path.join(WRITING_DIR, article.localFilename), `${frontmatter}\n${article.localMarkdown}\n`, "utf8");
}

function yamlString(value) {
  return JSON.stringify(String(value || ""));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
