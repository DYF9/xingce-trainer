# 行测资料分析训练（XC Sprint）

手机 / 电脑双端的行测「资料分析」专项训练程序，纯前端、免安装、可离线。
目标只有两个：**算得快** 和 **找得准**。

## 在线版（推荐，手机直接用）

**https://dyf9.github.io/xingce-trainer/**

HTTPS 部署，iPhone Safari 打开后「分享 → 添加到主屏幕」，联网打开一次即可离线使用（Service Worker 已注册）。
源码仓库：https://github.com/DYF9/xingce-trainer

## 电脑上打开

双击 `index.html` 即可（Chrome / Edge / Firefox）。

## 手机上打开（三种方式，按省事程度排序）

### 方式一：同一个 WiFi + 电脑当服务器（推荐，iPhone / Android 都行）

1. 手机和电脑连**同一个 WiFi**（手机别用流量）。
2. 电脑上双击本目录里的 `serve.bat`（需要装 Node.js；没有 Node 就装了 Python 也行，脚本会自动回退）。
3. 窗口里会打印一行「手机访问 http://192.168.x.x:8080」，在手机浏览器里照抄这个地址打开。
4. 首次运行 Windows 会弹防火墙提示，**勾选「专用网络」并允许**，否则手机连不上。

命令行等价写法：

```bash
cd /d D:\2_code\xc
node server.mjs
```

想换端口：PowerShell 里 `$env:PORT=9000; node server.mjs`。

### 方式二：把单文件版发到手机（不需要电脑常开）

本目录已经生成好 `xingce-single.html`（约 72 KB，样式和逻辑全部内联）。

- 微信「文件传输助手」/ QQ / 邮件把它发给自己；
- **Android**：在文件管理器里点开，选择「用浏览器打开」；或在 Chrome 地址栏输入 `file:///sdcard/Download/xingce-single.html`。
- **iPhone**：iOS 沙盒不允许 Safari 打开本地文件，「共享」里也不会出现浏览器选项——这不是文件问题。iPhone 请走方式一（局域网），或按 [部署-给iPhone永久使用.md](部署-给iPhone永久使用.md) 放到 https 上，那样既能加到主屏幕又能真离线。

改了代码想重新打包：`node tools/build-single.mjs`。

### 方式三：拷整个文件夹到手机

Android：整个 `xc` 文件夹拷到 `Download/`，用 Chrome 打开 `file:///sdcard/Download/xc/index.html`。
iPhone 的「文件」App 对本地多文件网页支持很差，不建议。

### 加到桌面（像 App 一样全屏）

- Android Chrome：地址栏右侧菜单 → 「添加到主屏幕」。
- iPhone Safari：分享 → 「添加到主屏幕」。
- 注意：Service Worker 离线缓存只在 **https** 或 **localhost** 下生效，走局域网 IP 打开时页面可用但不缓存；真正要离线就用方式二的单文件版。

## 三种训练模式

| 模式 | 练什么 | 玩法 |
| --- | --- | --- |
| 计算能力 | 截位直除、增长率/增长量/基期、比重与比重变化、平均数增长率、特征分数、速算乘法、分数比较 | 四选一、限时、答完立刻给解析与速算技巧 |
| 找数能力 | 从统计公报式材料里定位数据 | 直接点材料 / 表格里的那个数，点对才得分；支持「要哪两处数据」多点定位 |
| 综合模考 | 真实节奏 | 一张表格材料 + 5 题（1 定位 + 增长率/比重/增长量/平均数），整组计时 |

题库由 `assets/gen.js` 程序化生成：**无限题量、每次都不一样**，答案与干扰项由同一套公式反算，不会出现错题。
找数题里每个可点数据点都是材料里真实存在的事实，题目问的正是其中某一条。

## 细节

- 每题有建议用时，超时 1.5 倍变黄提醒；结果页有每题用时条形图（绿对红错）。
- 键盘：`1-4` 选选项、`Enter` 提交 / 下一题、`Esc` 退出 —— PC 刷题很顺手。
- 找数题作答后用绿 / 红标出「点对的」「点错的」「没找到的」。
- 统计页：累计正确率、近 7 天做题量、分项正确率红条、最该补的一项 + 对应技巧。
- 技巧手册：截位直除、特征分数表、比重变化、平均数增长率、差分法、找数三步法、常见陷阱。
- 深色 / 浅色主题；成绩只存本机 `localStorage`，不上传服务器。

## 目录

```
index.html                 入口
xingce-single.html         单文件版（发手机用）
serve.bat                  双击 = 启动手机可访问的本地服务器
serve.sh                   macOS / Linux 用
server.mjs                 零依赖静态服务器（会打印局域网地址）
assets/gen.js              题库生成器（纯逻辑，可单独在 Node 跑）
assets/app.js              界面与状态机
assets/style.css           样式（移动优先，深浅两套主题）
manifest.webmanifest       PWA 清单
sw.js                      离线缓存
icons/icon.svg             图标（矢量）
icons/icon-180.png         iOS 主屏幕图标
xc-web.zip                 可直接上传 GitHub Pages / Cloudflare Pages 的部署包
部署-给iPhone永久使用.md   iPhone 三种打开方式与 Pages 部署步骤
tools/build-single.mjs     打包单文件版
tests/gen.test.js          生成器自检（6.6 万条断言）
tests/e2e.mjs              无头浏览器端到端测试
tests/check-deploy.mjs     校验 http / 单文件两种方式的可用性
tests/shots.mjs            截图脚本
```

## 自检

```bash
node tests/gen.test.js        # 题目 / 答案 / 干扰项 / 材料一致性
node --check assets/app.js    # 语法
node tools/build-single.mjs   # 重新打包单文件版
```

端到端测试需要先起一个带调试端口的 Chrome：

```bash
chrome --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/c about:blank
node tests/e2e.mjs
```
