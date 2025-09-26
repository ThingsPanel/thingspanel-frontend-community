<template>
  <div ref="cardRef" class="digit-indicator-container">
    <div class="digit-indicator-content" :style="{ fontSize: fontSize }">
      <!-- 图标容器 -->
      <div class="icon-container">
        <NIcon class="icon-class" :color="iconColor">
          <component :is="iconComponent" />
        </NIcon>
      </div>

      <!-- 数值容器 -->
      <div class="value-container">
        <span
          class="value"
          :title="displayValueWithUnit"
        >
          {{ displayValue }} {{ displayUnit }}
        </span>
      </div>

      <!-- 指标名称容器 -->
      <div class="metric-name-container">
        <span
          class="metric-name"
          :title="metricNameComputed"
        >
          {{ metricNameComputed }}
        </span>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="shouldShowDebug" class="debug-info">
      <NCollapse size="small">
        <NCollapseItem title="调试信息" name="debug">
          <NCode :code="debugInfo" language="json" />
        </NCollapseItem>
      </NCollapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数字指示器组件 - Card 2.1 版本
 * 用于显示设备的遥测数据或属性数据，包括图标、数值、单位和指标名称
 * 支持 WebSocket 实时数据更新和响应式字体大小调整
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NIcon, NCollapse, NCollapseItem, NCode } from 'naive-ui'
import { icons as iconOptions } from '@/components/common/icons'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'

const logger = createLogger('DigitIndicator')

// Props 接口 - Card 2.1 标准接口
interface Props {
  rawDataSources?: any // 接收原始数据源配置
  config?: {           // 接收组件配置
    title?: string
    unit?: string
    iconName?: string
    color?: string
    showDebug?: boolean
  }
  // 兼容直接传递的props
  iconName?: string
  iconColor?: string
  unit?: string
  title?: string
  showDebug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rawDataSources: null,
  config: () => ({}),
  iconName: 'Water',
  iconColor: '#1890ff',
  unit: '',
  title: '',
  showDebug: false
})

// 响应式数据
const detail = ref<string>('')
const unit = ref<string>('%')
const fontSize = ref('14px')
const cardRef = ref<HTMLElement>()
const metricName = ref<string>('')
let resizeObserver: ResizeObserver | null = null

// 数据源解析 - 从 rawDataSources 中解析数据
const deviceData = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.deviceData
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})

// 配置数据解析
const configData = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.configData
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})

// 计算图标组件
const iconComponent = computed(() => {
  // 优先级：组件配置 > 数据源配置 > props > 默认值
  const iconName = props.config?.iconName ||
                   configData.value?.iconName ||
                   props.iconName ||
                   'Water'
  return iconOptions[iconName] || iconOptions.Water
})

// 计算图标颜色
const iconColor = computed(() => {
  // 优先级：组件配置 > 数据源配置 > props > 默认值
  return props.config?.color ||
         configData.value?.color ||
         props.iconColor ||
         '#1890ff'
})

// 计算显示值
const displayValue = computed(() => {
  // 优先级：设备数据 > 本地状态 > 默认值
  if (deviceData.value?.value !== undefined && deviceData.value?.value !== null && deviceData.value?.value !== '') {
    return deviceData.value.value
  }
  if (detail.value !== '' && detail.value !== null) {
    return detail.value
  }
  return '45' // 默认值
})

// 计算显示单位
const displayUnit = computed(() => {
  // 优先级：组件配置 > 数据源配置 > props > 设备数据 > 默认值
  return props.config?.unit ||
         configData.value?.unit ||
         props.unit ||
         deviceData.value?.unit ||
         unit.value ||
         '%'
})

// 计算完整显示值（包含单位）
const displayValueWithUnit = computed(() => {
  return `${displayValue.value} ${displayUnit.value}`
})

// 计算指标名称
const metricNameComputed = computed(() => {
  return deviceData.value?.metricsName ||
         configData.value?.metricName ||
         props.config?.title ||
         props.title ||
         $t('card.humidity')
})

// 计算是否显示调试信息
const shouldShowDebug = computed(() => {
  return props.config?.showDebug || props.showDebug || false
})

// 调试信息
const debugInfo = computed(() => {
  return JSON.stringify({
    config: props.config,
    deviceData: deviceData.value,
    configData: configData.value,
    computedValues: {
      displayValue: displayValue.value,
      displayUnit: displayUnit.value,
      iconComponent: iconComponent.value?.name,
      iconColor: iconColor.value,
      metricName: metricNameComputed.value,
      shouldShowDebug: shouldShowDebug.value
    },
    rawDataSources: props.rawDataSources,
    localState: {
      detail: detail.value,
      unit: unit.value
    }
  }, null, 2)
})

// 简化的数组数据处理（保持与原版本兼容）
const processWebSocketData = (data: any) => {
  if (!data) return null

  // 如果数据是数组，直接取第一个元素
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null
  }

  // 直接返回数据
  return data
}

// 处理 ResizeObserver 回调
const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const newFontSize = `${Math.min(width, height) / 10}px`
    fontSize.value = newFontSize
  }
}

// 监听数据变化并更新本地状态
watch(() => deviceData.value, (newData) => {
  if (newData) {
    if (newData.value !== undefined) {
      detail.value = newData.value
    }
    if (newData.unit !== undefined) {
      unit.value = newData.unit
    }
    if (newData.metricsName !== undefined) {
      metricName.value = newData.metricsName
    }
  }
}, { deep: true, immediate: true })

// 监听配置数据变化
watch(() => configData.value, (newConfig) => {
  if (newConfig) {
    logger.info('配置数据更新:', newConfig)
  }
}, { deep: true, immediate: true })

// 监听组件配置变化
watch(() => props.config, (newConfig, oldConfig) => {
  logger.info('组件配置发生变化:', {
    新配置: newConfig,
    旧配置: oldConfig,
    变化字段: getChangedFields(oldConfig, newConfig)
  })
}, { deep: true, immediate: true })

// 监听原始数据源变化（调试用）
watch(() => props.rawDataSources, (newRawDataSources) => {
  logger.info('接收到新的rawDataSources:', {
    rawDataSources: newRawDataSources,
    hasDataSourceBindings: !!newRawDataSources?.dataSourceBindings,
    dataSourceKeys: newRawDataSources?.dataSourceBindings ? Object.keys(newRawDataSources.dataSourceBindings) : []
  })
}, { deep: true, immediate: true })

// 辅助函数：检测配置变化的字段
function getChangedFields(oldConfig: any, newConfig: any): string[] {
  const changed: string[] = []
  if (!oldConfig || !newConfig) return changed

  const allKeys = new Set([...Object.keys(oldConfig || {}), ...Object.keys(newConfig || {})])

  for (const key of allKeys) {
    if (oldConfig[key] !== newConfig[key]) {
      changed.push(key)
    }
  }

  return changed
}

// 生命周期钩子
onMounted(() => {
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 暴露给父组件的方法（保持与原版本兼容）
defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    // Only update detail value when data[metricsId] is not undefined, null or ''
    if (!metricsId || data[metricsId] === undefined || data[metricsId] === null || data[metricsId] === '') {
      logger.warn(`No data returned from websocket for ${metricsId}`)
      return
    }

    // 处理 WebSocket 数据
    const processedData = processWebSocketData(data[metricsId])

    if (processedData) {
      // 如果处理后的数据是对象，提取 value 和 unit
      if (typeof processedData === 'object' && processedData !== null) {
        // 检查是否有value属性
        if (processedData.value !== undefined) {
          detail.value = processedData.value
          if (processedData.unit) {
            unit.value = processedData.unit
          }
        } else {
          // 直接使用处理后的数据
          detail.value = processedData
        }
      } else {
        // 直接使用处理后的数据
        detail.value = processedData
      }

      logger.info(`WebSocket data updated for ${metricsId}:`, {
        original: data[metricsId],
        processed: processedData,
        detail: detail.value,
        unit: unit.value
      })
    } else {
      detail.value = data[metricsId]
    }
  }
})
</script>

<style scoped>
.digit-indicator-container {
  width: 100%;
  height: 100%;
}

.digit-indicator-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 5% 5%;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.icon-class {
  font-size: 3em;
}

.value-container {
  display: flex;
  justify-content: center;
  align-items: baseline;
  width: 100%;
}

.value {
  font-size: 2em;
  font-weight: bold;
  text-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-color);
}

.metric-name-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}

.metric-name {
  font-size: 1em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  color: var(--text-color-2);
}

.debug-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .digit-indicator-content {
    padding: 3% 3%;
  }

  .icon-class {
    font-size: 2.5em;
  }

  .value {
    font-size: 1.5em;
  }
}

/* 暗主题适配 */
[data-theme="dark"] .digit-indicator-container {
  .value {
    color: var(--text-color);
  }

  .metric-name {
    color: var(--text-color-2);
  }
}
</style>