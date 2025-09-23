# Chart Bar 组件 Card 2.1 迁移配置文档

## 组件概述

Chart Bar 组件是一个柱状图卡片，用于显示设备的历史数据趋势。支持多数据源、时间范围选择、数据聚合等功能，提供丰富的图表交互和配置选项。

## 当前实现分析

### 组件配置 (index.ts)
- **组件ID**: `chart-bar`
- **组件类型**: `chart`
- **标题**: `$t('card.barChart')` (柱状图)
- **数据源**: 设备来源，支持最多9个数据源
- **时间范围**: 支持时间范围选择 (isSupportTimeRange: true)
- **数据聚合**: 支持数据聚合功能 (isSupportAggregate: true)
- **默认布局**: 6x5 (最小3x3)

### 组件实现 (component.vue + modules/bar-chart.vue)
- **图表引擎**: 基于 ECharts 实现
- **数据获取**: 支持历史数据和当前数据获取
- **交互功能**: 数据缩放、图例控制、工具箱
- **主题配置**: 支持多种颜色主题配置
- **响应式**: 自适应容器大小变化
- **实时更新**: 支持 WebSocket 数据更新

## Card 2.1 迁移配置

### 组件定义
```typescript
export const chartBarCard: CardDefinition = {
  id: 'chart-bar',
  name: '柱状图',
  category: 'data',
  description: '柱状图表，支持多数据源历史数据展示和趋势分析',
  version: '2.1.0',
  
  // 数据源配置
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 9,
    supportedMetrics: ['telemetry', 'attributes'],
    description: '设备遥测或属性数据源',
    capabilities: ['read', 'history'],
    dataTypes: ['number'],
    timeRange: {
      supported: true,
      defaultRange: '1h',
      maxRange: '30d'
    },
    aggregation: {
      supported: true,
      methods: ['avg', 'sum', 'min', 'max', 'count'],
      defaultMethod: 'avg'
    }
  },
  
  // 布局配置
  layout: {
    defaultSize: { width: 6, height: 5 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 12, height: 8 },
    resizable: true
  },
  
  // 配置选项
  configSchema: {
    name: {
      type: 'string',
      title: '图表名称',
      description: '图表的显示名称',
      default: '柱状图'
    },
    colorGroups: {
      type: 'object',
      title: '颜色配置',
      description: '图表的颜色主题配置',
      properties: {
        colorGroup: {
          type: 'array',
          title: '颜色组',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', title: '主题名称' },
              top: { type: 'color', title: '顶部颜色' },
              bottom: { type: 'color', title: '底部颜色' },
              line: { type: 'color', title: '线条颜色' }
            }
          }
        }
      }
    },
    chartOptions: {
      type: 'object',
      title: '图表选项',
      properties: {
        showLegend: {
          type: 'boolean',
          title: '显示图例',
          default: true
        },
        showDataZoom: {
          type: 'boolean',
          title: '显示数据缩放',
          default: true
        },
        showToolbox: {
          type: 'boolean',
          title: '显示工具箱',
          default: false
        }
      }
    }
  },
  
  // 权限要求
  permissions: {
    read: true,
    history: true
  }
}
```

### 数据源映射
```typescript
// 原始数据源结构
interface OriginalDataSource {
  deviceSource: Array<{
    deviceId: string;
    metricsId: string;
    metricsName: string;
    metricsType: 'telemetry' | 'attributes';
    metricsDataType: 'number';
  }>;
  origin: 'device';
  sourceNum: number;
  isSupportTimeRange: boolean;
  isSupportAggregate: boolean;
}

// Card 2.1 数据源结构
interface Card21DataSource {
  devices: Array<{
    id: string;
    metrics: Array<{
      id: string;
      name: string;
      type: 'telemetry' | 'attribute';
      dataType: 'number';
      unit?: string;
    }>;
  }>;
  timeRange?: {
    start: number;
    end: number;
    interval: string;
  };
  aggregation?: {
    method: 'avg' | 'sum' | 'min' | 'max' | 'count';
    interval: string;
  };
}

// 映射函数
function mapDataSource(original: OriginalDataSource): Card21DataSource {
  const deviceGroups = new Map<string, any>();
  
  original.deviceSource.forEach(source => {
    if (!deviceGroups.has(source.deviceId)) {
      deviceGroups.set(source.deviceId, {
        id: source.deviceId,
        metrics: []
      });
    }
    
    deviceGroups.get(source.deviceId).metrics.push({
      id: source.metricsId,
      name: source.metricsName,
      type: source.metricsType === 'telemetry' ? 'telemetry' : 'attribute',
      dataType: 'number'
    });
  });
  
  return {
    devices: Array.from(deviceGroups.values())
  };
}
```

### 实现要点

1. **图表配置**
   - 基于 ECharts 的柱状图实现
   - 支持时间轴和数值轴配置
   - 可配置图例、工具箱、数据缩放

2. **数据处理**
   - 历史数据：telemetryDataHistoryList
   - 当前数据：telemetryDataCurrentKeys
   - 支持多设备多指标数据合并

3. **交互功能**
   - 数据缩放：支持滑动条和内部拖拽
   - 图例控制：显示/隐藏数据系列
   - 时间范围选择：支持自定义时间区间

4. **主题系统**
   - 预定义颜色主题组
   - 支持渐变色配置
   - 自适应明暗主题

5. **性能优化**
   - 防抖处理数据更新
   - 虚拟化大数据集
   - 响应式图表重绘

## 迁移检查清单

- [ ] 验证数据源映射正确性
- [ ] 确认多数据源支持
- [ ] 测试时间范围功能
- [ ] 验证数据聚合功能
- [ ] 检查图表交互功能
- [ ] 测试主题配置
- [ ] 验证响应式布局
- [ ] 测试实时数据更新
- [ ] 确认性能优化效果

## 迁移步骤

1. **创建 Card 2.1 组件定义**
   - 定义组件元数据和配置架构
   - 设置数据源要求和时间范围支持
   - 配置图表选项和主题系统

2. **实现数据源适配器**
   - 创建多数据源映射函数
   - 处理时间范围和聚合配置
   - 适配历史数据查询接口

3. **迁移图表逻辑**
   - 保持 ECharts 配置结构
   - 适配新的数据格式
   - 维护交互功能

4. **更新配置表单**
   - 适配 Card 2.1 配置架构
   - 优化主题选择界面
   - 添加图表选项配置

5. **性能优化**
   - 优化大数据集渲染
   - 改进数据更新机制
   - 增强响应式性能

6. **测试验证**
   - 功能测试：图表显示、交互操作
   - 数据测试：多数据源、时间范围、聚合
   - 性能测试：大数据集、实时更新
   - 兼容性测试：不同设备类型、数据格式
   - 用户体验测试：响应式、主题切换

## 数据处理流程

1. **数据获取**
   ```typescript
   // 历史数据查询
   const historyData = await telemetryDataHistoryList({
     device_id: deviceId,
     keys: metricsId,
     start_time: startTime,
     end_time: endTime,
     aggregate: aggregateMethod
   });
   
   // 当前数据查询
   const currentData = await telemetryDataCurrentKeys({
     device_id: deviceId,
     keys: metricsId
   });
   ```

2. **数据转换**
   ```typescript
   // 转换为 ECharts 数据格式
   const seriesData = historyData.map(item => [
     item.timestamp,
     item.value
   ]);
   ```

3. **图表更新**
   ```typescript
   // 更新图表配置
   option.value.series = [{
     name: metricsName,
     type: 'bar',
     data: seriesData,
     itemStyle: {
       color: colorConfig
     }
   }];
   ```

## 配置示例

```typescript
// 基础配置
const basicConfig = {
  name: '设备温度趋势',
  colorGroups: {
    colorGroup: [
      {
        name: 'Sky Reflection',
        top: '#2563EB',
        bottom: '#2563EB',
        line: '#2563EB'
      }
    ]
  },
  chartOptions: {
    showLegend: true,
    showDataZoom: true,
    showToolbox: false
  }
};

// 时间范围配置
const timeRangeConfig = {
  start: Date.now() - 24 * 60 * 60 * 1000, // 24小时前
  end: Date.now(),
  interval: '1h'
};

// 聚合配置
const aggregationConfig = {
  method: 'avg',
  interval: '5m'
};
```

## 相关文档

- [Card 2.1 架构文档](../architecture/card21-architecture.md)
- [数据源映射指南](../guides/data-source-mapping.md)
- [ECharts 集成指南](../guides/echarts-integration.md)
- [图表主题配置](../guides/chart-theme-configuration.md)
- [时间序列数据处理](../guides/time-series-data-processing.md)