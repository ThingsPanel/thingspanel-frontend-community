# ThingsPanel 前端表格标准审计与替换方案

## 1. 结论先行

本次是静态代码审计，结论是：表格问题较大，但核心不是把 `NDataTable` 换成另一个 UI 组件，而是把分散在业务页面里的“请求、分页、加载、空态、列配置和响应式布局”统一起来。

当前仓库共有 **49 个 `NDataTable` 实例，分布在 48 个文件**：

| 分类                      |                        数量 | 结论                                                                                              |
| ------------------------- | --------------------------: | ------------------------------------------------------------------------------------------------- |
| 已接近 Soybean 标准的页面 |                    3 个实例 | `manage/user`、`manage/role`、`manage/menu`，可作为迁移参考，但本地 `useTable` 的分页回调仍有缺陷 |
| 设备管理复合组件          |                    1 个实例 | `data-table-page` 同时承担卡片、表格、地图、搜索和分页，不能简单按普通列表替换                    |
| 演示/看板小表             |                    2 个实例 | 组件示例和首页看板，不应强行接入远程分页                                                          |
| 真正需要业务迁移的实例    | **43 个，分布在 42 个文件** | 这是主要改造范围                                                                                  |

因此建议按以下口径排期：

- **核心实施任务：44 个**：共享表格基础设施 1 个、42 个业务文件、设备管理复合组件 1 个。
- **可选收尾任务：1 个**：组件示例和看板小表的样式/空态对齐，作为 T45，不纳入普通列表迁移。
- 由于 `src/views/device/grouping-details/index.vue` 中有 2 个表格，所以“文件任务数”和“表格实例数”相差 1。

## 1.1 当前最新状态（2026-09-20）

设备管理列表已经完成第一版视觉标准样板，作为后续页面替换的基准：

- `src/components/data-table-page/index.vue`：使用 Naive UI `NDataTable` medium 尺寸，表头与内容统一 14px，常规字重 400，保留清晰的行分隔线和整行 hover 高亮。
- 表格列统一使用 12px 左右内边距，设备名称左对齐，内容不再使用过重字重。
- 在线、离线、告警、未告警状态恢复为 Naive UI 官方 `NTag` 默认样式，分别使用 `success`、`default`、`warning`、`default` 类型。
- 设备名称保留左侧在线状态提示点；这只是信息提示，不改变设备状态数据或请求逻辑。
- 当前 5002 本地服务已加载上述样式，ESLint、TypeScript 类型检查和 `git diff --check` 已通过。

后续表格替换的边界已经明确：

1. 本轮只统一表格布局和视觉表现，包括字号、字重、内边距、边框、行分隔、hover、空态、横向滚动和 Naive UI 官方状态组件样式。
2. 不修改 API、接口字段、请求参数、分页语义、业务权限和后端逻辑。
3. 只有发现纯 UI 层无法表达现有数据时，才记录为阻塞项，不在本轮顺手改数据流。
4. 远程分页、loading、错误收口等数据流问题继续保留在后续治理任务中，避免把“视觉替换”扩大成接口重构。

## 2. 审计依据和目标标准

审计仓库：`thingspanel-frontend-community`

审计分支：`codex/revert-community-tenant-permission`

审计时间：2026-09-20

参考项目：[`soybeanjs/soybean-admin`](https://github.com/soybeanjs/soybean-admin)

参考实现：[`src/hooks/common/table.ts`](https://raw.githubusercontent.com/soybeanjs/soybean-admin/main/src/hooks/common/table.ts)、[`table-header-operation.vue`](https://raw.githubusercontent.com/soybeanjs/soybean-admin/main/src/components/advanced/table-header-operation.vue)、[`table-column-setting.vue`](https://raw.githubusercontent.com/soybeanjs/soybean-admin/main/src/components/advanced/table-column-setting.vue)

目标标准不是“所有表格都使用同一个页面组件”，而是分两类：

### 2.1 远程列表表格

适用于有接口、搜索、分页、刷新、批量操作的列表页。

统一要求：

1. 页面只维护查询条件和业务动作，表格请求由统一 composable 管理。
2. `columns` 使用工厂函数，支持语言切换后重新生成。
3. 分页只有一个数据源，页码、页大小变化都必须重新请求，搜索和重置必须回到第一页。
4. 统一 `loading`、错误收口、空数据状态和重复请求保护。
5. 必须有稳定的 `row-key`；有横向内容时由列宽计算 `scroll-x`，不能到处硬编码。
6. 桌面端使用 `flex-height`，移动端使用移动分页配置，避免页面滚动和表格滚动相互打架。
7. 页面操作区优先复用 `TableHeaderOperation`、`TableColumnSetting`。

### 2.2 内嵌/静态表格

适用于详情页、表单步骤、弹窗、看板和组件示例。

统一要求：

1. 可以直接使用 `NDataTable`，不强行接入远程分页 hook。
2. 仍须有明确列类型、稳定 key、必要的 `row-key`、loading/empty 表达和明确高度。
3. 只有确实从接口分页时才设置 `remote`；纯本地数据不应设置 `remote`。
4. 表格交互不得与父页面重复维护同一份分页状态。

## 3. 根因分析

### 3.1 三套表格数据流并存

- `src/hooks/common/table.ts`：当前 3 个管理页面使用，但实现是项目本地旧版，分页回调只更新分页状态，没有自动调用 `getData()`；`getData()` 也没有统一的 `try/finally` 错误收口。
- `src/hooks/business/use-hook-table.ts`：另一套旧 hook，包含另一种分页实现，但当前没有业务页面使用，属于架构分叉和维护负担。
- `src/components/data-table-page/index.vue`：设备管理页面自行实现搜索、请求、卡片/表格/地图视图、分页、行点击和 WebSocket 数据更新。

业务页面没有以共享数据流为边界，而是直接复制 `ref + loading + pagination + getTableData`，形成大量变体。

### 3.2 分页行为不一致

仓库中同时存在：

- `NDataTable` 内置 `pagination`；
- 表格外部 `NPagination`；
- 手写 `page/page_size`；
- 只设置 `page-count` 不设置 `item-count`；
- `remote` 与本地数据混用；
- 分页事件只改状态、不请求接口；
- 页大小变化不请求或不回到第一页。

这会直接造成用户看到“页码变了但数据没变”“搜索后仍停留在旧页”“页大小改变没有刷新”等问题。

### 3.3 表格呈现标准没有落地

不少实例缺少以下至少一项：`row-key`、`scroll-x`、`flex-height`、移动端分页、列设置、统一操作区、空态和可诊断的请求异常。部分表格使用固定 `calc(100vh - 442px)`，属于页面级硬编码，后续加筛选项或改变浏览器高度容易溢出。

### 3.4 维护风险高于视觉风险

目前最严重的不是颜色或边框，而是：

- 分页和请求的真实状态散落在多个变量中；
- loading 结束依赖成功路径，接口异常时可能一直转圈；
- 表格没有稳定行 key 或列 key 不合法；
- 搜索、重置、分页、刷新之间缺少单一入口；
- 大量业务表格无法复用列配置和通用操作；
- `use-hook-table.ts`、`index.vue.bat` 等遗留实现增加误用概率。

## 4. 完整盘点清单

问题代码标签：

- `P`：分页、请求触发或 remote 模式不统一。
- `L`：loading、错误、空态或重复请求处理不统一。
- `R`：响应式高度、横向滚动、移动端适配不统一。
- `K`：`row-key`、列 key、类型或列工厂不完整。
- `O`：操作区、列设置、刷新等公共能力没有复用。
- `E`：内嵌表格/特殊表格需要单独边界，不能套普通列表模板。

### 4.1 当前可保留的参考实例

| 文件                                  | 当前判断 | 需要注意                                                                                           |
| ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `src/views/manage/user/index.vue:202` | 接近标准 | 使用共享 `useTable`、统一操作区、列可见性和内置分页；但分页变更不会自动 `getData()`，必须先修 hook |
| `src/views/manage/role/index.vue:172` | 接近标准 | 同上                                                                                               |
| `src/views/manage/menu/index.vue:240` | 接近标准 | 同上；接口返回全量菜单，分页语义还需确认                                                           |

### 4.2 特殊组件和明确例外

| 文件                                                                | 当前判断                 | 目标                                                                                |
| ------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `src/components/data-table-page/index.vue:526`                      | 特殊复合组件，视觉样板已完成 | 保留卡片/表格/地图能力；本轮以设备列表的字号、对齐、行线、hover 和官方 `NTag` 为视觉基准，数据流收敛另列任务 |
| `src/views/component/table/index.vue:118`                           | 组件示例                 | 不接远程分页；只统一 loading/empty、列 key、固定高度和示例说明                      |
| `src/views/dashboard/analysis/components/bottom-part/index.vue:147` | 看板摘要小表             | 不接远程分页；保证高度、空态、长文本和单行策略                                      |

### 4.3 需要迁移的 43 个表格实例/42 个业务文件

| 任务 | 文件与位置                                                                    | 当前问题摘要                                          | 目标改法                                                    | 优先级 |
| ---- | ----------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- | ------ |
| T03  | `src/views/alarm/notification-group/index.vue:155`                            | 外置分页；页大小未绑定请求；表格无统一分页/行 key     | 迁移为远程列表 hook，分页、刷新、增删改后刷新统一收口       | P0     |
| T04  | `src/views/alarm/notification-record/index.vue:166`                           | 手写查询和 remote 分页；异常收口弱                    | 统一查询参数、分页、错误和空态                              | P0     |
| T05  | `src/views/alarm/warning-message/components/alarm-configuration.vue:251`      | 组件内自建 remote 分页                                | 接入统一分页适配层，保留组件自身筛选条件                    | P0     |
| T06  | `src/views/alarm/warning-message/components/new-information.vue:283`          | 组件内自建 remote 分页                                | 同 T05，统一 page/pageSize 和请求生命周期                   | P0     |
| T07  | `src/views/apply/plugin/index.vue:176`                                        | `pageData` 自行管理请求和分页                         | 改为标准列表 composable，操作成功后刷新同一数据源           | P0     |
| T08  | `src/views/apply/service/index.vue:189`                                       | 与插件页重复一套列表逻辑                              | 抽成标准远程列表，统一操作区和分页                          | P0     |
| T09  | `src/views/automation/scene-manage/index.vue:235`                             | 外置分页；页面中还有第二个日志列表                    | 主列表、日志列表分别使用标准分页上下文，避免互相污染        | P0     |
| T10  | `src/views/data-service/rule-engine/index.vue:230`                            | 手写分页、固定 `scroll-x`                             | 迁移标准 hook，计算列宽，补 row key/移动端分页              | P0     |
| T11  | `src/views/data-service/rule-engine/components/table-action-modal.vue:195`    | 弹窗表格直接绑定本地数据，缺少明确表格边界            | 保留本地表格，但补稳定 key、明确高度和空态；不接远程 hook   | P1     |
| T12  | `src/views/device/config/index.vue:372`                                       | 卡片/列表复合页，分页被关闭，排序和接口状态自管       | 复用 T02 的复合列表适配模式；统一搜索、排序、分页和视图切换 | P0     |
| T13  | `src/views/device/config-detail/modules/associated-devices.vue:270`           | 表格与外置分页分离，行点击自定义                      | 统一为详情页子列表 hook，保留行点击和选择能力               | P1     |
| T14  | `src/views/device/config-detail/modules/connection-info.vue:377`              | 表单内局部表格，loading 单独维护                      | 保留内嵌表格，补 row key、固定高度、empty 和操作列标准      | P1     |
| T15  | `src/views/device/config-detail/modules/extend-info.vue:222`                  | 旧分页代码已注释，表格直接展示列表                    | 明确为本地内嵌表格，删除死分页代码并统一列模型              | P2     |
| T16  | `src/views/device/details/modules/device-analysis.vue:232`                    | remote 分页直接写在详情模块中                         | 使用详情子列表适配层，搜索重置回第一页                      | P1     |
| T17  | `src/views/device/details/modules/device-diagnosis.vue:320`                   | 设置 `remote` 但未见对应分页配置                      | 若为本地诊断记录则去掉 remote；若接口分页则补完整分页链路   | P1     |
| T18  | `src/views/device/details/modules/device-status.vue:253`                      | remote 分页和详情筛选手写耦合                         | 统一分页、加载、空态和固定最大高度                          | P1     |
| T19  | `src/views/device/details/modules/expect-message.vue:202`                     | remote 分页但无统一请求 hook                          | 迁移标准远程列表，统一查询/刷新/异常                        | P1     |
| T20  | `src/views/device/details/modules/public/distribution-and-table.vue:412`      | 外置分页，接口字段和页码自行转换                      | 使用分页适配层，保留图表/表格联动                           | P1     |
| T21  | `src/views/device/details/modules/telemetry/modules/history-data.vue:172`     | 表格和分页分离，时间筛选与请求手写                    | 统一查询条件、分页、时间范围重置和加载状态                  | P1     |
| T22  | `src/views/device/details/modules/telemetry/modules/time-series-data.vue:532` | 表格与图表共存，分页状态复杂                          | 采用详情复合表格模式，明确表格数据和图表数据的请求边界      | P1     |
| T23  | `src/views/device/details/modules/telemetry/telemetry.vue:590`                | `pagination=false`，外置分页另维护 `log_page`         | 保留图表/遥测特殊布局，但让分页由唯一 composable 管理       | P1     |
| T24  | `src/views/device/grouping-details/index.vue:251、280`                        | 同一页面两套表格：分组表 remote，设备表外置分页       | 拆成两个独立列表上下文；分别提供 row key、分页和 loading    | P0     |
| T25  | `src/views/device/grouping-details/modules/device-select-list.vue:113`        | 选择表格和分页状态在组件内手写                        | 统一选择行 key、分页、查询重置和提交后的刷新                | P1     |
| T26  | `src/views/device/grouping/index.vue:104`                                     | 请求、搜索 debounce、页数均页面自管；缺少标准表格容器 | 接入远程列表 hook，保留行点击进入详情                       | P0     |
| T27  | `src/views/device/market/InstalledBundles.vue:379`                            | 内联创建 pagination 对象，列表生命周期分散            | 提取标准分页对象和远程数据转换                              | P1     |
| T28  | `src/views/device/service-details/components/AutomaticModeStep.vue:3`         | `pageData` 与 remote 分页来自局部实现                 | 接入通用服务设备列表适配层                                  | P1     |
| T29  | `src/views/device/service-details/components/serviceConfigModal.vue:382`      | 弹窗内远程表格，分页/选择/请求均局部维护              | 保留弹窗边界，复用远程分页和选择模型                        | P1     |
| T30  | `src/views/device/service-details/index.vue:156`                              | 与 T28/T29 重复 `pageData` 结构                       | 抽出服务接入列表 composable，页面只负责操作和弹窗           | P0     |
| T31  | `src/views/device/template/components/step/add-edit-commands.vue:312`         | 表单步骤内本地参数表格                                | 保留本地表格，统一列 key、空态和编辑操作，不接远程分页      | P1     |
| T32  | `src/views/device/template/components/step/add-edit-events.vue:281`           | 与命令表格重复实现                                    | 与 T31 共用参数表格配置                                     | P1     |
| T33  | `src/views/device/template/components/step/custom-commands.vue:179`           | 外置分页，分页事件和列表接口耦合                      | 改为标准远程列表，保留步骤内操作                            | P1     |
| T34  | `src/views/device/template/components/step/custom-controls.vue:180`           | 与自定义命令重复实现                                  | 与 T33 共用列表适配层                                       | P1     |
| T35  | `src/views/device/template/components/step/enum-info.vue:112`                 | 本地枚举小表，无统一空态/行 key 约束                  | 保留本地表格，补稳定 key 和编辑/删除语义                    | P2     |
| T36  | `src/views/device/template/components/step/model-definition.vue:422`          | 动态生成多张 remote 表，分页通过函数返回              | 抽出动态模型列表适配器，保证每个模型独立分页和 loading      | P0     |
| T37  | `src/views/device/template/index.vue:397`                                     | 列表视图关闭内置分页，页面自行管理数据                | 接入标准列表 hook，并明确是否后端分页                       | P0     |
| T38  | `src/views/management/api/index.vue:298`                                      | 远程分页、操作弹窗、loading 自管                      | 迁移标准列表和操作区                                        | P0     |
| T39  | `src/views/management/auth/index.vue:236`                                     | remote 分页和 row key 单独维护                        | 迁移标准远程列表，统一权限操作和空态                        | P0     |
| T40  | `src/views/management/role/index.vue:217`                                     | 与管理 API 页重复列表逻辑                             | 迁移标准列表，消除重复 pageData/getData                     | P0     |
| T41  | `src/views/management/setting/components/data-clear-setting.vue:154`          | 配置内嵌表格，使用 flex-height 但没有统一容器         | 保留内嵌表格，补明确高度、row key 和异常空态                | P1     |
| T42  | `src/views/management/user/index.vue:505`                                     | remote 分页、空态、操作区自建                         | 迁移标准列表；不要与 `manage/user` 继续维护两套用户表格     | P0     |
| T43  | `src/views/rule-engine/index.vue:174`                                         | 与数据服务规则引擎重复一套分页/列逻辑                 | 抽公共规则列表 composable，两个页面复用                     | P0     |
| T44  | `src/views/system-management-user/system-log/index.vue:230`                   | 外置分页；页码变化回调和页大小请求不一致；列 key 为空 | 迁移标准远程列表，修正列 key、时间筛选和详情操作            | P0     |

## 5. 替换方式

### 5.1 推荐方案：先做兼容适配层，再分批迁移

第一步修改 `src/hooks/common/table.ts`，形成项目自己的稳定契约，命名可以暂时保持 `useTable`，避免一次性改动所有 import。契约至少包含：

```ts
const {
  data,
  columns,
  columnChecks,
  loading,
  empty,
  pagination,
  mobilePagination,
  scrollX,
  getData,
  updateSearchParams,
  resetSearchParams
} = useTable({
  apiFn,
  apiParams,
  transformer,
  columns: createColumns,
  onPaginationParamsChange
})
```

兼容层需要补齐：

1. 分页变化自动触发请求。
2. 请求使用 `try/finally`，并提供统一错误提示或错误状态。
3. 查询、重置、刷新、删除成功后只调用一个 `getData()`。
4. 统一返回 `mobilePagination` 和 `scrollX`。
5. 列检查项支持 selection/expand/action，不把列设置逻辑复制到页面。
6. 为接口返回保留统一 transformer，兼容本项目 `list/total` 和 Soybean 风格 `records/current/size/total`。

这一步完成后，业务页面改造主要是把“手写状态”替换成 hook 返回值，不需要先升级整个项目依赖或强行同步 Soybean Admin 最新目录结构。

### 5.2 页面迁移模板

远程列表页面统一为：

```vue
<NCard>
  <template #header-extra>
    <TableHeaderOperation
      v-model:columns="columnChecks"
      :loading="loading"
      @refresh="getData"
    />
  </template>

  <NDataTable
    :columns="columns"
    :data="data"
    :loading="loading"
    :pagination="mobilePagination"
    :scroll-x="scrollX"
    :row-key="row => row.id"
    :flex-height="!appStore.isMobile"
  />
</NCard>
```

内嵌表格不需要套上述完整页面模板，只使用统一的列类型、row key、空态和高度规则。

### 5.3 遗留代码处理

迁移完成并通过检索验证后：

- 删除或合并没有调用方的 `src/hooks/business/use-hook-table.ts`。
- 删除或归档 `src/components/data-table-page/index.vue.bat`，避免误以为是可用实现。
- 对 `src/components/data-table-page/index.vue` 保留业务所需的卡片/地图能力，不把它当作普通表格组件复制到其他页面。
- 对 `src/views/management/user/index.vue` 与 `src/views/manage/user/index.vue` 做业务语义核对，避免同一类用户维护两套不同表格体验。

## 6. 实施顺序与任务量

| 阶段     | 任务                                 | 数量 | 目标                                                         |
| -------- | ------------------------------------ | ---: | ------------------------------------------------------------ |
| Phase 0  | T01 共享表格基础设施                 |    1 | 后续数据流治理；不作为本轮视觉替换的前置阻塞 |
| Phase 1  | T03-T09 告警、申请、自动化列表       |    7 | 先处理用户最常操作、远程分页风险最高的列表                   |
| Phase 2  | T10-T30 数据服务、设备、服务接入列表 |   21 | 统一复杂详情、弹窗和复合列表边界                             |
| Phase 3  | T31-T44 模板、管理、规则、日志列表   |   14 | 消除重复实现，完成后台主数据列表统一                         |
| Phase 4  | T02 设备管理复合组件                 |    1 | **视觉基线已完成**；后续只处理复合页数据流治理，不回退现有视觉标准 |
| 可选收尾 | T45 组件示例和看板小表               |    1 | 只做样式、空态和高度对齐，不接远程分页                       |

**推荐排期：44 个核心任务；若连示例和看板也纳入统一验收，则为 45 个任务。**

## 7. 验收标准

### 7.1 通用手工验证

每个远程列表至少验证以下场景：

1. 首次进入：只发起一次列表请求，loading 能开始并结束。
2. 翻页：页码变化后请求参数变化，数据和页码一致。
3. 改变页大小：回到第一页并重新请求。
4. 搜索：清空旧数据或显示加载状态，结果回到第一页。
5. 重置：查询条件恢复默认值，结果回到第一页。
6. 空数据：显示空态，不显示上一页残留数据。
7. 接口失败：loading 结束，用户能看到错误，不会永久转圈。
8. 删除/编辑/新增：成功后只刷新一次，分页位置符合产品预期。
9. 横向内容：桌面端可以横向滚动，操作列不被截断。
10. 移动端：表格不撑破页面，分页控件可操作。

### 7.2 特殊场景验证

- 设备管理：卡片、列表、地图切换后数据一致；WebSocket 更新在线状态时三种视图同步；切换页码后订阅设备集合同步变化。
- 分组详情：分组表和设备表分页互不影响；选择设备后切页不会丢失或误选。
- 模型定义：多个动态模型表各自加载、分页和空态互不污染。
- 遥测页面：表格分页、图表时间范围和全屏状态互不触发重复请求。
- 弹窗/表单内表格：关闭弹窗后不会残留请求；提交成功后父列表刷新一次。

### 7.3 静态检查

完成迁移后执行：

```bash
rg -n "useHookTable|index\\.vue\\.bat|<n-data-table|<NDataTable|<n-pagination|<NPagination" src
pnpm exec eslint src/hooks/common/table.ts src/components/advanced src/views
pnpm build
```

并人工确认：业务远程列表不再出现页面级复制的 `startLoading/endLoading + pagination + getTableData` 三件套；内嵌表格仍可保留直接 `NDataTable`，但必须明确它不是远程列表。

## 8. 方案对比与建议

| 方案      | 做法                                       | 优点                                                | 缺点/风险                                                  | 是否符合当前需求 |
| --------- | ------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------- | ---------------- |
| A（推荐） | 先升级本地兼容 hook，再按任务清单迁移      | 风险可控、可分批上线、保留 ThingsPanel 特殊业务能力 | 需要先设计迁移契约，短期会同时存在新旧页面                 | **最符合**       |
| B         | 直接同步 Soybean Admin 最新表格目录和 hook | 与上游接近，长期可跟随上游                          | 当前项目依赖、接口返回、特殊页面差异大，容易引入大面积回归 | 不建议作为第一步 |
| C         | 每个页面独立重写成“看起来一样”的表格       | 单页改动快                                          | 重复逻辑继续增加，分页和异常问题会再次出现                 | 不符合根因治理   |

建议采用 **A**：先修一个可验证的本地标准，再以 T03、T04、T42、T44 作为第一批样板，确认分页、搜索、异常、移动端和列配置都通过后，再扩散到设备和模板模块。

## 9. 结构、可靠性和退化分析

### 好处

- 结构更清晰：页面关注业务，hook 关注列表数据流，表格组件关注呈现。
- 行为更可靠：分页、搜索、刷新、空态、错误处理只有一条路径。
- 修改更明确：后续新增列表可以直接复制标准模板，不再从旧页面猜规则。
- 维护成本下降：规则引擎、服务接入、管理列表等重复逻辑可以共享。
- 更容易测试：请求次数、参数、分页、空态和异常都有统一验收点。

### 可能的坏处

- 第一阶段需要修改共享 hook，短期会影响多个页面，必须先加回归验证。
- 复合页面、动态模型表、遥测图表不能完全套用普通列表模板，需要保留少量特化适配器。
- 如果过度追求“所有页面一模一样”，会损失详情页和弹窗的业务可读性。

### 可能的退化

- 统一分页后，原来依赖前端缓存的页面可能增加接口请求。
- 统一清空数据策略后，弱网环境下可能出现短暂空态，需要用 loading 或保留旧数据策略明确区分。
- 统一 `scroll-x` 和固定高度后，某些窄屏表格可能需要重新确认列宽与操作列优先级。

这些不是拒绝统一的理由，而是需要写进每个任务的验收场景，不能只依赖编译通过。

## 10. 业务价值

- 对用户：列表翻页、搜索、刷新和移动端操作更可预期，减少“点了没有反应”或数据看似未更新的问题。
- 对客户交付：不同模块的后台体验一致，培训、演示和售后排障成本更低。
- 对市场：统一、稳定的管理后台会降低客户对系统成熟度的疑虑，尤其适合设备、告警、规则、日志这类高频运维场景。
- 对商业化：后续新增设备类型、协议、规则和租户管理页面可以更快交付，减少重复开发，把人力投入到客户真正可感知的能力上。

## 11. 本次修改与后续建议

本轮已完成设备列表视觉样板，并更新了本计划文件。设备列表相关改动仅涉及表格布局样式、列展示和状态标签表现，没有修改 API、请求参数、分页语义、权限或后端逻辑；工作区中已有的 `env.config.ts`、`package.json`、`src/router/elegant/routes.ts` 修改不应被覆盖。

后续新任务将以设备列表为基准，把 T03-T44 及 T45 中适用的表格逐页替换，执行边界如下：

1. **只改布局样式**：统一字号、字重、内边距、边框、横向滚动、行 hover、空态、高度和状态标签视觉。
2. **保留业务行为**：不改 API、接口字段、请求参数、权限、分页请求和业务操作逻辑。
3. **按模块并行推进**：告警/申请/自动化、设备/详情/服务接入、模板/管理/规则/日志分组处理，避免多个任务同时改同一个文件。
4. **逐页验收**：每个页面记录文件、表格实例、采用的基准样式、是否存在特殊交互和人工核对结果。
5. **数据流问题单独登记**：如果页面存在分页或请求生命周期问题，只在报告中标记，不在本轮越界修改。

推荐执行顺序：先并行完成互不重叠的业务模块，再由主任务统一检查样式一致性、代码检查和人工核对清单，最后生成汇报文档。

## 12. 经验教训与记忆建议

本次最重要的经验是：表格视觉标准和数据流标准需要分层管理。视觉替换可以先统一字号、字重、间距、行线、hover、空态和状态标签，不应因为页面存在历史分页问题就顺手改 API 或请求逻辑；数据流契约应作为后续独立任务验证和迁移。

建议将以下内容写入项目记忆，但本次暂不自动写入，待确认后再记录：

> ThingsPanel Community 前端表格改造采用“设备列表视觉基线 + 远程列表数据流治理 + 内嵌表格轻量规范”的分层标准；当前批量替换只改布局样式和官方 Naive UI 组件表现，不修改 API；数据流治理另行按审计清单分批迁移，不直接同步上游 Soybean Admin 全量目录。
