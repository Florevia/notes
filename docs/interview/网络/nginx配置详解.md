# Nginx 核心配置详解（初学者版）

## 快速导航

- [配置文件结构](#配置文件结构)
- [核心配置一览](#核心配置一览)
- [五大配置块详解](#一全局块-main)
- [实战案例](#实战案例)

---

## 配置文件结构

Nginx 配置文件是**层级结构**，就像俄罗斯套娃：

```
全局配置 (Main)                    ← 影响整个 Nginx
  │
  ├─ events                        ← 控制并发连接
  │
  └─ http                          ← HTTP 服务配置
       │
       └─ server                   ← 一个网站/虚拟主机
            │
            └─ location            ← 路径匹配规则
```

**核心理解**：

- 每一层可以嵌套多个子层
- 子层**继承**父层的配置（也可以覆盖）
- 一个 `http` 块可以包含多个 `server`（多个网站）
- 一个 `server` 可以包含多个 `location`（不同 URL 路径的处理）

---

## 核心配置一览

### 🎯 初学者必须掌握的核心配置

| 配置块       | 核心配置项                      | 作用                       | 重要性 |
| ------------ | ------------------------------- | -------------------------- | ------ |
| **全局**     | `worker_processes`              | 工作进程数（性能相关）     | ⭐⭐⭐ |
| **events**   | `worker_connections`            | 最大并发连接数             | ⭐⭐⭐ |
| **http**     | `sendfile`, `keepalive_timeout` | 性能优化                   | ⭐⭐   |
| **server**   | `listen`, `server_name`, `root` | 监听端口、域名、网站根目录 | ⭐⭐⭐ |
| **location** | `try_files`, `proxy_pass`       | 文件查找、反向代理         | ⭐⭐⭐ |

---

## 一、全局块 (Main)

### 作用

影响整个 Nginx 服务器的全局设置。

### 核心配置

#### 1. `worker_processes auto;`

**控制工作进程数量**

```nginx
worker_processes auto;
```

**理解**：

- Nginx 是多进程模型：1 个主进程 + N 个工作进程
- `auto`：自动根据 CPU 核心数设置（**推荐**）
- 手动设置：`worker_processes 4;`（4 核 CPU 就设置 4）

**新手建议**：保持 `auto` 即可，无需修改。

---

#### 2. `error_log /var/log/nginx/error.log;`

**错误日志路径**

```nginx
error_log /var/log/nginx/error.log;
```

**作用**：

- Nginx 出错时，错误信息会写入这个文件
- 配置不生效？先查错误日志！

**实用技巧**：

```bash
# 查看最新的错误日志
tail -f /var/log/nginx/error.log
```

---

#### 3. `pid /run/nginx.pid;`

**进程 ID 文件**

```nginx
pid /run/nginx.pid;
```

**作用**：存储 Nginx 主进程的 ID，用于管理 Nginx。

**新手建议**：默认配置即可，无需修改。

---

## 二、Events 块

### 作用

控制 Nginx 如何处理网络连接。

### 核心配置

#### `worker_connections 1024;`

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

---

## 三、HTTP 块

### 作用

HTTP 服务的核心配置，包含所有网站相关设置。

### 核心配置

#### 1. 日志配置

##### `log_format main '...'`

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

##### `access_log /var/log/nginx/access.log main;`

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

#### 2. 性能优化配置

##### `sendfile on;`

**高效文件传输**

```nginx
sendfile on;
```

**作用**：

- 启用 Linux 零拷贝技术
- 传输静态文件（图片、CSS、JS）时更快
- **新手建议**：开启，不要关闭

##### `keepalive_timeout 65;`

**长连接超时时间**

```nginx
keepalive_timeout 65;
```

**作用**：

- 保持 TCP 连接 65 秒不断开
- 同一连接可以发送多个 HTTP 请求
- 减少重复建立连接的开销

**通俗理解**：

- 就像打电话，聊完一个话题不挂断，继续聊下一个（而非每次都重新拨号）

---

#### 3. MIME 类型配置

##### `include /etc/nginx/mime.types;`

**加载文件类型映射表**

```nginx
include /etc/nginx/mime.types;
default_type application/octet-stream;
```

**作用**：

- 告诉浏览器如何处理不同文件
- `.html` → 网页（浏览器渲染）
- `.jpg` → 图片（浏览器显示）
- `.zip` → 压缩包（浏览器下载）

**新手建议**：保持默认，无需修改。

---

## 四、Server 块（⭐ 核心）

### 作用

定义一个虚拟主机（一个网站）。

### 核心配置

#### 1. `listen 80;`

**监听端口**

```nginx
listen 80;           # 监听 IPv4 的 80 端口
listen [::]:80;      # 监听 IPv6 的 80 端口
```

**理解**：

- `80`：HTTP 默认端口（浏览器访问 `http://example.com` 会自动连接 80 端口）
- `443`：HTTPS 默认端口
- 自定义端口：`listen 8080;`（访问时需要指定：`http://example.com:8080`）

---

#### 2. `server_name localhost;`

**服务器域名**

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

---

#### 3. `root /www/lilin-project/dist;`

**网站根目录**

```nginx
root /www/lilin-project/dist;
```

**作用**：静态文件存放的根路径

**示例**：

- 请求：`http://localhost/index.html`
- Nginx 查找：`/www/lilin-project/dist/index.html`

- 请求：`http://localhost/css/style.css`
- Nginx 查找：`/www/lilin-project/dist/css/style.css`

---

## 五、Location 块（⭐ 核心）

### 作用

定义不同 URL 路径的处理规则。

### Location 匹配规则

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

---

### 核心场景 1：前端单页应用（SPA）

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### `try_files $uri $uri/ /index.html;`

**作用**：按顺序查找文件，都找不到就返回 `index.html`

**执行流程**（以请求 `/about` 为例）：

1. 先找 `/www/lilin-project/dist/about` 文件
2. 找不到，再找 `/www/lilin-project/dist/about/` 目录
3. 还找不到，返回 `/www/lilin-project/dist/index.html`

**为什么需要？**

- Vue/React 等前端框架使用前端路由
- 用户访问 `http://example.com/about` 时，这个路由是前端 JS 管理的
- Nginx 服务器上并没有 `/about` 这个文件
- 所以需要返回 `index.html`，让前端 JS 来处理 `/about` 路由

**对比**：

```nginx
# ❌ 不配置 try_files
location / {
    # 默认行为：找不到文件就 404
}
# 用户访问 /about → 404 错误

# ✅ 配置 try_files
location / {
    try_files $uri $uri/ /index.html;
}
# 用户访问 /about → 返回 index.html → 前端路由生效
```

---

### 核心场景 2：反向代理

```nginx
location /prod-api/ {
    proxy_pass https://api.imooc-admin.lgdsunday.club;
    proxy_set_header X-Real-IP $remote_addr;
}
```

#### `proxy_pass`

**作用**：将请求转发到后端服务器

**理解**：

- Nginx 作为中间人（反向代理）
- 浏览器 → Nginx → 后端服务器
- 好处：跨域解决、负载均衡、隐藏后端真实地址

#### 路径拼接规则（重要！）

| `proxy_pass` 配置             | 客户端请求        | 转发到后端                                          |
| ----------------------------- | ----------------- | --------------------------------------------------- |
| `proxy_pass http://backend;`  | `/prod-api/users` | `http://backend/prod-api/users`（保留 `/prod-api`） |
| `proxy_pass http://backend/;` | `/prod-api/users` | `http://backend/users`（去掉 `/prod-api`）          |

**当前配置**：

```nginx
proxy_pass https://api.imooc-admin.lgdsunday.club;
# 末尾无 /，保留前缀
# /prod-api/users → https://api.imooc-admin.lgdsunday.club/prod-api/users
```

**如果后端不需要 `/prod-api` 前缀**：

```nginx
proxy_pass https://api.imooc-admin.lgdsunday.club/;
# 末尾有 /，去掉前缀
# /prod-api/users → https://api.imooc-admin.lgdsunday.club/users
```

#### `proxy_set_header X-Real-IP $remote_addr;`

**作用**：传递客户端真实 IP

**问题**：

- 后端服务器看到的 IP 是 Nginx 的 IP，而非用户真实 IP

**解决**：

- 通过请求头 `X-Real-IP` 传递用户 IP
- 后端代码读取：`request.headers['x-real-ip']`

**完整代理头配置**（推荐）：

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

---

### 核心场景 3：错误页面

```nginx
error_page 404 /404.html;
location = /404.html {
    root /usr/share/nginx/html;
}

error_page 500 502 503 504 /50x.html;
location = /50x.html {
    root /usr/share/nginx/html;
}
```

**作用**：自定义错误页面

**错误码说明**：

- `404`：页面不存在
- `500`：服务器内部错误
- `502`：网关错误（后端服务挂了）
- `503`：服务不可用
- `504`：网关超时（后端响应太慢）

---

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

---

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

---

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

---

## 核心知识总结

### 1. 配置文件层级

```
Main（全局）
  └── events（并发连接）
      └── http（HTTP 服务）
          └── server（虚拟主机）
              └── location（路径规则）
```

### 2. 核心配置速查

| 作用        | 配置项               | 示例                                       |
| ----------- | -------------------- | ------------------------------------------ |
| 性能优化    | `worker_processes`   | `worker_processes auto;`                   |
| 并发连接    | `worker_connections` | `worker_connections 1024;`                 |
| 监听端口    | `listen`             | `listen 80;`                               |
| 域名        | `server_name`        | `server_name example.com;`                 |
| 网站根目录  | `root`               | `root /var/www/html;`                      |
| 前端路由    | `try_files`          | `try_files $uri $uri/ /index.html;`        |
| 反向代理    | `proxy_pass`         | `proxy_pass http://backend/;`              |
| 传递真实 IP | `proxy_set_header`   | `proxy_set_header X-Real-IP $remote_addr;` |

### 3. 常用命令

```bash
# 检查配置文件语法
nginx -t

# 重载配置（不中断服务）
nginx -s reload

# 停止 Nginx
nginx -s stop

# 查看错误日志
tail -f /var/log/nginx/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log
```

---

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

---

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

---

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

---

### Q4：如何查看 Nginx 版本和编译参数？

```bash
# 查看版本
nginx -v

# 查看版本和编译参数
nginx -V
```

---

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

---

## 学习路径

### 第 1 阶段：基础掌握 ✅

- ✅ 理解配置文件层级结构
- ✅ 掌握 server 和 location 配置
- ✅ 能部署静态网站
- ✅ 能配置反向代理

### 第 2 阶段：进阶实战

- 配置 HTTPS
- 负载均衡
- Gzip 压缩和缓存
- 限流和防攻击

### 第 3 阶段：深入原理

- Nginx 架构和工作原理
- 性能调优
- 自定义模块开发

---

## 参考资料

- [Nginx 官方文档](http://nginx.org/en/docs/)
- [Nginx 配置最佳实践](https://www.nginx.com/resources/wiki/start/)
- [免费 SSL 证书 - Let's Encrypt](https://letsencrypt.org/)

---

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

---

## 总结

### 核心要点

1. **配置层级**：Main → Events → HTTP → Server → Location
2. **Server 块**：定义一个网站（监听端口、域名、根目录）
3. **Location 块**：定义 URL 路径规则（静态文件、反向代理）
4. **try_files**：前端 SPA 必备（支持前端路由）
5. **proxy_pass**：反向代理（解决跨域、负载均衡）

### 快速上手步骤

1. 理解配置文件结构
2. 学会配置一个 server 块
3. 掌握 location 的两大核心场景：
   - `try_files`（前端路由）
   - `proxy_pass`（反向代理）
4. 实践：部署一个前端项目 + 配置 API 代理

**祝你学习顺利！** 🚀
