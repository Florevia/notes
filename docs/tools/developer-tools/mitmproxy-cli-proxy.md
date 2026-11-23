---
title: "mitmproxy 抓 curl / git / npm / pnpm 的包"
description: "用 mitmproxy 代理终端工具时，四种客户端分别如何指定代理与 CA 证书：单次命令、环境变量与持久配置，以及证书报错排查。"
tags: ["工具与实践"]
docType: "concept"
knowledgeTopic: "/tools/developer-tools/"
---

# mitmproxy 抓 curl / git / npm / pnpm 的包

终端工具默认不读系统代理，也不信任 mitmproxy 动态签发的证书。要让它们被抓到，需要同时做两件事：

1. **指定 HTTP 代理**：让请求先到 mitmproxy（默认 `127.0.0.1:8080`）。
2. **指定 CA 证书**：让客户端信任 mitmproxy 用它自己的 CA 伪造出的站点证书。

只做第一步会看到证书校验错误；只做第二步则流量根本不会经过 mitmproxy。

## 结论速查

| 工具 | 代理参数 / 变量 | 证书参数 / 变量 |
| --- | --- | --- |
| `curl` | `-x`、`--proxy`；`http_proxy`、`https_proxy` | `--cacert`；`CURL_CA_BUNDLE` |
| `git`（HTTPS 远程） | `-c http.proxy`；`http_proxy`、`https_proxy` | `-c http.sslCAInfo`；`GIT_SSL_CAINFO` |
| `npm` | `--proxy`、`--https-proxy`；`HTTP_PROXY`、`HTTPS_PROXY` | `--cafile`；`NODE_EXTRA_CA_CERTS` |
| `pnpm` | `--config.proxy`、`--config.https-proxy`；`HTTP_PROXY`、`HTTPS_PROXY` | `--config.cafile`；`NODE_EXTRA_CA_CERTS` |

两个前提：

- `git` 只有 `https://...` 远程能走 HTTP 代理；`git@github.com:...` 是 SSH，代理方式不同，见 [Git 走 SSH 代理的原理](/tools/git/git-ssh-proxy)。
- mitmproxy 只处理 HTTP/HTTPS/WebSocket；HTTP/3（QUIC）不会被代理。

## 0. 启动 mitmproxy 并确认证书

```bash
# 交互式界面
mitmproxy -p 8080

# 或只抓包、不进入 UI
mitmdump -p 8080
```

首次启动会在 `~/.mitmproxy/` 生成 CA：

```bash
ls -l ~/.mitmproxy/
# mitmproxy-ca-cert.pem   PEM 格式，curl / git / Node 都用这个
# mitmproxy-ca-cert.cer   同样是证书，给 Windows / Android 导入用
# mitmproxy-ca-cert.p12   带私钥的 PKCS#12，导入系统钥匙串用
```

本文统一使用 PEM：

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
```

两点注意：

- 用 `$HOME` 而不是 `~`。部分工具不会展开波浪号，传进去就是字面量 `~`。
- 用**绝对路径**。`--cafile ./cert.pem` 之类会随工作目录变化而失效。

先确认代理链路通畅：

```bash
curl -x http://127.0.0.1:8080 http://mitm.it/
curl -x http://127.0.0.1:8080 --cacert "$CA" -sS -o /dev/null -w '%{http_code}\n' https://example.com
```

`http://mitm.it/` 会返回证书安装页面；第二条返回 `200` 说明 HTTPS 劫持和证书信任都已生效。

## 1. curl

### 方式一：单次命令显式指定（推荐）

`-x`（等价于 `--proxy`）同时作用于 `http://` 和 `https://`：对 HTTPS，curl 先向代理发 `CONNECT` 建隧道，再做 TLS 握手；`--cacert` 指定校验服务端证书时使用的 CA。

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

curl -x http://127.0.0.1:8080 \
  --cacert "$CA" \
  https://api.github.com/
```

如果代理需要认证：

```bash
curl -x http://127.0.0.1:8080 \
  --proxy-user user:pass \
  --cacert "$CA" \
  https://api.github.com/
```

临时跳过证书校验可以用 `-k`，但它等于关闭校验，只适合确认“代理是否通”，不适合长期使用：

```bash
curl -x http://127.0.0.1:8080 -k https://api.github.com/
```

### 方式二：环境变量

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

http_proxy=http://127.0.0.1:8080 \
https_proxy=http://127.0.0.1:8080 \
CURL_CA_BUNDLE="$CA" \
curl https://api.github.com/
```

细节：

- curl 读**小写** `http_proxy`。出于历史安全考虑，它忽略大写的 `HTTP_PROXY`；`HTTPS_PROXY` 大写则是认的。
- `CURL_CA_BUNDLE` 会替换默认 CA 包，而不是追加。只想额外信任一张证书时更推荐显式 `--cacert`。
- 不想走代理的域名写进 `NO_PROXY`（逗号分隔），例如 `NO_PROXY=localhost,127.0.0.1,.internal`。

## 2. git

前提：远程地址是 `https://github.com/user/repo.git`。SSH 地址不经过 HTTP 代理，见文首链接。

### 方式一：单次命令用 `-c` 覆盖配置

不污染任何配置文件，适合临时抓一次 clone / pull：

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

git -c http.proxy=http://127.0.0.1:8080 \
    -c http.sslCAInfo="$CA" \
    clone https://github.com/user/repo.git
```

已存在的仓库里抓 `fetch` / `pull`：

```bash
git -c http.proxy=http://127.0.0.1:8080 \
    -c http.sslCAInfo="$CA" \
    -C /path/to/repo pull
```

Git 官方只定义 `http.proxy`，它同时覆盖 `http://` 和 `https://` 远程；网上常见的 `https.proxy` 并不是 Git 的配置键，写了也不会生效。

### 方式二：环境变量

```bash
http_proxy=http://127.0.0.1:8080 \
https_proxy=http://127.0.0.1:8080 \
GIT_SSL_CAINFO="$HOME/.mitmproxy/mitmproxy-ca-cert.pem" \
git clone https://github.com/user/repo.git
```

`GIT_SSL_CAINFO` 等价于设置 `http.sslCAInfo`，但会被显式配置覆盖。抓包结束后不会留下痕迹。

### 方式三：写入全局配置（记得还原）

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

git config --global http.proxy http://127.0.0.1:8080
git config --global http.sslCAInfo "$CA"

# 确认当前生效值
git config --global --get-regexp '^http\.(proxy|sslCAInfo)$'

# 抓包结束后取消
git config --global --unset http.proxy
git config --global --unset http.sslCAInfo
```

如果同一项被写了多次，`--unset` 会报 “multiple values”，改用 `--unset-all`：

```bash
git config --global --unset-all http.proxy
git config --global --unset-all http.sslCAInfo
```

### 证书错误的临时绕过

```bash
git -c http.sslVerify=false clone https://github.com/user/repo.git
# 或
GIT_SSL_NO_VERIFY=true git clone https://github.com/user/repo.git
```

这只是关闭校验，mitmproxy 仍然能解密流量，但无法发现中间人；应优先把 CA 配对。

## 3. npm

npm 自身走代理依赖 npm 的 `proxy` / `https-proxy` / `cafile` 配置；而依赖包里的 `postinstall` 脚本是另一个 Node 进程，需要 `NODE_EXTRA_CA_CERTS` 才能信任证书。

### 方式一：单次命令参数

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

npm install axios \
  --proxy http://127.0.0.1:8080 \
  --https-proxy http://127.0.0.1:8080 \
  --cafile "$CA"
```

`--proxy` 和 `--https-proxy` 都指向同一个 HTTP 代理：npm 对 HTTPS registry 也是先 `CONNECT`。`--cafile` 必须是 PEM。

### 方式二：环境变量（推荐）

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

HTTP_PROXY=http://127.0.0.1:8080 \
HTTPS_PROXY=http://127.0.0.1:8080 \
NODE_EXTRA_CA_CERTS="$CA" \
npm install axios
```

`NODE_EXTRA_CA_CERTS` 是 Node.js 运行时变量，会给所有 Node 进程额外追加一张 CA，包括 npm 自己和它拉起的安装脚本。它只解决“信不信证书”，不解决“走不走代理”。

### 方式三：写入 `.npmrc`

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

npm config set proxy http://127.0.0.1:8080
npm config set https-proxy http://127.0.0.1:8080
npm config set cafile "$CA"

# 查看写到了哪里、当前值是什么
npm config get proxy
npm config get https-proxy
npm config get cafile
npm config list

# 抓包结束后删除
npm config delete proxy
npm config delete https-proxy
npm config delete cafile
```

也可以直接编辑 `~/.npmrc`：

```ini
proxy=http://127.0.0.1:8080
https-proxy=http://127.0.0.1:8080
cafile=/Users/you/.mitmproxy/mitmproxy-ca-cert.pem
```

注意 `cafile` 要写绝对路径，`.npmrc` 里不会展开 `~`。

## 4. pnpm

pnpm 复用 npm 的配置体系：读 `.npmrc`、读 `npm_config_*` 环境变量，也接受 `--config.` 前缀的命令行参数。

### 方式一：单次命令参数

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

pnpm add axios \
  --config.proxy=http://127.0.0.1:8080 \
  --config.https-proxy=http://127.0.0.1:8080 \
  --config.cafile="$CA"
```

pnpm 对未知参数比较严格，直接用 `--proxy` 可能被当成未知选项；统一加 `--config.` 前缀最稳。

### 方式二：环境变量

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

HTTP_PROXY=http://127.0.0.1:8080 \
HTTPS_PROXY=http://127.0.0.1:8080 \
NODE_EXTRA_CA_CERTS="$CA" \
npm_config_cafile="$CA" \
pnpm install
```

`npm_config_cafile` 是小写键名加前缀，供 pnpm 读取；`NODE_EXTRA_CA_CERTS` 负责让 Node 运行时信任证书。两者同时给，能覆盖 pnpm 自己和安装脚本两类请求。

### 方式三：写入配置

```bash
CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

pnpm config set proxy http://127.0.0.1:8080
pnpm config set https-proxy http://127.0.0.1:8080
pnpm config set cafile "$CA"

# 抓包结束后删除
pnpm config delete proxy
pnpm config delete https-proxy
pnpm config delete cafile
```

这些值最终也写进 `.npmrc`，所以 npm 和 pnpm 会共享同一份配置——在 pnpm 里设了代理，npm 也会跟着走代理。抓包结束要清理干净。

## 5. 当前终端一键生效 / 一键撤销

适合在同一个窗口里连续跑多种命令，又不想改全局配置。关闭窗口即失效。

```bash
# 开启
export CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

export http_proxy="http://127.0.0.1:8080"
export https_proxy="http://127.0.0.1:8080"
export HTTP_PROXY="http://127.0.0.1:8080"
export HTTPS_PROXY="http://127.0.0.1:8080"

export CURL_CA_BUNDLE="$CA"
export GIT_SSL_CAINFO="$CA"
export NODE_EXTRA_CA_CERTS="$CA"
export npm_config_cafile="$CA"
```

```bash
# 关闭
unset CA
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
unset CURL_CA_BUNDLE GIT_SSL_CAINFO NODE_EXTRA_CA_CERTS npm_config_cafile
```

说明：

- 小写 `http_proxy` 给 curl / git；大写 `HTTP_PROXY`、`HTTPS_PROXY` 给 npm / pnpm。两套都设，避免客户端各读各的。
- 这套变量只影响当前 shell 及其子进程，不影响图形界面程序，也不影响新开的终端。

## 6. 配置优先级

| 工具 | 从高到低 |
| --- | --- |
| curl | 命令行参数 → 环境变量 → 内置默认 |
| git | `-c` / 仓库配置 → 全局配置 → 环境变量 |
| npm | 命令行参数 → 环境变量 → 项目 `.npmrc` → 用户 `.npmrc` → 全局配置 |
| pnpm | 命令行参数 → 环境变量 → `.npmrc` |

排查“为什么配置没生效”时，先确认是不是被更高优先级的层覆盖了：

```bash
git config --show-origin --get-regexp '^http\.'   # 看值来自哪个文件
npm config list -l | grep -E 'proxy|cafile'       # 看 npm 最终解析结果
env | grep -iE 'proxy|cafile|ca_bundle|extra_ca'  # 看当前 shell 注入了什么
```

## 7. 常见报错

### `SSL certificate problem: self-signed certificate in certificate chain`

客户端不信任 mitmproxy 的 CA。检查三点：

1. 证书路径是否真实存在：`ls -l "$CA"`。
2. 是否用了绝对路径。
3. 该工具是否读了你设置的变量（curl 用 `--cacert`，git 用 `http.sslCAInfo`，Node 用 `NODE_EXTRA_CA_CERTS`）。

### `unable to get local issuer certificate`

常见于 `GIT_SSL_CAINFO` 指到了错误文件，或 `CURL_CA_BUNDLE` 指向一个不含系统根证书的空文件。用 `mitmproxy-ca-cert.pem`，不要用 `mitmproxy-ca.pem`（后者含私钥，是 CA 身份文件，不是给客户端用的信任锚）。

### npm / pnpm 报 `UNABLE_TO_VERIFY_LEAF_SIGNATURE`、`SELF_SIGNED_CERT_IN_CHAIN`

npm 自己的请求已经信任了，但 `postinstall` 里的 Node 进程没有。补上：

```bash
export NODE_EXTRA_CA_CERTS="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
```

### 代理完全没流量

按顺序检查：

1. mitmproxy 是否在监听：`lsof -nP -iTCP:8080 -sTCP:LISTEN`。
2. 远程地址是不是 SSH（`git@...`），SSH 不走 HTTP 代理。
3. 是否设置了 `NO_PROXY` / `no_proxy` 把目标排除了。
4. 大写的 `HTTP_PROXY` 对 curl 无效，改用小写 `http_proxy`。
5. Node 内置 `fetch`（undici）默认**不读** `HTTP_PROXY` / `HTTPS_PROXY`，只设置这些变量不会让它走代理。Node 24 及以上可以加 `NODE_USE_ENV_PROXY=1`（或启动参数 `--use-env-proxy`）让内置 `fetch` 读取代理变量，证书仍需 `NODE_EXTRA_CA_CERTS`；更低版本需要在代码里显式配置 `EnvHttpProxyAgent` 或 dispatcher。npm / pnpm 自身的 registry 请求不受此影响。

### `Proxy CONNECT aborted` / `407`

- `407`：代理要求认证，curl 用 `--proxy-user`，其余工具在代理 URL 里带 `user:pass@`。
- `CONNECT aborted`：代理没启动、端口不对，或客户端把 HTTPS 请求发给了错误端口。

### 证书固定（certificate pinning）的程序抓不到

部分 CLI 会校验证书指纹或公钥，即使信任了 mitmproxy CA 也会拒绝连接。这类客户端只能改配置或放弃抓包，不是证书路径的问题。

## 8. 抓包结束后的清理清单

```bash
# git
git config --global --unset http.proxy
git config --global --unset http.sslCAInfo

# npm / pnpm 共用 .npmrc
npm config delete proxy
npm config delete https-proxy
npm config delete cafile

# 当前 shell
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
unset CURL_CA_BUNDLE GIT_SSL_CAINFO NODE_EXTRA_CA_CERTS npm_config_cafile
```

最后确认没有残留：

```bash
git config --global --get-regexp '^http\.(proxy|sslCAInfo)$'
npm config get proxy
npm config get cafile
env | grep -iE 'proxy|cafile|ca_bundle|extra_ca'
```

## 相关

- [System Proxy / TUN / fake-IP](/tools/developer-tools/proxy-tun-fake-ip)：系统代理与 TUN 模式的区别，以及 fake-IP 为什么会把 Git SSH 弄挂。
- [Git 走 SSH 代理的原理](/tools/git/git-ssh-proxy)：`git@github.com:...` 如何通过 `ProxyCommand` 走代理。
- [调试技巧](/tools/developer-tools/debug)：通用的定位与排障方法。
