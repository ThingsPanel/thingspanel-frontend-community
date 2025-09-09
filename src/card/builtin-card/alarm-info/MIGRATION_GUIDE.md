# Alarm Info 组件迁移指南

## 📋 组件概述

- **组件ID**: `alarm-info`
- **组件名称**: 告警信息列表
- **文件路径**: `src/card/builtin-card/alarm-info/`
- **组件类型**: 静态信息展示
- **当前状态**: ⚠️ 逻辑耦合，不易维护

### 功能描述
该组件用于展示一个静态的告警信息列表。与旧版不同，新版将彻底移除后端数据源依赖，所有告警条目均通过前端静态配置生成，适用于展示固定的示例信息或说明。

## ❌ 存在问题

1.  **硬编码内容**: 旧组件内容完全硬编码在 Vue 文件中，无法通过UI进行任何修改。
2.  **维护困难**: 代码结构不清晰，不符合 Card 2.1 的开发规范，难以扩展和维护。
3.  **无数据分离**: 视图和数据逻辑混合，违反了现代前端开发原则。
4.  **功能固化**: 无法配置告警数量、内容、图标和颜色。

## 🔄 迁移建议

### 迁移策略: 重构为纯静态配置的独立组件

**核心思想**: 将 `alarm-info` 重构为一个全新的、遵循 Card 2.1 "三文件架构" 的独立组件 `AlarmInfoList`。最关键的改动是 **移除所有数据源（`dataRequirement`）**，将组件内容完全交由静态配置 `config` 管理。

### 优化方向

1.  **完全配置驱动**: 组件的所有可见内容，包括标题、告警条目（图标、颜色、文本、时间）以及列表为空时的提示，都必须通过 `config` 对象进行配置。
2.  **三文件架构**:
    *   `definition.ts`: 定义组件元数据和配置项结构。
    *   `component.vue`: 负责渲染 `config` 提供的数据。
    *   `preset.ts`: 提供一个开箱即用的默认告警列表配置。
3.  **空状态处理**: 当未配置任何告警信息时，组件应能显示一条可配置的提示文本（如 “暂无告警信息”）。
4.  **样式与交互**: 提供基础的样式，并支持设置最大高度以实现内容滚动。

## 🚀 具体迁移步骤

### Phase 1: 创建 `AlarmInfoList` 组件

#### 1.1. 组件定义 (`definition.ts`)

创建 `src/card2.1/components/alarm-info-list/definition.ts` 文件。此文件不包含 `dataRequirement` 字段。

```typescript
// src/card2.1/components/alarm-info-list/definition.ts

import type { ComponentDefinition } from '@/card2.1/core/types'

/**
 * @description 告警条目配置类型
 */
interface AlarmItem {
  icon: string      // 图标，例如 'info-circle-filled'
  color: string     // 图标颜色，例如 '#ff4d4f'
  text: string      // 告警文本
  timestamp: string // 时间戳文本
}

export const alarmInfoListDefinition: ComponentDefinition = {
  type: 'AlarmInfoList',
  name: '告警信息列表',
  description: '一个用于显示静态告警信息的列表组件，所有内容均通过配置生成。',
  category: 'information',

  // 重点：此组件没有 dataRequirement，不依赖任何后端数据源
  
  // 通过 config 定义所有可配置项
  config: {
    title: {
      type: 'string',
      label: '卡片标题',
      default: '告警信息',
    },
    alarmItems: {
      type: 'array',
      label: '告警条目',
      description: '配置要显示的告警信息列表',
      itemType: 'object',
      default: [], // 默认为空数组
      properties: {
        icon: { type: 'string', label: '图标', default: 'info-circle-filled' },
        color: { type: 'string', label: '图标颜色', default: '#ff4d4f' },
        text: { type: 'string', label: '告警文本', default: '默认告警文本' },
        timestamp: { type: 'string', label: '时间戳', default: '2023-01-01 10:00:00' },
      },
    },
    emptyText: {
      type: 'string',
      label: '空状态文本',
      default: '暂无告警信息',
      description: '当告警条目为空时显示的提示文字',
    },
    maxHeight: {
        type: 'number',
        label: '最大高度 (px)',
        default: 300,
        description: '设置列表区域的最大高度，超出部分将出现滚动条',
    }
  },
}
```

#### 1.2. 组件实现 (`component.vue`)

创建 `src/card2.1/components/alarm-info-list/component.vue` 文件。

```vue
<!-- src/card2.1/components/alarm-info-list/component.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// 定义组件的 Props，与 definition.ts 中的 config 结构完全对应
interface AlarmItem {
  icon: string
  color: string
  text: string
  timestamp: string
}
interface Props {
  config: {
    title: string
    alarmItems: AlarmItem[]
    emptyText: string
    maxHeight: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '告警信息',
    alarmItems: [],
    emptyText: '暂无告警信息',
    maxHeight: 300,
  }),
})

const { t } = useI18n()

// 计算属性，判断列表是否为空
const isListEmpty = computed(() => !props.config.alarmItems || props.config.alarmItems.length === 0)

// 列表区域的样式
const listStyle = computed(() => ({
  maxHeight: `${props.config.maxHeight}px`,
  overflowY: 'auto',
}))
</script>

<template>
  <div class="alarm-info-list-card">
    <h3 class="card-title">{{ t(config.title) }}</h3>
    
    <div v-if="isListEmpty" class="empty-state">
      {{ t(config.emptyText) }}
    </div>

    <ul v-else class="alarm-list" :style="listStyle">
      <li v-for="(item, index) in config.alarmItems" :key="index" class="alarm-item">
        <div class="item-icon">
          <n-icon :color="item.color" size="20">
            <!-- 假设你有一个图标组件或方法来渲染图标 -->
            <component :is="item.icon" />
          </n-icon>
        </div>
        <div class="item-content">
          <p class="item-text">{{ t(item.text) }}</p>
          <time class="item-timestamp">{{ item.timestamp }}</time>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.alarm-info-list-card {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-color);
  border-radius: var(--border-radius);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--text-color-1);
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-3);
  font-size: 14px;
}
.alarm-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}
.alarm-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}
.alarm-item:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}
.item-content {
  flex: 1;
}
.item-text {
  margin: 0 0 4px 0;
  color: var(--text-color-2);
  font-size: 14px;
}
.item-timestamp {
  color: var(--text-color-3);
  font-size: 12px;
}
</style>
```

#### 1.3. 创建预设 (`preset.ts`)

创建 `src/card2.1/components/alarm-info-list/preset.ts` 文件，提供默认数据。

```typescript
// src/card2.1/components/alarm-info-list/preset.ts
import type { ComponentPreset } from '@/card2.1/core/types'

export const alarmInfoListPreset: ComponentPreset = {
  id: 'default-alarm-info-list',
  name: '默认告警列表',
  description: '一个包含示例告警信息的静态列表。',
  
  // 预设的配置
  config: {
    title: 'card.alarmInfo.title', // 使用 i18n key
    emptyText: 'card.alarmInfo.emptyText',
    maxHeight: 300,
    alarmItems: [
      {
        icon: 'error-warning-fill',
        color: '#f5222d',
        text: 'card.alarmInfo.items.item1.text',
        timestamp: '2023-10-27 14:30:00',
      },
      {
        icon: 'information-fill',
        color: '#faad14',
        text: 'card.alarmInfo.items.item2.text',
        timestamp: '2023-10-27 11:15:00',
      },
      {
        icon: 'check-circle-fill',
        color: '#52c41a',
        text: 'card.alarmInfo.items.item3.text',
        timestamp: '2023-10-26 18:00:00',
      },
    ],
  },

  // 默认布局
  defaultLayout: {
    w: 4,
    h: 5,
  },
}
```

### Phase 2: 注册组件与预设

1.  **注册组件**: 在 `src/card2.1/components/index.ts` 中导入并注册 `alarmInfoListDefinition`。
2.  **注册预设**: 在 `src/card2.1/presets/index.ts` 中导入并注册 `alarmInfoListPreset`。

## ✅ 迁移验证清单

- [ ] **组件渲染**: 使用预设创建卡片，能正确显示标题和3条告警信息。
- [ ] **静态配置**: 在仪表盘编辑模式下，能够成功修改卡片标题。
- [ ] **条目配置**: 能够通过UI增、删、改告警条目，并实时在卡片上看到变化。
- [ ] **空状态验证**: 将 `alarmItems` 数组配置为空，卡片应显示 “暂无告警信息” 或自定义的 `emptyText`。
- [ ] **滚动条验证**: 添加超过 `maxHeight` 高度的告警条目，列表区域应出现垂直滚动条。
- [ ] **国际化**: 标题、空状态文本、告警内容均支持中英文切换。
- [ ] **主题适配**: 组件在明亮和黑暗主题下样式表现正常。

## 🎯 预期收益

1.  **完全解耦**: 组件不再依赖任何后端接口，成为一个纯粹的前端展示单元。
2.  **高度灵活**: 所有内容均可通过仪表盘UI动态配置，无需修改代码。
3.  **易于维护**: 遵循 Card 2.1 的标准架构，代码清晰，职责单一。
4.  **体验一致**: 与 Card 2.1 生态系统中的其他组件保持一致的开发和使用体验。