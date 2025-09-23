# Chart Curve 组件 Card 2.1 迁移配置文档

## 组件概述

**组件ID**: `chart-curve`  
**组件类型**: `chart`  
**组件名称**: 曲线图表  
**功能描述**: 基于 ECharts 的时序数据曲线图表组件，支持多数据源、时间范围选择、数据聚合等功能

## 当前实现分析

### 1. 组件结构
```
curve/
├── index.ts              # 组件定义配置
├── component.vue         # 主组件入口
├── card-config.vue       # 配置表单
├── poster.png           # 组件预览图
├── theme.ts             # 主题配置
└── modules/
    └── line-chart.vue   # 核心图表实现
```

### 2. 核心特性
- **多数据源支持**: 最多支持 9 个数据源
- **时间范围**: 支持时间范围选择和数据聚合
- **交互功能**: 数据缩放、图例控制、工具箱
- **主题系统**: 18 种预设颜色主题
- **实时更新**: 支持设备遥测数据实时更新

### 3. 技术实现
- **图表库**: ECharts + vue-echarts
- **数据处理**: 支持历史数据和实时数据
- **响应式**: 自适应容器大小变化
- **性能优化**: 防抖处理、数据缓存

## Card 2.1 迁移配置

### 1. 组件定义 (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const chartCurveDefinition: ComponentDefinition = {
  // 基础信息
  id: 'chart-curve',
  name: 'chart.curve',
  type: 'chart',
  category: 'visualization',
  
  // 组件配置
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // 布局配置
  layout: {
    defaultSize: { width: 6, height: 5 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 12, height: 12 },
    resizable: true
  },
  
  // 数据源配置
  dataSource: {
    type: 'device',
    multiple: true,
    maxCount: 9,
    required: true,
    supportedTypes: ['telemetry', 'attribute'],
    features: {
      timeRange: true,
      aggregate: true,
      realtime: true
    }
  },
  
  // 配置模式
  configSchema: {
    type: 'object',
    properties: {
      // 图表配置
      chart: {
        type: 'object',
        properties: {
          title: { type: 'string', default: '' },
          showLegend: { type: 'boolean', default: true },
          showDataZoom: { type: 'boolean', default: true },
          showToolbox: { type: 'boolean', default: false }
        }
      },
      
      // 样式配置
      style: {
        type: 'object',
        properties: {
          colorTheme: { 
            type: 'string', 
            enum: ['theme1', 'theme2'],
            default: 'theme1' 
          },
          curveWidth: { 
            type: 'number', 
            minimum: 1, 
            maximum: 5, 
            default: 1 
          },
          smooth: { type: 'boolean', default: true },
          area: { type: 'boolean', default: false }
        }
      },
      
      // 坐标轴配置
      axis: {
        type: 'object',
        properties: {
          xAxis: {
            type: 'object',
            properties: {
              show: { type: 'boolean', default: true },
              name: { type: 'string', default: '' },
              type: { type: 'string', enum: ['time', 'category'], default: 'time' }
            }
          },
          yAxis: {
            type: 'object',
            properties: {
              show: { type: 'boolean', default: true },
              name: { type: 'string', default: '' },
              min: { type: 'number' },
              max: { type: 'number' }
            }
          }
        }
      },
      
      // 数据配置
      data: {
        type: 'object',
        properties: {
          timeRange: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean', default: false },
              range: { type: 'array', items: { type: 'number' } }
            }
          },
          aggregate: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean', default: false },
              method: { 
                type: 'string', 
                enum: ['avg', 'sum', 'max', 'min', 'count'],
                default: 'avg' 
              },
              interval: { type: 'string', default: '1h' }
            }
          }
        }
      }
    }
  }
}
```

### 2. 数据源映射

```typescript
// 原始数据源结构 -> Card 2.1 数据源结构
const dataSourceMapping = {
  // 设备数据源
  deviceSource: {
    type: 'device',
    config: {
      deviceId: 'string',      // 设备ID
      metricKey: 'string',     // 指标键名
      metricName: 'string',    // 指标显示名称
      unit: 'string',          // 单位
      color: 'string'          // 曲线颜色
    }
  },
  
  // 时间范围配置
  timeRange: {
    enabled: 'boolean',        // 是否启用时间范围
    start: 'number',          // 开始时间戳
    end: 'number',            // 结束时间戳
    relative: 'string'        // 相对时间 (如: '1h', '1d', '1w')
  },
  
  // 聚合配置
  aggregate: {
    enabled: 'boolean',       // 是否启用聚合
    method: 'string',         // 聚合方法
    interval: 'string'        // 聚合间隔
  }
}
```

### 3. 实现要点

#### 数据处理流程
```typescript
// 1. 数据获取
const fetchData = async (dataSource: DataSourceConfig) => {
  if (dataSource.timeRange?.enabled) {
    // 获取历史数据
    return await telemetryDataHistoryList({
      deviceId: dataSource.deviceId,
      keys: [dataSource.metricKey],
      startTime: dataSource.timeRange.start,
      endTime: dataSource.timeRange.end,
      aggregate: dataSource.aggregate
    })
  } else {
    // 获取实时数据
    return await telemetryDataCurrentKeys({
      deviceId: dataSource.deviceId,
      keys: [dataSource.metricKey]
    })
  }
}

// 2. 数据转换
const transformData = (rawData: any[], config: ChartConfig) => {
  return rawData.map(item => [
    item.timestamp,
    item.value
  ])
}

// 3. 图表配置生成
const generateChartOption = (data: any[], config: ChartConfig) => {
  return {
    series: data.map((seriesData, index) => ({
      name: config.dataSources[index].metricName,
      type: 'line',
      data: seriesData,
      smooth: config.style.smooth,
      lineStyle: {
        width: config.style.curveWidth,
        color: config.style.colorTheme[index]
      },
      areaStyle: config.style.area ? {} : null
    }))
  }
}
```

#### 主题系统迁移
```typescript
// 主题配置映射
const themeMapping = {
  theme1: colorGroups,    // 原 colorGroups
  theme2: colorGroups2    // 原 colorGroups2
}

// 动态主题应用
const applyTheme = (themeName: string, seriesCount: number) => {
  const theme = themeMapping[themeName]
  return theme.slice(0, seriesCount).map(color => ({
    line: color.line,
    area: {
      top: color.top,
      bottom: color.bottom
    }
  }))
}
```

## 迁移检查清单

### 功能迁移
- [ ] 多数据源支持 (最多9个)
- [ ] 时间范围选择功能
- [ ] 数据聚合功能
- [ ] 实时数据更新
- [ ] 图表交互功能 (缩放、图例)
- [ ] 主题切换功能
- [ ] 响应式布局

### 配置迁移
- [ ] 图表标题配置
- [ ] 图例显示控制
- [ ] 坐标轴配置
- [ ] 曲线样式配置
- [ ] 颜色主题配置
- [ ] 数据缩放配置

### 性能优化
- [ ] 数据防抖处理
- [ ] 图表重绘优化
- [ ] 内存泄漏防护
- [ ] 大数据量处理

## 迁移步骤

### 1. 创建组件定义
```bash
# 创建组件目录
mkdir -p src/card2.1/components/chart/curve

# 创建必要文件
touch src/card2.1/components/chart/curve/definition.ts
touch src/card2.1/components/chart/curve/component.vue
touch src/card2.1/components/chart/curve/config.vue
```

### 2. 实现核心组件
- 迁移 `component.vue` 主组件逻辑
- 迁移 `line-chart.vue` 图表实现
- 适配 Card 2.1 数据源接口
- 实现配置表单组件

### 3. 配置验证
- 测试多数据源配置
- 验证时间范围功能
- 测试数据聚合功能
- 检查主题切换效果

### 4. 性能测试
- 大数据量渲染测试
- 实时数据更新性能
- 内存使用情况监控

## 数据处理流程

### 1. 数据获取流程
```
用户配置 → 数据源验证 → API调用 → 数据预处理 → 图表渲染
```

### 2. 实时更新流程
```
WebSocket连接 → 数据接收 → 数据验证 → 增量更新 → 图表重绘
```

### 3. 聚合处理流程
```
原始数据 → 时间分组 → 聚合计算 → 结果缓存 → 图表显示
```

## 配置示例

### 基础配置
```json
{
  "chart": {
    "title": "设备温度趋势",
    "showLegend": true,
    "showDataZoom": true
  },
  "style": {
    "colorTheme": "theme1",
    "curveWidth": 2,
    "smooth": true,
    "area": false
  },
  "dataSources": [
    {
      "deviceId": "device_001",
      "metricKey": "temperature",
      "metricName": "温度",
      "unit": "°C"
    }
  ]
}
```

### 高级配置
```json
{
  "chart": {
    "title": "多设备监控",
    "showLegend": true,
    "showDataZoom": true,
    "showToolbox": true
  },
  "style": {
    "colorTheme": "theme2",
    "curveWidth": 1,
    "smooth": true,
    "area": true
  },
  "axis": {
    "yAxis": {
      "name": "数值",
      "min": 0,
      "max": 100
    }
  },
  "data": {
    "timeRange": {
      "enabled": true,
      "range": [1640995200000, 1641081600000]
    },
    "aggregate": {
      "enabled": true,
      "method": "avg",
      "interval": "1h"
    }
  }
}
```

## 相关文档

- [Card 2.1 架构文档](../architecture.md)
- [数据源配置指南](../data-source-guide.md)
- [组件开发规范](../component-development.md)
- [ECharts 集成指南](../echarts-integration.md)
- [主题系统文档](../theme-system.md)