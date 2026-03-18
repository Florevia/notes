# localStorage vs sessionStorage

- Web Storage 本地存储机制
  - localStorage
  - sessionStorage

## 相同与不同

1. 相同点

- 都是本地存储
- 都是同源隔离
- 都只能存 **字符串**，复杂类型要 `JSON.stringify`
- API 基本一致：`setItem` / `getItem` / `removeItem` / `clear`

2. 不同点

- 生命周期不同
  - `localStorage`：永久保存，除非手动删除
  - `sessionStorage`：会话级别，页面关闭后清除

- 作用范围不同
  - `localStorage`：同源下多个标签页共享
  - `sessionStorage`：仅当前 tab 有效，不同 tab 不共享

- 应用场景不同
  - `localStorage`：长期保存用户配置、主题、token（不推荐存敏感信息）
  - `sessionStorage`：临时表单数据、页面级缓存、一次会话状态

## cookie

- 作用范围： 同源文档共享。
- 大小限制： 4KB。
- 数据流向： 同源每次请求都会携带。
- 易用性： 差 (需解析字符串)。
- 典型应用： Session ID, Token (鉴权)。
- API：

## 总结对比

| 特性         | Cookie                    | localStorage                 | sessionStorage         |
| :----------- | :------------------------ | :--------------------------- | :--------------------- |
| **数据流向** | 每次请求都会携带          | 仅存于本地                   | 仅存于本地             |
| **大小限制** | 4KB                       | ~5MB                         | ~5MB                   |
| **生命周期** | 可设过期时间 / 默认会话级 | 永久                         | 标签页关闭即失效       |
| **易用性**   | 差 (需解析字符串)         | 好 (原生 API)                | 好 (原生 API)          |
| **典型应用** | Session ID, Token (鉴权)  | 换肤设置, 购物车数据(未登录) | 表单分步填写, 临时状态 |
