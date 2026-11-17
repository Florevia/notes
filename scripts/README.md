# 技术知识库维护

## 信息架构

正式内容位于六大领域：`frontend/`、`ai/`、`engineering/`、`computer-science/`、`interview/`、`tools/`。

- 一个知识点只有一个主文档。面试、学习路线与跨领域专题通过链接引用。
- 同题的详解、简记与口述稿完整保留：补充版使用 `role: supplement` 和 `related` 关联主文档，口述稿归面试体系。
- 英文目录与 kebab-case slug，中文标题。通常两层目录，Agent 等最多三至四层。
- 仅创建有文章或有实际关联内容的专题，不为了目录完整制造占位正文。待补充方向在入口说明。
- 原始代码与示例保留在原路径，并在 `docs/public/examples/` 提供相同字节的可查阅版本。

## 统一数据源与入口

`docs/.vitepress/knowledge-tree.json` 维护领域、专题、文章、学习路径与关联关系。
`docs/.vitepress/navigation.ts` 复用这份数据，生成首页目录、顶部六大领域、当前领域侧边栏与阅读归属。

文章节点：

```json
{
  "id": "agent-modules",
  "text": "Agent 的模块构成",
  "link": "/ai/agent/architecture/agent-modules"
}
```

专题节点：

```json
{
  "id": "architecture",
  "text": "Agent 架构",
  "directory": "ai/agent/architecture",
  "indexLink": "/ai/agent/architecture/",
  "description": "一个 Agent 的内部组成和决策闭环。",
  "learningPath": ["先读模块构成，再跟踪执行生命周期。"],
  "items": []
}
```

`directory` 指向独立 `index.md`；不需独立目录的分组使用 `indexLink: /所属专题/#稳定锚点`。
已有 `id` 是兼容锚点，重命名展示标题时不要更改。

`references` 为原文引用，`related` 为关联专题/主文档，`status: planned | outline` 根据实际内容标注。

## 新增文章流程

1. 先确定唯一主归属。文件名使用语义明确的英文 slug。
2. 从 `scripts/templates/` 选择概念、架构、源码分析、对比或面试模板，按内容需要调整，不强迫所有文章填满每个章节。
3. 添加 `title`、`description`、`tags`、`docType` 和 `knowledgeTopic`。仅在实际更新时填写 `updated`，不伪造历史日期。
4. 将文章添加到 `knowledge-tree.json` 对应分支。面试只引用正文，不复制完整技术解释。
5. 如需迁移现有 URL，添加 `legacy-routes.json` 中的旧路径 → 新路径映射。
6. 运行：

```sh
pnpm catalog:generate
pnpm check
pnpm ll:build
```

脚本会生成领域和专题入口，包含学习路径、知识关系、原始文章与关联主题。不要直接编辑带 Generated 标记的入口。

## 内容保留与迁移记录

- `scripts/content-migration.md`：旧路径、新路径、中文标题、英文 slug、文档类型的完整对照表。
- `scripts/content-migration.json`：迁移前 **265 个 Markdown 文件、264 篇原文与保留首页** 的基线，包含原始 SHA-256、链接精确替换记录与 **34 个资源** 的哈希。
- `catalog:check` 从迁移后的正文还原原始链接与 Frontmatter，逐字节验证原内容未减损；同时检查所有原文的导航入口与资源。
- 原内容完整性基线是本次迁移的验收记录，不应在内容编辑后静默改写。之后有意修改原文时，应同步调整校验方式并保留版本历史，而不是随意更新哈希掩盖差异。
- 原本空白的文件保留为 `status: planned`，不进入搜索。原来的提纲仍标注提纲。
- `scripts/navigation-legacy-links.json` 保留旧目录入口快照，供迁移记录参考。

## 旧网址兼容

`docs/.vitepress/legacy-routes.json` 保存旧文章和 `/catalog/...` 入口映射。`legacy.ts` 同时为开发服务器提供兼容跳转，为静态构建输出生成不含正文的 HTML 兼容页。

兼容页保留原 hash，并将旧分类锚点重定向到新专题入口；无 JavaScript 时仍提供新地址链接。旧网址不复制 Markdown，不污染本地搜索。

`pnpm ll:preview` 使用 `scripts/preview.mjs` 预览静态产物，并显式处理旧路由；避免 macOS 不区分大小写时 VitePress 内置静态索引将 `/AI/`、`/HTML/` 旧路径误报为 404。部署应使用正常的静态 HTML/目录首页路由，不能把所有旧 `.html` 请求强制改写为 SPA 首页。

## 验证范围

- 原文逐字节还原、原始图片/代码资源哈希、全部文章有入口。
- 六大领域、主归属唯一、每个实际专题有 `index.md`。
- 全文 Markdown 本地链接与图片（排除示例代码中的 API 路径）。
- 顶部导航归属、阅读回链、静态兼容页与 hash 保留。
- 严格 VitePress 构建：只精确豁免原文 CORS 教学中的 `localhost` 示例 URL，所有真实站内链接仍严格检查。
- 浏览器检查：首页、AI 主线、典型文章、旧链接、搜索、移动端和明暗主题。

外部网站可用性与历史内容技术准确性不属于目录迁移校验。

## 一次性迁移工具

`restructure-knowledge.py` 与 `refine-knowledge-tree.mjs` 是本次 IA 重构的溯源脚本，不用于日常生成；已迁移后不要重复运行。日常维护只使用 `catalog:generate`。
