import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, } from 'node:crypto';
import { noteCategories, notesNav, notesSidebar, topicLink, topicLabel } from '../docs/.vitepress/navigation.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const docs = resolve(root, 'docs');
const write = process.argv.includes('--write');
const manifest = JSON.parse(readFileSync(resolve(root, 'scripts/content-migration.json'), 'utf8'));
const aliases = JSON.parse(readFileSync(resolve(docs, '.vitepress/legacy-routes.json'), 'utf8'));
const digest = value => createHash('sha256').update(value).digest('hex');
const retainedHome = readFileSync(resolve(docs, 'index.md'), 'utf8')
  .replace('link: /frontend/', 'link: /catalog/frontend/')
  .replace('link: /ai/', 'link: /catalog/ai/');
assert.equal(digest(retainedHome), manifest.homepageSha256, 'Original homepage content changed beyond the approved entry-link migration');
export function targetFile(link) {
  const pathname = decodeURI(link.split('#')[0]).replace(/\.html$/, '');
  assert(pathname.startsWith('/') && !pathname.includes('..'), `Invalid route: ${link}`);
  return resolve(docs, '.' + (pathname.endsWith('/') ? pathname + 'index.md' : pathname + '.md'));
}
const articleRoutes = new Map(manifest.articles.map(a => [a.route, a]));
const directories = new Map();
const primary = new Set();
const nodes = new Map();
for (const c of noteCategories) {
  directories.set(c.id, { ...c, directory: c.id, category: c, parent: null });
  const walk = (list, parent) => {
    const siblingIds = new Set();
    for (const n of list) {
      assert(!siblingIds.has(n.id), `Duplicate sibling ID: ${c.id}/${n.id}`);
      siblingIds.add(n.id);
      if (n.link) { assert(!primary.has(n.link), `Duplicate article owner: ${n.link}`); primary.add(n.link); nodes.set(n.link, n); }
      if (n.directory) directories.set(n.directory, { ...n, category: c, parent });
      walk(n.items ?? [], n.directory ? n : parent);
    }
  }; walk(c.items, c);
}
const linkList = list => list.map(n => `- [${topicLabel(n)}](${n.link})`).join('\n');
const diagrams = {
 'ai': 'flowchart LR\n  L[大模型基础] --> P[Prompt Engineering]\n  P --> R[RAG 上下文供给]\n  P --> A[Agent 决策闭环]\n  R --> A\n  A --> H[Harness 执行环境]\n  H --> M[MCP 外部能力]\n  H --> E[Skill / Rule / Prompt]\n  H --> C[Multi-Agent 协作]\n  M --> I[产品与框架实现]\n  E --> I\n  C --> I',
 'ai/agent': 'flowchart TB\n  A[Agent 能力与决策] --> H[Harness 循环 / 状态 / 执行]\n  H --> M[MCP 工具与数据接口]\n  H --> S[Skill 专业方法]\n  H --> R[Rule 行为约束]\n  H --> P[Prompt 指令与上下文]\n  H --> C[Multi-Agent 分工通信]\n  M --> F[产品与框架]\n  C --> F',
 'ai/agent/harness': 'sequenceDiagram\n  participant U as 任务输入\n  participant H as Harness\n  participant L as 模型\n  participant T as 工具 / MCP\n  U->>H: 目标与上下文\n  H->>L: 构造模型请求\n  L-->>H: 回复或工具调用\n  H->>T: 校验并执行调用\n  T-->>H: 工具结果\n  H->>H: 更新状态与上下文\n  H->>L: 继续决策闭环\n  L-->>H: 完成结果\n  H-->>U: 输出与收口',
 'ai/agent/mcp': 'sequenceDiagram\n  participant H as Host / Harness\n  participant C as MCP Client\n  participant S as MCP Server\n  participant L as 模型\n  H->>C: 建立连接\n  C->>S: initialize\n  S-->>C: 能力与协议协商\n  C->>S: notifications/initialized\n  C->>S: tools/list\n  S-->>C: 工具描述\n  C-->>H: 适配为 Agent 工具\n  H->>L: 注入工具定义\n  L-->>H: 生成调用请求\n  H->>C: 选择工具并传参\n  C->>S: tools/call\n  S-->>C: 执行结果\n  C-->>H: 返回结果供下一轮决策',
};
const interviewQuestions = {
 'HTML 面试题': ['语义化解决什么问题？如何说明与 SEO、可访问性的关系？', 'defer 与普通脚本如何影响解析和执行时机？'],
 'CSS 面试题': ['盒模型、BFC 和层叠优先级分别解决什么问题？', '实现居中、适配与样式隔离时，为什么选择这套方案？'],
 'JavaScript 面试题': ['闭包、原型链与 this 的机制如何用代码验证？', 'Promise、取消操作与事件循环的边界是什么？'],
 'TypeScript 面试题': ['类型注解、断言与运行时校验有什么区别？', 'TS 如何判断模块，和 ESM/CJS 的语义有何关系？'],
 '浏览器面试题': ['从浏览器进程到渲染流水线如何串联？', '回流重绘、阻塞渲染和事件循环如何影响交互？'],
 '网络面试题': ['从 URL 到响应，DNS、HTTP、缓存和鉴权分别处在哪一层？', 'SSE、WebSocket、Fetch 流式响应如何选择？'],
 'Vue 面试题': ['依赖收集如何连接状态变化与 UI 更新？', '组件通信、生命周期和 KeepAlive 的边界是什么？'],
 '大模型基础': ['预训练、SFT 与对齐训练分别改变什么？', '训练改变参数，Prompt/RAG 改变上下文，如何区分？'],
 'RAG': ['离线索引与在线检索生成的完整链路是什么？', '检索质量、证据和生成质量如何分别评估？'],
 'Prompt Engineering': ['如何定义目标、上下文、约束和输出协议？', '模型不稳定输出时，如何从输入与解析两侧定位？'],
 'Agent 架构': ['模型与 Agent 有什么区别，执行闭环由谁控制？', '上下文、工具、状态和反馈分别承担什么职责？'],
 'Harness': ['Harness 为什么不是 Agent 或模型的同义词？', '工具执行、异常处理与状态更新如何进入下一轮决策？'],
 'MCP': ['Host、Client、Server 如何协作？', '工具发现、模型工具调用与 tools/call 为什么不是同一个步骤？'],
 'Skill': ['Skill、Rule、Prompt 和 MCP Tool 如何分工？', '如何设计 Skill 的触发条件、流程与输出约束？'],
 '异步流处理': ['AsyncGenerator 如何转换成 Observable？', '取消订阅、断开连接和 AbortController 如何协作？'],
 '流式响应': ['逐 token 流如何经过服务端和浏览器到达 UI？', '缓冲、事件分段与渲染节奏如何分别定位？'],
 'Redis 设计': ['Map 与 Redis 在单实例、多副本和持久化上如何取舍？', '进程重启、TTL 与共享会话带来哪些边界？'],
 '原子扣费': ['扣减、幂等与状态流转如何保证一致性？', '调用失败、支付回调重试时如何收口和补偿？'],
 '高并发与一致性': ['负载均衡和多实例如何改变状态管理方案？', '高并发下如何区分原子性、幂等和最终一致性？'],
};
function renderNodes(category, list, depth = 2) {
  return list.map(n => {
    if (n.directory) return `\n${'#'.repeat(depth)} ${n.text} {#${n.id}}\n\n${n.description}\n\n[进入${n.text}学习导航](${n.indexLink})\n`;
    if (n.link && !n.items?.length) return `\n- [${topicLabel(n)}](${n.link})${n.role === 'supplement' ? ' · 补充笔记' : ''}\n`;
    let md = `\n${'#'.repeat(Math.min(depth, 4))} ${n.text} {#${n.id}}\n\n`;
    if (n.note) md += n.note + '\n\n';
    if (n.status === 'planned') md += '> 独立文章待补充；当前只保留学习方向，不代表已有完整内容。\n\n';
    if (category.id === 'interview' && interviewQuestions[n.text]) {
      md += '**先尝试回答**\n\n' + interviewQuestions[n.text].map(q => '- ' + q).join('\n') + '\n\n';
      md += '**简答核对与深入阅读**\n\n沿下方原文核对概念、流程和代码；这里不再复制技术正文。\n\n';
    }
    if (n.references?.length) md += linkList(n.references) + '\n';
    if (n.items?.length) md += renderNodes(category, n.items, depth + 1);
    if (category.id === 'interview' && interviewQuestions[n.text]) md += '\n**追问练习**：解释一次实际应用，再说明限制、失败场景和替代方案。\n';
    return md;
  }).join('');
}
function renderEntry(entry) {
  const route = '/' + entry.directory + '/';
  let md = `---\n# Generated by scripts/catalog.mjs from knowledge-tree.json.\ntitle: ${JSON.stringify(entry.text)}\ndescription: ${JSON.stringify(entry.description)}\ndocType: index\noutline: [2, 3]\n---\n\n# ${entry.text}\n\n${entry.description}\n\n`;
  if (entry.parent) md += `[← ${entry.parent.text}](${entry.parent.indexLink ?? entry.parent.link})\n\n`;
  md += '## 推荐学习路径\n\n' + (entry.learningPath ?? []).map((step, i) => `${i + 1}. ${step}`).join('\n') + '\n';
  if (diagrams[entry.directory]) md += '\n## 知识关系与执行链路\n\n```mermaid\n' + diagrams[entry.directory] + '\n```\n';
  md += '\n## 知识模块\n\n';
  md += '完整文章负责讲透机制；补充笔记保留不同视角；提纲与待补充条目按实际完成度标注。\n';
  if (entry.references?.length) md += '\n' + linkList(entry.references) + '\n';
  md += renderNodes(entry.category, entry.items ?? []);
  const inDirectory = manifest.articles.filter(a => a.topic === route);
  const listed = new Set();
  const collect = ns => ns.forEach(n => { if (n.link) listed.add(n.link); if (!n.directory) collect(n.items ?? []); });
  collect(entry.items ?? []);
  const extras = inDirectory.filter(a => !listed.has(a.route));
  if (extras.length) md += '\n## 本专题其他原始笔记\n\n' + linkList(extras.map(a => ({text:a.title,link:a.route,status:a.status}))) + '\n';
  const examples = manifest.resources.filter(r => r.publicRoute && (
    entry.directory === 'frontend/javascript' && /interview\/js|ecma-262/.test(r.path) ||
    entry.directory === 'computer-science/algorithms' && /LRU/.test(r.path) ||
    entry.directory === 'frontend/network' && /interview\/网络/.test(r.path) ||
    entry.directory === 'frontend/browser' && /interview\/浏览器|interview\/css/.test(r.path)
  ));
  if (examples.length) md += '\n## 原始代码与示例\n\n这些文件是已有学习片段，保留原始内容；代码链接用于查看或下载，不代表完整可运行项目。\n\n' + examples.map(r => `- [${r.path.split('/').at(-1)}](${encodeURI(r.publicRoute)})`).join('\n') + '\n';
  md += '\n## 关联专题\n\n' + linkList(entry.related ?? []) + '\n';
  if (!['interview','computer-science','tools'].includes(entry.category.id)) md += `\n[到面试与题库练习表达](/interview/${entry.category.id === 'ai' ? 'ai' : entry.category.id === 'frontend' ? 'frontend' : 'system-design'}/)\n`;
  md += '\n## 维护约定\n\n一个知识点维护一个主文档。学习导航和面试专题引用原文；同题的简记、详解、口述稿保留并标明用途。新内容先确定主归属，再补充专题与回链。\n';
  return md;
}
for (const entry of directories.values()) {
  const file = resolve(docs, entry.directory, 'index.md');
  const expected = renderEntry(entry);
  if (write) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, expected); }
  assert(existsSync(file) && readFileSync(file,'utf8') === expected, `Index out of sync: ${entry.directory}; run pnpm catalog:generate`);
}
if (write) {
  // Only former generated category lists are removed. Original article bodies were migrated separately.
  const previous = resolve(docs, 'catalog');
  for (const name of existsSync(previous) ? readdirSync(previous) : []) {
    const file = resolve(previous,name,'index.md');
    if (existsSync(file) && readFileSync(file,'utf8').includes('Generated by scripts/catalog.mjs')) unlinkSync(file);
  }
}
assert.deepEqual(notesNav.map(n => n.text), ['前端开发','AI 与 Agent','工程与架构','计算机基础','面试与题库','工具与实践']);
assert.equal(Object.keys(notesSidebar).length, 6);
// Reconstruct each pre-migration article exactly, including original frontmatter and every link offset.
for (const a of manifest.articles) {
  const text = readFileSync(resolve(docs,a.newPath),'utf8');
  assert(text.startsWith(a.metadataPrefix), `Migrated metadata unexpectedly changed: ${a.newPath}`);
  let body = text.slice(a.metadataPrefix.length);
  assert.equal(digest(body), a.migratedBodySha256, `Original body changed: ${a.newPath}`);
  let transformed = a.originalContentPrefix + body;
  assert.equal(digest(transformed), a.transformedOriginalSha256, `Original frontmatter changed: ${a.newPath}`);
  // Reverse right-to-left migration with adjusted offsets in the transformed string.
  let delta = 0;
  const offsets = a.linkChanges.map(change => { const i = change.offset + delta; delta += change.new.length-change.old.length; return {...change,i}; });
  for (const change of offsets.reverse()) {
    assert.equal(transformed.slice(change.i,change.i+change.new.length),change.new);
    transformed = transformed.slice(0,change.i)+change.old+transformed.slice(change.i+change.new.length);
  }
  assert.equal(digest(transformed), a.sha256, `Loss of original content: ${a.oldPath}`);
  assert(primary.has(a.route), `Article missing from primary navigation: ${a.newPath}`);
  assert(directories.has(a.topic.slice(1,-1)), `Article topic has no index: ${a.newPath}`);
}
for (const r of manifest.resources) {
  assert.equal(digest(readFileSync(resolve(docs,r.currentPath ?? r.path))),r.sha256,`Original resource changed: ${r.path}`);
  if (r.publicRoute) assert.equal(digest(readFileSync(resolve(docs,'public',r.publicRoute.slice(1)))),r.sha256);
}
const anchorCache = new Map();
function validateAnchor(link) {
  const [pathname, hash] = link.split('#');
  if (!hash) return;
  const file = targetFile(pathname);
  if (!anchorCache.has(file)) {
    const text = readFileSync(file, 'utf8');
    const anchors = new Set([...text.matchAll(/\{#([^}]+)\}/g)].map(m => m[1]));
    anchorCache.set(file, anchors);
  }
  // Explicit tree anchors are stable IDs; natural article heading hashes are checked by render.
  if (/^(?:topic-|[a-z][\w-]*$)/.test(hash)) assert(anchorCache.get(file).has(hash), `Missing topic anchor: ${link}`);
}
for (const [old,to] of Object.entries(aliases)) {
  assert(existsSync(targetFile(to)), `Invalid legacy redirect: ${old} -> ${to}`);
  validateAnchor(to);
}
for (const c of noteCategories) {
  const walk = ns => ns.forEach(n => {
    for (const link of [topicLink(c,n), ...(n.references ?? []).map(r=>r.link), ...(n.related ?? []).map(r=>r.link)]) {
      assert(existsSync(targetFile(link)),`Broken tree link: ${link}`);
      validateAnchor(link);
    }
    if (n.link) assert(n.link.startsWith(c.link), `Incorrect domain owner: ${n.link}`);
    walk(n.items ?? []);
  }); walk(c.items);
}
// Parse Markdown outside code fences, so sample API routes don't masquerade as page links.
const { createMarkdownRenderer } = await import('vitepress');
const parser = await createMarkdownRenderer(docs, { html: true });
const markdownFiles = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  if (entry.name === '.vitepress') return [];
  const file = resolve(directory, entry.name);
  return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith('.md') ? [file] : [];
});
const files = markdownFiles(docs).filter(file => file !== resolve(docs, 'index.md'));
for (const file of files) {
  const path = relative(docs, file).replaceAll('\\', '/');
  const route = '/' + path.replace(/index\.md$/, '').replace(/\.md$/, '');
  assert(primary.has(route) || directories.has(path.replace(/\/index\.md$/, '')), `Unlisted article: ${path}`);
}
let checkedLinks = 0;
for (const file of files) {
  const text = readFileSync(file,'utf8').replace(/^---\n[\s\S]*?\n---\n/,'');
  const tokens = parser.parse(text,{});
  const check = tokens => tokens.forEach(t => {
    const href = t.type==='link_open' ? t.attrGet('href') : t.type==='image' ? t.attrGet('src') : null;
    if (href && !/^(?:[a-z]+:|#)/i.test(href)) {
      const path = decodeURI(href.split('#')[0]);
      const dest = path.startsWith('/') ? extname(path) && !/\.(?:md|html)$/.test(path) || path.startsWith('/examples/') ? resolve(docs,'public','.'+path) : path.startsWith('/assets/') ? resolve(docs,'public','.'+path) : targetFile(path) : resolve(dirname(file),path);
      assert(existsSync(dest), `Broken ${t.type==='image'?'image':'link'}: ${file} -> ${href}`);
      checkedLinks++;
    }
    if (t.children) check(t.children);
  }); check(tokens);
}
if (write) {
 const report = '# 内容迁移对照表\n\n所有原有正文、代码、图片与进度记录均保留；旧网址通过构建兼容页跳转。\n\n| 原路径 | 新路径 | 中文标题 | 英文 slug | 类型 |\n| --- | --- | --- | --- | --- |\n' + manifest.articles.map(a => `| \`${a.oldPath}\` | \`${a.newPath}\` | ${a.title} | \`${a.slug}\` | ${a.docType} |`).join('\n') + '\n';
 writeFileSync(resolve(root,'scripts/content-migration.md'),report);
}
console.log(`Knowledge IA OK: ${directories.size} topic indexes, ${manifest.articles.length} original articles + retained home (${manifest.originalMarkdownCount} originals), ${manifest.resources.length} preserved resources, ${checkedLinks} local links, ${Object.keys(aliases).length} legacy routes/anchors. Original content reconstructed byte-for-byte.`);
