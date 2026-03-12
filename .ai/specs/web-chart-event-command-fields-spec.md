# 技术契约与架构设计书：Web 图表编辑器补全事件/命令字段

**版本**: 1.0 | **日期**: 2026-03-12 | **作者**: system-architect

---

## 1. 背景与问题定位

用户在物模型中添加**温度字段（遥测）、属性字段、命令字段、事件字段**后，进入 **Web图表配置 → 编辑器弹窗** 时，ThingsVis FieldPicker（右侧属性面板）应显示所有已定义字段，以供用户绑定到曲线图等组件。

### 当前缺口

| 字段类型 | API 是否存在 | web-chart-config.vue 是否调用 | FieldPicker 是否显示 |
|---------|-------------|------------------------------|---------------------|
| `telemetry` | ✅ `telemetryApi` | ✅ | ✅ |
| `attribute` | ✅ `attributesApi` | ✅ | ✅ |
| `command`   | ✅ `commandsApi`  | ❌ 未调用 | ❌ 被 `.filter()` 过滤 |
| `event`     | ✅ `eventsApi`    | ❌ 未调用 | ❌ 未加载 |

### 根因代码位置

文件：`src/views/device/template/components/step/web-chart-config.vue`

```ts
// 缺口 1：import 缺少 eventsApi / commandsApi
import { getTemplat, putTemplat, telemetryApi, attributesApi } from '@/service/api'

// 缺口 2：loadTemplateData() 的 Promise.all 仅调用两个 API
const [telemetryRes, attributesRes] = await Promise.all([
  telemetryApi(...),
  attributesApi(...)
])

// 缺口 3：显式过滤掉 command
const filtered = extractedFields.filter(
  (f: PlatformField) => f.dataType !== 'command'
)
```

---

## 2. 设计决策

### 2.1 command 是否应出现在 FieldPicker？

**结论：应该显示。**

- `command` 字段对应设备控制（开关、参数下发），应绑定至交互类 Widget（Switch、Button、Input）。
- `PlatformField` 的 `dataType` 已定义 `'command'`，`extractPlatformFields()` 已支持解析。
- ThingsVis FieldPicker 侧通过 `ds.__platform__.data.xxx` 路径绑定；反向写回通过 `tv:platform-write` 消息路由，链路已通。
- 过滤 `command` 的原始意图不明，不应在编辑器层面屏蔽选择能力。

### 2.2 event 如何呈现？

- `event` 字段值为 JSON 对象（如 `{ active: true, level: 'critical' }`），在 FieldPicker 中以 `type: 'json'` 展示。
- `extractPlatformFields()` 已正确将其归类，不需要额外处理。

---

## 3. 数据模型层（Schema）

无 Schema 变更，`PlatformField` 类型已定义：
```ts
// src/utils/thingsvis/types.ts — 已有，无需改动
dataType: 'attribute' | 'telemetry' | 'command' | 'event'
```

---

## 4. 后端服务层（API）

无 API 变更，目标函数均已在 `src/service/api/system-data.ts` 中实现并从 `index.ts` 导出：

```ts
// 已存在
export const eventsApi = async (params: any) => request.get('/device/model/events', { params })
export const commandsApi = async (params: any) => request.get('/device/model/commands', { params })
```

---

## 5. 前端交互层（View）—— 改动意图与约束

### 5.1 改动文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/views/device/template/components/step/web-chart-config.vue` | **修改** | 唯一需要改动的文件 |
| `src/views/device/template/components/step/telemetry-chart.vue` | **不动** | devices 详情页 viewer 模式，已正确实现 |
| `src/utils/thingsvis/platform-fields.ts` | **不动** | 已支持 4 种字段类型 |
| `src/utils/thingsvis/types.ts` | **不动** | 类型已完备 |

### 5.2 web-chart-config.vue 的三处改动

**改动 A** — import 补全：
```ts
// before
import { getTemplat, putTemplat, telemetryApi, attributesApi } from '@/service/api'
// after
import { getTemplat, putTemplat, telemetryApi, attributesApi, eventsApi, commandsApi } from '@/service/api'
```

**改动 B** — `loadTemplateData()` 中 Promise.all 扩展至 4 个 API：
```ts
const [telemetryRes, attributesRes, eventsRes, commandsRes] = await Promise.all([
  telemetryApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId }),
  attributesApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId }),
  eventsApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId }),
  commandsApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId })
])
// 并将 events / commands list 传入 platformSource
```

**改动 C** — 移除 command 过滤行：
```ts
// 删除此行
const filtered = extractedFields.filter(f => f.dataType !== 'command')
// 直接使用
platformFields.value = extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data)
```

### 5.3 工程约束（来自 conventions-zh.md）

- 所有新变量遵循 `camelCase`，API 响应处理风格与现存 `telemetryRes` 一致。
- 失败时 `console.error` 打印关键入参，不静默吞没（现有 `try/catch` 结构已满足）。
- 文件行数在改动后仍在 400 行内，无需拆分逻辑为 Composable。

---

## 6. 全栈影响分析

此次改动**只触及数据加载层**，不改动任何渲染路径：

- `ThingsVisWidget` 的 `:platform-fields` prop 绑定不变，已支持透传任意 `PlatformField[]`。
- ThingsVis `FieldPicker` 侧已支持 4 种 `dataType`，`platformFieldStore.setFields()` 调用无变化。
- 反向写回（`tv:platform-write`）链路不受影响。
- `seedEditorHistory` 函数只对 `telemetry` 字段回填历史，`event/command` 字段不做历史回填（行为正确，无需改动）。

---

## 7. 移交（Handoff to task-coder）

目标文件（精确路径，仅 1 个文件）：

```
f:\coding\thingspanel-frontend-community\src\views\device\template\components\step\web-chart-config.vue
```

任务：按第 5 节 改动 A / B / C 三处实施。
