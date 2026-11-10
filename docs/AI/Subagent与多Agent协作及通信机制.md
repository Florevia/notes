# Subagent 与多 Agent 协作及通信机制

## 一、核心概念

**Subagent（子代理）和多 Agent 协作，是把任务拆成多个拥有独立上下文、明确职责和相应执行能力的单元，再通过协调机制组合结果。**

它不是简单地多开几个聊天窗口，也不是让一个模型在同一段回答中扮演多个角色。真正重要的是：

> **任务怎么拆、信息怎么传、权限怎么分、结果怎么验收。**

### 1. Agent 是什么？

可以把 Agent 理解为：

> **语言模型 + 任务目标 + 上下文与状态 + 工具或行动能力 + 持续执行的控制循环。**

因此，一个 Agent 完成任务，可能涉及多次模型调用和工具调用，而不是只生成一次回答。


### 2. Subagent：强调上下级委派

```text
用户
  ↓
主 Agent
  ├── 子 Agent A：调查前端
  ├── 子 Agent B：调查后端
  └── 子 Agent C：检查测试
  ↓
主 Agent 整合、验收并交付
```

主 Agent 负责理解目标、拆分任务、传递背景、检查结果、解决冲突和最终交付。子 Agent 负责边界明确的子任务。

典型委派：

> 查找项目中所有刷新令牌的实现位置。只读，不修改代码。返回关键文件、函数、调用关系和未确认的问题。

### 3. 多 Agent：强调多个执行单元协作

```text
编写 Agent ↔ 审查 Agent ↔ 测试 Agent
                   ↕
                协调程序
```

多 Agent 不一定有固定的主从关系，也可以由普通程序负责调度：

```text
工作流程序
  ├── 调用研究 Agent
  ├── 调用实现 Agent
  └── 调用审查 Agent
```

**Subagent 模式可以视为多 Agent 协作的一种形式，但多 Agent 不一定采用主 Agent 带子 Agent 的结构。** 各产品术语不完全一致，应看实际运行机制。

## 二、启动子 Agent 时，系统做了什么？

### 1. 创建新的执行上下文

系统通常为子 Agent 准备：

- 角色和操作规范；
- 具体任务；
- 必要背景；
- 可用工具和权限；
- 执行限制；
- 返回结果的要求。

例如：

```text
角色：代码搜索助手

任务：定位订单重复提交可能发生的位置。

背景：项目使用 React 和 Node.js，问题出现在快速双击提交时。

范围：检查订单提交相关文件。

约束：只读，不修改文件，不安装依赖。

返回：
1. 相关文件和函数
2. 请求调用链
3. 可疑原因
4. 支持判断的代码位置
5. 尚未确认的部分
```

子 Agent 可以使用相同模型，也可以使用不同模型。**启动子 Agent 不等于训练新模型，也不必然等于启动独立操作系统进程**，它首先是独立的逻辑执行实例。

### 2. 独立执行与结果回传

```text
接收任务 → 搜索文件 → 读取代码 → 整理结论 → 返回结果
```

主 Agent 可以等待，也可以同时处理另一项工作。

子 Agent 通常返回总结、结构化结果、文件引用、代码修改或测试证据，不会自动把全部执行历史同步到主 Agent。

### 3. 主 Agent 整合和验收

需要检查：

- 是否回答了委派问题；
- 结论是否有证据；
- 是否与其他结果矛盾；
- 修改是否符合整体方案；
- 是否需要进一步验证。

**子 Agent 返回“完成”，不等于最终任务已经完成。**

## 三、共享与隔离：上下文、文件和权限是三件事

### 1. 对话上下文

子 Agent 不一定能看到主 Agent 的全部聊天记录。初始化方式可能是：

- 只接收任务说明；
- 接收筛选后的背景；
- 从父上下文快照开始；
- 读取共享记忆中的相关内容。

即使从相同背景开始，后续也通常独立发展：

```text
共同背景
  ├── A 的后续观察、消息和工具结果
  └── B 的后续观察、消息和工具结果
```

A 后来读到某文件，不代表 B 自动知道其中内容。

### 2. 文件和外部环境

**共享工作目录：**

```text
Agent A ─┐
         ├── 同一个代码仓库
Agent B ─┘
```

交接方便，但可能同时修改文件、覆盖结果，或在测试期间相互干扰。

**隔离目录或 Git worktree：**

```text
Agent A → 工作目录 A
Agent B → 工作目录 B
              ↓
         最后统一合并
```

修改较易隔离，但有合并和集成成本。即使目录隔离，也可能仍然共享数据库、端口和远程服务。

> **上下文隔离不等于文件隔离，文件隔离也不等于外部资源隔离。**

### 3. 权限

- 提示词写“不要修改文件”：行为约束；
- 工具层面不提供写入能力：权限约束。

后者才是更可靠的技术边界。权限需要程序落实，不能只靠角色名称或模型自觉。

## 四、常见协作模式

### 1. 主 Agent 委派专项任务

```text
主 Agent
  ├── 搜索 Agent
  ├── 文档 Agent
  └── 审查 Agent
```

适合范围大的调查、明确的专项工作和上下文管理。搜索 Agent 可以只返回结论及证据位置，让主 Agent 不必阅读大量无关内容。

主要价值是分工和控制上下文，不一定是并行提速。

### 2. 并行拆分后汇总：Fan-out / Fan-in

```text
             ┌── A：前端分析
任务拆分 ────┼── B：后端分析
             └── C：数据库分析
                        ↓
                     统一汇总
```

适合可独立开始的子任务。若 B 必须等待 A 确定接口，就不能完全并行。

**能否并行取决于依赖关系，而不是任务名称不同。**

### 3. 流水线交接

```text
研究 → 方案 → 实现 → 测试 → 交付
```

适合阶段明确、交付物可定义的任务，但上游误解可能逐层传播。每个交接点应有验收条件，而不是只要求“继续下一步”。

### 4. 实现者与审查者

```text
实现 → 独立审查 → 问题列表 → 修复 → 再验证
```

收益来自独立检查视角。但同模型、同资料、相似提示可能产生相关错误。多个 Agent 都认可，不等于获得多个独立证据。

实际代码、测试和可追溯证据比相互认可更重要。

### 5. 竞争方案与裁决

```text
A → 方案 A
B → 方案 B
C → 方案 C
       ↓
按明确标准比较与选择
```

适合架构选型、缓存设计和故障假设等。裁决应根据正确性、成本、复杂度、性能、兼容性和验证结果，而不是谁写得更有说服力。

### 6. 动态交接与网络式协作

```text
接待 Agent
  ├── 技术问题 → 技术 Agent
  ├── 财务问题 → 财务 Agent
  └── 合同问题 → 合同 Agent
```

- **委派**：协调者仍负责整体任务，子任务完成后返回。
- **交接（Handoff）**：后续处理权转移到另一个 Agent。

自由互相委派的网络需要避免重复劳动、责任不清、循环等待和无休止讨论。复杂不等于有效。

## 五、收益、成本与适用条件

### 1. 主要收益

- **并行缩短等待**：独立任务可同时执行。
- **减少主上下文负担**：原始资料由专项 Agent 处理，主 Agent 保留关键结论。
- **按任务配置能力**：搜索只读、开发可编辑、审查侧重验证。
- **局部重试**：保存阶段产物后，只重试失败部分。

假设独立任务耗时分别为 4、5、3 分钟：

```text
顺序时间 ≈ 4 + 5 + 3 = 12 分钟
并行时间 ≈ max(4, 5, 3) + 协调与汇总时间
```

实际还受并发额度、工具资源、失败重试等影响。墙钟时间减少，不代表总模型消耗减少。

### 2. 常见成本与失败原因

- 每个 Agent 重复理解背景、重复读取文件；
- 摘要和交接丢失条件；
- 共享文件修改冲突；
- 各模块局部正确，但接口不一致；
- 审查者只评价总结，没有检查实际产物；
- 没有结束条件，反复讨论或优化。

停止条件应明确，例如指定测试通过、验收项满足，或达到约定预算后报告未完成内容。

### 3. 适用判断

| 任务情况 | 通常更合适的方式 |
| --- | --- |
| 修复明确的小问题 | 单 Agent |
| 修改同一核心函数、逻辑高度耦合 | 单 Agent 或顺序分工 |
| 调查多个独立模块 | 并行子 Agent |
| 大范围搜索，只需结论 | 专项搜索子 Agent |
| 对关键代码做独立检查 | 实现者 + 审查者 |
| 有固定阶段和验收要求 | 工作流式组织 |
| 对比多个合理设计 | 独立方案 + 统一裁决 |
| 需求和边界不清楚 | 先澄清，不急于增加 Agent |

判断时问：子任务能否独立开始？交付物能否说清楚？整合成本是否低于分工收益？

## 六、Agent 之间到底怎样通信？

**通信不是共享大脑，而是程序显式传递消息、任务、结果或共享资源引用。** 底层往往是字符串、JSON 或文件引用。

- 主 Agent / Subagent：常见为“委派任务—执行—返回结果”，类似函数调用或 RPC。
- 多 Agent：常见为消息路由、邮箱、发布订阅或共享任务板。

只有显式发送、读取或注入上下文的信息，其他 Agent 才能获得。

### 1. 通信内容

| 类型 | 示例 | 作用 |
| --- | --- | --- |
| 任务 | 检查订单接口的幂等设计 | 告诉接收方做什么 |
| 背景 | 需求、约束、代码 | 提供完成任务所需的输入 |
| 结果 | 结论、代码、测试报告 | 交付工作产物 |
| 控制信息 | ID、超时、错误、取消 | 管理执行生命周期 |

请求消息：

```json
{
  "id": "msg-001",
  "sender": "coordinator",
  "recipient": "backend-reviewer",
  "kind": "request",
  "task_id": "task-101",
  "payload": {
    "task": "检查订单接口的幂等设计",
    "context": {
      "endpoint": "POST /orders",
      "requirement": "同一幂等键不得创建重复订单"
    },
    "constraints": ["只分析，不修改代码"]
  }
}
```

响应消息：

```json
{
  "id": "msg-002",
  "sender": "backend-reviewer",
  "recipient": "coordinator",
  "kind": "response",
  "reply_to": "msg-001",
  "task_id": "task-101",
  "payload": {
    "findings": [
      "需要数据库唯一约束",
      "需要明确幂等键与请求内容不一致时的行为"
    ]
  }
}
```

- `id`：当前消息的唯一标识。
- `sender` / `recipient`：发送方和接收方。
- `kind`：请求、响应、事件、错误等。
- `reply_to`：对应哪一条请求。
- `task_id`：属于哪个业务任务。
- `payload`：业务内容。

**外层负责通信管理，payload 负责业务内容。**

### 2. 三层结构

```text
传输层：把消息送到对方。
协议层：定义消息类型、任务 ID、回复关系等。
上下文层：决定哪些消息和资料真正进入模型输入。
```

消息送达不代表模型已经处理。可能出现：消息没进入上下文、背景不完整、版本过期，或结果返回后没有正确使用。

接收者的模型输入通常是：

```text
接收者的系统指令
+ 接收者自己的相关历史
+ 发送方发来的任务或结果
```

而不是双方全部历史自动合并。**通信正确和协作正确，需要分别验证。**

## 七、Subagent 通信：请求—响应与后台任务

### 1. 函数式委派

```python
result = await subagent.run(task)
```

函数参数传任务，返回值传结果。子 Agent 内部可以包含多轮工具执行，不必是一次模型调用。

### 2. 并行委派

```python
a, b = await asyncio.gather(
    agent_a.run(task_a),
    agent_b.run(task_b),
)
```

协调者等待结果汇合。并行的是不同执行实例，不是自动共享上下文。

### 3. 后台执行

```text
启动请求 → 返回任务句柄 / task_id
后台执行 → 产生完成事件
主 Agent → 收到事件后继续
```

区分三个 ID：

- Agent ID：一个执行实例或会话；
- Task ID：一项工作；
- Message ID：一次通信。

同一 Agent 可以先后处理多个任务，同一任务可以包含多条消息。

主 Agent 可能得到最终文本、JSON、文件路径、diff、日志摘要和错误，但不一定得到子 Agent 的完整对话或全部工具输出。

## 八、多 Agent 的五种通信机制

### 1. 直接调用 / RPC

```text
A → 调用 B → 等待结果
```

本地是函数调用，跨进程可以是 HTTP、gRPC。适合明确的一对一任务，两种协作模式都可以采用。

### 2. 消息队列 / Actor 邮箱

```text
A → B 的邮箱 → B 处理 → 返回响应
```

每个 Agent 有自己的收件队列。优点是发送和处理解耦、支持排队和限流；需要管理请求关联、超时、错误、重复投递和积压。

后面的代码示例采用这种机制。

### 3. 发布订阅

```text
编写者发布 draft.created
              ↓
           订阅系统
           /      \
        审查者    测试者
```

```json
{
  "topic": "draft.created",
  "payload": {
    "artifact_id": "draft-v3",
    "path": "artifacts/draft-v3.md"
  }
}
```

需要区分广播订阅和消费者组：广播可让多个订阅者各自收到；消费者组通常由组内一个消费者处理。具体语义取决于中间件。

### 4. 共享任务板 / Blackboard

```json
{
  "task_id": "task-101",
  "version": 4,
  "draft_path": "artifacts/draft-v4.md",
  "review_status": "pending",
  "test_status": "running"
}
```

A 写状态、B 读状态，也是一种通信。需要版本控制和并发更新规则，避免 B 审查旧稿，而 A 把审查意见应用到新稿。

### 5. Handoff

```text
接待 Agent → 用户问题、必要背景、当前状态 → 技术 Agent
                                               ↓
                                        接管后续处理
```

Handoff 改变后续责任归属，普通委派则通常返回原协调者。实现可以是路由切换、状态迁移或返回交接指令。

## 九、代码示例：运行环境与公共模型接口

下面用三个文件展示两种通信方式：

```text
agent_core.py       # 真实模型调用与独立上下文
hierarchical.py     # 主 Agent 委派两个子 Agent
message_bus.py      # 多 Agent 通过邮箱通信
```

要求：Python 3.11+，只使用标准库，调用 OpenAI 兼容的 Chat Completions 接口。

**示例中的 Agent 是最小模型驱动执行单元，重点展示通信，不包含搜索、编辑等工具循环。** 完整工具型 Agent 可以在内部扩展执行循环，外面的通信接口不必改变。

任务分解和调用关系由 Python 程序固定定义；更自主的系统可以让模型先提出委派计划，再由程序校验和执行。

### 1. agent_core.py

```python
import asyncio
import json
import os
import urllib.error
import urllib.request


def call_model(messages: list[dict[str, str]]) -> str:
    """调用 OpenAI 兼容的 Chat Completions 接口。"""
    endpoint = os.getenv(
        "LLM_ENDPOINT",
        "https://api.openai.com/v1/chat/completions",
    )

    body = {
        "model": os.environ["LLM_MODEL"],
        "messages": messages,
    }

    request = urllib.request.Request(
        endpoint,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {os.environ['LLM_API_KEY']}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"模型接口返回 HTTP {exc.code}: {detail[:500]}"
        ) from exc

    content = data["choices"][0]["message"]["content"]

    if not isinstance(content, str):
        raise RuntimeError("模型没有返回文本内容")

    return content


class Agent:
    def __init__(self, name: str, instruction: str):
        self.name = name
        self.history = [
            {"role": "system", "content": instruction}
        ]
        # 避免同一实例的多轮上下文被并发调用打乱。
        self._lock = asyncio.Lock()

    async def ask(self, text: str) -> str:
        async with self._lock:
            user_message = {"role": "user", "content": text}
            messages = self.history + [user_message]

            # HTTP 调用在线程中执行，不阻塞事件循环。
            answer = await asyncio.to_thread(call_model, messages)

            # 仅在成功后保存这一轮。
            self.history.extend([
                user_message,
                {"role": "assistant", "content": answer},
            ])

            return answer
```

`writer.history` 和 `reviewer.history` 是独立历史。只有显式调用：

```python
await reviewer.ask(writer_result)
```

编写者的结果才进入审查者上下文。锁保护单次对话轮次，不等于隔离不同业务任务；长时间运行的服务还应按会话或任务组织历史。

### 2. 配置与运行

把后面的两个示例分别保存为对应文件，与 `agent_core.py` 放在同一目录，然后运行：

```bash
export LLM_API_KEY="你的密钥"
export LLM_MODEL="你的模型名称"

# 使用其他兼容服务时，设置完整接口地址。
export LLM_ENDPOINT="https://你的服务地址/v1/chat/completions"

python hierarchical.py
python message_bus.py
```

模型服务必须支持这里使用的 Chat Completions 文本接口格式；支持其他 API 不代表自动兼容。执行会产生实际模型调用和对应费用。

## 十、代码示例一：主 Agent 与 Subagent

### hierarchical.py

```python
import asyncio
import json

from agent_core import Agent


async def main():
    coordinator = Agent(
        "coordinator",
        "你负责整合设计建议。明确区分建议和已验证事实，"
        "不要声称执行过代码或测试。",
    )

    frontend = Agent(
        "frontend-specialist",
        "你是前端设计分析助手。只从前端交互、重复点击、"
        "请求重试和错误提示角度提出建议。",
    )

    backend = Agent(
        "backend-specialist",
        "你是后端设计分析助手。只从幂等键、数据库约束、"
        "事务、并发和失败恢复角度提出建议。",
    )

    task = (
        "设计一个订单提交方案："
        "用户快速双击或客户端重试时，不得创建重复订单。"
        "当前阶段只设计，不实现代码。"
    )

    frontend_result, backend_result = await asyncio.gather(
        frontend.ask(task),
        backend.ask(task),
    )

    received_results = {
        "task": task,
        "frontend_result": frontend_result,
        "backend_result": backend_result,
    }

    final = await coordinator.ask(
        "根据以下子任务结果形成统一方案，"
        "指出冲突、接口约定和验收条件：\n"
        + json.dumps(received_results, ensure_ascii=False)
    )

    print(final)


if __name__ == "__main__":
    asyncio.run(main())
```

### 通信路径

```text
协调程序
  ├── task → 前端 Agent
  └── task → 后端 Agent
                  ↓
           返回两个字符串
                  ↓
     显式组装 received_results
                  ↓
              主 Agent
```

函数参数和返回值就是通信通道，不必引入消息中间件。程序负责调度，模型负责分析和整合。

## 十一、代码示例二：邮箱式多 Agent 通信

### 协作关系

```text
客户端 → 编写者
            ├── 审查请求 → 正确性审查者
            └── 审查请求 → 边界审查者
                              ↓
                         返回审查结果
                              ↓
                     编写者修订并返回
```

编写者通过总线直接请求审查者，不需要客户端转发。但这仍有明确的任务发起方，不意味着完全去中心化。

### message_bus.py

```python
import asyncio
import json
import uuid
from dataclasses import dataclass
from typing import Awaitable, Callable

from agent_core import Agent


@dataclass
class Message:
    id: str
    sender: str
    recipient: str
    kind: str
    payload: dict
    reply_to: str | None = None


class Bus:
    def __init__(self):
        self.mailboxes: dict[str, asyncio.Queue[Message]] = {}
        # 请求 ID -> (等待结果的 Future, 请求方, 响应方)
        self.pending: dict[
            str, tuple[asyncio.Future, str, str]
        ] = {}

    def register(self, name: str):
        if name in self.mailboxes:
            raise ValueError(f"Agent 已注册：{name}")
        self.mailboxes[name] = asyncio.Queue()

    async def send(self, message: Message):
        # 用 JSON 复制业务内容，避免本地通信意外共享可变对象。
        # 也明确要求 payload 使用可序列化的数据类型。
        message = Message(
            id=message.id,
            sender=message.sender,
            recipient=message.recipient,
            kind=message.kind,
            payload=json.loads(json.dumps(message.payload)),
            reply_to=message.reply_to,
        )

        if message.kind in {"response", "error"}:
            waiting = self.pending.get(message.reply_to)
            # 已超时或没有对应请求的响应不再交付。
            if waiting is None:
                return

            future, requester, responder = waiting
            if (
                message.sender != responder
                or message.recipient != requester
            ):
                raise ValueError("响应发送方或接收方不匹配")

            if future.done():
                return

            if message.kind == "error":
                future.set_exception(
                    RuntimeError(message.payload["error"])
                )
            else:
                future.set_result(message.payload)
            return

        if message.kind != "request":
            raise ValueError(f"未知消息类型：{message.kind}")

        if message.recipient not in self.mailboxes:
            raise ValueError(
                f"接收方不存在：{message.recipient}"
            )

        await self.mailboxes[message.recipient].put(message)

    async def request(
        self,
        sender: str,
        recipient: str,
        payload: dict,
        timeout: float = 120,
    ) -> dict:
        request_id = uuid.uuid4().hex
        future = asyncio.get_running_loop().create_future()
        self.pending[request_id] = (
            future,
            sender,
            recipient,
        )

        try:
            await self.send(Message(
                id=request_id,
                sender=sender,
                recipient=recipient,
                kind="request",
                payload=payload,
            ))
            return await asyncio.wait_for(future, timeout)
        finally:
            self.pending.pop(request_id, None)
            if not future.done():
                future.cancel()


Handler = Callable[[dict], Awaitable[dict]]


async def serve(name: str, bus: Bus, handler: Handler):
    """每个 Agent 串行处理自己的邮箱。"""
    mailbox = bus.mailboxes[name]

    while True:
        message = await mailbox.get()
        try:
            try:
                result = await handler(message.payload)
                kind = "response"
            except Exception as exc:
                result = {
                    "error": f"{type(exc).__name__}: {exc}"
                }
                kind = "error"

            await bus.send(Message(
                id=uuid.uuid4().hex,
                sender=name,
                recipient=message.sender,
                kind=kind,
                payload=result,
                reply_to=message.id,
            ))
        finally:
            mailbox.task_done()


async def main():
    bus = Bus()
    for name in ["writer", "correctness", "edge-cases"]:
        bus.register(name)

    writer = Agent(
        "writer",
        "你负责编写技术方案，并根据审查意见修订。"
        "明确区分设计建议与已验证事实。",
    )
    correctness = Agent(
        "correctness",
        "你负责检查技术方案的正确性。"
        "指出错误假设、逻辑漏洞和必要的改动。",
    )
    edge_cases = Agent(
        "edge-cases",
        "你负责检查并发、超时、失败恢复和边界条件。"
        "只提出具体、有理由的审查意见。",
    )

    async def correctness_handler(payload: dict) -> dict:
        review = await correctness.ask(
            "审查以下方案的正确性：\n" + payload["draft"]
        )
        return {"review": review}

    async def edge_handler(payload: dict) -> dict:
        review = await edge_cases.ask(
            "审查以下方案的边界条件：\n" + payload["draft"]
        )
        return {"review": review}

    async def writer_handler(payload: dict) -> dict:
        draft = await writer.ask(
            "为以下需求编写初稿：\n" + payload["task"]
        )

        # 编写者向两个审查者并行发起请求。
        reviews = await asyncio.gather(
            bus.request(
                "writer", "correctness", {"draft": draft}
            ),
            bus.request(
                "writer", "edge-cases", {"draft": draft}
            ),
        )

        # writer 保留了本任务的初稿对话，再接收审查意见。
        final = await writer.ask(
            "根据以下审查意见修改初稿。"
            "若不同意某条意见，说明技术理由：\n"
            + json.dumps(reviews, ensure_ascii=False)
        )

        return {
            "draft": draft,
            "reviews": reviews,
            "final": final,
        }

    workers = [
        asyncio.create_task(serve("writer", bus, writer_handler)),
        asyncio.create_task(
            serve("correctness", bus, correctness_handler)
        ),
        asyncio.create_task(serve("edge-cases", bus, edge_handler)),
    ]

    try:
        result = await bus.request(
            sender="client",
            recipient="writer",
            payload={
                "task": (
                    "设计订单提交幂等机制，处理重复点击、"
                    "网络重试和并发请求。只设计，不写代码。"
                )
            },
            timeout=240,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
    finally:
        for worker in workers:
            worker.cancel()
        await asyncio.gather(*workers, return_exceptions=True)


if __name__ == "__main__":
    asyncio.run(main())
```

这里用内存队列展示通信。队列没有持久化、重投递和消费确认机制；进程退出后消息丢失。跨进程时可以换成网络或中间件。

`serve()` 的任务处理函数应返回 JSON 可序列化对象。若总线发送自身失败，工作任务也可能退出；生产实现需要监控工作任务并处理这类故障。

### 消息如何走完一圈？

1. 创建请求 ID 和 `Future`：表示等待将来的结果。
2. 将请求放入接收者邮箱：这里只完成投递，没有完成任务。
3. 接收者取出消息，把业务内容放入自己的模型上下文。
4. 接收者发送响应，`reply_to` 指向原请求。
5. 总线匹配等待者，执行 `future.set_result(payload)`。
6. 请求方的 `await bus.request(...)` 得到结果，继续执行。

```text
request_id → 邮箱 → handler → response.reply_to
     ↑                             ↓
     └──────── Future 匹配 ────────┘
```

### 为什么不能靠回复顺序匹配？

```text
发出：请求 A、请求 B
收到：响应 B、响应 A
```

如果靠“最近一条回复”或位置对应，就会配错。必须用 `reply_to` 等关联字段。

还要区分消息 ID 与幂等键：

```text
第一次发送：message_id=100，idempotency_key=order-task-20
第二次重试：message_id=105，idempotency_key=order-task-20
```

这是不同消息，但可能代表同一操作，不应重复执行副作用。

## 十二、共享文件也是通信

大型报告或代码产物适合使用“消息 + 文件引用”：

```json
{
  "kind": "response",
  "payload": {
    "summary": "发现三个主要问题",
    "artifact": {
      "path": "artifacts/review-v2.json",
      "version": 2,
      "sha256": "实际内容哈希"
    }
  }
}
```

```text
消息通道：传状态、摘要和引用
文件 / 对象存储：保存大型产物
```

需要保证：

1. 接收者能访问该路径或对象；
2. 权限符合任务范围；
3. 引用的版本明确，内容不会被静默替换。

跨机器不能直接假设某个本地绝对路径可用。更适合使用不可变文件名、对象 ID 或内容哈希，而不是多个 Agent 反复覆盖 `latest.md`。

## 十三、生产级通信必须处理的问题

### 1. 超时不等于取消

`asyncio.wait_for(future, timeout)` 表示请求方不再等待，不自动停止接收者的执行。

取消 `asyncio.to_thread()` 的等待，也不能保证底层 HTTP 请求立即停止。取消已进入线程的调用时，锁可能释放，而旧网络请求仍在运行，因此完整实现还需管理在途调用。

取消协议可以包含：

```json
{
  "kind": "cancel",
  "task_id": "task-101"
}
```

接收者应在安全位置检查状态并退出；已经产生的外部副作用，需要恢复或补偿机制。

示例里 HTTP 超时是网络操作超时，不是整个协作的严格总时限；总线超时是等待预算，也不等于远端停止执行。

### 2. 重试与幂等

模型调用重试和整个 Agent 任务重试不同。任务如果已经写文件、提交代码或创建工单，重跑可能重复执行。

需要幂等键、已完成步骤记录、重复消息检测和必要的补偿操作。消息中间件的“至少一次投递”也不意味着业务恰好执行一次。

### 3. 背压与成本限制

示例使用无界邮箱。生产系统应控制队列容量、每个 Agent 的并发、总模型并发、速率、等待时间和调用预算。

否则生产速度超过消费速度，积压、内存和成本会持续增长。

### 4. 循环等待和死锁

```text
A 等待 B
B 又等待 A
```

如果双方都是串行邮箱处理，可能死锁。可以限制调用关系、分离回复接收和任务处理，或允许受控并发并保护上下文；所有等待还应有超时。

示例调用关系无环：

```text
client → writer → reviewers
```

审查者不会再请求编写者处理新任务。

### 5. 身份认证与权限

检查 `message.sender == expected_sender` 只能防配错，不是身份认证。

跨进程或跨机器需结合服务身份、令牌、mTLS、队列权限和可调用对象白名单。不能只相信消息里自报的发送者字段。

### 6. 信任边界

其他 Agent 的输出是建议或数据，不自动成为高优先级指令。接收者应区分系统规则、用户授权、委派任务和对方返回的内容。

不能因为内容来自另一个 Agent，就执行超出授权的操作。

### 7. 结构化格式不等于事实正确

JSON 校验能检查字段与类型，不能证明结论真实。仍需检查代码、来源、测试和产物，区分建议与已验证事实。

### 8. 状态持久化与可观测性

长任务还需记录任务状态、消息关联、产物版本、错误、耗时和模型消耗。恢复时使用已完成步骤，而不是从头重跑全部任务。

日志应能回答：谁向谁发了什么任务、对应哪次执行、产物是哪一版、最后是否通过验收。

## 十四、实际案例：修复订单重复提交

### 1. 明确验收目标

```text
同一次购买操作不能生成重复订单。

验收：
- 快速双击不会创建两笔订单；
- 网络重试不会创建重复订单；
- 正常提交行为保持兼容。
```

### 2. 并行只读调查

```text
A：前端事件、按钮状态和重试逻辑
B：后端幂等、事务和订单创建逻辑
```

调查可独立开始，不需要提前各自修改代码。

### 3. 统一设计与接口

主 Agent 根据调查确定整体策略。前端防连点改善交互，但不能替代后端对重试和并发的正确处理。

明确幂等键、请求字段、返回值、冲突行为和失败恢复，再按边界实施：

```text
A：前端提交逻辑
B：后端幂等逻辑
主 Agent：公共接口与最终集成
```

### 4. 验证最终集成版本

运行前端交互、后端幂等、并发请求和必要的集成测试。审查实际代码和证据，而不是只读实现者总结。

最终交付问题原因、修改内容、验证结果和未覆盖情况。

## 十五、如何写好委派任务？

好的委派包含六项：

```text
目标：解决什么问题？
背景：必须知道哪些事实？
范围：可以检查或修改什么？
约束：禁止什么，有什么兼容要求？
输出：返回什么格式和证据？
验收：怎样判断完成？
```

不好的委派：

> 帮我看看后端。

更好的委派：

> 检查订单创建接口是否能抵抗重复请求。只读，不修改文件。返回调用链、现有幂等机制、失效场景，附文件路径和函数位置；不能确认的地方明确标出。

允许修改时再增加：

> 只修改订单服务及其测试，不修改公共类型、依赖文件和数据库迁移；确实需要修改这些部分时先反馈。

作为用户，应关注任务分工、依赖、写入权限、环境隔离、证据、预算和最终责任，而不只是开了几个 Agent。

可使用的约束：

- 默认主助手完成，仅在明确授权后使用子 Agent；
- 允许并行调查，所有代码修改由主助手统一完成；
- 前后端并行开发前先约定接口，使用隔离目录，最后统一集成测试。

## 十六、对比与总结

| 维度 | 主 Agent / Subagent | 多 Agent 协作 |
| --- | --- | --- |
| 常见关系 | 委派者与执行者 | 多个执行单元协作 |
| 常见通信 | 调用参数和返回值 | RPC、邮箱、事件、共享状态 |
| 消息路径 | 多数经过主 Agent | 可以直接互发或经总线路由 |
| 上下文 | 通常独立，按需传递 | 同样通常独立 |
| 调度 | 主 Agent 或协调程序 | 程序、协调者或规则共同负责 |
| 主要难点 | 委派完整、结果可验收 | 还涉及路由、并发、循环等待 |
| 是否必须网络 | 不必 | 不必 |
| 是否必须不同模型 | 不必 | 不必 |

**Subagent 的核心是委派，多 Agent 的核心是协调。通信的核心则是把一方的产物显式转换为另一方的输入。**

Subagent 通信更像函数调用或服务委派，多 Agent 通信更像多个服务通过消息系统合作。两者可以采用相同的底层传输方式。

多个 Agent 不会自动更聪明。任务边界清楚、上下文充分、状态一致、证据可靠且验收严格时，分工才会真正提高效率。

## 相关笔记

- [Agent 的模块构成](./Agent的模块构成.md)
- [Harness 的模块构成](./Harness的模块构成.md)
- [MCP 系统性知识](./MCP系统性知识.md)
- [数据通信的基础模式](../interview/网络/数据通信的基础模式.md)
- [RESTful 与 RPC](../interview/网络/RESTful与RPC.md)
