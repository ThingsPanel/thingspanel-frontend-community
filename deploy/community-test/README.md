# 社区前端测试服构建与部署

推送 `master` 只执行校验和构建，不会更新测试服。必须在 `workflow_dispatch` 中选择 `master` 并启用 `deploy_to_test` 才会部署到 `47.92.253.145`。页面入口为 `http://c.thingspanel.cn/`。合并成功、构建成功和线上版本更新是三个独立状态。

切换静态文件之前，部署器在共享部署锁内运行后端安装的 `incoming/rollout_preflight.py`。检查器缺失、后端仍用旧数据库配置、新模块未托管或原生设备库未迁入现有设备时，停止发布并保留当前页面。它只检查必要条件，不能替代完整的数据迁移对账和功能验收。

手动触发也必须选择 `master`，其他分支在部署前直接失败。重复部署已有成功版本时，复用已有产物并重新校验全部文件，再切换及进行 HTTP 验证；未完成或校验失败的发布目录仍需人工检查，不自动覆盖。

流水线使用 Node 20.19、pnpm 10.8 和冻结锁文件，依次执行单元测试、ThingsVis／原生接口回归、完整类型检查和生产构建。任一步失败都不会更新服务器。仅使用已有的 Actions Secret `C_SSH_KEY`，SSH 主机指纹固定在 `known_hosts`。

产物带提交号和文件校验值，上传至 `/opt/tp-community-actions/incoming/`，解包至 `frontend-releases/<提交号>/site/`。服务器校验完整后，将 `/home/thingspanel/nginx/www/dist` 切换到该版本；通过本机 Nginx HTTP 核对提交号及首页，失败自动恢复旧目录。前后端共享部署锁，避免并行切换。

验收：查看 Action 是否成功，再访问 `/SOURCE_COMMIT`，确认与本次提交号一致。第一次部署前的目录保留为 `dist.before-actions-<提交号>`；后续旧版本保留在发布目录，`deployment.json` 记录上一版本位置。需要回退时由维护者将 `dist` 链接切回该位置并核验页面。不要删除当前版本或唯一回退副本。

这条流水线只更新前端，不改后端私有配置、数据库、Encore、Mosquitto或自动化引擎开关。完整服务器说明见工作区 `docs/deployment/COMMUNITY-MAIN-47-DEPLOY.md`，入口已登记在工作区 `AGENTS.md`。
