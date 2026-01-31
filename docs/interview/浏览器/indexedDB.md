# indexedDB

## 1. 什么是 indexedDB

indexedDB 是浏览器提供的一种 NoSQL 数据库，可以在 **浏览器** 中存储 **大量结构化数据**。

### SQL VS NoSQL

| 特性     | SQL（关系型）              | NoSQL（非关系型）                 |
| -------- | -------------------------- | --------------------------------- |
| 数据结构 | 表格（行+列），固定 Schema | 灵活多样（文档、键值对、图等）    |
| Schema   | 严格定义，修改成本高       | 无固定结构，随时可加字段          |
| 查询语言 | SQL 语句                   | 各自 API（如 MongoDB 的查询对象） |
| 典型代表 | MySQL、PostgreSQL、Oracle  | MongoDB、Redis、IndexedDB         |
| 扩展方式 | 垂直扩展（加硬件）         | 水平扩展（加机器）                |

> SQL：数据像 Excel 表格，结构固定

> NoSQL：数据像 JSON 对象，结构灵活

## 2. indexedDB 的特点

- 异步 API
- 事务性
- 存储大量数据
- 存储结构化数据
- 存储二进制数据

## 4. 如何使用

```js
// 打开数据库（如果不存在则创建）
// 入参为：数据库名称和版本
const request = indexedDB.open("MyDatabase", 1);

// 1. 初始化/升级数据库结构 (建表)
request.onupgradeneeded = (event) => {
  // 获取数据库实例
  const db = event.target.result;

  // 创建一个名为 'users' 的对象仓库，主键为 'id'
  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "id" });
  }
};

request.onsuccess = (event) => {
  const db = event.target.result;

  // 2. 开启读写事务
  const transaction = db.transaction(["users"], "readwrite");
  //                                    ↑           ↑
  //                          操作哪些表（数组形式） 读写模式 "readonly" / "readwrite"
  // 3. 获取对象仓库（相当于获取表）
  const store = transaction.objectStore("users");

  // 4. 执行操作
  const addRequest = store.add({ id: 1, name: "Alice", age: 25 });

  addRequest.onsuccess = () => {
    console.log("数据写入成功");
  };

  addRequest.onerror = () => {
    console.error("写入失败");
  };
};

request.onerror = (event) => {
  console.error("数据库打开失败", event);
};
```

## 6. 原生 API 有什么缺陷？

1. 基于回调（Callback/Event based）： 没有原生的 `Promise` 支持，容易陷入回调地狱，无法配合 `async/await` 使用，代码逻辑割裂。

2. 样板代码过多： 仅仅写入一条数据就需要处理 `open`、`transaction`、`objectStore` 等多个步骤，非常繁琐。

3. 错误处理麻烦： 需要在 `request`、`transaction` 等多个层级监听 `onerror` 事件，容易遗漏。

4. 版本管理复杂： 所有的 Schema 变更都必须写在 `onupgradeneeded` 中，维护长期的版本迭代逻辑比较痛苦。

## 推荐的封装库及使用

为了解决上述问题，社区主要推荐以下三个库：**idb**、**Dexie.js** 和 **localForage**。

### 1. idb (Google)

- 特点： 极轻量（~1KB），由 Chrome 团队开发。它基本就是给原生 API 套了一层 `Promise`，API 设计与原生保持高度一致。
- 适用场景： 你想完全控制 DB 细节，但想要 `Promise` 语法。

1. 安装

```bash
npm install idb
```

2. 使用

```js
import { openDB } from "idb";

async function demo() {
  // 入参：数据库名称、版本号、升级回调
  const db = await openDB("MyDatabase", 1, {
    upgrade(db) {
      // 创建表
      db.createObjectStore("users", { keyPath: "id" });
    },
  });
  // 写入数据
  await db.put("users", { id: 1, name: "Alice" });
  // 读取数据
  const val = await db.get("users", 1);
  console.log(val);
}
```

### 2. Dexie.js

- 特点： 功能最丰富，API 极其优雅（链式调用），对 TypeScript 支持极好，拥有强大的查询能力（Where 语句）。
- 适用场景： 复杂的离线应用，需要进行多条件查询、复杂索引操作。

1. 安装

```bash
npm install dexie
```

2. 使用

```js
import Dexie from "dexie";

// 创建数据库
const db = new Dexie("MyDatabase");
// 创建表
// ++id 表示自增主键
db.version(1).stores({
  users: "++id, name, age", // 定义索引
});

async function demo() {
  await db.users.add({ name: "Bob", age: 30 });

  // 优雅的查询
  const youngUsers = await db.users.where("age").below(40).toArray();
}
```

### 3. localForage

- 特点： API 极其简单，模仿 localStorage 的 `getItem/setItem`，但在底层异步使用 IndexedDB（降级回退 WebSQL/localStorage）。
- 适用场景： 简单的 Key-Value 存储，不需要复杂的索引和查询，只是为了突破 localStorage 的 5MB 限制。

1. 安装

```bash
npm install localforage
```

2. 使用

```js
import localforage from "localforage";

async function demo() {
  await localforage.setItem("name", "Alice");
  const name = await localforage.getItem("name");
  console.log(name);
}
```

## 面试

被问到 localStorage 和 IndexedDB 的区别时，面试官通常不仅仅是想听简单的 **“大小区别”**，而是想考察我们对 **浏览器性能瓶颈（Event Loop）、数据结构设计** 的理解。

1. **角度一： LocalStorage 的同步阻塞问题**
   - 原理： 当你执行 `localStorage.setItem` 时，它会 **挂起主线程** ，直到写入完成。

   - 后果： 在现代高交互应用中，如果你在 **渲染循环或高频事件**（如 Scroll/Resize）中读写 localStorage，会导致帧率下降，页面卡顿。

   - Vue 场景： 如果你在 Vue 的 `watch` 中监听一个大对象的变化并同步写入 localStorage，会非常消耗性能。

2. **角度二：IndexedDB 的异步与二进制支持**
   - `IndexedDB` 运行在独立的线程（或者说其 IO 操作是异步的），通过事件回调或 `Promise（需封装）`返回结果，不阻塞 UI 渲染。

   - 二进制友好： 它可以直接存储 `Uint8Array`、`Blob` 等二进制数据，无需转换为 Base64 字符串 **（Base64 会增加约 33% 的体积）**。

3. **角度三： 谈谈 工程化最佳实践**（使用封装库）

| 特性     | LocalStorage                                              | IndexedDB                                      |
| -------- | --------------------------------------------------------- | ---------------------------------------------- |
| 存储容量 | 约 5MB (视浏览器而定)                                     | 很大 (通常为磁盘剩余空间的 50%~80%)            |
| API 模式 | 同步 (Synchronous)                                        | 异步 (Asynchronous)                            |
| 数据结构 | 仅支持 String (键值对)                                    | 支持结构化克隆 (对象、文件、Blob、ArrayBuffer) |
| 查询能力 | 只能按 Key 取值                                           | 支持索引 (Index) 和 游标 (Cursor)              |
| 操作难度 | 极简 (setItem, getItem)                                   | 复杂 (事务 Transaction, 请求回调)              |
| 资深评价 | localStorage 仅适合存少量配置；业务数据必须走 IndexedDB。 | 原生 IndexedDB API 很难用，通常需要封装库。    |
