# HMR（热更新）的核心原理

HMR（热更新）的核心原理可以概括为：

- WebSocket 通信
- 浏览器端 Runtime（注入的客户端代码）
- 模块冒泡替换

## 其流程主要分为以下五个步骤：

### 文件监听与构建（Server 端）

开发服务器（如 Webpack Dev Server 或 Vite Server）启动时，会创建 **文件监视器（通常基于 chokidar）**。当开发者保存文件时，服务器监听到变化，对变动的模块进行 **增量构建**。

- **Webpack（Bundle-based）**：
  - Webpack 本质是基于 Bundle 的，修改一个文件，需要重新编译生成该模块及其依赖的 Chunk。
  - 它会产出两个关键文件：
    1.  **Update Manifest (JSON)**：包含新的 Hash 值，告知浏览器哪些 Chunk 需要更新。
    2.  **Update Chunk (JS)**：包含具体的增量代码。

- **Vite（Native ESM-based）**：
  - Vite 利用浏览器原生 ESM，**也就是不需要打包**。
  - 当文件修改时，Vite Server 只需要通过 `Module Graph` 定位到该文件及受影响的边界。
  - 这里的“构建”实际上只是让文件缓存失效（Invalidate），并没有繁重的重新打包过程。

### 消息推送（WebSocket）

服务器通过 WebSocket 长连接，向浏览器端发送一条消息，告知“有文件更新了”。
消息内容通常包含更新的模块 ID 或 Hash 值。

### 运行时接收与请求（Client Runtime）

> **辨析**：这里的 "Runtime" 不是指浏览器环境本身，而是指 **构建工具打包进去的一段 JS 代码**（Client Code）。它运行在浏览器中，负责 HMR 的核心逻辑（建立连接、接收消息、更换模块）。

浏览器端注入的 HMR Runtime 收到 WebSocket 消息后：

- Webpack：Runtime 会通过 AJAX 请求一个 JSON（Manifest），确认哪些模块变了，然后通过 JSONP 请求获取最新的 JS 代码块。
- Vite：Runtime 直接根据路径请求变动的 `.js` 文件（利用浏览器原生 ESM）。

### 模块替换（核心难点）

拿到新代码后，HMR Runtime 需要决定如何处理。这里遵循 **“冒泡机制”**：

- 检查 `Accept：Runtime` 检查变更模块本身是否声明了 `module.hot.accept`（或 `import.meta.hot.accept`）回调。

- 执行替换：
  - 如果当前模块能处理（Self-accepted），则运行新代码，替换旧模块的导出值，并执行回调，同时保留应用状态。
  - 如果当前模块不能处理，Runtime 会沿着 **依赖图（Dependency Graph）** 向上传播（冒泡），查看父模块是否能处理该更新。

- 兜底策略：如果一直冒泡到入口文件（Entry）都没有模块接受更新，或者更新过程中出错，HMR 就会失败，此时通常会触发浏览器整页刷新（Live Reload）。

### 状态保留

这是 HMR 与 Live Reload 的最大区别。

1.  **为何普通替换会丢失状态？**
    如果只是简单地重新执行 JS 模块，模块内部定义的变量（如 `let count = 0`）会被重置为初始值，因为旧的模块作用域被销毁，新的模块作用域重新创建了。

2.  **框架如何做到状态保留？**
    React 和 Vue 等现代框架通过 **“代码与状态分离”** 的策略来实现：
    - **React Fast Refresh**：
      React 的核心是 Fiber 架构。组件的状态（State/Hooks）存储在 **Fiber 节点** 上，而不是组件函数本身。
      当组件文件更新时，React 仅仅是用新的组件函数去替换旧的，但 **保留了对应的 Fiber 节点及其挂载的状态**。随即触发一次 Re-render，用新的逻辑渲染旧的数据，从而实现“无感更新”。
    - **Vue HMR**：
      Vue 的 HMR 基于 **代理（Proxy）** 模式。`vue-loader` 或 Vite 插件会将组件导出包裹在一个 `__VUE_HMR_RUNTIME__` 的代理对象中。
      - **只有 template 改变**：只替换渲染函数（render function），组件实例（data/state）完全不动，只会触发重新渲染。
      - **script 改变**：Vue 会尝试替换组件定义，虽然理论上逻辑变了，但框架会尽量复用现有的组件实例对象，从而保留响应式数据。
