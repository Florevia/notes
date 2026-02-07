# npm 和 pnpm 的具体实现原理

## npm (Node Package Manager)

### 扁平化依赖 (npm v3+)

npm v3 之前使用嵌套结构，导致路径过长和重复依赖。v3 开始采用扁平化结构，将依赖提升到 `node_modules` 顶层。

**问题：**

1. **幽灵依赖 (Phantom Dependencies)**: 项目可以直接访问未在 `package.json` 中声明但被 hoisted 的依赖。
2. **依赖分身 (Doppelgangers)**: 不同版本的同一依赖可能被多次安装。

## pnpm (Performant npm)

### 内容寻址存储 (Content-addressable store)

pnpm 使用硬链接 (Hard links) 和符号链接 (Symbolic links) 来管理依赖。

1. **全局存储**: 所有依赖都存储在全局的 store 中 (`~/.pnpm-store`).
2. **硬链接**: 项目的 `node_modules` 下的 `.pnpm` 目录包含指向全局 store 的硬链接。
3. **符号链接**: 项目的 `node_modules` 根目录下的包是指向 `.pnpm` 目录中对应包的符号链接。

### 优势

1. **节约磁盘空间**: 同一版本的依赖只存储一次。
2. **安装速度快**: 大量复用缓存。
3. **严格的依赖管理**: 避免了幽灵依赖，只能访问 `package.json` 中声明的依赖。
