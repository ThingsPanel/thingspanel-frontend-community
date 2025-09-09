<script setup lang="ts">
/**
 * alarm-count 告警计数组件主组件
 * 展示系统告警设备总数的统计信息，支持动态数据和动画效果
 */

import { computed, reactive, ref, onMounted } from 'vue'
import type { AlarmCountConfig, AlarmCountCustomize } from './settingConfig'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'
import { getAlarmCount } from '@/service/api'
// CountTo 是全局注册的组件，无需导入

const logger = createLogger('AlarmCount')

// 组件状态接口
interface ComponentState {
  isActive: boolean
  clickCount: number
  currentValue: number
  loading: boolean
  error: string | null
}

// 组件props
interface Props {
  /** 新的CustomConfig结构配置 */
  customConfig?: AlarmCountConfig
  /** 向后兼容：旧的config结构 */
  config?: Partial<AlarmCountCustomize>
  /** 组件ID */
  componentId?: string
  /** 预览模式 */
  previewMode?: boolean
  /** 绑定的数据 */
  boundData?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
  config: () => ({}),
  previewMode: false,
  boundData: () => ({})
})

// 组件事件定义
interface Emits {
  (e: 'click', data: { componentId: string; timestamp: string; value: number }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
  (e: 'dataChange', data: { componentId: string; property: string; value: any }): void
}

const emit = defineEmits<Emits>()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  clickCount: 0,
  currentValue: 0,
  loading: false,
  error: null
})

/**
 * 获取组件配置 - 支持新旧格式
 * 优先使用 customConfig.customize，回退到 config
 */
const currentCustomize = computed((): AlarmCountCustomize => {
  console.log(`🔧 [AlarmCount] Props调试:`, {
    componentId: props.componentId,
    hasCustomConfig: !!props.customConfig,
    customConfig: props.customConfig,
    hasConfig: !!props.config,
    config: props.config,
    hasBoundData: !!props.boundData,
    boundData: props.boundData
  })

  // 优先使用新的customConfig结构
  if (props.customConfig?.customize) {
    console.log(`✅ [AlarmCount] 使用customConfig.customize`)
    return props.customConfig.customize
  }

  // 回退到旧的config结构（向后兼容）
  console.log(`⚠️ [AlarmCount] 回退到config结构`)
  const fallbackConfig = {
    title: props.config?.title || $t('card.alarmCount'),
    unit: props.config?.unit || '个',
    startColor: props.config?.startColor || '#f97316',
    endColor: props.config?.endColor || '#ef4444',
    icon: props.config?.icon || '🚨',
    animationDuration: props.config?.animationDuration || 1500,
    showIcon: props.config?.showIcon ?? true,
    prefix: props.config?.prefix || '',
    suffix: props.config?.suffix || '',
    enableAnimation: props.config?.enableAnimation ?? true
  }

  console.log(`🔧 [AlarmCount] 最终配置:`, fallbackConfig)
  return fallbackConfig
})

/**
 * 获取当前告警数值
 * 优先级：外部传入数据 > 内部API数据 > 模拟数据
 */
const currentAlarmValue = computed(() => {
  // 1. 从绑定数据中获取
  if (props.boundData?.alarmCount !== undefined) {
    return props.boundData.alarmCount
  }

  // 2. 从API响应数据中获取（兼容原组件格式）
  if (props.boundData?.alarm_device_total !== undefined) {
    return props.boundData.alarm_device_total
  }

  // 3. 从组件状态中获取
  if (componentState.currentValue > 0) {
    return componentState.currentValue
  }

  // 4. 预览模式使用模拟数据
  if (props.previewMode) {
    return Math.floor(Math.random() * 50) + 1
  }

  // 5. 默认值
  return 0
})

/**
 * 获取渐变样式
 */
const gradientStyle = computed(() => {
  try {
    console.log(`🔧 [AlarmCount] 渐变样式计算:`, {
      currentCustomize: currentCustomize.value,
      hasCurrentCustomize: !!currentCustomize.value,
      startColor: currentCustomize.value?.startColor,
      endColor: currentCustomize.value?.endColor
    })

    if (!currentCustomize.value) {
      console.error(`❌ [AlarmCount] currentCustomize.value is undefined!`)
      return 'linear-gradient(135deg, #f97316, #ef4444)' // 默认渐变
    }

    const startColor = currentCustomize.value.startColor || '#f97316'
    const endColor = currentCustomize.value.endColor || '#ef4444'
    const gradient = `linear-gradient(135deg, ${startColor}, ${endColor})`

    console.log(`✅ [AlarmCount] 渐变样式生成:`, gradient)
    return gradient
  } catch (error) {
    console.error(`❌ [AlarmCount] 渐变样式计算错误:`, error)
    return 'linear-gradient(135deg, #f97316, #ef4444)' // 安全后备
  }
})

/**
 * 获取变换配置
 */
const currentTransform = computed(() => {
  return props.customConfig?.root?.transform || { rotate: 0, scale: 1 }
})

/**
 * 获取告警数据的API调用
 * 直接调用系统API获取真实告警数据
 */
const fetchAlarmData = async () => {
  try {
    componentState.loading = true
    componentState.error = null

    // 调用真实的告警计数API
    const response = await getAlarmCount()

    // 从响应中获取告警设备总数
    let alarmCount = 0
    if (response && response.data && typeof response.data.alarm_device_total === 'number') {
      alarmCount = response.data.alarm_device_total
    } else {
      logger.warn('告警数据响应格式异常', response)
      alarmCount = 0
    }

    componentState.currentValue = alarmCount

    // 触发数据变化事件
    emit('dataChange', {
      componentId: props.componentId || '',
      property: 'alarmCount',
      value: alarmCount
    })

    logger.info('告警数据获取成功', { value: alarmCount })
  } catch (error) {
    componentState.error = error instanceof Error ? error.message : '获取告警数据失败'
    componentState.currentValue = 0
    logger.error('告警数据获取失败:', error)
  } finally {
    componentState.loading = false
  }
}

/**
 * 点击处理函数
 */
const handleClick = () => {
  componentState.clickCount++

  emit('click', {
    componentId: props.componentId || '',
    timestamp: new Date().toISOString(),
    value: currentAlarmValue.value
  })

  logger.info('告警卡片被点击', { value: currentAlarmValue.value })
}

/**
 * 悬停处理函数
 */
const handleMouseEnter = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'enter'
  })
}

const handleMouseLeave = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'leave'
  })
}

// 组件挂载时获取数据
onMounted(() => {
  if (!props.previewMode && !props.boundData?.alarmCount && !props.boundData?.alarm_device_total) {
    fetchAlarmData()
  }
})

// 暴露方法给父组件
defineExpose({
  fetchAlarmData,
  componentState,
  currentCustomize,
  currentAlarmValue
})
</script>

<template>
  <div
    class="alarm-count-card"
    :class="{
      'preview-mode': previewMode,
      loading: componentState.loading
    }"
    :style="{
      backgroundImage: gradientStyle,
      transform: `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`
    }"
    :data-component-id="componentId"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 加载状态 -->
    <div v-if="componentState.loading" class="loading-overlay">
      <n-spin size="small" />
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="componentState.error" class="error-overlay">
      <n-icon name="warning" />
      <span>{{ componentState.error }}</span>
    </div>

    <!-- 正常内容 -->
    <div v-else class="card-content">
      <!-- 标题 -->
      <h3 class="card-title">{{ currentCustomize.title }}</h3>

      <!-- 主要内容区 -->
      <div class="main-content">
        <!-- 图标 -->
        <div v-if="currentCustomize.showIcon" class="icon-section">
          <span class="alarm-icon">{{ currentCustomize.icon }}</span>
        </div>

        <!-- 数值显示 -->
        <div class="value-section">
          <!-- 使用CountTo组件实现数字动画 -->
          <CountTo
            v-if="currentCustomize.enableAnimation"
            :prefix="currentCustomize.prefix"
            :suffix="currentCustomize.suffix || currentCustomize.unit"
            :start-value="0"
            :end-value="currentAlarmValue"
            :duration="currentCustomize.animationDuration"
            class="count-number"
          />
          <!-- 静态数值显示 -->
          <span v-else class="count-number static">
            {{ currentCustomize.prefix }}{{ currentAlarmValue }}{{ currentCustomize.suffix || currentCustomize.unit }}
          </span>
        </div>
      </div>

      <!-- 组件信息（仅在预览模式显示） -->
      <div v-if="previewMode" class="component-info">
        <small>ID: {{ componentId || '未设置' }}</small>
        <small>点击: {{ componentState.clickCount }}次</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alarm-count-card {
  width: 100%;
  height: 100%;
  min-width: max-content;
  min-height: max-content;
  padding: 16px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.alarm-count-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.alarm-count-card.loading {
  pointer-events: none;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  gap: 8px;
  font-size: 14px;
}

.error-overlay {
  background: rgba(220, 38, 127, 0.8);
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 30px;
}

.icon-section {
  display: flex;
  align-items: center;
}

.alarm-icon {
  font-size: 32px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.value-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
}

.count-number {
  font-size: 30px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  text-align: right;
}

.count-number.static {
  font-size: 30px;
}

.component-info {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 400px) {
  .alarm-count-card {
    padding: 12px;
  }

  .card-title {
    font-size: 14px;
  }

  .alarm-icon {
    font-size: 24px;
  }

  .count-number {
    font-size: 24px;
  }

  .main-content {
    padding-top: 20px;
  }
}

/* 小高度适配 */
@media (max-height: 150px) {
  .main-content {
    padding-top: 15px;
  }

  .component-info {
    display: none;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .alarm-count-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

[data-theme='dark'] .alarm-count-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
</style>
