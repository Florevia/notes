---
title: "数据通信基础模式"
description: "数据通信基础模式：计算机网络、数据结构、算法与操作系统"
tags: ["计算机基础"]
docType: "architecture"
knowledgeTopic: "/computer-science/networking/"
migrationSource: "interview/网络/数据通信的基础模式.md"
---

# 数据通信的基础模式

## 单工

## 半双工

## 全双工

```js
a = function () {
  return {
    b: function () {
      console.log(this);
    },
    c: () => {
      console.log(this);
    },
  };
};

d = a.call({});
console.log(d.b(), d.c());
```
