# Tree Shaking

## 概念

死代码消除技术，最终打包时剔除那些被引入但从未被使用的代码。

## 原理

1. 核心前提
   ES6的ESM
   - ESM 是静态的： `import` `export` 语句必须在模块顶层，且模块依赖关系在编译时（Compile-time）就能确定。

   - CommonJS 是动态的： `require()` 可以嵌套在条件语句中，依赖关系只有在运行时（Run-time）才能确定，因此很难进行可靠的 Tree Shaking

2. 核心流程：标记 与 清除

- 第一步：构建 AST（抽象语法树）

  构建工具会解析源码生成 AST，扫描所有的 `import` 和 `export` 语句。

- 第二步：静态分析与标记

  它会从入口文件（Entry）出发，追踪所有的引用链路。

- 第三步：压缩阶段删除

  真正的“删除”动作通常是由压缩工具（如 Terser、UglifyJS 或 Webpack 5 内置的压缩器）完成的。最终生成Bundle时将标记为未使用的代码剔除。
