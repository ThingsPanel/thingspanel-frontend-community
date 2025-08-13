<!--
  列表数据测试组件
  用于验证V4优化方案中的数组数据绑定和初始化修复
-->

<template>
  <div class="list-data-test-widget" :style="interactionStyles" :class="{ interacting: interactionState.isAnimating }">
    <!-- 组件标题 -->
    <div v-if="title" class="widget-header">
      <h3 class="widget-title">
        <n-icon size="16" class="title-icon">
          <ListOutline />
        </n-icon>
        {{ title }}
      </h3>
      <div v-if="showTimestamp && updateTime" class="timestamp">
        <n-icon size="12"><TimeOutline /></n-icon>
        <span>{{ formatTime(updateTime) }}</span>
      </div>
    </div>

    <!-- 列表内容 -->
    <div class="list-content">
      <div v-if="!hasValidData" class="no-data">
        <n-empty size="small" description="暂无数据">
          <template #icon>
            <n-icon><DocumentOutline /></n-icon>
          </template>
        </n-empty>
      </div>

      <div v-else class="data-list">
        <!-- 数据统计 -->
        <div class="data-stats">
          <n-space>
            <n-tag size="small" type="info">总数: {{ totalItems }}</n-tag>
            <n-tag v-if="onlineCount > 0" size="small" type="success">在线: {{ onlineCount }}</n-tag>
            <n-tag v-if="offlineCount > 0" size="small" type="error">离线: {{ offlineCount }}</n-tag>
          </n-space>
        </div>

        <!-- 列表项 -->
        <div class="items-container">
          <div v-for="item in displayItems" :key="item.id || item.name" class="list-item">
            <div class="item-content">
              <div class="item-header">
                <span class="item-name">{{ item.name || item.title || 'Unknown' }}</span>
                <n-tag v-if="item.status" :type="item.status === 'online' ? 'success' : 'error'" size="small">
                  {{ item.status }}
                </n-tag>
              </div>

              <div v-if="item.value !== undefined" class="item-value">
                <span class="value-label">数值:</span>
                <span class="value-text">{{ formatValue(item.value) }}</span>
              </div>

              <div v-if="item.description" class="item-description">
                {{ item.description }}
              </div>

              <div v-if="item.id" class="item-id">ID: {{ item.id }}</div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="enablePagination && totalItems > pageSize" class="pagination-container">
          <n-pagination
            v-model:page="currentPage"
            :page-count="totalPages"
            :page-size="pageSize"
            size="small"
            show-size-picker
            :page-sizes="[5, 10, 20, 50]"
            @update:page-size="handlePageSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebugInfo" class="debug-section">
      <n-collapse>
        <n-collapse-item title="调试信息" name="debug">
          <div class="debug-content">
            <div class="debug-item">
              <strong>组件ID:</strong>
              {{ componentId }}
            </div>
            <div class="debug-item">
              <strong>数据源:</strong>
              {{ Array.isArray(listData) ? '数组' : typeof listData }}
            </div>
            <div class="debug-item">
              <strong>数据条数:</strong>
              {{ Array.isArray(listData) ? listData.length : 0 }}
            </div>
            <pre>{{ debugInfo }}</pre>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 列表数据测试组件
 * 用于验证V4优化方案中的数组数据绑定和初始化修复
 */

import { computed, ref, onMounted } from 'vue'
import { NIcon, NEmpty, NSpace, NTag, NPagination, NCollapse, NCollapseItem } from 'naive-ui'
import { ListOutline, TimeOutline, DocumentOutline } from '@vicons/ionicons5'
import { useInteraction } from '../../hooks/use-interaction'

// 组件属性定义
interface Props {
  /** 组件标题 */
  title?: string
  /** 列表数据 */
  listData?: any[]
  /** 是否显示时间戳 */
  showTimestamp?: boolean
  /** 数据更新时间 */
  updateTime?: Date
  /** 是否启用分页 */
  enablePagination?: boolean
  /** 每页条数 */
  pageSize?: number
  /** 最大条数 */
  maxItems?: number
  /** 是否显示调试信息 */
  showDebugInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '列表数据测试',
  listData: () => [],
  showTimestamp: true,
  updateTime: () => new Date(),
  enablePagination: true,
  pageSize: 10,
  maxItems: 100,
  showDebugInfo: false
})

// 生成唯一的组件ID
const componentId = `list-data-test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 使用交互系统
const { interactionState, interactionStyles } = useInteraction({
  componentId,
  configs: [
    {
      event: 'click',
      responses: [{ action: 'changeBackgroundColor', value: '#f0f9ff' }],
      priority: 1
    },
    {
      event: 'hover',
      responses: [{ action: 'changeOpacity', value: 0.95 }],
      priority: 1
    }
  ]
})

// 响应式状态
const currentPage = ref(1)

// 计算属性
const hasValidData = computed(() => {
  return Array.isArray(props.listData) && props.listData.length > 0
})

const totalItems = computed(() => {
  return Array.isArray(props.listData) ? Math.min(props.listData.length, props.maxItems) : 0
})

const onlineCount = computed(() => {
  if (!Array.isArray(props.listData)) return 0
  return props.listData.filter(item => item.status === 'online').length
})

const offlineCount = computed(() => {
  if (!Array.isArray(props.listData)) return 0
  return props.listData.filter(item => item.status === 'offline').length
})

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / props.pageSize)
})

const displayItems = computed(() => {
  if (!Array.isArray(props.listData)) return []

  let items = props.listData.slice(0, props.maxItems)

  if (props.enablePagination) {
    const start = (currentPage.value - 1) * props.pageSize
    const end = start + props.pageSize
    items = items.slice(start, end)
  }

  return items
})

const debugInfo = computed(() => {
  return JSON.stringify(
    {
      componentId,
      listData: props.listData,
      totalItems: totalItems.value,
      currentPage: currentPage.value,
      displayItems: displayItems.value,
      props: {
        title: props.title,
        showTimestamp: props.showTimestamp,
        enablePagination: props.enablePagination,
        pageSize: props.pageSize,
        maxItems: props.maxItems
      }
    },
    null,
    2
  )
})

// 方法
const formatTime = (time: Date | string | number): string => {
  try {
    const date = new Date(time)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return '无效时间'
  }
}

const formatValue = (value: any): string => {
  if (typeof value === 'number') {
    return value.toFixed(1)
  }
  return String(value)
}

const handlePageSizeChange = (newPageSize: number) => {
  currentPage.value = 1
  // 这里可以触发事件给父组件
}

// 生命周期
onMounted(() => {
  console.log(`🧪 [ListDataTestWidget] 组件已挂载: ${componentId}`)
  console.log('📊 [ListDataTestWidget] 初始数据:', props.listData)
})
</script>

<style scoped>
.list-data-test-widget {
  padding: 16px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.widget-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.title-icon {
  color: var(--primary-color);
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-color-3);
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-data {
  padding: 40px 20px;
  text-align: center;
}

.data-stats {
  padding: 8px 0;
}

.items-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.list-item {
  padding: 12px;
  background: var(--hover-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.list-item:hover {
  background: var(--pressed-color);
  border-color: var(--primary-color);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
}

.item-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.value-label {
  color: var(--text-color-2);
}

.value-text {
  font-weight: 500;
  color: var(--primary-color);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.item-description {
  font-size: 12px;
  color: var(--text-color-2);
  line-height: 1.4;
}

.item-id {
  font-size: 11px;
  color: var(--text-color-3);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid var(--divider-color);
}

.debug-section {
  margin-top: 16px;
  border-top: 1px solid var(--divider-color);
  padding-top: 16px;
}

.debug-content {
  background: var(--code-color);
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.debug-item {
  margin-bottom: 8px;
  padding: 4px 8px;
  background: var(--hover-color);
  border-radius: 3px;
  font-size: 12px;
}

.debug-content pre {
  margin: 8px 0 0 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 滚动条样式 */
.items-container::-webkit-scrollbar,
.debug-content::-webkit-scrollbar {
  width: 6px;
}

.items-container::-webkit-scrollbar-track,
.debug-content::-webkit-scrollbar-track {
  background: var(--scrollbar-track-color);
  border-radius: 3px;
}

.items-container::-webkit-scrollbar-thumb,
.debug-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-color);
  border-radius: 3px;
}

.items-container::-webkit-scrollbar-thumb:hover,
.debug-content::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .list-data-test-widget {
    padding: 12px;
  }

  .widget-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .items-container {
    max-height: 300px;
  }
}

/* 交互动画 */
.list-data-test-widget.interacting {
  transform: scale(1.02);
  transition: transform 0.3s ease;
}

.list-data-test-widget.interacting .list-item {
  animation: itemPulse 0.5s ease-in-out;
}

@keyframes itemPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
