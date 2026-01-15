# SSH 远程连接

## 目录

- [基本原理](#基本原理)
- [操作步骤](#步骤)
  - [1. 链接服务器](#链接服务器)
  - [2. 环境准备](#环境准备)
  - [3. 上传项目](#上传项目文件)
  - [4. Nginx 配置](#配置-nginx核心步骤)
- [常见报错](#常见报错-troubleshooting)

---

## 基本原理

- SSH (Secure Shell) 是一种网络协议，用于在不安全的网络中安全地远程登录到另一台计算机。
- SSH 通过加密的通道传输数据，确保数据的安全性。
- SSH 通过密钥对进行身份验证，确保只有授权用户才能访问远程计算机。
- SSH 通过端口 22 进行通信，使用 TCP 协议。
- SSH 通过 SSH 协议进行通信，使用 TCP 协议。
- SSH 通过 SSH 协议进行通信，使用 TCP 协议。

## 步骤

### 链接服务器

1. 连接远程服务器

```bash
ssh username@hostname
```

2. 输入密码

```bash
password
```

3. 查看服务器系统

```bash
hostnamectl
# 或者
cat /etc/os-release
```

返回字段中看 `Operating System`，看是 CentOS 还是 Ubuntu。

**必要性：因为不同的操作系统，安装的软件包管理器不同**

- 如果是 CentOS / RedHat / Fedora：

  - 包管理器是 yum (或新版 dnf)。
  - 安装命令：yum install nginx

- 如果是 Ubuntu / Debian：

  - 包管理器是 apt (或 apt-get)。
  - 安装命令：apt install nginx

### 环境准备

4. 查看是否安装`Nginx`

```bash
nginx -v
```

5. 安装`Nginx`

CentOS:

```bash
# 安装
sudo yum install nginx -y

# 启动Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx
```

6. 查看 Nginx 状态

```bash
sudo systemctl status nginx
```

如果看到绿色的 `active (running)`，说明安装成功

7. 防火墙设置（如果无法访问）

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 重新加载防火墙配置

sudo firewall-cmd --reload
```

### 上传项目文件

8. 在服务器创建存放目录

```bash
mkdir -p /www/lilin-project
```

9. 上传项目文件

注意：

- 要在本地终端执行
- 路径里有中文和空格，要用引号括起来
- 目标文件夹要预先创建好

```bash
scp -r /path/to/local/project username@hostname:/www/lilin-project
```

10. 设置文件权限

```bash
chmod -R 755 /www/lilin-project
```

### 配置 Nginx（核心步骤）

11. 找到配置文件

```bash
sudo vim /etc/nginx/nginx.conf
```

`i` 进入编辑模式

12. 添加配置

```bash
server {
    listen 80;
    server_name localhost;
    # 核心配置
    root /www/lilin-project; # 项目存放目录
    index index.html; # 入口文件

    # 如果是Vue/React项目路由模式（history），加上防止刷新
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 定义 URL 路径匹配规则，表示当请求的 URL 路径以 /api 开头时，就执行这个配置块中的规则。
    location /api {
    # 核心：转发请求到后端服务
    proxy_pass Server B 的 IP;

    # 关键：传递真实 IP 和主机头，防止后端获取不到客户端信息
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # 可选：重写路径 (如果后端不需要 /api 前缀)
    # rewrite ^/api/(.*)$ /$1 break;
    }
}



# 如果有后端接口，配置反向代理 (解决跨域问题)

```

`Esc` 退出编辑模式，`:wq` 保存退出

13. 检查并重启 Nginx

配置生效前必须要检查，防止配置错误导致 Nginx 无法启动

```bash
# 检查配置
sudo nginx -t
# 重启Nginx
sudo systemctl restart nginx
```

必须看到 `syntax is ok` 和 `test is successful`。
