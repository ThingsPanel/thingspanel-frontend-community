<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { NIcon } from 'naive-ui'
import type { IComponentProps } from '../../../core/types/component'
import { getAttributeDataSet, telemetryDataCurrentKeys } from '@/service/api/device'
import { icons as iconOptions } from '@/components/common/icons'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'

const logger = createLogger('DigitIndicator')

// Card 2.0 组件属性接口
interface DigitIndicatorProps extends IComponentProps {
  config: {
    unit?: string
    color?: string
    iconName?: string
    fontSize?: {
      auto: boolean
      size: number
    }
    display?: {
      showIcon: boolean
      showUnit: boolean
      showMetricName: boolean
    }
    animation?: {
      enabled: boolean
      duration: number
    }
  }
}

const props = defineProps<DigitIndicatorProps>()

// 响应式数据
const detail = ref<string>('')
const unit = ref<string>('')
const fontSize = ref('14px')
const cardRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

// 计算属性
const displayValue = computed(() => {
  return detail.value !== null && detail.value !== '' ? detail.value : '45'
})

const displayUnit = computed(() => {
  return props.config?.unit || unit.value || '%'
})

const iconColor = computed(() => {
  return props.config?.color || 'blue'
})

const iconName = computed(() => {
  return props.config?.iconName || 'Water'
})

const metricName = computed(() => {
  return props.dataSource?.deviceSource?.[0]?.metricsName || $t('card.humidity')
})

/**
 * 设置数据系列
 * @param dataSource 数据源配置
 */
const setSeries = async (dataSource: any) => {
  if (!dataSource?.deviceSource?.[0]) return

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0]

  try {
    if (metricsType === 'telemetry' && deviceId && metricsId) {
      const detailValue = await telemetryDataCurrentKeys({
        device_id: deviceId,
        keys: metricsId
      })
      unit.value = detailValue?.data?.[0]?.unit ?? '%'
      detail.value = detailValue?.data?.[0]?.value ?? ''
    } else if (metricsType === 'attributes' && deviceId && metricsId) {
      const res = await getAttributeDataSet({ device_id: deviceId })
      const attributeData = res.data.find(item => item.key === metricsId)
      detail.value = attributeData?.value ?? ''
      unit.value = attributeData?.unit ?? '%'
    }
  } catch (error) {
    logger.error('Failed to fetch data:', error)
  }
}

/**
 * 处理容器大小变化
 * @param entries ResizeObserver 条目
 */
const handleResize = (entries: ResizeObserverEntry[]) => {
  if (!props.config?.fontSize?.auto) return
  
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const newFontSize = `${Math.min(width, height) / 10}px`
    fontSize.value = newFontSize
  }
}

/**
 * 更新数据（WebSocket 回调）
 * @param deviceId 设备ID
 * @param metricsId 指标ID
 * @param data 数据
 */
const updateData = (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
  // 只有当数据不为 undefined、null 或空字符串时才更新
  if (!metricsId || data[metricsId] === undefined || data[metricsId] === null || data[metricsId] === '') {
    logger.warn(`No data returned from websocket for ${metricsId}`)
    return
  }
  detail.value = metricsId ? data[metricsId] : ''
}

/**
 * 刷新组件数据
 */
const refreshData = async () => {
  await setSeries(props.dataSource)
}

// 监听数据源变化
watch(
  () => props.dataSource?.deviceSource,
  () => {
    detail.value = ''
    unit.value = ''
    setSeries(props.dataSource)
  },
  { deep: true }
)

// 监听配置变化
watch(
  () => props.config?.fontSize,
  (newConfig) => {
    if (!newConfig?.auto && newConfig?.size) {
      fontSize.value = `${newConfig.size}px`
    }
  },
  { deep: true }
)

// 生命周期钩子
onMounted(() => {
  setSeries(props.dataSource)
  
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
  }
  
  // 设置初始字体大小
  if (!props.config?.fontSize?.auto && props.config?.fontSize?.size) {
    fontSize.value = `${props.config.fontSize.size}px`
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 暴露方法给父组件
defineExpose({
  updateData,
  refreshData
})
</script>

<template>
  <div ref="cardRef" class="digit-indicator-container">
    <div class="digit-content" :style="{ fontSize: fontSize }">
      <!-- 图标容器 -->
      <div v-if="config?.display?.showIcon !== false" class="icon-container">
        <NIcon 
          class="indicator-icon" 
          :color="iconColor"
          :class="{ 'animate-pulse': config?.animation?.enabled }"
        >
          <component :is="iconOptions[iconName]" />
        </NIcon>
      </div>
      
      <!-- 数值容器 -->
      <div class="value-container">
        <span 
          class="value-text" 
          :title="displayValue + displayUnit"
          :class="{ 'animate-bounce': config?.animation?.enabled }"
        >
          {{ displayValue }}
          <span v-if="config?.display?.showUnit !== false" class="unit-text">
            {{ displayUnit }}
          </span>
        </span>
      </div>
      
      <!-- 指标名称容器 -->
      <div v-if="config?.display?.showMetricName !== false" class="metric-name-container">
        <span class="metric-name" :title="metricName">
          {{ metricName }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.digit-indicator-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.digit-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 5%;
  box-sizing: border-box;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex: 0 0 auto;
}

.indicator-icon {
  font-size: 3em;
  transition: all 0.3s ease;
}

.value-container {
  display: flex;
  justify-content: center;
  align-items: baseline;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
}

.value-text {
  font-size: 2em;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: all 0.3s ease;
  display: flex;
  align-items: baseline;
  gap: 0.2em;
}

.unit-text {
  font-size: 0.8em;
  font-weight: normal;
  opacity: 0.8;
}

.metric-name-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  flex: 0 0 auto;
}

.metric-name {
  font-size: 1em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  opacity: 0.9;
}

/* 动画效果 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -5px, 0);
  }
  70% {
    transform: translate3d(0, -3px, 0);
  }
  90% {
    transform: translate3d(0, -1px, 0);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .digit-content {
    padding: 3%;
  }
  
  .indicator-icon {
    font-size: 2.5em;
  }
  
  .value-text {
    font-size: 1.8em;
  }
}
</style>