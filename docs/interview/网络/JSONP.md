# JSONP

JSONP (JSON with Padding) 是一种在早期的前端开发中，为了解决跨域问题（Cross-Origin）而发明的一种“非官方”技巧（Hack）。

它的核心原理非常简单：虽然 AJAX 请求受同源策略限制，但 HTML 中的 `<script>` 标签是不受限制的。

我们可以把 JSONP 理解为“披着脚本外衣的数据请求”。

## 1. 为什么会有 JSONP？

在 CORS（跨域资源共享）标准出现之前，浏览器有严格的同源策略。

- 你的网站是 a.com。
- 你想请求 b.com/api/data。
- 如果用普通的 Ajax (XMLHttpRequest)，浏览器会直接报错，拦截请求。
  但是 `<script src="http://b.com/lib.js"></script>` 是完全合法的，浏览器允许加载第三方 JS 文件（比如 jQuery CDN、Google Analytics）。
- 于是：能不能把数据写在 JS 文件里，通过 `script` 标签“偷”回来？

## 2. JSONP 是怎么工作的？（全流程演示）

- JSONP 的核心在于：前端定义函数，后端调用函数。
  - 第一步：前端定义一个回调函数

    ```js
    // 前端在全局定义一个函数，准备接收数据。
    // window 上的全局函数
    window.receiveData = function (data) {
      console.log("我收到数据了：", data);
    };
    ```

  - 第二步：前端动态创建 Script 标签

    ```js
    // 前端创建一个 <script> 标签，把地址指向接口，并把函数名当作参数传过去。
    const script = document.createElement("script");
    // 重点：告诉后端，我的回调函数名叫 receiveData
    script.src = "http://api.com/user?callback=receiveData";
    document.body.appendChild(script);
    ```

  - 第三步：后端接收并“包装”数据 (Padding)

    ```js
    // 后端收到请求，发现参数里有 callback=receiveData。
    // 它不会返回纯 JSON { "name": "Jack" }（因为这在 script 标签里会报语法错误）。
    // 它返回的是一段可执行的 JavaScript 代码，把 JSON 数据作为参数“填充”进去：
    // 后端返回的字符串内容：
    receiveData({ name: "Jack", age: 18 });
    ```

  - 第四步：浏览器执行代码
    1.  浏览器下载完这个脚本。
    2.  立即作为 JS 执行它。
    3.  相当于直接执行了 window.receiveData(...)。
    4.  前端定义的函数被触发，拿到了数据。

## 3. JSONP 的致命缺点

1. 只能发 GET 请求：
   因为它是通过 `<script src="...">` 实现的，script 标签本质上就是一次 GET 请求。你无法用 JSONP 发送 POST、PUT、DELETE 请求，也发不了 Body 数据。
1. 安全性问题 (XSS)：
   你完全信任后端返回的代码。如果后端被黑客攻击，返回一段恶意代码（比如读取你的 Cookie 并发送出去），你的页面会毫不犹豫地执行它。

## 4. 为什么在“组件懒加载”里提到了它？

在 Webpack 4 及之前的版本中，用来加载分包 chunk 的核心函数就叫 jsonpFunction。
这是因为懒加载的机制和 JSONP 的机制几乎一模一样：

1. JSONP: 动态插入 script -> 执行远程 JS -> 触发回调 -> 拿到数据。
1. 懒加载: 动态插入 script -> 执行远程 Chunk JS -> 触发 window.webpackJsonp.push -> 拿到组件代码。
