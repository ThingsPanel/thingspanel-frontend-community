<template>
  <div class="table-card" :style="cardStyle">
    <div v-if="config.showTitle?.value" class="table-header">
      <h3 class="table-title">{{ config.title?.value || '数据表格' }}</h3>
      <div class="table-actions">
        <button
          v-if="config.allowExport?.value"
          class="action-btn"
          title="导出数据"
          @click="exportData"
        >
          <i class="fa fa-download"></i>
        </button>
        <button
          v-if="config.allowRefresh?.value"
          class="action-btn"
          title="刷新数据"
          @click="refreshData"
        >
          <i class="fa fa-sync"></i>
        </button>
      </div>
    </div>

    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <i class="fa fa-spinner fa-spin"></i>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <i class="fa fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="refreshData">重试</button>
      </div>

      <div v-else-if="!tableData.length" class="empty-state">
        <i class="fa fa-table"></i>
        <p>暂无数据</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :style="getColumnStyle(column)"
                :class="{ 'sortable': column.sortable }"
                @click="handleSort(column)"
              >
                <span>{{ column.title }}</span>
                <i
                  v-if="column.sortable"
                  class="sort-icon"
                  :class="getSortIconClass(column.key)"
                ></i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in paginatedData"
              :key="row[rowKey] || index"
              :class="getRowClass(row, index)"
              @click="handleRowClick(row, index)"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                :style="getColumnStyle(column)"
              >
                <div class="cell-content">
                  <component
                    :is="column.render"
                    v-if="column.render"
                    :value="row[column.key]"
                    :row="row"
                    :index="index"
                  />
                  <span v-else>{{ formatCellValue(row[column.key], column) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="config.showPagination?.value && totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <i class="fa fa-chevron-left"></i>
        </button>
        
        <span class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </span>
        
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <i class="fa fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';

interface Column {
  key: string
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  format?: 'number' | 'currency' | 'date' | 'datetime'
  render?: any
}

const props = defineProps<{
  config: {
    title?: { value: string }
    showTitle?: { value: boolean }
    allowExport?: { value: boolean }
    allowRefresh?: { value: boolean }
    showPagination?: { value: boolean }
    pageSize?: { value: number }
    dataSource?: { value: any[] }
    columns?: { value: Column[] }
    rowKey?: { value: string }
    stripedRows?: { value: boolean }
    hoverEffect?: { value: boolean }
    borderStyle?: { value: 'none' | 'horizontal' | 'vertical' | 'all' }
    backgroundColor?: { value: string }
    headerBackgroundColor?: { value: string }
  }
}>()

const emit = defineEmits<{
  rowClick: [row: any, index: number]
  sort: [column: string, direction: 'asc' | 'desc']
  export: [data: any[]]
  refresh: []
}>()

// 状态
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const sortColumn = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')

// 计算属性
const tableData = computed(() => props.config.dataSource?.value || [])
const columns = computed(() => props.config.columns?.value || [])
const rowKey = computed(() => props.config.rowKey?.value || 'id')
const pageSize = computed(() => props.config.pageSize?.value || 10)

const cardStyle = computed(() => ({
  backgroundColor: props.config.backgroundColor?.value || '#ffffff'
}))

// 排序后的数据
const sortedData = computed(() => {
  if (!sortColumn.value) return tableData.value

  return [...tableData.value].sort((a, b) => {
    const aValue = a[sortColumn.value]
    const bValue = b[sortColumn.value]
    
    let result = 0
    if (aValue < bValue) result = -1
    else if (aValue > bValue) result = 1
    
    return sortDirection.value === 'desc' ? -result : result
  })
})

// 分页数据
const paginatedData = computed(() => {
  if (!props.config.showPagination?.value) return sortedData.value
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(sortedData.value.length / pageSize.value)
})

// 方法
const handleSort = (column: Column) => {
  if (!column.sortable) return

  if (sortColumn.value === column.key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column.key
    sortDirection.value = 'asc'
  }

  emit('sort', column.key, sortDirection.value)
}

const getSortIconClass = (columnKey: string) => {
  if (sortColumn.value !== columnKey) return 'fa fa-sort'
  return sortDirection.value === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down'
}

const getColumnStyle = (column: Column) => ({
  width: column.width ? `${column.width}px` : 'auto',
  textAlign: column.align || 'left'
})

const getRowClass = (row: any, index: number) => ({
  'striped': props.config.stripedRows?.value && index % 2 === 1,
  'hoverable': props.config.hoverEffect?.value
})

const formatCellValue = (value: any, column: Column) => {
  if (value === null || value === undefined) return '-'

  switch (column.format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value
    case 'currency':
      return typeof value === 'number' ? `¥${value.toFixed(2)}` : value
    case 'date':
      return value instanceof Date ? value.toLocaleDateString() : new Date(value).toLocaleDateString()
    case 'datetime':
      return value instanceof Date ? value.toLocaleString() : new Date(value).toLocaleString()
    default:
      return value
  }
}

const handleRowClick = (row: any, index: number) => {
  emit('rowClick', row, index)
}

const goToPage = (page: number) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

const exportData = () => {
  const dataToExport = sortedData.value
  emit('export', dataToExport)
  
  // 默认导出为CSV
  const csv = convertToCSV(dataToExport)
  downloadCSV(csv, `${props.config.title?.value || 'table-data'}.csv`)
}

const convertToCSV = (data: any[]) => {
  if (!data.length) return ''
  
  const headers = columns.value.map(col => col.title).join(',')
  const rows = data.map(row => 
    columns.value.map(col => {
      const value = row[col.key]
      return typeof value === 'string' ? `"${value}"` : value
    }).join(',')
  )
  
  return [headers, ...rows].join('\n')
}

const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const refreshData = () => {
  loading.value = true
  error.value = ''
  
  emit('refresh')
  
  // 模拟加载
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

// 监听数据变化
watch(() => props.config.dataSource?.value, () => {
  currentPage.value = 1
  sortColumn.value = ''
})
</script>

<style scoped>
.table-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.table-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 12px;
}

.loading-state i {
  font-size: 24px;
}

.error-state i {
  font-size: 24px;
  color: #ff4d4f;
}

.retry-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
}

.table-wrapper {
  flex: 1;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background: #fafafa;
  padding: 12px 16px;
  font-weight: 500;
  color: #262626;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  background: #f0f0f0;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #595959;
}

.data-table tr.striped {
  background: #fafafa;
}

.data-table tr.hoverable:hover {
  background: #e6f7ff;
  cursor: pointer;
}

.sort-icon {
  margin-left: 8px;
  opacity: 0.6;
}

.cell-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #fafafa;
}

.page-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: #40a9ff;
  color: #40a9ff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}
</style>