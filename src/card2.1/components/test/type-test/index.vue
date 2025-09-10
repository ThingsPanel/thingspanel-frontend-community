<template>
  <!-- 
    Card2.1 类型测试组件 Vue 实现
    
    这是一个完整的Vue组件示例，展示了如何使用Card2.1类型系统：
    - 使用TypeScript严格类型检查
    - 集成Naive UI组件库和主题系统
    - 实现响应式数据绑定
    - 支持完整的配置系统
    - 集成交互事件系统
    - 遵循Vue 3 Composition API最佳实践
  -->
  
  <div 
    :class="[
      'type-test-component',
      `type-test-component--${config.size}`,
      config.customClassName,
      {
        'type-test-component--bordered': config.showBorder,
        'type-test-component--animating': isAnimating
      }
    ]"
    :style="componentStyles"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 组件主容器 - 使用Naive UI Card作为基础 -->
    <n-card
      :bordered="config.showBorder"
      :size="config.size === 'large' ? 'large' : 'medium'"
      class="type-test-card"
      :class="{
        'type-test-card--dark': isDarkTheme,
        'type-test-card--light': !isDarkTheme
      }"
    >
      <!-- 卡片头部 -->
      <template #header>
        <div class="type-test-header">
          <!-- 主标题 -->
          <n-h3 
            v-if="config.title" 
            class="type-test-title"
            :style="{ fontSize: `${config.fontSize + 4}px` }"
          >
            {{ config.title }}
          </n-h3>
          
          <!-- 副标题 -->
          <n-text 
            v-if="config.subtitle" 
            depth="3" 
            class="type-test-subtitle"
            :style="{ fontSize: `${config.fontSize - 2}px` }"
          >
            {{ config.subtitle }}
          </n-text>
        </div>

        <!-- 状态指示器 -->
        <div class="type-test-status">
          <n-badge
            :type="statusBadgeType"
            :value="statusText"
            :show-zero="false"
          />
        </div>
      </template>

      <!-- 卡片内容区域 -->
      <div 
        class="type-test-content"
        :style="{ 
          padding: `${config.padding}px`,
          fontSize: `${config.fontSize}px` 
        }"
      >
        <!-- 主要数值显示区域 -->
        <div class="type-test-primary-value">
          <n-statistic
            :value="displayPrimaryValue"
            :precision="config.precision"
            :show-separator="true"
            class="primary-statistic"
          >
            <template #suffix>
              <n-text 
                v-if="config.unit" 
                type="info" 
                class="value-unit"
              >
                {{ config.unit }}
              </n-text>
            </template>
            
            <template #prefix>
              <!-- 趋势图标 -->
              <n-icon 
                v-if="trendIcon" 
                :component="trendIcon" 
                :color="trendColor"
                size="18"
                class="trend-icon"
              />
            </template>
          </n-statistic>
        </div>

        <!-- 次要数值显示区域 -->
        <div 
          v-if="config.secondaryValue !== null && config.secondaryValue !== undefined" 
          class="type-test-secondary-value"
        >
          <n-statistic
            :value="config.secondaryValue"
            :precision="config.precision"
            :show-separator="true"
            size="small"
            class="secondary-statistic"
          >
            <template #suffix>
              <n-text type="info" class="value-unit">
                {{ config.unit }}
              </n-text>
            </template>
          </n-statistic>
        </div>

        <!-- 数据信息展示 -->
        <div class="type-test-data-info">
          <n-space vertical size="small">
            <!-- 最后更新时间 -->
            <n-text depth="3" class="update-time">
              最后更新: {{ formattedUpdateTime }}
            </n-text>

            <!-- 数据状态 -->
            <div class="data-status">
              <n-tag 
                :type="statusTagType" 
                size="small"
                round
              >
                <template #icon>
                  <n-icon :component="statusIcon" />
                </template>
                {{ statusText }}
              </n-tag>
            </div>

            <!-- 自定义标签 -->
            <div v-if="customTags.length > 0" class="custom-tags">
              <n-space size="small">
                <n-tag
                  v-for="tag in customTags"
                  :key="tag"
                  size="tiny"
                  round
                >
                  {{ tag }}
                </n-tag>
              </n-space>
            </div>
          </n-space>
        </div>

        <!-- 开发者调试信息 (开发环境) -->
        <div 
          v-if="showDebugInfo && isDevelopment" 
          class="type-test-debug"
        >
          <n-collapse>
            <n-collapse-item title="调试信息" name="debug">
              <n-code 
                :code="debugInfoJson" 
                language="json"
                show-line-numbers
                word-wrap
              />
            </n-collapse-item>
          </n-collapse>
        </div>
      </div>

      <!-- 卡片底部操作区 -->
      <template #action>
        <n-space justify="space-between" align="center">
          <!-- 操作按钮 -->
          <n-space size="small">
            <n-button
              size="small"
              secondary
              @click="handleRefresh"
              :loading="isRefreshing"
            >
              <template #icon>
                <n-icon :component="RefreshIcon" />
              </template>
              刷新
            </n-button>

            <n-button
              v-if="isDevelopment"
              size="small"
              type="info"
              @click="toggleDebugInfo"
            >
              <template #icon>
                <n-icon :component="DebugIcon" />
              </template>
              {{ showDebugInfo ? '隐藏' : '显示' }}调试
            </n-button>
          </n-space>

          <!-- 版本信息 -->
          <n-text depth="3" style="font-size: 11px;">
            Card2.1 v{{ componentVersion }}
          </n-text>
        </n-space>
      </template>
    </n-card>

    <!-- 加载状态遮罩 -->
    <div 
      v-if="isLoading" 
      class="type-test-loading-overlay"
    >
      <n-spin size="medium">
        <template #description>
          正在加载数据...
        </template>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, readonly } from 'vue';
import { 
  NCard, NStatistic, NSpace, NText, NH3, NIcon, NBadge, 
  NTag, NButton, NSpin, NCode, NCollapse, NCollapseItem,
  useThemeVars, useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { 
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as TrendingStableIcon,
  CheckmarkCircle as CheckIcon,
  Warning as WarningIcon,
  Close as ErrorIcon,
  Wifi as OnlineIcon,
  CloudOffline as OfflineIcon,
  Bug as DebugIcon
} from '@vicons/ionicons5'

// 类型导入
import type { TypeTestConfig } from './definition'
import type { 
  ComponentInteractionState,
  InteractionEventType,
  InteractionResponseResult
} from '@/card2.1/types'

// ============ 组件接口定义 ============

/**
 * 组件Props接口
 * 定义了组件接收的所有属性类型
 */
interface Props {
  /** 组件配置对象 */
  config: TypeTestConfig
  /** 组件实例ID */
  instanceId?: string
  /** 是否为编辑模式 */
  isEditMode?: boolean
  /** 外部数据注入 */
  externalData?: Record<string, any>
  /** 交互状态 */
  interactionState?: ComponentInteractionState
}

/**
 * 组件事件接口
 * 定义了组件向外发射的所有事件类型
 */
interface Emits {
  /** 配置变更事件 */
  (event: 'config-change', config: Partial<TypeTestConfig>): void
  /** 数据更新事件 */
  (event: 'data-update', data: any): void
  /** 交互事件触发 */
  (event: 'interaction', eventType: InteractionEventType, data?: any): void
  /** 错误事件 */
  (event: 'error', error: Error): void
  /** 生命周期事件 */
  (event: 'lifecycle', phase: 'mounted' | 'updated' | 'unmounted'): void
}

// ============ 组件设置 ============

// Props定义
const props = withDefaults(defineProps<Props>(), {
  instanceId: () => `type-test-${Math.random().toString(36).substr(2, 9)}`,
  isEditMode: false,
  externalData: () => ({}),
  interactionState: () => ({})
})

// Emits定义
const emit = defineEmits<Emits>()

// ============ 组合式函数集成 ============

// 国际化
const { t } = useI18n()

// 主题系统
const themeStore = useThemeStore()
const themeVars = useThemeVars()

// 消息提示
const message = useMessage()

// ============ 响应式数据 ============

// 组件状态
const isLoading = ref(false)
const isRefreshing = ref(false)
const isAnimating = ref(false)
const showDebugInfo = ref(false)

// 数据状态
const lastUpdateTime = ref(new Date())
const currentStatus = ref<'normal' | 'warning' | 'error' | 'offline'>('normal')
const trendDirection = ref<'up' | 'down' | 'stable'>('stable')

// 动画相关
const displayPrimaryValue = ref(props.config.primaryValue)
const animationTimer = ref<NodeJS.Timeout>()

// ============ 计算属性 ============

/**
 * 是否为深色主题
 */
const isDarkTheme = computed(() => {
  if (props.config.backgroundTheme === 'auto') {
    return themeStore.darkMode
  }
  return props.config.backgroundTheme === 'dark'
})

/**
 * 组件样式计算
 */
const componentStyles = computed(() => ({
  '--primary-color': props.config.primaryColor || themeVars.value.primaryColor,
  '--border-radius': `${props.config.borderRadius}px`,
  '--font-size': `${props.config.fontSize}px`,
  '--padding': `${props.config.padding}px`,
  transition: props.config.enableAnimation ? `all ${props.config.animationDuration}ms ease` : 'none'
}))

/**
 * 状态相关计算属性
 */
const statusText = computed(() => {
  const statusMap = {
    normal: '正常',
    warning: '警告',
    error: '错误',
    offline: '离线'
  }
  return statusMap[currentStatus.value] || '未知'
})

const statusBadgeType = computed(() => {
  const typeMap = {
    normal: 'success' as const,
    warning: 'warning' as const,  
    error: 'error' as const,
    offline: 'default' as const
  }
  return typeMap[currentStatus.value] || 'default'
})

const statusTagType = computed(() => statusBadgeType.value)

const statusIcon = computed(() => {
  const iconMap = {
    normal: CheckIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    offline: OfflineIcon
  }
  return iconMap[currentStatus.value] || OnlineIcon
})

/**
 * 趋势相关计算属性
 */
const trendIcon = computed(() => {
  const iconMap = {
    up: TrendingUpIcon,
    down: TrendingDownIcon,
    stable: TrendingStableIcon
  }
  return iconMap[trendDirection.value]
})

const trendColor = computed(() => {
  const colorMap = {
    up: themeVars.value.successColor,
    down: themeVars.value.errorColor,
    stable: themeVars.value.textColor3
  }
  return colorMap[trendDirection.value]
})

/**
 * 时间格式化
 */
const formattedUpdateTime = computed(() => {
  return lastUpdateTime.value.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

/**
 * 自定义标签处理
 */
const customTags = computed(() => {
  if (Array.isArray(props.config.customTags)) {
    return props.config.customTags
  }
  return []
})

/**
 * 开发环境检测
 */
const isDevelopment = computed(() => {
  return import.meta.env.DEV
})

/**
 * 调试信息JSON
 */
const debugInfoJson = computed(() => {
  const debugInfo = {
    config: props.config,
    instanceId: props.instanceId,
    isEditMode: props.isEditMode,
    externalData: props.externalData,
    interactionState: props.interactionState,
    componentState: {
      isLoading: isLoading.value,
      isRefreshing: isRefreshing.value,
      isAnimating: isAnimating.value,
      currentStatus: currentStatus.value,
      trendDirection: trendDirection.value,
      lastUpdateTime: lastUpdateTime.value
    },
    theme: {
      isDarkTheme: isDarkTheme.value,
      themeVars: themeVars.value
    }
  }
  return JSON.stringify(debugInfo, null, 2)
})

/**
 * 组件版本信息
 */
const componentVersion = computed(() => '2.1.0')

// ============ 方法定义 ============

/**
 * 处理点击事件
 */
const handleClick = (event: MouseEvent) => {
  console.log('组件点击事件:', { instanceId: props.instanceId, event })
  
  // 发射交互事件
  emit('interaction', 'click', {
    position: { x: event.clientX, y: event.clientY },
    timestamp: new Date(),
    config: props.config
  })
  
  // 触发点击动画（如果启用）
  if (props.config.enableAnimation) {
    triggerClickAnimation()
  }
}

/**
 * 处理鼠标悬停事件
 */
const handleMouseEnter = () => {
  emit('interaction', 'hover', {
    type: 'enter',
    timestamp: new Date()
  })
}

const handleMouseLeave = () => {
  emit('interaction', 'hover', {
    type: 'leave', 
    timestamp: new Date()
  })
}

/**
 * 刷新数据
 */
const handleRefresh = async () => {
  if (isRefreshing.value) return
  
  try {
    isRefreshing.value = true
    
    // 模拟数据刷新
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新时间戳
    lastUpdateTime.value = new Date()
    
    // 模拟数据变化
    const newValue = Math.random() * 100
    updatePrimaryValue(newValue)
    
    // 随机更新状态
    const statuses: Array<typeof currentStatus.value> = ['normal', 'warning', 'error', 'offline']
    currentStatus.value = statuses[Math.floor(Math.random() * statuses.length)]
    
    // 随机更新趋势
    const trends: Array<typeof trendDirection.value> = ['up', 'down', 'stable']
    trendDirection.value = trends[Math.floor(Math.random() * trends.length)]
    
    // 发射数据更新事件
    emit('data-update', {
      primaryValue: newValue,
      status: currentStatus.value,
      trend: trendDirection.value,
      timestamp: lastUpdateTime.value
    })
    
    message.success('数据刷新成功')
    
  } catch (error) {
    console.error('数据刷新失败:', error)
    message.error('数据刷新失败')
    emit('error', error as Error)
  } finally {
    isRefreshing.value = false
  }
}

/**
 * 更新主要数值（带动画）
 */
const updatePrimaryValue = (newValue: number) => {
  if (!props.config.enableAnimation) {
    displayPrimaryValue.value = newValue
    return
  }
  
  // 清除之前的动画
  if (animationTimer.value) {
    clearTimeout(animationTimer.value)
  }
  
  isAnimating.value = true
  
  // 数值渐变动画
  const startValue = displayPrimaryValue.value
  const diff = newValue - startValue
  const steps = Math.max(10, Math.min(50, props.config.animationDuration / 20))
  const stepValue = diff / steps
  const stepDuration = props.config.animationDuration / steps
  
  let currentStep = 0
  
  const animate = () => {
    currentStep++
    displayPrimaryValue.value = startValue + (stepValue * currentStep)
    
    if (currentStep < steps) {
      animationTimer.value = setTimeout(animate, stepDuration)
    } else {
      displayPrimaryValue.value = newValue
      isAnimating.value = false
    }
  }
  
  animate()
}

/**
 * 触发点击动画效果
 */
const triggerClickAnimation = () => {
  // 这里可以添加自定义的点击动画效果
  // 例如：缩放动画、波纹效果等
  console.log('触发点击动画效果')
}

/**
 * 切换调试信息显示
 */
const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value
}

// ============ 监听器 ============

/**
 * 监听配置变化
 */
watch(
  () => props.config,
  (newConfig, oldConfig) => {
    console.log('配置发生变化:', { newConfig, oldConfig })
    
    // 如果主要数值发生变化，触发动画更新
    if (newConfig.primaryValue !== oldConfig?.primaryValue) {
      updatePrimaryValue(newConfig.primaryValue)
      
      // 发射数据变化交互事件
      emit('interaction', 'dataChange', {
        field: 'primaryValue',
        oldValue: oldConfig?.primaryValue,
        newValue: newConfig.primaryValue,
        timestamp: new Date()
      })
    }
    
    emit('config-change', newConfig)
  },
  { deep: true }
)

/**
 * 监听外部数据变化
 */
watch(
  () => props.externalData,
  (newData) => {
    console.log('外部数据发生变化:', newData)
    
    // 处理外部数据更新逻辑
    if (newData.primaryValue !== undefined) {
      updatePrimaryValue(newData.primaryValue)
    }
    
    if (newData.status) {
      currentStatus.value = newData.status
    }
    
    if (newData.trend) {
      trendDirection.value = newData.trend
    }
    
    lastUpdateTime.value = new Date()
  },
  { deep: true }
)

/**
 * 监听交互状态变化
 */
watch(
  () => props.interactionState,
  (newState) => {
    console.log('交互状态发生变化:', newState)
    // 这里可以根据交互状态调整组件样式
  },
  { deep: true }
)

// ============ 生命周期钩子 ============

onMounted(() => {
  console.log('类型测试组件已挂载:', props.instanceId)
  
  // 初始化数据
  lastUpdateTime.value = new Date()
  updatePrimaryValue(props.config.primaryValue)
  
  // 发射生命周期事件
  emit('lifecycle', 'mounted')
  
  nextTick(() => {
    console.log('组件DOM已更新完成')
  })
})

onUnmounted(() => {
  console.log('类型测试组件即将卸载:', props.instanceId)
  
  // 清理定时器
  if (animationTimer.value) {
    clearTimeout(animationTimer.value)
  }
  
  // 发射生命周期事件
  emit('lifecycle', 'unmounted')
})

// ============ 组件暴露 ============

/**
 * 向外暴露的方法和属性
 * 供父组件或编辑器调用
 */
defineExpose({
  // 实例信息
  instanceId: props.instanceId,
  componentType: 'type-test',
  version: componentVersion,
  
  // 状态访问
  isLoading: readonly(isLoading),
  currentStatus: readonly(currentStatus),
  lastUpdateTime: readonly(lastUpdateTime),
  
  // 方法暴露
  refresh: handleRefresh,
  updateValue: updatePrimaryValue,
  toggleDebug: toggleDebugInfo,
  
  // 配置访问
  getConfig: () => props.config,
  getDebugInfo: () => JSON.parse(debugInfoJson.value)
})
</script>

<style scoped>
/**
 * 组件样式定义
 * 遵循BEM命名规范，支持主题切换
 */

.type-test-component {
  position: relative;
  width: 100%;
  height: 100%;
  font-family: inherit;
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: var(--n-bezier) var(--n-duration-slow);
}

/* 尺寸变体 */
.type-test-component--small {
  min-height: 120px;
}

.type-test-component--medium {
  min-height: 180px;
}

.type-test-component--large {
  min-height: 240px;
}

/* 边框变体 */
.type-test-component--bordered {
  border: 1px solid var(--n-border-color);
}

/* 动画状态 */
.type-test-component--animating {
  transform: scale(1.02);
}

/* 卡片容器 */
.type-test-card {
  width: 100%;
  height: 100%;
}

.type-test-card--dark {
  background-color: var(--n-color-modal);
  color: var(--n-text-color);
}

.type-test-card--light {
  background-color: var(--n-card-color);
  color: var(--n-text-color);
}

/* 头部样式 */
.type-test-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-test-title {
  margin: 0 !important;
  font-weight: 600;
  color: var(--primary-color);
}

.type-test-subtitle {
  margin: 0;
  opacity: 0.8;
}

.type-test-status {
  margin-left: auto;
}

/* 内容区域 */
.type-test-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--padding);
}

/* 数值显示 */
.type-test-primary-value {
  text-align: center;
}

.primary-statistic :deep(.n-statistic-value) {
  font-size: 2.5em;
  font-weight: 700;
  color: var(--primary-color);
}

.type-test-secondary-value {
  text-align: center;
  opacity: 0.8;
}

.secondary-statistic :deep(.n-statistic-value) {
  font-size: 1.2em;
  font-weight: 500;
}

.value-unit {
  margin-left: 4px;
  font-size: 0.8em;
  opacity: 0.7;
}

.trend-icon {
  margin-right: 8px;
  vertical-align: middle;
}

/* 数据信息 */
.type-test-data-info {
  padding: 12px;
  background-color: var(--n-color-popover);
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
}

.update-time {
  font-size: 12px;
}

.data-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-tags {
  margin-top: 8px;
}

/* 调试信息 */
.type-test-debug {
  margin-top: 16px;
  padding: 12px;
  background-color: var(--n-color-modal);
  border-radius: 6px;
  border: 1px dashed var(--n-border-color);
}

/* 加载遮罩 */
.type-test-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* 深色模式适配 */
.type-test-component--dark .type-test-loading-overlay {
  background-color: rgba(0, 0, 0, 0.6);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .type-test-content {
    padding: 12px;
    gap: 12px;
  }
  
  .primary-statistic :deep(.n-statistic-value) {
    font-size: 2em;
  }
  
  .type-test-header {
    gap: 2px;
  }
}

/* 打印样式 */
@media print {
  .type-test-component {
    background-color: white !important;
    color: black !important;
    border: 1px solid #ccc;
  }
  
  .type-test-debug,
  .type-test-loading-overlay {
    display: none !important;
  }
}

/* 动画定义 */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.type-test-component--animating .primary-statistic {
  animation: pulse 0.3s ease-in-out;
}

/* 可访问性增强 */
.type-test-component:focus-within {
  outline: 2px solid var(--n-color-primary);
  outline-offset: 2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .type-test-component {
    border: 2px solid currentColor;
  }
  
  .type-test-title {
    font-weight: 800;
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .type-test-component,
  .type-test-component--animating,
  .primary-statistic {
    transition: none !important;
    animation: none !important;
  }
}
</style>