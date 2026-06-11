# Notion 数据库配置（精简版）

## PhotoWall（照片墙）
**最少只需要：名称 + File**

| 字段 | 类型 | 必填 | 默认值 |
|------|------|------|--------|
| 名称 | Title | ✅ | - |
| File | Files & media | ✅ | - |
| Status | Select | ✅ | 完成 |

---

## Work（作品）
**最少只需要：名称 + 正文内容**

| 字段 | 类型 | 必填 | 默认值 |
|------|------|------|--------|
| 名称 | Title | ✅ | - |
| Status | Select | ✅ | 完成 |
| 正文 | Page Content | ✅ | - |

---

## Writing（博客）
**最少只需要：名称 + 正文内容**

| 字段 | 类型 | 必填 | 默认值 |
|------|------|------|--------|
| 名称 | Title | ✅ | - |
| Status | Select | ✅ | 完成 |
| 正文 | Page Content | ✅ | - |

---

## Beliefs（设计理念）
**最少只需要：名称 + 描述**

| 字段 | 类型 | 必填 | 默认值 |
|------|------|------|--------|
| 名称 | Title | ✅ | - |
| Tail/描述 | Rich text | ✅ | - |
| Status | Select | ✅ | 完成 |

---

## Social（自媒体）
**最少只需要：名称 + File + 链接 + 描述**

| 字段 | 类型 | 必填 | 默认值 |
|------|------|------|--------|
| 名称 | Title | ✅ | - |
| File/视频 | Files & media | ✅ | - |
| Link/链接 | URL | ✅ | - |
| Body/描述 | Rich text | ✅ | - |
| Status | Select | ✅ | 完成 |

---

## 环境变量
```
NOTION_API_KEY=你的token
NOTION_DATABASE_ID=Blog数据库ID
NOTION_WORK_DATABASE_ID=Work数据库ID
NOTION_PHOTOS_DATABASE_ID=PhotoWall数据库ID
NOTION_BELIEFS_DATABASE_ID=Beliefs数据库ID
NOTION_SOCIAL_DATABASE_ID=Social数据库ID
```

## 公众号同步

同步链路：公众号发布记录/草稿 → Notion Writing 数据库 → `content/writing` 本地 MDX。

需要在 `.env.local` 增加：

```
WECHAT_MP_APP_ID=你的公众号AppID
WECHAT_MP_APP_SECRET=你的公众号AppSecret
WECHAT_SYNC_SOURCE=published
WECHAT_SYNC_LIMIT=20
WECHAT_SYNC_TOPIC=公众号
```

运行：

```
npm run sync:wechat
```

可选：

```
npm run sync:wechat -- --dry-run
npm run sync:wechat -- --local-only
```

说明：

- `WECHAT_SYNC_SOURCE=published` 同步已发布文章；改成 `draft` 可同步草稿箱。
- 脚本默认只新增，不覆盖 Notion 里已有同 `Slug` 的文章。
- 公众号正文图片会下载到 `public/wechat-images`，本地 MDX 使用本地图片路径。
- 写入 Notion 时会使用公众号原始图片链接；网站后续从 Notion 拉取时仍会走现有图片缓存逻辑。
