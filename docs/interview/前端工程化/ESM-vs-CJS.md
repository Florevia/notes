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

- **CJS**: 是动态的。
  - commonjs是 **运行时加载**。
  - `require()` 是同步执行的函数，可以在代码的任何地方调用（例如在 `if` 语句中）。
  - 这也意味着只有执行了 `require` 才会去加载模块，很难做 Tree Shaking。

- **ESM**: 是静态的（Static）。
  - ESM是 **编译时加载**。
  - `import` 语句（除非是动态 `import()`）必须位于模块顶层，不能在块级作用域中。
  - JS 引擎在执行代码前会先构建模块依赖图。

### 2.2 值的拷贝 vs 引用

- **CJS**: 导出的是值的**拷贝**。一旦输出一个值，模块内部的变化不会影响到这个值。
- **ESM**: 导出的是值的**引用**（Live Bindings）。如果模块内部的变量发生了变化，外部导入的这个变量也会随之变化。

#### ⚠️ 影响与注意事项 (Impacts & Precautions)

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

## 3. 在开发中如何处理

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
