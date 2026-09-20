# ThingsPanel 前端表格标准替换汇报

日期：2026-09-20
基线：`src/components/data-table-page/index.vue` 设备列表视觉样板
范围：表格布局与展示属性；不修改 API、接口字段、请求参数、分页语义、权限、后端逻辑或业务操作。

## 1. 结论

本轮完成计划 T03-T44 及 T45 中适用表格的静态展示层统一，共修改 44 个计划内 Vue 文件，覆盖 42 个业务文件和 2 个组件示例/看板小表。设备复合列表 `src/components/data-table-page/index.vue` 已在前一提交中完成视觉基线，本轮未回退或重做。

全仓静态盘点为 49 个 `NDataTable` 实例、48 个文件：本轮覆盖 44 个未提交文件，设备复合基线 1 个文件，`src/views/manage/user`、`src/views/manage/role`、`src/views/manage/menu` 3 个参考页面保持不变。`src/views/management-user` 目录不存在，实际管理用户页面为 `src/views/management/user/index.vue`。

## 2. 统一效果

普通列表和可统一的内嵌表格均采用以下展示基线：

- `NDataTable` 使用 `medium` 尺寸，表头和内容为 14px、常规字重 400。
- 表头/内容补齐约 12px 水平内边距，内容垂直内边距约 13px。
- 使用清晰边框、行分隔线和整行浅蓝 hover；保留原页面的卡片、弹窗和容器结构。
- 有横向内容的表格补充 `scroll-x`；有稳定业务标识的表格补充 `row-key`。
- 空数据通过 `NEmpty` 明确表达；已有状态列继续或改为 Naive UI 官方 `NTag`。
- 可安全使用 flex 容器的远程列表补充 `flex-height`；步骤表、弹窗表和图表联动表保留原高度边界，避免引入双滚动条。

## 3. 页面与文件清单

### 告警、申请、自动化、数据服务

- `src/views/alarm/notification-group/index.vue`：通知组列表。
- `src/views/alarm/notification-record/index.vue`：通知记录，保留远程分页，新增组合行键并标记需人工确认重复记录风险。
- `src/views/alarm/warning-message/components/alarm-configuration.vue`：告警历史/配置表。
- `src/views/alarm/warning-message/components/new-information.vue`：告警信息表。
- `src/views/apply/plugin/index.vue`：插件列表。
- `src/views/apply/service/index.vue`：服务列表。
- `src/views/automation/scene-manage/index.vue`：场景列表；内嵌日志表保留原业务行为。
- `src/views/data-service/rule-engine/index.vue`：数据服务规则列表。
- `src/views/data-service/rule-engine/components/table-action-modal.vue`：规则弹窗内本地表。

### 设备、设备详情、分组、服务接入

- `src/views/device/config/index.vue`：设备配置复合列表。
- `src/views/device/config-detail/modules/associated-devices.vue`：关联设备表。
- `src/views/device/config-detail/modules/connection-info.vue`：连接信息内嵌表。
- `src/views/device/config-detail/modules/extend-info.vue`：扩展信息内嵌表。
- `src/views/device/details/modules/device-analysis.vue`：设备分析表。
- `src/views/device/details/modules/device-diagnosis.vue`：诊断失败记录表；保留 remote，方向状态使用官方 NTag。
- `src/views/device/details/modules/device-status.vue`：状态历史表；保留 remote，在线/离线使用官方 NTag。
- `src/views/device/details/modules/expect-message.vue`：期望消息表。
- `src/views/device/details/modules/public/distribution-and-table.vue`：分布图联动表。
- `src/views/device/details/modules/telemetry/modules/history-data.vue`：历史数据表。
- `src/views/device/details/modules/telemetry/modules/time-series-data.vue`：时序数据表。
- `src/views/device/details/modules/telemetry/telemetry.vue`：遥测日志表；保留图表、时间筛选和外置分页边界。
- `src/views/device/grouping/index.vue`：设备分组列表。
- `src/views/device/grouping-details/index.vue`：分组表与设备表，两套上下文保持独立。
- `src/views/device/grouping-details/modules/device-select-list.vue`：设备选择表，保留选择和分页行为。
- `src/views/device/service-details/components/AutomaticModeStep.vue`：自动模式步骤表。
- `src/views/device/service-details/components/serviceConfigModal.vue`：服务配置弹窗选择表。
- `src/views/device/service-details/index.vue`：服务接入列表。

### 模板与市场

- `src/views/device/template/index.vue`：设备模板列表。
- `src/views/device/template/components/step/add-edit-commands.vue`：命令参数本地表。
- `src/views/device/template/components/step/add-edit-events.vue`：事件参数本地表。
- `src/views/device/template/components/step/custom-commands.vue`：自定义命令表，保留外置分页。
- `src/views/device/template/components/step/custom-controls.vue`：自定义控制表，保留外置分页。
- `src/views/device/template/components/step/enum-info.vue`：枚举信息本地表。
- `src/views/device/template/components/step/model-definition.vue`：动态模型表，保留每个模型独立的 remote/分页/请求边界。
- `src/views/device/market/InstalledBundles.vue`：已安装包列表。

### 管理、规则、日志及普通小表

- `src/views/management/api/index.vue`：API 密钥列表。
- `src/views/management/auth/index.vue`：权限列表。
- `src/views/management/role/index.vue`：角色列表。
- `src/views/management/setting/components/data-clear-setting.vue`：数据清理配置内嵌表。
- `src/views/management/user/index.vue`：管理用户列表。
- `src/views/rule-engine/index.vue`：规则引擎列表。
- `src/views/system-management-user/system-log/index.vue`：系统日志列表；补合法的 `actions` 列 key，未改变详情操作。
- `src/views/component/table/index.vue`：组件示例表，不接远程分页。
- `src/views/dashboard/analysis/components/bottom-part/index.vue`：看板摘要小表，不接远程分页。

## 4. 场景对比

以通知组列表为例：之前使用默认表格展示，行 key、空态、横向内容和 hover 主要依赖组件默认值；现在保留原查询、增删改和外置分页，只增加 medium/14px/400、统一内边距与行线、稳定 `row-key=id`、横向滚动和明确空态。

以动态模型表和遥测表为例：之前的 remote、图表/时间筛选、分页与弹窗边界仍由原页面维护；现在只补展示属性和行定位，不把它们强行改造成普通远程列表。因此分页请求次数、请求参数、图表联动和选择操作的业务语义保持原样。

## 5. 特殊边界与未完成项

- 组合字段行键存在业务数据完全重复时的冲突风险，重点包括通知记录、诊断失败记录、扩展信息、遥测日志和系统日志 fallback key；本轮只做展示层，未改接口字段或数据流。
- 多个页面使用硬编码 `scroll-x`，需要在真实列内容和操作列较长时人工确认横向滚动完整可用。
- `flex-height` 依赖父容器高度，需人工确认不会塌陷或产生双滚动条。
- 本轮没有修复共享表格 hook 的既有分页自动请求、异常 finally 等数据流问题；这属于后续治理任务。
- 尚未完成浏览器逐页人工视觉验收；“类型检查/构建通过”不能替代该验收。

## 6. 人工逐页核对清单

每个远程列表逐页验证：首次进入只发起一次请求；翻页和改页大小后的数据、页码一致；搜索/重置回到第一页；空数据显示空态；失败后 loading 结束且有错误反馈；新增、编辑、删除后只刷新一次。

每个页面再检查：表头与内容字号/字重一致、行分隔线清晰、hover 覆盖整行、长内容可横向滚动、操作列不被截断、移动端不撑破页面。

特殊页面重点检查：分组详情两张表分页互不污染且选择不丢失；设备详情图表、时间范围、全屏与表格不重复请求；动态模型表各自加载/分页/空态独立；服务接入弹窗关闭、设备选择和提交后刷新正常；模板步骤表编辑/删除后行状态正确；管理权限操作仍可用。

## 7. 验证命令与结果

- `pnpm run typecheck`：通过。
- `pnpm run build`：通过，输出 `Build successful. Please see dist directory`；同时有既有 UnoCSS 图标加载 warning（`select`、`local-`）。
- `pnpm exec eslint $(git diff --name-only -- '*.vue')`：未通过，8 个 `no-empty` error、112 个 warning；主要为仓库既有空 catch、未使用变量和格式化规则告警，本轮未扩大范围修复。
- `git diff --check`：通过。
- `git diff --name-only` 与变更范围审计：44 个文件均在计划范围内，未出现 API、router、permission 或后端文件。
- 静态 API/请求逻辑扫描：新增内容限于表格展示属性、稳定行键、空态和状态标签渲染；未发现新增/删除请求参数、分页参数、权限判断或业务操作调用。

## 8. 结构、可靠性和业务价值

结构上，页面仍保留各自的数据流和特殊交互，表格呈现层有统一基线；可靠性上，稳定行键、空态、横向滚动和行 hover 让列表反馈更可预期；代价是暂时存在重复的页面级样式，后续可抽取共享表格主题，但不应在本轮混入数据流重构。

对用户和客户，这会减少不同模块之间的学习成本，提升告警、设备、规则和日志等高频运维页面的可读性；对交付和商业化，统一的后台体验更利于演示、培训、售后排障以及后续新增模块复用。

## 9. 下一步建议

推荐先按第 6 节完成浏览器人工逐页验收，优先检查组合 row-key、硬编码 scroll-x 和 flex-height 三类风险；验收通过后提交本轮视觉替换。数据流治理另立任务，继续处理分页回调、异常收口、请求重复和通用 composable，避免把视觉替换退化成接口重构。

经验教训建议写入项目记忆：ThingsPanel 表格改造应分层管理，采用“设备列表视觉基线 + 远程列表数据流治理 + 内嵌表格轻量规范”；批量替换阶段只改展示属性，数据流问题单独排期。本报告未自动写入共享记忆。

## 10. 用户复查后的补充修复

用户抽查发现上一轮“近似统一”仍有遗漏：插件管理、场景管理和告警相关页面的默认表头背景/线框仍可能覆盖局部样式，设备分组缺少设备列表同款容器阴影和整行 hover，部分详情弹窗中的原生 `NTable` 也未统一。补充修复已完成：

- 为 8 个告警/插件/服务/规则表格补充设备基线的表头与内容背景覆盖、容器阴影和 hover 优先级。
- 为设备分组列表与分组详情两张表补齐 `device-data-table` 容器、阴影、表头/内容背景和整行 hover。
- 为告警详情、场景管理、场景联动、设备告警详情的静态 `NTable` 增加明确包装、表头、行线、hover 和阴影。
- 为 `src/views/manage/menu/index.vue`、`src/views/manage/role/index.vue`、`src/views/manage/user/index.vue` 补齐 medium、主题覆盖、空态、行线和 hover；这 3 个页面此前作为旧参考实例遗漏在批量改造之外。
- 为其余已改造的 `.standard-table` 容器补齐设备基线的轻量阴影，避免同类页面视觉退化。

补充验证：`pnpm run typecheck`、`pnpm run build`、`git diff --check` 均通过；构建仅保留既有 UnoCSS 图标 warning。定向 ESLint 仍受仓库既有 `no-empty` 错误阻断，未修改无关数据流逻辑。

## 11. 二次页面复查后的主题修复

用户使用租户账号复查时发现告警页仍保留旧表头背景/线框。根因是告警、场景、插件、服务和规则等 `.table-standard` 表格只补了局部 CSS，没有复用设备列表通过 `theme-overrides` 注入的 Naive UI 表格主题，默认主题层仍会覆盖视觉结果。

本次将设备列表主题配置抽取为 `src/utils/table-theme.ts`，并复用于设备列表及全部 `.table-standard` 远程表格。已在 5003 正确工作区登录后人工复查告警信息、通知记录、通知组、场景管理和设备分组页面，表头背景、外框和行 hover 已与设备列表基线一致。`pnpm run typecheck`、`pnpm run build`、`git diff --check` 均通过。
