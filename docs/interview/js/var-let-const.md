# var let const

| 维度     | var                         | let                            | const                      |
| -------- | --------------------------- | ------------------------------ | -------------------------- |
| 作用域   | 函数作用域 (Function Scope) | 块级作用域 (Block Scope)       | 块级作用域 (Block Scope)   |
| 变量提升 | 提升，并初始化为 undefined  | 提升，但在声明前不可访问 (TDZ) | 同 let                     |
| 重复声明 | 允许                        | ❌ 不允许 (报错)               | ❌ 不允许 (报错)           |
| 重新赋值 | ✅ 允许                     | ✅ 允许                        | ❌ 不允许 (只是引用不可变) |
| 全局挂载 | 顶层 var 会挂载到 window    | 不会挂载到 window              | 不会挂载到 window          |

## 作用域：函数级 vs 块级

这是 ES6 引入 `let/const` 解决的最大痛点。

- `var` (函数作用域): 只有函数（function）能限制它的作用域。`if`、`for` 等代码块无法限制它，这会导致变量“泄漏”到外部。

- `let/const` (块级作用域): 任何大括号 {} 都是一个独立的作用域。

## 变量提升 (Hoisting) 与“暂时性死区” (TDZ)

这是一个常考的底层机制。

- `var` 的提升: 在执行代码前（编译阶段），引擎会收集所有的 `var` 声明，并在 **作用域顶部** 创建变量并赋值为 `undefined`。

```js
console.log(a); // undefined
var a = 10;
```

- `let/const` 的提升: 事实上，`let` 和 `const` 也会被提升，但**不赋值**，这个状态称为 **暂时性死区** (Temporal Dead Zone, TDZ)。

```js
console.log(a); // ReferenceError: Cannot access 'a' before initialization
let a = 10;
```

## const 的本质：值不可变 vs 引用不可变

- 基本数据类型 (String, Number, Boolean): **值** 不可变。

- 引用数据类型 (Object, Array): `const` 锁定的只是 **内存地址**（指针）。你不能把变量指向另一个地址，**但你可以修改该地址内的数据。**

```js
const obj = { name: "Alice" };
obj.name = "Bob"; // ✅ 允许
obj = { name: "Bob" }; // ❌ TypeError: Assignment to constant variable.
```

## 顶层 var 会挂载到 window

```js
var g = 100;
console.log(window.g); // 100 <- 污染了全局对象

let h = 200;
console.log(window.h); // undefined <- 保持了纯净
```
