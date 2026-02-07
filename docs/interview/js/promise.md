# promise

## 手写promise

## 手写promise.all

`Promise.all` 接收一个 Promise 实例数组，返回一个新的 Promise。

- 成功机制：只有当数组中所有的 Promise 都成功（Resolved）时，它才返回成功。结果是一个按输入顺序排列的数组。

- 失败机制：只要有任何一个 Promise 失败（Rejected），`Promise.all` 就会立即失败，并返回第一个失败的 Reason。

```js
Promise.myAll = function (promises) {
  return new Promise((resolve, reject) => {
    // 处理非数组或空数组（简单化处理，标准库会将其转为迭代器)
    if (!Array.isArray(promises)) {
      return reject(new TypeError("Argument must be an array"));
    }

    if (promises.length === 0) {
      return resolve([]);
    }

    let res = [];
    let count = 0; // 计数器，记录已成功的 promise 数量
    let l = promises.length;

    promises.forEach((p, index) => {
      // 2. 兼容非 Promise 对象（使用 Promise.resolve 包装）
      Promise.resolve(p)
        .then((value) => {
          // 3. 核心：通过索引 index 赋值，确保结果顺序一致，而非 push 的顺序
          res[index] = value;

          count++;

          if (count === l) {
            // 4. 所有都成功时，resolve 结果数组
            resolve(res);
          }
        })
        .catch((err) => {
          // 5. 只要有一个失败，立即 reject
          reject(err);
        });
    });
  });
};
```

## Promise.allSettled

接收一个 Promise 实例数组，返回状态对象数组。等待每一个 Promise 都完成（无论是成功还是失败）。

```js
// Promise.allSettled 伪代码
Promise.myAllSettled = function (promises) {
  return new Promise((resolve, reject) => {
    // 处理非数组或空数组（简单化处理，标准库会将其转为迭代器)
    if (!Array.isArray(promises)) {
      return reject(new TypeError("Argument must be an array"));
    }

    if (promises.length === 0) {
      return resolve([]);
    }

    let res = [];
    let count = 0;
    let l = promises.length;

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then((res) => {
          res[index] = { status: "fulfilled", value: res };
          count++;
          if (count === l) resolve(res);
        })
        .catch((err) => {
          res[index] = { status: "rejected", reason: err };
          count++;
          if (count === l) resolve(res);
        });
    });
  });
};
```

| 特性     | Promise.all                                   | Promise.allSettled                               |
| :------- | :-------------------------------------------- | :----------------------------------------------- |
| 状态依赖 | 短路效应：只要有一个 rejected，整体立即失败。 | 全员等待：无论成功或失败，都会等待所有任务结束。 |
| 返回时机 | 第一个失败时，或全部成功时。                  | 所有任务都达到“已定型（Settled）”状态。          |
| 返回数据 | 成功值的数组（按顺序）。                      | 状态对象数组，包含 status, value 或 reason。     |
| 容错性   | 弱。适用于“全有或全无”的原子操作。            | 强。适用于互不干扰的独立操作。                   |

## 手写promise.race

`Promise.race` 同样接收 Promise 数组，但它只关心第一个改变状态的实例，无论成功还是失败，只要有一个先到达，就直接返回该实例的结果。

```js
Promise.myRace = function (promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError("Argument must be an array"));
    }

    promises.forEach(p) => {
      // 遍历每个 Promise，谁先完成就用谁的结果
      Promise.resolve(p).then(resolve, reject)
    }
  })
}
```
