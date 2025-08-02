<template>
  <div 
    class="state-display-container"
    :style="containerStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <!-- 状态图标 -->
    <div 
      class="state-icon"
      :style="iconStyle"
      :class="{
        'state-icon--hover': isHovered && config.interaction?.hover?.enabled,
        'state-icon--active': isActive,
        'state-icon--inactive': !isActive
      }"
    >
      <component 
        :is="currentIcon" 
        :style="{ 
          fontSize: `${iconSize}px`,
          color: currentColor,
          transition: `all ${config.interaction?.hover?.duration || 200}ms ease`
        }"
      />
    </div>

    <!-- 设备名称 -->
    <div 
      v-if="config.basic?.showDeviceName && displayDeviceName"
      class="device-name"
      :style="textStyle"
    >
      {{ displayDeviceName }}
    </div>

    <!-- 指标名称 -->
    <div 
      v-if="config.basic?.showMetricName && displayMetricName"
      class="metric-name"
      :style="textStyle"
    >
      {{ displayMetricName }}
    </div>

    <!-- 状态文本 -->
    <div 
      v-if="showStatusText"
      class="status-text"
      :style="textStyle"
    >
      {{ statusText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useComponentData } from '../../../core/composables/useComponentData'
import { useComponentResize } from '../../../core/composables/useComponentResize'
import type { StateDisplayConfig } from './index'

// Ionicons 图标导入
import {
  Bulb,
  BulbOutline,
  Power,
  PowerOutline,
  CheckmarkCircle,
  CheckmarkCircleOutline,
  CloseCircle,
  CloseCircleOutline,
  Play,
  PlayOutline,
  Pause,
  PauseOutline,
  Stop,
  StopOutline
} from '@vicons/ionicons5'

// 定义 Props
interface Props {
  config: StateDisplayConfig
  data?: any
  deviceId?: string
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  width: 200,
  height: 100
})

// 定义 Emits
const emit = defineEmits<{
  dataUpdate: [data: any]
  error: [error: Error]
  click: [event: MouseEvent]
}>()

// 响应式数据
const isHovered = ref(false)
const currentData = ref<any>(null)
const autoRefreshTimer = ref<NodeJS.Timeout | null>(null)

// 使用组合式函数
const { processedData, loading, error } = useComponentData(props, emit)
const { containerSize } = useComponentResize(props)

// 图标映射
const iconMap = {
  'Bulb': Bulb,
  'BulbOutline': BulbOutline,
  'Power': Power,
  'PowerOutline': PowerOutline,
  'CheckmarkCircle': CheckmarkCircle,
  'CheckmarkCircleOutline': CheckmarkCircleOutline,
  'CloseCircle': CloseCircle,
  'CloseCircleOutline': CloseCircleOutline,
  'Play': Play,
  'PlayOutline': PlayOutline,
  'Pause': Pause,
  'PauseOutline': PauseOutline,
  'Stop': Stop,
  'StopOutline': StopOutline
}

// 计算属性
const isActive = computed(() => {
  if (!processedData.value) return false
  
  const currentValue = processedData.value.currentValue
  const activeValue = props.config.state?.activeValue
  
  // 严格比较值
  if (activeValue !== undefined) {
    return String(currentValue) === String(activeValue)
  }
  
  // 默认逻辑：非零、非空、非false为激活状态
  return Boolean(currentValue) && currentValue !== '0' && currentValue !== 0
})

const currentIcon = computed(() => {
  const activeIcon = props.config.state?.activeIcon || 'BulbOutline'
  const inactiveIcon = props.config.state?.inactiveIcon || 'Bulb'
  const iconName = isActive.value ? activeIcon : inactiveIcon
  return iconMap[iconName as keyof typeof iconMap] || BulbOutline
})

const currentColor = computed(() => {
  const activeColor = props.config.state?.activeColor || '#FFA500'
  const inactiveColor = props.config.state?.inactiveColor || '#808080'
  return isActive.value ? activeColor : inactiveColor
})

const iconSize = computed(() => {
  const baseSize = props.config.style?.icon?.size || 48
  const scale = isHovered.value && props.config.interaction?.hover?.enabled 
    ? (props.config.interaction.hover.scale || 1.1) 
    : 1
  return Math.round(baseSize * scale)
})

const displayDeviceName = computed(() => {
  return props.config.basic?.customDeviceName || '设备名称'
})

const displayMetricName = computed(() => {
  return props.config.basic?.customMetricName || props.config.data?.key || '状态'
})

const statusText = computed(() => {
  return isActive.value ? '开启' : '关闭'
})

const showStatusText = computed(() => {
  // 可以根据配置决定是否显示状态文本
  return false // 默认不显示，可以在配置中添加选项
})

// 样式计算
const containerStyle = computed(() => {
  const style = props.config.style?.container || {}
  const padding = style.padding || {}
  
  return {
    backgroundColor: style.backgroundColor || 'transparent',
    border: style.border?.show 
      ? `${style.border.width || 1}px solid ${style.border.color || '#d9d9d9'}`
      : 'none',
    borderRadius: `${style.border?.radius || 4}px`,
    padding: `${padding.top || 16}px ${padding.right || 16}px ${padding.bottom || 16}px ${padding.left || 16}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: style.align === 'start' ? 'flex-start' : 
                style.align === 'end' ? 'flex-end' : 'center',
    justifyContent: style.verticalAlign === 'start' ? 'flex-start' : 
                   style.verticalAlign === 'end' ? 'flex-end' : 'center',
    width: '100%',
    height: '100%',
    cursor: props.config.interaction?.click?.enabled ? 'pointer' : 'default'
  }
})

const iconStyle = computed(() => {
  const iconConfig = props.config.style?.icon || {}
  const shadow = iconConfig.shadow || {}
  
  return {
    margin: `${iconConfig.margin || 8}px`,
    boxShadow: shadow.show 
      ? `${shadow.offsetX || 0}px ${shadow.offsetY || 2}px ${shadow.blur || 4}px ${shadow.color || 'rgba(0, 0, 0, 0.1)'}`
      : 'none',
    transition: `transform ${props.config.interaction?.hover?.duration || 200}ms ease`
  }
})

const textStyle = computed(() => {
  const textConfig = props.config.style?.text || {}
  
  return {
    fontSize: `${textConfig.fontSize || 14}px`,
    color: textConfig.color || '#666666',
    fontWeight: textConfig.fontWeight || 'normal',
    fontFamily: textConfig.fontFamily || 'inherit',
    margin: `${textConfig.margin || 8}px 0`,
    textAlign: 'center'
  }
})

// 事件处理
const handleMouseEnter = () => {
  if (props.config.interaction?.hover?.enabled) {
    isHovered.value = true
  }
}

const handleMouseLeave = () => {
  if (props.config.interaction?.hover?.enabled) {
    isHovered.value = false
  }
}

const handleClick = (event: MouseEvent) => {
  if (props.config.interaction?.click?.enabled) {
    emit('click', event)
    
    // 触发点击动画
    const animation = props.config.interaction.click.animation
    if (animation) {
      // 这里可以添加动画逻辑
      console.log(`Triggering ${animation} animation`)
    }
  }
}

// 自动刷新逻辑
const setupAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
  }
  
  const autoRefresh = props.config.advanced?.autoRefresh
  if (autoRefresh?.enabled && autoRefresh.interval) {
    autoRefreshTimer.value = setInterval(() => {
      // 触发数据刷新
      emit('dataUpdate', { refresh: true })
    }, autoRefresh.interval * 1000)
  }
}

// 监听配置变化
watch(
  () => props.config.advanced?.autoRefresh,
  () => {
    setupAutoRefresh()
  },
  { deep: true }
)

// 监听数据变化
watch(
  processedData,
  (newData) => {
    currentData.value = newData
    emit('dataUpdate', newData)
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  setupAutoRefresh()
})

onUnmounted(() => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
  }
})
</script>

<style scoped lang="scss">
.state-display-container {
  position: relative;
  overflow: hidden;
  
  .state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    
    &--hover {
      transform: scale(var(--hover-scale, 1.1));
    }
    
    &--active {
      // 激活状态样式
    }
    
    &--inactive {
      // 非激活状态样式
    }
  }
  
  .device-name,
  .metric-name,
  .status-text {
    text-align: center;
    word-break: break-word;
    line-height: 1.4;
  }
}

// 响应式样式
@media (max-width: 480px) {
  .state-display-container {
    .state-icon {
      svg {
        font-size: 32px !important;
      }
    }
    
    .device-name,
    .metric-name,
    .status-text {
      font-size: 12px !important;
    }
  }
}

@media (max-width: 768px) {
  .state-display-container {
    .state-icon {
      svg {
        font-size: 40px !important;
      }
    }
    
    .device-name,
    .metric-name,
    .status-text {
      font-size: 13px !important;
    }
  }
}

// 动画效果
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-8px); }
  70% { transform: translateY(-4px); }
  90% { transform: translateY(-2px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.state-display-container {
  &.animate-pulse {
    animation: pulse 0.6s ease-in-out;
  }
  
  &.animate-bounce {
    animation: bounce 0.6s ease-in-out;
  }
  
  &.animate-shake {
    animation: shake 0.6s ease-in-out;
  }
}
</style>