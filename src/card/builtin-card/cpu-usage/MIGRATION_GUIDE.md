# CPU Usage 组件迁移指南 (Card 2.1)

## 1. 迁移概述

### 1.1. 问题分析

当前代码库中的 `cpu-usage`, `memory-usage`, 和 `disk-usage` 三个组件存在以下核心问题：

- **高度代码重复**: 三个组件的逻辑、结构和样式几乎完全相同，只有数据字段、图标和颜色等少量差异。
- **维护成本高**: 任何一个组件的逻辑变更（如修复 Bug 或增加功能）都需要在其他两个组件中同步修改，费时且容易出错。
- **功能扩展性差**: 现有架构难以统一添加新功能，如阈值告警、趋势图等。
- **不符合 Card 2.1 规范**: 未遵循最新的“三文件结构”（`definition.ts`, `settingConfig.ts`, `index.vue`），导致与新版卡片系统集成困难。

### 1.2. 迁移目标

本次迁移旨在解决上述问题，实现以下目标：

- **组件合并**: 将三个独立的组件重构为一个统一、通用的 `SystemMonitor` 组件。
- **配置驱动**: 通过 `props` 和配置项来区分不同的监控指标（CPU、内存、磁盘）。
- **符合 Card 2.1 规范**: 完全遵循“三文件结构”，实现标准化和模块化。
- **增强功能**: 在新组件中统一实现阈值告警、动态颜色、加载/错误状态等高级功能。
- **提升可维护性**: 大幅减少重复代码，简化未来的功能迭代和维护工作。

## 2. 迁移策略：重构为 `SystemMonitor` 组件

我们将创建一个全新的、符合 Card 2.1 规范的 `SystemMonitor` 组件，该组件将作为承载所有系统指标（CPU、内存、磁盘）的通用容器。旧的 `cpu-usage` 组件将被废弃，其功能由 `SystemMonitor` 组件通过特定配置实现。

## 3. 新组件设计 (`SystemMonitor`)

新的 `SystemMonitor` 组件将遵循 Card 2.1 的“三文件结构”标准。

### 3.1. `settingConfig.ts` - 配置定义

此文件定义了组件的可配置项，允许用户在仪表盘编辑时自定义卡片行为。

```typescript
// src/card2.1/components/system-monitor/settingConfig.ts

import type { CardSettingConfig } from '@/card2.1/core/types/config';

/**
 * @description 定义了 SystemMonitor 组件的自定义配置项
 * @property {string} metricType - 监控指标类型 ('cpu', 'memory', 'disk')
 * @property {string} title - 卡片标题
 * @property {string} icon - 显示的图标
 * @property {number} precision - 数值精度（保留小数位数）
 * @property {object} colors - 颜色配置
 * @property {string[]} colors.gradient - 正常状态下的渐变色
 * @property {object} warningThreshold - 告警阈值
 * @property {number} warningThreshold.warning - 警告阈值
 * @property {number} warningThreshold.critical - 严重告警阈值
 */
export interface SystemMonitorCustomize {
  metricType: 'cpu' | 'memory' | 'disk';
  title: string;
  icon: string;
  precision: number;
  colors: {
    gradient: [string, string];
  };
  warningThreshold: {
    warning: number;
    critical: number;
  };
}

/**
 * @description SystemMonitor 组件的设置配置
 * - 用于在仪表盘编辑界面生成配置表单
 */
export const systemMonitorSettingConfig: CardSettingConfig<SystemMonitorCustomize> = {
  // 配置项定义
  items: [
    {
      prop: 'metricType',
      label: '监控指标',
      type: 'select',
      options: [
        { label: 'CPU使用率', value: 'cpu' },
        { label: '内存使用率', value: 'memory' },
        { label: '磁盘使用率', value: 'disk' },
      ],
    },
    {
      prop: 'title',
      label: '卡片标题',
      type: 'text',
    },
    {
      prop: 'icon',
      label: '显示图标',
      type: 'icon-select',
    },
    // ... 其他配置项，如颜色、阈值等
  ],
  // 默认值
  defaultValue: {
    metricType: 'cpu',
    title: 'CPU使用率',
    icon: 'fa-microchip',
    precision: 1,
    colors: {
      gradient: ['#4ade80', '#22c55e'], // 默认绿色
    },
    warningThreshold: {
      warning: 75,
      critical: 90,
    },
  },
};
```

### 3.2. `definition.ts` - 组件定义

此文件定义了组件的元数据、数据源、默认配置等，用于系统集成。

```typescript
// src/card2.1/components/system-monitor/definition.ts

import type { CardDefinition } from '@/card2.1/core/types/card';
import { systemMonitorSettingConfig } from './settingConfig';
import { getSystemMetricsCurrent } from '@/service/api/system-data';

/**
 * @description SystemMonitor 组件的定义
 * - 包含了组件的元数据、数据源、默认配置等
 */
export const systemMonitorDefinition: CardDefinition = {
  // 组件唯一标识
  id: 'SystemMonitor',
  // 组件名称
  name: '系统性能监控',
  // 组件描述
  description: '用于显示CPU、内存、磁盘等系统性能指标',
  // 关联的设置配置
  settingConfig: systemMonitorSettingConfig,
  // 数据源配置
  dataSource: {
    // 定义数据获取函数
    request: async () => {
      const res = await getSystemMetricsCurrent();
      return res.data;
    },
    // 自动刷新配置
    autoRefresh: {
      interval: 30 * 1000, // 30秒刷新一次
    },
  },
  // 默认布局
  defaultLayout: {
    w: 3,
    h: 2,
  },
};
```

### 3.3. `index.vue` - UI 渲染

此文件负责组件的 UI 渲染和交互逻辑。

```vue
// src/card2.1/components/system-monitor/index.vue

<script setup lang="ts">
import { computed } from 'vue';
import { GradientBg } from './components'; // 渐变背景组件
import type { SystemMonitorCustomize } from './settingConfig';

// 定义 props
const props = defineProps<{
  // 自定义配置
  customize: SystemMonitorCustomize;
  // 从数据源获取的数据
  dataSource: {
    cpu_usage?: number;
    memory_usage?: number;
    disk_usage?: number;
  };
  // 加载和错误状态
  loading: boolean;
  error: Error | null;
}>();

// 根据指标类型获取对应的数值
const metricValue = computed(() => {
  const data = props.dataSource || {};
  switch (props.customize.metricType) {
    case 'cpu':
      return data.cpu_usage;
    case 'memory':
      return data.memory_usage;
    case 'disk':
      return data.disk_usage;
    default:
      return null;
  }
});

// 根据阈值计算当前状态（normal, warning, critical）
const status = computed(() => {
  if (metricValue.value === null || metricValue.value === undefined) return 'normal';
  const { warning, critical } = props.customize.warningThreshold;
  if (metricValue.value >= critical) return 'critical';
  if (metricValue.value >= warning) return 'warning';
  return 'normal';
});

// 根据状态动态计算渐变颜色
const gradientColors = computed(() => {
  const colorMap = {
    critical: ['#dc2626', '#991b1b'], // 红色
    warning: ['#f97316', '#ea580c'],  // 橙色
    normal: props.customize.colors.gradient, // 默认色
  };
  return colorMap[status.value];
});
</script>

<template>
  <GradientBg :start-color="gradientColors[0]" :end-color="gradientColors[1]">
    <h3 class="text-16px">{{ $t(props.customize.title) }}</h3>
    <div class="flex justify-between items-center pt-30px">
      <SvgIcon :icon="props.customize.icon" class="text-32px" />
      <div class="flex flex-col items-end">
        <template v-if="props.loading">
          <span>{{ $t('card.loading') }}</span>
        </template>
        <template v-else-if="props.error || metricValue === null">
          <span>{{ $t('card.noData') }}</span>
        </template>
        <template v-else>
          <CountTo
            :start-value="0"
            :end-value="metricValue"
            :suffix="'%'"
            :precision="props.customize.precision"
            class="text-30px"
          />
        </template>
      </div>
    </div>
  </GradientBg>
</template>
```

## 4. 迁移步骤

1.  **创建新组件**: 在 `src/card2.1/components/` 目录下创建 `system-monitor` 文件夹。
2.  **实现三文件**: 在 `system-monitor` 文件夹中，分别创建并实现 `settingConfig.ts`, `definition.ts`, 和 `index.vue`，代码如上所示。
3.  **注册组件**: 在 Card 2.1 的组件注册入口（通常是 `src/card2.1/index.ts` 或类似文件）中，导入并注册 `systemMonitorDefinition`。
4.  **更新仪表盘**:
    - 进入仪表盘编辑模式。
    - 删除旧的 `cpu-usage`, `memory-usage`, `disk-usage` 卡片。
    - 添加新的 `SystemMonitor` 卡片。
    - 在卡片设置中，通过 `metricType` 配置项分别选择“CPU使用率”、“内存使用率”和“磁盘使用率”，以创建三个不同的监控实例。
5.  **删除旧代码**: 在确认新组件工作正常后，安全地删除 `src/card/builtin-card/` 目录下的 `cpu-usage`, `memory-usage`, 和 `disk-usage` 三个组件的全部文件。

## 5. 迁移验证清单

- [ ] **功能验证**:
    - [ ] 新的 `SystemMonitor` 卡片能够正确获取并显示 CPU、内存、磁盘的使用率。
    - [ ] 数据能够按照 30 秒的间隔自动刷新。
    - [ ] 加载中（Loading）和无数据（No Data）状态能够正确显示。
- [ ] **配置验证**:
    - [ ] 在仪表盘编辑模式下，可以成功修改卡片标题、图标等配置。
    - [ ] `metricType` 切换后，卡片能正确显示对应的数据。
- [ ] **告警验证**:
    - [ ] 当数值超过 `warning` 阈值时，卡片背景色变为橙色。
    - [ ] 当数值超过 `critical` 阈值时，卡片背景色变为红色。
- [ ] **代码清理**:
    - [ ] 旧的三个组件目录已完全删除。

## 6. 预期收益

- **代码复用**: 代码量大幅减少，逻辑高度集中，移除了近乎 90% 的重复代码。
- **维护高效**: 未来的任何修改只需在 `SystemMonitor` 一个组件中进行，即可同步应用到所有系统监控卡片。
- **功能强大**: 统一实现了动态颜色告警，为未来增加趋势图、点击交互等功能打下了坚实基础。
- **架构统一**: 完全融入 Card 2.1 体系，享受新架构带来的开发便利和性能优势。