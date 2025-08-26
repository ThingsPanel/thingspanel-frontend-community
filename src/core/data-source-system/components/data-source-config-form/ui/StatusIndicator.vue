<template>
  <div class="status-indicator">
    <!-- 简洁模式显示 -->
    <div v-if="displayMode === 'compact'" class="compact-display">
      <n-space align="center" :size="8">
        <!-- 状态图标 -->
        <n-icon :size="iconSize" :color="statusColor" class="status-icon">
          <component :is="statusIcon" />
        </n-icon>

        <!-- 状态文本 -->
        <n-text :type="textType" :strong="showStrong" class="status-text">
          {{ statusText }}
        </n-text>

        <!-- 时间戳（可选） -->
        <n-text v-if="showTimestamp" depth="3" class="timestamp text-xs">
          {{ formattedTimestamp }}
        </n-text>
      </n-space>
    </div>

    <!-- 详细模式显示 -->
    <div v-else-if="displayMode === 'detailed'" class="detailed-display">
      <n-card size="small" :bordered="true" :style="{ borderColor: statusColor }">
        <n-space vertical :size="12">
          <!-- 主状态行 -->
          <n-space align="center" justify="space-between">
            <n-space align="center">
              <n-icon :size="iconSize" :color="statusColor" class="status-icon">
                <component :is="statusIcon" />
              </n-icon>
              <div>
                <n-text :type="textType" :strong="true" class="status-title">
                  {{ statusText }}
                </n-text>
                <n-text v-if="statusDescription" depth="2" class="status-description block text-sm">
                  {{ statusDescription }}
                </n-text>
              </div>
            </n-space>

            <!-- 状态标签 -->
            <n-tag :type="tagType" size="small" round>
              {{ statusLabel }}
            </n-tag>
          </n-space>

          <!-- 额外信息 -->
          <div v-if="hasExtraInfo" class="extra-info">
            <n-space vertical :size="4">
              <n-text v-if="showTimestamp" depth="3" class="text-xs">
                {{ $t('dataSource.status.lastUpdate') }}: {{ formattedTimestamp }}
              </n-text>

              <n-text v-if="duration" depth="3" class="text-xs">
                {{ $t('dataSource.status.duration') }}: {{ formattedDuration }}
              </n-text>

              <n-text v-if="progress !== undefined" depth="3" class="text-xs">
                {{ $t('dataSource.status.progress') }}: {{ progress }}%
              </n-text>
            </n-space>

            <!-- 进度条 -->
            <n-progress
              v-if="progress !== undefined && showProgress"
              :percentage="progress"
              :status="progressStatus"
              :show-indicator="false"
              class="mt-2"
            />
          </div>
        </n-space>
      </n-card>
    </div>

    <!-- 仅图标模式 -->
    <div v-else-if="displayMode === 'icon-only'" class="icon-only-display">
      <n-tooltip :trigger="'hover'">
        <template #trigger>
          <n-icon :size="iconSize" :color="statusColor" class="status-icon cursor-pointer">
            <component :is="statusIcon" />
          </n-icon>
        </template>
        <div class="tooltip-content">
          <n-space vertical :size="4">
            <n-text strong>{{ statusText }}</n-text>
            <n-text v-if="statusDescription" depth="2" class="text-sm">
              {{ statusDescription }}
            </n-text>
            <n-text v-if="showTimestamp" depth="3" class="text-xs">
              {{ formattedTimestamp }}
            </n-text>
          </n-space>
        </div>
      </n-tooltip>
    </div>

    <!-- 徽章模式 -->
    <div v-else-if="displayMode === 'badge'" class="badge-display">
      <n-badge :value="badgeValue" :type="badgeType" :show-zero="showZero" :max="badgeMax">
        <n-icon :size="iconSize" :color="statusColor" class="status-icon">
          <component :is="statusIcon" />
        </n-icon>
      </n-badge>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 状态指示器组件
 * 提供多种显示模式的状态指示功能，支持图标、文本、进度条、徽章等多种形式
 */

import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import {
  CheckmarkCircleOutline,
  AlertCircleOutline,
  CloseCircleOutline,
  TimeOutline,
  SyncOutline,
  PauseCircleOutline,
  PlayCircleOutline,
  InformationCircleOutline
} from '@vicons/ionicons5'
import type { TagType } from 'naive-ui'

// 状态类型定义
export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'loading' | 'pending' | 'paused' | 'unknown'

export type DisplayMode =
  | 'compact' // 紧凑模式：图标+文字
  | 'detailed' // 详细模式：卡片形式
  | 'icon-only' // 仅图标模式
  | 'badge' // 徽章模式

// 组件接口定义
interface Props {
  /** 状态类型 */
  status: StatusType
  /** 显示模式 */
  displayMode?: DisplayMode
  /** 状态文本 */
  text?: string
  /** 状态描述 */
  description?: string
  /** 自定义状态标签 */
  label?: string
  /** 时间戳 */
  timestamp?: number | Date
  /** 是否显示时间戳 */
  showTimestamp?: boolean
  /** 持续时间（毫秒） */
  duration?: number
  /** 进度百分比（0-100） */
  progress?: number
  /** 是否显示进度条 */
  showProgress?: boolean
  /** 图标大小 */
  iconSize?: number
  /** 是否加粗文本 */
  strong?: boolean
  /** 徽章值（仅badge模式） */
  badgeValue?: number | string
  /** 徽章最大值 */
  badgeMax?: number
  /** 是否显示0值徽章 */
  showZero?: boolean
  /** 自定义图标组件 */
  customIcon?: any
  /** 自定义颜色 */
  customColor?: string
}

interface Emits {
  /** 状态点击事件 */
  click: [status: StatusType]
  /** 状态变化事件 */
  'status-change': [oldStatus: StatusType, newStatus: StatusType]
}

// Props和Emits
const props = withDefaults(defineProps<Props>(), {
  displayMode: 'compact',
  showTimestamp: false,
  showProgress: true,
  iconSize: 16,
  strong: false,
  badgeMax: 99,
  showZero: false
})

const emit = defineEmits<Emits>()

// 基础设置
const { t } = useI18n()
const themeStore = useThemeStore()

// 状态图标映射
const statusIconMap = {
  success: CheckmarkCircleOutline,
  warning: AlertCircleOutline,
  error: CloseCircleOutline,
  info: InformationCircleOutline,
  loading: SyncOutline,
  pending: TimeOutline,
  paused: PauseCircleOutline,
  unknown: InformationCircleOutline
}

// 状态颜色映射
const statusColorMap = {
  success: 'var(--success-color)',
  warning: 'var(--warning-color)',
  error: 'var(--error-color)',
  info: 'var(--info-color)',
  loading: 'var(--primary-color)',
  pending: 'var(--warning-color)',
  paused: 'var(--text-color-3)',
  unknown: 'var(--text-color-3)'
}

// 状态文本映射
const statusTextMap = {
  success: () => t('dataSource.status.success'),
  warning: () => t('dataSource.status.warning'),
  error: () => t('dataSource.status.error'),
  info: () => t('dataSource.status.info'),
  loading: () => t('dataSource.status.loading'),
  pending: () => t('dataSource.status.pending'),
  paused: () => t('dataSource.status.paused'),
  unknown: () => t('dataSource.status.unknown')
}

// 计算属性
const statusIcon = computed(() => {
  return props.customIcon || statusIconMap[props.status]
})

const statusColor = computed(() => {
  return props.customColor || statusColorMap[props.status]
})

const statusText = computed(() => {
  return props.text || statusTextMap[props.status]()
})

const statusDescription = computed(() => {
  return props.description
})

const statusLabel = computed(() => {
  return props.label || statusText.value
})

const textType = computed((): TagType => {
  switch (props.status) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    case 'info':
      return 'info'
    default:
      return 'default'
  }
})

const tagType = computed((): TagType => {
  return textType.value
})

const badgeType = computed((): TagType => {
  return textType.value
})

const progressStatus = computed(() => {
  switch (props.status) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    case 'loading':
      return 'info'
    default:
      return 'default'
  }
})

const showStrong = computed(() => {
  return props.strong || props.status === 'error'
})

const hasExtraInfo = computed(() => {
  return props.showTimestamp || props.duration !== undefined || props.progress !== undefined
})

const formattedTimestamp = computed(() => {
  if (!props.timestamp) return '-'

  const date = props.timestamp instanceof Date ? props.timestamp : new Date(props.timestamp)
  return date.toLocaleString()
})

const formattedDuration = computed(() => {
  if (props.duration === undefined) return '-'

  const seconds = Math.floor(props.duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
})

const badgeValue = computed(() => {
  if (props.badgeValue !== undefined) return props.badgeValue

  // 根据状态自动计算徽章值
  switch (props.status) {
    case 'error':
      return '!'
    case 'warning':
      return '?'
    case 'loading':
      return '...'
    default:
      return undefined
  }
})

/**
 * 处理状态点击
 */
const handleClick = () => {
  emit('click', props.status)
}

/**
 * 获取状态信息
 */
const getStatusInfo = () => {
  return {
    status: props.status,
    text: statusText.value,
    description: statusDescription.value,
    timestamp: props.timestamp,
    duration: props.duration,
    progress: props.progress
  }
}

/**
 * 状态动画类
 */
const getAnimationClass = () => {
  switch (props.status) {
    case 'loading':
      return 'animate-spin'
    case 'success':
      return 'animate-pulse'
    default:
      return ''
  }
}

// 监听状态变化
let previousStatus: StatusType = props.status
watch(
  () => props.status,
  (newStatus, oldStatus) => {
    if (newStatus !== oldStatus) {
      emit('status-change', oldStatus, newStatus)
      previousStatus = oldStatus
    }
  }
)

// 导出方法供父组件调用
defineExpose({
  getStatusInfo,
  handleClick
})
</script>

<style scoped>
/**
 * 状态指示器组件样式
 */

.status-indicator {
  display: inline-block;
}

/* 紧凑模式样式 */
.compact-display {
  display: inline-flex;
  align-items: center;
}

/* 详细模式样式 */
.detailed-display {
  display: block;
}

.status-title {
  font-size: 14px;
  line-height: 1.4;
}

.status-description {
  font-size: 12px;
  line-height: 1.3;
  margin-top: 2px;
}

/* 仅图标模式样式 */
.icon-only-display {
  display: inline-block;
}

/* 徽章模式样式 */
.badge-display {
  display: inline-block;
}

/* 状态图标样式 */
.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.status-icon.animate-spin {
  animation: spin 1s linear infinite;
}

.status-icon.animate-pulse {
  animation: pulse 1s ease-in-out infinite;
}

/* 状态文本样式 */
.status-text {
  user-select: none;
  transition: color 0.3s ease;
}

/* 时间戳样式 */
.timestamp {
  font-family: monospace;
  opacity: 0.7;
}

/* 额外信息样式 */
.extra-info {
  padding-top: 8px;
  border-top: 1px solid var(--divider-color);
}

/* 工具提示内容样式 */
.tooltip-content {
  max-width: 300px;
}

/* 工具类 */
.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.block {
  display: block;
}

.cursor-pointer {
  cursor: pointer;
}

.mt-2 {
  margin-top: 0.5rem;
}

/* 动画定义 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detailed-display .n-space {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-title {
    font-size: 13px;
  }

  .status-description {
    font-size: 11px;
  }
}

/* 交互效果 */
.status-indicator:hover .status-icon {
  transform: scale(1.1);
}

.status-indicator:active .status-icon {
  transform: scale(0.95);
}

/* 暗主题适配 */
[data-theme='dark'] .extra-info {
  border-top-color: rgba(255, 255, 255, 0.1);
}

/* 状态特定样式 */
.status-indicator[data-status='error'] .status-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

.status-indicator[data-status='loading'] .status-icon {
  animation: spin 1s linear infinite;
}

.status-indicator[data-status='success'] .status-icon {
  animation: pulse 0.8s ease-out;
}
</style>
