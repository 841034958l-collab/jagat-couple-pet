# 不需要已有服务器的部署方式

新版邀请依赖共享后端。请使用一个同时运行前端和API的站点；GitHub Pages只能托管静态文件，无法运行数据库与API。

## Render：按页面点击

1. 打开 https://render.com 并使用GitHub登录。
2. 点击 [此仓库的部署入口](https://render.com/deploy?repo=https://github.com/841034958l-collab/jagat-couple-pet)。也可在Dashboard点击 **New → Blueprint**，选择 `841034958l-collab/jagat-couple-pet`。
3. 授权Render读取此仓库，确认使用`main`分支和仓库根目录`render.yaml`。
4. 检查将创建的服务：`jagat-couple-pet`，Starter方案，1GB持久化数据盘。**这是可能收费的配置，先看平台当时显示的价格，再自行确认。**不要为了免费改成临时文件系统后声称数据可靠保存。
5. 点击创建/部署，等待服务状态变成 **Live**。首次会执行`npm ci --include=dev && npm run build`，再运行`npm start`。
6. 点击Render服务页面提供的HTTPS网址，打开「我」设置自己的资料，再创建房间。
7. 将游戏内生成的邀请链接发给另一位，对方用自己的手机打开、设置资料、点击接受。房主页面会自动更新，无需再次确认。
8. 后续推送`main`可由Render自动部署。GitHub Actions只检查测试与构建，不再把后端版本发布到Pages。

本代码不创建Render账号、不接触信用卡、不自动购买服务。实际网址只有创建成功后才存在，请以Render页面显示的地址为准。

## 参数已经预置

| 变量          | 值/作用                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| NODE_VERSION  | 24，内置node:sqlite                                                                                       |
| NODE_ENV      | production，启用Secure Cookie并服务dist资源                                                               |
| DATABASE_PATH | /var/data/jagat.sqlite，必须在持久化盘                                                                    |
| DEMO_MODE     | true：只给房主开放剧情日期演示；false：服务端自然日，不开放模拟审核/广告                                  |
| PUBLIC_ORIGIN | 通常无需填写，默认使用Render自动提供的RENDER_EXTERNAL_URL；自定义域名时设置为实际HTTPS源，不带路径/尾斜杠 |
| PORT          | 平台注入，无需手动覆盖                                                                                    |

身份是浏览器会话，支持两台设备各自参与，但尚无正式登录/账号找回。Cookie清除、浏览器切换后不能自行恢复原身份。请先作为小范围演示，不要录入敏感信息。

## 自有服务器 / Docker 备选

仓库包含Dockerfile：

```bash
docker build -t jagat-pet .
docker volume create jagat-data
docker run -d --name jagat-pet --restart unless-stopped \
  -p 3000:3000 \
  -v jagat-data:/data \
  -e PUBLIC_ORIGIN=https://your-real-domain.example \
  jagat-pet
```

再使用托管反向代理或服务器现有HTTPS代理把实际域名转到3000端口。上面域名是占位符，必须换成自己的域名。生产Cookie是Secure，公网必须走HTTPS。当前仅支持单实例；不能对一个SQLite文件直接做跨机器扩容。

## 常见情况

- **GitHub Pages显示旧版**：正常，新版部署目标改成共享服务器。使用Render实际网址。
- **共享服务暂未连接**：访问了只有静态前端的地址，或API服务没有启动。查看Render日志与`/api/health`。
- **请求来源不匹配**：检查PUBLIC_ORIGIN与浏览器地址栏的协议、域名、端口一致；自定义域名时更新该值。
- **不能接受自己的邀请**：使用另一台手机、不同浏览器或独立无痕窗口；同一浏览器多个普通标签是同一人。
- **邀请过期/失效**：房主在双人房间重新生成，新链接会撤销旧链接。
- **对方没立即看到更新**：正常前台约2秒轮询；断网时显示重连提示，恢复网络后同步。
- **重启后房间消失**：检查DATABASE_PATH是否落在已挂载的持久化盘。请勿使用Render临时目录或内存数据库做公网持久化。
