<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { NSlider } from 'naive-ui'
import type { DigitSetterConfig } from './index'
import { attributeDataPub, getAttributeDataSet, telemetryDataCurrentKeys, telemetryDataPub } from '@/service/api/device'
import { $t } from '@/locales'

/**
 * 组件属性接口
 */
interface Props {
  /** 组件配置 */
  config?: DigitSetterConfig
  /** 数据源配置 */
  dataSource?: any
  /** 组件尺寸 */
  size?: { width: number; height: number }
  /** 主题配置 */
  theme?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  dataSource: () => ({}),
  size: () => ({ width: 300, height: 150 }),
  theme: () => ({})
})

// 响应式数据
const currentValue = ref<number>(0)
const unit = ref<string>('')
const fontSize = ref<string>('14px')
const cardRef = ref<HTMLElement | null>(null)
const isUpdating = ref<boolean>(false)
let resizeObserver: ResizeObserver | null = null
let updateTimer: NodeJS.Timeout | null = null

// 计算属性
const displayConfig = computed(() => props.config?.display || {})
const valueConfig = computed(() => props.config?.value || {})
const sliderConfig = computed(() => props.config?.slider || {})
const styleConfig = computed(() => props.config?.style || {})
const dataConfig = computed(() => props.config?.data || {})
const interactionConfig = computed(() => props.config?.interaction || {})

const min = computed(() => Number(valueConfig.value.min) || 0)
const max = computed(() => Number(valueConfig.value.max) || 100)
const step = computed(() => Number(valueConfig.value.step) || 0.1)
const decimals = computed(() => Number(valueConfig.value.decimals) || 1)

const formattedValue = computed(() => {
  return currentValue.value.toFixed(decimals.value)
})

const displayUnit = computed(() => {
  if (!displayConfig.value.showUnit) return ''
  return unit.value || displayConfig.value.unit || ''
})

const containerStyle = computed(() => ({
  backgroundColor: styleConfig.value.backgroundColor || 'transparent',
  color: styleConfig.value.textColor || '#333333',
  fontSize: fontSize.value,
  fontWeight: displayConfig.value.fontWeight || 'normal',
  textAlign: displayConfig.value.textAlign || 'center',
  border: styleConfig.value.border?.show 
    ? `${styleConfig.value.border.width || 1}px solid ${styleConfig.value.border.color || '#e0e0e0'}`
    : 'none',
  borderRadius: styleConfig.value.border?.radius ? `${styleConfig.value.border.radius}px` : '0'
}))

const sliderStyle = computed(() => ({
  '--slider-color': sliderConfig.value.color || '#18a058',
  '--track-color': sliderConfig.value.trackColor || '#e0e0e6',
  '--fill-color': sliderConfig.value.fillColor || '#18a058'
}))

const metricName = computed(() => {
  return props.dataSource?.deviceSource?.[0]?.metricsName || $t('generate.device') + '1'
})

// 数据获取和设置
const setSeries = async (dataSource: any) => {
  if (!dataSource?.deviceSource?.[0]) return

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0]

  if (metricsType === 'telemetry' && deviceId && metricsId) {
    try {
      const detailValue = await telemetryDataCurrentKeys({
        device_id: deviceId,
        keys: metricsId
      })
      if (detailValue?.data?.[0]) {
        unit.value = detailValue.data[0].unit || ''
        const value = Number(detailValue.data[0].value) || 0
        currentValue.value = Math.max(min.value, Math.min(max.value, value))
      }
    } catch (error) {
      console.error('Failed to fetch telemetry data:', error)
    }
  } else if (metricsType === 'attributes' && deviceId && metricsId) {
    try {
      const res = await getAttributeDataSet({ device_id: deviceId })
      const attributeData = res.data.find((item: any) => item.key === metricsId)
      if (attributeData) {
        const value = Number(attributeData.value) || 0
        currentValue.value = Math.max(min.value, Math.min(max.value, value))
        if (attributeData.unit) {
          unit.value = attributeData.unit
        }
      }
    } catch (error) {
      console.error('Failed to fetch attribute data:', error)
    }
  }
}

// 容器大小变化处理
const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const baseFontSize = displayConfig.value.fontSize || 14
    const scaleFactor = Math.min(width / 300, height / 150)
    fontSize.value = `${Math.max(10, baseFontSize * scaleFactor)}px`
  }
}

// 数值更新
const updateValue = async (value: number) => {
  if (isUpdating.value) return
  
  const dataSource = props.dataSource
  if (!dataSource?.deviceSource?.[0]) return

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0]
  if (!deviceId || !metricsId) return

  isUpdating.value = true
  
  try {
    const obj = {
      device_id: deviceId,
      value: JSON.stringify({
        [metricsId]: value
      })
    }

    if (metricsType === 'attributes') {
      await attributeDataPub(obj)
    } else if (metricsType === 'telemetry') {
      await telemetryDataPub(obj)
    }

    currentValue.value = value
  } catch (error) {
    console.error('Failed to update value:', error)
  } finally {
    isUpdating.value = false
  }
}

// 延迟更新处理
const handleValueChange = (value: number) => {
  currentValue.value = value
  
  if (dataConfig.value.realTimeUpdate) {
    if (updateTimer) {
      clearTimeout(updateTimer)
    }
    
    const delay = dataConfig.value.updateDelay || 300
    updateTimer = setTimeout(() => {
      updateValue(value)
    }, delay)
  }
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!interactionConfig.value.keyboard) return
  
  const step = valueConfig.value.step || 0.1
  let newValue = currentValue.value
  
  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      newValue = Math.min(max.value, currentValue.value + step)
      break
    case 'ArrowDown':
    case 'ArrowLeft':
      newValue = Math.max(min.value, currentValue.value - step)
      break
    case 'Home':
      newValue = min.value
      break
    case 'End':
      newValue = max.value
      break
    default:
      return
  }
  
  event.preventDefault()
  handleValueChange(newValue)
}

// 鼠标滚轮事件处理
const handleWheel = (event: WheelEvent) => {
  if (!interactionConfig.value.mouseWheel) return
  
  event.preventDefault()
  const step = valueConfig.value.step || 0.1
  const delta = event.deltaY > 0 ? -step : step
  const newValue = Math.max(min.value, Math.min(max.value, currentValue.value + delta))
  
  handleValueChange(newValue)
}

// 双击重置
const handleDoubleClick = () => {
  if (!interactionConfig.value.doubleClickReset) return
  
  const defaultValue = valueConfig.value.defaultValue || min.value
  handleValueChange(defaultValue)
}

// WebSocket 数据更新
const updateData = (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
  if (metricsId && data[metricsId] !== undefined) {
    const value = Number(data[metricsId]) || 0
    currentValue.value = Math.max(min.value, Math.min(max.value, value))
  }
}

// 数据刷新
const refreshData = async () => {
  await setSeries(props.dataSource)
}

// 监听器
watch(
  () => props.dataSource?.deviceSource,
  () => {
    setSeries(props.dataSource)
  },
  { deep: true }
)

watch(
  () => [props.config?.value],
  () => {
    // 配置变化时确保当前值在范围内
    currentValue.value = Math.max(min.value, Math.min(max.value, currentValue.value))
  },
  { deep: true }
)

watch(
  () => props.size,
  () => {
    nextTick(() => {
      if (cardRef.value) {
        const { width, height } = props.size
        const baseFontSize = displayConfig.value.fontSize || 14
        const scaleFactor = Math.min(width / 300, height / 150)
        fontSize.value = `${Math.max(10, baseFontSize * scaleFactor)}px`
      }
    })
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  setSeries(props.dataSource)
  
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
    
    // 添加键盘事件监听
    if (interactionConfig.value.keyboard) {
      cardRef.value.addEventListener('keydown', handleKeydown)
      cardRef.value.setAttribute('tabindex', '0')
    }
    
    // 添加鼠标滚轮事件监听
    if (interactionConfig.value.mouseWheel) {
      cardRef.value.addEventListener('wheel', handleWheel, { passive: false })
    }
  }
  
  // 设置初始值
  if (currentValue.value === 0 && valueConfig.value.defaultValue !== undefined) {
    currentValue.value = valueConfig.value.defaultValue
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  
  if (cardRef.value) {
    cardRef.value.removeEventListener('keydown', handleKeydown)
    cardRef.value.removeEventListener('wheel', handleWheel)
  }
})

// 暴露方法
defineExpose({
  updateData,
  refreshData,
  setValue: (value: number) => {
    currentValue.value = Math.max(min.value, Math.min(max.value, value))
  },
  getValue: () => currentValue.value
})
</script>

<template>
  <div 
    ref="cardRef" 
    class="digit-setter-container"
    :style="containerStyle"
    @dblclick="handleDoubleClick"
  >
    <div class="digit-setter-content">
      <!-- 标题 -->
      <div v-if="displayConfig.showTitle && props.config?.title" class="title">
        {{ props.config.title }}
      </div>
      
      <!-- 数值显示 -->
      <div class="value-container">
        <span class="value">{{ formattedValue }}</span>
        <span v-if="displayUnit" class="unit">{{ displayUnit }}</span>
      </div>
      
      <!-- 滑块控件 -->
      <div class="slider-container" :style="sliderStyle">
        <NSlider 
          v-model:value="currentValue"
          :min="min"
          :max="max"
          :step="step"
          :size="sliderConfig.size || 'medium'"
          :show-tooltip="sliderConfig.showTooltip !== false"
          :marks="sliderConfig.showMarks ? undefined : false"
          :disabled="isUpdating"
          @update:value="handleValueChange"
        />
      </div>
      
      <!-- 指标名称 -->
      <div class="metric-name">
        {{ metricName }}
      </div>
      
      <!-- 范围显示 -->
      <div class="range-info">
        <span class="range-min">{{ min }}</span>
        <span class="range-max">{{ max }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.digit-setter-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
  position: relative;
  outline: none;
  cursor: pointer;
}

.digit-setter-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.title {
  text-align: center;
  font-weight: 500;
  font-size: 0.9em;
  opacity: 0.8;
  margin-bottom: 4px;
}

.value-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.value {
  font-size: 1.8em;
  font-weight: bold;
  line-height: 1;
}

.unit {
  font-size: 0.7em;
  opacity: 0.7;
}

.slider-container {
  flex: 1;
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.slider-container :deep(.n-slider) {
  --n-handle-color: var(--slider-color);
  --n-fill-color: var(--fill-color);
  --n-rail-color: var(--track-color);
}

.metric-name {
  text-align: center;
  font-size: 0.8em;
  opacity: 0.7;
  margin-top: 4px;
}

.range-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.7em;
  opacity: 0.5;
  margin-top: 4px;
}

.range-min,
.range-max {
  font-size: 0.7em;
}

/* 响应式设计 */
@media (max-width: 300px) {
  .digit-setter-container {
    padding: 8px;
  }
  
  .value {
    font-size: 1.4em;
  }
  
  .title,
  .metric-name {
    font-size: 0.8em;
  }
}

/* 交互状态 */
.digit-setter-container:focus {
  outline: 2px solid var(--slider-color, #18a058);
  outline-offset: 2px;
}

.digit-setter-container:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* 加载状态 */
.digit-setter-container[data-updating="true"] {
  opacity: 0.7;
  pointer-events: none;
}

/* 动画效果 */
.value {
  transition: all 0.2s ease;
}

.slider-container {
  transition: opacity 0.2s ease;
}

.digit-setter-container[data-updating="true"] .slider-container {
  opacity: 0.5;
}
</style>