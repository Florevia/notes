# instanceof

`instanceof` 运算符用于检测 **构造函数的 `prototype` 属性是否出现在某个实例对象的原型链上**。

## 判断逻辑

它的判断逻辑是一个链表遍历的过程。

- 右边：获取构造函数的 `prototype` 属性。
- 左边：获取实例对象的隐式原型（`__proto__` 或 `Object.getPrototypeOf`）。
- 比较：判断两者引用是否相同。如果不相同，则沿着左边的原型链继续向上找，直到找到或者到达原型链顶端（null）。

## 代码

```js
function myInstanceOf(left, right) {
  // 基本数据直接返回false
  if (
    left === null ||
    (typeof left !== "object" && typeof left !== "function")
  ) {
    return false;
  }

  // 获取对象原型
  let proto = Object.getPrototypeOf(left);

  // 获取构造函数的原型对象
  let prototype = right.prototype;

  // 循环遍历原型链
  while (true) {
    if (proto === null) return false; // 到达原型链顶端
    if (proto === prototype) return true; // 找到
    proto = Object.getPrototypeOf(proto); // 继续向上找
  }
}
```

## 原型链查找过程

当我们访问一个对象 obj 的属性（如 obj.name）时，**JS 引擎** 会遵循以下查找步骤：

- 自身查找：
  首先检查对象 obj 自身是否拥有该属性。如果有，直接返回。

- 原型查找：
  如果自身没有，引擎会通过 `__proto__` 指针去它的原型对象（Prototype Object）中查找。

- 递归向上：
  如果原型对象中也没有，就继续去“原型的原型”中查找。

- 终点：
  这个过程会一直持续，直到找到该属性，或者遇到原型链的顶端 `Object.prototype.__proto__`，它的值是 `null`。

- 结果：
  如果是 null 依然没找到，则返回 undefined。
