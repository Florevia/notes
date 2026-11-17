---
title: "流式响应"
description: "流式响应：语言基础、浏览器、网络、Vue 与前端业务实践"
tags: ["前端开发"]
docType: "concept"
knowledgeTopic: "/frontend/practice/"
migrationSource: "interview/业务场景/流式响应.md"
---

# 流式响应实现

流式响应（Streaming Response）允许服务器分块发送数据，客户端逐步接收并渲染，常用于 AI 对话、大文件下载等场景。

## 实现方式

### 1. Server-Sent Events (SSE)

- 基于 HTTP，单向通信（Server -> Client）。
- `Content-Type: text/event-stream`.
- 客户端使用 `EventSource` API。

```javascript
const evtSource = new EventSource("/api/stream");
evtSource.onmessage = (event) => {
  console.log(event.data);
};
```

### 2. Fetch API with ReadableStream

- 更灵活，支持 POST 请求。
- 处理 `response.body` (ReadableStream)。

```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({ prompt }),
});
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  console.log(text);
  // 更新 UI
}
```

## 后端支持

- Node.js: `res.write()`, `res.flush()`.
- Python (FastAPI): `StreamingResponse`.
