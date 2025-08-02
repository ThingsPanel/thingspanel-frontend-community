# 数据表格组件 (Table)

## 概述

数据表格组件是一个功能丰富的表格展示组件，专门用于显示设备遥测数据和其他结构化数据。支持分页、排序、筛选、导出等多种功能，提供灵活的配置选项和美观的界面设计。

## 主要特性

### 📊 数据展示
- **多数据源支持**：支持设备遥测数据、API数据等多种数据源
- **动态列生成**：根据数据自动生成表格列，支持自定义列配置
- **时间列格式化**：支持多种时间格式显示
- **数值格式化**：支持精度控制、千分位分隔符、单位显示

### 🎛️ 交互功能
- **分页控制**：支持分页显示，可配置每页条数和分页位置
- **排序功能**：支持列排序，可配置默认排序字段和方式
- **筛选功能**：支持列筛选（可选）
- **数据导出**：支持CSV、Excel、JSON格式导出

### 🎨 样式定制
- **主题配置**：支持自定义表头、行背景色、文字颜色等
- **尺寸控制**：支持小、中、大三种尺寸
- **边框样式**：可配置边框显示和斑马纹效果
- **响应式设计**：适配不同屏幕尺寸

### ⚡ 性能优化
- **虚拟滚动**：大数据量时自动启用虚拟滚动
- **数据聚合**：支持时间窗口聚合，减少数据传输
- **自动刷新**：可配置自动刷新间隔
- **懒加载**：支持分页懒加载

## 配置选项

### 基础设置
- `title`: 组件标题

### 表格设置
- `bordered`: 是否显示边框
- `striped`: 是否显示斑马纹
- `size`: 表格尺寸 (small/medium/large)
- `maxHeight`: 最大高度
- `showHeader`: 是否显示表头
- `sortable`: 是否可排序
- `filterable`: 是否可筛选

### 分页设置
- `enabled`: 是否启用分页
- `pageSize`: 每页条数
- `pageSizes`: 可选每页条数
- `showSizePicker`: 是否显示条数选择器
- `showQuickJumper`: 是否显示快速跳转
- `position`: 分页位置 (top/bottom/both)

### 列配置
#### 时间列
- `show`: 是否显示时间列
- `title`: 时间列标题
- `format`: 时间格式
- `width`: 列宽度
- `fixed`: 是否固定列

#### 数据列
- `autoGenerate`: 是否自动生成列
- `defaultWidth`: 默认列宽
- `numberFormat`: 数值格式化配置
  - `precision`: 小数精度
  - `thousandsSeparator`: 千分位分隔符
  - `unit`: 数值单位

### 样式设置
- `headerBgColor`: 表头背景色
- `headerTextColor`: 表头文字颜色
- `rowBgColor`: 行背景色
- `rowTextColor`: 行文字颜色
- `stripedColor`: 斑马纹颜色
- `borderColor`: 边框颜色
- `fontSize`: 字体大小
- `rowHeight`: 行高

### 数据设置
- `timeRange`: 数据时间范围
- `aggregateFunction`: 聚合函数 (avg/max/min/sum/count)
- `aggregateWindow`: 聚合时间窗口
- `maxRows`: 最大显示行数
- `sortOrder`: 排序方式 (asc/desc)
- `sortField`: 排序字段

### 导出设置
- `enabled`: 是否启用导出
- `formats`: 导出格式 (csv/excel/json)
- `filename`: 导出文件名

### 自动刷新
- `enabled`: 是否启用自动刷新
- `interval`: 刷新间隔（秒）

## 数据格式

### 输入数据格式
```typescript
interface TableData {
  time: string | number | Date  // 时间戳
  [key: string]: any           // 动态数据字段
}
```

### 示例数据
```json
[
  {
    "time": "2024-01-01 12:00:00",
    "temperature": 25.6,
    "humidity": 60.2,
    "pressure": 1013.25
  },
  {
    "time": "2024-01-01 12:01:00",
    "temperature": 25.8,
    "humidity": 59.8,
    "pressure": 1013.30
  }
]
```

## 使用示例

### 基础用法
```vue
<template>
  <TableComponent 
    :config="tableConfig"
    :data-source="dataSource"
    @data-export="handleExport"
  />
</template>

<script setup>
import { ref } from 'vue'
import TableComponent from './component.vue'

const tableConfig = ref({
  title: '设备数据表格',
  table: {
    bordered: true,
    striped: true,
    size: 'medium'
  },
  pagination: {
    enabled: true,
    pageSize: 20
  }
})

const dataSource = ref({
  type: 'telemetry',
  deviceId: 'device_001',
  metrics: ['temperature', 'humidity']
})

const handleExport = (data, format) => {
  console.log('导出数据:', data, '格式:', format)
}
</script>
```

### 高级配置
```vue
<template>
  <TableComponent 
    :config="advancedConfig"
    :data-source="dataSource"
  />
</template>

<script setup>
const advancedConfig = ref({
  title: '高级数据表格',
  table: {
    bordered: true,
    striped: true,
    size: 'large',
    maxHeight: 600,
    sortable: true,
    filterable: true
  },
  pagination: {
    enabled: true,
    pageSize: 50,
    showSizePicker: true,
    showQuickJumper: true
  },
  columns: {
    timeColumn: {
      show: true,
      title: '采集时间',
      format: 'YYYY-MM-DD HH:mm:ss',
      width: 200,
      fixed: true
    },
    dataColumns: {
      autoGenerate: true,
      defaultWidth: 150,
      numberFormat: {
        precision: 2,
        thousandsSeparator: true,
        unit: '°C'
      }
    }
  },
  style: {
    headerBgColor: '#f0f2f5',
    headerTextColor: '#262626',
    fontSize: 14,
    rowHeight: 45
  },
  data: {
    timeRange: 'last_24h',
    aggregateFunction: 'avg',
    maxRows: 1000,
    sortOrder: 'desc'
  },
  export: {
    enabled: true,
    formats: ['csv', 'excel'],
    filename: 'device_data'
  },
  autoRefresh: {
    enabled: true,
    interval: 60
  }
})
</script>
```

## 事件

- `data-export`: 数据导出事件
- `row-click`: 行点击事件
- `sort-change`: 排序变化事件
- `page-change`: 分页变化事件
- `filter-change`: 筛选变化事件

## 方法

- `refreshData()`: 手动刷新数据
- `exportData(format)`: 导出数据
- `clearFilters()`: 清除所有筛选
- `resetSort()`: 重置排序

## 注意事项

1. **性能考虑**：大数据量时建议启用分页和虚拟滚动
2. **时间格式**：确保时间数据格式正确，支持时间戳和字符串格式
3. **数据更新**：组件会自动监听数据源变化并更新显示
4. **导出功能**：导出大量数据时可能需要较长时间，建议添加加载提示
5. **自动刷新**：启用自动刷新时注意设置合理的间隔时间，避免频繁请求

## 兼容性

- 支持 Vue 3.x
- 兼容现代浏览器 (Chrome 80+, Firefox 78+, Safari 14+)
- 支持移动端响应式显示

## 更新日志

### v2.0.0
- 🎉 全新的 Card 2.0 架构
- ✨ 新增数据导出功能
- ✨ 新增自动刷新功能
- ✨ 新增虚拟滚动支持
- 🎨 优化样式配置选项
- 🐛 修复分页显示问题
- 📈 提升大数据量渲染性能