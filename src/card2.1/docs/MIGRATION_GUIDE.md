# Card 2.1 组件迁移指南 (v1.0)

本文档旨在为开发者提供将旧版 `card` 组件迁移至 `card2.1` 架构的详细步骤和最佳实践。

## 核心理念：约定优于配置

`card2.1` 的核心设计思想是“约定优于配置”。它依赖于一个强大的 **自动注册系统 (`auto-registry.ts`)**，该系统通过扫描组件目录结构和中央分类定义来自动完成组件的注册和分类，极大地简化了组件的定义文件。

开发者不再需要手动管理复杂的导入路径或使用 `defineComponent` 包装器。

## 迁移步骤

### 1. 文件结构调整

- **核心原则**: 组件应根据其分类，存放在对应的目录中。这是实现“目录即分类”自动注册的基础。
- **目录结构**: `src/card2.1/components/<主分类>/<子分类>/<组件名>`
    - `<主分类>`: 例如 `system` 或 `chart`。
    - `<子分类>`: 例如 `system` 下的 `user-behavior`。
- **`access` 组件示例**:
    - **分类**: `access` 组件属于 `系统(system)` -> `用户行为(user-behavior)` 分类。
    - **新版位置**: `src/card2.1/components/system/user-behavior/access/`

**操作步骤**:

1.  在 `src/card2.1/components/system/` 目录下，创建 `user-behavior` 子目录（如果尚不存在）。
2.  在 `user-behavior` 目录下，为 `access` 组件创建一个新目录。
3.  将旧的 `access` 组件文件 (`index.ts`, `component.vue`, `access.png`) 复制到新创建的 `src/card2.1/components/system/user-behavior/access/` 目录中。

### 2. 重构 `index.ts` (核心)

这是迁移过程中最重要的步骤。旧的 `index.ts` 文件需要被彻底重写，以导出一个简单的 **纯 JavaScript 对象**。

#### 旧版 `index.ts` 示例 (错误方式):

```typescript
import { COMPONENT_TYPE_VALUE_MAP } from '@/card/core/constants/component';
import { defineComponent } from '@/card2.1/core/utils/define-component';

export default defineComponent({
  id: 'access',
  name: '访问用户',
  type: COMPONENT_TYPE_VALUE_MAP.system,
  // ... 其他属性
});
```

#### 新版 `index.ts` 示例 (正确方式):

```typescript
/**
 * @description 访问用户组件
 * @description.en-US Access User Component
 * @author YourName
 * @date 2024-07-31
 * @version 2.1
 */
export default {
  /**
   * 组件的唯一标识符，必须与组件的目录名完全一致。
   * 自动注册系统将使用此 `type` 在 `category-definition.ts` 中查找其分类。
   */
  type: 'access',

  /**
   * 组件在UI中显示的名称。
   */
  name: '访问用户',

  /**
   * 异步加载的Vue组件。
   */
  component: () => import('./component.vue'),

  /**
   * 组件在组件库中的预览图。
   */
  poster: {
    src: new URL('./access.png', import.meta.url).href,
    width: 400,
    height: 200,
  },

  /**
   * 组件的默认样式。
   */
  style: {
    width: 400,
    height: 200,
  },

  /**
   * 定义组件所需的权限。
   * 可选值: 'SYS_ADMIN', 'TENANT_ADMIN', 'TENANT_USER', '不限'。
   * 默认为 '不限'。
   */
  permission: '不限',

  /**
   * 定义组件是否默认注册。
   * 设置为 `false` 将阻止该组件被自动注册。
   */
  isRegistered: true,
};
```

#### 关键变更点:

1.  **移除所有导入**: 不再需要从 `@/card/...` 或 `@/card2.1/core/utils/...` 导入任何内容。
2.  **移除 `defineComponent`**: 直接 `export default` 一个普通对象。
3.  **`id` -> `type`**: 旧的 `id` 字段被 `type` 字段取代，其值必须是组件的目录名（例如 `'access'`）。这是维系历史数据的关键。
4.  **移除 `category` 相关字段**: `mainCategory`, `subCategory`, `category` 等字段会被自动注册系统根据 `type` 和 `category-definition.ts` 的配置自动填充，无需手动指定。
5.  **添加 `permission` 和 `isRegistered`**: 这两个是 `card2.1` 中新增的控制字段，用于权限和注册管理。

### 3. 更新中央分类定义

确认 `src/card2.1/core/category-definition.ts` 文件中的 `COMPONENT_TO_CATEGORY_MAP` 包含了新迁移的组件。

```typescript
// src/card2.1/core/category-definition.ts

export const COMPONENT_TO_CATEGORY_MAP: Record<string, string> = {
  // ... 其他组件
  'access': 'user-behavior', // 确保这一行存在
  // ...
};
```

### 4. 检查并重构 `component.vue`

最后，检查并更新 `component.vue` 文件，以确保其符合 `card2.1` 的架构要求，并利用 Vue 3 的新特性。

#### a. 检查基本兼容性

-   **导入路径:** 确保所有从 `@/` 或其他模块导入的路径在新架构下依然有效。特别是对于从 `core` 或 `utils` 导入的模块，需要更新为 `card2.1` 的新路径。
-   **API 调用:** 如果组件依赖于旧的 API 服务，需要将其更新为 `card2.1` 中对应的新服务。
-   **状态管理:** 检查是否依赖了旧的状态管理（如 Vuex），并迁移到新的方案（如 Pinia）。

#### b. 现代化重构 (推荐)

迁移不仅是更新 `index.ts`，`component.vue` 文件本身也需要现代化改造，以充分利用 Vue 3 的新特性并遵循 `card2.1` 的开发规范。

**旧版 `component.vue` (可能存在的问题):**

-   使用 Options API。
-   通过 `this.$emit` 触发事件。
-   复杂的生命周期钩子 (`created`, `mounted`)。
-   直接操作 DOM。
-   从 `../../../` 这样的深层相对路径导入服务。

**新版 `component.vue` (重构指南):**

1.  **使用 `<script setup lang="ts">`:** 这是 Vue 3 的组合式 API 的语法糖，能让代码更简洁、类型推断更强大。

2.  **状态管理:**
    -   使用 `ref` 或 `reactive` 来定义组件的响应式状态。
    -   如果需要全局状态，使用 Pinia (`useAuthStore()` 等)。

3.  **数据获取:**
    -   在 `onMounted` 生命周期钩子中调用 API 获取初始数据。
    -   使用 `async/await` 语法处理异步操作。
    -   从 `@/service/api/...` 这样的路径别名导入 API 服务，而不是相对路径。

4.  **组件通信:**
    -   使用 `defineProps` 和 `defineEmits` 来声明 props 和 emits。

5.  **样式:**
    -   使用 `<style scoped>` 来确保样式只作用于当前组件，避免全局污染。
    -   推荐使用原子化 CSS 框架（如 Tailwind CSS）或 CSS-in-JS 方案来编写样式，以提高复用性和可维护性。

**重构示例 (`access/component.vue`):**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { createLogger } from '@/utils/logger'
import { totalNumber } from '@/service/api/system-data' // -> 使用路径别名
import { CountTo } from '@/components/CountTo'
import { GradientBg } from '../components/gradient-bg'

defineOptions({ name: 'AccessCard' })

const authStore = useAuthStore()
const logger = createLogger('AccessCard')

// 使用 ref 定义响应式状态
const todayData = ref({ value: 0, unit: '人' })
const yesterdayData = ref({ value: 0, unit: '人' })

/**
 * 获取数据
 */
const fetchData = async () => {
  try {
    // 统一调用新的 API
    const response = await totalNumber()
    
    // 使用模拟数据，实际应根据接口返回进行赋值
    todayData.value.value = Math.floor(Math.random() * 1000)
    yesterdayData.value.value = Math.floor(Math.random() * 800)

  } catch (error) {
    logger.error('获取访问数据失败:', error)
    todayData.value.value = 0
    yesterdayData.value.value = 0
  }
}

// 在 onMounted 中获取数据
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="access-card">
    <GradientBg class="access-card__item" start-color="#56cdf3" end-color="#719de3">
      <div class="access-card__info">
        <span class="access-card__title">今日访问用户数</span>
        <CountTo :start-value="0" :end-value="todayData.value" class="access-card__value" />
        <span class="access-card__unit">{{ todayData.unit }}</span>
      </div>
    </GradientBg>
    <!-- ... yesterday data ... -->
  </div>
</template>

<style scoped>
/* ... 遵循项目规范的样式 ... */
.access-card {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 16px;
}
/* ... */
</style>
```

## 总结

迁移到 `card2.1` 的核心是理解其 **自动化** 和 **约定驱动** 的本质。通过遵循上述步骤，您可以平滑地将旧组件集成到新架构中，并显著简化未来的维护工作。