# 技术契约与架构设计书：遥测字段绑定不显示真实值修复

## 版本
- **日期**: 2026-03-12
- **状态**: Ready for Implementation
- **负责人**: task-coder

---

## 0. 问题描述

在 ThingsVis 编辑器（Studio）中为文本 Widget 绑定遥测字段（如 `temp [number]`），保存后在设备详情页的图表 Tab 中，Widget 始终显示默认占位文本（"请输入文本"），不显示设备的真实遥测值。

---

## 1. 根因分析（全链路 Bug 追踪）

### 1.1 链路全景

```
ThingsVisWidget.vue (挂载 iframe)
  └─ defineExpose({ client: null })          ← ❌ BUG 1 根因：null 被快照
       │
       ▼
telemetry-chart.vue
  └─ pushDataToVis(fields) {
       if (visWidgetRef.value?.client?.ready) // ← always null → always false
         client.pushPlatformFieldData(fields)  // ← 永不执行
     }

useRealtimePush (WebSocket)
  └─ onmessage → pushData(fields) → pushDataToVis(fields) → ❌ 无数据流入 ThingsVis

fetchAndUpdateData()
  └─ dataMap 构建完毕后
       realtimePush.value?.start  // ← ❌ BUG 2：读取函数引用（死代码），不是 pushDataToVis

onVisReady()
  └─ 仅做历史回填，不推送当前值  // ← ❌ BUG 3：Widget 就绪后无初始数据推送
```

### 1.2 Bug 1（根本原因）：`defineExpose` 快照了 `null`

**文件**: `src/components/thingsvis/ThingsVisWidget.vue`

```ts
let client: ThingsVisClient | null = null   // ← 初始值 null

// ... onMounted 里才赋值 client = new ThingsVisClient(...)

defineExpose({
  triggerSave,
  client,     // ← Vue 3 defineExpose 在 setup() 执行时拷贝了此时的值 null
  pushHistory
})
```

Vue 3 的 `defineExpose` 创建 `instance.exposed = proxyRefs({ client: null })`。后续 `onMounted` 中 `client = new ThingsVisClient(...)` 只修改了局部变量，**暴露的属性永远是 `null`**。

因此调用方 `visWidgetRef.value?.client?.ready` 永远为 `undefined`（falsy），`pushPlatformFieldData` 永远不被调用。

对比：`pushHistory` 是一个**闭包函数**，它通过变量引用访问 `client`，所以历史回填 API `visWidgetRef.value?.pushHistory(...)` 是正常工作的——这正是正确的模式。

### 1.3 Bug 2：`fetchAndUpdateData` 中的死代码

**文件**: `src/views/device/details/modules/telemetry-chart.vue`

```ts
if (Object.keys(dataMap).length > 0) {
  currentData.value = dataMap
  realtimePush.value?.start   // ← 仅读取函数引用，从未调用，死代码
}
```

正确意图应为 `pushDataToVis(dataMap)`。

### 1.4 Bug 3：`onVisReady` 未推送初始快照

两个消费文件（`telemetry-chart.vue` 和 `device-details-app/index.vue`）的 `onVisReady` 只做历史回填，没有推送当前字段值。导致 Widget 加载后显示占位文本，直到下一条 WebSocket 消息到来。

---

## 2. 数据模型层（Schema）

**无需修改。** 问题完全出在宿主侧的 JavaScript 运行时调用链，与 Schema/类型定义无关。

---

## 3. 后端服务层（API）

**无需修改。**

---

## 4. 前端交互层（View）

### 4.1 修改 `ThingsVisWidget.vue`

**策略**: 仿照已有的 `pushHistory` 闭包方法，新增 `pushPlatformData` 包装方法并暴露。调用方通过此方法（而非通过 `.client` 属性）转发数据，从根本上绕开 `client` 属性快照问题。

**改动**:
```ts
// 新增：闭包方法，client 通过变量引用访问（不受 defineExpose 快照影响）
const pushPlatformData = (fields: Record<string, unknown>) => {
  client?.pushPlatformFieldData(fields)
}

// defineExpose 新增 pushPlatformData
defineExpose({
  triggerSave,
  client,           // 保留兼容，但调用方不应再依赖此属性
  pushHistory,
  pushPlatformData, // ← 新增
})
```

### 4.2 修改 `telemetry-chart.vue`

**改动 A**：`pushDataToVis` 使用闭包包装方法：
```ts
const pushDataToVis = (fields: Record<string, unknown>) => {
  visWidgetRef.value?.pushPlatformData(fields)  // ← 改为调用包装方法
}
```

**改动 B**：修复 `fetchAndUpdateData` 中的死代码：
```ts
if (Object.keys(dataMap).length > 0) {
  currentData.value = dataMap
  pushDataToVis(dataMap)  // ← 替换死代码 realtimePush.value?.start
}
```

**改动 C**：`onVisReady` 补充初始快照推送：
```ts
const onVisReady = async () => {
  if (historyBackfill.value) {
    await historyBackfill.value.backfill()
  }
  if (alarmPush.value) {
    await alarmPush.value.backfillAlarmHistory()
  }
  // Push current snapshot immediately after widget finishes initializing
  await fetchAndUpdateData()
}
```

### 4.3 修改 `device-details-app/index.vue`

**改动**：同样修复 `pushDataToVis` 调用方式：
```ts
const pushDataToVis = (fields: Record<string, unknown>) => {
  visWidgetRef.value?.pushPlatformData(fields)  // ← 改为包装方法
}
```

---

## 5. 目标文件清单

| # | 操作 | 文件绝对路径 |
|---|------|-------------|
| 1 | **修改** | `f:\coding\thingspanel-frontend-community\src\components\thingsvis\ThingsVisWidget.vue` |
| 2 | **修改** | `f:\coding\thingspanel-frontend-community\src\views\device\details\modules\telemetry-chart.vue` |
| 3 | **修改** | `f:\coding\thingspanel-frontend-community\src\views\device-details-app\index.vue` |

不新建任何文件，不修改 Schema、API 层。

---

## 6. 验证要点

1. 设备详情页图表 Tab 打开后，文本 Widget 在 3 秒内显示真实遥测值（由 `onVisReady → fetchAndUpdateData` 触发）
2. WebSocket 连通后，每次遥测更新均实时反映在 Widget 上
3. 历史回填（折线图）仍正常工作（`pushHistory` 未受影响）
4. 无 TypeScript 编译报错
