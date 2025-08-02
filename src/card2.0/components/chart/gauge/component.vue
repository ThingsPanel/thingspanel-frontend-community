<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GaugeChart } from 'echarts/charts'
import { LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import type { GaugeConfig } from './index'
import { telemetryDataCurrentKeys, getAttributeDataSet } from '@/service/api/device'
import { $t } from '@/locales'

// 注册 ECharts 所需的组件和渲染器
use([CanvasRenderer, GaugeChart, TitleComponent, TooltipComponent, LegendComponent])

/**
 * 组件属性接口
 */
interface Props {
  /** 组件配置 */
  config?: GaugeConfig
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
  size: () => ({ width: 300, height: 300 }),
  theme: () => ({})
})

// 响应式数据
const currentValue = ref<number>(0)
const unit = ref<string>('')
const cardRef = ref<HTMLElement | null>(null)
const chartRef = ref<typeof VChart | null>(null)
let resizeObserver: ResizeObserver | null = null
let refreshTimer: NodeJS.Timeout | null = null

// 计算属性
const valueConfig = computed(() => props.config?.value || {})
const gaugeConfig = computed(() => props.config?.gauge || {})
const colorsConfig = computed(() => props.config?.colors || {})
const textConfig = computed(() => props.config?.text || {})
const thresholdsConfig = computed(() => props.config?.thresholds || {})
const animationConfig = computed(() => props.config?.animation || {})
const dataConfig = computed(() => props.config?.data || {})
const autoRefreshConfig = computed(() => props.config?.autoRefresh || {})

const min = computed(() => Number(valueConfig.value.min) || 0)
const max = computed(() => Number(valueConfig.value.max) || 100)
const precision = computed(() => Number(valueConfig.value.precision) || 1)

const displayValue = computed(() => {
  return Number(currentValue.value.toFixed(precision.value))
})

const displayUnit = computed(() => {
  if (!textConfig.value.showUnit) return ''
  return unit.value || valueConfig.value.unit || ''
})

const metricName = computed(() => {
  return props.dataSource?.deviceSource?.[0]?.metricsName || props.config?.title || $t('dashboard_panel.cardName.instrumentPanel')
})

// 计算进度比例
const progressRatio = computed(() => {
  const value = displayValue.value
  if (value >= max.value) return 1
  if (value <= min.value) return 0
  return (value - min.value) / (max.value - min.value)
})

// 获取阈值颜色
const getThresholdColor = (value: number) => {
  if (!thresholdsConfig.value.enabled || !thresholdsConfig.value.ranges) {
    return colorsConfig.value.progressColor || '#105ba8'
  }
  
  for (const range of thresholdsConfig.value.ranges) {
    if (value >= range.min && value <= range.max) {
      return range.color
    }
  }
  
  return colorsConfig.value.progressColor || '#105ba8'
}

// ECharts 配置
const chartOptions = computed(() => {
  const progressColor = getThresholdColor(displayValue.value)
  const trackColor = colorsConfig.value.trackColor || '#ddd'
  
  // 计算颜色配置
  const colorStops = thresholdsConfig.value.enabled && thresholdsConfig.value.ranges?.length
    ? thresholdsConfig.value.ranges.map(range => [
        (range.max - min.value) / (max.value - min.value),
        range.color
      ])
    : [[progressRatio.value * 0.8, progressColor], [1, trackColor]]
  
  return {
    series: [
      {
        type: 'gauge',
        startAngle: gaugeConfig.value.startAngle || 180,
        endAngle: gaugeConfig.value.endAngle || -45,
        min: min.value,
        max: max.value,
        radius: gaugeConfig.value.radius || '100%',
        center: gaugeConfig.value.center || ['50%', '80%'],
        splitNumber: gaugeConfig.value.splitNumber || 1,
        
        // 轴线配置
        axisLine: {
          lineStyle: {
            width: gaugeConfig.value.axisLineWidth || 30,
            color: colorStops
          }
        },
        
        // 刻度配置
        axisTick: { 
          show: false 
        },
        
        // 标签配置
        axisLabel: {
          show: gaugeConfig.value.showAxisLabel !== false,
          fontSize: textConfig.value.labelFontSize || 14,
          color: colorsConfig.value.labelColor || '#666666',
          verticalAlign: 'bottom',
          align: 'center',
          distance: 12
        },
        
        // 分割线配置
        splitLine: { 
          show: gaugeConfig.value.showSplitLine || false 
        },
        
        // 指针配置
        pointer: { 
          show: gaugeConfig.value.showPointer || false,
          itemStyle: {
            color: colorsConfig.value.pointerColor || progressColor
          }
        },
        
        // 详情配置
        detail: {
          show: textConfig.value.showValue !== false,
          offsetCenter: textConfig.value.valueOffset || [0, '-20%'],
          fontSize: textConfig.value.valueFontSize || 20,
          color: colorsConfig.value.textColor || '#333333',
          formatter: (value: number) => {
            const formattedValue = value.toFixed(precision.value)
            const unitText = displayUnit.value ? ` ${displayUnit.value}` : ''
            return `${formattedValue}${unitText}`
          }
        },
        
        // 标题配置
        title: {
          show: textConfig.value.showTitle !== false,
          offsetCenter: textConfig.value.titleOffset || [0, '20%'],
          fontSize: textConfig.value.titleFontSize || 16,
          color: colorsConfig.value.textColor || '#333333'
        },
        
        // 数据
        data: [
          {
            value: displayValue.value,
            name: metricName.value
          }
        ],
        
        // 动画配置
        animation: animationConfig.value.enabled !== false,
        animationDuration: animationConfig.value.duration || 1000,
        animationEasing: animationConfig.value.easing || 'cubicOut'
      }
    ]
  }
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
const handleResize = () => {
  if (chartRef.value) {
    nextTick(() => {
      chartRef.value?.resize()
    })
  }
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

// 设置自动刷新
const setupAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  if (autoRefreshConfig.value.enabled) {
    const interval = (autoRefreshConfig.value.interval || 30) * 1000
    refreshTimer = setInterval(refreshData, interval)
  }
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
      handleResize()
    })
  },
  { deep: true }
)

watch(
  () => autoRefreshConfig.value,
  () => {
    setupAutoRefresh()
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  setSeries(props.dataSource)
  
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
  }
  
  // 设置初始值
  if (currentValue.value === 0 && dataConfig.value.defaultValue !== undefined) {
    currentValue.value = dataConfig.value.defaultValue
  }
  
  // 设置自动刷新
  setupAutoRefresh()
  
  // 初始化图表大小
  nextTick(() => {
    handleResize()
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  
  if (refreshTimer) {
    clearInterval(refreshTimer)
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
  <div ref="cardRef" class="gauge-container">
    <div class="chart-container">
      <VChart 
        ref="chartRef" 
        :option="chartOptions" 
        class="chart"
        autoresize
      />
    </div>
    
    <!-- 额外的标题显示 -->
    <div v-if="textConfig.showTitle && metricName" class="gauge-title">
      {{ metricName }}
    </div>
  </div>
</template>

<style scoped>
.gauge-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.chart-container {
  flex: 1;
  position: relative;
  width: 100%;
  min-height: 0;
}

.chart {
  width: 100%;
  height: 100%;
}

.gauge-title {
  text-align: center;
  padding: 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式设计 */
@media (max-width: 300px) {
  .gauge-title {
    font-size: 14px;
    padding: 4px 0;
  }
}

/* 加载状态 */
.gauge-container[data-loading="true"] {
  opacity: 0.7;
}

.gauge-container[data-loading="true"]::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 动画效果 */
.chart {
  transition: opacity 0.3s ease;
}

.gauge-title {
  transition: color 0.3s ease;
}

/* 主题适配 */
.gauge-container[data-theme="dark"] .gauge-title {
  color: #ffffff;
}

.gauge-container[data-theme="dark"] .chart {
  filter: brightness(0.9);
}
</style>