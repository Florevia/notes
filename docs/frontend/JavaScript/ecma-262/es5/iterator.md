# 可迭代协议 & 迭代器协议

- 可迭代协议（Iterable Protocol）
  - 可迭代对象
- 迭代器协议（Iterator Protocol）
  - 迭代器对象

##

```js
const iterable = {
  [Symbol.iterator] () {
   return next() {
      return {
        value: 1,
        done: false
      }
    }
  }
}
```

```ts
interface Iterator<T> {
  next(): IteratorResult<T>;
}

interface IteratorResult<T> {
  value: T;
  done: boolean;
}
```

```js
let value = 1;
const iterator = {
  next() {
    return {
      value: value > 3 ? undefined : value++,
      done: value++ > 3,
    };
  },
};

iterator.next();
```
