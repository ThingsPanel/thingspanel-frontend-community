# 技术契约与架构设计书：ThingsVis 平台历史字段与实时链路一次性重构

## 版本
- 日期: 2026-03-13
- 状态: Ready for Implementation
- 负责人: task-coder

---

## 0. 背景与目标

当前 ThingsPanel 与 ThingsVis 的平台字段链路存在三套互相打架的语义：

- 当前值字段使用裸字段名，如 `temperature`、`humidity`、`switch`
- 历史数组一部分代码使用 `__history` 后缀，如 `temperature__history`
- 用户在实际编辑流程中要求以单下划线后缀表达历史字段，如 `temperature_`

这直接导致以下故障同时出现：

- 文本/数值组件能正常显示 WS 当前值
- 时序图组件在同样选择“温度字段”时，实际拿到的是标量当前值而非历史数组
- 历史数据虽然已经通过统计接口 `/telemetry/datas/statistic` 回填，但最终没有稳定映射到图表的 `data` 属性
- Host 侧存在多处历史接口解析逻辑，返回结构不统一，增加回归风险

本次重构目标不是继续叠加兼容分支，而是做一次明确的契约收敛，确保以下场景全部稳定：

- 开关控制
- WS 遥测当前值
- 统计接口历史值
- 文本/数字/状态类组件的实时显示
- 线图/面积图的历史趋势显示

---

## 1. 根因结论

### 1.1 当前值与历史值没有统一字段契约

当前系统的语义冲突如下：

- Host 的历史请求层按 `__history` 识别历史字段
- ThingsVis 运行时 Adapter 也将历史数组暴露到 `{fieldId}__history`
- Studio 绑定层把图表 `data` 当成普通 `field` 绑定，容易保存为 `ds.__platform__.data.temperature`
- 用户实际配置与认知是 `temperature_` 应代表历史序列

结果是图表渲染层经常拿到标量 `28.85` 这类 WS 当前值，而不是统计接口数组。

### 1.2 历史接口解析逻辑散落，且仍存在旧响应结构假设

ThingsPanel 内部至少存在两处历史数据解析入口：

- `useHistoryBackfill.ts`
- `ThingsVisAppFrame.vue`

两处解析逻辑对响应结构的假设并不一致，仍混杂 `time_series`、`data.list` 等旧格式假设，无法保证对 `/telemetry/datas/statistic` 的统一适配。

### 1.3 图表 `data` 属性缺少类型级约束

文本和值类属性接受标量，而图表 `data` 必须接受数组。当前 Studio 侧没有把这种差异上升为契约，导致“同样选字段”的 UI 交互，落盘后却产生完全不同的运行时需求。

---

## 2. 设计原则

### 2.1 单一历史字段约定

本次重构将“平台历史字段”的宿主与运行时统一命名为：

- 当前值: `temperature`
- 历史值: `temperature_`

说明：

- 单下划线后缀 `_` 是唯一合法的历史字段后缀
- `__history` 在实现层全面移除，不再作为主契约保留
- 图表字段选择、历史请求、运行时数据暴露、文档和测试全部切换到 `_`

### 2.2 当前值与历史值分链路

- 当前值只允许来自实时 WS / 当前值接口
- 历史值只允许来自统计接口 `/telemetry/datas/statistic`
- 禁止图表组件通过 WS 标量回退“伪装为时序数据”

### 2.3 解析统一收口到 Host

所有 ThingsPanel 侧历史响应解析统一复用一个共享解析模块，禁止在多个组件中手写结构探查。

### 2.4 Fail-Fast

遵循 [thingsvis/.ai/conventions-zh.md](thingsvis/.ai/conventions-zh.md) 中的 Fail-Fast 约束：

- 图表 `data` 如果最终解析为非数组，应显式报错并打出绑定表达式与字段名
- 不允许静默回退为当前值继续渲染空图

---

## 3. 数据模型层（Schema / Contract）

### 3.1 平台字段命名契约

统一后的运行时字段契约：

```ts
type PlatformCurrentFieldKey = string
type PlatformHistoryFieldKey = `${string}_`

// examples
temperature: number
temperature_: Array<{ value: number; ts: number }>
humidity: number
humidity_: Array<{ value: number; ts: number }>
switch: boolean | number
switch_: Array<{ value: boolean | number; ts: number }>
```

### 3.2 请求字段契约

Guest → Host 的 `thingsvis:requestFieldData` 中：

- 不带后缀: 请求当前值
- 以 `_` 结尾: 请求历史值

示例：

```ts
fieldIds: ['temperature', 'humidity_', 'switch_']
```

### 3.3 控件绑定契约

Studio 控件层新增“字段后缀策略”元数据，用于声明某个属性在 `field` 模式下的真实目标字段：

```ts
type ControlBinding = {
  enabled: boolean
  modes: Array<'static' | 'field' | 'expr'>
  fieldPathSuffix?: string
}
```

线图组件的 `data` 属性固定声明：

```ts
fieldPathSuffix: '_'
```

文本/数值/颜色等普通属性不声明后缀，保持裸字段绑定。

### 3.4 页面迁移契约

加载旧页面配置时执行一次性迁移：

- `ds.xxx.data.temperature__history` → `ds.xxx.data.temperature_`
- 线图 `data` 绑定若为 `ds.xxx.data.temperature`，自动迁移为 `ds.xxx.data.temperature_`

迁移是“加载期正规化”，不是运行时无限兼容。

---

## 4. 后端服务层（API）

### 4.1 路由契约

本次不新增后端接口，只收敛已有路由职责：

- 当前值: `telemetryDataCurrent(...)`
- 历史值: `telemetryDataHistoryList(...)`，落到 `/telemetry/datas/statistic`

### 4.2 统计接口响应正规化

Host 侧共享解析模块必须将下列响应形态收敛为统一结果：

```ts
type HistoryPoint = { value: number; ts: number }

type NormalizedHistoryResult = {
  fieldId: string
  points: HistoryPoint[]
}
```

必须支持的输入来源：

- `time_series: [{ x, y }]`
- `data.list: [{ time, value }]`
- `data: [{ x1, x2, y }]`

其中针对当前线上统计接口，主支持结构为：

```ts
data: Array<{
  x1?: string | number
  x2?: string | number
  y?: number | string
}>
```

时间戳优先级：

- `x2`
- `x1`
- `time`
- `x`
- `ts`

值优先级：

- `y`
- `value`
- `avg`

---

## 5. 前端交互层（View / Runtime）

### 5.1 ThingsPanel Host 层重构

#### 5.1.1 统一历史解析工具

将历史解析收口到共享模块，供下列入口复用：

- `useHistoryBackfill.ts`
- `ThingsVisAppFrame.vue`

禁止各自维护不同的响应结构适配代码。

#### 5.1.2 `useHistoryBackfill.ts`

职责调整：

- 只负责“设备详情 Viewer 模式”的历史预热
- 使用共享解析工具解析统计接口响应
- 推送字段名统一为裸字段名，由 Widget/SDK 经 `tv:platform-history` 下发
- 不再假设 `time_series`

#### 5.1.3 `ThingsVisAppFrame.vue`

职责调整：

- `fieldIds` 中以 `_` 结尾的字段进入历史请求分支
- 进入历史请求前将 `temperature_` 还原为 `temperature` 再调用统计接口
- 当前值分支显式排除 `_` 历史字段，避免混入 WS 实时值
- 返回给 iframe 的 `result.histories[].fieldId` 仍保持裸字段名 `temperature`

说明：`tv:platform-history` 的消息体继续用裸 `fieldId + history[]`，字段别名的物化放到运行时 Adapter。

#### 5.1.4 `ThingsVisWidget.vue` 与 `sdk/client.ts`

职责保持清晰：

- `pushPlatformFieldData()` 只转发当前值
- `pushFieldHistory()` 只转发统计接口历史数组
- 不在 SDK 层推导或补写图表历史字段后缀

### 5.2 ThingsVis Runtime / Studio 层重构

#### 5.2.1 `PlatformFieldAdapter.ts`

统一输出字段：

- 当前值: `temperature`
- 历史值: `temperature_`

删除 `__history` 输出，不再把历史数组暴露为 `temperature__history`。

#### 5.2.2 `bindingStorage.ts`

字段表达式生成规则更新为：

- 文本/数值组件: `{{ ds.__platform__.data.temperature }}`
- 线图 `data`: `{{ ds.__platform__.data.temperature_ }}`

并提供旧表达式迁移函数：

- `__history` → `_`
- 标量图表字段 → `_`

#### 5.2.3 `ControlFieldRow.tsx`

当 `field.path === 'data'` 且控件声明了 `fieldPathSuffix: '_'` 时：

- UI 选择器仍显示基础字段名 `temperature`
- 实际保存表达式自动追加 `_`

#### 5.2.4 `FieldPicker.tsx`

展示策略重构：

- 平台字段列表默认仍展示基础字段名 `temperature`
- 对线图 `data` 属性，FieldPicker 不直接暴露一组重复的 `temperature_`、`humidity_` 条目
- 后缀追加由绑定层完成，而不是让用户手工区分

#### 5.2.5 `PropertyResolver.ts`

职责明确：

- 只负责解析正规化后的表达式
- 对线图 `data` 解析结果若不是数组，直接 `console.error` 并附带 `nodeId / expression / resolvedValue`
- 不再保留“运行时标量回退历史”的临时补丁逻辑

#### 5.2.6 线图组件渲染器

`uplot-line` / `echarts-line`：

- 仅接受数组输入
- 非数组时打印结构化错误日志
- 不再把单值自动包成伪数据点

---

## 6. 迁移策略

### 6.1 存量页面迁移

在 ThingsVis 页面加载链路中增加一次性正规化：

- 遍历 `node.schemaRef.data`
- 将所有 `__history` 表达式替换为 `_`
- 将线图 `data` 属性绑定到裸字段的表达式自动替换为 `_`

### 6.2 文档与测试同步

以下文档与测试必须同步改写，避免未来再次把 `__history` 当成正确契约：

- 集成文档
- Studio 使用说明
- Platform E2E 测试

---

## 7. 精确目标文件清单

### 7.1 数据模型层（Schema）

- 修改: `f:\coding\thingsvis\packages\thingsvis-schema\src\widget-controls.ts`
- 修改: `f:\coding\thingsvis\packages\thingsvis-widget-sdk\src\types.ts`

### 7.2 后端服务层（API Consumer / Host Parser）

- 修改: `f:\coding\thingspanel-frontend-community\src\hooks\thingsvis\useHistoryBackfill.ts`
- 修改: `f:\coding\thingspanel-frontend-community\src\components\thingsvis\ThingsVisAppFrame.vue`
- 修改: `f:\coding\thingspanel-frontend-community\src\utils\thingsvis\sdk\client.ts`
- 修改: `f:\coding\thingspanel-frontend-community\src\components\thingsvis\ThingsVisWidget.vue`
- 新建或修改: `f:\coding\thingspanel-frontend-community\src\utils\thingsvis\history.ts`

### 7.3 前端交互层（Studio / Runtime / Widgets）

- 修改: `f:\coding\thingsvis\packages\thingsvis-kernel\src\datasources\PlatformFieldAdapter.ts`
- 修改: `f:\coding\thingsvis\packages\thingsvis-ui\src\engine\PropertyResolver.ts`
- 修改: `f:\coding\thingsvis\apps\studio\src\components\RightPanel\bindingStorage.ts`
- 修改: `f:\coding\thingsvis\apps\studio\src\components\RightPanel\ControlFieldRow.tsx`
- 修改: `f:\coding\thingsvis\apps\studio\src\components\RightPanel\FieldPicker.tsx`
- 修改: `f:\coding\thingsvis\packages\widgets\chart\uplot-line\src\controls.ts`
- 修改: `f:\coding\thingsvis\packages\widgets\chart\uplot-line\src\index.ts`
- 修改: `f:\coding\thingsvis\packages\widgets\chart\echarts-line\src\controls.ts`
- 修改: `f:\coding\thingsvis\packages\widgets\chart\echarts-line\src\index.ts`

### 7.4 文档与测试

- 修改: `f:\coding\thingsvis\docs\thingspanel-integration-guide.md`
- 修改: `f:\coding\thingsvis\apps\docs\guide\component-configuration.md`
- 修改: `f:\coding\thingsvis\apps\studio\src\__tests__\integration\e2e-platform-data.test.ts`
- 修改: `f:\coding\thingspanel-frontend-community\src\__tests__\integration\thingsvis-integration.test.ts`

---

## 8. 验收标准

### 8.1 开关 / 当前值

- 文本、数值、状态类组件绑定 `temperature` / `humidity` / `switch` 后，显示 WS 或当前值接口数据
- 开关写回 `tv:platform-write` 不受本次重构影响

### 8.2 时序图

- 线图绑定“温度字段”后，实际保存为 `temperature_`
- Host 在 `thingsvis:requestFieldData` 中收到 `temperature_` 时，必须只走统计接口
- 线图渲染时拿到数组，`parsedCount > 0`

### 8.3 稳定性

- 不允许图表继续读取 WS 标量 `28.85` 作为时序数据
- 不允许历史接口解析在不同入口使用不同返回结构假设
- 所有与 `__history` 相关的文档、测试、表达式生成逻辑必须同步清除

---

## 9. 移交说明

本 Spec 只定义一次性重构方案，不包含业务实现代码。

下游 `task-coder` 必须按以下顺序实施：

1. 先收敛 Host 历史解析与 `_` 请求语义
2. 再收敛 Runtime Adapter 输出键名
3. 最后改 Studio 绑定生成与存量页面迁移

这样可以避免中途出现“Host 已切 `_`，Runtime 仍期待 `__history`”的断层。
