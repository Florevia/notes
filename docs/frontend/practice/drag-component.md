---
title: "拖拽组件"
description: "拖拽组件：语言基础、浏览器、网络、Vue 与前端业务实践"
tags: ["前端开发"]
docType: "concept"
knowledgeTopic: "/frontend/practice/"
migrationSource: "interview/业务场景/拖拽组件.md"
---

# 拖拽组件实现

## HTML5 Drag and Drop API

- `draggable="true"`
- 事件: `dragstart`, `dragenter`, `dragover`, `dragleave`, `drop`, `dragend`.
- `dataTransfer` 对象用于传递数据。

## 常见库

- `vuedraggable` (基于 `Sortable.js`)
- `react-dnd`
- `dnd-kit`

## 关键点

1. **状态同步**: 拖拽结束后，需要同步更新数据源（如数组顺序）。
2. **样式反馈**: 在 `dragover` 时给予用户视觉反馈（如占位符）。
3. **性能**: 避免在 `dragover` 中执行昂贵操作，使用防抖或节流。
4. **兼容性**: 移动端可能需要 Touch 事件支持。
