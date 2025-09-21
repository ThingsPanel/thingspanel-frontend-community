# 从 `card` 迁移到 `card2.1` 指南

本文档旨在帮助开发者将旧版 `card` 组件平滑迁移到新版 `card2.1` 架构。

## 1. 核心概念变化

`card2.1` 引入了全新的架构，旨在提高组件的可复用性、可维护性和可扩展性。核心变化包括：

*   **组件注册机制**: 所有卡片组件都需要通过 `card2.1/core/component-registry.ts` 进行注册，以便在系统中使用。
*   **结构化分类**: 组件被组织在 `card2.1/components` 目录下，并按照 `业务领域/功能` 的方式进行分类。
*   **数据源抽象**: 数据获取和管理逻辑被抽象到 `card2.1/core/data-source` 中，实现了数据逻辑与视图的解耦。
*   **标准化配置**: 组件的配置项通过 `card2.1/core/config-manager.ts` 进行管理，提供了统一的配置接口。

## 2. 迁移步骤

### 2.1 组件迁移路径

为了帮助您快速定位新旧组件，下表列出了 `builtin-card` 中常见的数字展示类组件到 `card2.1` 的迁移路径。

| 功能描述 | 源路径 (from `src/card`) | 目标路径 (to `src/card2.1`) |
| :--- | :--- | :--- |
| **访问用户数** | `builtin-card/access` | `components/system/user-behavior/access` |
| **告警统计** | `builtin-card/alarm-count` | `components/system/alarm-management/alarm-count` |
| **告警信息** | `builtin-card/alarm-info` | `components/system/alarm-management/alarm-info` |
| **应用下载** | `builtin-card/app-download` | `components/system/tenant-app/app-download` |
| **CPU 使用率** | `builtin-card/cpu-usage` | `components/system/system-monitoring/cpu-usage` |
| **硬盘使用率** | `builtin-card/disk-usage` | `components/system/system-monitoring/disk-usage` |
| **通用信息** | `builtin-card/information` | `components/system/data-information/information` |
| **内存使用率** | `builtin-card/memory-usage` | `components/system/system-monitoring/memory-usage` |
| **新闻资讯** | `builtin-card/news` | `components/system/data-information/news` |
| **在线/离线设备数** | `builtin-card/on-line`, `builtin-card/off-line` | `components/system/device-status/on-off-line` |
| **在线趋势** | `builtin-card/online-trend` | `components/system/device-status/online-trend` |
| **操作指引** | `builtin-card/operation-guide-card` | `components/system/operation-guide/operation-guide-card` |
| **最近访问** | `builtin-card/recently-visited` | `components/system/user-behavior/recently-visited` |
| **上报数据** | `builtin-card/reported-data` | `components/system/data-information/reported-data` |
| **系统历史指标** | `builtin-card/system-metrics-history` | `components/system/system-monitoring/system-metrics-history` |
| **租户图表** | `builtin-card/tenant-chart` | `components/system/tenant-app/tenant-chart` |
| **租户数量** | `builtin-card/tenant-count` | `components/system/tenant-app/tenant-count` |
| **版本信息** | `builtin-card/version` | `components/system/data-information/version` |

## 3. 通用卡片组件迁移 (`GenericCard`)

为了统一卡片样式并简化开发，`card2.1` 引入了 `GenericCard` 通用卡片组件。所有展示单一数值、标题和图标的卡片都应使用此组件进行重构。

### 3.1 `GenericCard` 组件介绍

`GenericCard` 组件位于 `src/card2.1/components/common/generic-card/component.vue`。它提供了标准化的布局、样式和动画效果，并通过插槽和属性(props)提供了高度的灵活性。

**核心特性:**

*   **插槽 (Slots):**
    *   `#title`: 用于自定义卡片标题。
    *   `#icon`: 用于放置图标。
    *   `#value`: 用于展示核心数值。
*   **属性 (Props):**
    *   `colors`: `string[]` 类型，用于定义背景的渐变色。可以传递一个或多个颜色值。

### 3.2 迁移示例：从旧版 `access` 组件到 `GenericCard`

下面以 `access` 组件为例，展示如何将其重构为使用 `GenericCard`。

**迁移前 (旧版实现):**

旧版的 `access` 组件拥有自己的模板和样式，包含了大量的重复代码。

```vue
<template>
  <div class="access-card">
    <div class="header">
      <span class="title">访问用户数</span>
      <svg class="icon">...</svg>
    </div>
    <div class="value">{{ count }}</div>
  </div>
</template>
<style scoped>
.access-card {
  /* 自定义样式 */
  background: linear-gradient(to right, #409eff, #58b2f8, #22edf0, #67c23a);
}
/* ... 其他样式 */
</style>
```

**迁移后 (使用 `GenericCard`):**

重构后的 `access` 组件变得非常简洁。它将视图逻辑委托给 `GenericCard`，只负责提供数据和内容。

```vue
<template>
  <GenericCard :colors="['#409eff', '#58b2f8', '#22edf0', '#67c23a']">
    <template #title>访问用户数</template>
    <template #icon>
      <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <path d="M512 512a192 192 0 1 0 0-384 192 192 0 0 0 0 384zm0 64a256 256 0 1 1 0-512 256 256 0 0 1 0 512zm-256 320h512a32 32 0 0 1 32 32v32a32 32 0 0 1-32-32H256a32 32 0 0 1-32-32v-32a32 32 0 0 1 32-32zm-32-64a96 96 0 0 1 96-96h384a96 96 0 0 1 96 96v96a96 96 0 0 1-96 96H256a96 96 0 0 1-96-96v-96z" fill="#fff"></path>
      </svg>
    </template>
    <template #value>{{ count }}</template>
  </GenericCard>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import GenericCard from "@/card2.1/components/common/generic-card/component.vue";

const count = ref(1234); // 示例数据
</script>

<style scoped>
/* 样式已由 GenericCard 处理，此处无需额外样式 */
</style>
```

### 3.3 迁移步骤总结

1.  **替换模板:** 将旧组件的模板替换为 `<GenericCard>`。
2.  **传递颜色:** 将背景颜色作为 `colors` 属性传递给 `GenericCard`。
3.  **填充插槽:** 将旧组件的标题、图标和数值分别放入 `#title`、`#icon` 和 `#value` 插槽中。
4.  **清理脚本:** 移除旧的样式和布局相关的逻辑，只保留数据获取和处理。
5.  **删除样式:** 删除旧组件中的所有样式代码，因为样式已由 `GenericCard` 统一管理。

通过遵循以上步骤，您可以快速地将所有卡片类组件迁移到新的 `GenericCard` 架构，从而提高代码的一致性和可维护性。

## 4. 常见问题与解决方案

### 4.1 组件自动注册失败

**问题描述：** 新创建的组件无法在可视化编辑器的组件库中显示。

**可能原因：**
1. 组件定义文件使用了错误的类型系统
2. 组件没有正确导出
3. 分类映射配置缺失

**解决方案：**

#### 4.1.1 检查组件定义类型

确保组件使用正确的 `ComponentDefinition` 类型，而不是旧的 `CardComponent` 或 `CardDefinition`：

```typescript
// ❌ 错误：使用旧类型
import type { CardComponent } from '@/card2.1/types/card-component';

const MyCard: CardComponent = {
  id: 'my-card',
  component: () => import('./component.vue'),
};

// ✅ 正确：使用新类型
import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

export default {
  type: 'my-card',
  name: '我的卡片',
  description: '卡片描述',
  component,
  category: '系统/设备状态',
  version: '2.1.0',
  tags: ['标签1', '标签2'],
  permission: '不限'
} as ComponentDefinition;
```

#### 4.1.2 检查文件结构

确保组件文件结构符合 Card 2.1 规范：

```
src/card2.1/components/system/device-status/my-component/
├── index.ts          # 导出组件定义
├── definition.ts     # 组件定义文件
├── component.vue     # Vue 组件实现
└── ...
```

`index.ts` 文件应该简洁地导出定义：

```typescript
import definition from './definition';

/**
 * @description 组件导出
 * @summary 默认导出组件定义，供 `card2.1` 自动注册系统使用。
 */
export default definition;
```

#### 4.1.3 添加分类映射

在 `src/card2.1/core/category-definition.ts` 中添加组件到分类的映射：

```typescript
export const COMPONENT_TO_CATEGORY_MAP: Record<string, string> = {
  // ... 其他映射
  'my-card': 'device-status', // 新增组件映射
};
```

### 4.2 二级分类显示问题

**问题描述：** 系统分类下的组件没有按照子分类正确显示，全部被归类到"默认"分类。

**根本原因：** `WidgetLibrary.vue` 中的分类逻辑错误地将所有系统分类组件强制归类到"默认"。

**解决方案：**

已在 `src/components/visual-editor/components/WidgetLibrary/WidgetLibrary.vue` 第 202 行修复：

```typescript
// ❌ 错误逻辑（已修复）
const sub = main === '系统' ? '默认' : widget.definition?.subCategory || '默认'

// ✅ 正确逻辑
const sub = widget.definition?.subCategory || '默认'
```

### 4.3 组件定义验证

**验证清单：**

- [ ] 使用了正确的 `ComponentDefinition` 类型
- [ ] 包含必需字段：`type`、`name`、`description`、`component`
- [ ] 正确设置了 `category` 或在 `COMPONENT_TO_CATEGORY_MAP` 中有映射
- [ ] `index.ts` 正确导出了 `definition`
- [ ] 组件路径符合约定：`main-category/sub-category/component/index.ts`

### 4.4 调试技巧

#### 4.4.1 开发模式调试

在开发模式下，可以在浏览器控制台查看组件注册信息：

```javascript
// 在浏览器控制台执行
console.log('[Card2.1] 组件调试信息')
```

#### 4.4.2 检查组件是否被正确扫描

自动注册系统会在控制台输出扫描到的组件：

```
🚀 [ensureInitialized] 开始初始化Card2.1组件系统...
🔥 [ensureInitialized] 发现 6 个组件模块
✅ [ensureInitialized] 加载组件: off-line (./system/device-status/off-line/index.ts)
✅ [ensureInitialized] 加载组件: on-line (./system/device-status/on-line/index.ts)
```

如果看不到你的组件，检查文件路径和命名是否正确。

#### 4.4.3 验证组件定义

可以使用内置的验证函数检查组件定义：

```typescript
import { validateComponents } from '@/card2.1/components';

// 在开发环境调用
if (process.env.NODE_ENV === 'development') {
  const validation = validateComponents();
  if (!validation.valid) {
    console.error('组件定义问题:', validation.issues);
  }
}
```

## 5. 最佳实践

### 5.1 组件命名规范

- 组件类型使用 kebab-case：`device-status`、`user-behavior`
- 目录名与组件类型保持一致
- 避免使用保留字或与现有组件冲突的名称

### 5.2 分类组织

- 按业务领域组织：系统监控、设备管理、用户行为等
- 保持分类层级简洁：最多两级分类
- 新增分类时同步更新 `category-definition.ts`

### 5.3 代码质量

- 使用 TypeScript 严格模式
- 添加详细的中文注释
- 遵循项目的代码规范和命名约定
- 确保组件的响应式设计和主题适配

## 6. Card 2.1 图标设计规范

### 6.1 图标设计标准

为了提高组件的可识别性和用户体验，Card 2.1 系统采用了统一的图标设计标准：

#### 6.1.1 技术规范

- **尺寸规格**: 统一使用 `width="20" height="20"` 的 20x20 像素规格
- **格式标准**: 使用 SVG 格式确保清晰度和可缩放性
- **填充方式**: 优先使用 `fill="currentColor"` 和特定颜色填充，避免仅使用线条描边
- **兼容性**: 支持主题系统的 `currentColor` 继承，确保在不同主题下的适配性

#### 6.1.2 视觉风格

- **设计风格**: 采用 Material Design 风格的现代化图标
- **线条规范**: 统一使用 `stroke-width="2"` 的线条粗细
- **语义化**: 图标与组件功能直接对应，增强用户理解
- **可读性**: 使用具象化图标而非抽象符号，提高辨识度

### 6.2 分类图标规范

根据组件功能类别，设计了具有明确语义的图标系统：

#### 6.2.1 🚨 告警管理类 (Alarm Management)

```typescript
// 颜色主题：红色系 (#ef4444, #dc2626)
// 设计理念：突出告警的紧急性和重要性

'alarm-count': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c-1.1 0-2 .9-2 2v.17c-2.1.4-3.5 2.24-3.5 4.83v4l-2 2v1h15v-1l-2-2V9c0-2.59-1.4-4.43-3.5-4.83V4c0-1.1-.9-2-2-2zm-1 17h2c0 1.1-.9 2-2 2s-2-.9-2-2z"/>
  </svg>',
  description: '实心铃铛图标，突出告警提示功能'
},

'alarm-info': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>',
  description: '信息圆圈图标，表示告警详情信息'
}
```

#### 6.2.2 📡 设备状态类 (Device Status)

```typescript
// 颜色主题：绿色/红色状态指示 (#22c55e, #ef4444)
// 设计理念：通过颜色直观表示设备在线/离线状态

'on-line': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
    <circle cx="12" cy="12" r="3" fill="#4ade80"/>
  </svg>',
  description: '绿色圆点图标，明确表示设备在线状态'
},

'off-line': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
    <circle cx="12" cy="12" r="3" fill="#ef4444"/>
  </svg>',
  description: '红色圆点图标，明确表示设备离线状态'
},

'online-trend': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h2l1 7c0 .55.45 1 1 1s1-.45 1-1l1-7h2v-2H3v2zm11-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4-4h2v6h-2v-6zm-8-4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm0-6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
    <circle cx="12" cy="8" r="2" fill="#22c55e"/>
    <circle cx="18" cy="12" r="1.5" fill="#22c55e"/>
    <circle cx="6" cy="16" r="1.5" fill="#f59e0b"/>
  </svg>',
  description: '多彩趋势图表，显示设备在线率变化趋势'
}
```

#### 6.2.3 💻 系统监控类 (System Monitoring)

```typescript
// 颜色主题：蓝色科技系 (#3b82f6, #06b6d4)
// 设计理念：体现系统性能监控的专业性和技术感

'cpu-usage': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm5 5h6v6H9V9z"/>
    <path d="M7 2h2v3H7V2zm8 0h2v3h-2V2zm-8 17h2v3H7v-3zm8 0h2v3h-2v-3zM2 7h3v2H2V7zm0 6h3v2H2v-2zm17-6h3v2h-3V7zm0 6h3v2h-3v-2z" fill="#3b82f6"/>
  </svg>',
  description: '蓝色CPU芯片图标，清晰表示处理器监控'
},

'memory-usage': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 3h20c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/>
    <rect x="7" y="7" width="2" height="6" fill="#10b981"/>
    <rect x="11" y="8" width="2" height="5" fill="#06b6d4"/>
    <rect x="15" y="6" width="2" height="7" fill="#8b5cf6"/>
    <path d="M8 21h8v2H8v-2z" fill="#6b7280"/>
    <path d="M12 17v4" fill="#6b7280"/>
  </svg>',
  description: '多彩内存条图标，直观显示RAM使用情况'
},

'disk-usage': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H6zm0 18V4h12v16H6z"/>
    <path d="M7 6h10v2H7V6zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" fill="#f59e0b"/>
  </svg>',
  description: '橙色存储文档图标，表示磁盘存储状态'
}
```

#### 6.2.4 📋 数据信息类 (Data Information)

```typescript
// 颜色主题：蓝色信息系 (#06b6d4, #3b82f6)
// 设计理念：突出数据展示和信息传递的功能特性

'news': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    <path d="M4 6h16v2H4V6zm0 4h16v2H4v-2zm0 4h12v2H4v-2z" fill="#06b6d4"/>
  </svg>',
  description: '蓝色新闻列表图标，表示消息信息展示'
},

'reported-data': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h8v-2h-8V9h8V7h-8V5h8V3h-8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2h-8z"/>
    <circle cx="17" cy="8" r="2" fill="#10b981"/>
    <circle cx="19" cy="14" r="1.5" fill="#3b82f6"/>
  </svg>',
  description: '数据报告图标，带彩色数据点表示实时上报'
},

'version': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    <path d="M12 6v6l4 2" fill="#8b5cf6"/>
    <text x="12" y="16" text-anchor="middle" font-size="3" fill="white">v</text>
  </svg>',
  description: '紫色版本标识图标，带"v"标记表示版本信息'
}
```

#### 6.2.5 👥 用户行为类 (User Behavior)

```typescript
// 颜色主题：中性色系 (#6b7280, #374151)
// 设计理念：体现用户操作和行为分析的人性化特征

'access': {
  icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
    <path fill="currentColor" d="M512 384a128 128 0 1 0 0 256 128 128 0 0 0 0-256zm0 320a192 192 0 1 1 0-384 192 192 0 0 1 0 384z"/>
    <path fill="currentColor" d="M512 896a448 448 0 1 1 0-896 448 448 0 0 1 0 896zm0-64a384 384 0 1 0 0-768 384 384 0 0 0 0 768z"/>
  </svg>',
  description: '眼睛视觉图标，表示访问量统计和查看行为'
},

'recently-visited': {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
  </svg>',
  description: '时钟历史图标，表示用户访问记录和历史行为'
}
```

### 6.3 图标使用规范

#### 6.3.1 在组件定义中使用

在 `definition.ts` 文件中添加图标：

```typescript
import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';
import { $t } from '@/locales';

export default {
  type: 'my-component',
  name: $t('widgetLibrary.components.myComponent'),
  description: '组件功能描述',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">...</svg>',
  component,
  category: $t('widgetLibrary.subCategories.category'),
  version: '2.1.0',
  tags: ['标签1', '标签2'],
  permission: '不限'
} as ComponentDefinition;
```

#### 6.3.2 图标优化原则

1. **路径优化**: 简化 SVG 路径，减少文件大小
2. **颜色语义**: 使用语义化颜色增强识别度
   - 绿色 (#22c55e): 正常、成功、在线状态
   - 红色 (#ef4444): 警告、错误、离线状态
   - 蓝色 (#3b82f6): 信息、系统、技术相关
   - 紫色 (#8b5cf6): 特殊功能、版本标识
   - 橙色 (#f59e0b): 存储、资源相关
3. **兼容性**: 确保在深色和浅色主题下都有良好的显示效果
4. **可访问性**: 保证足够的对比度，支持无障碍访问

### 6.4 图标设计流程

#### 6.4.1 设计新图标

1. **需求分析**: 明确组件功能和用户场景
2. **概念设计**: 选择最能代表功能的视觉元素
3. **技术实现**: 使用 SVG 格式，遵循尺寸和颜色规范
4. **测试验证**: 在不同主题和场景下测试显示效果
5. **文档更新**: 在本指南中补充新图标的设计说明

#### 6.4.2 图标审核标准

- [ ] 尺寸符合 20x20 规范
- [ ] 使用 SVG 格式且路径优化
- [ ] 颜色符合语义化要求
- [ ] 在浅色/深色主题下显示正常
- [ ] 功能语义明确，易于理解
- [ ] 与现有图标风格保持一致

通过统一的图标设计规范，Card 2.1 系统能够为用户提供更加直观、一致的视觉体验，大大提升组件库的易用性和专业性。
