<!--
重写的仪表盘组件 - 使用 vue-echarts
修复了 ECharts 模块导入问题
-->
<script setup lang="ts">
import { computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
// 正确导入 ECharts 组件
import { GaugeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { 
  TitleComponent, 
  TooltipComponent, 
  LegendComponent 
} from 'echarts/components'
import { useThemeStore } from '@/store/modules/theme'
import type { GaugeDashboardCustomize } from '@/card2.1/components/dashboard/gauge-dashboard-v2/settingConfig'

// 注册 ECharts 组件
use([
  GaugeChart,
  CanvasRenderer,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

/**
 * 组件 Props 接口定义
 */
interface Props {
  /** 新的CustomConfig结构配置 */
  customConfig?: {
    customize: GaugeDashboardCustomize
    root?: { transform?: { rotate: number; scale: number } }
  }
  /** 向后兼容：旧的config结构 */
  config?: {
    customize: GaugeDashboardCustomize
  }
  /** Card2.1数据绑定系统传递的数据 */
  boundData?: {
    currentValue?: number
    unit?: string
    title?: string
    lastUpdateTime?: number
    thresholdStatus?: 'normal' | 'warning' | 'danger'
  }
  /** primaryData数据源 */
  primaryData?: {
    value?: number
    unit?: string
    label?: string
    timestamp?: number
  }
  /** 向后兼容：直接传递的数据 */
  data?: {
    currentValue?: number
    unit?: string
    title?: string
    lastUpdateTime?: number
    thresholdStatus?: 'normal' | 'warning' | 'danger'
  }
  /** 组件ID */
  componentId?: string
  /** 是否为预览模式 */
  isPreview?: boolean
  /** 预览模式 */
  previewMode?: boolean
}

/**
 * 组件事件定义
 */
interface Emits {
  /** 点击事件 */
  click: [event: MouseEvent]
  /** 数据变化事件 */
  'data-change': [data: any]
  /** 阈值超限事件 */
  'threshold-exceeded': [value: number, threshold: number]
}

// Props 和 Emits
const props = withDefaults(defineProps<Props>(), {
  isPreview: false,
  previewMode: false
})

const emit = defineEmits<Emits>()

// 🔍 调试：监控数据变化
watch(
  [() => props.boundData, () => props.data, () => props.primaryData],
  ([boundData, data, primaryData]) => {
    console.log('🎯 gauge-dashboard-v2 接收到数据变化:', {
      boundData,
      data,
      primaryData,
      componentId: props.componentId,
      hasBoundData: !!boundData,
      hasData: !!data,
      hasPrimaryData: !!primaryData
    })
  },
  { immediate: true, deep: true }
)

// 主题系统
const themeStore = useThemeStore()

/**
 * 获取组件配置 - 支持新旧格式
 * 优先使用 customConfig.customize，回退到 config
 */
const currentCustomize = computed((): GaugeDashboardCustomize => {
  console.log(`🔧 [GaugeDashboardV2] Props调试:`, {
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
    console.log(`✅ [GaugeDashboardV2] 使用customConfig.customize`)
    return props.customConfig.customize
  }

  // 回退到旧的config结构（向后兼容）
  if (props.config?.customize) {
    console.log(`⚠️ [GaugeDashboardV2] 回退到config结构`)
    return props.config.customize
  }

  // 如果没有配置，返回默认配置
  console.log(`❌ [GaugeDashboardV2] 使用默认配置`)
  return {
    title: '仪表盘V2',
    currentValue: 0,
    unit: '',
    minValue: 0,
    maxValue: 100,
    showTitle: true,
    showValue: true,
    showUnit: true,
    showTooltip: true,
    radius: 120,
    startAngle: 225,
    endAngle: -45,
    displayMode: 'full-circle',
    decimal: 1,
    enableAnimation: true,
    animationType: 'ease-out',
    animationDuration: 1000,
    clickable: true,
    enableThresholdAlert: false,
    warningThreshold: 70,
    dangerThreshold: 90
  }
})

/**
 * 获取实际显示的值
 * 优先级：boundData > primaryData > data > 配置默认值
 */
const actualValue = computed(() => {
  // 1. 从Card2.1绑定数据中获取
  if (props.boundData?.currentValue !== undefined) {
    return props.boundData.currentValue
  }
  
  // 2. 从primaryData数据源获取
  if (props.primaryData?.value !== undefined) {
    return props.primaryData.value
  }
  
  // 3. 从直接传递的data中获取
  if (props.data?.currentValue !== undefined) {
    return props.data.currentValue
  }
  
  // 4. 从配置中获取
  return currentCustomize.value.currentValue ?? 0
})

const actualUnit = computed(() => {
  return props.boundData?.unit ?? props.primaryData?.unit ?? props.data?.unit ?? currentCustomize.value.unit ?? ''
})

const actualTitle = computed(() => {
  return props.boundData?.title ?? props.primaryData?.label ?? props.data?.title ?? currentCustomize.value.title ?? '仪表盘'
})

// 🔍 调试：监控计算后的值
watch(
  [actualValue, actualUnit, actualTitle],
  ([value, unit, title]) => {
    console.log('🎯 计算后的实际值:', {
      value,
      unit,
      title,
      fromData: !!props.data,
      fromConfig: !props.data
    })
  },
  { immediate: true }
)

/**
 * 获取当前值对应的状态颜色
 */
const getCurrentValueColor = computed(() => {
  const config = currentCustomize.value
  const value = actualValue.value
  
  if (!config.colorRanges || config.colorRanges.length === 0) {
    return config.pointerConfig?.color || '#1890ff'
  }
  
  for (const range of config.colorRanges) {
    if (value >= range.from && value <= range.to) {
      return range.color
    }
  }
  
  return config.pointerConfig?.color || '#1890ff'
})

/**
 * ECharts 配置选项
 */
const chartOption = computed(() => {
  const config = currentCustomize.value
  const value = actualValue.value
  const unit = actualUnit.value
  const title = actualTitle.value
  
  // 计算角度设置
  let startAngle = config.startAngle ?? 225
  let endAngle = config.endAngle ?? -45
  
  // 根据显示模式调整角度
  switch (config.displayMode) {
    case 'semi-circle':
      startAngle = 180
      endAngle = 0
      break
    case 'full-circle':
      startAngle = 0
      endAngle = 360
      break
    case 'linear':
      startAngle = 180
      endAngle = 0
      break
  }
  
  // 计算颜色分段
  const colorSegments: [number, string][] = []
  if (config.colorRanges && config.colorRanges.length > 0) {
    const total = config.maxValue - config.minValue
    config.colorRanges.forEach(range => {
      const ratio = (range.to - config.minValue) / total
      colorSegments.push([ratio, range.color])
    })
  } else {
    // 默认颜色分段
    colorSegments.push([0.6, '#52c41a'])  // 绿色
    colorSegments.push([0.8, '#faad14'])  // 黄色
    colorSegments.push([1, '#f5222d'])    // 红色
  }
  
  // 构建 ECharts 配置
  const option: any = {
    backgroundColor: 'transparent',
    
    // 标题配置
    title: config.showTitle ? {
      text: title,
      left: 'center',
      top: '85%',
      textStyle: {
        fontSize: config.titleFontSize || 16,
        color: themeStore.darkMode ? '#ffffff' : '#333333',
        fontWeight: 'normal'
      }
    } : undefined,
    
    // 提示框配置
    tooltip: config.showTooltip ? {
      formatter: (params: any) => {
        const template = config.tooltipTemplate || '{title}: {value}{unit}'
        return template
          .replace('{title}', title)
          .replace('{value}', params.value)
          .replace('{unit}', unit)
      }
    } : undefined,
    
    // 仪表盘系列配置
    series: [{
      type: 'gauge',
      startAngle,
      endAngle,
      min: config.minValue || 0,
      max: config.maxValue || 100,
      
      // 半径和位置
      radius: `${(config.radius || 120) / 150 * 100}%`,
      center: config.displayMode === 'linear' ? ['50%', '80%'] : ['50%', '55%'],
      
      // 轴线配置
      axisLine: {
        show: true,
        lineStyle: {
          width: 20,
          color: colorSegments
        }
      },
      
      // 刻度配置
      axisTick: {
        show: config.tickConfig?.show ?? true,
        distance: -25,
        length: 8,
        lineStyle: {
          color: config.tickConfig?.color || (themeStore.darkMode ? '#666' : '#999'),
          width: 1
        }
      },
      
      // 刻度标签
      axisLabel: {
        show: config.tickConfig?.show ?? true,
        distance: -35,
        fontSize: 12,
        color: config.tickConfig?.color || (themeStore.darkMode ? '#ccc' : '#666')
      },
      
      // 分割线
      splitLine: {
        show: config.tickConfig?.show ?? true,
        distance: -22,
        length: 12,
        lineStyle: {
          color: config.tickConfig?.color || (themeStore.darkMode ? '#888' : '#aaa'),
          width: 2
        }
      },
      
      // 指针配置
      pointer: {
        show: true,
        length: `${(config.pointerConfig?.lengthRatio || 0.8) * 100}%`,
        width: config.pointerConfig?.width || 4,
        itemStyle: {
          color: getCurrentValueColor.value
        }
      },
      
      // 数值显示
      detail: config.showValue ? {
        show: true,
        fontSize: config.valueFontSize || 24,
        color: getCurrentValueColor.value,
        fontWeight: 'bold',
        offsetCenter: [0, '20%'],
        formatter: (value: number) => {
          const formattedValue = Number(value).toFixed(config.decimal || 1)
          return config.showUnit ? `${formattedValue}${unit}` : formattedValue
        }
      } : { show: false },
      
      // 数据
      data: [{
        value: value,
        name: title
      }],
      
      // 动画配置
      animation: config.enableAnimation ?? true,
      animationDuration: config.animationDuration || 1000,
      animationEasing: config.animationType || 'ease-out'
    }]
  }
  
  return option
})

/**
 * 图表点击处理
 */
const handleChartClick = (event: MouseEvent) => {
  if (currentCustomize.value.clickable) {
    emit('click', event)
  }
}

/**
 * 监听数值变化，触发阈值警告
 */
watch(actualValue, (newValue, oldValue) => {
  const config = currentCustomize.value
  
  // 发出数据变化事件
  if (newValue !== oldValue) {
    emit('data-change', {
      value: newValue,
      unit: actualUnit.value,
      title: actualTitle.value
    })
  }
  
  // 检查阈值警告
  if (config.enableThresholdAlert) {
    if (newValue >= (config.dangerThreshold ?? 90)) {
      emit('threshold-exceeded', newValue, config.dangerThreshold ?? 90)
    } else if (newValue >= (config.warningThreshold ?? 70)) {
      emit('threshold-exceeded', newValue, config.warningThreshold ?? 70)
    }
  }
})
</script>

<template>
  <div class="gauge-dashboard-container">
    <VChart
      class="gauge-chart"
      :option="chartOption"
      :theme="themeStore.darkMode ? 'dark' : null"
      autoresize
      @click="handleChartClick"
    />
  </div>
</template>

<style scoped>
.gauge-dashboard-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.gauge-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gauge-chart {
    min-height: 150px;
  }
}

/* 性能优化 */
.gauge-dashboard-container {
  contain: layout style paint;
  will-change: transform;
}

/* 支持无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .gauge-chart :deep(.echarts-container) {
    animation: none !important;
  }
}

/* 主题适配 */
.gauge-dashboard-container {
  color: var(--text-color);
}

[data-theme="dark"] .gauge-dashboard-container {
  color: var(--text-color-dark);
}
</style>