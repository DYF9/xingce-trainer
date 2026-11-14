# 在 iPhone 上长期使用（配置一次，之后离线可用）

## 先说清楚：为什么「共享」里没有「用浏览器打开」

这是 iOS 的沙盒限制，不是网页坏了：

- Safari 只能打开 `http(s)://` 地址，**不能**读其他 App 容器里的 `file://` 文件；
- 「文件」App 的快速查看遇到 .html 只会显示源码，也不会给你浏览器入口；
- 所有 iOS 浏览器（含 Chrome）底层都是 WebKit，同样受限。

所以 iPhone 上要么**用局域网让电脑当服务器**，要么**把它放到一个 https 网址上**。后者最一劳永逸。

## 方案 A：同一 WiFi，电脑当服务器（现在就能用）

1. 电脑双击 `serve.bat`；
2. iPhone Safari 打开窗口里打印的地址，例如 `http://192.168.1.3:8080`；
3. Safari 底部「分享」→「添加到主屏幕」，就有全屏图标了。

限制：电脑得开着、IP 可能会变；走局域网时 Service Worker 不注册（不是 https），断网打不开。

## 方案 B：放到 https 上（推荐，永久 + 可离线 + 可分享给别人）

### 准备

把 `xc-web.zip` 解压，得到 `index.html`、`assets/`、`icons/`、`manifest.webmanifest`、`sw.js`。

### 用网页上传（不用命令行）

1. 登录 GitHub，右上角 + → New repository，名字随便（如 `xingce-trainer`），选 **Public**，Create；
2. 仓库页点 `Add file` → `Upload files`，把上面**解压出来的文件和文件夹本身**拖进去（保证 `index.html` 在仓库根目录），Commit changes；
3. 仓库 `Settings` → 左侧 `Pages` → Source 选 `Deploy from a branch`，Branch 选 `main` / `(root)`，Save；
4. 等 30~60 秒，页面顶部会给出地址：`https://<你的用户名>.github.io/xingce-trainer/`。

### 用命令行

```bash
cd /d D:\2_code\xc
git init -b main
git add -A
git commit -m "xingce trainer"
gh repo create xingce-trainer --public --source=. --push
```

推送后到仓库 Settings → Pages 打开即可（免费账号的 Pages 只能用 Public 仓库）。

### 手机上收尾

1. iPhone Safari 打开那个 https 地址，确认能刷题；
2. 「分享」→「添加到主屏幕」—— 图标就是我们做的蓝色柱状图（`icons/icon-180.png`）；
3. 第一次联网打开时 Service Worker 会把页面缓存下来，之后**断网也能用**（飞行模式验证一下）。

其他等价平台（拖 zip 就行）：Cloudflare Pages、Vercel、Netlify Drop。要求一样：index.html 在根目录，站点走 https。

## 方案 C：装一个能跑本地网页的 App

不想注册任何账号的话：

- **Documents by Readdle**（App Store 免费）：文件 App 里长按 `xingce-single.html` → 共享 → 存储到「Documents」→ 在 Documents 里点开该文件，用它内置的浏览器打开；
- Alook 浏览器、Koder 等也支持本地 html。

缺点：换 App、清缓存都可能丢成绩（成绩存在该 App 的 localStorage 里）。

## 常见卡点

| 现象 | 原因 / 处理 |
| --- | --- |
| 手机上打开 https 地址 404 | `index.html` 没在仓库根目录，或者 Pages 还没构建完 |
| 加完主屏幕图标是白页 | 站点是 http 而不是 https；或还在构建中，等一会儿重开 |
| 断网后打不开 | 第一次必须在联网状态打开过一次，Service Worker 才会写入缓存 |
| 局域网 http://IP 能开但断网打不开 | 正常，局域网不是安全上下文，不注册 Service Worker |
