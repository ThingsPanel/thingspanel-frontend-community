# ThingsVis 集成架构分析与优化建议 (最终修订版)

## 1. 核心原则
*   **彻底分离**: 不再让 `ThingsVisEditor.vue` 同时通过 props 兼容两种截然不同的模式。
*   **回归本源**:
    *   **物模型场景**: 保持原有的 JSON 数据透传模式 (`PostMessage`)。
    *   **可视化编辑器场景**: 采用纯嵌入模式 (`Iframe` + `SSO`)，数据流完全由 ThingsVis 内部闭环。

---

## 2. 场景与组件映射

| 场景 | 当前组件/页面 | 数据流向 | 改造方案 |
| :--- | :--- | :--- | :--- |
| **A. 物模型 (Web/App图表)** | `web-chart-config.vue`<br>`app-chart-config.vue` | Host -> Message -> Guest<br>(Host 保存 JSON) | **维持现状 / 轻微清理**。<br>继续使用 `ThingsVisEditor.vue`，但移除其中为了兼容场景 B 而添加的复杂逻辑（如 `saveTarget`）。 |
| **B. 可视化编辑器** | `thingsvis-editor/index.vue` | Guest <-> Cloud API<br>(ThingsVis 自闭环) | **新建 `ThingsVisFrame.vue`**。<br>不再监听 `@save`。Host 仅提供容器和 Token。 |

---

## 3. 详细实施计划

### 3.1 还原并清理 `ThingsVisEditor.vue`
*   **目标**: 让它专心服务于物模型场景。
*   **动作**:
    *   仅保留 PostMessage 通信逻辑（用于 `initialConfig` 握手）。
    *   保留 `@save` 事件发射（因为物模型需要 Host 来保存）。
    *   **移除**: `saveTarget` 属性判断。**不再**尝试处理 "ThingsVis 托管" 的逻辑。
    *   **移除**: 任何尝试直接调用 ThingsVis API 进行保存的代码。

### 3.2 新建 `ThingsVisFrame.vue` (针对可视化编辑器)
这是一个全新的、极简的组件，专门用于 `src/views/visualization/thingsvis-editor/index.vue`。

```vue
<!-- 伪代码预览 -->
<template>
  <div class="w-full h-full">
    <iframe
      :src="iframeUrl"
      class="w-full h-full border-0"
    />
  </div>
</template>

<script setup>
// 1. 获取 SSO Token
// 2. 构建 URL: /editor/:id?token=xxx
// 3. 结束。不监听 @save，不干涉内部逻辑。
</script>
```

### 3.3 修改 `thingsvis-editor/index.vue`
*   **动作**: 替换 `<ThingsVisEditor>` 为 `<ThingsVisFrame>`。
*   **删除**: `handleSave` 函数。Host 不再负责保存仪表盘数据。
*   **删除**: `loadDashboard` 函数（如果 ThingsVis 编辑器能自己加载数据的话）。
    *   *注意*: 这里可能只需要传 `id` 给 iframe，iframe 内部自己去调 API 加载数据。

### 3.4 路由与 URL 构建 (`url-builder.ts`)
*   保留 `/embed` 路由给物模型预览（Viewer模式）。
*   确保 `/editor` 路由指向全功能的编辑器页面。
*   `ThingsVisFrame` 将直接加载 `/editor` 路由。

---

## 4. 总结
这种拆分方式完全符合您的要求：
1.  **不添乱**: 物模型那块好用的代码不动/少动。
2.  **彻底嵌入**: 可视化编辑器像独立 App 一样运行在 Iframe 里，Host 只做容器。
3.  **高可用/扩展**: 两个场景互不耦合，各自演进。
