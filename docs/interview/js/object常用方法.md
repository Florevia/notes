# Object 常用方法

## 1. 遍历与转换

### Object.keys(obj) / Object.values(obj) / Object.entries(obj)

用于遍历对象的可枚举属性。

- `Object.keys(obj)`: 返回属性名数组。
- `Object.values(obj)`: 返回属性值数组。
- `Object.entries(obj)`: 返回 `[key, value]` 键值对数组。

### Object.fromEntries(iterable)

`Object.entries()` 的逆操作，将键值对列表转换为对象。常用于 Map 转对象或数组过滤后转回对象。

```javascript
const entries = [
  ["name", "Bob"],
  ["age", 30],
];
const obj = Object.fromEntries(entries);
// { name: "Bob", age: 30 }

// 配合 Object.entries 过滤属性
const user = { a: 1, b: 2, c: 3 };
const filtered = Object.fromEntries(
  Object.entries(user).filter(([key, val]) => val > 1)
);
// { b: 2, c: 3 }
```

## 2. 属性控制与合并

### Object.assign(target, ...sources)

将所有 **可枚举** 属性的值从一个或多个源对象复制到目标对象。它执行的是 **浅拷贝**。

```javascript
const target = { a: 1 };
const source1 = { b: 2 };
const source2 = { c: 3 };

const result = Object.assign(target, source1, source2);
console.log(result); // { a: 1, b: 2, c: 3 }
// 注意：target 自身也会被修改
```

### Object.defineProperty(obj, prop, descriptor)

在一个对象上定义一个新属性，或修改一个现有属性（可配置性、可枚举性、可写性）。

```javascript
const user = {};
Object.defineProperty(user, "name", {
  value: "Alice",
  writable: false, // 不可写
  enumerable: true, // 可枚举
  configurable: false, // 不可删除/重新配置
});

user.name = "Bob"; // 严格模式下报错，非严格模式无视
console.log(user.name); // "Alice"
```

### Object.hasOwn(obj, prop) vs obj.hasOwnProperty(prop)

推荐使用 ES2022 的 `Object.hasOwn(obj, prop)` 替代 `obj.hasOwnProperty(prop)`，更加安全（防止对象原型被修改或对象没有原型）。

```javascript
const obj = Object.create(null); // 无原型对象
obj.id = 123;

// obj.hasOwnProperty("id"); // 报错：obj.hasOwnProperty is not a function
console.log(Object.hasOwn(obj, "id")); // true
```

## 3. 原型链操作

### Object.create(proto, [propertiesObject])

使用指定的原型对象和属性创建一个新对象。这是实现继承的重要方法。

```javascript
const proto = {
  greet: function () {
    console.log("Hi");
  },
};
const obj = Object.create(proto);

obj.greet(); // "Hi"
console.log(Object.getPrototypeOf(obj) === proto); // true
```

### Object.getPrototypeOf(obj) / Object.setPrototypeOf(obj, prototype)

获取或设置对象的原型。

```javascript
const a = {};
const b = {};
Object.setPrototypeOf(a, b); // a.__proto__ = b
console.log(Object.getPrototypeOf(a) === b); // true
```

## 4. 冻结与密封 (不可变性)

### Object.freeze(obj)

**冻结** 对象：不能添加新属性、删除旧属性、修改现有属性值。**最高级别的不可变**。

> 嵌套对象不会被冻结，需要递归冻结

```javascript
const obj = { prop: 42 };
Object.freeze(obj);

obj.prop = 33; // 无效
console.log(Object.isFrozen(obj)); // true
```

### Object.seal(obj)

**密封** 对象：不能添加、删除属性，但 **可以修改** 现有属性的值。

```javascript
const obj = { prop: 42 };
Object.seal(obj);

obj.prop = 33; // 允许修改
delete obj.prop; // 无效
console.log(Object.isSealed(obj)); // true
```

## 5. 比较

### Object.is(value1, value2)

判断两个值是否为同一个值。
它与 `===` 基本相同，但在处理 `NaN` 和 `+0/-0` 时更准确。

```javascript
console.log(NaN === NaN); // false
console.log(Object.is(NaN, NaN)); // true

console.log(+0 === -0); // true
console.log(Object.is(+0, -0)); // false
```
