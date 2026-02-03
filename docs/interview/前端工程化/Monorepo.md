# Monorepo (单体仓库)

**Monorepo** 是一种项目代码管理策略，指**将多个项目（Project）的代码存储在同一个 Git 仓库（Repository）中**。

与之相对的是 **Multirepo**（或 Polyrepo），即每个项目对应一个独立的仓库。

## 1. 核心结构示意

在一个典型的 Monorepo 前端项目中（例如使用 pnpm workspace），结构通常如下：

```text
root/
├── apps/               # 应用程序（业务代码）
│   ├── web/            # 主网站 (Next.js/Vue)
│   └── docs/           # 文档站点
├── packages/           # 共享库（依赖代码）
│   ├── ui/             # 通用 UI 组件库
│   ├── utils/          # 通用工具函数
│   └── config/         # 通用配置 (ESLint, TSConfig)
├── package.json
├── pnpm-workspace.yaml # 指定哪些目录是 workspace
└── turbo.json          # Turborepo 配置
```

## 2. 为什么需要 Monorepo？(解决了什么问题)

在多仓库（Multirepo）模式下，如果 `项目A` 依赖 `utils包`，每次 `utils包` 更新，你需要：

1. 修改 `utils` -> 发布 npm -> 这里等待 npm 更新...
2. 前往 `项目A` -> 升级依赖 -> 调试。

**Monorepo 的优势**：

- **代码共享与复用 (Code Sharing)**：
  所有项目都在一起，`apps/web` 可以直接引用 `packages/ui` 的代码。修改 `ui` 后，`web` **即时生效**，无需发包，极大提升了跨包开发的效率。

- **统一的工作流 (Unified Workflow)**：
  统一的代码规范（ESLint）、构建脚本和测试环境。一个 `git commit` 可以同时包含对底层库的修复和上层应用的更新（原子性提交）。

- **依赖管理 (Dependency Management)**：
  使用 pnpm workspace 等工具，可以将相同的第三方依赖（如 React/Vue）提升到根目录，节省磁盘空间并加速安装。

## 3. 缺点与挑战

- **体积庞大**：随着项目增多，Git 仓库体积变大，`git clone` 和 `git status` 可能会变慢。
- **权限控制复杂**：所有人都能看到所有代码，难以对特定目录做精细的读写权限控制（相比于 Multirepo）。
- **构建复杂度**：需要引入专业的构建工具（如 Turborepo, Nx）来处理依赖拓扑，确保按顺序构建，并利用缓存加速。

## 4. 常用工具链

现代前端 Monorepo 的标配通常是 **pnpm + Turborepo**。

| 工具          | 作用                                                                                    |
| :------------ | :-------------------------------------------------------------------------------------- |
| **pnpm**      | **包管理器**。通过 `Workspaces` 功能解决依赖安装、软链链接（Linking）的问题。           |
| **Turborepo** | **构建系统**。负责任务编排（Task Pipeline）。它通过**缓存**和**并行执行**，让构建飞快。 |
| **Lerna**     | （老牌）主要用于发包版本管理。现在很多功能已被 pnpm 和 Nx/Turbo 取代。                  |
| **Nx**        | 功能强大的全能型 Monorepo 构建工具，支持分布式缓存。                                    |

## 5. 总结

- **Multirepo**：适合即使完全隔离也无所谓的独立项目，或者团队间完全解耦的场景。
- **Monorepo**：适合**项目之间联系紧密**、**有大量公共库需要复用**的团队（这也是目前大厂前端架构的主流趋势）。
