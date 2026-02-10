# ThingsPanel + ThingsVis 双轨集成架构深度分析与实施方案

## 1. 竞品架构参考与双模理解

在工业互联网平台中，"可视化"通常存在两种截然不同的形态。混淆这两种形态是导致架构混乱的根源。

### 1.1 形态一：宿主托管 (Host-Managed) - 类 ThingsBoard Widget
*   **代表**: ThingsBoard 的部件开发 (Widget Development)、Figma 的插件系统。
*   **特征**:
    *   **无状态**: 编辑器本身不存储数据，它只是一个"转换器" (Function: JSON -> UI -> JSON)。
    *   **寄生性**: 它必须依附于宿主的业务上下文（如物模型、设备详情页）。
    *   **数据流**: `Host -> Editor -> Host`。
*   **在本项目中**: 对应 **物模型 Web/App 图表配置**。

### 1.2 形态二：独立应用 (Standalone App) - 类 Grafana Dashboard
*   **代表**: Grafana 的嵌入、Metabase 的嵌入。
*   **特征**:
    *   **有状态**: 编辑器拥有完整的生命周期，自己管理数据存储、版本控制、权限。
    *   **独立性**: 宿主仅提供"入口" (Iframe 容器) 和"身份" (SSO Token)。
    *   **数据流**: `Editor <-> Guest Backend`。
*   **在本项目中**: 对应 **可视化项目编辑器**。

---

## 2. 核心矛盾复盘：为什么之前的集成失败了？

之前的代码试图用一个 `ThingsVisEditor.vue` 组件去同时适配上述两种形态，犯了以下架构错误：

1.  **强行统一数据流**: 试图在组件内部判断 `saveTarget='host' | 'self'`，导致组件既要处理 `postMessage` 数据透传，又要处理 API 调用。这违反了**单一职责原则**。
2.  **路由与模式耦合**: 错误地认为 `viewer` 模式就等于 `/embed` 路由，忽略了在 物模型场景下，我们需要的是 **嵌入式的编辑器** (Route: `/editor?mode=embedded`)，而不是独立的编辑器应用。
3.  **环境污染**: 为了支持独立应用场景的 API 调用，引入了 SSO 和 Token 刷新逻辑，这直接干扰了物模型场景下的纯前端渲染，导致物模型配置时出现 401 错误或 Token 循环重定向。

---

## 3. 最终集成方案：双轨隔离 (Dual-Track Isolation)

为了保证"代码简洁、高可用、高扩展"，必须将这两条轨道彻底物理隔离。

### 轨道 A：物模型集成 (Device Template Track)
*   **目标**: 恢复到您最满意的那个版本。
*   **组件**: `ThingsVisWidgetEditor.vue` (原 `ThingsVisEditor.vue` 的纯净版)
*   **通信协议**: `window.postMessage`
*   **数据源**: 完全由 Props 传入 (`config`, `platformFields`)。
*   **保存**: 编辑器只负责 `emit('save', json)`，由 `web-chart-config.vue` 调用 `putTemplat` API 保存到 ThingsPanel 后端。
*   **URL**: 指向 ThingsVis 的 **纯净渲染路由** (建议: `/widget-editor` 或带特殊参数的 `/editor`)。**绝对不带 SSO Token**。

### 轨道 B：可视化项目集成 (Visualization Project Track)
*   **目标**: 像嵌入 Grafana 一样嵌入 ThingsVis。
*   **组件**: `ThingsVisAppFrame.vue` (新组件)
*   **通信协议**: URL Parameters (Token, ProjectID)
*   **数据源**: ThingsVis 自行通过 API 从 ThingsVis 后端加载。
*   **保存**: ThingsVis 自行保存。Host 不干预。
*   **URL**: 指向 ThingsVis 的 **完整应用路由** (`/editor/:id`)。**必须带 SSO Token**。

---

## 4. 实施路线图

### 4.1 恢复物模型代码 (Git Recovery)
鉴于当前 `ThingsVisEditor.vue` 已被污染，我们需要从 Git 历史中找回那个纯粹基于 `postMessage` 的版本，并将其重命名为 `ThingsVisWidgetEditor.vue`，专门服务于物模型。

**操作步骤**:
1.  找到引入 `saveTarget` 之前的 commit (已通过 git log 确认为纯净版本)。
2.  恢复该文件内容到 `src/components/thingsvis/ThingsVisWidgetEditor.vue`。
3.  修正 `web-chart-config.vue` 和 `app-chart-config.vue` 引用此新组件。

### 4.2 实现可视化项目容器 (New Implementation)
新建 `src/components/thingsvis/ThingsVisAppFrame.vue`:
```vue
<template>
  <iframe
    :src="appUrl"
    class="w-full h-full border-0"
    allow="clipboard-read; clipboard-write; fullscreen"
  />
</template>
<script setup>
// 仅负责:
// 1. 获取 SSO Token
// 2. 拼接 URL: ${baseUrl}/editor/${props.id}?token=${token}
</script>
```

### 4.3 清理路由 (Cleanup)
在 ThingsVis (Guest) 端：
1.  确保 `/editor` 路由在没有 Token 时也能通过 `postMessage` 接收数据并渲染 (服务于轨道 A)。
2.  确保 `/editor` 路由在有 Token 时能自动加载云端数据 (服务于轨道 B)。

这个方案能确保：
1.  **物模型功能** 100% 回归到您之前的稳定状态。
2.  **可视化编辑器** 功能完全独立，互不干扰。
3.  **扩展性**: 未来如果 ThingsVis 升级，只需要维护各自对应的组件即可。
