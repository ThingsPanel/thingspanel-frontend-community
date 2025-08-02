<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { TextInfoConfig } from './index'
import { getAttributeDataSet } from '@/service/api/device'
import { $t } from '@/locales'

interface Props {
  config: TextInfoConfig
  dataSource?: any
  width?: number
  height?: number
}

interface Emits {
  (e: 'data-change', data: any): void
  (e: 'error', error: Error): void
}

const props = withDefaults(defineProps<Props>(), {
  width: 200,
  height: 120
})

const emit = defineEmits<Emits>()

// 响应式数据
const displayValue = ref<string | number>('')
const displayUnit = ref<string>('')
const displayColor = ref<string>('')
const loading = ref(false)
const error = ref<string>('')
const containerRef = ref<HTMLElement>()
const responsiveFontSize = ref<number>(48)

// ResizeObserver实例
let resizeObserver: ResizeObserver | null = null

// 计算属性
const containerStyle = computed(() => {
  const style = props.config.style || {}
  return {
    backgroundColor: style.backgroundColor || 'transparent',
    border: style.border?.show ? `${style.border.width || 1}px solid ${style.border.color || '#e0e0e0'}` : 'none',
    borderRadius: style.border?.radius ? `${style.border.radius}px` : '0',
    padding: `${style.padding?.top || 10}px ${style.padding?.right || 10}px ${style.padding?.bottom || 10}px ${style.padding?.left || 10}px`,
    textAlign: style.textAlign || 'center',
    display: 'flex',
    flexDirection: getFlexDirection(),
    justifyContent: getJustifyContent(),
    alignItems: getAlignItems(),
    width: '100%',
    height: '100%',
    boxSizing: 'border-box'
  }
})

const valueStyle = computed(() => {
  const style = props.config.style || {}
  const fontSize = props.config.responsive?.enabled ? responsiveFontSize.value : (style.valueFontSize || 48)
  
  return {
    fontSize: `${fontSize}px`,
    fontWeight: style.valueFontWeight || 'bold',
    color: displayColor.value || style.valueColor || '#333333',
    lineHeight: '1.2',
    margin: 0
  }
})

const metricNameStyle = computed(() => {
  const style = props.config.style || {}
  return {
    fontSize: `${style.metricNameFontSize || 14}px`,
    color: style.metricNameColor || '#666666',
    margin: getMetricNameMargin(),
    lineHeight: '1.4'
  }
})

const unitStyle = computed(() => {
  const style = props.config.style || {}
  return {
    fontSize: `${style.unitFontSize || 16}px`,
    color: style.unitColor || '#999999',
    margin: getUnitMargin(),
    lineHeight: '1.2'
  }
})

const metricName = computed(() => {
  const display = props.config.display || {}
  return display.customMetricName || 
         props.dataSource?.deviceSource?.[0]?.metricsName || 
         $t('card.firmVersion')
})

const shouldShowMetricName = computed(() => {
  return props.config.display?.showMetricName !== false
})

const shouldShowUnit = computed(() => {
  return props.config.display?.showUnit && displayUnit.value
})

// 辅助函数
function getFlexDirection() {
  const position = props.config.display?.metricNamePosition || 'bottom'
  switch (position) {
    case 'top':
      return 'column'
    case 'bottom':
      return 'column-reverse'
    case 'left':
      return 'row'
    case 'right':
      return 'row-reverse'
    default:
      return 'column-reverse'
  }
}

function getJustifyContent() {
  const vAlign = props.config.style?.verticalAlign || 'middle'
  switch (vAlign) {
    case 'top':
      return 'flex-start'
    case 'bottom':
      return 'flex-end'
    case 'middle':
    default:
      return 'center'
  }
}

function getAlignItems() {
  const hAlign = props.config.style?.textAlign || 'center'
  switch (hAlign) {
    case 'left':
      return 'flex-start'
    case 'right':
      return 'flex-end'
    case 'center':
    default:
      return 'center'
  }
}

function getMetricNameMargin() {
  const position = props.config.display?.metricNamePosition || 'bottom'
  switch (position) {
    case 'top':
      return '0 0 8px 0'
    case 'bottom':
      return '8px 0 0 0'
    case 'left':
      return '0 8px 0 0'
    case 'right':
      return '0 0 0 8px'
    default:
      return '8px 0 0 0'
  }
}

function getUnitMargin() {
  const position = props.config.display?.unitPosition || 'after'
  switch (position) {
    case 'after':
      return '0 0 0 4px'
    case 'below':
      return '4px 0 0 0'
    case 'above':
      return '0 0 4px 0'
    default:
      return '0 0 0 4px'
  }
}

// 响应式字体大小计算
function calculateResponsiveFont() {
  if (!props.config.responsive?.enabled || !containerRef.value) {
    return
  }
  
  const { width, height } = containerRef.value.getBoundingClientRect()
  const config = props.config.responsive
  const scale = config.fontScale || 0.1
  const minSize = config.minFontSize || 12
  const maxSize = config.maxFontSize || 72
  
  const calculatedSize = Math.min(width, height) * scale
  responsiveFontSize.value = Math.max(minSize, Math.min(maxSize, calculatedSize))
}

// 设置响应式字体
function setupResponsiveFont() {
  if (!props.config.responsive?.enabled) return
  
  nextTick(() => {
    calculateResponsiveFont()
    
    if (containerRef.value && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        calculateResponsiveFont()
      })
      resizeObserver.observe(containerRef.value)
    }
  })
}

// 数据处理
function processData(data: any) {
  if (!data) {
    displayValue.value = props.config.data?.defaultValue || '1.9.2'
    displayUnit.value = ''
    displayColor.value = ''
    return
  }
  
  let value = data.value !== undefined ? data.value : data
  let unit = data.unit || props.config.display?.customUnit || ''
  let color = ''
  
  // 数据格式化
  if (props.config.data?.format) {
    const format = props.config.data.format
    
    if (format.type === 'number' && typeof value === 'number') {
      // 数值精度
      if (format.precision !== undefined) {
        value = value.toFixed(format.precision)
      }
      
      // 千分位分隔符
      if (format.thousandsSeparator) {
        value = Number(value).toLocaleString()
      }
    }
    
    // 前缀后缀
    if (format.prefix) value = format.prefix + value
    if (format.suffix) value = value + format.suffix
  }
  
  // 数据映射
  if (props.config.data?.mapping?.enabled && props.config.data.mapping.rules) {
    const rule = props.config.data.mapping.rules.find(r => r.value === data.value || r.value === data)
    if (rule) {
      value = rule.display
      color = rule.color || ''
    }
  }
  
  displayValue.value = value
  displayUnit.value = unit
  displayColor.value = color
  
  emit('data-change', { value, unit, color })
}

// 获取设备属性数据
async function fetchDeviceData() {
  if (!props.dataSource?.deviceSource?.[0]) return
  
  const { metricsType, deviceId, metricsId } = props.dataSource.deviceSource[0]
  
  if (metricsType === 'attributes' && deviceId && metricsId) {
    try {
      loading.value = true
      error.value = ''
      
      const res = await getAttributeDataSet({ device_id: deviceId })
      const attributeData = res.data.find(item => item.key === metricsId)
      
      if (attributeData) {
        processData({
          value: attributeData.value,
          unit: attributeData.unit
        })
      } else {
        processData(null)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据失败'
      emit('error', err instanceof Error ? err : new Error('获取数据失败'))
      processData(null)
    } finally {
      loading.value = false
    }
  }
}

// 数值变化动画
function animateValueChange(newValue: any) {
  if (!props.config.animation?.valueChange?.enabled) return
  
  const duration = props.config.animation.valueChange.duration || 300
  const easing = props.config.animation.valueChange.easing || 'ease-out'
  
  if (containerRef.value) {
    containerRef.value.style.transition = `all ${duration}ms ${easing}`
    containerRef.value.style.transform = 'scale(1.05)'
    
    setTimeout(() => {
      if (containerRef.value) {
        containerRef.value.style.transform = 'scale(1)'
      }
    }, duration / 2)
    
    setTimeout(() => {
      if (containerRef.value) {
        containerRef.value.style.transition = ''
      }
    }, duration)
  }
}

// 闪烁提醒
function triggerBlink() {
  if (!props.config.animation?.blink?.enabled || !containerRef.value) return
  
  const config = props.config.animation.blink
  const color = config.color || '#ff4d4f'
  const count = config.count || 3
  const interval = config.interval || 200
  
  const originalBg = containerRef.value.style.backgroundColor
  let blinkCount = 0
  
  const blink = () => {
    if (blinkCount >= count * 2) {
      if (containerRef.value) {
        containerRef.value.style.backgroundColor = originalBg
      }
      return
    }
    
    if (containerRef.value) {
      containerRef.value.style.backgroundColor = blinkCount % 2 === 0 ? color : originalBg
    }
    
    blinkCount++
    setTimeout(blink, interval)
  }
  
  blink()
}

// 数据更新方法（供外部调用）
function updateData(deviceId: string | undefined, metricsId: string | undefined, data: any) {
  if (metricsId && data[metricsId] !== undefined && data[metricsId] !== null && data[metricsId] !== '') {
    const oldValue = displayValue.value
    processData(data[metricsId])
    
    // 触发动画
    if (oldValue !== displayValue.value) {
      animateValueChange(displayValue.value)
      triggerBlink()
    }
  }
}

// 刷新数据
function refreshData() {
  fetchDeviceData()
}

// 监听器
watch(
  () => props.dataSource,
  () => {
    fetchDeviceData()
  },
  { deep: true, immediate: true }
)

watch(
  () => [props.width, props.height],
  () => {
    if (props.config.responsive?.enabled) {
      nextTick(() => {
        calculateResponsiveFont()
      })
    }
  }
)

watch(
  () => props.config.responsive?.enabled,
  (enabled) => {
    if (enabled) {
      setupResponsiveFont()
    } else if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }
)

// 生命周期
onMounted(() => {
  setupResponsiveFont()
  fetchDeviceData()
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 暴露方法
defineExpose({
  updateData,
  refreshData,
  setupResponsiveFont,
  animateValueChange,
  triggerBlink
})
</script>

<template>
  <div 
    ref="containerRef" 
    class="text-info-container"
    :style="containerStyle"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠</div>
      <div class="error-message">{{ error }}</div>
    </div>
    
    <!-- 正常显示 -->
    <template v-else>
      <!-- 指标名称（顶部或左侧） -->
      <div 
        v-if="shouldShowMetricName && ['top', 'left'].includes(config.display?.metricNamePosition || 'bottom')"
        class="metric-name"
        :style="metricNameStyle"
      >
        {{ metricName }}
      </div>
      
      <!-- 值和单位容器 -->
      <div class="value-container">
        <!-- 单位（上方） -->
        <div 
          v-if="shouldShowUnit && config.display?.unitPosition === 'above'"
          class="unit unit-above"
          :style="unitStyle"
        >
          {{ displayUnit }}
        </div>
        
        <!-- 主要值 -->
        <div class="value-wrapper">
          <span class="value" :style="valueStyle">
            {{ displayValue }}
          </span>
          
          <!-- 单位（后方） -->
          <span 
            v-if="shouldShowUnit && config.display?.unitPosition === 'after'"
            class="unit unit-after"
            :style="unitStyle"
          >
            {{ displayUnit }}
          </span>
        </div>
        
        <!-- 单位（下方） -->
        <div 
          v-if="shouldShowUnit && config.display?.unitPosition === 'below'"
          class="unit unit-below"
          :style="unitStyle"
        >
          {{ displayUnit }}
        </div>
      </div>
      
      <!-- 指标名称（底部或右侧） -->
      <div 
        v-if="shouldShowMetricName && ['bottom', 'right'].includes(config.display?.metricNamePosition || 'bottom')"
        class="metric-name"
        :style="metricNameStyle"
      >
        {{ metricName }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.text-info-container {
  position: relative;
  overflow: hidden;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #ff4d4f;
}

.error-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.error-message {
  font-size: 12px;
  text-align: center;
  word-break: break-word;
}

.value-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.value-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.value {
  display: inline-block;
  word-break: break-all;
  max-width: 100%;
}

.unit {
  white-space: nowrap;
}

.unit-above,
.unit-below {
  align-self: center;
}

.metric-name {
  text-align: center;
  word-break: break-word;
  max-width: 100%;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .text-info-container {
    padding: 8px;
  }
  
  .value {
    font-size: 24px !important;
  }
  
  .metric-name {
    font-size: 12px !important;
  }
  
  .unit {
    font-size: 14px !important;
  }
}

/* 动画效果 */
.text-info-container {
  transition: transform 0.2s ease;
}

.value {
  transition: color 0.3s ease;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .loading-spinner {
    border-color: #434343;
    border-top-color: #1890ff;
  }
}
</style>