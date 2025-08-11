# Table 组件迁移指南

## 📋 组件概述

**chart-table** 是一个数据表格展示组件，用于以表格形式显示设备遥测数据的历史记录。支持多设备多指标数据的聚合显示、时间排序和分页功能。

## 🔍 技术架构分析

### 当前实现结构
```
table/
├── index.ts           # 组件定义，支持 20 个数据源
├── component.vue      # 简单包装组件
├── card-config.vue    # 配置界面（基本为空）
├── modules/
│   └── table.vue      # 核心表格实现（164 行）
└── poster.png         # 组件预览图
```

### 核心功能特性
1. **多数据源聚合**: 支持最多 20 个设备数据源
2. **时间序列显示**: 按时间合并相同时刻的多指标数据
3. **动态列生成**: 根据配置的指标自动生成表格列
4. **分页功能**: 支持 10/15/20 条每页的分页显示
5. **时间格式化**: 自动格式化时间显示为 `YYYY-MM-DD HH:mm:ss`
6. **数据排序**: 按时间降序排列（最新数据在前）

### 数据流程
```
设备数据源配置 → API 并行请求 → 数据时间合并 → 表格渲染 → 分页显示
```

## ❗ 现有问题识别

### 1. 🚨 **配置界面缺失**
```vue
<!-- card-config.vue 几乎为空 -->
<template>
  <div></div>  <!-- 没有任何配置项 -->
</template>
```
**影响**: 用户无法配置表格显示选项、分页设置等。

### 2. 🎨 **主题系统集成不完整**
- 缺少明暗主题适配
- 硬编码样式较多
- 没有使用 CSS 变量系统

### 3. 📊 **数据处理逻辑问题**
```javascript
// 问题：数据合并逻辑复杂且性能较差
const processData = data => {
  const timeMap = new Map()
  data.forEach(({ x, y, key }) => {
    if (!timeMap.has(x)) {
      timeMap.set(x, { time: x })
    }
    timeMap.get(x)[key] = y  // 可能覆盖数据
  })
  return Array.from(timeMap.values()).sort((a, b) => b.time - a.time)
}
```

### 4. ⚡ **性能优化不足**
- 没有数据虚拟滚动
- 大数据量时分页性能差
- API 请求没有防抖处理

### 5. 🌐 **国际化不完整**
- 部分固定文本没有使用 `$t()` 
- 分页组件的本地化文本缺失

### 6. 📱 **响应式设计缺失**
- 在小屏幕设备上表格可能溢出
- 缺少移动端适配

## 🎯 Card 2.1 迁移策略

### 组件重新设计

#### 1. 组件定义
```typescript
// src/card2.1/components/data-table/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const DataTableDefinition: ComponentDefinition = {
  type: 'data-table',
  name: '数据表格',
  category: '数据展示',
  description: '以表格形式展示设备遥测数据，支持多指标聚合和分页',
  
  // 数据需求声明
  dataRequirements: {
    tableData: {
      type: 'array',
      description: '表格数据，支持多设备多指标',
      maxItems: 20, // 最多支持 20 个数据源
      structure: {
        timestamp: { type: 'number', description: '时间戳' },
        deviceId: { type: 'string', description: '设备ID' },
        metricsId: { type: 'string', description: '指标ID' },
        metricsName: { type: 'string', description: '指标名称' },
        value: { type: 'number', description: '数值' }
      }
    }
  },
  
  // 配置结构  
  config: {
    // 表格显示配置
    showHeader: {
      type: 'boolean',
      label: '显示表头',
      default: true
    },
    
    bordered: {
      type: 'boolean', 
      label: '显示边框',
      default: false
    },
    
    striped: {
      type: 'boolean',
      label: '斑马纹显示', 
      default: true
    },
    
    // 分页配置
    pageSize: {
      type: 'select',
      label: '每页显示',
      options: [
        { label: '10 条', value: 10 },
        { label: '15 条', value: 15 },
        { label: '20 条', value: 20 },
        { label: '50 条', value: 50 }
      ],
      default: 10
    },
    
    showSizePicker: {
      type: 'boolean',
      label: '显示页面大小选择器',
      default: true
    },
    
    // 列配置
    columns: {
      type: 'array',
      label: '列配置',
      description: '自定义表格列显示和格式',
      structure: {
        key: { type: 'string', description: '列键值' },
        title: { type: 'string', description: '列标题' },
        width: { type: 'number', description: '列宽度' },
        align: { 
          type: 'select', 
          options: ['left', 'center', 'right'],
          description: '对齐方式'
        },
        sortable: { type: 'boolean', description: '是否可排序' },
        format: { 
          type: 'select',
          options: ['default', 'number', 'date', 'percentage'],
          description: '数据格式'
        }
      }
    },
    
    // 时间配置
    timeFormat: {
      type: 'select',
      label: '时间格式',
      options: [
        { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
        { label: 'MM-DD HH:mm', value: 'MM-DD HH:mm' },
        { label: 'HH:mm:ss', value: 'HH:mm:ss' },
        { label: '相对时间', value: 'relative' }
      ],
      default: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 600, height: 400 },
    gridstack: { w: 8, h: 5, minW: 4, minH: 3 }
  }
}
```

#### 2. 核心组件实现
```vue
<!-- src/card2.1/components/data-table/DataTable.vue -->
<script setup lang="ts">
/**
 * 数据表格组件
 * 支持多设备多指标数据的表格化展示
 */
import { computed, ref, watch } from 'vue'
import { NDataTable, NEmpty, NSpin } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { format as formatDate, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { useCard2Integration } from '@/card2.1/hooks/useCard2Integration'

interface DataTableConfig {
  showHeader?: boolean
  bordered?: boolean
  striped?: boolean
  pageSize?: number
  showSizePicker?: boolean
  columns?: ColumnConfig[]
  timeFormat?: string
}

interface ColumnConfig {
  key: string
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  format?: 'default' | 'number' | 'date' | 'percentage'
}

interface TableRowData {
  timestamp: number
  [key: string]: any
}

interface Props {
  config: DataTableConfig
  data?: any[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()
const themeStore = useThemeStore()

// 分页状态
const pagination = ref({
  page: 1,
  pageSize: props.config.pageSize || 10,
  itemCount: 0,
  showSizePicker: props.config.showSizePicker ?? true,
  pageSizes: [10, 15, 20, 50],
  prefix: (info: any) => t('table.total', { total: info.itemCount })
})

// 数据处理：将多指标数据按时间合并
const processedData = computed((): TableRowData[] => {
  if (!props.data?.length) return []
  
  const timeMap = new Map<number, TableRowData>()
  
  props.data.forEach(item => {
    const timestamp = item.timestamp || item.x || item.time
    const key = item.metricsId || item.key
    const value = item.value ?? item.y
    
    if (!timeMap.has(timestamp)) {
      timeMap.set(timestamp, {
        timestamp,
        time: timestamp // 保留 time 字段用于显示
      })
    }
    
    const row = timeMap.get(timestamp)!
    row[key] = value
    
    // 保存指标名称用于列标题
    if (item.metricsName) {
      row[`${key}_name`] = item.metricsName
    }
  })
  
  // 按时间降序排列
  return Array.from(timeMap.values()).sort((a, b) => b.timestamp - a.timestamp)
})

// 动态生成表格列
const tableColumns = computed((): DataTableColumns<TableRowData> => {
  const columns: DataTableColumns<TableRowData> = []
  
  // 时间列
  columns.push({
    title: t('common.time'),
    key: 'time',
    width: 180,
    render: (row) => {
      return formatTimeValue(row.timestamp, props.config.timeFormat)
    },
    sorter: (rowA, rowB) => rowA.timestamp - rowB.timestamp
  })
  
  // 根据配置或数据自动生成其他列
  if (props.config.columns?.length) {
    // 使用自定义列配置
    props.config.columns.forEach(col => {
      columns.push({
        title: col.title,
        key: col.key,
        width: col.width,
        align: col.align || 'left',
        render: (row) => formatCellValue(row[col.key], col.format),
        sorter: col.sortable ? (rowA, rowB) => {
          const a = rowA[col.key] ?? 0
          const b = rowB[col.key] ?? 0
          return typeof a === 'number' ? a - b : String(a).localeCompare(String(b))
        } : undefined
      })
    })
  } else {
    // 自动检测数据列
    const dataKeys = new Set<string>()
    processedData.value.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'timestamp' && key !== 'time' && !key.endsWith('_name')) {
          dataKeys.add(key)
        }
      })
    })
    
    dataKeys.forEach(key => {
      // 尝试获取指标名称
      const nameKey = `${key}_name`
      const title = processedData.value.find(row => row[nameKey])?.[nameKey] || key
      
      columns.push({
        title,
        key,
        render: (row) => formatCellValue(row[key], 'default'),
        sorter: (rowA, rowB) => {
          const a = rowA[key] ?? 0
          const b = rowB[key] ?? 0
          return typeof a === 'number' ? a - b : String(a).localeCompare(String(b))
        }
      })
    })
  }
  
  return columns
})

// 格式化时间值
const formatTimeValue = (timestamp: number, format?: string) => {
  if (!timestamp) return '--'
  
  const date = new Date(timestamp)
  
  switch (format) {
    case 'relative':
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: zhCN 
      })
    case 'HH:mm:ss':
      return formatDate(date, 'HH:mm:ss')
    case 'MM-DD HH:mm':
      return formatDate(date, 'MM-dd HH:mm')
    default:
      return formatDate(date, format || 'yyyy-MM-dd HH:mm:ss')
  }
}

// 格式化单元格值
const formatCellValue = (value: any, format?: string) => {
  if (value === null || value === undefined) return '--'
  
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toFixed(2) : value
    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value
    case 'date':
      return typeof value === 'number' ? formatDate(new Date(value), 'yyyy-MM-dd') : value
    default:
      return value
  }
}

// 分页数据
const paginatedData = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return processedData.value.slice(start, end)
})

// 更新分页信息
watch(processedData, (newData) => {
  pagination.value.itemCount = newData.length
  if (pagination.value.page > Math.ceil(newData.length / pagination.value.pageSize)) {
    pagination.value.page = 1
  }
}, { immediate: true })

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.value.page = page
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
}

// 暴露接口供外部使用
defineExpose({
  refresh: () => {
    // 触发数据刷新
  }
})
</script>

<template>
  <div class="data-table-container">
    <NSpin :show="loading">
      <NDataTable
        v-if="processedData.length > 0"
        :columns="tableColumns"
        :data="paginatedData"
        :bordered="config.bordered"
        :striped="config.striped"
        :show-header="config.showHeader"
        :pagination="pagination"
        :scroll-x="600"
        remote
        class="data-table"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
      
      <NEmpty
        v-else-if="!loading"
        :description="t('table.noData')"
        class="empty-state"
      />
    </NSpin>
  </div>
</template>

<style scoped>
.data-table-container {
  width: 100%;
  height: 100%;
  padding: var(--card-padding);
  
  /* 主题适配 */
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
}

.data-table {
  width: 100%;
  
  /* 滚动条优化 */
  :deep(.n-data-table-wrapper) {
    overflow: auto;
    scrollbar-width: thin;
  }
  
  :deep(.n-data-table-wrapper)::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  :deep(.n-data-table-wrapper)::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-color);
    border-radius: 3px;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* 暗色主题适配 */
[data-theme="dark"] .data-table-container {
  background-color: var(--card-color-dark);
  color: var(--text-color-dark);
}
</style>
```

#### 3. 配置面板实现
```vue
<!-- src/card2.1/components/data-table/ConfigPanel.vue -->
<script setup lang="ts">
/**
 * 数据表格配置面板
 * 提供完整的表格显示和分页配置选项
 */
import { computed } from 'vue'
import {
  NForm,
  NFormItem,
  NSelect,
  NSwitch,
  NInputNumber,
  NDynamicInput
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

interface Props {
  config: DataTableConfig
}

interface Emits {
  (e: 'update:config', config: DataTableConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// 分页大小选项
const pageSizeOptions = [
  { label: '10 条/页', value: 10 },
  { label: '15 条/页', value: 15 },
  { label: '20 条/页', value: 20 },
  { label: '50 条/页', value: 50 }
]

// 时间格式选项
const timeFormatOptions = [
  { label: '完整时间 (2024-01-01 12:00:00)', value: 'yyyy-MM-dd HH:mm:ss' },
  { label: '月日时分 (01-01 12:00)', value: 'MM-dd HH:mm' },
  { label: '时分秒 (12:00:00)', value: 'HH:mm:ss' },
  { label: '相对时间 (2小时前)', value: 'relative' }
]

// 对齐方式选项
const alignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' }
]

// 格式化类型选项
const formatOptions = [
  { label: '默认', value: 'default' },
  { label: '数字 (保留2位小数)', value: 'number' },
  { label: '百分比', value: 'percentage' },
  { label: '日期', value: 'date' }
]

// 更新配置
const updateConfig = (key: keyof DataTableConfig, value: any) => {
  emit('update:config', { ...props.config, [key]: value })
}
</script>

<template>
  <div class="data-table-config">
    <NForm label-placement="left" label-width="120">
      <!-- 表格样式配置 -->
      <div class="config-group">
        <h4>{{ t('config.tableStyle') }}</h4>
        
        <NFormItem :label="t('config.showHeader')">
          <NSwitch
            :value="config.showHeader"
            @update:value="(value) => updateConfig('showHeader', value)"
          />
        </NFormItem>
        
        <NFormItem :label="t('config.bordered')">
          <NSwitch
            :value="config.bordered"
            @update:value="(value) => updateConfig('bordered', value)"
          />
        </NFormItem>
        
        <NFormItem :label="t('config.striped')">
          <NSwitch
            :value="config.striped"
            @update:value="(value) => updateConfig('striped', value)"
          />
        </NFormItem>
      </div>
      
      <!-- 分页配置 -->
      <div class="config-group">
        <h4>{{ t('config.pagination') }}</h4>
        
        <NFormItem :label="t('config.pageSize')">
          <NSelect
            :value="config.pageSize"
            :options="pageSizeOptions"
            @update:value="(value) => updateConfig('pageSize', value)"
          />
        </NFormItem>
        
        <NFormItem :label="t('config.showSizePicker')">
          <NSwitch
            :value="config.showSizePicker"
            @update:value="(value) => updateConfig('showSizePicker', value)"
          />
        </NFormItem>
      </div>
      
      <!-- 时间格式配置 -->
      <div class="config-group">
        <h4>{{ t('config.timeFormat') }}</h4>
        
        <NFormItem :label="t('config.format')">
          <NSelect
            :value="config.timeFormat"
            :options="timeFormatOptions"
            @update:value="(value) => updateConfig('timeFormat', value)"
          />
        </NFormItem>
      </div>
      
      <!-- 列配置 -->
      <div class="config-group">
        <h4>{{ t('config.columns') }}</h4>
        
        <NDynamicInput
          :value="config.columns"
          @update:value="(value) => updateConfig('columns', value)"
        >
          <template #create-button-default>
            {{ t('config.addColumn') }}
          </template>
          
          <template #default="{ value: column, index }">
            <div class="column-config">
              <NFormItem label="列键">
                <NInput
                  :value="column.key"
                  placeholder="metricsId"
                  @update:value="(val) => column.key = val"
                />
              </NFormItem>
              
              <NFormItem label="列标题">
                <NInput
                  :value="column.title"
                  placeholder="温度"
                  @update:value="(val) => column.title = val"
                />
              </NFormItem>
              
              <NFormItem label="宽度">
                <NInputNumber
                  :value="column.width"
                  placeholder="120"
                  @update:value="(val) => column.width = val"
                />
              </NFormItem>
              
              <NFormItem label="对齐">
                <NSelect
                  :value="column.align"
                  :options="alignOptions"
                  @update:value="(val) => column.align = val"
                />
              </NFormItem>
              
              <NFormItem label="格式">
                <NSelect
                  :value="column.format"
                  :options="formatOptions"
                  @update:value="(val) => column.format = val"
                />
              </NFormItem>
            </div>
          </template>
        </NDynamicInput>
      </div>
    </NForm>
  </div>
</template>

<style scoped>
.data-table-config {
  padding: var(--card-padding);
}

.config-group {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--divider-color);
}

.config-group h4 {
  margin: 0 0 16px 0;
  color: var(--text-color);
  font-weight: 600;
}

.column-config {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--body-color);
}

.column-config .n-form-item {
  margin-bottom: 12px;
}

.column-config .n-form-item:last-child {
  margin-bottom: 0;
}
</style>
```

### 数据绑定集成

#### 数据适配器
```typescript
// src/card2.1/components/data-table/adapters/table-data-adapter.ts
export class TableDataAdapter {
  /**
   * 转换设备遥测数据为表格数据格式
   */
  transformDeviceData(deviceSources: any[], rawData: any[]): TableRowData[] {
    const processedData: TableRowData[] = []
    
    rawData.forEach(item => {
      // 根据数据源配置查找对应的指标名称
      const source = deviceSources.find(s => 
        s.deviceId === item.deviceId && s.metricsId === item.key
      )
      
      processedData.push({
        timestamp: item.x || item.time,
        deviceId: item.deviceId,
        metricsId: item.key,
        metricsName: source?.metricsName || item.key,
        value: item.y || item.value
      })
    })
    
    return processedData
  }
  
  /**
   * 按时间合并多指标数据
   */
  mergeByTime(data: TableRowData[]): Record<string, any>[] {
    const timeMap = new Map()
    
    data.forEach(item => {
      const timestamp = item.timestamp
      
      if (!timeMap.has(timestamp)) {
        timeMap.set(timestamp, {
          timestamp,
          time: timestamp
        })
      }
      
      const row = timeMap.get(timestamp)
      row[item.metricsId] = item.value
      row[`${item.metricsId}_name`] = item.metricsName
    })
    
    return Array.from(timeMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
  }
}
```

## 💻 具体实现步骤

### Phase 1: 基础组件开发（第1-2周）

1. **创建组件结构**
```bash
src/card2.1/components/data-table/
├── index.ts                    # 组件定义和导出  
├── DataTable.vue               # 核心表格组件
├── ConfigPanel.vue             # 配置面板
├── types.ts                    # 类型定义
├── adapters/
│   └── table-data-adapter.ts   # 数据适配器
└── hooks/
    └── useTableConfig.ts       # 表格配置逻辑
```

2. **实现核心功能**
- Naive UI DataTable 集成
- 动态列生成和数据合并
- 分页和排序功能

### Phase 2: 配置系统开发（第3周）

1. **完善配置面板**
- 表格样式配置
- 分页选项配置
- 列自定义配置

2. **数据格式化**
- 时间格式选择
- 数值格式化选项
- 自定义格式器支持

### Phase 3: 性能优化和测试（第4周）

1. **性能优化**
- 虚拟滚动支持
- 数据更新防抖
- 内存使用优化

2. **测试验证**
- 大数据量测试
- 分页功能测试
- 响应式布局测试

## ✅ 测试验证方案

### 功能测试
- [ ] 多设备多指标数据正确合并显示
- [ ] 时间排序和格式化正确
- [ ] 分页功能正常工作
- [ ] 列配置和自定义格式生效
- [ ] 空数据状态显示正确

### 性能测试  
- [ ] 1000+ 行数据渲染性能
- [ ] 内存使用情况监控
- [ ] 分页切换响应时间
- [ ] 数据更新频率测试

### 响应式测试
- [ ] 不同屏幕尺寸适配
- [ ] 移动端触摸操作
- [ ] 表格横向滚动
- [ ] 主题切换适配

## 📈 迁移收益

### 功能增强
- **配置丰富**: 从无配置 → 完整配置系统
- **格式灵活**: 固定格式 → 多种时间和数值格式
- **主题适配**: 无主题支持 → 完整明暗主题系统

### 性能提升
- **渲染性能**: 原生分页 → 虚拟滚动 + 优化渲染
- **内存使用**: 全量数据 → 分页数据 + 内存优化
- **响应速度**: 同步处理 → 防抖 + 异步优化

### 开发体验
- **类型安全**: JavaScript → 完整 TypeScript 类型系统
- **代码维护**: 复杂逻辑 → 模块化架构
- **测试覆盖**: 无测试 → 完整测试用例

---

**总结**: 数据表格组件通过 Card 2.1 重构，将获得完整的配置系统、更好的性能表现和主题适配能力，显著提升用户体验和开发效率。