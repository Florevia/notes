# VitePress 全站搜索 + 侧边栏筛选

**日期:** 2026-09-01  
**状态:** 已确认设计  
**范围:** 在现有 VitePress 笔记站增加全站内容搜索与侧边栏标题筛选

## 目标

用户能通过两种方式快速找到笔记：

1. **全站搜索**：按关键词搜索页面标题与正文，跳转到目标笔记
2. **侧边栏筛选**：在当前侧边栏顶部输入关键词，即时隐藏不匹配的导航项

## 非目标

- 不接入 Algolia / 第三方搜索服务
- 不新建独立搜索结果页
- 侧边栏筛选不搜索正文，只匹配侧边栏标题
- 筛选关键词不跨路由持久化

## 方案

采用 VitePress 内置本地搜索 + 主题插槽自定义侧边栏筛选组件。

### 1. 全站本地搜索

在 `docs/.vitepress/config.mts` 的 `themeConfig` 中启用：

```ts
search: {
  provider: "local",
  options: {
    translations: {
      button: {
        buttonText: "搜索",
        buttonAriaLabel: "搜索文档",
      },
      modal: {
        displayDetails: "显示详细列表",
        resetButtonTitle: "重置搜索",
        backButtonTitle: "关闭搜索",
        noResultsText: "无结果",
        footer: {
          selectText: "选择",
          navigateText: "切换",
          closeText: "关闭",
        },
      },
    },
  },
},
```

行为约定：

- 导航栏出现搜索入口
- 支持 `Cmd/Ctrl+K` 打开搜索面板
- 构建时由 VitePress 索引站点 markdown 的标题与正文
- UI 文案使用中文

### 2. 侧边栏筛选

#### 放置

- 通过 `Layout.vue` 的 `sidebar-nav-before` 插槽挂载
- 每个有侧边栏的页面都显示（含短侧边栏）

#### 组件

新建 `docs/.vitepress/theme/components/SidebarFilter.vue`：

- 输入框 placeholder：`筛选侧边栏…`
- 输入变化时即时筛选，无防抖要求（侧边栏节点量级小）
- 清空输入即恢复全部项

#### 匹配规则

- 对侧边栏项标题做子串包含匹配
- 大小写不敏感
- 适合中文标题（整词/子串均可命中）

#### 父子关系

- 子项命中 → 保留祖先分组并展开，便于看到上下文
- 父分组标题命中 → 保留该分组及其全部子项（整组可见）
- 无任何命中的分组/叶子 → 隐藏

#### 空态

- 有输入且无任何匹配项时，在筛选框下方显示一行：`无匹配项`
- 无输入时不显示空态文案

#### 状态生命周期

- 筛选词仅存在于当前页面组件状态
- 路由切换或刷新后清空，不做 `localStorage` / URL 同步

#### 样式

- 贴合 VitePress 默认主题变量（边框、圆角、输入框背景、暗色模式）
- 不引入额外动画库或强视觉特效

### 3. 文件改动

| 文件 | 变更 |
|------|------|
| `docs/.vitepress/config.mts` | 增加 `themeConfig.search`（local + 中文文案） |
| `docs/.vitepress/theme/components/SidebarFilter.vue` | 新建侧边栏筛选组件 |
| `docs/.vitepress/theme/Layout.vue` | 引入组件并挂到 `sidebar-nav-before` |

不改动现有侧边栏 `sidebar` 数据结构和笔记 markdown 内容。

## 数据流

```
全站搜索:
  markdown 构建 → VitePress local index → 搜索 UI → 路由跳转

侧边栏筛选:
  用户输入 → SidebarFilter → 遍历/标记当前侧边栏 DOM 或项可见性
            → 命中项显示 / 未命中隐藏 → 可选空态文案
```

侧边栏筛选实现优先基于渲染后的侧边栏节点做可见性控制，避免 fork 默认 `VPSidebar` 或重写整棵 sidebar 树。

## 错误与边界

- 无侧边栏的页面（如 home）：不渲染筛选框（插槽本身不会出现）
- 本地搜索索引失败：依赖 VitePress 默认行为，本设计不额外封装错误 UI
- 特殊字符输入：按普通子串处理，不做正则解释，避免误伤

## 验证

1. `pnpm ll:dev` 启动后，导航栏可见搜索入口，`Cmd/Ctrl+K` 可打开
2. 搜索已知笔记标题/正文片段，能跳到正确页面
3. 打开带长侧边栏的页面（如面试），顶部有筛选框
4. 输入能匹配的关键词 → 只显示相关项，父级仍可见
5. 输入无匹配词 → 显示「无匹配项」
6. 清空输入 → 侧边栏恢复完整
7. 暗色模式下输入框样式可读、不突兀

## 实现顺序建议

1. 配置 local search 并手动验证
2. 实现 `SidebarFilter.vue` 并挂到 Layout
3. 按验证清单回归
