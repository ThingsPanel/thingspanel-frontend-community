<!--
  列表数据测试组件
  专门用于验证V4优化方案中的数组数据绑定和初始化修复
-->

<template>
  <div class="list-data-test-widget">
    <n-card :title="title || '列表数据测试'" size="small" :bordered="false">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <n-spin size="small" />
        <n-text depth="2">正在加载数据...</n-text>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="error.message" />
      </div>

      <!-- 数据展示 -->
      <div v-else class="data-content">
        <!-- 基本信息 -->
        <div class="info-section">
          <n-space size="small">
            <n-tag type="info" size="small">
              <template #icon>
                <n-icon><ListOutline /></n-icon>
              </template>
              共 {{ listData.length }} 条数据
            </n-tag>
            <n-tag v-if="showTimestamp" type="default" size="small">更新时间: {{ formatTime(updateTime) }}</n-tag>
          </n-space>
        </div>

        <!-- 列表数据展示 -->
        <div class="list-section">
          <n-list v-if="listData.length > 0" bordered>
            <n-list-item v-for="(item, index) in displayData" :key="index">
              <n-thing :title="getItemTitle(item, index)" :description="getItemDescription(item)">
                <template #header-extra>
                  <n-tag :type="getItemStatus(item) === 'online' ? 'success' : 'error'" size="small">
                    {{ getItemStatus(item) }}
                  </n-tag>
                </template>
                <div class="item-details">
                  <n-space size="small">
                    <span v-if="item.value !== undefined" class="item-value">值: {{ formatValue(item.value) }}</span>
                    <span v-if="item.id" class="item-id">ID: {{ item.id }}</span>
                  </n-space>
                </div>
              </n-thing>
            </n-list-item>
          </n-list>

          <!-- 空数据状态 -->
          <n-empty v-else description="暂无数据" size="small">
            <template #icon>
              <n-icon size="32"><DocumentOutline /></n-icon>
            </template>
          </n-empty>
        </div>

        <!-- 分页控制 -->
        <div v-if="enablePagination && listData.length > pageSize" class="pagination-section">
          <n-pagination
            v-model:page="currentPage"
            :page-count="pageCount"
            size="small"
            show-size-picker
            :page-sizes="[5, 10, 20, 50]"
            :page-size="pageSize"
            @update:page-size="handlePageSizeChange"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 列表数据测试组件
 * 用于验证配置驱动数据源系统的数组数据绑定和V4修复效果
 */

import { ref, computed, watch } from 'vue'
import {
  NCard,
  NList,
  NListItem,
  NThing,
  NTag,
  NSpace,
  NIcon,
  NText,
  NSpin,
  NAlert,
  NEmpty,
  NPagination
} from 'naive-ui'
import { ListOutline, DocumentOutline } from '@vicons/ionicons5'

// 组件Props接口
interface Props {
  // 静态参数
  title?: string
  showTimestamp?: boolean
  enablePagination?: boolean
  pageSize?: number
  maxItems?: number

  // 动态数据源（来自useWidgetProps Hook）
  listData?: any[]
  updateTime?: Date | string

  // 测试用的直接数据（用于调试）
  testData?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '列表数据测试',
  showTimestamp: true,
  enablePagination: true,
  pageSize: 10,
  maxItems: 100,
  listData: () => [],
  testData: () => []
})

// 响应式状态
const currentPage = ref(1)
const isLoading = ref(false)
const error = ref<Error | null>(null)

// 计算属性
const effectiveData = computed(() => {
  // 优先使用动态数据源，fallback到测试数据
  return props.listData?.length > 0 ? props.listData : props.testData
})

const displayData = computed(() => {
  const data = effectiveData.value.slice(0, props.maxItems)

  if (props.enablePagination) {
    const start = (currentPage.value - 1) * props.pageSize
    const end = start + props.pageSize
    return data.slice(start, end)
  }

  return data
})

const pageCount = computed(() => {
  return Math.ceil(Math.min(effectiveData.value.length, props.maxItems) / props.pageSize)
})

// 数据格式化函数
const formatTime = (time: Date | string | undefined): string => {
  if (!time) return '未知'
  const date = typeof time === 'string' ? new Date(time) : time
  return date.toLocaleTimeString('zh-CN')
}

const formatValue = (value: any): string => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return String(value)
}

const getItemTitle = (item: any, index: number): string => {
  return item.name || item.title || `项目 ${index + 1}`
}

const getItemDescription = (item: any): string => {
  return item.description || item.desc || `列表项 ${item.id || ''}`
}

const getItemStatus = (item: any): string => {
  return item.status || item.state || 'unknown'
}

// 事件处理
const handlePageSizeChange = (newPageSize: number) => {
  props.pageSize = newPageSize
  currentPage.value = 1
}

// 监听数据变化
watch(
  () => props.listData,
  newData => {
    if (newData && newData.length > 0) {
      console.log(`📊 [ListDataTestWidget] 接收到新数据，共 ${newData.length} 条`)
      currentPage.value = 1 // 重置到第一页
    }
  },
  { deep: true }
)

// 组件元信息（用于在可视化编辑器中显示）
defineOptions({
  name: 'ListDataTestWidget'
})
</script>

<style scoped>
.list-data-test-widget {
  width: 100%;
  height: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
}

.error-state {
  padding: 16px;
}

.data-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-section {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.list-section {
  flex: 1;
}

.item-details {
  margin-top: 8px;
  padding: 8px 0;
}

.item-value {
  font-weight: 500;
  color: var(--primary-color);
}

.item-id {
  font-size: 12px;
  color: var(--text-color-3);
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .list-data-test-widget .n-list-item {
    padding: 8px;
  }

  .item-details {
    margin-top: 4px;
  }
}
</style>
