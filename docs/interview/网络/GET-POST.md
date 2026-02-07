# GET vs POST

## 标准与语义层面（最核心的区别）

- 语义（约定俗成）：
  - GET：用于获取资源。它是“只读”的，不应该对服务器产生副作用（Safe & Idempotent）。
  - POST：用于提交数据。它通常用于创建新资源或修改现有资源，会对服务器状态产生改变。

- 幂等性：
  - GET 是幂等的：请求一次和请求一万次，对资源的影响是一样的（都不会改变资源）。
  - POST 不是幂等的：请求一次创建一个订单，请求两次可能就会创建两个订单

## 浏览器行为与实际应用层面

- 数据传输方式：
  - GET：参数拼接到 URL 后面（Query String）。
  - POST：参数放在请求体中。

- 数据长度限制：
  - GET：受限于浏览器和服务器对 URL 长度的限制。
  - POST：理论上没有限制，主要取决于服务器配置。

- 缓存与历史：
  - GET：可以被浏览器缓存，做书签，参数会保留在浏览器历史记录中。
  - POST：默认不会被缓存，不能作为书签。

- 数据编码：
  - GET：只能进行 URL 编码，只接受 ASCII 字符。
  - POST：支持多种编码方式（application/x-www-form-urlencoded、multipart/form-data、application/json），支持二进制数据（可以上传文件）。

## 安全性层面

- 表面安全： GET 的参数直接暴露在 URL 上。POST 参数在 Body 里，相对隐蔽。

- 实质安全： 如果不使用 HTTPS，两者在网络传输中都是明文的，对于抓包工具来说没有区别，都是不安全的。

## demo

post

```js
fetch("https://example.com/api", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "John",
    age: 30,
  }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

get

```js
fetch("https://example.com/api")
  .then((res) => res.json())
  .then((data) => console.log(data));
```
