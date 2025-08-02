<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick, h } from 'vue'
import { NDataTable, NButton, NSpace, NDropdown, NIcon } from 'naive-ui'
import { DownloadOutline, RefreshOutline } from '@vicons/ionicons5'
import moment from 'moment'
import type { TableConfig } from './index'
import type { ICardData, IDataNode } from '../../../core/types'
import { telemetryDataHistoryList } from '@/service/api/device'
import { createLogger } from '@/utils/logger'
// import { $t } from '@/locales' // 暂时注释掉未使用的导入

const logger = createLogger('TableComponent')

interface Props {
  config: TableConfig
  data?: IDataNode[]
  card?: ICardData
}

interface Emits {
  (_e: 'data-change', _data: any[]): void
  (_e: 'error', _error: Error): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const tableData = ref<any[]>([])
const loading = ref(false)
const containerRef = ref<HTMLElement>()
const autoRefreshTimer = ref<NodeJS.Timeout>()

// 分页配置
const pagination = ref({
  page: 1,
  pageSize: props.config.pagination?.pageSize || 10,
  itemCount: 0,
  showSizePicker: props.config.pagination?.showSizePicker ?? true,
  pageSizes: props.config.pagination?.pageSizes || [10, 15, 20, 50],
  showQuickJumper: props.config.pagination?.showQuickJumper ?? false
})

// 计算属性
const displayData = computed(() => {
  if (!props.config.pagination?.enabled) {
    return tableData.value
  }
  
  const startIndex = (pagination.value.page - 1) * pagination.value.pageSize
  const endIndex = startIndex + pagination.value.pageSize
  return tableData.value.slice(startIndex, endIndex)
})

const columns = computed(() => {
  const cols: any[] = []
  
  // 时间列
  if (props.config.columns?.timeColumn?.show !== false) {
    cols.push({
      title: props.config.columns?.timeColumn?.title || '时间',
      key: 'time',
      width: props.config.columns?.timeColumn?.width || 180,
      fixed: props.config.columns?.timeColumn?.fixed || false,
      sorter: props.config.table?.sortable ? (row1: any, row2: any) => {
        return new Date(row1.time).getTime() - new Date(row2.time).getTime()
      } : false,
      render: (row: any) => {
        const format = props.config.columns?.timeColumn?.format || 'YYYY-MM-DD HH:mm:ss'
        return moment(row.time).format(format)
      }
    })
  }
  
  // 数据列
  if (props.config.columns?.dataColumns?.autoGenerate && props.card?.dataSource?.deviceSource) {
    props.card.dataSource.deviceSource
      .filter(source => source.deviceId && source.metricsId)
      .forEach(source => {
        cols.push({
          title: source.metricsName || source.metricsId,
          key: source.metricsId!,
          width: props.config.columns?.dataColumns?.defaultWidth || 120,
          sorter: props.config.table?.sortable ? (row1: any, row2: any) => {
            const val1 = parseFloat(row1[source.metricsId!]) || 0
            const val2 = parseFloat(row2[source.metricsId!]) || 0
            return val1 - val2
          } : false,
          render: (row: any) => {
            const value = row[source.metricsId!]
            if (value === undefined || value === null) return ''
            
            // 数值格式化
            if (typeof value === 'number' && props.config.columns?.dataColumns?.numberFormat) {
              const format = props.config.columns.dataColumns.numberFormat
              let formatted = value.toFixed(format.precision || 2)
              
              if (format.thousandsSeparator) {
                formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              
              if (format.unit) {
                formatted += ` ${format.unit}`
              }
              
              return formatted
            }
            
            return value.toString()
          }
        })
      })
  }
  
  return cols
})

const tableStyle = computed(() => {
  const style = props.config.style || {}
  return {
    '--header-bg-color': style.headerBgColor || '#f5f5f5',
    '--header-text-color': style.headerTextColor || '#333333',
    '--row-bg-color': style.rowBgColor || '#ffffff',
    '--row-text-color': style.rowTextColor || '#333333',
    '--striped-color': style.stripedColor || '#fafafa',
    '--border-color': style.borderColor || '#e0e0e0',
    '--font-size': `${style.fontSize || 14}px`,
    '--row-height': `${style.rowHeight || 40}px`
  }
})

const exportOptions = computed(() => {
  if (!props.config.export?.enabled) return []
  
  return (props.config.export.formats || ['csv']).map(format => ({
    label: format.toUpperCase(),
    key: format,
    icon: () => h(NIcon, null, { default: () => h(DownloadOutline) })
  }))
})

// 数据处理方法
const processData = (data: any[]) => {
  if (!data || !Array.isArray(data)) return []
  
  // 按时间分组合并数据
  const timeMap = new Map()
  data.forEach(({ x, y, key }) => {
    if (!timeMap.has(x)) {
      timeMap.set(x, { time: x })
    }
    timeMap.get(x)[key] = y
  })
  
  // 转换为数组
  let result = Array.from(timeMap.values())
  
  // 应用排序
  if (props.config.data?.sortField && props.config.data?.sortOrder) {
    result.sort((a, b) => {
      const aVal = a[props.config.data!.sortField!]
      const bVal = b[props.config.data!.sortField!]
      const order = props.config.data!.sortOrder === 'asc' ? 1 : -1
      
      if (props.config.data!.sortField === 'time') {
        return (new Date(aVal).getTime() - new Date(bVal).getTime()) * order
      }
      
      return (aVal > bVal ? 1 : -1) * order
    })
  }
  
  // 限制最大行数
  if (props.config.data?.maxRows) {
    result = result.slice(0, props.config.data.maxRows)
  }
  
  return result
}

// 数据获取方法
const fetchData = async () => {
  if (!props.card?.dataSource?.deviceSource) return
  
  loading.value = true
  
  try {
    const deviceSources = props.card.dataSource.deviceSource.filter(
      source => source.deviceId && source.metricsId
    )
    
    if (deviceSources.length === 0) {
      tableData.value = []
      return
    }
    
    const promises = deviceSources.map(source => {
      const params = {
        device_id: source.deviceId!,
        key: source.metricsId!,
        aggregate_window: props.config.data?.aggregateWindow || 'no_aggregate',
        aggregate_function: source.aggregate_function || props.config.data?.aggregateFunction || 'avg',
        time_range: props.config.data?.timeRange || 'last_1h'
      }
      
      return telemetryDataHistoryList(params).then(res =>
        res.data.map((item: any) => ({
          ...item,
          key: source.metricsId
        }))
      )
    })
    
    const results = await Promise.all(promises)
    const combinedData = results.flat()
    const processedData = processData(combinedData)
    
    tableData.value = processedData
    pagination.value.itemCount = processedData.length
    
    emit('data-change', processedData)
  } catch (error) {
    logger.error('Error fetching table data:', error)
    emit('error', error as Error)
  } finally {
    loading.value = false
  }
}

// 设置数据（外部调用）
const setSeries = (data: any[]) => {
  if (data && Array.isArray(data)) {
    const processedData = processData(data)
    tableData.value = processedData
    pagination.value.itemCount = processedData.length
    emit('data-change', processedData)
  }
}

// 刷新数据
const refreshData = async () => {
  await fetchData()
}

// 分页处理
const handlePageChange = (page: number) => {
  pagination.value.page = page
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
}

// 导出数据
const handleExport = (format: string) => {
  const filename = props.config.export?.filename || 'table_data'
  const data = tableData.value
  
  if (format === 'csv') {
    exportToCSV(data, filename)
  } else if (format === 'excel') {
    exportToExcel(data, filename)
  } else if (format === 'json') {
    exportToJSON(data, filename)
  }
}

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return
  
  const headers = columns.value.map(col => col.title).join(',')
  const rows = data.map(row => 
    columns.value.map(col => {
      const value = col.key === 'time' 
        ? moment(row.time).format(props.config.columns?.timeColumn?.format || 'YYYY-MM-DD HH:mm:ss')
        : row[col.key] || ''
      return `"${value}"`
    }).join(',')
  )
  
  const csvContent = [headers, ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.json`
  link.click()
}

const exportToExcel = (data: any[], filename: string) => {
  // 简化的Excel导出，实际项目中可能需要使用专门的库如xlsx
  exportToCSV(data, filename)
}

// 自动刷新设置
const setupAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
  }
  
  if (props.config.autoRefresh?.enabled && props.config.autoRefresh.interval) {
    autoRefreshTimer.value = setInterval(() => {
      refreshData()
    }, props.config.autoRefresh.interval * 1000)
  }
}

// WebSocket数据更新
const updateData = (newData: any) => {
  if (newData && typeof newData === 'object') {
    // 更新现有数据或添加新数据
    const existingIndex = tableData.value.findIndex(
      item => item.time === newData.time
    )
    
    if (existingIndex >= 0) {
      tableData.value[existingIndex] = { ...tableData.value[existingIndex], ...newData }
    } else {
      tableData.value.unshift(newData)
      
      // 保持最大行数限制
      if (props.config.data?.maxRows && tableData.value.length > props.config.data.maxRows) {
        tableData.value = tableData.value.slice(0, props.config.data.maxRows)
      }
    }
    
    pagination.value.itemCount = tableData.value.length
    emit('data-change', tableData.value)
  }
}

// 监听器
watch(
  () => props.config,
  () => {
    setupAutoRefresh()
    nextTick(() => {
      fetchData()
    })
  },
  { deep: true }
)

watch(
  () => props.card?.dataSource,
  () => {
    nextTick(() => {
      fetchData()
    })
  },
  { deep: true }
)

watch(
  () => props.data,
  (newData) => {
    if (newData && Array.isArray(newData)) {
      setSeries(newData)
    }
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  setupAutoRefresh()
  fetchData()
})

onBeforeUnmount(() => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
  }
})

// 暴露方法给父组件
defineExpose({
  setSeries,
  refreshData,
  updateData,
  exportData: handleExport
})
</script>

<template>
  <div 
    ref="containerRef" 
    class="table-container"
    :style="tableStyle"
  >
    <!-- 工具栏 -->
    <div v-if="config.export?.enabled || config.autoRefresh?.enabled" class="table-toolbar">
      <NSpace justify="end">
        <!-- 刷新按钮 -->
        <NButton 
          v-if="config.autoRefresh?.enabled"
          size="small" 
          :loading="loading"
          @click="refreshData"
        >
          <template #icon>
            <NIcon><RefreshOutline /></NIcon>
          </template>
          刷新
        </NButton>
        
        <!-- 导出按钮 -->
        <NDropdown 
          v-if="config.export?.enabled && exportOptions.length > 0"
          :options="exportOptions"
          @select="handleExport"
        >
          <NButton size="small">
            <template #icon>
              <NIcon><DownloadOutline /></NIcon>
            </template>
            导出
          </NButton>
        </NDropdown>
      </NSpace>
    </div>
    
    <!-- 表格 -->
    <NDataTable
      :columns="columns"
      :data="displayData"
      :loading="loading"
      :bordered="config.table?.bordered ?? true"
      :striped="config.table?.striped ?? true"
      :size="config.table?.size || 'medium'"
      :max-height="config.table?.maxHeight || 400"
      :pagination="config.pagination?.enabled ? pagination : false"
      :remote="config.pagination?.enabled"
      class="data-table"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
  </div>
</template>

<style scoped>
.table-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: var(--font-size);
  color: var(--row-text-color);
}

.table-toolbar {
  padding: 8px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.data-table {
  flex: 1;
  overflow: hidden;
}

:deep(.n-data-table) {
  height: 100%;
}

:deep(.n-data-table-wrapper) {
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
}

:deep(.n-data-table-thead) {
  background-color: var(--header-bg-color);
  color: var(--header-text-color);
}

:deep(.n-data-table-tbody .n-data-table-tr) {
  background-color: var(--row-bg-color);
  color: var(--row-text-color);
  height: var(--row-height);
}

:deep(.n-data-table-tbody .n-data-table-tr:nth-child(even)) {
  background-color: var(--striped-color);
}

:deep(.n-data-table-td) {
  border-color: var(--border-color);
  padding: 8px 12px;
}

:deep(.n-data-table-th) {
  border-color: var(--border-color);
  padding: 8px 12px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-container {
    font-size: 12px;
  }
  
  :deep(.n-data-table-td),
  :deep(.n-data-table-th) {
    padding: 6px 8px;
  }
  
  .table-toolbar {
    padding: 4px 0;
  }
}

/* 滚动条样式 */
:deep(.n-data-table-wrapper)::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

:deep(.n-data-table-wrapper)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(.n-data-table-wrapper)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

:deep(.n-data-table-wrapper)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 加载状态 */
:deep(.n-data-table--loading) {
  opacity: 0.6;
}

/* 空状态 */
:deep(.n-data-table--empty) {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>