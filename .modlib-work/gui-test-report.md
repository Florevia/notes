# 侧边栏功能验证

## 更新：消除收起/展开抖动

- 正文、顶栏元素和右侧目录使用前后各一次位置测量与 280ms transform 平移，不逐帧改变布局，不缩放文字。
- 桌面端正文阅读宽度在两种状态保持一致，滚动条预留稳定空间。
- 展开前只在侧栏内部立即定位当前文章，移除 scrollIntoView，不带动整页滚动。
- 支持快速反向切换接续当前位置；页面切换、resize、减少动画和卸载时清理动画。

### 本轮浏览器结果

原生 role 点击仍出现超时。重新观察按钮后，使用运行时的 DOM 节点点击成功完成收起和展开，未注入事件或修改状态。

![收起状态](file:///Users/lilin/.modlib-work/cli/artifacts/session_3cb598a145a1fd864d09c55425e29db2/call_bjnbNKH5X1GQ3N2dHS4SOQMv-tool-result-f1363f73-1d3d-4a46-9849-1809d1b9b0db.png)

![展开状态](file:///Users/lilin/.modlib-work/cli/artifacts/session_3cb598a145a1fd864d09c55425e29db2/call_r3yL94aMfSJ3XbHzYUWXznuJ-tool-result-f3140c87-1b98-4bb3-976d-d626890bcdad.png)

展开前后读取正文 main：宽度均为 624px，顶部均为 128px，window.scrollY 均为 0。截图确认稳定布局无重叠。截图并不证明逐帧流畅度；运行时 recording 文档不可用，未进行视频/FPS 验收。

`node .modlib-work/sidebar-motion-check.mjs` 通过：平移而无缩放、反向切换从中间位置接续、快速点击、resize/路由/卸载清理、侧栏内部滚动、减少动画和持久化。它是组件模拟测试，不替代真实浏览器性能测量。

重新执行构建，主题 client/server 编译通过，整站仍在下文原有 Markdown 模板插值处失败。

以下为早期验证记录。

## 实现范围

- 在桌面顶部搜索框左侧增加收起/展开按钮。
- 收起状态控制左栏显示和正文、顶栏、局部导航占位。
- 使用 localStorage 记住状态；存储被禁用时仍支持当前会话切换。
- 样式仅在宽度 ≥960px 生效；未修改移动端抽屉状态。

## 已确认：1280px 暗色模式展开布局

页面快照显示“收起侧边栏”按钮及 `aria-expanded=true`，左侧导航可见。截图确认开关与搜索、站点标题没有重叠，页面保持现有风格。

![展开状态页面](file:///Users/lilin/code/lin/notes/.modlib-work/gui-test-screenshots/t1-expanded.png)

## 浏览器测试限制

首页初次操作发生截图超时，该轮测试标记为无效。重新准备文章页面后，浏览器自动化的 role 和 label 点击均超时，尽管读取结果显示开关 count=1 且 visible=true。

因此以下实际浏览器测试未完成，不能判为通过：收起/展开、刷新持久化、导航后持久化、键盘操作、手机菜单及其它屏幕尺寸。没有使用脚本修改页面状态来绕过失败。浏览器运行时未提供控制台日志收集接口。

## 独立组件测试：通过

使用 Vue 官方 SFC 编译器编译实际 Layout.vue，在 JSDOM 中挂载，并以默认主题布局替身承接插槽。检查通过：

- 收起/展开时按钮名称、aria-expanded 与布局 class 同步。
- localStorage 写入状态。
- 路由变化保持状态。
- 组件重新挂载恢复状态（刷新生命周期模拟，不等于浏览器刷新验收）。
- 无侧边栏页面不渲染开关。
- 禁用存储时切换仍生效。

这些检查不替代真实浏览器视觉或交互验收。

## 构建结果

`pnpm ll:build` 的客户端与服务端 bundle 编译通过。全站页面渲染失败于未修改的文件：

`docs/interview/vue/生命周期中写异步函数是否阻塞组件的挂载和渲染.md:19`

该笔记的行内代码含 `{{ userInfo.name }}`，被 Vue 当作模板插值求值，导致 `Cannot read properties of undefined (reading 'name')`。本次没有修改笔记内容。

`git diff --check` 通过。

## 环境准备

启动本地 VitePress 开发服务 `pnpm ll:dev --host 127.0.0.1`，地址为 http://127.0.0.1:5173/。重新准备文章页面采用首页快照中实际存在的文章链接。未注入浏览器存储、DOM 或事件。
