# R7 前端交付说明（检查更新里列出插件）

分支 `wp/R7-frontend`（从 origin/develop d7dbeae3 切出）。未推送、未合并。后端契约：`wp/R7-plugin-upgrade`（Gin，`/api/v1/plugin/catalog`、`/plugin/installs/:id/upgrade|retry`、`GET /plugin/installs/:id`）。

## 做了什么
- `src/service/api/plugin-install.ts`：`CatalogItem.update_available`；新增 `upgradeInstall(id)`（`POST /plugin/installs/:id/upgrade`）。重试沿用已有 `installAction(id,'retry')`。
- `src/utils/plugin-upgrade.ts`：`upgradablePlugins`（`update_available` 且已安装）、`createPluginUpgrader`（发起升级/重试 → 每 2 秒轮询 `GET /plugin/installs/:id`：`enabled`=成功并显示新版本，`failed`=失败并带 `error_code`/`op_step`；请求被拒（409 `UP_TO_DATE`/`BAD_STATE`、503 `AGENT_OFFLINE` 等）标记 `apiError`，不轮询；同一插件进行中不重复发起；轮询出错继续；10 分钟超时显示“结果未知”）。
- `updates-dialog.vue`：平台、tp-agent 两行之后，每个可升级插件一行“插件：名称 当前版本 x → 新版本 y [升级]”；升级前二次确认（“升级会短暂停止该插件，设备连接会中断”）；进行中显示“升级中（步骤）”并禁用按钮；成功显示新版本；失败显示固定错误码 + [重试]（请求被拒时不显示重试，可再点升级）。不进维护遮罩。`/plugin/catalog` 失败（403/503/离线）只隐藏插件行，平台行不受影响（该请求是静默的，不弹全局错误提示）。tp-agent 行未改动。
- i18n：`system-manage.json` 中英文增加 `updates.plugins.*`。

## 怎么验证的
### 自动化测试（单元测试，不是端到端）
- 新增 `plugin-upgrade.test.ts`（9 条）：过滤、installing→enabled、failed 带码并停止轮询、409 UP_TO_DATE 不轮询、不重复发起、retry 走 retry 接口、轮询错误继续/超时、dispose。
- 与 R6 的 system 测试、既有 `plugin-install-*` 测试一起 44/44 通过。eslint 对改动文件 0 error。
- `pnpm typecheck`：本次改动文件无错误；全量仍报 `src/router/elegant/*` 与 `build/plugins/router.ts` 的类型错误，是 develop 上已提交的生成文件与生成类型不同步（与 R6 时相同，范围外，未修）。镜像用 `vite build` 构建。
### 真实界面验证
- 未做。没有以超级管理员登录、没有对真实后端点过插件升级；由父会话在整栈上演示。

## 没做什么
- 没有改插件页（`views/apply/plugin`）；插件升级进度只在“检查更新”对话框里显示，关闭对话框后轮询停止（后端继续升级，可在插件页看到状态）。
- 版本比较完全信任后端的 `update_available`，前端不自己比较。
- 非 SYS_ADMIN 调目录接口会 403，对话框本身只有超级管理员能打开，所以没有额外处理。
