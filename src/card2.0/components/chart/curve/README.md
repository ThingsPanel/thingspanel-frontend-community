# Card 2.0 曲线图组件

## 概述

曲线图组件是 Card 2.0 架构下的高级图表组件，专门用于展示时间序列数据的趋势变化。该组件基于 ECharts 构建，提供了丰富的配置选项和强大的数据处理能力。

## 组件信息

- **组件ID**: `chart-curve-v2`
- **版本**: `2.0.0`
- **分类**: `chart`
- **兼容性**: 兼容旧版本 `chart-curve`，支持自动迁移

## 主要特性

### 数据源支持
- 设备遥测数据
- 实时数据流
- 历史数据查询
- 多设备数据聚合

### 时间功能
- 灵活的时间范围选择（1小时到30天）
- 自定义时间范围
- 时间选择器界面
- 实时数据更新

### 数据聚合
- 多种聚合函数（平均值、最大值、最小值、求和、计数）
- 可配置聚合窗口
- 聚合选择器界面
- 性能优化的数据处理

### 主题配置
- 多套预设配色方案
- 自定义颜色支持
- 渐变色彩效果
- 自适应主题模式

### 图表功能
- 平滑曲线显示
- 数据点标记
- 面积填充效果
- 可调节线条宽度
- 数据缩放功能
- 图例和提示框
- 坐标轴自定义

## 文件结构

```
curve/
├── index.ts              # 组件定义和配置
├── component.vue         # Vue 视图组件
├── config.vue           # 配置界面
├── theme.ts             # 主题配置
├── poster.png           # 组件缩略图
├── README.md            # 说明文档
└── modules/
    └── line-chart.vue   # 核心图表实现
```

## 配置选项

### 图表设置
- `showLegend`: 显示图例
- `enableDataZoom`: 启用数据缩放
- `showTooltip`: 显示提示框
- `smooth`: 平滑曲线
- `showDataPoints`: 显示数据点
- `dataPointSize`: 数据点大小
- `lineWidth`: 线条宽度
- `showArea`: 显示面积

### 时间范围
- `defaultRange`: 默认时间范围
- `customTimeRange`: 自定义时间范围
- `showTimeSelector`: 显示时间选择器

### 数据聚合
- `enabled`: 启用数据聚合
- `defaultFunction`: 默认聚合函数
- `defaultWindow`: 默认聚合窗口
- `showAggregationSelector`: 显示聚合选择器

### 主题设置
- `colorScheme`: 配色方案
- `customColors`: 自定义颜色
- `adaptiveTheme`: 自适应主题

### 坐标轴
- `showXAxis`: 显示X轴
- `showYAxis`: 显示Y轴
- `xAxisType`: X轴类型
- `yAxisType`: Y轴类型

### 网格设置
- `left/right/top/bottom`: 边距设置
- `containLabel`: 包含标签

### 性能设置
- `maxDataPoints`: 最大数据点数
- `updateThrottle`: 更新节流
- `dataSampling`: 数据采样

## 使用示例

### 基础用法

```typescript
import { card2 } from '@/card2.0'

// 创建曲线图实例
const curveChart = card2.createInstance('chart-curve-v2', {
  title: '温度趋势',
  chart: {
    showLegend: true,
    smooth: true,
    showDataPoints: true
  },
  timeRange: {
    defaultRange: '24h',
    showTimeSelector: true
  },
  theme: {
    colorScheme: 0,
    adaptiveTheme: true
  }
})

// 渲染到容器
card2.renderComponent(
  'chart-curve-v2',
  document.getElementById('chart-container'),
  config,
  data
)
```

### 高级配置

```typescript
const advancedConfig = {
  title: '多设备数据监控',
  chart: {
    showLegend: true,
    enableDataZoom: true,
    smooth: true,
    showArea: true,
    lineWidth: 3
  },
  dataAggregation: {
    enabled: true,
    defaultFunction: 'avg',
    defaultWindow: '5m',
    showAggregationSelector: true
  },
  theme: {
    colorScheme: 1,
    customColors: [
      '#667eea',
      '#f093fb',
      '#4facfe',
      '#43e97b'
    ]
  },
  performance: {
    maxDataPoints: 1000,
    updateThrottle: 500
  }
}
```

## 迁移说明

### 从旧版本迁移

旧版本组件 (`chart-curve`) 会自动迁移到新版本，主要变化：

1. **配置结构调整**: 配置项重新组织，更加清晰
2. **新增功能**: 数据聚合、主题配置、性能优化
3. **API变化**: 使用新的 Card 2.0 API

### 属性映射

```typescript
// 旧版本 -> 新版本
{
  // 基础配置保持兼容
  title: config.title,
  
  // 图表配置迁移
  chart: {
    showLegend: config.showLegend,
    smooth: config.smooth,
    // 新增配置使用默认值
  },
  
  // 新增配置项
  dataAggregation: { enabled: false },
  theme: { colorScheme: 0, adaptiveTheme: true }
}
```

## 依赖项

- `echarts`: 图表渲染引擎
- `naive-ui`: UI 组件库
- `vue`: Vue 3 框架
- `@/service/api/device`: 设备数据服务

## 开发说明

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 类型检查
npm run type-check
```

### 扩展开发

1. **自定义主题**: 在 `theme.ts` 中添加新的颜色组
2. **新增聚合函数**: 扩展 `aggregationOptions` 配置
3. **性能优化**: 调整 `performance` 相关配置
4. **UI定制**: 修改 `config.vue` 中的配置界面

## 注意事项

1. **性能考虑**: 大量数据时建议启用数据采样
2. **内存管理**: 组件销毁时会自动清理资源
3. **浏览器兼容**: 支持现代浏览器，IE需要polyfill
4. **数据格式**: 确保数据包含时间戳字段

## 更新日志

### v2.0.0
- 基于 Card 2.0 架构重构
- 新增数据聚合功能
- 新增主题配置系统
- 性能优化和内存管理改进
- 支持旧版本自动迁移