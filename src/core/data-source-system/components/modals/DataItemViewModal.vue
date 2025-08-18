<!--
  数据项查看弹窗
  显示数据项的详细信息，只读模式
-->
<template>
  <n-modal
    v-model:show="visible"
    preset="dialog"
    title="数据项详情"
    style="width: 1200px"
    @after-leave="handleModalClose"
  >
    <div v-if="dataItem" class="data-item-view">
      <n-grid :cols="2" :x-gap="16">
        <!-- 左侧：基本信息 -->
        <n-grid-item>
          <n-space vertical :size="12">
            <!-- 基本信息卡片 -->
            <n-card size="small" title="基本信息" :bordered="false">
              <n-descriptions :columns="1" size="small">
                <n-descriptions-item label="名称">
                  <n-text strong>{{ dataItem.name }}</n-text>
                </n-descriptions-item>
                <n-descriptions-item label="类型">
                  <n-tag :type="getTypeColor()" size="small">
                    {{ dataItem.type?.toUpperCase() || 'JSON' }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="状态">
                  <n-tag :type="dataItem.isActive ? 'success' : 'default'" size="small">
                    {{ dataItem.isActive ? '运行中' : '已停止' }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="创建时间">
                  {{ formatDateTime(dataItem.createdAt) }}
                </n-descriptions-item>
                <n-descriptions-item label="数据项ID">
                  <n-text code>{{ dataItem.id }}</n-text>
                </n-descriptions-item>
              </n-descriptions>
            </n-card>

            <!-- 配置信息卡片 -->
            <n-card size="small" title="配置信息" :bordered="false">
              <template v-if="dataItem.type === 'json'">
                <n-space vertical :size="6">
                  <n-text depth="2" style="font-size: 12px">JSON数据配置：</n-text>
                  <n-code
                    :code="getJsonConfig()"
                    language="json"
                    style="max-height: 200px; overflow-y: auto; font-size: 11px"
                    :show-line-numbers="false"
                  />
                </n-space>
              </template>

              <template v-else-if="dataItem.type === 'http'">
                <n-descriptions :columns="1" size="small">
                  <n-descriptions-item label="请求方法">
                    <n-tag type="warning" size="tiny">
                      {{ dataItem.config?.httpConfig?.method || 'GET' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="请求URL">
                    <n-text code style="font-size: 11px">
                      {{ dataItem.config?.httpConfig?.url || '未配置' }}
                    </n-text>
                  </n-descriptions-item>
                  <n-descriptions-item v-if="dataItem.config?.httpConfig?.headers" label="请求头">
                    <n-code
                      :code="JSON.stringify(dataItem.config.httpConfig.headers, null, 2)"
                      language="json"
                      style="max-height: 100px; overflow-y: auto; font-size: 10px"
                      :show-line-numbers="false"
                    />
                  </n-descriptions-item>
                </n-descriptions>
              </template>

              <template v-else-if="dataItem.type === 'websocket'">
                <n-descriptions :columns="1" size="small">
                  <n-descriptions-item label="WebSocket URL">
                    <n-text code style="font-size: 11px">
                      {{ dataItem.config?.websocketConfig?.url || '未配置' }}
                    </n-text>
                  </n-descriptions-item>
                  <n-descriptions-item v-if="dataItem.config?.websocketConfig?.protocols" label="协议">
                    <n-space :size="4">
                      <n-tag 
                        v-for="protocol in dataItem.config.websocketConfig.protocols" 
                        :key="protocol"
                        type="info" 
                        size="tiny"
                      >
                        {{ protocol }}
                      </n-tag>
                    </n-space>
                  </n-descriptions-item>
                </n-descriptions>
              </template>
            </n-card>

            <!-- 处理配置卡片 -->
            <n-card 
              v-if="dataItem.config?.filterPath || dataItem.config?.processScript" 
              size="small" 
              title="数据处理配置" 
              :bordered="false"
            >
              <n-space vertical :size="8">
                <div v-if="dataItem.config.filterPath">
                  <n-text depth="2" style="font-size: 12px">过滤路径：</n-text>
                  <n-text code style="font-size: 11px; margin-left: 8px">
                    {{ dataItem.config.filterPath }}
                  </n-text>
                </div>
                
                <div v-if="dataItem.config.processScript">
                  <n-text depth="2" style="font-size: 12px">处理脚本：</n-text>
                  <n-code
                    :code="dataItem.config.processScript"
                    language="javascript"
                    style="max-height: 150px; overflow-y: auto; font-size: 10px; margin-top: 4px"
                    :show-line-numbers="false"
                  />
                </div>
              </n-space>
            </n-card>
          </n-space>
        </n-grid-item>

        <!-- 右侧：数据预览 -->
        <n-grid-item>
          <n-space vertical :size="12">
            <!-- 原始数据预览 -->
            <n-card size="small" :bordered="false">
              <template #header>
                <n-space justify="space-between" align="center">
                  <n-text strong style="font-size: 13px">原始数据预览</n-text>
                  <n-button size="tiny" type="info" @click="refreshPreview">
                    🔄 刷新
                  </n-button>
                </n-space>
              </template>
              
              <n-code
                :code="rawDataPreview"
                language="json"
                style="max-height: 300px; overflow-y: auto; font-size: 11px"
                :show-line-numbers="false"
              />
            </n-card>

            <!-- 处理后数据预览 -->
            <n-card 
              v-if="dataItem.config?.filterPath || dataItem.config?.processScript"
              size="small" 
              :bordered="false"
            >
              <template #header>
                <n-space justify="space-between" align="center">
                  <n-text strong style="font-size: 13px">处理后数据预览</n-text>
                  <n-tag type="success" size="tiny">已处理</n-tag>
                </n-space>
              </template>
              
              <n-code
                :code="processedDataPreview"
                language="json"
                style="max-height: 300px; overflow-y: auto; font-size: 11px"
                :show-line-numbers="false"
              />
            </n-card>

            <!-- 统计信息 -->
            <n-card size="small" title="统计信息" :bordered="false">
              <n-space vertical :size="6">
                <n-progress 
                  type="line" 
                  :percentage="getDataHealthPercentage()" 
                  :color="getDataHealthColor()"
                  :show-indicator="false"
                  style="margin-bottom: 8px"
                />
                
                <n-descriptions :columns="2" size="small">
                  <n-descriptions-item label="数据完整性">
                    <n-text :type="getDataHealthColor() === '#18a058' ? 'success' : 'warning'">
                      {{ getDataHealthText() }}
                    </n-text>
                  </n-descriptions-item>
                  <n-descriptions-item label="数据大小">
                    {{ getDataSizeText() }}
                  </n-descriptions-item>
                  <n-descriptions-item label="字段数量">
                    {{ getFieldCount() }}
                  </n-descriptions-item>
                  <n-descriptions-item label="最后更新">
                    {{ getLastUpdateText() }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-space>
            </n-card>
          </n-space>
        </n-grid-item>
      </n-grid>
    </div>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleClose">关闭</n-button>
        <n-button type="primary" @click="handleEdit">编辑配置</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 数据项查看弹窗
 * 只读模式显示数据项的详细信息
 */

import { ref, computed, watch } from 'vue'
import {
  NModal,
  NGrid,
  NGridItem,
  NSpace,
  NCard,
  NText,
  NTag,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NCode,
  NProgress
} from 'naive-ui'

// 导入类型
import type { RawDataItem } from './DataItemModal.vue'

// Props 定义
interface Props {
  modelValue: boolean
  dataItem: RawDataItem | null
}

// Emits 定义
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'edit', item: RawDataItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 弹窗显示状态 */
const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

/** 原始数据预览 */
const rawDataPreview = ref('{}')

/** 处理后数据预览 */
const processedDataPreview = ref('{}')

// ========== 监听器 ==========

/** 监听数据项变化，更新预览 */
watch(
  () => props.dataItem,
  (newItem) => {
    if (newItem) {
      updateDataPreview(newItem)
    }
  },
  { immediate: true }
)

// ========== 方法 ==========

/**
 * 获取类型颜色
 */
function getTypeColor(): string {
  if (!props.dataItem) return 'default'
  
  switch (props.dataItem.type) {
    case 'json':
      return 'default'
    case 'http':
      return 'warning'
    case 'websocket':
      return 'error'
    default:
      return 'info'
  }
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateString
  }
}

/**
 * 获取JSON配置
 */
function getJsonConfig(): string {
  if (!props.dataItem?.config?.jsonData) {
    return JSON.stringify(props.dataItem?.data || {}, null, 2)
  }
  
  try {
    const parsed = JSON.parse(props.dataItem.config.jsonData)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return props.dataItem.config.jsonData
  }
}

/**
 * 更新数据预览
 */
function updateDataPreview(item: RawDataItem): void {
  try {
    // 更新原始数据预览
    rawDataPreview.value = JSON.stringify(item.data || {}, null, 2)
    
    // 模拟处理后数据
    let processedData = item.data || {}
    
    // 应用过滤路径
    if (item.config?.filterPath) {
      processedData = applyFilterPath(processedData, item.config.filterPath)
    }
    
    // 应用处理脚本
    if (item.config?.processScript) {
      processedData = applyProcessScript(processedData, item.config.processScript)
    }
    
    processedDataPreview.value = JSON.stringify(processedData, null, 2)
    
  } catch (error) {
    console.error('❌ [DataItemViewModal] 数据预览更新失败:', error)
    rawDataPreview.value = '{"error": "数据预览失败"}'
    processedDataPreview.value = '{"error": "处理预览失败"}'
  }
}

/**
 * 应用过滤路径（简化版）
 */
function applyFilterPath(data: any, filterPath: string): any {
  try {
    // 简单的JSONPath实现
    let current = data
    const cleanPath = filterPath.replace(/^\$\.?/, '').trim()
    
    if (!cleanPath) return data
    
    const parts = cleanPath.split(/\.|\[|\]/).filter(part => part !== '')
    
    for (const part of parts) {
      if (current === null || current === undefined) return null
      
      if (/^\d+$/.test(part)) {
        const index = parseInt(part)
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index]
        } else {
          return null
        }
      } else {
        if (typeof current === 'object' && current !== null && part in current) {
          current = current[part]
        } else {
          return null
        }
      }
    }
    
    return current
  } catch {
    return data
  }
}

/**
 * 应用处理脚本（简化版）
 */
function applyProcessScript(data: any, script: string): any {
  try {
    // 简单的脚本处理示例
    const processedData = JSON.parse(JSON.stringify(data))
    
    // 这里只是模拟，实际应该使用脚本引擎
    if (script.includes('data.processed = true')) {
      processedData.processed = true
      processedData.processedAt = new Date().toISOString()
    }
    
    return processedData
  } catch {
    return data
  }
}

/**
 * 获取数据健康度百分比
 */
function getDataHealthPercentage(): number {
  if (!props.dataItem?.data) return 0
  
  try {
    const data = props.dataItem.data
    let score = 0
    
    // 检查数据是否存在
    if (data && typeof data === 'object') score += 30
    
    // 检查字段数量
    const fieldCount = Object.keys(data).length
    if (fieldCount > 0) score += 30
    if (fieldCount > 3) score += 20
    
    // 检查数据类型多样性
    const types = new Set(Object.values(data).map(v => typeof v))
    score += Math.min(types.size * 5, 20)
    
    return Math.min(score, 100)
  } catch {
    return 0
  }
}

/**
 * 获取数据健康度颜色
 */
function getDataHealthColor(): string {
  const percentage = getDataHealthPercentage()
  if (percentage >= 80) return '#18a058'
  if (percentage >= 60) return '#f0a020'
  return '#d03050'
}

/**
 * 获取数据健康度文本
 */
function getDataHealthText(): string {
  const percentage = getDataHealthPercentage()
  if (percentage >= 80) return '优秀'
  if (percentage >= 60) return '良好'
  if (percentage >= 40) return '一般'
  return '较差'
}

/**
 * 获取数据大小文本
 */
function getDataSizeText(): string {
  try {
    const jsonString = JSON.stringify(props.dataItem?.data || {})
    const bytes = new Blob([jsonString]).size
    
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  } catch {
    return '未知'
  }
}

/**
 * 获取字段数量
 */
function getFieldCount(): number {
  try {
    const data = props.dataItem?.data
    if (!data || typeof data !== 'object') return 0
    return Object.keys(data).length
  } catch {
    return 0
  }
}

/**
 * 获取最后更新文本
 */
function getLastUpdateText(): string {
  if (!props.dataItem?.createdAt) return '未知'
  
  try {
    const date = new Date(props.dataItem.createdAt)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `${days} 天前`
    if (hours > 0) return `${hours} 小时前`
    if (minutes > 0) return `${minutes} 分钟前`
    return '刚刚'
  } catch {
    return '未知'
  }
}

// ========== 事件处理器 ==========

/**
 * 刷新预览
 */
function refreshPreview(): void {
  if (props.dataItem) {
    updateDataPreview(props.dataItem)
    console.log('🔄 [DataItemViewModal] 数据预览已刷新')
    window.$message?.success('预览已刷新')
  }
}

/**
 * 处理关闭
 */
function handleClose(): void {
  emit('close')
  visible.value = false
}

/**
 * 处理编辑
 */
function handleEdit(): void {
  if (props.dataItem) {
    emit('edit', props.dataItem)
    visible.value = false
  }
}

/**
 * 处理弹窗关闭
 */
function handleModalClose(): void {
  emit('close')
}
</script>

<style scoped>
/* 数据项查看弹窗样式 */
.data-item-view {
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
}

/* 卡片样式优化 */
.data-item-view :deep(.n-card) {
  margin-bottom: 8px;
}

.data-item-view :deep(.n-card__header) {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}

.data-item-view :deep(.n-card__content) {
  padding: 12px;
}

/* 描述列表样式 */
.data-item-view :deep(.n-descriptions-item__label) {
  font-size: 11px;
  color: var(--text-color-2);
  font-weight: 500;
}

.data-item-view :deep(.n-descriptions-item__content) {
  font-size: 11px;
}

/* 代码块样式 */
.data-item-view :deep(.n-code) {
  border-radius: 4px;
  font-size: 10px;
}

/* 进度条样式 */
.data-item-view :deep(.n-progress) {
  margin-bottom: 8px;
}

/* 滚动条样式 */
.data-item-view::-webkit-scrollbar {
  width: 6px;
}

.data-item-view::-webkit-scrollbar-track {
  background: var(--scrollbar-color);
  border-radius: 3px;
}

.data-item-view::-webkit-scrollbar-thumb {
  background: var(--scrollbar-color-hover);
  border-radius: 3px;
}

.data-item-view::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 1240px) {
  :deep(.n-modal) {
    width: 95vw !important;
    max-width: 1100px;
  }
}

@media (max-width: 768px) {
  :deep(.n-modal) {
    width: 98vw !important;
  }
  
  :deep(.n-grid) {
    display: flex;
    flex-direction: column;
  }
  
  :deep(.n-grid-item) {
    width: 100% !important;
  }
}

/* 明暗主题适配 */
[data-theme="dark"] .data-item-view :deep(.n-card) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .data-item-view :deep(.n-card) {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* 性能优化 */
.data-item-view {
  contain: layout style;
}
</style>