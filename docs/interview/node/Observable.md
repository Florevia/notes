# Observable VS Promise

## 一句话定义

- Promise 是对"未来某个单一值"的承诺（一锤子买卖）
- Observable 是对"未来一系列值"的观察（源源不断的流水线）

## 对比

| 特征     | Promise                                                       | Observable (RxJS)                                                   |
| -------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| 数据量   | 单值：只能返回一个值或一个错误                                | 多值：可以随着时间推移返回无数个值（流）                            |
| 执行时机 | 激进 (Eager)：创建即立即执行，无法阻止                        | 惰性 (Lazy)：只有当有人订阅 (subscribe) 时才开始执行                |
| 取消能力 | 困难：原生 Promise 一旦启动很难取消（需借助 AbortController） | 简单：原生支持取消订阅 (unsubscribe)，立即停止数据流                |
| 数据处理 | 弱：主要靠 .then() 链式调用                                   | 强：拥有强大的操作符（map, filter, retry, debounce 等）处理复杂逻辑 |
| 性质     | 异步操作的"容器"                                              | 随时间变化的"事件流"                                                |

1. **`Promise`：适用于“批处理”与“工具调用”**

- 在 `LangChain` 的 `Runnable` 协议中，`invoke` 方法返回的就是一个 `Promise`。
- 适用场景：
    - RAG 检索阶段：向量数据库的查询通常是一次性的，不需要流式。
    - Tool Calling（工具调用）：比如让 Agent 查天气、算数学，我们需要等工具完全执行完拿到最终 JSON 结果，才能喂回给 LLM。
    - 后台批处理：每天凌晨跑一遍“日报摘要生成”，不需要实时反馈给用户。 
- 代码：

    ```js
    // 典型的 Promise 用法
    const result = await chain.invoke({ question: "今天是几号？" });
    console.log(result); // 等待数秒，一次性打印结果
    ```

2. **`Observable`：适用于“流式响应”与“复杂事件流控制”**
- 适用场景：
    - 打字机效果：将 LLM 的 `stream` 转换为数据流，实时推送到 UI。
    - 竞态处理：用户手速快，连续点了三次“生成”，使用 `Observable` 的 `switchMap` 可以自动取消前两次请求，只保留最后一次，防止回答错乱。
    - 错误重试与降级：网络抖动导致连接断开，`Observable` 的 `retry(3)` 比写 `Promise` 的 `for` 循环重试要优雅得多。
- 代码：
```js
import { Observable } from 'rxjs';
import { scan, takeUntil } from 'rxjs/operators';
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ streaming: true });

// 封装函数：把 LangChain 的 Stream 变成 Observable
// 函数名以 $ 结尾是 RxJS 的命名惯例，表示"返回的是一个 Observable 流"
// prompt：发给 AI 的提示词
// abortSignal：用于从外部中止 HTTP 请求的信号
function streamResponse$(prompt: string, abortSignal: AbortSignal) {
    // new Observable 接收一个回调函数，参数 subscriber 是"订阅者"对象，可以通过它向外推送数据
  return new Observable<string>((subscriber) => {
    // 核心逻辑：在一个 async 函数中处理生成器
    // Observable 的构造回调不支持 async，所以用一个自执行的 async 箭头函数包裹，内部就可以用 await 了。
    (async () => {
      try {
        const stream = await model.stream(prompt, { signal: abortSignal });
        for await (const chunk of stream) {
          // chunk.content 是当前的 token
          // 只有在 .subscribe() 时才会执行——这就是 Observable 的惰性特性
          // 推送一个值
          subscriber.next(chunk.content as string);
        }
        // 通知流结束
        subscriber.complete();
      } catch (err) {
        // 通知发生错误
        subscriber.error(err);
      }
    })();
  });
}

// 实际使用：模拟用户点击
const cancel$ = new Subject(); // 用于发出取消信号

streamResponse$("讲个鬼故事", new AbortController().signal)
  .pipe(
    // scan 操作符：把 "我", "是", "谁" 拼成 "我", "我是", "我是谁"
    scan((acc, curr) => acc + curr, ""),
    // 监听 cancel$，一旦它发出任何值，整条流立即停止
    takeUntil(cancel$) 
  )
  // 订阅：消费数据
  .subscribe({
    next: (fullText) => console.log("UI渲染:", fullText),
    error: (err) => console.error("出错:", err),
    complete: () => console.log("生成完毕")
  });
```

## 面试题

1. 在开发类似 ChatGPT 的应用时，为什么我们常说 `Promise` 是“拉（Pull）”模式，而 `Observable` 是“推（Push）”模式？这对 LLM 的交互有什么影响？

- `Promise (Pull)`：本质上是调用者发起请求，然后被动等待结果。就像我请求数据，数据准备好了给我。在 LLM 场景下，这意味着用户必须面对长时间的“白屏”或 Loading 动画，直到整个回复生成完毕。这对长文本生成体验极差。

- `Observable (Push)`：本质上是数据生产者掌握主动权，一旦有新数据（Token），就立即推送给订阅者。

>影响：Observable 完美契合 LLM 的 Streaming 机制。它允许我们建立一个管道，只要 AI 想到一个词就推送到前端，极大地降低了用户的感知延迟（TTFT - Time To First Token）。

2. `LangChain.js` 的 `.stream()` 方法返回的是 `AsyncIterator`。如果不引入 `RxJS`，你如何手动实现一个“用户点击停止生成”的功能？如果引入 `RxJS (Observable)`，实现逻辑又有何不同？

- 原生 `Promise/AsyncIterator` 方案：
必须依赖 `AbortController`。我们需要在调用 `chain.stream(input, { signal: controller.signal })` 时传入 `signal`。当用户点击停止时，调用 `controller.abort()`。这会抛出一个 `AbortError`，我们需要在 `try...catch` 块中捕获这个特定的错误，以避免程序崩溃。

```js
let controller = null; // ❌ 必须依赖外部变量

// 【开始】
async function handleStart() {
  controller = new AbortController(); // 1. 手动创建
  try {
    // 2. 手动传入 signal
    const stream = await chain.stream(input, { signal: controller.signal });
    
    for await (const chunk of stream) {
      console.log(chunk);
    }
  } catch (err) {
    // 3. 手动捕获特定错误，防止程序崩溃
    if (err.name === 'AbortError') {
      console.log('用户已停止'); 
    } else {
      throw err; // 抛出真实错误
    }
  }
}

// 【停止】
function handleStop() {
  if (controller) controller.abort(); // 4. 手动触发
}
```


- `RxJS Observable` 方案：
逻辑更解耦。我们将流封装在 `Observable` 中。当用户点击停止时，我们只需要调用订阅对象的 `.unsubscribe()` 方法，或者在 `Pipe` 中使用 `takeUntil(stopClick$)` 操作符。

```js
import { Observable, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// 1. 封装（一次性脏活）：将流封装为 Observable
const stream$ = new Observable(subscriber => {
    // AbortController 是浏览器和 Node.js 都内置的原生 API，用于取消异步操作（如 fetch 请求、流式调用等）
  const controller = new AbortController(); // 内部封装
  
  // 启动流逻辑...
  (async () => {
     try {
       const stream = await chain.stream(input, { signal: controller.signal });
       for await (const chunk of stream) {
         if (subscriber.closed) break; // 双重保险
         subscriber.next(chunk);
       }
       subscriber.complete();
     } catch (err) { 
       if (err.name !== 'AbortError') subscriber.error(err); 
     }
  })();

  // ✅ 核心解耦点：返回清理逻辑（Teardown Logic）
  // 当外部调用 unsubscribe 或 takeUntil 时，自动触发这里
  return () => controller.abort();
});

// 2. 业务使用（极其清爽）
const stop$ = fromEvent(stopButton, 'click'); // 定义停止信号

stream$
  .pipe(takeUntil(stop$)) // ✅ 声明式：一直运行，直到点击停止
  .subscribe({
    next: val => console.log(val),
    complete: () => console.log('结束（可能是完成了，也可能是被切断了）')
  });
  ```

>核心区别：RxJS 的方案是声明式的（Declarative），我们定义“直到点击停止前一直接收数据”；而原生方案是命令式的（Imperative），我们需要手动触发中止并处理副作用。

3. 假设你的 `Agent` 需要连续调用 3 个工具（搜索 -> 总结 -> 翻译），其中“搜索”工具经常超时。请设计一个基于 `Promise` 或 `Observable` 的策略来优化这个流程。

>这道题考察的是错误处理与流程编排。

- 使用 `Observable` 结合 `LangChain`。
- 原因：Promise 的链式调用处理重试（Retry）非常麻烦，通常需要写递归或引入额外的重试库。
Observable 方案：
可以使用 retry({ count: 3, delay: 1000 }) 操作符。如果“搜索”步骤抛出错误，RxJS 会自动重新订阅该流（即重新执行搜索），尝试 3 次，每次间隔 1 秒。
此外，如果这三个步骤是串行的，可以使用 concatMap；如果是并行的（比如同时搜索 Google 和 Bing），可以使用 forkJoin 或 zip，这比 Promise.all 提供了更细粒度的控制（比如：一个失败了，是否取消另一个？）。

```js
import { from, defer, timer } from 'rxjs';
import { retry, concatMap, map } from 'rxjs/operators';

// 模拟工具函数（返回 Promise）
const search = (q) => Promise.reject("搜索超时"); // 假设一直失败
const summarize = (text) => Promise.resolve(`总结: ${text}`);
const translate = (text) => Promise.resolve(`翻译: ${text}`);

// 【核心流定义】
// defer: 关键点！确保每次重试都重新执行 Promise，而不是只重试结果
const flow$ = defer(() => search("AI新闻")).pipe(
  // 1. 搜索步：自动重试 3 次，每次延迟 1 秒
  retry({ count: 3, delay: 1000 }), 
  
  // 2. 总结步：拿到搜索结果后，串行调用总结
  concatMap(result => summarize(result)),
  
  // 3. 翻译步：拿到总结后，串行调用翻译
  concatMap(summary => translate(summary))
);

// 【执行】
flow$.subscribe({
  next: finalResult => console.log("最终结果:", finalResult),
  error: err => console.error("搜索彻底失败，已重试3次:", err)
});
```