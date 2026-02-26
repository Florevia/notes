# Webpack 打包流程

从宏观上看，Webpack 的完整执行生命周期可以划分为三个核心阶段：
- **初始化阶段 (Init)**
- **构建阶段 (Make)**
- **生成阶段 (Seal & Emit)**

### 1. 初始化参数 (Initialization)

- 在这个阶段，Webpack 会从配置文件（如 `webpack.config.js`）和 `Shell 命令行参数`中读取并合并配置项，得出最终的打包参数。
- 同时，Webpack 会用这些参数实例化一个全局唯一的 **`Compiler`** 对象，并加载所有配置的 **Plugins（插件）**，开始监听 Webpack 生命周期中的各个事件节点。

### 2. 开始编译 (Run)

- 调用 `Compiler` 的 `run` 方法正式启动编译。此时，Webpack 会创建一个 **`Compilation`** 对象。

> *注：`Compiler` 代表整个 Webpack 的生命周期，而 `Compilation` 代表的是某一次具体的编译过程（比如在开发模式下，每次热更新都会产生一个新的 `Compilation` 对象）。*

### 3. 确定入口并编译模块 (Make & Build Modules)

- Webpack 根据配置中的 `entry` 找到所有的入口文件。从入口文件出发，调用所有配置好的 **Loaders** 对文件进行翻译。
- 在文件内容翻译完成后，Webpack 会利用 `Parser` 将代码转化为 **AST（抽象语法树）**。

### 4. 递归解析依赖树 (Dependency Graph)

- 这是最耗时的一个环节。Webpack 在解析 AST 的过程中，会找出该模块所依赖的其他模块（比如遇到了 `import` 或 `require` 语句）。
- 接着，Webpack 会根据这些依赖关系，**递归** 地重复第 3 步（调用 Loader 翻译 -> 生成 AST -> 找依赖），直到所有依赖的模块都被编译完毕。
- 最终在内存中生成一棵完整的 **模块依赖图**。

### 5. 封装 Chunk 并准备输出 (Seal)

- 编译和解析完成后，Webpack 会根据入口和模块之间的依赖关系，将多个相关的模块组合成一个个的 **Chunk（代码块）**。
- 例如，每一个 Entry 入口通常会生成一个对应的 Chunk；如果配置了代码分割，一些公共的第三方库也会被单独抽离成 Chunk。
- 接着，Webpack 会把这些 Chunk 转换成一个一个等待输出的文件内容（Assets）。

### 6. 输出文件 (Emit)

- 最后一步，Webpack 根据配置的 `output` 选项（包括输出路径和文件名），将上一步生成的 Assets 真正地写入到操作系统的文件系统中（通常是 `dist` 目录）。至此，整个打包流程结束。

## 总结

总结起来就是一句口诀：**合并配置 -> 找入口 -> 调 Loader 编译 -> 解析 AST 找依赖 -> 递归构建依赖图 -> 组装 Chunk -> 输出文件** 

>在这个过程中，Plugin 会在特定的生命周期钩子（Hooks）被触发，介入并修改打包结果。