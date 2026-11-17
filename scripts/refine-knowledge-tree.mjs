import { readFileSync, writeFileSync } from 'node:fs';
const file = new URL('../docs/.vitepress/knowledge-tree.json', import.meta.url);
const tree = JSON.parse(readFileSync(file, 'utf8'));
const find = (id, name) => {
  const walk = (nodes) => { for (const n of nodes) { if (n.text === name) return n; const found = walk(n.items ?? []); if (found) return found; } };
  return walk(tree.find(c => c.id === id).items);
};
// Cross-domain topics are intentional reference groups, not stray links under HTML.
find('frontend', 'HTML').references = [];
const transport = find('frontend', '传输层');
transport.references = [
  { text: 'TCP', link: '/computer-science/networking/tcp' },
  { text: 'TCP 可靠性与 UDP', link: '/computer-science/networking/tcp-reliability-udp' },
  { text: 'TCP 粘包与拆包', link: '/computer-science/networking/tcp-framing' },
];
transport.note = '传输层原理统一维护在计算机基础。这里从 Web 应用视角关联，不复制一份 TCP/UDP 文档。';
find('frontend', '服务端交互').references = [
  { text: 'RESTful 与 RPC', link: '/engineering/architecture/rest-rpc' },
  { text: 'Nginx 配置', link: '/engineering/architecture/nginx' },
  { text: '负载均衡', link: '/engineering/architecture/load-balancing' },
];
find('frontend', '服务端交互').note = '协议使用在前端查阅，服务部署与架构设计回到工程与架构。';
find('frontend', 'HTTP 基础').references = [{ text: 'DNS 解析', link: '/computer-science/networking/dns' }];
find('engineering', '软件架构').references = [];
find('tools', 'Git').references = [];
const htmlInterview = find('interview', 'HTML 面试题');
htmlInterview.references = htmlInterview.references.filter(r => !r.link.includes('rendering-modes'));
find('interview', '浏览器 面试题').text = '浏览器面试题';
find('interview', '网络 面试题').text = '网络面试题';
find('interview', '浏览器面试题').references.push({ text: '浏览器渲染模式', link: '/frontend/browser/rendering-modes' });
// Move old compact Canvas example beside the main Web API article.
const browser = find('frontend', '浏览器');
const css = find('frontend', 'CSS');
const cssCanvas = css.items.find(n => n.link === '/frontend/browser/canvas-drawing');
if (cssCanvas) { css.items = css.items.filter(n => n !== cssCanvas); find('frontend', 'Web API').items.push(cssCanvas); }
// Associate supplement versions explicitly; all bodies remain intact.
const variants = {
 '/frontend/vue/ref-reactive-notes': '/frontend/vue/ref-reactive',
 '/frontend/vue/next-tick-notes': '/frontend/vue/next-tick',
 '/frontend/vue/class-style-notes': '/frontend/vue/class-style',
 '/frontend/vue/scoped-css-notes': '/frontend/vue/scoped-css',
 '/frontend/vue/slot-notes': '/frontend/vue/slot',
 '/frontend/vue/component-communication-notes': '/frontend/vue/component-communication',
 '/frontend/javascript/esm-vs-cjs-engineering-notes': '/frontend/javascript/esm-vs-cjs',
 '/frontend/browser/canvas-drawing': '/frontend/browser/canvas',
 '/interview/frontend/reactivity-answer': '/frontend/vue/ref-reactive',
};
const all = [];
const walk = ns => ns.forEach(n => { all.push(n); walk(n.items ?? []); });
tree.forEach(c => walk(c.items));
const primary = Object.fromEntries(all.filter(n => n.link).map(n => [n.link, n]));
for (const n of all) {
  if (variants[n.link]) { n.related = [{ text: '主文档：' + primary[variants[n.link]].text, link: variants[n.link] }]; n.role = n.link.includes('/interview/') ? 'answer' : 'supplement'; }
}
// A concrete topic plan: responsibilities, prerequisites and cross-domain relationships.
const guides = {
 'frontend': ['Web 技术与应用实现的主线。语言基础讲机制，浏览器与网络讲运行环境，Vue 与业务实践讲如何落地。', ['先沿 HTML → CSS → JavaScript → TypeScript 建立语言基础。','再理解浏览器渲染、事件循环与 HTTP 通信。','随后深入 Vue 响应式和渲染，最后用性能优化与业务实践验证理解。'], ['/computer-science/','/engineering/','/interview/frontend/']],
 'ai': ['从模型与上下文出发，理解检索增强、Agent 决策、运行环境和工具扩展。产品分析回到架构概念，不以产品名切碎知识体系。', ['模型训练 → Prompt Engineering → RAG：先理解模型能力与上下文来源。','Agent 架构 → Harness → MCP → 扩展机制：贯通决策、执行与工具连接。','最后研究多 Agent 协作和 OpenClaw 等实现，把抽象结构映射回真实产品。'], ['/ai/agent/','/engineering/architecture/','/interview/ai/']],
 'engineering': ['运行时、软件架构和工程工具链。将后端会话管理、异步流、一致性问题与前端业务实践串成完整的端到端方案。', ['先区分语言模块系统、Node.js 运行时和服务端框架。','再沿异步流 → 会话存储 → 原子扣费学习服务设计。','用构建、包管理、质量保障与历史工程方案连接设计和交付。'], ['/frontend/practice/','/ai/agent/harness/','/interview/system-design/']],
 'computer-science': ['可跨语言和框架复用的基础原理。网络主文档在这里维护，Web 应用与面试专题以链接引用。', ['五层模型 → DNS 与代理 → TCP/UDP：从分层理解网络。','数组/字符串 → 链表/哈希 → 树图 → 排序与动态规划：按依赖理解算法。','算法专题目前以已有练习索引和代码示例为入口，不冒充完整教材。'], ['/frontend/network/','/interview/algorithms/']],
 'interview': ['面向表达与验证的题库入口，而不是技术正文的第二份副本。先回答问题，再沿链接回到知识原文验证机制、代码与边界。', ['选领域问题，先不看资料作简答。','对照关联原文补齐原理、实现与失败场景。','练习追问与代码，最后在复习记录里沉淀薄弱点。'], ['/frontend/','/ai/','/engineering/','/computer-science/']],
 'tools': ['研发工具的使用与排障经验。Git 管理变更，Shell 与 SSH 管理执行环境，调试和代理工具帮助定位实际问题。', ['Git 语法 → 分支流程：先建立可回溯的变更习惯。','Shell 启动文件 → 执行方式 → SSH：理解命令在哪个环境运行。','最后结合调试、系统代理与 TUN/fake-IP 定位问题。'], ['/engineering/toolchain/','/frontend/practice/']],
 'ai/agent': ['Agent 是决策与行动系统；Harness 是模型之外的执行环境；MCP 是外部能力接口；Skill/Rule/Prompt 是专业能力、行为约束和上下文载体。它们不是互相替代的产品名。', ['Agent 架构明确能力模块和执行闭环。','Harness 把模型、工具、状态、权限与生命周期编排成可执行系统。','MCP 连接外部能力，扩展机制提供专业指令；在此基础上再组织多 Agent。'], ['/ai/prompt-engineering/','/ai/rag/','/interview/ai/']],
 'ai/agent/architecture': ['关注一个 Agent 内部的感知、上下文、决策、行动与反馈，以及一次任务如何闭环。', ['先读模块构成，区分模型能力与系统能力。','沿执行生命周期跟踪输入、工具行动和结果反馈。','再读 Harness，理解谁真正负责循环与状态管理。'], ['/ai/agent/harness/','/ai/agent/multi-agent/']],
 'ai/agent/harness': ['Harness 为模型提供运行环境：组织上下文、执行工具、管理状态、控制生命周期与处理异常。', ['先理解 Agent 架构，再读 Harness 的模块构成。','沿模型请求 → 工具执行 → 状态更新 → 下一轮请求追踪调用链。','用 DeepSeek Harness 架构分析对照模块、边界与工程取舍。'], ['/ai/agent/architecture/','/ai/agent/mcp/','/engineering/architecture/']],
 'ai/agent/mcp': ['MCP 规范 Host、Client 与 Server 的连接和能力调用。Pi 的实现分析用于说明协议能力如何接入 Agent 工具系统。', ['先读 MCP 系统性知识，理解角色、握手和传输。','再追踪工具发现、工具描述注入与 tools/call 调用。','最后用 Pi Agent 和平台自研方案对照协议层、适配层与模型上下文。'], ['/ai/agent/harness/','/ai/agent/extensions/','/frontend/network/']],
 'ai/agent/extensions': ['Skill 组织专业任务方法，Rule 约束行为，Prompt 定义指令与上下文。通用提示词工程在独立专题维护，此处关注 Agent 侧扩展。', ['先区分 Skill、Rule、Prompt 的职责。','用 Skill 模板理解输入、流程、输出与触发条件。','回到 Harness 与 MCP，区分指令扩展和可执行工具能力。'], ['/ai/prompt-engineering/','/ai/agent/mcp/','/ai/agent/harness/']],
 'ai/agent/multi-agent': ['多 Agent 的分工、通信、状态共享和调度。先理解单 Agent 执行环境，才容易判断拆分是否有收益。', ['先理解单 Agent 生命周期。','再比较委派、协作与通信机制。','最后分析任务分解、结果汇总、共享状态和失败处理。'], ['/ai/agent/architecture/','/ai/agent/harness/','/computer-science/networking/']],
 'ai/agent/ecosystem': ['产品与框架是架构概念的具体实现，而不是平行于 Agent、Harness 和 MCP 的理论分类。', ['先掌握 Agent、Harness、MCP 和扩展机制。','再读产品分析，逐项映射其模块与生命周期。','用同一分析框架记录后续 Codex、Claude Code、Pi 等实现。'], ['/ai/agent/architecture/','/ai/agent/harness/','/ai/agent/mcp/']],
 'ai/llm': ['模型训练与能力来源，为提示词、检索增强和 Agent 工程提供背景。', ['数据准备 → 预训练 → 监督微调 → 对齐训练。','区分训练改变参数与推理时构造上下文。','继续学习 Prompt 和 RAG，理解工程侧如何使用模型。'], ['/ai/prompt-engineering/','/ai/rag/']],
 'ai/prompt-engineering': ['围绕目标、上下文、约束和输出协议设计模型输入；Agent 专用扩展通过关联链接查阅。', ['先读提示词工程，识别目标、上下文和输出约束。','用现有前端面试 Prompt 示例对照不同场景。','继续看 RAG 的上下文供给和 Agent 的指令扩展。'], ['/ai/rag/','/ai/agent/extensions/']],
 'ai/rag': ['检索增强生成：将外部资料转化为可检索上下文，补足模型在知识与证据上的边界。', ['先读 RAG 基础，区分离线索引与在线检索生成。','沿数据准备 → Embedding → 检索 → 上下文 → 生成跟踪流程。','评估说明关联现有项目笔记；Rerank 独立知识文章尚待整理。'], ['/ai/llm/','/ai/prompt-engineering/','/interview/ai/']],
 'frontend/browser': ['浏览器架构、渲染、事件、存储与 Web API；不将 Canvas 或渲染模式混入 CSS/HTML 概念。', ['架构与渲染进程 → 渲染阻塞/回流重绘 → 事件循环。','再读 DOM 事件、存储与跨标签页协作。','最后查阅 Canvas、Worker、FileReader 等具体 API。'], ['/frontend/javascript/','/frontend/network/','/interview/frontend/']],
 'frontend/network': ['Web 应用的 HTTP、缓存、跨域、鉴权与流式交互。底层 TCP/DNS 和服务部署引用各自领域的唯一原文。', ['URL 生命周期 → HTTP 演进 → 缓存。','跨域与鉴权 → 安全 → 实时通信。','文件传输与服务端交互连接业务实践和后端方案。'], ['/computer-science/networking/','/engineering/architecture/','/frontend/practice/']],
 'frontend/vue': ['Vue 的 API、响应式、编译渲染、生命周期与组件协作。详解、简记及口述版均保留，主文档和补充版明确互链。', ['项目与 API → 响应式依赖追踪。','模板编译 → 渲染更新 → 生命周期。','组件通信 → KeepAlive → 路由状态，最后到业务实践验证。'], ['/frontend/javascript/','/frontend/practice/','/interview/frontend/']],
 'frontend/practice': ['从组件封装、列表加载和权限路由，到上传、流式响应和交互动效的实际实现。', ['先选业务场景，再查语言、浏览器或 Vue 原理。','流式体验沿异步数据流 → SSE → 前端渲染 → 打字机体验逐层定位。','性能问题回到性能专题，服务侧方案回到工程架构。'], ['/frontend/performance/','/frontend/network/','/engineering/architecture/']],
 'engineering/architecture': ['架构设计、服务通信、数据选型与一致性。会话管理、流式处理、原子扣费在同一系统设计主线上。', ['渲染策略/BFF → 服务通信与部署。','异步流 → Map/Redis 会话存储 → 数据库选择。','原子扣费 → 幂等与失败恢复，结合面试追问验证方案边界。'], ['/engineering/nodejs/','/engineering/backend-frameworks/','/interview/system-design/']],
 'engineering/nodejs': ['Node.js 运行时的事件循环与模块加载。语言模块语义和框架功能各有独立专题。', ['先读事件循环，理解异步任务的调度。','再读模块系统，区分环境识别与模块语义。','最后用服务端框架和异步流处理检验运行时知识。'], ['/frontend/javascript/','/engineering/backend-frameworks/','/engineering/architecture/']],
 'engineering/toolchain': ['工程结构、构建流程、包管理、代码质量和团队协作；语言模块语义不在这里重复维护。', ['工程化理念与 Monorepo → Webpack/Vite/Babel 构建。','包管理 → Lint/格式化 → 单测与 CI/CD。','结合团队协作和技术文档把个人代码变成可持续交付。'], ['/frontend/javascript/','/engineering/practice/','/tools/git/']],
 'computer-science/algorithms': ['数据结构与算法的学习导航。现有内容以面试练习清单和代码片段为主，基础文章待逐步沉淀，不复制进度记录。', ['数组与字符串、链表、栈队列、哈希表。','树与图、排序、动态规划按依赖推进。','题目与刷题进度统一在算法面试中维护。'], ['/interview/algorithms/','/frontend/javascript/']],
};
const names = Object.fromEntries(tree.map(c => [c.link, c.text]));
all.forEach(n => { if (n.indexLink) names[n.indexLink] = n.text; });
for (const c of tree) {
 const guide = guides[c.id]; c.description = guide[0]; c.learningPath = guide[1]; c.related = guide[2].map(link => ({text:names[link] ?? link,link}));
 const walk = ns => ns.forEach(n => {
  if (n.directory) {
   const g = guides[n.directory];
   n.description = g?.[0] ?? `${n.text}专题：按原理、实现和实际应用组织现有笔记。`;
   n.learningPath = g?.[1] ?? [`先按下方知识模块理解${n.text}的核心概念。`, '再结合代码、对比与场景笔记验证边界。', '遇到跨领域问题，沿关联专题回到知识主文档。'];
   n.related = (g?.[2] ?? (c.id === 'interview' ? ['/frontend/','/ai/','/engineering/'] : [c.link])).map(link => ({text:names[link] ?? link,link}));
  }
  walk(n.items ?? []);
 }); walk(c.items);
}
writeFileSync(file, JSON.stringify(tree,null,2)+'\n');
console.log('Knowledge relationships and variant ownership refined.');
