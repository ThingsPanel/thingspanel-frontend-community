> **2026-10-28 集成更正：本文保留源分支历史内容，不能直接作为当前部署步骤。** 页面现由社区后端 `/api/v1/automation/runtime` 决定使用旧/新接口，默认 legacy；仅切换后端配置即可恢复旧页面入口。当前操作以配套后端 `docs/AUTOMATION-MERGE-1.3-20261028.md` 为准，切换前须完成旧数据迁移及真实验收。

# 自动化重写：前端合并入口

> 配套文件：后端仓库 `thingspanel-backend-community` 根目录的
> `MERGE-AUTOMATION-REWRITE.md`，架构说明和环境变量在那边，这里只说前端。

---

## 1. 要合并什么

- 仓库：`https://github.com/ThingsPanel/thingspanel-frontend-community.git`
- 分支：`feat/automation-rewrite-20261023`
- 相对 `origin/master`：**4 个提交**

| 提交 | 内容 |
|---|---|
| `bdaf3b85` | A22/A23/A24：规则列表、编辑器、执行详情、设备上下文页 |
| `f5dc95fb` | A25：场景、联动、告警页面接到新引擎 |
| `182132e3` | 修：接口返回 `data:null` 时页面整页崩掉（客户新装环境必现） |
| `6148ea97` | 修：动作值占位符显示 `undefined`、告警详情显示裸 UUID |

合并顺序：**先后端，再前端**。前端调的是后端新起的 Encore 服务。

---

## 2. 前端要多配一个反向代理

前端默认**同源**访问自动化服务，路径前缀 `/automation-core`：

```
浏览器 → /automation-core/v1/rules → （反代，剥掉前缀）→ Encore 服务 /v1/rules
```

**生产环境必须在 Nginx（或你们用的网关）里加这条反代**，否则所有自动化页面都会 404：

```nginx
location /automation-core/ {
    proxy_pass http://<automation-host>:<port>/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Authorization $http_authorization;
}
```

如果不想用同源反代，也可以构建时给绝对地址：

```bash
VITE_AUTOMATION_API_BASE_URL=https://automation.example.com npm run build
```

### 环境变量

| 变量 | 何时用 | 说明 |
|---|---|---|
| `VITE_AUTOMATION_API_BASE_URL` | 生产可选 | 自动化服务的绝对地址；不填 = 同源 `/automation-core` |
| `VITE_AUTOMATION_DEV_PROXY_TARGET` | 仅本地开发 | 开发代理目标，必须是 HTTPS 源或 HTTP 回环地址 |
| `VITE_AUTH_ROUTE_MODE` | 保持 `dynamic` | 路由由后端下发的菜单决定，本次没有改这个模式 |

---

## 3. 这次改动里的一处产品决策

**独立的"规则列表"页（`/automation/rule-manage`）已下线。**

原因：新架构下"场景联动"本身就是规则列表，两个入口让客户困惑。所以：

- 路由、页面文件、i18n 映射里的 `automation_rule-manage` 都删了
- `rule-edit` 保存后的兜底跳转从 `rule-manage` 改成 `scene-linkage`
- `rule-edit` 本身**保留**：设备详情 / 设备配置详情里的"生效规则"点进去要用它

如果合并后有人从旧书签访问 `/automation/rule-manage`，会走 404，这是预期行为。

---

## 4. 合并后怎么验证（5 分钟）

1. 打开「场景联动」——应该有真实卡片，开关能点，点了之后刷新状态还在
2. 打开「场景管理」——列表能出来
3. 点「新建场景」——填名称，选「操作设备」→「单个设备」，设备下拉能列出真实设备
4. 打开任意设备的详情页 →「自动化」标签——能列出这台设备生效的规则
5. 打开「告警信息」——列表有数据，点「详情」，状态显示"未恢复/已确认/已恢复"，**不是**"所有状态"

第 3 步里如果选完设备后属性下拉是空的，那是物模型服务没起来，不是前端问题（见后端文件"已知限制"第 1 条）。

---

## 5. 已知限制

| # | 问题 | 影响 |
|---|---|---|
| 1 | 属性下拉依赖原生物模型服务 | 该服务不可用时选不出属性；已有规则不受影响 |
| 2 | 告警详情没有等级字段时按 active/acked/cleared 三态显示 | 与旧版"严重/警告"分级不同，是数据模型变了 |
| 3 | 通知相关页面未做真实端到端联测 | 只有接口级证据 |
