---
title: "JavaScript 报错类型"
description: "JavaScript 内置错误类型，以及语法错误、运行时错误和异步错误怎么区分、怎么接住。"
tags: ["前端开发"]
docType: "concept"
knowledgeTopic: "/frontend/javascript/"
updated: 2026-11-24
---

# JavaScript 报错类型

能被 `throw`、被 `catch` 到的，主要是内置错误对象。日常调试时，再按出现时机分成语法错误和运行时错误。`throw` 其实可以抛任意值，不一定是 `Error`；下面说的是引擎和标准库实际抛出的那些。

## 定义

所有标准错误都继承自 `Error`。实例上常见三个字段：

- `name`：错误类型名，如 `TypeError`
- `message`：人类可读的说明
- `stack`：调用栈。规范不强制，浏览器和 Node 都有

判断类型用 `instanceof`，不要只看 `message` 文案。文案会随引擎变。

```js
try {
  null.foo;
} catch (e) {
  e instanceof TypeError; // true
  e.name; // "TypeError"
}
```

## 内置错误类型

| 类型 | 什么时候出现 |
|---|---|
| `SyntaxError` | 代码不符合语法，解析阶段就失败。少括号、非法标识符、`JSON.parse` 收到坏字符串也会抛这个。 |
| `ReferenceError` | 读了未声明的变量，或在暂时性死区里访问 `let` / `const`。 |
| `TypeError` | 值的类型不对。对 `null` / `undefined` 取属性、把非函数当函数调用、给 `const` 重新赋值。运行时最常见的一类。 |
| `RangeError` | 数值越界。`new Array(-1)`、`toFixed` 的小数位不在 0–100、进制不在 2–36。V8 里递归过深也是这个（`Maximum call stack size exceeded`）。 |
| `URIError` | `encodeURI` / `decodeURI` 及其 Component 版本处理了非法 URI。 |
| `AggregateError` | 一次打包多个错误。`Promise.any` 全部失败时，各个原因在 `.errors` 里。 |
| `EvalError` | 历史遗留。现代引擎基本不再抛，可以忽略。 |
| `InternalError` | 非标准，主要是 Firefox 在递归过深时抛。Chrome / Node 对应情况是 `RangeError`。 |

浏览器里还有 `DOMException`。现在它继承 `Error`，但 `name` 是具体异常名，例如 `AbortError`、`NotFoundError`，不在上表里。Node 的系统调用失败通常仍是 `Error`，用 `code` 区分，例如 `ENOENT`，不是单独的子类。

自己的业务错误继承 `Error` 即可。ES2022 起可以用 `cause` 带上原因，这不是新的错误类型：

```js
class AppError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "AppError";
  }
}

throw new AppError("保存失败", { cause: original });
```

## 按出现时机

### 语法错误

解析时就发生。包一层 `try/catch` 通常接不住，因为那段代码根本没开始执行。模块或脚本文件里的语法错误会让整份文件加载失败。

只有运行时才去解析的字符串，里面的语法错误才能被接住：`eval`、`new Function`、`JSON.parse`。

```js
try {
  eval("const = 1");
} catch (e) {
  e instanceof SyntaxError; // true
}
```

### 运行时错误

执行到那一行才抛。`TypeError`、`ReferenceError`、`RangeError` 都属于这一类，同步的 `try/catch` 可以接住。

```js
notDeclared;     // ReferenceError
null.foo;        // TypeError
(1).toFixed(101); // RangeError
```

### 异步错误

`async` 函数里的 `throw`，以及 `await` 到的 rejection，都会变成这个 async 函数返回的 rejected Promise。外层如果没有 `await`，同步的 `try/catch` 接不住。

```js
async function load() {
  throw new TypeError("坏了");
}

try {
  load(); // 没有 await，这里接不住
} catch (e) {}

try {
  await load();
} catch (e) {
  e instanceof TypeError; // true
}
```

没人处理的 rejection，浏览器里是 `unhandledrejection`，Node 里是 `unhandledRejection`。`setTimeout`、事件回调里的错误也一样：回调有自己的调用栈，得在回调内部捕获，或者交给对应的全局未处理钩子。

## 常见问题

**为什么同样是 `SyntaxError`，有的能 catch，有的不能？**

看它是不是在当前代码开始执行之后才被解析出来的。文件本身的语法错误发生在执行前；`JSON.parse` 和 `eval` 是执行到函数调用时才解析字符串。

**`throw "fail"` 算哪种错误？**

不算。`catch` 能接到字符串，但 `e instanceof Error` 为 `false`，也没有 `stack`。业务代码里抛错误对象，不要抛裸字符串。

**怎么一次看到多个失败？**

`Promise.any` 在全部失败时拒绝一个 `AggregateError`，逐个原因在 `error.errors`。`Promise.all` 则是第一个失败就拒绝，类型就是那个原因本身，不会打包。

## 相关技术

- [Promise](/frontend/javascript/promise)：rejection 怎么传递，以及 `all` / `any` 的差别
- [执行栈与上下文](/frontend/javascript/execution-context)：`stack` 对应的调用栈
- [判断数据类型](/frontend/javascript/type-checking)：`instanceof` 判断错误类型
