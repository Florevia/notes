# ES Modules (ESM) vs CommonJS (CJS)

在 Node.js 开发中，主要有两种模块系统：**CommonJS (CJS)** 和 **ES Modules (ESM)**。

## 1. 核心区别 (Core Differences)

| 特性             | CommonJS (CJS)                             | ES Modules (ESM)                           |
| :--------------- | :----------------------------------------- | :----------------------------------------- |
| **语法**         | `require`, `module.exports`                | `import`, `export`                         |
| **加载方式**     | **运行时加载** (Dynamic)                   | **编译时输出接口** (Static)                |
| **同步/异步**    | 同步加载 (Synchronous)                     | 异步加载 (Reference usually handled async) |
| **导出值**       | **值的拷贝** (Primitive values are copied) | **值的引用** (Live Bindings)               |
| **严格模式**     | 默认非严格 (除非手动 `"use strict"`)       | **默认严格模式**                           |
| **顶级作用域**   | `this` 指向 `exports`                      | `this` 是 `undefined`                      |
| **特有变量**     | `__dirname`, `__filename`, `require`       | `import.meta`, `import.meta.url`           |
| **Tree Shaking** | 很难支持                                   | **支持** (因为是静态分析)                  |

## 2. 详细说明

### 2.1 加载机制

- **CJS**: 是动态的。由于 `require()` 是同步执行的函数，可以在代码的任何地方调用（例如在 `if` 语句中）。这也意味着只有执行了 `require` 才会去加载模块。

- **ESM**: 是静态的（Static）。`import` 语句（除非是动态 `import()`）必须位于模块顶层，不能在块级作用域中。JS 引擎在执行代码前会先构建模块依赖图。

- **CJS (CommonJS)**: 是**运行时加载**（Dynamic / Runtime）。

  - `require` 是一个函数。
  - 当代码执行到 `require('fs')` 这一行时，JS 引擎才会去加载该模块。
  - **特点**: 可以写在 `if` 判断里，路径也可以是动态计算的变量（如 `require('./' + path)`）。
  - **缺点**: 无法在编译阶段知道你到底引用了什么，很难做 Tree Shaking（摇树优化，去除无用代码）。

- **ESM (ES Modules)**: 是**编译时加载**（Static / Compile-time）。
  - `import` 是关键字，不是函数。
  - JS 引擎在**解析**（Parsing）阶段，还没有实际运行代码之前，就会扫描所有的 `import` 语句，构建出依赖关系图。
  - **特点**: `import` 必须写在文件最顶层，不能包裹在 `if` 或函数里。
  - **优点**: 工具（如 Webpack, Vite）可以在编译时就知道你只用了模块里的哪些部分，从而放心大胆地删除未使用的代码（Tree Shaking）。

### 2.2 值的拷贝 vs 引用

- **CJS**: 导出的是值的**拷贝**。一旦输出一个值，模块内部的变化不会影响到这个值。
- **ESM**: 导出的是值的**引用**（Live Bindings）。如果模块内部的变量发生了变化，外部导入的这个变量也会随之变化。

#### ⚠️ 影响与注意事项 (Impacts & Precautions)

1.  **Mocking 与 测试 (Mocking)**:

    - **CJS**: 因为 `require` 返回的是个对象，你可以轻易地修改它（例如 `require('./api').get = jest.fn()`），这在单元测试中 Mock 依赖非常方便。
    - **ESM**: 导入的模块变量是**只读的**（Read-only bindings）。你不能直接赋值修改它（例如 `import { get } from './api'; get = mockFn` 会报错）。这使得 Mocking 变得稍微复杂，通常需要依赖测试框架（如 Jest 27+, Vitest）提供的专门工具来处理。

2.  **状态管理 (State Management)**:

    - **CJS**: 如果你导出一个计数器 `counter`，外部拿到的是当时的快照。如果模块内部更新了 `counter`，外部是感知不到的，容易导致数据不一致。
    - **ESM**: 外部能始终看到最新值。这在做单例模式或状态共享时很有用，但也意味着如果你不小心修改了内部状态，所有引用它的地方都会受影响。

3.  **循环依赖 (Circular Dependencies)**:
    - **CJS**: 遇到循环引用时，通常只得到一个**不完整的对象**（执行了一半的 `exports`），非常容易导致 `undefined` 错误。
    - **ESM**: 由于是引用的，只要在代码运行到使用该变量的那一行之前，引用被初始化好即可。因此 ESM 对循环依赖的容忍度更高。

### 2.3 全局变量替代方案

在 ESM 中，你不能直接使用 `__dirname` 和 `__filename`。需要使用 `import.meta.url` 和 `path` 模块自行构建：

```javascript
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 2.4 循环依赖

ESM 处理循环依赖的能力比 CJS 更强，因为它是基于引用的，只要在真正使用变量之前引用已经建立即可。

## 3. 在开发中如何处理 (Handling in Development)

### 3.1 开启 ESM 支持

在 Node.js 项目中使用 ESM，最推荐的方式是在 `package.json` 中配置：

```json
{
  "type": "module"
}
```

配置后：

- `.js` 文件默认被视为 ESM。
- 如果还需要使用 CJS，可以将文件后缀改为 `.cjs`。

### 3.2 互操作性 (Interoperability)

- **ESM 引用 CJS**:

  - 可以直接 `import`: `import foo from './foo.cjs'`.
  - 注意：只能使用**默认导入** (`import defaultExport from ...`)，命名导入 (`import { named } from ...`) 可能在某些 Node 版本或工具中不被支持（除非 CJS 模块经过特殊处理）。

- **CJS 引用 ESM**:
  - **不能**使用 `require()` 加载 ESM 文件（因为 ESM 是异步的）。
  - 必须使用动态导入 `import()`:
    ```javascript
    (async () => {
      const esmModule = await import("./bar.mjs");
    })();
    ```

### 3.3 TypeScript 开发

如果在 TypeScript 中使用 ESM：

- `tsconfig.json` 配置 `"module": "ESNext"` 或 `"NodeNext"`。
- 导入文件时，TypeScript 现代规范常常要求**显式写出扩展名**（例如 `import x from './utils.js'`），或者配置打包工具解决。
