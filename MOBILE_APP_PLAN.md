# 移动端与小程序路线

## 当前已支持

- 响应式 Web：桌面、平板、手机竖屏、手机横屏会自动切换布局。
- 紧凑视口：宽度小于 860px 或高度小于 560px 时，进入 App 式抽屉布局。
- 可安装 Web App：已加入 `manifest.webmanifest`、`app-icon.svg`、`sw.js` 和移动端状态栏配置。

## 推荐路线一：PWA / Web App

适合最快上线测试。

1. 继续使用现有 React + Socket.IO 前端。
2. 手机浏览器打开游戏网址。
3. 安卓 Chrome 可添加到主屏幕。
4. iOS Safari 可通过“分享 -> 添加到主屏幕”使用。

优点：改动少，现有多人联网逻辑完全复用。
限制：微信内置浏览器、iOS 后台保活、麦克风权限会受系统限制。

## 推荐路线二：原生 App 壳

适合想发安卓 APK 或 iOS App。

建议使用 Capacitor：

1. 保留当前 `client` 构建产物。
2. 用 Capacitor 包一层 WebView。
3. Socket.IO、Canvas/SVG、音频、语音基本可以复用。
4. 麦克风权限、横竖屏、安全区需要在原生壳里配置。

优点：复用率最高。
限制：需要额外维护 Android/iOS 工程和签名。

## 推荐路线三：微信小程序

微信小程序不能直接运行当前 React DOM 页面，需要单独前端。

可复用：

- `server` 后端房间、回合、股票、地产、技能、Socket 权威逻辑。
- `shared` 类型和地图配置思想。
- 大部分游戏规则、数值、角色素材。

需要重写：

- 页面层：WXML / WXSS 或 Taro/uni-app。
- 棋盘渲染：建议用小程序 Canvas 或 cover-view。
- 网络层：Socket.IO 在小程序中兼容性较差，建议改为原生 WebSocket 网关，或为小程序增加一层兼容协议。
- 音频/语音：需要使用微信小程序自己的录音与播放 API。

建议实现方式：

1. 先把当前 Web 版本做稳定。
2. 抽出 `shared` 中的 UI 无关类型和规则常量。
3. 新增 `miniapp/`，使用 Taro 或原生小程序。
4. 服务端新增小程序 WebSocket 适配层，但仍调用同一套房间和游戏状态逻辑。

