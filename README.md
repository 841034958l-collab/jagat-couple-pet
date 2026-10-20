# Jagat · 情侣地图宠物冒险

React + TypeScript + Vite 移动端 Web MVP。奶油色与鼠尾草绿 UI，原创 SVG 猫咪和卡通城市地图，无外部图片、地图服务或账号依赖。

## 启动与预览

需要 Node.js 20.19+ 或 22.12+（本环境为 Node.js 24）。

```bash
cd /workspace/jagat-couple-pet
npm ci
npm run dev -- --port 5173
```

本机浏览器打开 `http://localhost:5173`，开发者工具切换手机尺寸即可体验。服务器监听 `0.0.0.0`；云环境需使用平台提供的端口转发打开 5173，若当前平台无预览功能，请拉取代码到本机运行。手机与电脑同一局域网时可访问电脑的局域网 IP 加端口 5173。

```bash
npm test             # Vitest：4 项寻猫逻辑测试
npm run build        # TypeScript 检查 + 生产构建，输出 dist/
npm run preview -- --port 4173  # 预览生产构建
```

## 完整玩法

1. 首页点击「立即领养」，选择三种猫咪之一、输入名字（1–12 字），完成领养。
2. 点击「开启出逃冒险」，宠物随机前往四个虚拟地点之一。
3. 在地图页轮流切换角色 A / B，各自得到一条互补线索。本阶段为同设备角色模拟，不含远程联机。
4. 拖动地图探索，通过双指、鼠标滚轮或加减按钮缩放，定位按钮复位。点击地点查找：找错可重试；找对增加 30 成长值，每 100 成长值升级。
5. 找回后自动生成一篇带名字、地点和查找次数的吐槽日记。可返回地图继续新一轮。
6. 冒险中或成功后可生成通缉令，通过 Canvas 导出 900 × 1200 PNG，点击保存触发下载。移动浏览器可从下载列表保存到相册；具体保存操作取决于浏览器。
7. 「约会盲盒」随机抽取 4 类任务卡，支持重新抽取和查看上次任务。

宠物、成长、当前冒险、日记和上次约会任务保存在当前浏览器的 `localStorage`（`jagat-v1`）。清除站点存储可重置游戏。没有真实登录、支付、GPS、广告 SDK、后端或跨设备同步。天气与情侣身份均为模拟数据。

## 测试说明

`src/game.test.ts` 覆盖随机目标、错误查找、成功奖励与日记、多轮累计和重复领取保护。

手动回归建议：使用 390px 手机视口，执行上方完整玩法；检查拖动/缩放后地点仍可点击、A/B 线索互补、错误地点不发奖励、正确地点只发一次奖励、刷新保留进度、PNG 可打开、盲盒重抽正常。桌面检查侧栏导航和布局。

本次已用 Chromium 自动化执行领养→出逃→切换 B→正确查找→日记→PNG 下载→刷新恢复→盲盒流程，检查 390px 无横向溢出，未捕获页面脚本错误。构建与 4 项测试通过。

## 目录

- `src/main.tsx`：页面、地图手势、角色线索、弹窗和 Canvas 分享卡
- `src/game.ts`：Mock 地点、任务卡、寻猫状态转换
- `src/game.test.ts`：游戏规则测试
- `src/style.css`：响应式界面，手机底部导航和桌面侧栏

## 提交到 GitHub

当前改动未自动提交或推送。确认远程仓库正确后，推荐创建功能分支：

```bash
git remote -v
git switch -c feat/couple-pet-mvp
git add .gitignore index.html package.json package-lock.json tsconfig.json vite.config.ts src README.md
git commit -m "feat: add couple pet adventure MVP"
git push -u origin feat/couple-pet-mvp
```

然后在 GitHub 为该分支创建 Pull Request，合并至 `main`。`node_modules/`、`dist/` 和 TypeScript 缓存已忽略。部署时可将 `dist/` 上传到静态托管服务；已设置相对资源路径，支持 GitHub Pages 子路径部署。


## 公网部署：GitHub Pages

已提供 `.github/workflows/deploy.yml`，推送到 `main` 后自动运行测试、构建并发布。

1. 在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。仓库和账户套餐需支持 Pages。
2. 将本地代码提交、推送到 `main`（或将功能分支 PR 合并到 `main`）。
3. 在 **Actions → Deploy game to GitHub Pages** 查看运行结果。也可通过 Run workflow 手动触发。
4. 以成功部署任务和 Settings → Pages 显示的地址为准；工作流尚未成功前不代表网站已上线。

发布只包含静态前端，不上传浏览器本地游戏进度。不需要将任何 token 写入源码或工作流。
