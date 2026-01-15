# Set、Map、WeakSet 和 WeakMap 的区别

## Set vs WeakSet

### Set（集合）

- 键的类型：可以存储任何类型的值（原始值或对象引用）
- 引用类型：强引用，即使外部没有引用，Set 中的对象也不会被垃圾回收
- 可迭代：可以使用 for...of、forEach 等遍历
- size 属性：有 size 属性，可以获取元素数量
- 常用方法：add(), delete(), has(), clear(), values(), entries()

```js
const set = new Set();
let obj = { name: "test" };
set.add(obj);
set.add(1);
set.add("hello");

console.log(set.size); // 3
set.forEach((item) => console.log(item));
```

### WeakSet（弱集合）

- 键的类型：只能存储对象引用（不能存储原始值）
- 引用类型：弱引用，如果外部没有其他引用，对象会被垃圾回收
- 不可迭代：无法遍历，没有 forEach、for...of 等
- 无 size 属性：无法获取元素数量
- 常用方法：只有 add(), delete(), has() 三个方法

```js
const weakSet = new WeakSet();
let obj = { name: "test" };
weakSet.add(obj);
// weakSet.add(1); // ❌ TypeError: Invalid value used in weak set

console.log(weakSet.has(obj)); // true
obj = null; // obj 会被垃圾回收
```

## Map vs WeakMap

### Map（映射）

- 键的类型：键可以是任何类型（原始值或对象）
- 引用类型：强引用，键和值都不会被自动垃圾回收
- 可迭代：可以使用 for...of、forEach 等遍历
- size 属性：有 size 属性
- 常用方法：set(), get(), delete(), has(), clear(), keys(), values(), entries()

```js
const map = new Map();
let keyObj = { id: 1 };
map.set(keyObj, "value1");
map.set("stringKey", "value2");
map.set(123, "value3");

console.log(map.size); // 3
console.log(map.get(keyObj)); // 'value1'

for (let [key, value] of map) {
  console.log(key, value);
}
```

### WeakMap（弱映射）

- 键的类型：键只能是对象（不能是原始值），值可以是任意类型
- 引用类型：对键是弱引用，如果键对象没有其他引用，会被垃圾回收
- 不可迭代：无法遍历，没有 forEach、for...of 等
- 无 size 属性：无法获取元素数量
- 常用方法：只有 set(), get(), delete(), has() 四个方法

```js
const weakMap = new WeakMap();
let keyObj = { id: 1 };
weakMap.set(keyObj, "some value");
// weakMap.set('string', 'value'); // ❌ TypeError: Invalid value used as weak map key

console.log(weakMap.get(keyObj)); // 'some value'
keyObj = null; // 键对象会被垃圾回收，对应的键值对也会消失
```

## 、核心区别总结

| 特性          | Set          | WeakSet     | Map          | WeakMap          |
| :------------ | :----------- | :---------- | :----------- | :--------------- |
| **存储内容**  | 值的集合     | 对象的集合  | 键值对       | 键值对           |
| **键/值类型** | 任意类型     | 仅对象      | 键值都可任意 | 键仅对象，值任意 |
| **引用方式**  | 强引用       | 弱引用      | 强引用       | 键为弱引用       |
| **可迭代性**  | ✅ 可迭代    | ❌ 不可迭代 | ✅ 可迭代    | ❌ 不可迭代      |
| **size 属性** | ✅ 有        | ❌ 无       | ✅ 有        | ❌ 无            |
| **垃圾回收**  | 不会自动回收 | 自动回收    | 不会自动回收 | 键自动回收       |

## 使用场景

### Set 使用场景

1. 数组去重

```js
const arr = [1, 2, 2, 3, 3, 4];
const uniqueArr = [...new Set(arr)]; // [1, 2, 3, 4]
```

2. 判断元素是否存在

```js
const roles = new Set(["admin", "user", "guest"]);
if (roles.has("admin")) {
  console.log("是管理员");
}
```

### WeakSet 使用场景

1. 标记对象，防止内存泄漏

```js
const disabledElements = new WeakSet();

function disableElement(element) {
  disabledElements.add(element);
}

function isDisabled(element) {
  return disabledElements.has(element);
}
```

2. 防止对象被多次执行某操作

```js
const executedObjects = new WeakSet();

function executeOnce(obj) {
  if (executedObjects.has(obj)) {
    return;
  }
  executedObjects.add(obj);
  // 执行操作...
}
```

### Map 使用场景

1. 对象作为键

```js
const userRoles = new Map();
const user1 = { name: "Alice" };
const user2 = { name: "Bob" };
userRoles.set(user1, "admin");
userRoles.set(user2, "user");
```

2. 保持插入顺序的键值对存储

```js
const orderedData = new Map([
  ["first", 1],
  ["second", 2],
  ["third", 3],
]);
```

### WeakMap 使用场景

1. 存储 DOM 节点的私有数据（避免内存泄漏）

```js
const privateData = new WeakMap();

class Component {
  constructor(element) {
    privateData.set(element, {
      clickCount: 0,
      lastClick: null,
    });
  }

  handleClick(element) {
    const data = privateData.get(element);
    data.clickCount++;
    data.lastClick = new Date();
  }
}
```

2. 缓存计算结果

```js
const cache = new WeakMap();

function expensiveOperation(obj) {
if (cache.has(obj)) {
return cache.get(obj);
}
const result = /_ 复杂计算 _/ obj.value \* 2;
cache.set(obj, result);
return result;
}
```

### 内存管理示例

强引用示例（Map/Set）

```js
let map = new Map();
let key = { name: "test" };
map.set(key, "value");
key = null; // map 中仍然持有该对象的引用，不会被垃圾回收
console.log(map.size); // 1
```

弱引用示例（WeakMap/WeakSet）

```js
let weakMap = new WeakMap();
let weakKey = { name: "test" };
weakMap.set(weakKey, "value");
weakKey = null; // 对象可以被垃圾回收，weakMap 中的条目也会消失
// 无法检查 size，因为 WeakMap 没有 size 属性
```

## 选择建议

- 使用 Set：需要存储唯一值、需要遍历、需要知道集合大小
- 使用 WeakSet：只存储对象、不需要遍历、需要自动垃圾回收（如标记 DOM 节点）
- 使用 Map：需要键值对存储、键可以是任意类型、需要遍历
- 使用 WeakMap：键是对象、不需要遍历、需要自动垃圾回收（如存储 DOM 元数据、私有属性）

核心原则：如果需要自动内存管理且只处理对象，使用 Weak\* 版本；否则使用普通版本。
