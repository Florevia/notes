| 比较维度 | 普通前端开发工程师 | AI前端开发工程师 |
|---------|-------------------|-----------------|
| 核心交互范式 | 基于点击、滑动等确定性的 GUI（图形用户界面）交互逻辑。 | 基于自然语言对话（LUI）和意图识别，容忍非确定性输出。 |
| 通信机制与架构 | 主要使用 RESTful API 或 GraphQL 处理结构化且一次性返回的数据。 | 大量使用 Server-Sent Events (SSE) 或 WebSocket 处理流式传输（Streaming）的数据，以实现打字机效果。 |
| 技术栈延伸 | 专注于 React/Vue、CSS、状态管理。 | 需要了解 Prompt Engineering、LangChain/LlamaIndex 等 AI 框架基础、RAG 原理，甚至本地部署 WebLLM。 |
| 性能关注点 | 首屏时间（FCP）、可交互时间（TTI）、动画帧率（FPS）。 | 首字响应时间（TTFT）、大模型上下文长度管理、流式渲染过程中的 Markdown/LaTeX 实时解析性能。 |