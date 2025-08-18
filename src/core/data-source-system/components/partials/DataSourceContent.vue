<!--
  数据源内容组件
  展示数据源的数据项列表和管理功能
-->
<template>
  <div class="data-source-content">
    <n-space vertical :size="16">
      <!-- 数据项管理区域 -->
      <div class="data-items-section">
        <n-space justify="space-between" align="center" style="margin-bottom: 12px">
          <n-text strong style="font-size: 13px">数据项管理</n-text>
          <n-button 
            type="dashed" 
            size="small" 
            @click="handleAddDataItem"
          >
            <template #icon>
              <n-icon size="14">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </n-icon>
            </template>
            添加数据项
          </n-button>
        </n-space>

        <!-- 数据项列表 -->
        <div v-if="dataItems.length > 0" class="data-items-list">
          <n-space vertical :size="6">
            <DataItemCard
              v-for="item in dataItems"
              :key="item.id"
              :data-item="item"
              @edit="handleEditDataItem"
              @delete="handleDeleteDataItem"
              @view="handleViewDataItem"
              @test="handleTestDataItem"
              @toggle="handleToggleDataItem"
            />
          </n-space>
        </div>

        <!-- 空状态 -->
        <n-empty 
          v-else
          description="暂无数据项"
          size="small"
          style="margin: 20px 0"
        >
          <template #extra>
            <n-button size="small" type="primary" @click="handleAddDataItem">
              添加第一个数据项
            </n-button>
          </template>
        </n-empty>
      </div>

      <!-- 数据预览区域 -->
      <div v-if="dataItems.length > 0" class="data-preview-section">
        <n-space justify="space-between" align="center" style="margin-bottom: 8px">
          <n-text strong style="font-size: 13px">数据预览</n-text>
          <n-space :size="6">
            <n-button 
              size="tiny" 
              type="info" 
              :loading="refreshing"
              @click="handleRefreshPreview"
            >
              🔄 刷新
            </n-button>
            <n-button size="tiny" @click="handleClearPreview">
              🗑️ 清空
            </n-button>
          </n-space>
        </n-space>

        <n-card size="small" :bordered="false" style="background: var(--hover-color)">
          <n-code
            :code="previewData"
            language="json"
            style="max-height: 200px; overflow-y: auto; font-size: 11px"
            :show-line-numbers="false"
          />
        </n-card>
      </div>

      <!-- 操作区域 -->
      <div v-if="dataItems.length > 0" class="actions-section">
        <n-space :size="8">
          <n-button 
            type="primary" 
            size="small"
            :disabled="activeItems.length === 0"
            :loading="executing"
            @click="handleExecuteAll"
          >
            🚀 执行所有活跃项
          </n-button>
          <n-button 
            size="small"
            :disabled="activeItems.length === 0"
            @click="handleStopAll"
          >
            ⏹️ 停止所有
          </n-button>
          <n-button 
            size="small" 
            type="warning"
            @click="handleTestAll"
          >
            🧪 测试所有
          </n-button>
        </n-space>
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源内容组件
 * 展示和管理数据源的数据项
 */

import { ref, computed } from 'vue'
import { 
  NSpace, 
  NText, 
  NButton, 
  NIcon, 
  NEmpty, 
  NCard, 
  NCode 
} from 'naive-ui'

// 导入数据项卡片组件
import DataItemCard from './DataItemCard.vue'

// 导入类型
import type { RawDataItem } from '../modals/DataItemModal.vue'

// Props 定义
interface Props {
  dataSourceKey: string
  dataItems: RawDataItem[]
}

// Emits 定义
interface Emits {
  (e: 'add-data-item', dataSourceKey: string): void
  (e: 'edit-data-item', dataSourceKey: string, itemId: string): void
  (e: 'delete-data-item', dataSourceKey: string, itemId: string): void
  (e: 'view-data-item', dataSourceKey: string, itemId: string): void
  (e: 'test-data-item', dataSourceKey: string, itemId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 刷新状态 */
const refreshing = ref(false)

/** 执行状态 */
const executing = ref(false)

/** 预览数据 */
const previewData = ref('{}')

// ========== 计算属性 ==========

/** 活跃的数据项 */
const activeItems = computed(() => {
  return props.dataItems.filter(item => item.isActive)
})

// ========== 方法 ==========

/**
 * 生成预览数据
 */
function generatePreviewData(): string {
  if (props.dataItems.length === 0) {
    return '{}'
  }

  const preview = {
    dataSourceKey: props.dataSourceKey,
    timestamp: new Date().toISOString(),
    totalItems: props.dataItems.length,
    activeItems: activeItems.value.length,
    items: props.dataItems.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      isActive: item.isActive,
      lastUpdate: item.createdAt,
      sampleData: getSampleData(item)
    }))
  }

  return JSON.stringify(preview, null, 2)
}

/**
 * 获取数据项的示例数据
 */
function getSampleData(item: RawDataItem): any {
  switch (item.type) {
    case 'json':
      try {
        return item.data || {}
      } catch {
        return {}
      }
    case 'http':
      return {
        method: item.config?.httpConfig?.method || 'GET',
        url: item.config?.httpConfig?.url || '',
        status: 'ready'
      }
    case 'websocket':
      return {
        url: item.config?.websocketConfig?.url || '',
        readyState: 'connecting',
        protocols: item.config?.websocketConfig?.protocols || []
      }
    default:
      return item.data || {}
  }
}

// ========== 事件处理器 ==========

/**
 * 添加数据项
 */
function handleAddDataItem(): void {
  emit('add-data-item', props.dataSourceKey)
}

/**
 * 编辑数据项
 */
function handleEditDataItem(itemId: string): void {
  emit('edit-data-item', props.dataSourceKey, itemId)
}

/**
 * 删除数据项
 */
function handleDeleteDataItem(itemId: string): void {
  emit('delete-data-item', props.dataSourceKey, itemId)
}

/**
 * 查看数据项
 */
function handleViewDataItem(itemId: string): void {
  emit('view-data-item', props.dataSourceKey, itemId)
}

/**
 * 测试数据项
 */
function handleTestDataItem(itemId: string): void {
  emit('test-data-item', props.dataSourceKey, itemId)
}

/**
 * 切换数据项状态
 */
function handleToggleDataItem(itemId: string): void {
  const item = props.dataItems.find(item => item.id === itemId)
  if (item) {
    item.isActive = !item.isActive
    console.log(`🔄 [DataSourceContent] 切换数据项状态: ${itemId} -> ${item.isActive}`)
    
    // 更新预览数据
    previewData.value = generatePreviewData()
  }
}

/**
 * 刷新预览
 */
async function handleRefreshPreview(): Promise<void> {
  refreshing.value = true
  
  try {
    // 模拟数据刷新
    await new Promise(resolve => setTimeout(resolve, 500))
    previewData.value = generatePreviewData()
    console.log('🔄 [DataSourceContent] 数据预览已刷新')
    window.$message?.success('预览数据已刷新')
  } catch (error) {
    console.error('❌ [DataSourceContent] 刷新预览失败:', error)
    window.$message?.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

/**
 * 清空预览
 */
function handleClearPreview(): void {
  previewData.value = '{}'
  console.log('🗑️ [DataSourceContent] 预览数据已清空')
}

/**
 * 执行所有活跃项
 */
async function handleExecuteAll(): Promise<void> {
  if (activeItems.value.length === 0) {
    window.$message?.warning('没有活跃的数据项')
    return
  }

  executing.value = true
  
  try {
    console.log(`🚀 [DataSourceContent] 开始执行所有活跃项 (${activeItems.value.length}个)`)
    
    // 模拟执行过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新预览数据
    previewData.value = generatePreviewData()
    
    console.log('✅ [DataSourceContent] 所有活跃项执行完成')
    window.$message?.success(`已执行 ${activeItems.value.length} 个数据项`)
  } catch (error) {
    console.error('❌ [DataSourceContent] 执行失败:', error)
    window.$message?.error('执行失败：' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    executing.value = false
  }
}

/**
 * 停止所有
 */
function handleStopAll(): void {
  console.log('⏹️ [DataSourceContent] 停止所有数据项')
  
  // 停止所有活跃项
  props.dataItems.forEach(item => {
    if (item.isActive) {
      item.isActive = false
    }
  })
  
  // 更新预览数据
  previewData.value = generatePreviewData()
  
  window.$message?.info('所有数据项已停止')
}

/**
 * 测试所有
 */
async function handleTestAll(): Promise<void> {
  console.log(`🧪 [DataSourceContent] 开始测试所有数据项 (${props.dataItems.length}个)`)
  
  try {
    // 模拟测试过程
    for (const item of props.dataItems) {
      await new Promise(resolve => setTimeout(resolve, 200))
      console.log(`🧪 测试数据项: ${item.name}`)
    }
    
    window.$message?.success(`已测试 ${props.dataItems.length} 个数据项`)
  } catch (error) {
    console.error('❌ [DataSourceContent] 测试失败:', error)
    window.$message?.error('测试失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// ========== 初始化 ==========

// 初始化预览数据
previewData.value = generatePreviewData()
</script>

<style scoped>
/* 数据源内容样式 */
.data-source-content {
  width: 100%;
}

/* 数据项管理区域 */
.data-items-section {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
}

/* 数据项列表 */
.data-items-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

/* 数据预览区域 */
.data-preview-section {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
}

/* 操作区域 */
.actions-section {
  background: var(--hover-color);
  border-radius: 6px;
  padding: 12px;
  border: 1px dashed var(--border-color);
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-color-3);
}

/* 滚动条样式 */
.data-items-list::-webkit-scrollbar {
  width: 6px;
}

.data-items-list::-webkit-scrollbar-track {
  background: var(--scrollbar-color);
  border-radius: 3px;
}

.data-items-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-color-hover);
  border-radius: 3px;
}

.data-items-list::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-items-section,
  .data-preview-section,
  .actions-section {
    padding: 8px;
  }
  
  .data-items-list {
    max-height: 300px;
  }
  
  .actions-section :deep(.n-space) {
    flex-direction: column;
    width: 100%;
  }
  
  .actions-section :deep(.n-button) {
    width: 100%;
  }
}

/* 明暗主题适配 */
[data-theme="dark"] .data-items-section,
[data-theme="dark"] .data-preview-section {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .actions-section {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

[data-theme="light"] .data-items-section,
[data-theme="light"] .data-preview-section {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .actions-section {
  background: rgba(0, 0, 0, 0.01);
  border-color: rgba(0, 0, 0, 0.06);
}

/* 动画效果 */
.data-items-section,
.data-preview-section,
.actions-section {
  transition: all 0.3s ease;
}

.data-items-section:hover,
.data-preview-section:hover {
  border-color: var(--primary-color-hover);
}

/* 性能优化 */
.data-source-content {
  contain: layout style;
}
</style>