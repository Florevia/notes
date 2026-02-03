# Lodash 常用方法

Lodash 是一个一致性、模块化、高性能的 JavaScript 实用工具库。在面试和实际开发中，以下方法最为常用。

## 1. 数组 (Array)

### `_.chunk(array, [size=1])`

将数组拆分成多个 `size` 长度的区块，并组成一个新数组。

```js
_.chunk(["a", "b", "c", "d"], 2);
// => [['a', 'b'], ['c', 'd']]
```

### `_.flattenDeep(array)`

将多层嵌套数组完全展平（递归）。

```js
_.flattenDeep([1, [2, [3, [4]], 5]]);
// => [1, 2, 3, 4, 5]
```

### `_.uniq(array)`

数组去重（创建一个去重后的新数组）。

```js
_.uniq([2, 1, 2]);
// => [2, 1]
```

### `_.difference(array, [values])`

创建一个排除掉所有给定值的新数组（差集）。

```js
_.difference([2, 1], [2, 3]);
// => [1]
```

## 2. 对象 (Object)

### `_.get(object, path, [defaultValue])`

安全地获取嵌套对象的值。如果路径不存在，返回 `defaultValue`。

```js
const object = { a: [{ b: { c: 3 } }] };
_.get(object, "a[0].b.c");
// => 3
_.get(object, "a.b.c", "default");
// => 'default'
```

### `_.cloneDeep(value)`

深拷贝（递归拷贝）。

```js
const objects = [{ a: 1 }, { b: 2 }];
const deep = _.cloneDeep(objects);
console.log(deep[0] === objects[0]);
// => false
```

### `_.merge(object, [sources])`

递归合并来源对象的自身和继承的可枚举属性到目标对象。

```js
const object = {
  a: [{ b: 2 }, { d: 4 }],
};
const other = {
  a: [{ c: 3 }, { e: 5 }],
};
_.merge(object, other);
// => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
```

### `_.pick(object, [paths])`

创建一个从 `object` 中选中属性的对象。

```js
const object = { a: 1, b: "2", c: 3 };
_.pick(object, ["a", "c"]);
// => { 'a': 1, 'c': 3 }
```

### `_.omit(object, [paths])`

反向版 `pick`，创建一个忽略掉选中属性的对象。

```js
const object = { a: 1, b: "2", c: 3 };
_.omit(object, ["a", "c"]);
// => { 'b': '2' }
```

## 3. 函数 (Function)

### `_.debounce(func, [wait=0], [options={}])`

**防抖**：该函数会从上一次被调用后，延迟 `wait` 毫秒后调用 `func`。

```js
// 避免窗口在变动时出现昂贵的计算开销。
jQuery(window).on("resize", _.debounce(calculateLayout, 150));
```

### `_.throttle(func, [wait=0], [options={}])`

**节流**：在 `wait` 秒内最多执行 `func` 一次。

```js
// 避免在滚动时过分的更新定位
jQuery(window).on("scroll", _.throttle(updatePosition, 100));
```

### `_.once(func)`

创建一个只能调用一次的函数。重复调用返回第一次的结果。

```js
const initialize = _.once(createApplication);
initialize();
initialize();
// `createApplication` 只被执行一次
```

## 4. 实用工具 (Util) / 集合 (Collection)

### `_.isEqual(value, other)`

执行深比较来确定两者的值是否相等。

```js
const object = { a: 1 };
const other = { a: 1 };
_.isEqual(object, other);
// => true
console.log(object === other);
// => false
```

### `_.isEmpty(value)`

检查值是否为空（例如空对象、空数组、空 Map/Set）。

```js
_.isEmpty(null); // => true
_.isEmpty({}); // => true
_.isEmpty([]); // => true
_.isEmpty({ a: 1 }); // => false
```

### `_.groupBy(collection, [iteratee=_.identity])`

创建一个对象，key 是经 iteratee 处理的结果，value 是产生该 key 的元素数组。

```js
_.groupBy([6.1, 4.2, 6.3], Math.floor);
// => { '4': [4.2], '6': [6.1, 6.3] }
```

## 面试高频手写题

面试中常考手写实现的 Lodash 方法：

1. `_.get`
2. `_.debounce` / `_.throttle`
3. `_.cloneDeep`
4. `_.flattenDeep`
