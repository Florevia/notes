# TypeScript 模块类型判定 (ESM vs CJS)

TypeScript 判断当前文件是属于 ESM 还是 CJS 遵循一套严格的优先级规则，旨在与 **Node.js 原生行为** 对齐。

1. 优先级 ①：文件后缀名 (最高强制力)。
   无论配置文件如何，后缀名决定一切。
   | 后缀名 | 强制类型 | 编译输出 | 允许语法 |
   | :--- | :--- | :--- | :--- |
   | `.mts` | **ESM** | `.mjs` | `import`, `top-level await` |
   | `.cts` | **CJS** | `.cjs` | `require`, `module.exports` |
   | `.mjs` | **ESM** | N/A (原生) | 原生 ESM 语法 |
   | `.cjs` | **CJS** | N/A (原生) | 原生 CJS 语法 |

2. 优先级 ②：package.json 配置
   当文件后缀为中性的 `.ts` 或 `.js` 时，TS 会向上查找 `package.json` 中的 `"type"` 字段。

   - `"type": "module"` : 目录下的 `.ts` / `.js` 视为 **ESM**。
   - `"type": "commonjs"` (或未设置) : 目录下的 `.ts` / `.js` 视为 **CJS** (默认行为)。

3. 优先级 ③：tsconfig.json 编译器选项
   `tsconfig` 决定了编译器如何处理这些文件以及输出格式。
   - `"module": "Node16"` / `"NodeNext"` (**推荐**)
     - **严格模式**：完全遵循上述 ① 和 ② 的规则。
     - 支持 ESM 和 CJS 混合开发（通过后缀区分）。
     - **强制检查导入路径后缀**（ESM 必须加 `.js`）。
   - `"module": "CommonJS"`
     - **强制转换**：忽略源码中的 `import` 语法，最终全部编译为 `require`。
     - 即使源码是 ESM 风格，运行时表现也是 CJS。
