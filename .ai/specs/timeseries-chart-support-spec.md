# 时序图数据全链路支持架构设计书

**版本**: v1.0
**日期**: 2026-03-11
**问题触发点**: 时序图 Widget（`uplot-line`）绑定平台数据字段后图表为空；`echarts-line` 接收时间戳数据后 X 轴显示异常数字标签

---

## 一、现状分析与根因定位

### 1.1 Widget 生态清单（当前能力对比）

| Widget | 图表库 | X 轴类型 | 支持格式 | 时序支持 |
|--------|--------|----------|----------|----------|
| `echarts-line` | ECharts | `category`（分类轴） | `{name: string, value: number}` | ❌ 不支持时间戳 |
| `echarts-bar` | ECharts | `category` | `{name, value}` | ❌ |
| `echarts-pie` | ECharts | 无 | `{name, value}` | ❌ |
| `echarts-gauge` | ECharts | 无 | `number` | ❌ |
| `uplot-line` | uPlot | Unix 秒（时间轴） | `{x,y}` / `{time,value}` / `{ts,value}` / `{value,ts}` | ✅ **完整支持** |

**结论**：当前生态中 `uplot-line` 是唯一具备真正时序能力的图表 Widget。

### 1.2 数据格式相容性分析

#### 路径 A：平台实时推送 → 环形缓冲区 → Widget 绑定

```
ThingsPanel WebSocket → tv:platform-data { fieldId, value, ts }
  → PlatformFieldAdapter.subscribeToHostData()
  → dataBuffers: Map<fieldId, Array<{value, ts}>>   ← 内存环形缓冲区
  → updateData() → emitData({ temperature__history: [{value, ts}, ...] })
  → Widget (uplot-line) data 绑定 __platform__.temperature__history
  → normalizeSeries() → toParsedPoint({ value, ts }) ← uplot-line 原生支持此格式
  → uPlot.setData([times, values]) → 渲染时序图 ✅
```

格式兼容：`PlatformFieldAdapter` 生产 `{value, ts}` → `uplot-line.toParsedPoint()` 直接消费 ✅

#### 路径 B：历史 API 查询 → 批量预填 → Widget 渲染

```
ThingsPanel 历史接口 GET /api/v1/telemetry/datas/statistic
  → 响应: [{x: timestamp_ms, y: value}, ...]
  → ??? → PlatformFieldAdapter 缓冲区（❌ 无路径）
```

API 返回 `{x, y}` 格式而 `toParsedPoint()` 也支持此格式 → 格式层已兼容，**但无协议通道将批量历史数据注入缓冲区**。

### 1.3 根因列表

#### 根因 1 — `ThingsVisClient.pushData()` 协议错误 🔴 严重

```typescript
// src/utils/thingsvis/sdk/client.ts
public pushData(data: Record<string, any>) {
  this.send(TV_MSG.EVENT, { event: 'updateData', payload: data })
  // ↑ 发送的是 { type: 'tv:event', payload: { event:'updateData', ... } }
  // PlatformFieldAdapter 监听的是 { type: 'tv:platform-data', payload: { fieldId, value, timestamp } }
  // ← 两者类型不匹配，实时遥测数据永远无法进入环形缓冲区！
}
```

后果：即使上层把 WebSocket 数据传给 `ThingsVisWidget.vue props.data`，经 `client.pushData()` 发出的消息也被 `PlatformFieldAdapter` 直接忽略。**环形缓冲区永远不会填充，`temperature__history` 永远是空数组。**

#### 根因 2 — 缺少历史数据批量预填 SDK 方法 🔴 严重

`ThingsVisClient` 没有将历史记录组 `Array<{value, ts}>` 注入 `PlatformFieldAdapter` 环形缓冲区的方法。Widget 初始加载时图表必然为空，只有在实时数据开始推送后才会逐点累积（累积到 `bufferSize` 需要等待 N 个数据点到达）。

#### 根因 3 — `PlatformFieldAdapter` 不接受批量历史预填消息 🟠 中等

`subscribeToHostData()` 只处理单点推送格式 `{ type: 'tv:platform-data', payload: { fieldId, value, timestamp } }`，没有批量历史通道。需新增 `tv:platform-history` 消息类型。

#### 根因 4 — `echarts-line` X 轴硬编码为 `category` 🟡 中等

```typescript
// packages/widgets/chart/echarts-line/src/index.ts
xAxis: { type: 'category' },      // ← 硬编码，无法切换
dimensions: [{ name: 'name' }, { name: 'value' }]  // ← 期望字符串 name 字段
```

当用户将含时间戳的 `__history` 数组绑定到 `echarts-line.data` 时，ECharts 会把毫秒时间戳当作分类标签渲染，产生"乱码"数字轴。编辑器没有任何引导指示正确的图表选择。

#### 根因 5 — `web-chart-config.vue` 无实时数据推送能力 🟡 低优先级

预览 Widget（只读模式）没有绑定 WebSocket，也没有获取历史数据的逻辑，图表始终为空。这在工程师配置时无法进行正确的可视化验证。

#### 根因 6 — `uplot-line` 单系列限制 🟢 扩展需求

当前 `uplot-line` 只支持单条曲线（一个 Y 轴系列）。IoT 场景常见多个遥测量叠加显示（如温度 + 湿度），需要多系列支持。

---

## 二、目标架构设计

### 2.1 完整数据流（修复后）

```
┌─────────────────────────────────────────────────────────────────────┐
│  ThingsPanel (Host Page)                                            │
│                                                                     │
│  WebSocket / 设备 MQTT                                              │
│    │ 实时遥测推送 { fieldId, value, timestamp }                      │
│    ▼                                                                │
│  ThingsVisClient.pushPlatformFieldData({ temp: 25.3 })             │
│    │ postMessage { type:'tv:platform-data', payload:{ fields:{} } } │
│    ▼                                                                │
│  [on mount] loadHistoryData():                                      │
│    GET /api/v1/telemetry/datas/statistic                           │
│    → [{x:ms, y:val}, ...]                                          │
│    → map → [{value:val, ts:ms}, ...]                               │
│    → ThingsVisClient.pushFieldHistory('temp', [...])               │
│       postMessage { type:'tv:platform-history',                     │
│                     payload:{ fieldId:'temp', history:[...] } }     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ iframe postMessage
┌──────────────────────────────▼──────────────────────────────────────┐
│  ThingsVis (Guest iframe)                                           │
│                                                                     │
│  PlatformFieldAdapter.subscribeToHostData()                         │
│    │ tv:platform-data → 更新单点缓存 + 追加 ring buffer             │
│    │ tv:platform-history → 批量预填 ring buffer（新增）             │
│    ▼                                                                │
│  updateData() → emitData({                                          │
│    temperature: 25.3,                                               │
│    temperature__history: [{value:25.3, ts:1773...}, ...]           │
│  })                                                                 │
│    ▼                                                                │
│  uplot-line Widget                                                  │
│    data 绑定 → __platform__.temperature__history                    │
│    normalizeSeries() → toParsedPoint({value, ts}) → ✅             │
│    uPlot.setData([times, values]) → 时序图渲染 ✅                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 新增协议消息类型

| 消息类型 | 方向 | Payload | 用途 |
|---------|------|---------|------|
| `tv:platform-data` | Host → Guest | `{ fieldId, value, timestamp }` 或 `{ fields: Record<string, unknown> }` | 现有：单点/批量实时推送 |
| `tv:platform-history` | Host → Guest | `{ fieldId: string, history: Array<{value: unknown, ts: number}> }` | **新增**：历史批量预填 |

### 2.3 `echarts-line` 时间轴模式扩展设计

在现有 `echarts-line` 中增加 `xAxisType` 开关（`'category' | 'time'`），切换至 `'time'` 时：
- `xAxis.type` → `'time'`
- `dimensions` → `[{ name: 'ts', type: 'time' }, { name: 'value' }]`
- 数据格式期望：`[{ ts: timestamp_ms, value: number }]`（与 `PlatformFieldAdapter.__history` 格式完全一致）

> 注意：`uplot-line` 仍然是时序图的**首选 Widget**，ECharts 时间轴扩展仅作为视觉风格补充选项。

---

## 三、目标文件清单（Task 分解）

### TASK-A：新增 `tv:platform-history` 协议通道（ThingsVis 侧）

**约束**：严格修改以下 2 个文件，不得新增文件。

#### A1. `apps/studio/src/embed/message-router.ts`

在 `MSG_TYPES` 常量对象中追加：

```typescript
PLATFORM_HISTORY: 'tv:platform-history',
```

#### A2. `packages/thingsvis-kernel/src/datasources/PlatformFieldAdapter.ts`

在 `subscribeToHostData()` 内部的 `messageListener` 中，现有的 `tv:platform-data` 分支**之后**追加处理 `tv:platform-history` 分支：

```typescript
// 新增分支 — 批量历史预填
if (event.data.type === 'tv:platform-history') {
  const { fieldId, history } = event.data.payload as {
    fieldId: string;
    history: Array<{ value: unknown; ts: number }>;
  };
  if (!fieldId || !Array.isArray(history)) return;

  const platformConfig = this.config?.config as PlatformFieldConfig | undefined;
  const bufferSize = platformConfig?.bufferSize ?? 0;

  if (bufferSize > 0) {
    // 批量写入，保留最近 bufferSize 个点
    const merged = history.slice(-bufferSize);
    this.dataBuffers.set(fieldId, merged);
    // 单点缓存更新为最新值（向后兼容）
    if (merged.length > 0) {
      const last = merged[merged.length - 1]!;
      this.platformDataCache.set(fieldId, { value: last.value, timestamp: last.ts });
    }
    this.updateData();
  }
  return;
}
```

---

### TASK-B：`ThingsVisClient` 新增正确的平台数据 SDK 方法（ThingsPanel 侧）

**约束**：仅修改 `src/utils/thingsvis/sdk/client.ts`。

#### B1. 新增 `pushPlatformFieldData()` — 替代错误的 `pushData()`

用于推送实时遥测字段值（格式与 `PlatformFieldAdapter.subscribeToHostData()` 对齐）：

```typescript
/**
 * [Widget Mode] Push real-time platform field values to the embedded widget.
 * Sends a tv:platform-data bulk message that PlatformFieldAdapter listens for.
 * Use this instead of pushData() for IoT telemetry values.
 *
 * @param fields - Map of fieldId → current value (e.g. { temperature: 25.3 })
 */
public pushPlatformFieldData(fields: Record<string, unknown>): void {
  this.send('tv:platform-data', { fields });
}
```

#### B2. 新增 `pushFieldHistory()` — 历史批量预填

```typescript
/**
 * [Widget Mode] Bulk-fill the ring buffer for a single platform field with historical records.
 * Sends a tv:platform-history message to PlatformFieldAdapter.
 * Call once after widget initialization to seed line chart widgets with pre-existing data.
 *
 * @param fieldId - Platform field identifier (e.g. 'temperature')
 * @param history - Ordered array of time-value records (oldest first)
 */
public pushFieldHistory(
  fieldId: string,
  history: Array<{ value: unknown; ts: number }>,
): void {
  this.send('tv:platform-history', { fieldId, history });
}
```

> ⚠️ **保留 `pushData()`**：不得删除，避免破坏其他使用方。标记为 `@deprecated` 并在 JSDoc 中说明。

---

### TASK-C：`ThingsVisWidget.vue` 修复 `data` watch 并暴露新方法（ThingsPanel 侧）

**约束**：仅修改 `src/components/thingsvis/ThingsVisWidget.vue`。

#### C1. 修复 `data` watch 协议

```typescript
// 修复前 (❌ 错误协议)
watch(() => props.data, newVal => {
  if (client?.ready && newVal) client.pushData(clone(newVal))
}, { deep: true })

// 修复后 (✅ 正确协议)
watch(() => props.data, newVal => {
  if (client?.ready && newVal) client.pushPlatformFieldData(clone(newVal))
}, { deep: true })
```

#### C2. 暴露 `pushHistory(fieldId, history)` 方法

```typescript
const pushHistory = (fieldId: string, history: Array<{ value: unknown; ts: number }>) => {
  client?.pushFieldHistory(fieldId, history)
}

defineExpose({
  triggerSave,
  client,
  pushHistory,   // 新增暴露
})
```

---

### TASK-D：`web-chart-config.vue` 历史数据预加载（ThingsPanel 侧）

**约束**：仅修改 `src/views/device/template/components/step/web-chart-config.vue`。

#### D1. 编辑器 Widget 的 `ref` 需要能调用 `pushHistory`

编辑器 `ThingsVisWidget` 的 `ref` 类型声明需包含 `pushHistory`（已通过 `defineExpose` 暴露，Vue 3 会自动推断）。

#### D2. 在 `loadTemplateData()` 末尾追加历史预填调用

```typescript
// 在 loadTemplateData() 中，完成 platformFields 赋值之后追加:

// Pre-load telemetry history into the chart editor widget so line charts
// render immediately with existing data instead of starting from an empty buffer.
const seedEditorHistory = async () => {
  if (!editorRef.value) return;
  const now = Date.now();
  const windowMs = CHART_EDITOR_BUFFER_SIZE * 60_000; // approximate: 1 point/min

  await Promise.allSettled(
    platformFields.value
      .filter(f => f.dataType === 'telemetry')
      .map(async (field) => {
        try {
          const res = await telemetryDataHistoryQuery({
            device_id: props.deviceTemplateId,  // adapt to actual API param
            key: field.id,
            start_time: now - windowMs,
            end_time: now,
            aggregate_window: '1m',
          });
          const records: Array<{ value: unknown; ts: number }> = (res.data ?? []).map(
            (p: { x: number; y: unknown }) => ({ value: p.y, ts: p.x }),
          );
          if (records.length > 0) {
            editorRef.value?.pushHistory(field.id, records);
          }
        } catch (e) {
          console.error('[web-chart-config] seedEditorHistory failed for field:', field.id, e);
        }
      }),
  );
};
```

> **注意**：`seedEditorHistory` 依赖编辑器 Widget 就绪（`tv:ready` 之后）。实际调用时机放在 `openEditor()` 函数中（模态框打开时），而非 `onMounted`。`ThingsVisWidget` 的 `ready` 事件触发后再调用。

#### D3. 预览 Widget 推送实时数据（可选 P2）

若产品需要在预览模式下也展示实时曲线，需为预览 `ThingsVisWidget` 添加 `ref` 并在 WebSocket 回调中调用 `previewRef.value?.client?.pushPlatformFieldData(data)`。**本 Task 优先级 P2，可延后。**

---

### TASK-E：`echarts-line` 时间轴模式扩展（可选 P2）

**约束**：修改 `packages/widgets/chart/echarts-line/src/` 下 3 个文件（`schema.ts`、`controls.ts`、`index.ts`），总改动 < 50 行。

#### E1. `schema.ts` — 新增 `xAxisType` 字段

```typescript
xAxisType: z.enum(['category', 'time']).default('category'),
```

#### E2. `controls.ts` — 新增 `xAxisType` 控件配置

```typescript
groups: { Content: ['title', 'showLegend', 'showXAxis', 'showYAxis', 'xAxisType'], ... },
bindings: { xAxisType: { enabled: true, modes: ['static'] }, ... },
```

#### E3. `index.ts` — `buildOption()` 中按 `xAxisType` 分支渲染

```typescript
const isTime = props.xAxisType === 'time';
xAxis: { type: isTime ? 'time' : 'category' },
dataset: {
  dimensions: isTime
    ? [{ name: 'ts', type: 'time' }, { name: 'value' }]
    : [{ name: 'name' }, { name: 'value' }],
},
series: [{
  encode: isTime ? { x: 'ts', y: 'value' } : { x: 'name', y: 'value' },
  ...
}]
```

---

## 四、API 合约（协议扩展）

### 新增消息：`tv:platform-history`

```typescript
// Host → Guest iframe
{
  type: 'tv:platform-history',
  payload: {
    fieldId: string;           // 字段 ID，如 'temperature'
    history: Array<{
      value: unknown;           // 数值，通常 number
      ts: number;               // Unix 毫秒时间戳
    }>;                         // 按时间升序排列，最老在前
  }
}
```

**处理侧约束**：
- `PlatformFieldAdapter` 接收后：仅当 `bufferSize > 0` 时处理。
- 取 `history.slice(-bufferSize)` 确保不超出容量。
- 触发 `updateData()` 对所有订阅者广播更新。
- 若 `bufferSize === 0`，静默忽略（不报错）。

### 修正消息：`tv:platform-data`（批量格式）

现有批量格式 `{ fields: Record<string, unknown> }` 已在 `EmbedPage.tsx` 中被正确路由，**无需修改协议，只需在 Host SDK 层使用正确的消息类型**（参见 TASK-B1）。

---

## 五、格式映射速查

| 来源 | 格式 | `toParsedPoint()` 映射 |
|------|------|----------------------|
| `PlatformFieldAdapter.__history` | `{ value: number, ts: number }` | `ts` → `tsSec = ts/1000`，`value` ✅ |
| ThingsPanel 历史 API | `{ x: timestamp_ms, y: number }` | `x` → `tsSec = x/1000`，`y` → `value` ✅ |
| 用户静态 JSON | `{ time: ms, value: number }` | `time` →`tsSec`，`value` ✅ |

所有格式均被 `uplot-line` 的 `toParsedPoint()` 原生支持，**无需任何中间转换层**。

---

## 六、实现优先级与风险

| Task | 优先级 | 影响文件数 | 风险 | 说明 |
|------|--------|-----------|------|------|
| A — `tv:platform-history` 协议通道（ThingsVis） | **P0** | 2 | 低 | 纯新增，无破坏性变更 |
| B — SDK 新方法 `pushPlatformFieldData` + `pushFieldHistory` | **P0** | 1 | 低 | 新增方法，`pushData()` 保留兼容 |
| C — `ThingsVisWidget.vue` 修复 `data` watch + 暴露 `pushHistory` | **P0** | 1 | 低 | watch 内协议修正 |
| D — `web-chart-config.vue` 历史预填 | **P1** | 1 | 中 | 依赖正确的历史 API 参数确认 |
| E — `echarts-line` 时间轴模式 | **P2** | 3 | 低 | 向后兼容：`xAxisType` 默认 `'category'` |

---

## 七、验收标准

1. **时序图实时更新**：在设备详情页打开含 `uplot-line` widget 的配置，绑定 `temperature__history`，接收 WebSocket 推送后图表每秒更新，曲线沿时间轴正确延伸。

2. **历史数据即时呈现**：打开编辑器弹窗后，时序图立即展示过去 N 分钟的历史数据（不需要等待实时数据累积）。

3. **`echarts-line` 向后兼容**：现有使用 `{name, value}` 格式数据的 `echarts-line` 图表不受任何影响（`xAxisType` 默认 `'category'`）。

4. **多字段独立缓冲**：`temperature` 和 `humidity` 各自拥有独立的 `__history` 缓冲数组，互不干扰；可分别绑定到两个独立的 `uplot-line` 图表。

5. **`bufferSize = 0` 时无副作用**：非时序 widget（如仪表盘、状态灯）使用默认 `bufferSize=0`，`tv:platform-history` 消息被静默忽略，不影响现有功能。
