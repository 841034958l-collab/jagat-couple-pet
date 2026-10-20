# Jagat「99天养宠计划」· 独立身份与共享房间版

一个人创建房间并邀请，另一个人用自己的设备接受，房间即刻成立、开始共同养宠。没有A/B玩家切换按钮。

本次修正：

- **个人身份**：每个浏览器有服务端分配的独立会话；「我」只展示和修改自己的昵称、头像、城市、简介。
- **真正的邀请流程**：邀请链接读取房主与宠物信息，受邀者先完善自己的资料，再明确接受；接受后双方自动看到成立的房间，无需房主再确认。
- **共享宠物与装扮**：PostgreSQL（公网）或SQLite（本地）服务端存储房间、宠物、背包与小屋，双方都可以换装和布置，前台约2秒同步。
- **服务端权限**：身份从HttpOnly Cookie会话推导，客户端不能传角色冒充另一位；只允许房间成员修改该房间。
- **原有玩法保留**：喂养、成长品质、估值、地图寻宠、互动、未来信、商店、里程碑、日历、分享和毕业结局。

支付、基金和广告仍是明确标识的模拟。不产生真实支付、现金奖励或收购承诺。浏览器会话不等于Jagat正式登录；当前没有账号找回。

## 本地启动

需要 **Node.js 24**（使用内置`node:sqlite`）。

```bash
npm ci
npm run dev
```

一个命令启动前端5173与API服务5175。使用本机浏览器访问`http://localhost:5173`。云端需要平台支持的端口转发；单独开前端或GitHub Pages不能支持共享房间。

两人本地测试：

1. 普通浏览器先设置昵称、头像，回首页创建房间，复制邀请。
2. 用另一台设备、另一款浏览器或独立无痕窗口打开邀请。
3. 受邀者设置自己的个人资料，返回邀请页，点击「接受邀请，一起养宠」。
4. 房主页面自动变为已成立，双方可以喂养、购买装扮或布置小屋。
5. 同一浏览器的多个普通标签页属于同一个身份，不能用自己的标签页接受自己的邀请。

同一局域网手机测试时，请用电脑局域网IP访问5173并生成邀请，使另一台设备能够访问链接。公网体验应使用下方完整部署方式，不公开开发服务器。

## 免费演示部署：Render Free + Supabase Free

已提供免费的Web服务配置 [render.yaml](render.yaml)，不创建付费磁盘。数据保存在你自己创建的Supabase PostgreSQL项目中。详细操作见 [部署指南](docs/deploy.md)。

[打开 Render 部署入口](https://render.com/deploy?repo=https://github.com/841034958l-collab/jagat-couple-pet)

创建时选择 **Free**，填写两个服务端环境变量：

- `DATABASE_URL`：Supabase Connect → Direct → **Session pooler** → URI，保留密码占位符即可。
- `DATABASE_PASSWORD`：创建Supabase项目时保存的数据库密码，原样填写；代码会安全编码特殊字符。

密码和连接串仅填入Render环境变量，不发到聊天、不提交GitHub、不使用VITE_前缀。服务启动会自动在私有`jagat_private` schema建表，无需手动粘贴SQL或公开Data API表。

免费服务可能休眠、冷启动，数据库也有额度/暂停限制，以平台当前显示为准。若页面没有Free选项，不要改选付费方案。尚未创建托管账号或外部服务，不声称当前已有可访问的新网址。

使用Render实际提供的HTTPS网址邀请对方。GitHub Pages不能运行这个后端；GitHub Actions检查构建与测试，后续由Render部署`main`提交。

## 玩法入口

- 「我」：自己的资料、房间、共同装扮入口，以及「更多功能」。不展示对方私人简介或城市。
- 首页：房主领养，房间成立后免费喂养、摸摸、故事、休息、整理小屋。
- 双人房间：发送、重新生成邀请，查看房间成员昵称，解除绑定。邀请有效24小时，新链接撤销旧链接，一人最多加入一个房间。
- 地图：6个虚拟区域、拖动缩放、双方分别查看各自线索并寻宠；无法在本设备代看对方线索。
- 心动互动：互送信件、选择需要、默契挑战、约会、未来信件；各自在自己的设备操作。
- 商店/背包：双方共用爱心币、模拟星星币与物品；任意一位换装，另一位也会看到。
- 小屋：免费家具、墙纸、地板、摆放保存，双方同步。
- 更多功能：估值、日历、奖励、剧情、海报与毕业选择。
- 演示日期：`DEMO_MODE=true`时，仅房主可调整共享剧情日；不存在身份切换。`false`时隐藏演示日期，服务端按绑定后每24小时推进自然日。

### 成长与模拟估值

每日任务按房间合计设置上限，双方不能重复刷同一奖励。等级不因未登录下降，宠物不会死亡。

五维品质为营养25%、情绪25%、探索20%、共同责任20%、环境10%；每维双方每日最多+10，周期内累计至100。免费粮和免费任务足以达到满分。

金额使用整数分：`min(19900, round(1990 + 8000×D/99 + 9900×Q/100))`。D99/Q100得到¥198.90，¥199为封顶值。商城和广告不增加真实现金奖励。估值与基金申请均显示模拟说明。

### 隐私与毕业

未来信件到期前，接收者的API不返回正文。秘密投票仅返回提交状态，双方完成后揭晓，服务器不接受客户端伪造角色。

D99双方留下→永远的家；双方交给Jagat→星球毕业；不同→再商量一次。结局海报须双方同意。解除绑定清除房间私人信件、偏好和未揭晓投票，双方退出该房间，成长事件保留为服务端归档。

## 测试与构建

```bash
npm test          # 业务/组件测试 + 真实HTTP服务集成测试
npm run build     # 前端、服务端TypeScript检查 + Vite构建

# 本机首次使用Playwright
npx playwright install chromium
npm run test:e2e

# 此云环境可使用已有系统Chromium
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

E2E启动独立的内存数据库API5176与前端5174，使用两个独立浏览器上下文，不依赖开发数据库或本机已有存档。测试验证身份隔离、邀请自动成立、共享装扮、两设备寻宠、秘密任务与三种终局。

## 启动与数据库

```bash
npm ci --include=dev
npm run build
# 在托管平台安全设置DATABASE_URL和DATABASE_PASSWORD，然后运行
npm start
```

设置`DATABASE_URL`即使用PostgreSQL；`DATABASE_PASSWORD`可独立覆盖URI密码，省去手动URL编码。若不设置独立密码字段，URI中必须已有正确编码的密码。远程数据库始终验证TLS证书；如官方数据库CA需要额外配置，使用`DATABASE_CA_CERT`，不要关闭验证。

- Render免费配置不使用DATABASE_PATH和本机磁盘，重启不会丢失Supabase中的房间、资料或会话。
- 本地`npm run dev`在未设置DATABASE_URL时使用`.data/jagat.sqlite`，文件已Git忽略。本地存档不自动上传到Supabase。
- 自管SQLite生产部署必须显式设置DATABASE_PATH并保证持久化；没有数据库配置时生产启动会失败，避免悄悄写入临时磁盘。
- PostgreSQL写入使用事务和跨连接池的应用锁，避免邀请抢占和丢失更新。这是小规模Demo的串行策略，大规模服务需细化到房间行锁和数据库级频控。
- Cookie会话有效180天，HttpOnly、SameSite=Lax，生产Secure。没有正式登录、会话找回或跨设备登录同一账号。

PostgreSQL集成测试（必须使用独立测试数据库，测试会创建并清除随机jagat_test_ schema）：

```bash
# 在本机安全设置TEST_DATABASE_URL后
npm run test:postgres
# 浏览器测试可用E2E_DATABASE_URL指定独立PostgreSQL测试库
npm run test:e2e
```

CI会使用临时PostgreSQL容器执行这些检查，不需要你的Supabase密码。

## 目录

```text
server/
  app.ts          HTTP API、会话、房间、邀请、资料与权限
  storage.ts      PostgreSQL / SQLite、事务与TLS验证
  index.ts        生产启动、静态资源
  dev.ts          一键启动前后端
  app.test.ts     HTTP权限、并发、持久化集成测试
src/
  domain/         成长、剧情、估值、数据模型（角色只作内部成员槽位）
  services/       SharedAPI、个人会话类型、海报、正式平台Adapter
  pages/          新个人资料与邀请房间，以及原有游戏页面
  store.tsx       独立身份会话与共享轮询同步
  components/     宠物与地图插画、图表、UI
  v3.css          移动端样式
 e2e/             双浏览器自动化
 render.yaml      Render免费Web服务，无付费磁盘
 Dockerfile       自有服务器容器部署
```

正式Jagat认证、账号恢复、备份与删除申请、真实支付、奖励与广告、真机兼容性以及生产运维仍需继续接入。详见 [正式边界](docs/production.md) 和 [验证记录](docs/validation.md)。
