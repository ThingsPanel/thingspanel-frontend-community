<!--
  数据源卡片头部组件
  显示数据源的基本信息、状态和操作按钮
-->
<template>
  <div class="data-source-card-header">
    <div class="header-content">
      <!-- 图标和标题 -->
      <div class="title-section">
        <div class="icon-wrapper" :class="statusClass">
          <n-icon size="16" :color="iconColor">
            <component :is="displayIcon" />
          </n-icon>
        </div>
        
        <div class="title-info">
          <div class="title-row">
            <n-text class="title-text" :depth="1">
              {{ requirement.label }}
            </n-text>
            <n-tag 
              size="small" 
              :type="isRequired ? 'error' : 'default'"
              class="required-tag"
            >
              {{ isRequired ? '必需' : '可选' }}
            </n-tag>
          </div>
          <n-text depth="3" class="description">
            {{ requirement.description }}
          </n-text>
        </div>
      </div>
      
      <!-- 状态指示器 -->
      <div class="status-section">
        <div class="status-indicator">
          <n-tag 
            :type="statusTagType" 
            size="small"
            class="status-tag"
          >
            <template #icon>
              <n-icon>
                <component :is="statusIcon" />
              </n-icon>
            </template>
            {{ statusText }}
          </n-tag>
        </div>
        
        <!-- 数据信息 -->
        <div class="data-info" v-if="config?.data">
          <n-text depth="2" class="data-text">
            {{ getDataDescription() }}
          </n-text>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮区域 -->
    <div class="actions-section" v-if="!isRequired">
      <n-popconfirm
        @positive-click="handleRemove"
        positive-text="确认删除"
        negative-text="取消"
      >
        <template #trigger>
          <n-button 
            text 
            type="error"
            size="small"
            class="remove-button"
          >
            <template #icon>
              <n-icon><DeleteOutlined /></n-icon>
            </template>
          </n-button>
        </template>
        确定要删除这个数据源吗？删除后配置的数据将丢失。
      </n-popconfirm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon, NText, NTag, NButton, NPopconfirm } from 'naive-ui'
import { 
  DatabaseOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  ClockCircleOutlined,
  DeleteOutlined
} from '@vicons/antd'
import type { 
  DataSourceRequirement, 
  DataSourceConfig,
  DataSourceStatus 
} from '@/components/visual-editor/core/multi-data-source-types'

// Props
interface Props {
  /** 数据源需求定义 */
  requirement: DataSourceRequirement
  /** 数据源配置 */
  config?: DataSourceConfig
  /** 是否为必需数据源 */
  isRequired: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  remove: [dataSourceId: string]
}>()

// 计算属性

/**
 * 显示图标
 */
const displayIcon = computed(() => {
  // 优先使用自定义图标
  if (props.requirement.icon) {
    switch (props.requirement.icon) {
      case 'database':
        return DatabaseOutlined
      case 'settings':
        return DatabaseOutlined // 临时使用DatabaseOutlined
      case 'compare':
        return DatabaseOutlined // 临时使用DatabaseOutlined
      default:
        return DatabaseOutlined
    }
  }
  
  // 根据数据源类型选择图标
  switch (props.requirement.type) {
    case 'array':
      return DatabaseOutlined
    case 'object':
      return DatabaseOutlined
    default:
      return DatabaseOutlined
  }
})

/**
 * 图标颜色
 */
const iconColor = computed(() => {
  if (!props.config) return '#d9d9d9'
  
  switch (props.config.status) {
    case 'configured':
      return '#52c41a'
    case 'pending':
      return '#faad14'
    case 'error':
      return '#ff4d4f'
    default:
      return '#d9d9d9'
  }
})

/**
 * 状态样式类
 */
const statusClass = computed(() => {
  if (!props.config) return 'status-pending'
  return `status-${props.config.status}`
})

/**
 * 状态图标
 */
const statusIcon = computed(() => {
  if (!props.config) return ClockCircleOutlined
  
  switch (props.config.status) {
    case 'configured':
      return CheckCircleOutlined
    case 'error':
      return ExclamationCircleOutlined
    case 'pending':
    default:
      return ClockCircleOutlined
  }
})

/**
 * 状态标签类型
 */
const statusTagType = computed(() => {
  if (!props.config) return 'default'
  
  switch (props.config.status) {
    case 'configured':
      return 'success'
    case 'error':
      return 'error'
    case 'pending':
    default:
      return 'warning'
  }
})

/**
 * 状态文本
 */
const statusText = computed(() => {
  if (!props.config) return '待配置'
  
  switch (props.config.status) {
    case 'configured':
      return '已配置'
    case 'error':
      return '配置错误'
    case 'pending':
      return '待配置'
    default:
      return '未知状态'
  }
})

/**
 * 获取数据描述
 */
const getDataDescription = (): string => {
  if (!props.config?.data) return ''
  
  const data = props.config.data
  
  if (Array.isArray(data)) {
    return `${data.length} 条记录`
  }
  
  if (typeof data === 'object') {
    const fieldCount = Object.keys(data).length
    return `${fieldCount} 个字段`
  }
  
  return '数据已加载'
}

// 事件处理器
const handleRemove = () => {
  emit('remove', props.requirement.id)
}
</script>

<style scoped>
.data-source-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  min-height: 48px;
}

.header-content {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 12px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.icon-wrapper.status-configured {
  background-color: rgba(82, 196, 26, 0.1);
  border: 1px solid rgba(82, 196, 26, 0.2);
}

.icon-wrapper.status-pending {
  background-color: rgba(250, 173, 20, 0.1);
  border: 1px solid rgba(250, 173, 20, 0.2);
}

.icon-wrapper.status-error {
  background-color: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.2);
}

.title-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 14px;
  font-weight: 500;
}

.required-tag {
  font-size: 10px;
  height: 18px;
  line-height: 1;
}

.description {
  font-size: 12px;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-tag {
  font-size: 11px;
}

.data-info {
  display: flex;
  align-items: center;
}

.data-text {
  font-size: 11px;
  color: var(--text-color-3);
}

.actions-section {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.remove-button {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.remove-button:hover {
  opacity: 1;
}

/* 深色主题适配 */
[data-theme="dark"] .icon-wrapper.status-configured {
  background-color: rgba(82, 196, 26, 0.15);
  border-color: rgba(82, 196, 26, 0.3);
}

[data-theme="dark"] .icon-wrapper.status-pending {
  background-color: rgba(250, 173, 20, 0.15);
  border-color: rgba(250, 173, 20, 0.3);
}

[data-theme="dark"] .icon-wrapper.status-error {
  background-color: rgba(255, 77, 79, 0.15);
  border-color: rgba(255, 77, 79, 0.3);
}
</style>