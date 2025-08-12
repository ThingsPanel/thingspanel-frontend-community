### 重构方案：实现配置驱动的动态数据源 (V4 - 最终实施方案)

**核心问题:** 组件的数据源需求被硬编码在UI配置面板中，缺乏灵活性、可维护性和可扩展性。

**重构目标:**
1.  **声明式数据需求:** 组件在其定义中明确声明其所需数据源的**数量、类型、字段映射规则**以及**静态参数**。
2.  **动态配置UI:** 配置面板根据组件的声明动态生成包含**数据源绑定**和**静态参数输入**的界面。
3.  **健壮的数据绑定:** 建立一套包含**加载状态、错误处理和生命周期管理**的通用数据传递和更新机制。
4.  **持久化:** 确保所有配置能够被保存和恢复。

---

### 详细实施步骤

#### 第 1 步 & 第 2 步 (无变化)

核心类型定义 (`StaticParamRequirement`, `DataSourceRequirement`) 和“数据源中心”的契约 (`DataSourceInfo`) 保持 V3 版本的设计，它们是稳固的基础。

---

#### 第 3 步：重构配置面板 (无变化)

配置面板的职责和实现方式也保持 V3 版本的设计。它负责采集用户输入，生成统一的配置JSON对象。

---

#### 第 4 步：数据流与更新机制 (useWidgetProps Hook - 核心升级)

**核心:** 实现一个名为 `useWidgetProps` 的 Vue Composable (Hook)，它将成为连接“配置”和“组件渲染”的唯一桥梁。

**位置:** `e:\wbh\things2\thingspanel-frontend-community\src\card2.1\hooks\useWidgetProps.ts` (建议路径)

**Hook 的定义与返回值:**

```typescript
import { ref, onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import type { ComponentDefinition, WidgetConfiguration } from '../core/types';

// Hook 的返回值结构
export interface UseWidgetPropsReturn {
  props: Ref<Record<string, any>>; // 传递给组件的最终props
  isLoading: Ref<boolean>;          // 是否正在加载数据
  error: Ref<Error | null>;         // 加载或订阅过程中发生的错误
}

// Hook 函数签名
export function useWidgetProps(
  definition: Ref<ComponentDefinition>,
  configuration: Ref<WidgetConfiguration>
): UseWidgetPropsReturn {
  // ... 实现逻辑
}
```

**`useWidgetProps` 的实现逻辑:**

1.  **状态初始化:**
    *   `const props = ref({});`
    *   `const isLoading = ref(true);`
    *   `const error = ref(null);`
    *   `const subscriptions = [];` // 用于存储所有数据源的取消订阅函数

2.  **数据处理函数 `resolveProps`:**
    *   创建一个 `async function resolveProps()`，该函数负责所有的数据解析和订阅逻辑。
    *   **清空旧状态:** 在函数开始时，重置 `isLoading`, `error` 和 `props`，并调用所有旧的 `subscriptions` 函数来取消订阅。
    *   **处理静态参数:** 同步遍历 `definition.staticParams`，从 `configuration` 中读取值并填充到 `props.value` 中。
    *   **处理动态数据源 (异步):**
        *   使用 `Promise.all` 包裹所有数据源的订阅过程。
        *   遍历 `definition.dataSources`。
        *   对于每个数据源，从 `configuration` 中读取其绑定配置 (`dataSourceId`, `fieldMappings`)。
        *   **调用数据源中心的服务**来订阅数据。该服务应返回一个包含 `unsubscribe` 方法的对象。
        *   将 `unsubscribe` 方法存入 `subscriptions` 数组。
        *   在数据到达时，执行字段映射转换，然后更新 `props.value` 中对应的 `key`。
    *   **错误处理:** 将整个 `resolveProps` 的核心逻辑包裹在 `try...catch` 块中。如果任何步骤（包括订阅或初次数据获取）失败，则捕获错误，设置 `error.value`。
    *   **加载完成:** 在 `try` 块的末尾（`Promise.all` 之后），设置 `isLoading.value = false`。

3.  **生命周期与响应式:**
    *   **立即执行:** 调用 `resolveProps()` 来初始化。
    *   **监听变化:** 使用 `watch` 监听 `configuration` 的变化。当配置改变时，重新调用 `resolveProps()`。
    *   **清理副作用:** 使用 `onUnmounted` 注册一个钩子，确保在组件销毁时，遍历并执行 `subscriptions` 数组中的所有取消订阅函数，**防止内存泄漏**。

4.  **返回:** `return { props, isLoading, error };`

---

#### 第 5 步：在组件渲染器中使用 Hook

**任务:** 修改渲染动态组件的父容器，使其使用 `useWidgetProps` Hook，并根据其状态进行渲染。

**示例代码:**

```html
<!-- WidgetWrapper.vue 或类似组件 -->
<template>
  <div v-if="isLoading" class="widget-loading">加载中...</div>
  <div v-else-if="error" class="widget-error">{{ error.message }}</div>
  <component v-else :is="widgetComponent" v-bind="props" />
</template>

<script setup>
import { useWidgetProps } from '@/card2.1/hooks/useWidgetProps';

const widget = defineProps(['definition', 'configuration']);

// 使用Hook获取所有响应式状态
const { props, isLoading, error } = useWidgetProps(
  toRef(widget, 'definition'), 
  toRef(widget, 'configuration')
);

// ... 其他逻辑，如动态加载组件
</script>
```

---

### V4 新增分析：健壮性与生命周期

*   **初始状态处理:** 通过引入 `isLoading` 状态，UI 可以明确地向用户展示数据正在加载中，避免了组件因 props 未准备好而导致的闪烁或渲染错误。
*   **全面的错误处理:** `error` 状态可以捕获从数据源订阅到数据转换过程中的任何问题，并允许 UI 以友好的方式向用户展示错误信息，而不是静默失败或导致整个应用崩溃。
*   **严格的生命周期管理:** `onUnmounted` 钩子和 `subscriptions` 数组确保了组件在销毁时能够彻底清理所有外部订阅，这是防止内存泄漏的关键，也是一个生产级应用必须具备的特性。