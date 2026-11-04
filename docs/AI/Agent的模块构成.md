# Agent 的模块构成

## 一、什么是 AI Agent？

AI Agent（智能体）是以**大模型**为核心，能够**理解目标、决定执行步骤、调用工具，并根据结果持续调整行动**的系统。

与主要负责生成回答的大模型相比，Agent 不仅要“回答问题”，还要围绕目标组织和执行任务，形成一个闭环：

> **理解目标 → 决定行动 → 执行操作 → 检查结果 → 继续行动或结束任务**

Agent 的自主程度取决于具体设计，并不意味着所有操作都可以脱离用户确认。

## 二、Agent 的八个主要模块

以下是按功能划分的常见模块，**并非必须拆成八个独立组件**。这里的“主要负责方”指承担功能的技术组件，而不是团队中的人员岗位；具体分工会随实现方式变化。

| 模块 | 主要作用 | 主要负责方 | 典型功能或示例 |
| --- | --- | --- | --- |
| **输入与感知** | 接收用户请求和环境信息，形成可供决策使用的输入 | **应用程序 + 模型 / 解析系统** | 读取对话、图片、文档、系统事件及工具返回结果 |
| **推理与决策** | 理解目标与约束，判断下一步应该做什么 | **主要是大模型** | 决定直接回答、检索资料、调用工具，或向用户补充询问 |
| **规划与任务管理** | 拆解复杂目标，管理步骤、依赖关系和进度 | **大模型 + 工作流 / 任务管理程序** | 将“制作行业报告”拆成检索、分析、撰写和校验 |
| **记忆与上下文管理** | 保存并组织任务状态、历史信息和用户偏好 | **主要是应用程序 + 存储系统** | 记录已完成步骤、保留关键工具结果、记住输出格式要求 |
| **工具与行动执行** | 调用外部能力，获取信息或对环境执行操作 | **工具执行器 + 外部系统** | 搜索网页、执行代码、查询数据库、编辑文件、发送邮件 |
| **反馈与校验** | 判断执行结果是否正确、是否满足目标，必要时修正 | **校验程序 + 外部系统 + 模型** | 运行测试、核对来源、检查约束、发现错误后重新执行 |
| **流程控制与运行时** | 驱动执行循环，管理任务生命周期和异常情况 | **主要是运行时 / 编排程序** | 处理超时、重试、取消、暂停，以及轮数和成本限制 |
| **安全与权限控制** | 限定操作范围，保护敏感信息，管理授权与确认 | **权限系统 + 安全策略程序 + 人工审批** | 控制工具访问权限，删除文件或付款前要求用户确认 |

### 模型与程序的分工

**大模型主要负责理解、推理和提出行动；程序负责管理状态、实际执行，以及强制落实权限和运行规则。**

| 模块 | 模型与程序的具体分工 |
| --- | --- |
| **输入与感知** | 程序接收消息、读取文件；解析器提取文本；模型理解文本或图片含义。 |
| **推理与决策** | 模型提出回答或工具调用；程序限定可用工具，并检查调用是否允许执行。 |
| **规划与任务管理** | 模型可以生成、调整计划；程序保存任务状态、安排执行顺序、管理依赖。固定流程也可以完全由程序定义。 |
| **记忆与上下文管理** | 程序负责消息历史、数据库、检索和上下文组装；模型可以辅助摘要、提取偏好，但跨任务保存这些信息依赖应用的存储机制。 |
| **工具与行动执行** | 模型选择工具并生成参数；程序校验参数、执行函数或 API，并返回结果。模型输出工具调用，不等于操作已经执行。 |
| **反馈与校验** | 测试、类型检查和业务规则由程序执行，外部系统返回实际状态；模型解释错误、检查语义、提出修正方案。模型自评不能替代可执行的检查。 |
| **流程控制与运行时** | 程序控制轮数、超时、重试、暂停和恢复；模型可以表达“完成”，但程序结合结果、校验和停止规则决定是否结束。 |
| **安全与权限控制** | 程序强制执行权限、沙箱、白名单与审批规则，人工处理需要确认的操作；模型可以辅助识别风险，但不能作为唯一的安全保障。 |

### 几组容易混淆的概念

- **决策与规划**：决策回答“下一步做什么”，规划回答“整个任务如何分步骤完成”。简单任务不一定需要显式规划。
- **上下文与长期记忆**：上下文主要服务于当前执行过程；长期记忆用于跨任务保留信息，按需引入。
- **校验与流程控制**：校验判断“结果是否合格”；流程控制决定“接下来继续、重试、暂停还是结束”。
- **模型判断与权限约束**：模型可以提出行动，但是否允许执行，应由权限机制约束，不能只依赖模型自觉。

## 三、这些模块如何协作？

```text
用户目标 / 环境事件
        ↓
   输入与感知
        ↓
   推理、规划与决策 ←── 记忆与上下文
        ↓
   调用工具 / 执行动作
        ↓
   获取结果并校验
        ↓
   是否达到目标？
    ├─ 否 → 更新状态，继续决策
    └─ 是 → 输出结果，结束任务

流程控制、安全与权限贯穿整个过程
```

一次典型的执行过程如下：

1. **接收输入**：获取用户目标、约束条件和当前环境信息。
2. **组织上下文**：整合已有状态、历史结果和相关偏好。
3. **决定行动**：判断是否需要拆解任务，以及下一步使用什么工具。
4. **检查权限并执行**：在授权范围内调用工具；需要确认的操作先暂停。
5. **观察与校验**：分析工具结果，检查正确性及目标满足情况。
6. **更新状态**：记录结果、进度、错误和待处理事项。
7. **继续或结束**：根据结果进入下一轮，或交付最终成果。

除了“目标完成”，任务也可能因为缺少信息、等待授权、达到执行限制或无法恢复的错误而暂停或结束。

## 四、示例：查找合适航班的 Agent

**用户目标：**“帮我找下周五从上海到北京的航班，预算不超过 1,000 元，不坐红眼航班。”

| 模块 | 在该任务中的表现 |
| --- | --- |
| 输入与感知 | 提取出发地、目的地、日期、预算和时段要求 |
| 推理与决策 | 判断日期是否明确、是否缺少必要信息，以及需要查询哪些数据 |
| 规划与任务管理 | 安排航班查询、条件筛选和候选方案比较 |
| 记忆与上下文管理 | 保存本次查询条件；如用户授权，可长期保留“不坐红眼航班”的偏好 |
| 工具与行动执行 | 调用航班查询接口，获取价格、时间及余票信息 |
| 反馈与校验 | 检查候选航班是否满足预算、日期和时段要求 |
| 流程控制与运行时 | 查询失败时按策略重试，无合适结果时说明情况或询问是否调整条件 |
| 安全与权限控制 | 查询与推荐在授权范围内执行；下单付款前要求用户确认 |

这里的关键不是“调用一次航班接口”，而是**围绕用户目标，完成查询、筛选、校验和结果交付的闭环**。

## 五、最小可用 Agent 与扩展能力


**最小可用的工具型 Agent，通常可以概括为：**

> **大模型 + 工具 + 状态 + 执行循环**

- **大模型**：理解目标并选择下一步行动。
- **工具**：提供信息获取和外部操作能力。
- **状态**：记录目标、约束、执行历史和当前进度。
- **执行循环**：将决策、行动、反馈和状态更新连接起来。


### 按业务需要增加的能力

随着任务复杂度提高，可以逐步增加：

- 显式规划与任务依赖管理；
- 长期记忆与知识检索；
- 更严格的结果校验；
- 暂停、恢复和人工介入机制；
- 多 Agent 协作。

## 六、最小可行 Agent 的 TypeScript 实现

下面是一个**大模型 + 工具 + 状态 + 执行循环**的最小 Agent。模型决定是否查询时间，程序执行工具，再将结果交给模型继续处理。

### agent.ts

```ts
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
  maxRetries: 1,
});

// 工具定义：告诉模型有哪些能力，以及如何传参。
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "查询指定时区的当前日期和时间。",
      parameters: {
        type: "object",
        properties: {
          timeZone: {
            type: "string",
            description: "IANA 时区，例如 Asia/Shanghai 或 Europe/London。",
          },
        },
        required: ["timeZone"],
        additionalProperties: false,
      },
    },
  },
];

// 工具执行器：实际操作由程序完成，而不是模型完成。
function executeTool(name: string, rawArguments: string): string {
  try {
    if (name !== "get_current_time") {
      throw new Error(`不支持的工具：${name}`);
    }

    const args: unknown = JSON.parse(rawArguments);

    if (
      typeof args !== "object" ||
      args === null ||
      !("timeZone" in args) ||
      typeof args.timeZone !== "string"
    ) {
      throw new Error("timeZone 必须是字符串");
    }

    const now = new Date();
    const localTime = new Intl.DateTimeFormat("zh-CN", {
      timeZone: args.timeZone,
      dateStyle: "full",
      timeStyle: "long",
    }).format(now);

    return JSON.stringify({
      timeZone: args.timeZone,
      localTime,
      utcTime: now.toISOString(),
    });
  } catch (error) {
    // 把失败反馈给模型，让它有机会调整参数。
    return JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function runAgent(goal: string): Promise<string> {
  // 状态：保存用户目标、模型消息和工具执行结果。
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "你是一个任务助手。需要当前时间时必须调用工具，不要猜测。" +
        "根据工具结果回答用户；工具失败时可以修正参数后重试。",
    },
    { role: "user", content: goal },
  ];

  // 运行时：限制执行轮数，避免无限循环。
  for (let round = 0; round < 8; round++) {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      messages,
      tools,
      tool_choice: "auto",
    });

    const message = response.choices[0]?.message;

    if (!message) {
      throw new Error("模型没有返回消息");
    }

    messages.push(message);

    // 没有工具调用：模型输出最终答案，结束循环。
    if (!message.tool_calls?.length) {
      if (!message.content) {
        throw new Error("模型没有返回答案");
      }
      return message.content;
    }

    // 有工具调用：执行工具，将结果写回状态，进入下一轮。
    for (const call of message.tool_calls) {
      if (call.type !== "function") {
        throw new Error("不支持的工具调用类型");
      }

      console.log(`[工具调用] ${call.function.name}`);

      const result = executeTool(
        call.function.name,
        call.function.arguments,
      );

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  throw new Error("达到最大执行轮数，任务尚未完成");
}

const goal = process.argv.slice(2).join(" ") || "现在北京时间几点？";

runAgent(goal)
  .then((answer) => console.log(answer))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
```

### 安装和运行

将上面的代码保存为 `agent.ts`，在本地 Node.js 环境中安装依赖并运行：

```bash
npm install openai
npm install -D tsx typescript @types/node

export OPENAI_API_KEY="你的 API Key"

npx tsx agent.ts "分别查询北京和伦敦的当前时间"
```

示例默认使用 `gpt-4.1-mini`。如需使用其他支持工具调用的模型，可以通过 `OPENAI_MODEL` 环境变量指定模型名称。

### 执行闭环

```text
用户目标
   ↓
模型决定调用工具
   ↓
程序校验参数并查询时间
   ↓
工具结果写入 messages
   ↓
模型根据结果继续决策
   ↓
最终答案
```

模型也可以不调用工具而直接回答，例如用户询问一个不需要当前时间的问题；工具执行失败时，错误结果会回填给模型，由模型决定是否修正参数再尝试。

### 代码与模块的对应关系

| 代码或配置 | 对应模块 | 作用 |
| --- | --- | --- |
| `process.argv` 与用户消息 | 输入与感知 | 接收命令行中的用户目标，并放入模型上下文 |
| `client.chat.completions.create()` | 推理与决策 | 调用模型，决定返回答案还是提出工具调用 |
| `messages` | 记忆与上下文管理 | 保存当前任务的用户目标、模型消息和工具结果 |
| `tools` 与 `executeTool()` | 工具与行动执行 | 声明工具能力，并由程序执行实际查询 |
| 参数检查与错误结果回填 | 反馈与校验 | 检查参数，向模型反馈工具执行成功或失败 |
| `for` 循环、`timeout` 与 `maxRetries` | 流程控制与运行时 | 控制执行轮数、模型请求超时和请求重试 |
| 工具名称检查 | 安全与权限控制的基础边界 | 只允许执行已实现的时间查询工具，不提供任意执行能力 |

`messages` 是当前任务的短期状态。这个最小实现没有长期记忆，也没有独立的规划模块或完整的权限系统。其执行结构属于简化的 **ReAct 风格循环**：根据上下文决策，执行行动，观察结果，再次决策。

模型之外的工具执行、状态管理和循环控制，也可以从 [Harness 的模块构成](./Harness的模块构成.md)的角度理解。

