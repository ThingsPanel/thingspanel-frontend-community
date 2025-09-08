# Access 组件迁移指南 (Card 2.1)

## 📋 组件概述

### 基本信息
- **组件ID**: `access-num`
- **组件名称**: 设备总数统计卡片
- **文件路径**: `src/card/builtin-card/access/`
- **组件类型**: 渐变背景统计卡片
- **当前状态**: ⛔️ **待迁移**

### 功能描述
展示系统中设备总数的统计信息，支持根据用户权限显示不同的数据范围。使用渐变背景和动画数字展示，提供直观的数据可视化。

## 🔄 迁移建议

### 迁移策略: 合并重构
**建议将 `access` 组件与其他8个相似的统计卡片合并为一个基于 Card 2.1 架构的通用组件 `StatisticCard`。**

#### 原因分析
1.  **代码重复率 > 90%**: `access`, `cpu-usage`, `disk-usage` 等组件的结构、样式和逻辑几乎完全相同。
2.  **维护成本高**: 任何微小的修改都需要同步到多个文件中，费时且容易出错。
3.  **一致性差**: 不同组件之间可能存在细微的实现差异，导致体验不一致。
4.  **扩展性弱**: 旧架构难以适应新的需求，如主题切换、更丰富的交互等。

#### 合并方案
创建一个通用的 `StatisticCard` 组件，其外观和数据源完全由**配置**驱动。旧的 `access` 组件将成为该通用组件的一个**预设 (Preset)**。

## 🚀 具体迁移步骤

### Phase 1: 创建通用 `StatisticCard` 组件

遵循 Card 2.1 最新的**三文件架构**标准，在 `src/card2.1/components/` 目录下创建 `statistic-card` 文件夹。

```
statistic-card/
├── index.vue          # 主组件 - 负责UI渲染和用户交互
├── definition.ts      # 系统集成层 - 注册组件、定义元数据和交互
└── settingConfig.ts   # 配置定义层 - 定义组件所有可配置属性
```

---

#### 1.1 `definition.ts` (系统集成层)

此文件定义了组件的元数据、交互能力，并将其注册到系统中。

```typescript
// src/card2.1/components/statistic-card/definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'
import StatisticCardComponent from './index.vue'
import { statisticCardSettingConfig } from './settingConfig'
import { componentRegistry } from '@/card2.1/core/component-registry'

const statisticCardDefinition: ComponentDefinition = {
  // 基础信息
  type: 'statistic-card',
  name: '通用统计卡片',
  description: '一个通用的、可配置的统计数值显示卡片',
  category: '数据展示',
  icon: 'ant-design:fund-projection-screen-outlined',
  version: '2.1.0',
  author: 'ThingsPanel',

  // 组件实现
  component: StatisticCardComponent,

  // 默认配置
  config: statisticCardSettingConfig.customConfig,

  // 交互能力声明
  interactionCapability: {
    // 定义组件可以触发的事件
    emits: [
      {
        name: 'click',
        description: '点击卡片时触发'
      }
    ],
    // 定义组件可以响应的动作
    actions: [
      {
        name: 'updateValue',
        description: '更新统计数值',
        params: [{ name: 'value', type: 'number', description: '新的统计值' }]
      }
    ]
  },

  // 标签
  tags: ['statistic', 'data', 'card'],

  // 权限控制
  permission: '不限',
  
  // 默认布局
  defaultLayout: {
    w: 3,
    h: 2,
    minH: 2,
    minW: 2
  }
}

// 注册组件
componentRegistry.registerComponent(statisticCardDefinition, statisticCardSettingConfig)
export default statisticCardDefinition
```

---

#### 1.2 `settingConfig.ts` (配置定义层)

这是新架构的核心，它定义了所有可配置的选项。系统会根据此文件自动生成配置表单。

```typescript
// src/card2.1/components/statistic-card/settingConfig.ts
import type { ComponentSettingConfig, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

/**
 * StatisticCard 组件特有的 `customize` 类型
 */
export interface StatisticCardCustomize {
  title: string
  value: number // 新增：直接配置的统计数值
  icon: string
  unit: string
  animationDuration: number
  gradientColors: [string, string]
}

/**
 * StatisticCard 组件设置配置
 */
export const statisticCardSettingConfig: ComponentSettingConfig<StatisticCardCustomize> = {
  componentType: 'statistic-card',

  // 设置项定义
  settings: [
    createSetting(SettingControlType.INPUT, '标题', 'customize.title', {
      group: '内容设置',
      placeholder: '请输入卡片标题',
      defaultValue: '统计数据'
    }),
    createSetting(SettingControlType.NUMBER_INPUT, '数值', 'customize.value', {
      group: '内容设置',
      defaultValue: 2024
    }),
    createSetting(SettingControlType.ICON_PICKER, '图标', 'customize.icon', {
      group: '内容设置',
      defaultValue: 'ant-design:bar-chart-outlined'
    }),
    createSetting(SettingControlType.INPUT, '单位', 'customize.unit', {
      group: '内容设置',
      placeholder: '例如: %、个',
      defaultValue: ''
    }),
    createSetting(SettingControlType.COLOR_PAIR, '渐变颜色', 'customize.gradientColors', {
      group: '样式设置',
      defaultValue: ['#3b82f6', '#1d4ed8']
    }),
    createSetting(SettingControlType.NUMBER_INPUT, '动画时长 (ms)', 'customize.animationDuration', {
      group: '高级设置',
      defaultValue: 2000,
      props: {
        step: 100
      }
    })
  ],

  // 默认自定义配置
  customConfig: createCustomConfig<StatisticCardCustomize>('statistic-card', {
    title: '统计数据',
    value: 2024,
    icon: 'ant-design:bar-chart-outlined',
    unit: '',
    animationDuration: 2000,
    gradientColors: ['#3b82f6', '#1d4ed8']
  })
}

export type StatisticCardConfig = CustomConfig<StatisticCardCustomize>
```

---

#### 1.3 `index.vue` (主组件)

组件的 UI 和核心逻辑。它只接收 `customConfig` 作为 prop，代表组件的所有配置。

```vue
<!-- src/card2.1/components/statistic-card/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GradientBg } from '@/components/common/gradient-bg'
import { CountTo } from '@/components/custom/count-to'
import SvgIcon from '@/components/custom/svg-icon'
import type { StatisticCardCustomize } from './settingConfig'

interface Props {
  customConfig: StatisticCardCustomize
}

const props = defineProps<Props>()
const { t } = useI18n()

// 从配置中获取所有显示属性
const config = computed(() => props.customConfig)

// 动态标题，支持国际化
const displayTitle = computed(() => {
  const titleKey = config.value.title
  // 如果标题是国际化 key，则进行翻译
  return titleKey.includes('.') ? t(titleKey) : titleKey
})
</script>

<template>
  <GradientBg
    class="statistic-card"
    :start-color="config.gradientColors[0]"
    :end-color="config.gradientColors[1]"
  >
    <h3 class="text-base font-medium mb-4 text-white/90">
      {{ displayTitle }}
    </h3>
    
    <div class="flex justify-between items-center">
      <SvgIcon 
        :icon="config.icon" 
        class="text-3xl text-white/80" 
      />
      
      <div class="text-right">
        <CountTo
          :start-value="0"
          :end-value="config.value"
          :duration="config.animationDuration"
          :suffix="config.unit"
          class="text-2xl font-bold text-white"
        />
      </div>
    </div>
  </GradientBg>
</template>

<style scoped>
.statistic-card {
  width: 100%;
  height: 100%;
  padding: 16px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
```

### Phase 2: 创建预设 (Preset)

这个预设文件将 `StatisticCard` 组件与特定的配置（如标题、颜色）组合在一起，从而复现旧 `access` 组件的功能。由于不需要数据源，此步骤被大大简化。

```typescript
// src/card2.1/presets/access-statistics.ts
import type { ComponentPreset } from '@/card2.1/types/preset'

export const accessStatisticsPreset: ComponentPreset = {
  id: 'access-statistics-preset',
  name: '设备总数统计',
  description: '显示系统当前设备总数。',
  
  // 绑定的组件类型
  componentType: 'statistic-card',
  
  // 组件的具体配置
  config: {
    customize: {
      title: 'card.deviceTotal', // 使用国际化 key
      value: 1024, // 默认或示例值
      icon: 'ant-design:bar-chart-outlined',
      gradientColors: ['#ec4786', '#b955a4'],
      unit: '台',
      animationDuration: 2000
    }
  }
  // 注意：此处没有 dataBinding，因为我们不使用外部数据源
}
```

### Phase 3: 注册与集成

最后，在 Card 2.1 系统中注册新的组件和预设。

```typescript
// src/card2.1/index.ts

// 1. 导入所有模块
import statisticCardModule from './components/statistic-card' // 假设三文件架构下，目录默认导出 definition
import { accessStatisticsPreset } from './presets/access-statistics'

// 2. 注册组件
// componentRegistry.register(statisticCardModule.definition, statisticCardModule.settingConfig)
// 注意：注册逻辑已在 definition.ts 文件内部完成，此处通常只需要确保文件被加载即可。
// 在实际项目中，可能会有一个机制自动加载所有组件定义文件。

// 3. 注册预设
export const card2Presets = [
  accessStatisticsPreset,
  // ... 其他预设
]
```

## ✅ 迁移验证

### 功能验证清单
- [ ] **数据显示**: 设备总数能根据配置正确显示，并带有动画效果。
- [ ] **样式还原**: 渐变背景、布局与原组件一致。
- [ ] **响应式**: 在不同屏幕尺寸下正常显示。
- [ ] **主题适配**: 支持明暗主题切换（通过CSS变量）。
- [ ] **国际化**: 标题能正确进行中英文切换。
- [ ] **可配置性**: 在仪表盘编辑模式下，可以打开设置面板并修改所有已定义的配置项（包括标题、数值、颜色等）。
- [ ] **交互测试**: （如果配置了）点击卡片是否能触发 `click` 事件。

## 📚 相关资源

### 需要同步迁移的组件
以下组件可以使用相同的 `StatisticCard` 通用组件和迁移方案，只需为它们创建各自的**数据源**和**预设**即可：
- `cpu-usage` - CPU使用率
- `disk-usage` - 磁盘使用率  
- `memory-usage` - 内存使用率
- `on-line` - 在线设备数
- `off-line` - 离线设备数
- `alarm-count` - 告警数量
- `tenant-count` - 租户数量

### 参考文档
- [Card 2.1 开发指南 (修正版)](../../../card2.1/docs/DEVELOPMENT_GUIDE_CORRECTED.md)

## 🎯 预期收益

- **代码质量提升**: 完整的TypeScript类型定义，统一的错误处理和降级方案。
- **维护效率提升**: **9个组件合并为1个通用组件** + 9个数据源 + 9个预设配置文件，代码复用率最大化。
- **用户体验提升**: 所有统计卡片具有统一的交互和视觉体验，并支持更丰富的个性化配置。