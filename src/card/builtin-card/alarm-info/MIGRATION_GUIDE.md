# Alarm Info 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `alarm-info`
- **组件名称**: 告警信息列表
- **文件路径**: `src/card/builtin-card/alarm-info/`
- **组件类型**: 数据表格组件
- **当前状态**: ✅ 代码质量良好，使用Naive UI规范

### 功能描述
显示最新的系统告警信息列表，包含告警名称、状态、内容、时间等信息。支持状态标签显示、时间格式化、数据分页，并提供跳转到详细告警页面的功能。

## 🔧 技术分析

### 使用的API接口
```typescript
// 主要API
alarmHistory(params: {
  page: number           // 页码
  page_size: number     // 每页数量
  alarm_status: string  // 告警状态筛选
  start_time: string    // 开始时间
  end_time: string      // 结束时间
}): Promise<{
  data: {
    list: Array<{
      id: string          // 告警ID
      create_at: string   // 创建时间
      name: string        // 告警名称
      content: string     // 告警内容
      alarm_status: 'H' | 'M' | 'L' | 'N'  // 告警级别
    }>
  }
}>
```

### 技术依赖
- **Vue 3**: Composition API, `<script setup>`
- **UI组件库**: Naive UI (NDataTable, NTag, NButton, NTooltip)
- **路由**: Vue Router 4 (页面跳转)
- **时间处理**: dayjs 时间格式化
- **类型系统**: TypeScript interface定义
- **国际化**: `$t()` 翻译函数

### 核心功能特性
1. **数据表格**: 使用NDataTable展示告警列表
2. **状态标签**: 不同告警级别用不同颜色的标签显示
3. **文本省略**: 长文本自动省略并支持tooltip显示完整内容
4. **时间格式化**: 统一的时间显示格式
5. **页面跳转**: 点击"查看全部"跳转到告警详情页面
6. **响应式设计**: 表格自适应容器大小

## ❌ 存在问题

### 代码质量问题
1. **国际化使用方式**:
   ```typescript
   // ❌ 问题: 直接导入$t而非使用hook
   import { $t } from '@/locales'
   
   // ✅ 建议: 使用Vue 3推荐的hook方式
   import { useI18n } from 'vue-i18n'
   const { t } = useI18n()
   ```

2. **错误处理简化**:
   ```typescript
   // ❌ 问题: 错误处理过于简单
   } catch (error) {
     console.error('Failed to fetch alarm history:', error)
     alarmList.value = []
   }
   
   // ✅ 建议: 更完善的错误处理
   } catch (error) {
     console.error('Failed to fetch alarm history:', error)
     alarmList.value = []
     // 显示用户友好的错误提示
     message.error(t('common.loadError'))
   }
   ```

3. **加载状态管理**:
   ```typescript
   // ❌ 问题: loading状态在template中未使用
   const loading = ref(true)
   
   // ✅ 建议: 在UI中显示加载状态
   <n-data-table :loading="loading" />
   ```

### 功能缺失
1. **数据刷新**: 缺少手动刷新功能
2. **实时更新**: 没有自动刷新机制
3. **筛选功能**: 无法按告警级别筛选
4. **分页支持**: API支持分页但组件未实现
5. **详情查看**: 无法查看单个告警的详细信息

### 用户体验问题
1. **空状态处理**: 无数据时显示不够友好
2. **表格交互**: 行点击、选择等交互缺失
3. **移动端适配**: 表格在小屏幕上显示可能有问题

## 🔄 迁移建议

### 迁移策略: 独立组件优化升级
**建议保留为独立组件，但进行功能增强和体验优化**

#### 原因分析
1. **功能独特**: 告警列表具有特定的业务逻辑和显示需求
2. **复用价值**: 告警信息在多个场景下都会用到
3. **扩展空间**: 可以发展为完整的告警管理组件库

#### 优化方向
1. **功能完善**: 添加筛选、搜索、分页等功能
2. **实时更新**: 支持WebSocket实时推送新告警
3. **交互增强**: 支持行选择、批量操作等
4. **移动优化**: 改进移动端显示效果

## 🚀 具体迁移步骤

### Phase 1: 创建Card 2.1数据列表组件

#### 1.1 组件定义
```typescript
// src/card2.1/components/data-list/component-definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'

export const dataListDefinition: ComponentDefinition = {
  type: 'DataList',
  name: '数据列表',
  description: '显示结构化数据的表格或列表组件',
  category: 'data-display',
  
  // 数据需求
  dataRequirement: {
    fields: {
      listData: {
        type: 'array',
        arrayItemType: 'object',
        required: true,
        description: '列表数据数组'
      },
      pagination: {
        type: 'object',
        required: false,
        description: '分页信息',
        properties: {
          total: { type: 'number' },
          current: { type: 'number' },
          pageSize: { type: 'number' }
        }
      }
    }
  },
  
  // 配置选项
  config: {
    title: {
      type: 'string',
      default: '数据列表',
      label: '组件标题'
    },
    displayMode: {
      type: 'select',
      options: [
        { label: '表格模式', value: 'table' },
        { label: '列表模式', value: 'list' },
        { label: '卡片模式', value: 'card' }
      ],
      default: 'table',
      label: '显示模式'
    },
    columns: {
      type: 'array',
      label: '列配置',
      itemType: 'object',
      default: []
    },
    showPagination: {
      type: 'boolean',
      default: true,
      label: '显示分页'
    },
    pageSize: {
      type: 'number',
      default: 10,
      label: '每页显示数量'
    },
    enableSearch: {
      type: 'boolean',
      default: false,
      label: '启用搜索'
    },
    enableRefresh: {
      type: 'boolean',
      default: true,
      label: '启用刷新'
    },
    autoRefreshInterval: {
      type: 'number',
      default: 0,
      label: '自动刷新间隔(秒，0为禁用)'
    }
  }
}
```

#### 1.2 组件实现
```vue
<!-- src/card2.1/components/data-list/DataList.vue -->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useCard2DataBinding } from '@/card2.1/hooks/useCard2DataBinding'
import type { DataTableColumns } from 'naive-ui'

interface Props {
  config: {
    title: string
    displayMode: 'table' | 'list' | 'card'
    columns: Array<{
      key: string
      title: string
      width?: number
      render?: string
      ellipsis?: boolean
      tooltip?: boolean
    }>
    showPagination: boolean
    pageSize: number
    enableSearch: boolean
    enableRefresh: boolean
    autoRefreshInterval: number
    actionButton?: {
      text: string
      route: string
    }
  }
  dataBinding?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '数据列表',
    displayMode: 'table',
    columns: [],
    showPagination: true,
    pageSize: 10,
    enableSearch: false,
    enableRefresh: true,
    autoRefreshInterval: 0
  })
})

const emit = defineEmits<{
  rowClick: [row: any]
  refresh: []
}>()

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

// Card 2.1 数据绑定
const { data, loading, error, refresh } = useCard2DataBinding({
  componentType: 'DataList',
  dataBinding: props.dataBinding
})

// 本地状态
const searchText = ref('')
const currentPage = ref(1)
const autoRefreshTimer = ref<number | null>(null)

// 处理过的数据
const processedData = computed(() => {
  let listData = data.value?.listData || []
  
  // 搜索过滤
  if (props.config.enableSearch && searchText.value.trim()) {
    const search = searchText.value.toLowerCase().trim()
    listData = listData.filter((item: any) => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(search)
      )
    )
  }
  
  // 分页处理
  if (props.config.showPagination) {
    const start = (currentPage.value - 1) * props.config.pageSize
    const end = start + props.config.pageSize
    return listData.slice(start, end)
  }
  
  return listData
})

// 表格列配置
const tableColumns = computed<DataTableColumns>(() => {
  return props.config.columns.map(col => ({
    key: col.key,
    title: t(col.title),
    width: col.width,
    ellipsis: col.ellipsis ? { tooltip: col.tooltip } : false,
    render: col.render ? createRenderer(col.render) : undefined
  }))
})

// 创建渲染函数
const createRenderer = (renderType: string) => {
  return (row: any) => {
    switch (renderType) {
      case 'status-tag':
        return h(NTag, {
          type: getStatusType(row.alarm_status),
          size: 'small',
          round: true
        }, () => getStatusLabel(row.alarm_status))
      
      case 'datetime':
        return formatDateTime(row[col.key])
      
      default:
        return row[col.key]
    }
  }
}

// 状态相关辅助函数
const getStatusType = (status: string) => {
  const statusMap = {
    'H': 'error',    // 高级告警
    'M': 'warning',  // 中级告警  
    'L': 'info',     // 低级告警
    'N': 'success'   // 正常
  }
  return statusMap[status as keyof typeof statusMap] || 'default'
}

const getStatusLabel = (status: string) => {
  const labelMap = {
    'H': t('common.highAlarm'),
    'M': t('common.intermediateAlarm'),
    'L': t('common.lowAlarm'),
    'N': t('common.normal')
  }
  return labelMap[status as keyof typeof labelMap] || status
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString()
}

// 刷新数据
const handleRefresh = async () => {
  try {
    await refresh()
    message.success(t('common.refreshSuccess'))
    emit('refresh')
  } catch (error) {
    message.error(t('common.refreshError'))
  }
}

// 行点击处理
const handleRowClick = (row: any) => {
  emit('rowClick', row)
}

// 页面操作
const handlePageChange = (page: number) => {
  currentPage.value = page
}

// 操作按钮点击
const handleActionClick = () => {
  if (props.config.actionButton?.route) {
    router.push(props.config.actionButton.route)
  }
}

// 自动刷新
const setupAutoRefresh = () => {
  if (props.config.autoRefreshInterval > 0) {
    autoRefreshTimer.value = window.setInterval(
      handleRefresh, 
      props.config.autoRefreshInterval * 1000
    )
  }
}

const clearAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

onMounted(() => {
  setupAutoRefresh()
})

onUnmounted(() => {
  clearAutoRefresh()
})
</script>

<template>
  <div class="data-list-container">
    <!-- 头部区域 -->
    <div class="header">
      <div class="title-section">
        <h3 class="title">{{ t(config.title) }}</h3>
        
        <!-- 操作按钮 -->
        <n-button 
          v-if="config.actionButton"
          text 
          size="small" 
          type="primary"
          @click="handleActionClick"
        >
          {{ t(config.actionButton.text) }}
        </n-button>
      </div>
      
      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 搜索框 -->
        <n-input
          v-if="config.enableSearch"
          v-model:value="searchText"
          :placeholder="t('common.search')"
          size="small"
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>
        
        <!-- 刷新按钮 -->
        <n-button
          v-if="config.enableRefresh"
          size="small"
          :loading="loading"
          @click="handleRefresh"
        >
          <template #icon>
            <n-icon :component="RefreshOutline" />
          </template>
        </n-button>
      </div>
    </div>
    
    <!-- 数据区域 -->
    <div class="content">
      <!-- 表格模式 -->
      <n-data-table
        v-if="config.displayMode === 'table'"
        :columns="tableColumns"
        :data="processedData"
        :loading="loading"
        :bordered="false"
        striped
        size="small"
        flex-height
        class="data-table"
        @row-click="handleRowClick"
      />
      
      <!-- 错误状态 -->
      <div v-if="error" class="error-container">
        <n-result status="error" :title="t('common.loadError')">
          <template #footer>
            <n-button @click="handleRefresh">{{ t('common.retry') }}</n-button>
          </template>
        </n-result>
      </div>
      
      <!-- 空数据状态 -->
      <div v-if="!loading && !error && !processedData.length" class="empty-container">
        <n-empty :description="t('common.noData')" />
      </div>
    </div>
    
    <!-- 分页器 -->
    <div v-if="config.showPagination && processedData.length" class="pagination">
      <n-pagination
        v-model:page="currentPage"
        :page-size="config.pageSize"
        :item-count="(data?.listData || []).length"
        size="small"
        show-size-picker
        show-quick-jumper
      />
    </div>
  </div>
</template>

<style scoped>
.data-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
}

.content {
  flex: 1;
  overflow: hidden;
}

.data-table {
  height: 100%;
}

.error-container,
.empty-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .toolbar {
    justify-content: space-between;
  }
  
  .search-input {
    width: auto;
    flex: 1;
  }
}
</style>
```

### Phase 2: 告警信息预设配置

#### 2.1 数据源配置
```typescript
// src/card2.1/components/data-list/data-sources/alarm-history.ts
import { alarmHistory } from '@/service/api/alarm'
import type { DataSourceConfig } from '@/card2.1/core/data-binding/types'

export const alarmHistoryDataSource: DataSourceConfig = {
  type: 'api',
  name: '告警历史数据',
  description: '获取系统告警历史记录',
  
  config: {
    endpoint: () => alarmHistory({
      page: 1,
      page_size: 10,
      alarm_status: '',
      start_time: '',
      end_time: ''
    }),
    
    // 数据转换
    transform: (response: any) => ({
      listData: response?.data?.list || [],
      pagination: {
        total: response?.data?.total || 0,
        current: response?.data?.current_page || 1,
        pageSize: response?.data?.page_size || 10
      }
    }),
    
    // 错误处理
    errorHandler: (error: any) => {
      console.error('获取告警历史失败:', error)
      return { 
        listData: [],
        pagination: { total: 0, current: 1, pageSize: 10 }
      }
    }
  }
}
```

#### 2.2 预设配置
```typescript
// src/card2.1/components/data-list/presets/alarm-info.ts
import type { ComponentPreset } from '@/card2.1/core/types'
import { alarmHistoryDataSource } from '../data-sources/alarm-history'

export const alarmInfoPreset: ComponentPreset = {
  id: 'alarm-info-list',
  name: '告警信息',
  description: '显示最新的系统告警信息列表',
  
  config: {
    title: 'card.alarmInfo.title',
    displayMode: 'table',
    showPagination: false,  // 只显示最新几条
    pageSize: 10,
    enableSearch: false,
    enableRefresh: true,
    autoRefreshInterval: 60,  // 60秒自动刷新
    
    // 操作按钮配置
    actionButton: {
      text: 'card.alarmInfo.viewAll',
      route: '/alarm/warning-message'
    },
    
    // 列配置
    columns: [
      {
        key: 'name',
        title: 'generate.alarm-name',
        width: 170,
        ellipsis: true,
        tooltip: true
      },
      {
        key: 'alarm_status', 
        title: 'generate.alarm-status',
        width: 90,
        render: 'status-tag'
      },
      {
        key: 'content',
        title: 'generate.alarm-content',
        ellipsis: true,
        tooltip: true
      },
      {
        key: 'create_at',
        title: 'common.alarm_time',
        width: 180,
        render: 'datetime'
      }
    ]
  },
  
  // 数据绑定配置
  dataBinding: {
    dataSources: [alarmHistoryDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 60000  // 1分钟刷新
    }
  },
  
  // 布局配置
  defaultLayout: {
    canvas: { width: 600, height: 400 },
    gridstack: { w: 6, h: 4, minH: 3, minW: 4 }
  }
}
```

## ✅ 迁移验证

### 功能验证清单
- [ ] **数据获取**: API调用正常，告警数据正确显示
- [ ] **状态标签**: 不同告警级别标签颜色和文本正确
- [ ] **时间格式**: 创建时间显示格式符合用户习惯
- [ ] **文本省略**: 长文本正确省略并支持tooltip
- [ ] **页面跳转**: "查看全部"按钮正确跳转到详情页
- [ ] **响应式**: 不同屏幕尺寸下表格显示正常
- [ ] **加载状态**: 数据加载时显示loading效果
- [ ] **错误处理**: 网络错误时显示友好提示
- [ ] **自动刷新**: 定时刷新功能正常工作
- [ ] **国际化**: 所有文本支持多语言切换

### 增强功能验证
- [ ] **搜索功能**: 可以搜索告警名称和内容
- [ ] **手动刷新**: 刷新按钮功能正常
- [ ] **行点击**: 点击行可以查看详细信息
- [ ] **分页功能**: 大量数据时分页显示正常
- [ ] **空状态**: 无数据时显示友好提示

## 📚 扩展建议

### 功能增强
1. **实时推送**: 集成WebSocket，新告警实时推送到列表
2. **快速操作**: 支持直接在列表中确认、忽略告警
3. **批量操作**: 支持批量选择和批量处理告警
4. **筛选功能**: 按告警级别、时间范围筛选

### 技术优化  
1. **虚拟滚动**: 大量告警数据时的性能优化
2. **离线缓存**: 支持离线查看历史告警
3. **数据导出**: 支持导出告警数据为Excel
4. **可访问性**: 改进屏幕阅读器支持

这个组件的迁移重点在于功能增强和用户体验优化，为用户提供更强大的告警管理能力。