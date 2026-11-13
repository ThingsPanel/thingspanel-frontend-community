# R6 前端交付说明（系统管理界面）

分支 `wp/R6-frontend`（从 `develop` 200d7bde 切出）。未推送、未合并。契约：后端 `wp/R6-system-api` 的 `/api/system/*` 与 nginx `/system-status/status.json`。

## 做了什么
- `src/service/api/system-transport.ts` / `system.ts`：`/api/system/*` 客户端（status、check-config、restart、updates、upgrade、backups 列表/创建/恢复/删除）。响应是裸 JSON（不走 data/meta 封装），`SystemApiError` 带 `status`、`detailCode`（如 `system_busy`）、`maintenance`、`unavailable`。
- `src/utils/system-maintenance.ts`：每 2 秒轮询 `/system-status/status.json`（不带凭证、`no-store`），`classifyMaintenance`：`done` / `*_rolled_back` / `*needs_human` / 其他失败；终态后停止轮询，不重试。
- `src/store/modules/system-manage.ts`：可用性探测（仅 SYS_ADMIN；`/api/system/status` 任何失败包括 503 unavailable 都隐藏整块功能）、遮罩状态；忽略 id 与当前操作不符的旧状态文件；`done` 后 1 秒自动刷新页面。
- `src/service/request/request.ts`：老 axios 请求的 `onError` 里，503 且 `maintenance:true`、或有系统操作运行时的网络错误，切到遮罩（只加 12 行）。
- `src/components/system-manage/`：`maintenance-overlay.vue`（全屏，步骤/百分比/组件；回退=“操作失败，系统已自动回退到之前的状态”；needs_human=“需要人工处理”+ 运维命令 `tp-agentctl … system status`，无关闭/重试按钮）、`restart-dialog.vue`（打开先 check-config；`ok:false` 禁用重启并显示出错组件/错误码；`skipped` 允许；check 请求失败也禁用；两种范围单选）、`updates-dialog.vue`（平台行带 [升级] 和“升级前会自动备份，不能取消”，升级前二次确认；tp-agent 行仅显示“请用安装器升级”；`error` 固定码对应文字，其他行照常显示）、`backup-panel.vue`（时间/版本/大小/触发方式/含历史数据/有效；[立即备份]、[恢复]（二次确认“数据会回到备份时刻”）、[删除]；无下载）、`system-menu.vue`（⋮ 菜单：检查更新/重启系统）。
- 入口：系统设置页（`views/management/setting`）标签栏右上角 ⋮ 菜单；“备份”作为该页的一个标签（仅可用时出现）。遮罩挂在 `App.vue`。
- i18n：新增 `src/locales/langs/{zh-cn,en-us}/system-manage.json`（命名空间 `system-manage.*`，由现有 `locale.ts` 自动加载）。

## 怎么验证的
### 自动化测试（单元测试，不等于端到端验收）
- 新增 `system-api.test.ts`、`system-maintenance.test.ts`（24 个用例）：请求头/请求体/URL 编码、`unavailable` 与 `maintenance` 的区分、`system_busy`、轮询间隔/终态停止/不可达继续/stop、各错误码分类。`vitest run` 这两个文件 24/24 通过。
- `pnpm typecheck` 通过；`eslint --fix` 对本次改动文件 0 error（11 条 no-unused-vars 警告，来自函数类型签名里的参数名，仓库其他文件同类）。
- `pnpm test:unit` 全量：49 个文件通过，1 个失败：`thingmodel-draft-page.test.ts`（6 条，报 localforage“No available storage method”/找不到元素，与本次改动无关；**未在 develop 上做对照运行**，只能说失败点不涉及本次文件）。
- `pnpm build` 通过；`docker build -t r6-frontend:dev .` 成功（196 MB）。

### 真实界面验证（范围很小）
- 用 `r6-frontend:dev` 容器（端口 18080，无后端）打开页面：登录页正常加载，功能保持隐藏（`system-manage.available` 未探测、无 ⋮ 菜单）。
- 在浏览器里把 `fetch` 对 status.json 打桩，手动进入遮罩：先显示“升级系统 / 55% / 当前步骤 applying / 组件 backend”，下一次轮询（失败+`upgrade_failed_rolled_back`）显示“操作失败，系统已自动回退到之前的状态 / 错误码”，截图确认样式。
- **没有**以 SYS_ADMIN 登录后点过 ⋮ 菜单、重启对话框、更新列表、备份页的真实交互；也没有对真实后端验证。这些交给父会话的整栈演示。

## 没做什么 / 范围外
- 备份“下载”按钮（第一期不做）。
- 开发环境代理（`build/config/proxy.ts`）未改，本地 `pnpm dev` 要自己把 `/api/system`、`/system-status` 代理到集成栈。
- 备份页没有放进独立的侧边栏路由，而是系统设置页的标签（避免依赖后端菜单数据）；如需独立菜单项再另做。
- `needs_human` 的运维命令文字取自安装器 agent README（`tp-agentctl -socket … system status`），具体 socket/token 路径由现场决定。
- 备份 `trigger` 的取值（`manual`/`scheduled`/`pre-upgrade` 等）只映射了已知几种，其他原样显示。
