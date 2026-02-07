# XMLHttpRequest 的 readyState 属性

XMLHttpRequest 对象有一个 readyState 属性，表示请求的当前状态，它有以下 5 个可能的值：

1. 0 (UNSENT) : 代理被创建，但尚未调用 open() 方法
2. 1 (OPENED) : open() 方法已经被调用
3. 2 (HEADERS_RECEIVED) : send() 方法已经被调用，并且头部和状态已经可获得
4. 3 (LOADING) : 下载中； responseText 属性已经包含部分数据
5. 4 (DONE) : 下载操作已完成

```js
const xhr = new XMLHttpRequest();
// 0 - UNSENT：xhr 对象已创建，但还没调用 open()

xhr.open("GET", "https://api.example.com/data");
// 1 - OPENED：open() 已调用，可以设置请求头

xhr.send({
  name: "John",
  age: 30,
});
// 2 - HEADERS_RECEIVED：send() 已调用，响应头已收到
// 3 - LOADING：正在下载响应体
// 4 - DONE：请求完成（成功或失败）
```

---

## 响应状态码

- 1xx ｜信息性 | 请求已接收，继续处理
- 2xx ｜成功 | 请求已成功处理
- 3xx ｜重定向 | 需要进一步操作
- 4xx ｜客户端错误 | 请求有问题
- 5xx ｜服务器错误 | 服务器处理出错

### 2xx

- 200 ｜ OK ｜请求成功 ｜ GET 请求成功返回数据
- 201 ｜ Created ｜资源已创建 ｜ POST 创建新用户
- 204 ｜ No Content ｜成功但无返回内容 ｜删除操作

### 3xx

- 301 ｜ Moved Permanently ｜永久重定向 ｜网站换域名
- 302 ｜ Found ｜临时重定向 ｜临时跳转
- 304 ｜ Not Modified ｜未修改 ｜浏览器缓存有效

### 4xx

- 400 ｜ Bad Request ｜请求错误 ｜ JSON 格式错误
- 401 ｜ Unauthorized ｜未授权 ｜需要登录
- 403 ｜ Forbidden ｜禁止访问 ｜权限不足
- 404 ｜ Not Found ｜未找到 ｜资源不存在
- 405 ｜ Method Not Allowed ｜方法不被允许 ｜用 POST 请求只支持 GET 的接口
- 408 ｜ Request Timeout ｜请求超时 ｜请求超时
- 409 ｜ Conflict ｜冲突 ｜用户名已被注册
- 422 ｜ Unprocessable Entity ｜参数验证失败｜ POST/PUT 请求参数错误
- 429 ｜ Too Many Requests ｜请求过多 ｜请求过于频繁

### 5xx

- 500 ｜ Internal Server Error ｜服务器错误 ｜代码 bug、数据库挂了
- 502 ｜ Bad Gateway ｜错误网关 ｜ Nginx 无法连接后端服务
- 503 ｜ Service Unavailable ｜服务不可用 ｜服务器过载或维护中
- 504 ｜ Gateway Timeout ｜网关超时 ｜后端响应太慢
