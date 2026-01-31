# babel

## 1. 什么是 babel

Babel 本质上是一个 JavaScript 编译器。

负责将现代的 JavaScript 代码（ES6+、TypeScript、JSX 等）转换为向后兼容的 ES5 代码，从而确保代码能够在旧版本的浏览器或环境中运行。

它的工作流程可以概括为三个核心阶段：

- 解析 (Parse)：将源代码转换为抽象语法树 (AST)。
- 转换 (Transform)：对 AST 进行遍历和修改，应用各种转换规则。
- 生成 (Generate)：将修改后的 AST 转换回 JavaScript 代码。

## 2. babel 的工作原理

### 解析 (Parse)

- 目标： 将源代码转换为 AST（抽象语法树）。
  这一步主要由 @babel/parser（旧称 Babylon）完成，包含两个子步骤：
  - 词法分析（Lexical Analysis）： 将代码字符串分割成令牌流（Tokens），例如将 const a = 1 分割成 const, a, =, 1。
  - 语法分析（Syntactic Analysis）： 根据令牌流生成 AST。AST 是一个深度嵌套的对象，描述了代码的语法结构。

### 转换 (Transform)

- 目标： 遍历 AST，并对其进行增删改操作。
  这一步主要由 @babel/traverse 完成。

- Babel 接收到 AST 后，会使用深度优先遍历。
- 插件（Plugins） 在这个阶段介入。Babel 本身只是一个空壳，具体的转换逻辑（比如把 const 变成 var，把箭头函数变成普通函数）都是由插件完成的。插件会监听 AST 中特定类型的节点（Visitor 模式），当遍历到该节点时执行相应的转换逻辑。

### 生成 (Generate)

- 目标： 将转换后的 AST 重新转换回代码字符串。
  这一步主要由 @babel/generator 完成。

- 它深度遍历修改后的 AST，根据节点类型生成对应的 JavaScript 代码字符串。
- 同时，它还会生成 Source Map，以便于调试。

## 3. babel 的插件机制

babel的转换能力实际上是靠plugin来实现的。

每一个插件通常只负责转换一种特定的语法

## 4. babel 的预设

预设（Presets）本质上就是一组插件的集合（Bundle）

## es6转换成es5要转换的语法

- 箭头函数
- let/const
- 模板字符串
- 解构
- 默认参数
- 展开语法
- ...

将 ES6 转 ES5，实际上是做两件事：

1. 编译（Compile）： 把 let => class 等新语法变成 ES5 的旧写法。
2. 垫片（Polyfill）： 引入 core-js，把 Promise, Includes 等新功能硬写进运行环境中。

## 5. Babel 的配置文件

Babel 的配置非常灵活，主要分为两类：**项目级配置** 和 **文件相对配置**。

### 1. 项目级配置 (Project-wide)

- **文件**：`babel.config.json` 或 `babel.config.js`
- **位置**：通常位于项目根目录（含有 `package.json` 的目录）。
- **作用**：对整个项目（包括 `node_modules`）生效。
- **场景**：这是现代项目（尤其是 Monorepo）**推荐**的配置方式。

### 2. 文件相对配置 (File-relative)

- **文件**：`.babelrc.json` 或 `.babelrc`
- **位置**：可以在项目的任意子目录中。
- **作用**：仅对该目录及其子目录下的文件生效。
- **场景**：如果你只需要对项目的某个特定部分（如 `src/legacy`）应用特殊的 Babel 插件，可以用这个。

### 3. package.json

- 也可以在 `package.json` 中直接配置 `"babel": { ... }`，等同于 `.babelrc`。

---

## 6. Babel 和 Vite 的关系

这是一个常见的面试坑点。

- **开发环境 (`vite dev`)**：
  - Vite **不使用** Babel 进行转译（Transpilation）。
  - Vite 使用 **Esbuild**（用 Go 写的，比 Babel 快 10-100 倍）来处理 JS/TS 文件的转译。
  - **注意**：Esbuild 只负责把 TS 转成 JS，或者把新语法转成旧语法，它**不负责类型检查**。

- **生产环境 (`vite build`)**：
  - Vite 默认使用 **Rollup** 进行打包。
  - 为了兼容低版本浏览器（如 iOS 9），Vite 会使用 `@vitejs/plugin-legacy`，而这个插件底层**依然会调用 Babel** 来进行语法降级和 Polyfill 注入。

**总结**：Vite 在开发时用 Esbuild 追求极致速度，在打包生产时用 Rollup + Babel 追求极致的兼容性和体积优化。

## 7. Babel 与 Webpack 的关系

这是一个容易混淆的概念。

- **`babel-loader`** 是桥梁。
- Webpack 在打包过程中，每遇到一个 `.js` 文件，就会把文件内容丢给 `babel-loader`。
- `babel-loader` 调用 Babel 进行转译，把转译后的代码还给 Webpack。
- Webpack 再去解析代码中的 `require/import` 依赖，继续处理下一个文件。
