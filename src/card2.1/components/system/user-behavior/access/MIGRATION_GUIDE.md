## Card 迁移指南：从 `card` 到 `card2.1`

本文档以 `access` 组件为例，详细阐述了将旧版 `card` 组件迁移到新的 `card2.1` 架构的核心步骤和最佳实践。

### 1. 核心理念转变

- **旧版 (`card`)**: 一个独立的、功能内聚的 Vue 组件，配置和数据获取逻辑通常硬编码在组件内部。
- **新版 (`card2.1`)**: 一个遵循特定规范的、可被自动注册和组合的“微组件”生态。它将一个组件解构成三个核心部分：
    - `definition.ts`: 组件的“身份证”，定义其元数据、可配置属性 (props) 和交互能力。
    - `component.vue`: 纯粹的 UI 实现，根据 `props` 渲染视图。
    - `preset.ts`: 预设配置，提供开箱即用的组件实例，方便用户在编辑器中直接拖拽使用。

### 2. 迁移步骤 (以 `access` 为例)

#### 第一步：确定组件分类和目录结构

1.  **分析分类**: 首先，根据 `src/card2.1/core/category-definition.ts` 文件中定义的分类体系，为你的组件找到最合适的归属。
    - `access` 组件用于展示用户行为数据（访问量），因此它被归类到 `system/user-behavior` 下。

2.  **创建目录**: 在 `src/card2.1/components/` 目录下，创建符合 `主分类/子分类/组件名` 规范的三级目录结构。
    - 对于 `access` 组件，我们创建了 `src/card2.1/components/system/user-behavior/access`。

#### 第二步：创建 `definition.ts`

这是最关键的一步，它让 `card2.1` 系统“认识”你的组件。

```typescript
// src/card2.1/components/system/user-behavior/access/definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types';

export default {
  name: 'access', // 组件唯一标识
  title: '访问量', // 在编辑器中显示的名称
  description: '显示系统或应用的累计访问量',
  dataDriven: false, // `false` 表示数据由组件内部获取，而非外部数据源注入
  interactionCapability: {
    click: true, // 声明支持点击事件
  },
} as ComponentDefinition;
```

#### 第三步：迁移 Vue 组件 (`component.vue`)

将旧组件的核心 UI 和业务逻辑迁移过来，并进行现代化改造。

- **1:1 功能还原**: 确保所有功能细节都被保留，例如国际化 (`useI18n`)、数据获取逻辑等。
- **UI/UX 优化**: 遵循项目的设计哲学，应用毛玻璃、圆角、阴影等效果，提升视觉体验。

```vue
<!-- src/card2.1/components/system/user-behavior/access/component.vue -->
<template>
  <!-- ... 现代化的 UI 布局 ... -->
  <div class="title">{{ t('card.deviceTotal') }}</div>
  <!-- ... -->
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getAccessCount } from '@/service/api/device';
// ...
const { t } = useI18n();
// ... 数据获取逻辑 ...
</script>

<style scoped lang="scss">
/* ... 遵循设计规范的样式 ... */
</style>
```

#### 第四步：创建预设 (`preset.ts`)

为组件提供一个或多个开箱即用的配置实例。

```typescript
// src/card2.1/components/system/user-behavior/access/preset.ts
import type { ComponentPreset } from '@/card2.1/core/types';

export default [
  {
    id: 'access.default', // 预设的唯一 ID
    title: '默认访问量卡片',
    description: '一个标准的访问量统计卡片...',
    // layout: { w: 2, h: 2 } // 可以预设默认布局大小
  },
] as ComponentPreset[];
```

#### 第五步：创建入口文件 (`index.ts`)

这是组件的出口，将所有部分聚合在一起，供自动注册系统使用。

```typescript
// src/card2.1/components/system/user-behavior/access/index.ts
import Definition from './definition';
import Component from './component.vue';
import Presets from './preset';

export {
  Definition,
  Component,
  Presets,
};
```

### 3. 总结

通过遵循以上步骤，任何旧版 `card` 都可以被平滑地迁移到 `card2.1` 架构中。这种结构化的方法不仅提升了代码的可维护性和复用性，还通过自动注册和预设机制，极大地增强了系统的灵活性和可扩展性。