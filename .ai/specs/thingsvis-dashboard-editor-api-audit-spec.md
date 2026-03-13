# 技术契约与架构设计书：可视化看板编辑器接口审计

## 1. 背景与结论

目标对象是 ThingsPanel 宿主中的 ThingsVis 可视化看板编辑器嵌入链路。当前一次性大量请求的根源，不在 ThingsVis Studio 自己主动扫接口，而在宿主侧 `ThingsVisAppFrame.vue` 的初始化流程会先构造整份 `platformDevices` 清单，再把它通过 `tv:init` 发给 Studio。

基于现有实现，接口可以分成三类：

1. **硬必需**：没有它们，编辑器字段选择器或运行时预览无法工作。
2. **弱必需/可延迟**：当前代码会用，但不应该放在初始化主链路里。
3. **当前收益很低**：会制造请求量，但对当前编辑器的数据预览和看板渲染几乎没有直接价值。

结论先行：

- 当前截图里最重的请求风暴，主要来自每个模板都并发调用一次 `/device/model/telemetry`、`/device/model/attributes`、`/device/model/events`、`/device/model/commands`，这段发生在宿主初始化，不是用户点字段后才触发。
- **真正对当前编辑器主流程有明确价值的，只有设备清单、配置到模板映射、遥测字段、属性字段、当前值、历史值、在线趋势这些接口。**
- `eventsApi` 与 `commandsApi` 在当前链路中最多只给字段选择器补“静态字段目录”，**不参与当前值读取、不参与历史回放、不参与编辑器初始化后的看板预览**，因此属于应延迟甚至可移除的请求。
- `deviceTemplateDetail` 当前仅承担“模板名分组、预设透传、模型接口失败时的兜底字段来源”三种职责。其中“预设透传”在当前 Studio 源码里没有发现消费点，因此它不应阻塞初始化。

---

## 2. 数据模型层（Schema）

本次问题不需要改后端 Schema，但前端嵌入契约需要收紧，避免把“展示目录数据”和“运行态数据能力”混在一起。

### 2.1 当前宿主传输契约

宿主经由 `tv:init` 发送：

- `platformDevices[]`
- `data.dataSources[]`
- `data.platformFields[]`

其中 `platformDevices[]` 的实际 shape 来自宿主：

- `deviceId`
- `deviceName`
- `groupName`
- `fields[]`
- `presets[]`

Studio 侧在嵌入页会：

- 把 `platformDevices` 写入 `platformDeviceStore`
- 为每个 device 自动创建 `__platform_<deviceId>__` 数据源
- 在字段选择器里把这些 device 作为 “Device Fields” 数据源使用

### 2.2 建议的契约收缩

建议把初始化契约拆成两层：

#### A. 初始化必需层 `PlatformDeviceSummary`

只保留：

- `deviceId`
- `deviceName`
- `groupName`
- `fields[]`

其中 `fields[]` 默认只保留：

- `telemetry`
- `attribute`
- 聚合字段（例如 `device_online` / `device_offline__history`）

#### B. 延迟加载层 `PlatformDeviceDetail`

按需请求：

- `events`
- `commands`
- `presets`
- 模板详情兜底信息

### 2.3 能力契约建议

当前最大的问题是字段类型被提取了，但运行能力没有声明，导致 UI 看起来“都能选”，实际上很多字段不能预览。

建议给平台字段增加前端能力标记：

- `supportsCurrent: boolean`
- `supportsHistory: boolean`
- `supportsWrite: boolean`

按当前实现应当是：

- `telemetry`: `supportsCurrent=true`, `supportsHistory=true`
- `attribute`: `supportsCurrent=true`, `supportsHistory=false`
- `event`: `supportsCurrent=false`, `supportsHistory=false`
- `command`: `supportsCurrent=false`, `supportsHistory=false`, `supportsWrite` 需单独设计，不应假定可读

---

## 3. 后端服务层（API）

## 3.1 当前接口调用链

### 初始化主链路

宿主 `ThingsVisAppFrame.vue` 在收到 `tv:ready` 后执行 `doInit()`，其中 `buildPlatformDevices()` 会触发：

- `/device`
- `/device_config`
- 对每个唯一模板 ID：
  - `/device/template/detail/:id`
  - `/device/model/telemetry`
  - `/device/model/attributes`
  - `/device/model/events`
  - `/device/model/commands`

### 字段按需预览链路

Studio 字段选择器只在用户切换字段时，才通过 `thingsvis:requestFieldData` 回发请求，宿主 `buildRequestedFieldData()` 再调用：

- 有 `deviceId` 时：
  - `/telemetry/datas/current/:id`
  - `/attribute/datas/:device_id`
  - `/telemetry/datas/statistic`（仅 `__history`）
- 无 `deviceId` 的聚合字段时：
  - `/device`
  - `/board/trend`（仅在线/离线趋势）

### 运行态实时链路

只有用户请求具体设备字段后，宿主才会建立该设备的 websocket：

- `/telemetry/datas/current/ws`

这部分设计是合理的，当前没有提前全量订阅所有设备。

## 3.2 接口有效性分类

### A. 硬必需接口

#### 1. `/device`

用途：

- 初始化时枚举设备
- 聚合字段 `device_total / device_online / device_offline / device_activity` 计算

判定：**有用**。

#### 2. `/device_config`

用途：

- 把设备关联到模板 ID，否则没法知道每个设备应该挂哪份字段定义

判定：**有用**。

#### 3. `/device/model/telemetry`

用途：

- 生成设备字段目录
- 支撑字段选择器
- 对应运行时 `telemetry current/history`

判定：**有用**。

#### 4. `/device/model/attributes`

用途：

- 生成属性字段目录
- 对应运行时 `attribute current`

判定：**有用**。

#### 5. `/telemetry/datas/current/:id`

用途：

- 用户点选设备遥测字段后，拉一次当前值做预览/初值回填

判定：**有用**。

#### 6. `/attribute/datas/:device_id`

用途：

- 用户点选属性字段后，拉一次当前值做预览

判定：**有用**。

#### 7. `/telemetry/datas/statistic`

用途：

- 仅在选择 `__history` 字段时，为折线/面积类组件提供历史序列

判定：**有用**。

#### 8. `/board/trend`

用途：

- 聚合看板里 `device_online__history` / `device_offline__history` 的历史趋势

判定：**有用，但仅聚合趋势场景需要**。

### B. 弱必需/应延迟接口

#### 9. `/device/template/detail/:id`

当前用途：

- 读取模板名称，作为 `groupName`
- 解析 `web_chart_config`，提取 `presetsMap`
- 在四类 model API 返回空时，作为 fallback 字段来源

问题：

- 对“字段选择器是否能列出字段”不是硬前提，因为主字段实际上由 model API 提供
- 当前 Studio 侧没有发现 `presets` 的消费路径，意味着 `web_chart_config` 大概率是白拉

判定：**部分有用，但不应阻塞初始化**。

建议：

- 初始化只保留模板名称所需的最小信息，或直接从已有设备配置中拿显示名
- `presets` 改成用户打开模板预设面板时再拉
- 只有当 telemetry/attributes 两类接口均失败时，再触发 detail fallback

### C. 当前收益很低的接口

#### 10. `/device/model/events`

当前价值：

- 只是在 `extractPlatformFields()` 里被转成静态字段目录

当前缺失：

- `buildRequestedFieldData()` 不读取 event 当前值
- 没有 event 历史值拉取逻辑
- 当前编辑器主流程未见 event 字段的实时消费链路

判定：**对当前编辑器运行态基本无用，仅对“显示完整字段目录”有弱价值**。

#### 11. `/device/model/commands`

当前价值：

- 同样只是在 `extractPlatformFields()` 里被转成静态字段目录

当前缺失：

- 没有 command 当前值读取
- 没有 command 历史值读取
- 当前 App 编辑器链路里没有基于 command 字段的执行/预览闭环

判定：**对当前编辑器运行态基本无用，仅对“显示完整字段目录”有弱价值**。

### 3.3 审计结论表

| 接口 | 当前是否有用 | 有用在哪 | 建议 |
| --- | --- | --- | --- |
| `/device` | 是 | 初始化设备目录、聚合统计 | 保留 |
| `/device_config` | 是 | 设备到模板映射 | 保留 |
| `/device/model/telemetry` | 是 | 字段目录、遥测预览与历史能力 | 保留 |
| `/device/model/attributes` | 是 | 字段目录、属性预览能力 | 保留 |
| `/device/template/detail/:id` | 部分有用 | 分组名、fallback、预设 | 延迟或降级 |
| `/device/model/events` | 低价值 | 仅静态字段目录 | 延迟或删除 |
| `/device/model/commands` | 低价值 | 仅静态字段目录 | 延迟或删除 |
| `/telemetry/datas/current/:id` | 是 | 字段点选后的当前值预览 | 保留 |
| `/attribute/datas/:device_id` | 是 | 字段点选后的当前值预览 | 保留 |
| `/telemetry/datas/statistic` | 是 | 历史曲线字段 | 保留 |
| `/board/trend` | 是 | 聚合在线/离线趋势 | 按需保留 |
| `/telemetry/datas/current/ws` | 是 | 已选设备的实时推送 | 保留 |

---

## 4. 前端交互层（View）

## 4.1 现状问题

当前初始化成本被放大，原因不是“字段点选才会请求”，而是**在 `tv:init` 之前就把所有模板的所有字段类型一次性全拉完了**。

其中最重的是：

- 每个模板固定 4 个 model API
- 模板数越多，请求数线性放大
- 即便用户最终只绑定一个设备的一两个 telemetry 字段，也会把 events/commands 一起拉完

## 4.2 Studio 侧真实消费情况

Studio 嵌入页 `EmbedPage.tsx` 会：

- 接收 `platformDevices`
- 为每个设备创建 `__platform_<deviceId>__`
- 把这些设备显示在字段选择器 `FieldPicker.tsx` 的 “Device Fields” 里

字段选择器实际行为是：

- 先使用宿主注入的静态 `fields[]` 构建可选项
- 只有用户真正选中字段时，才发 `thingsvis:requestFieldData`

因此：

- “设备目录”和“telemetry/attribute 字段目录”确实需要在 init 前准备好
- “event/command 字段目录”不是当前编辑器主链路硬需求
- `presets` 目前没有发现被右侧面板或 EmbedPage 消费

## 4.3 设计改造建议

### 第一阶段：先削掉无收益初始化请求

初始化阶段仅保留：

- `/device`
- `/device_config`
- 每模板 `/device/model/telemetry`
- 每模板 `/device/model/attributes`

初始化阶段移除或延迟：

- `/device/model/events`
- `/device/model/commands`
- `/device/template/detail/:id`

### 第二阶段：把字段能力显式化

字段选择器按能力展示：

- 可预览字段直接可选
- 不支持 current/history 的字段默认隐藏，或标记为“仅静态定义”

### 第三阶段：按需再打开 event/command/preset

只有下列操作发生时才加载：

- 用户切到“事件字段”分类
- 用户切到“命令字段”分类
- 用户打开模板预设浏览器

---

## 5. 待修改文件绝对路径清单

以下是建议后续由 `task-coder` 修改的文件清单。

### A. 宿主端主改动

- `f:\coding\thingspanel-frontend-community\src\components\thingsvis\ThingsVisAppFrame.vue`

改动意图：

- 收缩 `buildPlatformDevices()` 初始化主链路
- 去掉 `eventsApi` / `commandsApi` 的 eager 请求
- 将 `deviceTemplateDetail()` 改为 fallback 或懒加载
- 为字段定义附带能力标记

### B. 宿主端字段提取契约

- `f:\coding\thingspanel-frontend-community\src\utils\thingsvis\platform-fields.ts`

改动意图：

- 让字段提取结果带上 `supportsCurrent / supportsHistory / supportsWrite`
- 区分 telemetry、attribute、event、command 的运行能力

### C. Studio 侧嵌入消费层

- `f:\coding\thingsvis\apps\studio\src\pages\EmbedPage.tsx`

改动意图：

- 接受收紧后的 `platformDevices/platformFields` 契约
- 不再假定所有字段类型都应该被提前注入为可预览字段

### D. Studio 侧字段选择器

- `f:\coding\thingsvis\apps\studio\src\components\RightPanel\FieldPicker.tsx`

改动意图：

- 基于字段能力决定是否显示 / 是否允许触发 `thingsvis:requestFieldData`
- 对不支持 current/history 的字段给出禁用或懒加载交互

### E. 如需保留模板预设能力

- `f:\coding\thingsvis\apps\studio\src\lib\stores\platformDeviceStore.ts`
- `f:\coding\thingsvis\apps\studio\src\components\RightPanel\PropsPanel.tsx`

改动意图：

- 仅在确认预设 UI 真实存在并被消费时，再补充 presets 的按需加载链路

---

## 6. 对同事这版代码的直接判断

如果你的问题是“这批一次性请求里哪些接口现在真有用，哪些现在没有明显用处”，直接结论如下：

### 真有用

- `/device`
- `/device_config`
- `/device/model/telemetry`
- `/device/model/attributes`
- `/telemetry/datas/current/:id`
- `/attribute/datas/:device_id`
- `/telemetry/datas/statistic`
- `/board/trend`
- `/telemetry/datas/current/ws`

### 有一点用，但不该放初始化阶段

- `/device/template/detail/:id`

### 现在这条编辑器链路里收益很低

- `/device/model/events`
- `/device/model/commands`

这两个不是严格意义上的“完全没用”，因为它们确实会被提取进静态字段目录；但就**当前编辑器的实际读取链路**而言，它们没有 current/history/preview 的闭环，放在初始化阶段属于明显过度请求。
