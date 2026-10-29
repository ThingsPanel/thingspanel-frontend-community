# 社区前端测试服自动部署

推送 `master` 后，GitHub Actions 自动部署到 `47.92.253.145`。页面入口为 `http://c.thingspanel.cn/`。

流水线使用 Node 20.19、pnpm 10.8 和冻结锁文件，依次执行单元测试、ThingsVis／原生接口回归、完整类型检查和生产构建。任一步失败都不会更新服务器。仅使用已有的 Actions Secret `C_SSH_KEY`，SSH 主机指纹固定在 `known_hosts`。

产物带提交号和文件校验值，上传至 `/opt/tp-community-actions/incoming/`，解包至 `frontend-releases/<提交号>/site/`。服务器校验完整后，将 `/home/thingspanel/nginx/www/dist` 切换到该版本；通过本机 Nginx HTTP 核对提交号及首页，失败自动恢复旧目录。前后端共享部署锁，避免并行切换。

验收：查看 Action 是否成功，再访问 `/SOURCE_COMMIT`，确认与本次提交号一致。第一次部署前的目录保留为 `dist.before-actions-<提交号>`；后续旧版本保留在发布目录，`deployment.json` 记录上一版本位置。需要回退时由维护者将 `dist` 链接切回该位置并核验页面。不要删除当前版本或唯一回退副本。

这条流水线只更新前端，不改后端私有配置、数据库、Encore、Mosquitto或自动化引擎开关。完整服务器说明见工作区 `docs/deployment/COMMUNITY-MAIN-47-DEPLOY.md`，入口已登记在工作区 `AGENTS.md`。
