# 公网联机一键启动

本项目的多人联机需要两个服务同时可访问：

- 前端页面：默认本地端口 `5174`
- 后端 Socket.IO：默认本地端口 `4011`

如果要让外网朋友加入，前端和后端都需要公网映射。脚本已经封装好环境变量，不需要手动填写 `VITE_SERVER_URL`。

## 方式一：Cloudflare 临时网址

双击：

```text
start-public-cloudflare.bat
```

或运行：

```powershell
npm run public
```

脚本会自动：

1. 启动后端到 `http://localhost:4011`
2. 为后端生成一个 `trycloudflare.com` 临时网址
3. 启动前端到 `http://localhost:5174`
4. 让前端连接刚生成的后端公网地址
5. 再为前端生成一个 `trycloudflare.com` 临时网址
6. 自动打开最终游戏地址

终端里显示的“游戏地址”就是发给朋友的地址。

## 方式二：樱花映射 / SakuraFrp

可以使用樱花映射提供的网址。你需要在樱花映射里建两个 HTTP 映射：

```text
后端映射：公网地址 -> 127.0.0.1:4011
前端映射：公网地址 -> 127.0.0.1:5174
```

然后双击：

```text
start-public-sakura.bat
```

按提示输入：

```text
Backend public URL: 樱花给你的后端公网地址
Frontend public URL: 樱花给你的前端公网地址
```

也可以用命令行：

```powershell
.\scripts\start-public.ps1 -Mode custom -PublicServerUrl "https://你的后端樱花地址" -PublicClientUrl "https://你的前端樱花地址"
```

如果樱花给的是 `域名:端口`，没有 `http://`，脚本会自动补成 `http://域名:端口`。

## 停止公网联机

双击：

```text
stop-public.bat
```

或运行：

```powershell
npm run public:stop
```

## 注意

- `localhost` 不是公网地址，只能本机访问。
- `192.168.x.x` / `10.x.x.x` 通常是局域网地址，不是公网。
- Cloudflare quick tunnel 是临时地址，关掉脚本、重启电脑或隧道断开后会失效。
- 樱花映射的网址是否长期稳定，取决于你的樱花映射配置。
