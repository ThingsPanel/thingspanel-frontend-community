# 柱状图组件 (Bar Chart)

## 概述

这是从 `src/card/chart-card/bar` 迁移到 Card 2.0 架构的柱状图组件。该组件支持多设备数据展示、时间聚合、实时数据更新等功能。

## 组件信息

- **组件ID**: `card2-bar-chart`
- **版本**: 2.0.0
- **分类**: chart
- **兼容性**: 兼容原 `chart-bar` 组件

## 主要特性

### 数据源支持
- 设备遥测数据
- API 数据源
- 静态数据
- 实时数据更新

### 时间功能
- 多种预设时间范围（15分钟到30天）
- 自定义时间范围选择
- 时间序列数据展示

### 数据聚合
- 支持多种聚合函数（平均值、最大值、求和、差值）
- 多种聚合窗口（30秒到1月）
- 动态聚合配置

### 主题配置
- 两套内置配色方案
- 自定义颜色支持
- 自适应主题模式
- 渐变色彩效果

### 图表功能
- ECharts 驱动的高性能渲染
- 数据缩放和平移
- 交互式图例
- 堆叠柱状图
- 平滑动画效果

## 文件结构

```
bar/
├── index.ts          # 组件定义文件
├── component.vue     # 主组件视图
├── config.vue        # 配置界面
├── theme.ts          # 主题配置
├── poster.png        # 组件缩略图
├── modules/
│   └── bar-chart.vue # 核心图表实现
└── README.md         # 说明文档
```

## 配置选项

### 图表设置
- `showLegend`: 显示图例
- `showDataZoom`: 显示数据缩放
- `showTooltip`: 显示提示框
- `stack`: 堆叠显示
- `smooth`: 平滑曲线
- `barWidth`: 柱子宽度

### 时间范围
- `defaultRange`: 默认时间范围
- `allowCustomRange`: 允许自定义时间范围
- `showTimeSelector`: 显示时间选择器

### 数据聚合
- `enabled`: 启用聚合
- `defaultFunction`: 默认聚合函数
- `defaultWindow`: 默认聚合窗口
- `showAggregateSelector`: 显示聚合选择器

### 主题设置
- `colorScheme`: 配色方案
- `customColors`: 自定义颜色
- `adaptiveTheme`: 自适应主题

### 坐标轴设置
- `showXAxis`: 显示X轴
- `showYAxis`: 显示Y轴
- `xAxisType`: X轴类型
- `yAxisType`: Y轴类型

### 网格设置
- `left`: 左边距
- `right`: 右边距
- `bottom`: 下边距
- `containLabel`: 包含标签

### 性能设置
- `maxDataPoints`: 最大数据点数
- `updateThrottle`: 更新节流
- `enableSampling`: 启用数据采样

## 使用示例

```typescript
import { card2 } from '@/card2.0'

// 初始化 Card 2.0
await card2.initialize()

// 渲染柱状图组件
await card2.renderComponent(
  'card2-bar-chart',
  document.getElementById('chart-container'),
  {
    chart: {
      showLegend: true,
      showDataZoom: true,
      barWidth: 40
    },
    timeRange: {
      defaultRange: '1h'
    },
    theme: {
      colorScheme: 'colorGroups'
    }
  },
  // 可选的初始数据
  []
)
```

## 迁移说明

### 从旧版本迁移

原组件ID `chart-bar` 会自动映射到新的 `card2-bar-chart`。主要变化：

1. **配置结构调整**: 配置项重新组织，更加清晰
2. **主题系统**: 新增主题配置，支持更灵活的颜色定制
3. **性能优化**: 新增性能相关配置选项
4. **类型安全**: 完整的 TypeScript 类型定义

### 属性映射

- `card.config.colorGroups` → `theme.colorScheme`
- `card.config.selectedTheme` → `theme.colorScheme`

## 依赖项

- Vue 3.0+
- ECharts 5.0+
- Naive UI
- date-fns
- lodash-es
- uuid

## 开发说明

### 本地开发

1. 确保安装了所有依赖项
2. 组件支持热重载
3. 使用 TypeScript 进行类型检查

### 测试

组件包含完整的错误处理和日志记录，便于调试和监控。

### 扩展

可以通过修改 `theme.ts` 添加新的配色方案，或在 `config.vue` 中添加新的配置选项。