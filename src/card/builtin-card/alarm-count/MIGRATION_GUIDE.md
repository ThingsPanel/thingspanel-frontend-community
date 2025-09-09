# Alarm Count 组件迁移指南

## 📋 组件概述

- **组件ID**: `alarm-count`
- **组件名称**: 告警数量统计卡片
- **功能描述**: 展示系统告警设备总数的统计信息。

## 🔄 迁移建议

### 迁移策略: 合并为通用 `StatisticCard` 组件的预设

**核心思路**: 不再为 `alarm-count` 维护一个独立的组件，而是将其作为通用 `StatisticCard` 组件的一个“预设” (Preset)。这种方法可以消除超过95%的代码重复，并统一维护。

**迁移优势**:
1.  **代码复用**: 完全复用 `StatisticCard` 的三文件架构，无需编写新组件。
2.  **统一维护**: `StatisticCard` 的任何功能升级（如交互能力增强）都会自动应用到此卡片。
3.  **配置驱动**: 仅通过一个预设文件即可定义 `alarm-count` 的所有特性（标题、图标、颜色、默认值）。

## 🚀 具体迁移步骤

### Phase 1: 复用通用 `StatisticCard` 组件

本次迁移不涉及创建新组件，我们将直接复用已按“三文件架构”标准创建的 `StatisticCard` 组件。其结构如下：

```
statistic-card/
├── index.vue          # 统一的UI渲染层
├── definition.ts      # 统一的系统集成层 (含交互定义)
└── settingConfig.ts   # 统一的配置定义层
```

### Phase 2: 创建 `alarm-count` 预设 (Preset)

这是迁移的核心。我们将创建一个预设文件，用于定义告警统计卡片的外观和行为。

```typescript
// src/card2.1/presets/alarm-count-preset.ts
import type { ComponentPreset } from '@/card2.1/types/preset'

export const alarmCountPreset: ComponentPreset = {
  id: 'alarm-count-preset',
  name: '告警数量统计',
  description: '显示系统当前的告警设备总数。',
  
  // 关键：绑定到通用的 statistic-card 组件
  componentType: 'statistic-card',
  
  // 组件的具体配置
  config: {
    customize: {
      title: 'card.alarmCount', // 使用国际化 key
      value: 5, // 默认或示例值
      icon: 'ant-design:bell-outlined',
      // 使用橙红色渐变，突出告警的警示意味
      gradientColors: ['#f97316', '#ef4444'],
      unit: '个',
      animationDuration: 1500
    }
  }
  // 注意：此处没有 dataBinding，数据由配置或交互提供。
}
```

### Phase 3: 注册预设

最后，在 Card 2.1 系统的入口文件中注册我们新创建的预设。

```typescript
// src/card2.1/index.ts

// 1. 导入预设
import { alarmCountPreset } from './presets/alarm-count-preset'
// ... 其他预设

// 2. 注册预设
export const card2Presets = [
  alarmCountPreset,
  // ... 其他预设
]
```

## ✅ 迁移验证

### 功能验证清单
- [ ] **显示正确**: 卡片能正确显示预设中配置的标题、图标、颜色和默认值。
- [ ] **样式还原**: 渐变背景、布局与原 `alarm-count` 组件视觉效果一致。
- [ ] **响应式**: 在不同屏幕尺寸下能正常显示。
- [ ] **主题适配**: 支持明暗主题切换。
- [ ] **国际化**: 标题 `card.alarmCount` 能正确进行中英文切换。
- [ ] **可配置性**: 在仪表盘编辑模式下，所有在 `StatisticCard` 中定义的配置项（如标题、数值、颜色等）均可修改。
- [ ] **交互测试**: `StatisticCard` 定义的交互能力（如点击事件）在此卡片上同样生效。

## 🎯 预期收益

- **技术提升**: 告警统计功能与项目最新的“三文件架构”保持一致，代码大幅简化。
- **功能增强**: 自动继承 `StatisticCard` 的所有基础能力和未来的功能迭代。
- **维护简化**: 无需再维护独立的 `alarm-count` 组件代码，只需管理一个轻量级的预设文件。