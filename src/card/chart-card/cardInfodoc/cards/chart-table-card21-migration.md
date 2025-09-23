# Chart Table 组件 Card 2.1 迁移配置文档

## 组件概述

**组件ID**: `chart-table`  
**组件类型**: `chart`  
**组件名称**: 数据表格  
**功能描述**: 基于 Naive UI 的数据表格组件，支持多数据源、分页、时间范围选择、数据聚合等功能

## 当前实现分析

### 1. 组件结构
```
table/
├── index.ts              # 组件定义配置
├── component.vue         # 主组件入口
├── card-config.vue       # 配置表单
├── poster.png           # 组件预览图
└── modules/
    └── table.vue        # 核心表格实现
```

### 2. 核心特性
- **多数据源支持**: 最多支持 20 个数据源
- **时间范围**: 支持时间范围选择和数据聚合
- **分页功能**: 支持分页显示，可配置每页条数
- **数据合并**: 按时间维度合并多个数据源
- **实时更新**: 支持设备遥测数据实时更新
- **时间格式化**: 自动格式化时间戳显示

### 3. 技术实现
- **表格组件**: Naive UI NDataTable
- **数据处理**: 时间维度数据合并、分页处理
- **时间处理**: moment.js 时间格式化
- **响应式**: 动态列生成、数据监听

## Card 2.1 迁移配置

### 1. 组件定义 (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const chartTableDefinition: ComponentDefinition = {
  // 基础信息
  id: 'chart-table',
  name: 'chart.table',
  type: 'chart',
  category: 'data-display',
  
  // 组件配置
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // 布局配置
  layout: {
    defaultSize: { width: 8, height: 5 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 12, height: 12 },
    resizable: true
  },
  
  // 数据源配置
  dataSource: {
    type: 'device',
    multiple: true,
    maxCount: 20,
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
      // 表格配置
      table: {
        type: 'object',
        properties: {
          title: { type: 'string', default: '' },
          showBorder: { type: 'boolean', default: false },
          striped: { type: 'boolean', default: false },
          size: { 
            type: 'string', 
            enum: ['small', 'medium', 'large'], 
            default: 'medium' 
          }
        }
      },
      
      // 分页配置
      pagination: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: true },
          pageSize: { 
            type: 'number', 
            minimum: 5, 
            maximum: 100, 
            default: 10 
          },
          showSizePicker: { type: 'boolean', default: true },
          pageSizes: { 
            type: 'array', 
            items: { type: 'number' },
            default: [10, 15, 20, 50] 
          }
        }
      },
      
      // 列配置
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            title: { type: 'string' },
            width: { type: 'number' },
            align: { 
              type: 'string', 
              enum: ['left', 'center', 'right'], 
              default: 'left' 
            },
            sortable: { type: 'boolean', default: false },
            filterable: { type: 'boolean', default: false },
            format: {
              type: 'object',
              properties: {
                type: { 
                  type: 'string', 
                  enum: ['number', 'date', 'text'], 
                  default: 'text' 
                },
                precision: { type: 'number', default: 2 },
                dateFormat: { type: 'string', default: 'YYYY-MM-DD HH:mm:ss' }
              }
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
              range: { type: 'array', items: { type: 'number' } },
              relative: { type: 'string', default: 'last_1h' }
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
          },
          sorting: {
            type: 'object',
            properties: {
              column: { type: 'string', default: 'time' },
              order: { 
                type: 'string', 
                enum: ['asc', 'desc'], 
                default: 'desc' 
              }
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
      aggregateFunction: 'string' // 聚合函数
    }
  },
  
  // 时间范围配置
  timeRange: {
    enabled: 'boolean',        // 是否启用时间范围
    range: 'string',          // 时间范围 (如: 'last_1h', 'last_1d')
    custom: {                 // 自定义时间范围
      start: 'number',        // 开始时间戳
      end: 'number'           // 结束时间戳
    }
  },
  
  // 聚合配置
  aggregate: {
    enabled: 'boolean',       // 是否启用聚合
    window: 'string',         // 聚合窗口
    function: 'string'        // 聚合函数
  }
}
```

### 3. 实现要点

#### 数据处理流程
```typescript
// 1. 数据获取
const fetchTableData = async (dataSources: DataSourceConfig[]) => {
  const promises = dataSources.map(source => {
    const params = {
      device_id: source.deviceId,
      key: source.metricKey,
      aggregate_window: source.aggregate?.window || 'no_aggregate',
      aggregate_function: source.aggregate?.function || 'avg',
      time_range: source.timeRange?.range || 'last_1h'
    }
    
    return telemetryDataHistoryList(params).then(res =>
      res.data.map(item => ({
        ...item,
        key: source.metricKey
      }))
    )
  })
  
  const results = await Promise.all(promises)
  return results.flat()
}

// 2. 数据合并处理
const mergeDataByTime = (data: any[]) => {
  const timeMap = new Map()
  
  data.forEach(({ x: timestamp, y: value, key }) => {
    if (!timeMap.has(timestamp)) {
      timeMap.set(timestamp, { time: timestamp })
    }
    timeMap.get(timestamp)[key] = value
  })
  
  // 按时间排序
  return Array.from(timeMap.values()).sort((a, b) => b.time - a.time)
}

// 3. 动态列生成
const generateColumns = (dataSources: DataSourceConfig[], config: TableConfig) => {
  const columns = [
    {
      title: '时间',
      key: 'time',
      render: (row: any) => {
        return moment(row.time).format(config.columns?.timeFormat || 'YYYY-MM-DD HH:mm:ss')
      },
      sortable: true
    }
  ]
  
  dataSources.forEach(source => {
    columns.push({
      title: source.metricName,
      key: source.metricKey,
      render: (row: any) => {
        const value = row[source.metricKey]
        if (value === undefined || value === null) return ''
        
        // 数值格式化
        if (typeof value === 'number') {
          return value.toFixed(config.columns?.precision || 2) + (source.unit || '')
        }
        return value
      },
      sortable: config.columns?.sortable || false
    })
  })
  
  return columns
}
```

#### 分页处理
```typescript
// 分页配置
const paginationConfig = reactive({
  page: 1,
  pageSize: config.pagination?.pageSize || 10,
  itemCount: 0,
  showSizePicker: config.pagination?.showSizePicker || true,
  pageSizes: config.pagination?.pageSizes || [10, 15, 20, 50]
})

// 分页数据计算
const paginatedData = computed(() => {
  const startIndex = (paginationConfig.page - 1) * paginationConfig.pageSize
  const endIndex = startIndex + paginationConfig.pageSize
  return allTableData.value.slice(startIndex, endIndex)
})

// 分页事件处理
const handlePageChange = (page: number) => {
  paginationConfig.page = page
}

const handlePageSizeChange = (pageSize: number) => {
  paginationConfig.pageSize = pageSize
  paginationConfig.page = 1 // 重置到第一页
}
```

#### 数据更新机制
```typescript
// 监听配置变化
watch(
  () => props.card,
  async () => {
    // 重新生成列配置
    columns.value = generateColumns(
      props.card.dataSource.deviceSource,
      props.card.config
    )
    
    // 重新获取数据
    await fetchTableData()
  },
  { deep: true }
)

// 实时数据更新
const updateData = (deviceId: string, metricKey: string, data: any) => {
  // 更新对应设备的数据
  const existingIndex = allTableData.value.findIndex(
    item => item.time === data.timestamp
  )
  
  if (existingIndex >= 0) {
    // 更新现有数据
    allTableData.value[existingIndex][metricKey] = data.value
  } else {
    // 添加新数据
    const newRow = { time: data.timestamp, [metricKey]: data.value }
    allTableData.value.unshift(newRow)
    
    // 保持数据量限制
    if (allTableData.value.length > 1000) {
      allTableData.value = allTableData.value.slice(0, 1000)
    }
  }
  
  // 更新分页信息
  paginationConfig.itemCount = allTableData.value.length
}
```

## 迁移检查清单

### 功能迁移
- [ ] 多数据源支持 (最多20个)
- [ ] 时间范围选择功能
- [ ] 数据聚合功能
- [ ] 分页显示功能
- [ ] 数据排序功能
- [ ] 实时数据更新
- [ ] 时间格式化显示

### 配置迁移
- [ ] 表格样式配置
- [ ] 分页参数配置
- [ ] 列显示配置
- [ ] 数据格式化配置
- [ ] 排序配置
- [ ] 过滤配置

### 性能优化
- [ ] 大数据量分页处理
- [ ] 虚拟滚动支持
- [ ] 数据缓存机制
- [ ] 内存泄漏防护

## 迁移步骤

### 1. 创建组件定义
```bash
# 创建组件目录
mkdir -p src/card2.1/components/chart/table

# 创建必要文件
touch src/card2.1/components/chart/table/definition.ts
touch src/card2.1/components/chart/table/component.vue
touch src/card2.1/components/chart/table/config.vue
```

### 2. 实现核心组件
- 迁移 `component.vue` 主组件逻辑
- 迁移 `table.vue` 表格实现
- 适配 Card 2.1 数据源接口
- 实现配置表单组件

### 3. 配置验证
- 测试多数据源配置
- 验证分页功能
- 测试数据聚合功能
- 检查排序和过滤效果

### 4. 性能测试
- 大数据量渲染测试
- 分页性能测试
- 内存使用情况监控

## 数据处理流程

### 1. 数据获取流程
```
用户配置 → 数据源验证 → API调用 → 数据预处理 → 表格渲染
```

### 2. 数据合并流程
```
多源数据 → 时间维度分组 → 数据合并 → 排序处理 → 分页显示
```

### 3. 实时更新流程
```
WebSocket连接 → 数据接收 → 数据验证 → 增量更新 → 表格重绘
```

## 配置示例

### 基础配置
```json
{
  "table": {
    "title": "设备数据表",
    "showBorder": true,
    "striped": true,
    "size": "medium"
  },
  "pagination": {
    "enabled": true,
    "pageSize": 15,
    "showSizePicker": true,
    "pageSizes": [10, 15, 20, 50]
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
  "table": {
    "title": "多设备监控数据",
    "showBorder": true,
    "striped": false,
    "size": "small"
  },
  "pagination": {
    "enabled": true,
    "pageSize": 20,
    "showSizePicker": true,
    "pageSizes": [10, 20, 50, 100]
  },
  "columns": [
    {
      "key": "time",
      "title": "时间",
      "width": 200,
      "align": "center",
      "sortable": true,
      "format": {
        "type": "date",
        "dateFormat": "MM-DD HH:mm:ss"
      }
    },
    {
      "key": "temperature",
      "title": "温度",
      "width": 120,
      "align": "right",
      "sortable": true,
      "format": {
        "type": "number",
        "precision": 1
      }
    }
  ],
  "data": {
    "timeRange": {
      "enabled": true,
      "relative": "last_24h"
    },
    "aggregate": {
      "enabled": true,
      "method": "avg",
      "interval": "1h"
    },
    "sorting": {
      "column": "time",
      "order": "desc"
    }
  }
}
```

## 使用场景

### 1. 设备监控数据展示
- 多设备实时数据对比
- 历史数据趋势分析
- 异常数据快速定位

### 2. 数据报表生成
- 定时数据汇总报表
- 多维度数据分析
- 数据导出功能

### 3. 运维监控面板
- 系统指标监控
- 性能数据展示
- 告警数据列表

## 相关文档

- [Card 2.1 架构文档](../architecture.md)
- [数据源配置指南](../data-source-guide.md)
- [组件开发规范](../component-development.md)
- [Naive UI 表格组件文档](https://www.naiveui.com/zh-CN/os-theme/components/data-table)
- [分页组件集成指南](../pagination-integration.md)