---
title: "判断数据类型"
description: "判断数据类型：语言基础、浏览器、网络、Vue 与前端业务实践"
tags: ["前端开发"]
docType: "concept"
knowledgeTopic: "/frontend/javascript/"
migrationSource: "interview/js/判断数据类型.md"
---

## typeof

## instanceof

## Array.isArray()

## Object.prototype.toString.call()

封装一个获得类型的函数

```js
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

console.log(getType(123)); // Number
console.log(getType(null)); // Null
console.log(getType([])); // Array
console.log(getType(new Date())); // Date
```
