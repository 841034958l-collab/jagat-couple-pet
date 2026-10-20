# 免费演示部署：Render + Supabase

前端和API由同一个Render **Free Web Service**提供，数据存Supabase **Free PostgreSQL**，不需要Render磁盘。平台额度、休眠和暂停规则可能变化，请以确认页面显示为准；若没有Free选项，停止创建，不要选付费方案。

## 1. 保留Supabase连接参数

项目状态Healthy后：

1. Connect → Direct（Connection string）。
2. Connection Method选择 **Session pooler**，Type保持 **URI**。
3. 端口通常5432。复制完整`postgresql://…` URI；可保留`[YOUR-PASSWORD]`占位符。
4. 找到创建项目时保存的数据库密码。下一步在Render单独填写，不必手动处理密码特殊字符。

不要点付费IPv4 add-on，不需要重置已有密码，不要把连接串或密码发到聊天或提交GitHub。

## 2. 创建免费Render服务

1. 打开 [Render部署入口](https://render.com/deploy?repo=https://github.com/841034958l-collab/jagat-couple-pet)，使用GitHub登录。
2. 连接此仓库，确认main分支及根目录render.yaml。也可通过New → Blueprint选择仓库。
3. 检查Web Service方案必须为 **Free**，没有持久化Disk。当前配置不会创建付费数据库或付费磁盘。
4. 在环境变量输入区填写：

| 名称              | 内容                                            |
| ----------------- | ----------------------------------------------- |
| DATABASE_URL      | 刚复制的Session pooler完整URI，可保留密码占位符 |
| DATABASE_PASSWORD | 你创建Supabase项目时保存的原始数据库密码        |

这两个字段只存在服务端。独立密码字段会覆盖URI中的密码并自动编码，包含@、%、/等字符也无需手工转换。不要使用VITE_DATABASE_URL等前端变量名。

5. 确认免费方案后点击创建/部署，等待 **Live**。
6. 使用Render显示的HTTPS网址，设置个人资料、创建房间、将游戏内邀请发给另一位。
7. 另一位在自己的手机或独立浏览器打开，设置资料并接受。房间立即成立，房主页面自动同步。

数据库表由服务启动自动创建在私有jagat_private schema。它不在默认Data API公开schema中，schema和表也不会向PUBLIC授予权限。无需去SQL Editor粘贴未知SQL，不需要anon key或service_role key。

如果Blueprint入口要求付费而不给Free选项，可改用New → Web Service，选择同一仓库、Node运行时、main分支，Build填`npm ci --include=dev && npm run build`，Start填`npm start`，选择Free，再设置上述变量与NODE_VERSION=24、NODE_ENV=production、DEMO_MODE=true。仍没有Free选项时不要确认收费。

## 3. 常见情况

- **首次打开很慢**：免费服务休眠后的冷启动可能较慢，等待平台唤醒，不要反复创建项目。
- **部署时数据库连接失败**：确认Supabase项目Healthy、Session pooler URI、端口5432、数据库密码正确。不要把完整日志中可能含有的连接参数发到公开位置。
- **TLS证书验证失败**：从Supabase官方控制台获取数据库CA证书，以实际多行PEM填入服务端DATABASE_CA_CERT。不要关闭TLS验证。
- **Supabase项目暂停**：先在Supabase恢复项目，再重新部署/启动Render服务。免费计划不等于永远在线承诺。
- **自己打不开自己的邀请**：设计如此。请另一台设备/独立浏览器打开；同一浏览器普通标签共享身份。
- **无法接受邀请**：检查是否过期、被撤销或已经加入其他房间；房主可重新生成。
- **Render更新后进度消失**：检查是否配置了正确DATABASE_URL。生产环境没有数据库配置会拒绝启动，不应使用临时SQLite替代云数据库。
- **Cookie清除后身份丢失**：当前仍是浏览器会话，无正式账号恢复功能。请勿录入敏感信息。

创建Render服务和填入凭据需要你自己完成。代码适配、测试通过不代表已连接你的Supabase项目或网站已上线，以Render服务状态与实际两台设备验收为准。

## 自管服务器备选

Dockerfile仍可构建Node服务。推荐通过服务器安全环境变量注入DATABASE_URL、DATABASE_PASSWORD及PUBLIC_ORIGIN，不把凭据写进镜像或命令历史。自管SQLite仅适用于有持久化盘的单实例场景，不是Render免费部署方案。
