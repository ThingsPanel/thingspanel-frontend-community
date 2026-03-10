# 设备数据绑定全链路架构设计书

> **状态**: Draft
> **涉及仓库**: `thingspanel-frontend-community` (Host) + `thingsvis` (Guest)
> **优先级**: P0 — 补齐从设备数据到可视化组件渲染的完整闭环

---

## 一、现状总览

> **⚠️ Session 2 更新 (2025-01)**: 补充单设备完整链路验证结果 + 入口纠正 + 品牌解耦缺口 + 控制下发详情

### 入口纠正 — ThingsVis 已有独立页面

老看板 (`kanban-details/index.vue`) 已**不是** ThingsVis 入口。ThingsVis 的实际入口已通过独立路由实现：

| 路由视图 | 路径 | 说明 |
|---------|------|------|
| `visualization/thingsvis/index.vue` | `/visualization/thingsvis` | ThingsVis 项目列表 (CRUD) |
| `visualization/thingsvis-dashboards/index.vue` | `/visualization/thingsvis-dashboards` | 项目下的大屏列表 |
| `visualization/thingsvis-editor/index.vue` | `/visualization/thingsvis-editor?id=:dashboardId` | 使用 `<ThingsVisAppFrame>` 全屏编辑 |
| `visualization/thingsvis-preview/index.vue` | `/visualization/thingsvis-preview` | 使用 `<ThingsVisViewer>` 预览 |

老看板视图 (`kanban/`, `kanban-details/`) 仍存在但与 ThingsVis 集成无关，忽略之。

---

### 已完成 ✅

| 层 | 能力 | 代码位置 |
|---|---|---|
| **SDK 通信** | ThingsVisClient postMessage 双向协议 (tv:init / tv:event / tv:save) | `src/utils/thingsvis/sdk/client.ts` |
| **SSO 认证** | ThingsPanel JWT → ThingsVis JWT 令牌交换 | `src/utils/thingsvis/thingsvis-auth.ts` |
| **物模型提取** | `extractPlatformFields()` 从设备模板提取遥测/属性字段 | `src/utils/thingsvis/platform-fields.ts` |
| **Widget 宿主组件** | `<ThingsVisWidget>` 嵌入 iframe，响应式推送数据 | `src/components/thingsvis/ThingsVisWidget.vue` |
| **App 全屏模式** | `<ThingsVisAppFrame>` 托管完整 ThingsVis 编辑器 | `src/components/thingsvis/ThingsVisAppFrame.vue` |
| **设备模板图表配置** | `web-chart-config.vue` 加载物模型字段 → 传 `platformFields` → ThingsVis 编辑器 → 保存到 `web_chart_config` | `src/views/device/template/components/step/web-chart-config.vue` |
| **单设备实时轮询** | `telemetry-chart.vue` 轮询 `telemetryDataCurrent` + `getAttributeDataSet` → 推送 `currentData` 到 Widget | `src/views/device/details/modules/telemetry-chart.vue` |
| **ThingsVis 数据源引擎** | DataSourceManager + PlatformFieldAdapter + ExpressionEvaluator | `packages/thingsvis-kernel/src/datasources/` |
| **编辑器属性面板绑定 UI** | Data Tab 中 Expression 编辑 + PlatformFieldPicker | `apps/studio/src/components/RightPanel/` |
| **ThingsVis 独立入口** | 项目 / 大屏 / 编辑 / 预览 四级路由 | `src/views/visualization/thingsvis*/` |
| **WebSocket 基础设施** | 遥测 WS (`/telemetry/datas/current/keys/ws`) + 设备状态 WS | `src/utils/websocketUtil.ts` |

### 缺失 / 断裂 ❌

| # | 缺口 | 影响面 | 严重度 |
|---|---|---|---|
| **G1** | **~~看板页面未接入 ThingsVis~~** ✅ 已通过独立路由解决 | — | ✅ 已解决 |
| **G2** | **多设备数据绑定** — 当前仅支持单设备模板维度；ThingsVis 独立大屏无多设备数据绑定机制 | 折线图需要多设备多指标叠加 | 🔴 |
| **G3** | **WebSocket 实时数据未桥接到 ThingsVis** — 模板图表只有 HTTP 轮询，无 WS 实时推送 | 数据延迟 5 秒+，不适合实时监控 | 🟡 |
| **G4** | **控制指令双向通道** — `web-chart-config.vue` 显式过滤掉 `command` 类型字段；开关/按钮组件无法下发 | 所有控制类 Widget 均无法使用 | 🔴 |
| **G5** | **大屏级设备数据源编排** — ThingsVis 独立大屏无「绑定哪些设备指标」的配置入口 | 大屏无法关联设备实时数据 | 🔴 |
| **G6** | **历史数据查询** — 折线图需要历史时序数据（聚合接口），当前仅推送当前值 | 折线图无法展示趋势 | 🔴 |
| **G7** | **设备在线状态推送** — ThingsVis 中无设备上下线感知机制 | 状态卡片、指示灯组件无法工作 | 🟡 |
| **G8** | **品牌耦合** — ThingsVis 核心包硬编码 `z.literal('ThingsPanel')`；docker 镜像在 `thingspanel` 命名空间 | ThingsVis 无法作为通用平台发布 | 🟡 |

---

## 一（补充）、已验证的单设备完整链路

> 以下流程已在代码中完整实现并可运行，记录于此作为参考基准。

### A. 物模型配置 → ThingsVis Widget 绑定（设备模板维度）

```
model-definition.vue                     web-chart-config.vue
     │                                           │
     │ 管理员在「设备模板」向导中                │
     │ 定义物模型字段 (4 个 Tab):               │
     │   telemetryApi()   →  /device/model/telemetry   │
     │   attributesApi()  →  /device/model/attributes  │
     │   commandsApi()    →  /device/model/commands     │
     │   eventsApi()      →  /device/model/events       │
     │                                           │
     │           下一步 →                       │
     │                                           ▼
     │                             Promise.all([
     │                               telemetryApi({ device_template_id }),
     │                               attributesApi({ device_template_id })
     │                             ])
     │                             │
     │                             ▼
     │                         extractPlatformFields(source)
     │                             │  ⚠️  commands 被显式过滤掉:
     │                             │  filter(f => f.dataType !== 'command')
     │                             ▼
     │                         platformFields = [telemetry fields, attribute fields]
     │                             │
     │                             ▼
     │                         <ThingsVisWidget
     │                           mode="editor"
     │                           :platform-fields="platformFields"
     │                         />
     │                             │
     │                             │ 用户在 ThingsVis 编辑器中
     │                             │ Data Tab → PlatformFieldPicker 选择字段
     │                             │ 绑定表达式: {{ ds.__platform__.temperature }}
     │                             │
     │                             │ tv:save 消息 ←──── 用户点击「保存」
     │                             ▼
     │                         putTemplat({
     │                           web_chart_config: JSON.stringify({
     │                             ...widgetConfig,
     │                             refreshInterval: 5000
     │                           })
     │                         })
     │                             │
     │                             ▼
     │                         POST /device/template  →  后端存储
```

**关键 API**（均在 `src/service/api/system-data.ts`）：
- `telemetryApi({ device_template_id })` → `GET /device/model/telemetry` — 物模型遥测字段定义
- `attributesApi({ device_template_id })` → `GET /device/model/attributes` — 物模型属性字段定义
- `commandsApi({ device_template_id })` → `GET /device/model/commands` — 控制命令定义（⚠ 当前未传入 ThingsVis）

---

### B. 设备详情 → 图表实时数据（运行时轮询）

```
设备详情页 (device-details)
     │
     │ props: { id: deviceId, deviceTemplateId }
     ▼
telemetry-chart.vue
     │
     │ initTemplateData(deviceTemplateId):
     │
     ├─ 1. deviceTemplateDetail({ id: deviceTemplateId })
     │      → GET /device/template/detail/:id
     │      → 返回 { web_chart_config: JSON, ... }
     │
     ├─ 2. Promise.all([
     │        telemetryApi({ device_template_id }),   // 字段定义
     │        attributesApi({ device_template_id })   // 字段定义
     │      ])
     │      → 构建 platformFields (用于 ThingsVis 字段映射)
     │
     ├─ 3. JSON.parse(web_chart_config) → initialConfig
     │      → hasTemplate = true
     │
     └─ startPolling():
          │
          │ 每 refreshInterval ms (默认 5000ms):
          │
          ├─ telemetryDataCurrent(deviceId)
          │    → GET /telemetry/datas/current/:id
          │    → 返回 [{ key, value }, ...]
          │
          ├─ getAttributeDataSet({ device_id: deviceId })
          │    → GET /attribute/datas/:device_id
          │    → 返回 [{ key, value }, ...]
          │
          ├─ processItem(): 构建 kvMap{ key → value }
          │
          ├─ 按 platformFields 过滤:
          │    dataMap[field.id] = kvMap[field.id] ?? kvMap[field.name]
          │
          └─ currentData.value = dataMap
               │
               ▼
          <ThingsVisWidget
            mode="viewer"
            :config="initialConfig"
            :platform-fields="platformFields"
            :data="currentData"
          />
               │
               ▼
          ExpressionEvaluator:
          {{ ds.__platform__.temperature }} → 25.3
```

**关键 API**（均在 `src/service/api/device.ts`）：
- `deviceTemplateDetail({ id })` → `GET /device/template/detail/:id` — 获取模板（含 `web_chart_config`）
- `telemetryDataCurrent(deviceId)` → `GET /telemetry/datas/current/:id` — 当前遥测值
- `getAttributeDataSet({ device_id })` → `GET /attribute/datas/:device_id` — 当前属性值
- `telemetryDataPub(params)` → `POST /telemetry/datas/pub` — **统一下发入口**（遥测值/控制命令均走此接口，**当前未使用在图表流中**）
- `attributeDataPub(params)` → `POST /attribute/datas/pub` — 属性写入（备选，按需使用）
- `commandDataPub(params)` → `POST /command/datas/pub` — 自定义命令（备选，按需使用）

---

### C. 控制下发的缺口（G4 的根因）

`web-chart-config.vue` 第 ~180 行存在显式过滤：

```typescript
// web-chart-config.vue
const filtered = extractedFields.filter((f: PlatformField) => f.dataType !== 'command')
platformFields.value = filtered   // ← commands 从未进入 ThingsVis
```

`commandsApi()` 返回的命令字段包含 `dataType: 'command'`，但：
1. 被 `web-chart-config.vue` 过滤出局，Switch/Button Widget 绑定不到命令
2. ThingsVis 侧 `PlatformFieldAdapter` 无 `write()` 实现
3. `message-router.ts` 无 `tv:command` 消息类型
4. `ThingsVisClient` 无 `onCommand()` 监听器

**完整下发链路需要打通 4 个点**（见 TASK-4 和 TASK-6）

---

### D. 品牌耦合（G8）

| 文件 | 耦合位置 | 内容 |
|------|---------|------|
| `packages/thingsvis-schema/src/datasource/platform-field-config.ts` | line 21 | `source: z.literal('ThingsPanel')` — ThingsPanel 字符串硬编码进 Zod schema |
| `docker-compose.yml` | line 30 | `image: ghcr.io/thingspanel/thingsvis-server:latest` |
| `docker-compose.yml` | line ~50 | `image: ghcr.io/thingspanel/thingsvis-studio:latest` |

此问题使 ThingsVis 无法独立作为通用可视化平台发布，见 TASK-8。

---

## 二、数据模型层 (Schema)

### 2.1 设备数据源配置 — ThingsPanel 侧

新增 `DeviceDataSourceConfig`，保存在看板(Board)或项目(Project)粒度，描述哪些设备的哪些指标需要绑定。

```typescript
// src/typings/thingsvis-data-source.d.ts (新建)

/** 单个设备的指标绑定 */
interface DeviceMetricBinding {
  /** 设备 ID */
  deviceId: string;
  /** 设备名称（缓存，用于 UI 展示） */
  deviceName: string;
  /** 指标标识符（物模型 key） */
  metricsId: string;
  /** 指标显示名 */
  metricsName: string;
  /** 数据类型: telemetry | attribute | command */
  metricsType: 'telemetry' | 'attribute' | 'command';
  /** 值类型 */
  dataType: 'number' | 'string' | 'boolean' | 'json';
  /** 单位 */
  unit?: string;
  /** 下发策略: 默认 'telemetry'，对应 /telemetry/datas/pub 统一入口 */
  pubApi?: 'telemetry' | 'attribute' | 'command';
}

/** 看板级设备数据源配置 */
interface BoardDeviceDataSourceConfig {
  /** 配置格式版本 */
  version: 2;
  /** 绑定的设备指标列表 */
  bindings: DeviceMetricBinding[];
  /** 数据刷新模式 */
  refreshMode: 'websocket' | 'polling';
  /** 轮询间隔 (ms)，仅 refreshMode=polling 时生效 */
  pollingInterval?: number;
  /** 历史查询配置 */
  historyConfig?: {
    timeRange: string;       // 'last_5m' | 'last_1h' | ... | 'custom'
    aggregateRange: string;  // 'no_aggregate' | '30s' | '1m' | ...
    aggregateFunction: string; // 'avg' | 'max' | 'sum' | 'diff'
  };
}
```

### 2.2 Platform Field 扩展 — 跨 iframe 传递

当前 `PlatformField` 仅有单设备字段。需扩展为支持多设备标识：

```typescript
// src/utils/thingsvis/types.ts (修改)

export interface PlatformField {
  /** 复合 ID: `${deviceId}::${metricsId}` (多设备) 或 metricsId (单设备) */
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'json';
  dataType: 'attribute' | 'telemetry' | 'command';
  unit?: string;
  description?: string;
  /** 新增: 所属设备 ID */
  deviceId?: string;
  /** 新增: 所属设备名 */
  deviceName?: string;
  /**
   * 新增: 下发策略小键。默认 'telemetry'（走 /telemetry/datas/pub 统一入口）。
   * 'attribute' → /attribute/datas/pub
   * 'command'   → /command/datas/pub
   * 字段在 extractPlatformFields() 时从物模型定义中读取，
   * 之后随配置传递到 ThingsVis， Widget 写操作时将它包含在 tv:command payload 中。
   */
  pubApi?: 'telemetry' | 'attribute' | 'command';
}
```

### 2.3 PostMessage 协议扩展

```typescript
// 新增消息类型

/** Host → Guest: 批量推送多设备实时数据 */
interface PlatformDataBatchMessage {
  type: 'tv:platform-data-batch';
  payload: {
    fields: Record<string, any>;  // { 'deviceId::metricsId': value, ... }
    timestamp: number;
  };
}

/** Guest → Host: 控制指令 */
interface PlatformCommandMessage {
  type: 'tv:command';
  payload: {
    /** 设备 ID（单设备模式可省略，Host 将使用当前设备 ID 补充） */
    deviceId?: string;
    /**
     * 下发策略: 直接反映 PlatformField.pubApi，默认 'telemetry'。
     * Host 按此字段选择 API (PUB_STRATEGY 映射表)，无需 if/else。
     */
    pubApi?: 'telemetry' | 'attribute' | 'command';
    key: string;
    value: unknown;
  };
}

/** Host → Guest: 指令执行结果回传 */
interface PlatformCommandResultMessage {
  type: 'tv:command-result';
  payload: {
    requestId: string;
    success: boolean;
    error?: string;
    echo?: unknown;
  };
}

/** Host → Guest: 历史数据响应 */
interface PlatformHistoryDataMessage {
  type: 'tv:history-data';
  payload: {
    requestId: string;
    fieldId: string;  // 'deviceId::metricsId'
    data: Array<{ timestamp: number; value: number | string }>;
  };
}

/** Guest → Host: 请求历史数据 */
interface PlatformHistoryRequestMessage {
  type: 'tv:request-history';
  payload: {
    requestId: string;
    /** 'deviceId::metricsId' 或单设备时的 metricsId */
    fieldId: string;
    /** 预置时间范围: 'last_5m' | 'last_1h' | 'last_6h' | 'last_1d' | 'last_7d' | 'custom' */
    timeRange: string;
    /**
     * 聚合窗口 (可选)。有此字段时走 GET /telemetry/datas/statistic (聚合，适合折线图)。
     * 无此字段时走 GET /telemetry/datas/history/page (原始分页，适合表格/导出)。
     * 示例: '30s' | '1m' | '5m' | '1h'
     */
    aggregateWindow?: string;
    /** 聚合函数: 'avg' | 'max' | 'min' | 'sum' | 'diff'，仅 aggregateWindow 存在时有效 */
    aggregateFunction?: string;
    /** 自定义时间范围起止，仅 timeRange='custom' 时需要 */
    startTime?: string;
    endTime?: string;
  };
}

/** Host → Guest: 设备在线状态 */
interface PlatformDeviceStatusMessage {
  type: 'tv:device-status';
  payload: {
    devices: Array<{ deviceId: string; isOnline: boolean }>;
  };
}
```

### 2.4 ThingsVis 侧 Schema 扩展

```typescript
// packages/thingsvis-schema/src/datasource/platform-field-config.ts (修改)

export const PlatformFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['number', 'string', 'boolean', 'json']),
  dataType: z.enum(['attribute', 'telemetry', 'command']),
  unit: z.string().optional(),
  description: z.string().optional(),
  deviceId: z.string().optional(),   // 新增
  deviceName: z.string().optional(), // 新增
});
```

---

## 三、后端服务层 (API)

ThingsPanel 后端 **无需改动**。所有需要的 API 均已存在：

| 数据类型 | API 端点 | 前端函数 | 用途 |
|---------|---------|---------|------|
| 遥测当前值 | `GET /api/v1/telemetry/datas/current/{device_id}` | `telemetryDataCurrent(id)` | 单设备所有 key 当前值 |
| 遥测按 Key | `GET /api/v1/telemetry/datas/current/keys` | `telemetryDataCurrentKeys(params)` | 按指定 key 查当前值 |
| **遥测聚合历史** ✅ 图表用 | `GET /api/v1/telemetry/datas/statistic` | `telemetryDataHistoryList(params)` | 折线图历史（按时间窗口聚合，支持 avg/max/sum/diff）params: `{ device_id, key, time_range, aggregate_window, aggregate_function }` |
| 遥测历史分页 | `GET /api/v1/telemetry/datas/history/page` | `telemetryHistoryData(params)` | 原始数据分页（用于列表/导出，不做聚合） |
| 属性数据 | `GET /api/v1/attribute/datas/{device_id}` | `getAttributeDataSet({ device_id })` | 设备属性当前值 |
| **统一下发** ✅ 控制用 | `POST /api/v1/telemetry/datas/pub` | `telemetryDataPub(params)` | **首选下发入口**，遥测值写入 + 控制命令均可走此接口 |
| 属性下发 | `POST /api/v1/attribute/datas/pub` | `attributeDataPub(params)` | 属性写入（备选） |
| 自定义命令下发 | `POST /api/v1/command/datas/pub` | `commandDataPub(params)` | 自定义命令（备选） |
| WS 遥测实时 | `ws://*/telemetry/datas/current/keys/ws` | `websocketUtil` | 实时推送，连接后发 `{ device_id, keys, token }` |
| WS 设备状态 | `ws://*/device/online/status/ws/batch` | `websocketUtil` | 上下线推送 |
| 物模型字段 | `GET /api/v1/device/model/telemetry` 等 | `telemetryApi() / attributesApi() / commandsApi()` | 字段定义（非运行时值） |
| 看板 CRUD | `GET/POST/PUT/DELETE /api/v1/board` | — | 看板持久化 |

---

## 四、前端交互层 (View) — 改动设计

### 4.1 架构分层

```
┌───────────────────────────────────────────────────────────────────────┐
│                  ThingsPanel (Host)                                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 看板详情页 (Board Detail View) — 新增 ThingsVis 模式分支        │  │
│  │                                                                 │  │
│  │  ┌──────────────┐   ┌──────────────────────────────────────┐   │  │
│  │  │ 设备数据源    │   │  ThingsVisAppFrame / ThingsVisWidget │   │  │
│  │  │ 配置面板     │   │  (已有组件, 增强数据推送)              │   │  │
│  │  │ (新建)       │   │                                      │   │  │
│  │  └──────┬───────┘   └────────────────┬─────────────────────┘   │  │
│  │         │                            │                         │  │
│  │         ▼                            ▼                         │  │
│  │  ┌──────────────┐   ┌──────────────────────────────────────┐   │  │
│  │  │ 设备指标     │   │  DeviceDataBridge (新建)              │   │  │
│  │  │ 选择器组件   │   │  — 统一管理 WS/HTTP 数据拉取          │   │  │
│  │  │ (已有,复用)  │   │  — 多设备数据归集                     │   │  │
│  │  └──────────────┘   │  — 控制指令反向代理                   │   │  │
│  │                     │  — 设备状态监听                       │   │  │
│  │                     └────────────────┬─────────────────────┘   │  │
│  │                                      │ pushData / postMessage  │  │
│  └──────────────────────────────────────┼─────────────────────────┘  │
│                                         │                            │
├─────────────────────── iframe boundary ─┼────────────────────────────┤
│                                         ▼                            │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │              ThingsVis (Guest / Iframe)                          ││
│  │                                                                  ││
│  │  EmbedPage → DataSourceManager → PlatformFieldAdapter            ││
│  │       ↓              ↓                    ↓                      ││
│  │  message-router   registerDS      listen tv:platform-data-batch  ││
│  │       ↓              ↓                    ↓                      ││
│  │  tv:command ←    KernelStore    →  ExpressionEvaluator           ││
│  │  (反向代理)      updateData         {{ ds.__platform__.xxx }}    ││
│  │       ↓                                   ↓                      ││
│  │  postMessage                          Widget Props → Render      ││
│  │  to parent                                                       ││
│  └──────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

### 4.2 任务拆解 — 按严格执行顺序

---

#### TASK-1: DeviceDataBridge 数据桥接服务 (核心)

**目标**: 创建一个无视图的服务类，统一管理多设备数据的拉取(WS + HTTP)和推送(postMessage)。

**新建文件**: `src/utils/thingsvis/device-data-bridge.ts`

**核心接口**:
```typescript
interface DeviceDataBridgeOptions {
  /** ThingsVisClient 实例 */
  client: ThingsVisClient;
  /** 设备指标绑定列表 */
  bindings: DeviceMetricBinding[];
  /** 数据刷新模式 */
  refreshMode: 'websocket' | 'polling';
  /** 轮询间隔 */
  pollingInterval?: number;
}

class DeviceDataBridge {
  constructor(options: DeviceDataBridgeOptions);

  /** 启动数据流 */
  start(): void;

  /** 停止数据流 */
  stop(): void;

  /** 更新绑定列表（设备变更时） */
  updateBindings(bindings: DeviceMetricBinding[]): void;

  /** 处理控制指令（来自 ThingsVis 的 tv:command） */
  handleCommand(payload: { deviceId?: string; pubApi?: 'telemetry' | 'attribute' | 'command'; key: string; value: unknown }): Promise<void>;

  /** 处理历史数据请求（两种模式，由 aggregateWindow 是否存在决定） */
  handleHistoryRequest(payload: {
    requestId: string;
    fieldId: string;
    timeRange: string;
    aggregateWindow?: string;   // 有 → statistic 聚合接口；无 → history/page 分页接口
    aggregateFunction?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<void>;

  /** 销毁 */
  destroy(): void;
}
```

**实现要点**:
- **WS 模式**: 复用 `websocketUtil.ts` 的连接逻辑，建立后发送 `{ device_id, keys: [metricsIds], token }` 订阅
- **轮询模式**: 按设备分组批量请求 `telemetryDataCurrent()` + `getAttributeDataSet()`
- **数据归集**: 将多设备数据合并为 `{ 'deviceId::metricsId': value }` 格式
- **推送**: 调用 `client.pushDataBatch(data)` → 触发 `tv:platform-data-batch`
- **控制指令**: 使用 `PUB_STRATEGY` 策略表路由（见 TASK-4 点 3）；默认走 `telemetryDataPub`
- **历史数据**:
  - `aggregateWindow` 存在 → `telemetryDataHistoryList()` → `GET /telemetry/datas/statistic`（聚合，折线图用）
  - `aggregateWindow` 不存在 → `telemetryHistoryData()` → `GET /telemetry/datas/history/page`（原始分页）
- **设备状态**: 使用 `DeviceStatusWebSocket` 监听上下线 → 推送 `tv:device-status`

---

#### TASK-2: SDK Client 扩展

**修改文件**: `src/utils/thingsvis/sdk/client.ts`

**新增方法**:
```typescript
class ThingsVisClient {
  // 已有...

  /** 批量推送多设备数据 */
  pushDataBatch(data: Record<string, any>): void {
    this.send('tv:platform-data-batch', {
      fields: data,
      timestamp: Date.now(),
    });
  }

  /** 推送设备在线状态 */
  pushDeviceStatus(devices: Array<{ deviceId: string; isOnline: boolean }>): void {
    this.send('tv:device-status', { devices });
  }

  /** 推送历史数据响应 */
  pushHistoryData(requestId: string, fieldId: string, data: Array<{ timestamp: number; value: any }>): void {
    this.send('tv:history-data', { requestId, fieldId, data });
  }

  /** 监听控制指令 */
  onCommand(handler: (payload: { deviceId: string; commandType: string; key: string; value: unknown }) => void): () => void {
    return this.on('tv:command', handler);
  }

  /** 监听历史数据请求 */
  onHistoryRequest(handler: (payload: { requestId: string; fieldId: string; timeRange: string; aggregateRange?: string; aggregateFunction?: string }) => void): () => void {
    return this.on('tv:request-history', handler);
  }
}
```

---

#### TASK-3: 看板 ThingsVis 模式集成

**修改文件**: `src/views/visualization/kanban-details/index.vue`

**改动意图**: 在看板详情页增加模式分支 — 当看板 `vis_type === 'thingsvis'` 时，渲染 ThingsVis 编辑器代替老 panel-manage。

**新增文件**: `src/views/visualization/kanban-details/thingsvis-board.vue`

**职责**:
1. 加载看板配置 (`getBoard`) → 解析 `config` 中的 ThingsVis 配置 + 设备绑定
2. 初始化 `DeviceDataBridge` 管理多设备数据流
3. 渲染 `<ThingsVisAppFrame>` 或 `<ThingsVisWidget>` (根据编辑/预览模式)
4. 绑定设备数据源配置面板

关键组合逻辑:
```vue
<script setup lang="ts">
import { DeviceDataBridge } from '@/utils/thingsvis/device-data-bridge';

// 加载看板时：从 board.config 解析出 thingsvisConfig + deviceBindings
// 初始化 bridge + client
// 编辑保存时：将 thingsvisConfig + deviceBindings 合并写回 board.config
</script>
```

---

#### TASK-4: 控制指令下发链路（G4 修复）

**目标**: 打通从 ThingsVis 控制 Widget（开关、按钮）→ ThingsPanel API → 设备的完整下发链路。

**根因**: `web-chart-config.vue` 显式过滤命令字段，且 ThingsVis 侧缺少写操作机制。

**需改动的 4 个点**：

**点 1** — `web-chart-config.vue`: 将 commands 加入 platformFields，标记 `dataType: 'command'`
```typescript
// 修改: 不再过滤 command，改为全部传入 (ThingsVis 侧按 dataType 分组展示)
const filtered = extractedFields  // 去掉 filter(f => f.dataType !== 'command')
platformFields.value = filtered
```

**点 2** — `src/utils/thingsvis/sdk/client.ts`: 新增 `onCommand()` 监听 `tv:command` 消息
```typescript
onCommand(handler: (payload: { deviceId: string; commandType: 'telemetry' | 'attribute' | 'command'; key: string; value: unknown }) => void): () => void {
  return this.on('tv:command', handler);
}
```

**点 3** — `src/components/thingsvis/ThingsVisWidget.vue`: 处理 `tv:command` → 策略路由到对应 API
```typescript
import { telemetryDataPub, attributeDataPub, commandDataPub } from '@/service/api/device'

// 策略表：按 pubApi 字段路由，默认走统一下发接口 telemetryDataPub
const PUB_STRATEGY: Record<string, (deviceId: string, key: string, value: unknown) => Promise<void>> = {
  // telemetry: 统一下发入口，最常用 (POST /telemetry/datas/pub)
  telemetry: (deviceId, key, value) =>
    telemetryDataPub({ device_id: deviceId, value: { [key]: value } }),
  // attribute: 属性写入 (POST /attribute/datas/pub)
  attribute: (deviceId, key, value) =>
    attributeDataPub({ device_id: deviceId, value: { [key]: value } }),
  // command: 自定义命令 (POST /command/datas/pub)
  command: (deviceId, key, value) =>
    commandDataPub({ device_id: deviceId, identify: key, value }),
}

client.onCommand(async (payload) => {
  const { pubApi = 'telemetry', key, value } = payload
  const deviceId = props.id  // 设备详情 tab 场景；多设备场景由 payload.deviceId 提供
  const strategy = PUB_STRATEGY[pubApi] ?? PUB_STRATEGY.telemetry
  await strategy(deviceId, key, value)
})
```

> **为什么默认走 `telemetry`**: 用户确认 `/api/v1/telemetry/datas/pub` 是 ThingsPanel 的统一下发入口。`pubApi` 字段由 `PlatformField` 携带（见 §2.2），允许每个字段声明自己的下发策略，无需在路由层硬判断类型。

**点 4** — ThingsVis 侧 (TASK-6 覆盖): `PlatformFieldAdapter.write()` + `tv:command` 消息类型

---

#### TASK-5: PlatformField 多设备提取增强

**新建文件**: `src/components/thingsvis/DeviceBindingPanel.vue`

**职责**: 可视化配置「哪些设备的哪些指标」要绑定到当前看板。

**UI 结构**:
```
┌────────────────────────────────────┐
│ 📡 设备数据源                      │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ ＋ 添加设备指标              │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ 📱 温湿度传感器 A            │   │
│ │   🔢 temperature (°C)       │   │
│ │   🔢 humidity (%)           │   │
│ │                         [✕]  │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ 📱 空调控制器 B              │   │
│ │   ✓ power (开关)            │   │
│ │   🔢 set_temp (°C)          │   │
│ │                         [✕]  │   │
│ └──────────────────────────────┘   │
│                                    │
│ ⚙ 刷新方式: ● WebSocket ○ 轮询  │
│ ⏱ 轮询间隔: [5000] ms            │
│                                    │
│        [保存配置]                  │
└────────────────────────────────────┘
```

**复用组件**:
- `DeviceMetricsSelector` (已有，`src/components/device-selectors/`) — 设备+指标下拉选择
- 设备列表 API: `deviceListForPanel()` (已有)
- 指标列表 API: `deviceMetricsList()` / 物模型选择器 API (已有)

---

#### TASK-5: PlatformField 多设备提取增强

**修改文件**: `src/utils/thingsvis/platform-fields.ts`

**新增函数**:
```typescript
/**
 * 从多设备绑定列表生成 PlatformField[]
 * 每个 field.id 使用 `deviceId::metricsId` 复合格式
 */
export function extractMultiDevicePlatformFields(
  bindings: DeviceMetricBinding[]
): PlatformField[] {
  return bindings.map(binding => ({
    id: `${binding.deviceId}::${binding.metricsId}`,
    name: `${binding.deviceName} / ${binding.metricsName}`,
    type: binding.dataType,
    dataType: binding.metricsType,
    unit: binding.unit,
    deviceId: binding.deviceId,
    deviceName: binding.deviceName,
  }));
}
```

---

#### TASK-6: ThingsVis 侧协议扩展

##### 6a. message-router 新增消息类型

**修改文件**: `apps/studio/src/embed/message-router.ts`

```typescript
export const MSG_TYPES = {
  // ... 已有 ...
  PLATFORM_DATA_BATCH: 'tv:platform-data-batch',  // 新增
  COMMAND: 'tv:command',                            // 新增
  COMMAND_RESULT: 'tv:command-result',              // 新增
  HISTORY_REQUEST: 'tv:request-history',            // 新增
  HISTORY_DATA: 'tv:history-data',                  // 新增
  DEVICE_STATUS: 'tv:device-status',                // 新增
} as const;
```

##### 6b. EmbedPage 处理新消息

**修改文件**: `apps/studio/src/pages/EmbedPage.tsx`

新增处理器:
- `PLATFORM_DATA_BATCH`: 批量转发到 PlatformFieldAdapter (替代逐字段 postMessage)
- `HISTORY_DATA`: 存入数据源的历史数据 slot
- `DEVICE_STATUS`: 更新设备在线状态变量 (注入 `$var.deviceStatus.{deviceId}`)
- `COMMAND_RESULT`: 回传给触发命令的 Widget 确认

##### 6c. PlatformFieldAdapter 增强

**修改文件**: `packages/thingsvis-kernel/src/datasources/PlatformFieldAdapter.ts`

新增能力:
- 监听 `tv:platform-data-batch` → 一次性写入多个字段缓存 → 单次 `emitData()` (性能优化)
- `write(key, value)` 实现 → 发送 `tv:command` 给 Host → 等待 `tv:command-result`
- `requestHistory(fieldId, options)` → 发送 `tv:request-history` → 返回 Promise → 被 `tv:history-data` 解析

---

#### TASK-7: 看板创建入口增加 ThingsVis 类型

**修改文件**: `src/views/visualization/kanban/index.vue`

**改动意图**: 新建看板时增加 `vis_type: 'thingsvis'` 选项，与老看板共存。

---

#### TASK-8: 品牌解耦（G8）

**目标**: 移除 ThingsVis 核心包中对 `ThingsPanel` 字符串的硬编码，使 ThingsVis 成为通用可视化引擎。

**修改文件 1**: `packages/thingsvis-schema/src/datasource/platform-field-config.ts`
```typescript
// 修改前 (line 21):
export const PlatformFieldConfigSchema = z.object({
  source: z.literal('ThingsPanel'),   // ← 品牌硬编码
  fieldMappings: z.record(z.string()),
  deviceContext: z.string().optional(),
});
export const DEFAULT_PLATFORM_FIELD_CONFIG = { source: 'ThingsPanel', ... }

// 修改后: 改为字符串，不限定平台名
export const PlatformFieldConfigSchema = z.object({
  source: z.string().min(1),          // ← 通用字符串，支持任意平台
  fieldMappings: z.record(z.string()),
  deviceContext: z.string().optional(),
});
export const DEFAULT_PLATFORM_FIELD_CONFIG = { source: 'platform', ... }
```

**修改文件 2**: `docker-compose.yml`
```yaml
# 修改前:
image: ghcr.io/thingspanel/thingsvis-server:latest
image: ghcr.io/thingspanel/thingsvis-studio:latest

# 修改后 (使用 thingsvis 独立组织):
image: ghcr.io/thingsvis/thingsvis-server:latest
image: ghcr.io/thingsvis/thingsvis-studio:latest
```

> **注意**: docker 镜像命名空间变更需要配合 CI/CD 发布流程调整，确认组织迁移计划后再执行。

---

## 五、全栈受波及文件清单

### ThingsPanel (thingspanel-frontend-community)

| 文件路径 | 动作 | 改动意图 |
|---------|------|---------|
| `src/typings/thingsvis-data-source.d.ts` | **新建** | DeviceMetricBinding / BoardDeviceDataSourceConfig 类型定义 |
| `src/utils/thingsvis/device-data-bridge.ts` | **新建** | 多设备数据桥接服务核心 |
| `src/utils/thingsvis/sdk/client.ts` | **修改** | 新增 pushDataBatch / pushDeviceStatus / pushHistoryData / **onCommand** / onHistoryRequest |
| `src/utils/thingsvis/types.ts` | **修改** | PlatformField 新增 deviceId / deviceName 字段 |
| `src/utils/thingsvis/platform-fields.ts` | **修改** | 新增 extractMultiDevicePlatformFields() |
| `src/components/thingsvis/ThingsVisWidget.vue` | **修改** | **新增 tv:command 处理 → attributeDataPub / commandDataPub 路由** |
| `src/components/thingsvis/DeviceBindingPanel.vue` | **新建** | 设备数据源配置面板 (大屏编辑器侧边栏) |
| `src/views/device/template/components/step/web-chart-config.vue` | **修改** | **移除 command 字段过滤，允许控制类字段传入 platformFields** |
| `src/views/visualization/thingsvis-dashboards/index.vue` | **修改** | 大屏增加设备绑定配置入口 |
| `src/views/visualization/thingsvis-editor/index.vue` | **修改** | 集成 DeviceDataBridge，建立大屏级数据流 |

### ThingsVis (thingsvis)

| 文件路径 | 动作 | 改动意图 |
|---------|------|---------|
| `apps/studio/src/embed/message-router.ts` | **修改** | 新增 tv:command / tv:command-result / tv:platform-data-batch / tv:history-* / tv:device-status |
| `apps/studio/src/pages/EmbedPage.tsx` | **修改** | 处理 batch / command / history / status 新消息 |
| `packages/thingsvis-kernel/src/datasources/PlatformFieldAdapter.ts` | **修改** | 批量数据接收 + **write() 写操作** + requestHistory() |
| `packages/thingsvis-schema/src/datasource/platform-field-config.ts` | **修改** | **z.literal('ThingsPanel') → z.string()** 品牌解耦 |
| `docker-compose.yml` | **修改** | **镜像命名空间 thingspanel → thingsvis** |

---

## 六、数据流序列图（折线图场景）

```
用户打开看板 → 加载看板配置
     │
     ▼
 看板详情页 (thingsvis-board.vue)
     │
     ├─ 1. 解析 board.config → deviceBindings + thingsvisConfig
     ├─ 2. extractMultiDevicePlatformFields(bindings) → PlatformField[]
     ├─ 3. new ThingsVisClient() → client
     ├─ 4. client.loadWidgetConfig(config, platformFields)
     │      └─ postMessage → tv:init → EmbedPage → DataSourceManager
     │
     ├─ 5. new DeviceDataBridge({ client, bindings, refreshMode: 'websocket' })
     │      ├─ 建立 WS 连接: ws://server/telemetry/datas/current/keys/ws
     │      │   └─ 认证: { device_id, keys: [metricsId], token }
     │      ├─ 建立设备状态 WS
     │      │
     │      └─ WS 收到数据 →
     │           归集为 { 'dev001::temperature': 25.3, 'dev001::humidity': 60 }
     │           └─ client.pushDataBatch(data)
     │                └─ postMessage → tv:platform-data-batch
     │                     └─ EmbedPage → PlatformFieldAdapter
     │                          └─ emitData → KernelStore
     │                               └─ ExpressionEvaluator
     │                                    └─ {{ ds.__platform__.dev001::temperature }}
     │                                         └─ ECharts Line Widget 渲染折线
     │
     ├─ 6. Widget 请求历史数据 (首次加载):
     │      └─ PlatformFieldAdapter.requestHistory('dev001::temperature', {
     │           timeRange: 'last_1h',
     │           aggregateWindow: '1m',       ← 有此字段 → statistic 聚合接口
     │           aggregateFunction: 'avg'
     │         })
     │           └─ postMessage → tv:request-history
     │                └─ DeviceDataBridge.handleHistoryRequest()
     │                     ├─ [aggregateWindow 存在] telemetryDataHistoryList({ device_id, key, time_range, aggregate_window, aggregate_function })
     │                     │    → GET /telemetry/datas/statistic → [{ ts, value }, ...]
     │                     └─ [aggregateWindow 不存在] telemetryHistoryData({ device_id, key })
     │                          → GET /telemetry/datas/history/page → 分页原始数据
     │                     └─ client.pushHistoryData(requestId, fieldId, data)
     │                          └─ postMessage → tv:history-data → Widget 渲染历史趋势
     │
     └─ 7. 开关 Widget 用户点击:
            └─ PlatformFieldAdapter.write('dev002::power', true)
                 └─ postMessage → tv:command { pubApi: 'telemetry', key: 'power', value: true }
                      └─ DeviceDataBridge.handleCommand()
                           └─ PUB_STRATEGY['telemetry']('dev002', 'power', true)
                                └─ telemetryDataPub({ device_id: 'dev002', value: { power: true } })
                                     └─ POST /telemetry/datas/pub → 后端下发 → 设备
                                          └─ client.send('tv:command-result', { success: true })
```

---

## 七、执行优先级排序

| 顺序 | 任务 | 依赖 | 产出 |
|------|------|------|------|
| **1** | TASK-1: DeviceDataBridge | 无 | 核心数据通道 |
| **2** | TASK-2: SDK Client 扩展 | TASK-1 | 通信方法 |
| **3** | TASK-5: 多设备 PlatformField | 无 (可与 1 并行) | 数据格式 |
| **4** | TASK-4 (控制下发): web-chart-config + ThingsVisWidget | 无 | **命令字段解封 + 下发路由** |
| **5** | TASK-6: ThingsVis 协议扩展 | TASK-2, TASK-4 | Guest 侧写操作 + 命令接收 |
| **6** | TASK-3: 大屏 ThingsVis 设备数据源配置面板 | TASK-1~5 | 配置 UI |
| **7** | TASK-7: 看板创建入口 | TASK-3 | 入口打通 |
| **8** | TASK-8: 品牌解耦 | 无（独立） | ThingsVis 通用发布 |

---

## 八、验收标准

1. **折线图**: 用户在 ThingsVis 看板中拖入 ECharts-Line Widget → 绑定 2 个设备的 temperature 字段 → 实时显示双折线 (WS 推送, <1s 延迟)
2. **数值卡片**: Value-Card Widget 绑定 `dev001::temperature` → 实时显示当前温度 + 单位
3. **开关控制**: Switch Widget 绑定 `dev001::power` → 点击切换 → 通过 tv:command { pubApi: 'telemetry' } 下发 `telemetryDataPub` → `POST /telemetry/datas/pub` → 设备响应
4. **设备状态**: 设备离线时，绑定该设备的 Widget 能感知 (通过 `$var.deviceStatus.{deviceId}`)
5. **历史数据**: 折线图首次加载时拉取最近 1 小时历史数据渲染趋势
6. **保存/加载**: 看板配置（含设备绑定 + ThingsVis 组件配置）正确持久化到 Board API，重新打开后完整恢复
7. **向后兼容**: 老看板 (`vis_type !== 'thingsvis'`) 不受影响，继续使用 panel-manage 体系
