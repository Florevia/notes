# Nginx 核心配置详解

## 配置文件结构

Nginx 配置文件是**层级结构**：

```
Main（全局）
  └── events（并发连接）
      └── http（HTTP 服务）
          └── server（虚拟主机）
              └── location（路径规则）
```

**核心理解**：

- 每一层可以嵌套多个子层
- 子层**继承**父层的配置（也可以覆盖）
- 一个 `http` 块可以包含多个 `server`（多个网站）
- 一个 `server` 可以包含多个 `location`（不同 URL 路径的处理）

## 核心配置一览

| 配置块       | 核心配置项                  | 作用                       | 重要性 |
| ------------ | --------------------------- | -------------------------- | ------ |
| **全局**     | worker_processes            | 工作进程数（性能相关）     | ⭐⭐⭐ |
| **events**   | worker_connections          | 最大并发连接数             | ⭐⭐⭐ |
| **http**     | sendfile, keepalive_timeout | 性能优化                   | ⭐⭐   |
| **server**   | listen, server_name, root   | 监听端口、域名、网站根目录 | ⭐⭐⭐ |
| **location** | try_files, proxy_pass       | 文件查找、反向代理         | ⭐⭐⭐ |

## 一、全局块 (Main)

### 作用

影响整个 Nginx 服务器的全局设置。

### 核心配置

#### 1. `worker_processes auto`

**控制工作进程数量**

```nginx
worker_processes auto;
```

**理解**：

- Nginx 是多进程模型：1 个主进程 + N 个工作进程
- `auto`：自动根据 CPU 核心数设置（**推荐**）
- 手动设置：`worker_processes 4;`（4 核 CPU 就设置 4）

---

#### 2. `error_log /var/log/nginx/error.log;`

**错误日志路径**

```nginx
error_log /var/log/nginx/error.log;
```

**作用**：

- Nginx 出错时，错误信息会写入这个文件
- 配置不生效？先查错误日志

**实用技巧**：

```bash
# 查看最新的错误日志
tail -f /var/log/nginx/error.log
```

#### 3. `pid /run/nginx.pid;`

**进程 ID 文件**

```nginx
pid /run/nginx.pid;
```

**作用**：存储 Nginx 主进程的 ID，用于管理 Nginx。

## 二、Events 块

### 作用

控制 Nginx 如何处理网络连接。

### 核心配置

#### 1. `worker_connections 1024;`

**每个工作进程的最大并发连接数**

```nginx
events {
    worker_connections 1024;
}
```

**理解**：

- 单个工作进程最多同时处理 1024 个连接
- **理论最大并发** = `worker_processes` × `worker_connections`
  - 例如：4 个进程 × 1024 = 4096 个并发

**常用配置**：

- 小型网站/测试：`1024`（默认）
- 中型网站：`4096` - `8192`
- 大型网站：`10240` - `65535`

## 三、HTTP 块

### 作用

HTTP 服务的核心配置，包含所有网站相关设置。

### 核心配置

#### 日志配置

##### 1. `log_format main '...'`

**自定义日志格式**

```nginx
log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';
```

**核心变量解释**：

| 变量               | 含义           | 示例                      |
| ------------------ | -------------- | ------------------------- |
| `$remote_addr`     | 客户端 IP 地址 | `192.168.1.100`           |
| `$time_local`      | 访问时间       | `09/Jan/2026:14:30:25`    |
| `$request`         | 请求内容       | `GET /api/users HTTP/1.1` |
| `$status`          | 响应状态码     | `200`, `404`, `500`       |
| `$http_user_agent` | 浏览器标识     | `Mozilla/5.0 ...`         |

**日志示例输出**：

```
192.168.1.100 - - [09/Jan/2026:14:30:25 +0800] "GET /index.html HTTP/1.1" 200 1024 "-" "Chrome/90.0"
```

##### 2. `access_log /var/log/nginx/access.log main;`

**访问日志路径**

```nginx
access_log  /var/log/nginx/access.log  main;
```

**作用**：记录所有访问请求（谁、什么时候、访问了什么）

**实用技巧**：

```bash
# 实时查看访问日志
tail -f /var/log/nginx/access.log

# 统计访问最多的 IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

---

#### 性能优化配置

##### 1. **高效文件传输**

```nginx
sendfile on;
```

**作用**：

- 启用 Linux 零拷贝技术
- 传输静态文件（图片、CSS、JS）时更快
- **新手建议**：开启，不要关闭

##### 2. **长连接超时时间**

```nginx
keepalive_timeout 65;
```

**作用**：

- 保持 TCP 连接 65 秒不断开
- 同一连接可以发送多个 HTTP 请求
- 减少重复建立连接的开销

#### MIME 类型配置

##### 1. **加载文件类型映射表**

```nginx
include /etc/nginx/mime.types;
default_type application/octet-stream;
```

**作用**：

- 告诉浏览器如何处理不同文件
- `.html` → 网页（浏览器渲染）
- `.jpg` → 图片（浏览器显示）
- `.zip` → 压缩包（浏览器下载）

## 四、Server 块

### 作用

定义一个虚拟主机（一个网站）。

### 核心配置

#### 1. **监听端口**

```nginx
listen 80;           # 监听 IPv4 的 80 端口
listen [::]:80;      # 监听 IPv6 的 80 端口
```

**理解**：

- `80`：HTTP 默认端口（浏览器访问 `http://example.com` 会自动连接 80 端口）
- `443`：HTTPS 默认端口
- 自定义端口：`listen 8080;`（访问时需要指定：`http://example.com:8080`）

#### 2. **服务器域名**

```nginx
server_name localhost;
```

**作用**：指定这个 server 块响应哪些域名的请求

**常见用法**：

```nginx
server_name example.com;                  # 单个域名
server_name www.example.com example.com;  # 多个域名
server_name *.example.com;                # 泛域名（支持所有子域名）
```

**实战场景**：

```nginx
# 网站 A
server {
    listen 80;
    server_name www.site-a.com;
    root /var/www/site-a;
}

# 网站 B
server {
    listen 80;
    server_name www.site-b.com;
    root /var/www/site-b;
}
```

同一台服务器，不同域名访问不同网站。

#### 3. **网站根目录**

```nginx
root /www/lilin-project/dist;
```

**作用**：静态文件存放的根路径

**示例**：

- 请求：`http://localhost/index.html`
- Nginx 查找：`/www/lilin-project/dist/index.html`

- 请求：`http://localhost/css/style.css`
- Nginx 查找：`/www/lilin-project/dist/css/style.css`

## 五、Location 块

#### 定义不同 URL 路径的处理规则。

```nginx
location [ 修饰符 ] /uri/ {
    ...
}
```

**匹配优先级**（从高到低）：

| 修饰符 | 含义                     | 示例                            | 优先级 |
| :----- | :----------------------- | :------------------------------ | :----- |
| `=`    | 精确匹配                 | `location = /login { }`         | 最高   |
| `^~`   | 前缀匹配（不检查正则）   | `location ^~ /static/ { }`      | 高     |
| `~`    | 正则匹配（区分大小写）   | `location ~ \.php$ { }`         | 中     |
| `~*`   | 正则匹配（不区分大小写） | `location ~* \.(jpg\|png)$ { }` | 中     |
| 无     | 普通前缀匹配             | `location / { }`                | 低     |


### 作用

#### 1. 静态资源服务

静态资源就是内容固定、不用程序现算的文件，比如 HTML、CSS、JS、图片、字体、视频。前端项目（Vue、React）打包之后，生成的就是一堆静态文件，放到服务器的某个目录里，由 Nginx 直接读出来发给浏览器。

#### 2. 反向代理服务

- 统一入口：前端和后端都挂在同一个域名下，前端请求 `/api` 不会遇到跨域问题。
- 隐藏后端：后端程序只监听 127.0.0.1，外网根本连不上，只能经过 Nginx，更安全。
- 一个服务器跑多个服务：`/api` 转给 Node，`/admin` 转给 Python，`/chat` 转给另一个程序，对外只开 80 和 443 两个端口。

##### 路径拼接规则

| `proxy_pass` 配置             | 客户端请求        | 转发到后端                                          |
| ----------------------------- | ----------------- | --------------------------------------------------- |
| `proxy_pass http://backend;`  | `/prod-api/users` | `http://backend/prod-api/users`（保留 `/prod-api`） |
| `proxy_pass http://backend/;` | `/prod-api/users` | `http://backend/users`（去掉 `/prod-api`）          |


##### **完整代理头配置**（推荐）：

```nginx
location /api/ {
    proxy_pass http://backend_server/;

    # 传递原始域名
    proxy_set_header Host $host;

    # 传递客户端真实 IP
    proxy_set_header X-Real-IP $remote_addr;

    # 传递代理链（多层代理时）
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # 传递原始协议（http/https）
    proxy_set_header X-Forwarded-Proto $scheme;
}
```


#### 3. 负载均衡服务

要注意：多台后端之间不能各存各的登录状态，否则用户这次在 A 登录，下次分到 B 就变成没登录了。一般的做法是把会话存到 Redis 这类共享存储里，或者用 JWT 令牌。

#### 4. https加密

为什么把 HTTPS 放在 Nginx 上做（TLS 终止）

证书只在 Nginx 配一次，后面有多少个后端程序都不用管加密
后端代码更简单，跟 Nginx 之间在本机或内网走普通 HTTP 就行
证书续期、升级加密算法都只改一个地方

最常用的是 Let's Encrypt 的免费证书，有效期 90 天。用 certbot 工具一条命令就能申请，还能自动帮你改好 Nginx 配置并定时续期：

```
sudo certbot --nginx -d example.com
```

#### 5. 缓存

- 浏览器缓存：告诉浏览器静态文件可以存多久，期间再访问直接用本地的，连请求都不发。前端打包出来的文件名一般带哈希值（比如 app.3f9a1c.js），内容变了文件名就变，所以可以放心缓存很久。

- 代理缓存：Nginx 把后端的回复存一份，下次同样的请求直接返回，不打扰后端。适合不常变的接口，比如商品列表、文章详情。

#### 6. 压缩

#### 7. 限流

## 实战案例

### 案例 1：部署 Vue/React 前端项目

```nginx
server {
    listen 80;
    server_name www.myapp.com;
    root /var/www/myapp/dist;

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存 30 天
    location ~* \.(jpg|png|gif|css|js)$ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### 案例 2：前后端分离（Nginx 作为反向代理）

```nginx
server {
    listen 80;
    server_name www.myapp.com;
    root /var/www/myapp/dist;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理（解决跨域）
    location /api/ {
        proxy_pass http://localhost:3000/;  # 后端服务器地址
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**工作流程**：

1. 用户访问 `http://www.myapp.com` → Nginx 返回前端页面
2. 前端发起 API 请求 `http://www.myapp.com/api/users`
3. Nginx 转发到 `http://localhost:3000/users`
4. 后端处理请求，返回数据
5. Nginx 转发给前端

**优势**：

- ✅ 解决跨域问题
- ✅ 前后端统一域名
- ✅ 隐藏后端服务器真实地址

### 案例 3：配置多个网站

```nginx
# 网站 A
server {
    listen 80;
    server_name site-a.com www.site-a.com;
    root /var/www/site-a;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 网站 B
server {
    listen 80;
    server_name site-b.com www.site-b.com;
    root /var/www/site-b;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**说明**：一台服务器，不同域名访问不同网站。

## 常用命令

```bash
# 启动
nginx
# 指定配置文件启动
nginx -c /etc/nginx/nginx.conf

# 检查配置文件语法（改配置后必做）
nginx -t

# 重载配置（不中断服务，热加载）
nginx -s reload

# 优雅停止（处理完当前请求再退出）
nginx -s quit

# 立即停止
nginx -s stop

# 重新打开日志文件（配合 logrotate，不重启服务）
nginx -s reopen

# 查看版本 / 编译模块
nginx -v
nginx -V

# 查看进程
ps aux | grep nginx

# 查看错误 / 访问日志
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## 常见问题

### Q1：修改配置后不生效？

**解决步骤**：

```bash
# 1. 检查配置语法
nginx -t

# 2. 重载配置
nginx -s reload

# 3. 查看错误日志
tail -f /var/log/nginx/error.log
```

### Q2：如何解决跨域问题？

**方法 1：反向代理**（推荐）

```nginx
location /api/ {
    proxy_pass http://backend_server/;
    proxy_set_header Host $host;
}
```

**方法 2：添加 CORS 头**

```nginx
location /api/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    proxy_pass http://backend_server/;
}
```

### Q3：如何配置 HTTPS？

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;        # 证书
    ssl_certificate_key /path/to/key.pem;     # 私钥

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}

# HTTP 自动跳转 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

## 进阶优化（可选）

### 1. 启用 Gzip 压缩

```nginx
http {
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
}
```

**作用**：压缩响应内容，减少传输大小，加快加载速度。

---

### 2. 限制请求频率（防止 DDoS）

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend/;
        }
    }
}
```

**作用**：限制同一 IP 每秒最多 10 个请求，防止恶意攻击。

---

### 3. 静态资源缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

**作用**：静态资源缓存 30 天，减少重复请求。

## 参考资料

- [Nginx 官方文档](http://nginx.org/en/docs/)
- [Nginx 配置最佳实践](https://www.nginx.com/resources/wiki/start/)
- [免费 SSL 证书 - Let's Encrypt](https://letsencrypt.org/)

## 配置模板（快速上手）

### 静态网站模板

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;
}
```

### Vue/React 应用模板

```nginx
server {
    listen 80;
    server_name myapp.com;
    root /var/www/myapp/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|jpg|png)$ {
        expires 30d;
    }
}
```

### 前后端分离模板

```nginx
server {
    listen 80;
    server_name myapp.com;
    root /var/www/myapp/dist;

    # 前端
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
