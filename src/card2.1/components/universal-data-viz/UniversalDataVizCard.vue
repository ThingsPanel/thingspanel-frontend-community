<template>
  <div class="universal-data-viz-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="title-section">
        <h3 class="card-title">{{ title || '数据可视化' }}</h3>
        <n-tag :type="chartTypeInfo.type" size="small">
          {{ chartTypeInfo.label }}
        </n-tag>
      </div>
      <n-button size="small" @click="refreshData" :loading="loading">
        <template #icon>
          <RefreshOutline />
        </template>
        刷新
      </n-button>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container">
      <!-- ECharts 图表 -->
      <div
        v-if="shouldShowChart"
        ref="chartRef"
        class="chart-wrapper"
        :style="{ height: chartHeight + 'px' }"
      />
      
      <!-- 对象数据展示 -->
      <div v-else-if="shouldShowObjectData" class="object-data-display">
        <div v-for="item in objectDataDisplay" :key="item.key" class="data-item">
          <span class="data-key">{{ item.key }}:</span>
          <span class="data-value">{{ item.value }}</span>
        </div>
      </div>
      
      <!-- 数据为空时的提示 -->
      <div v-else-if="!shouldShowChart && !shouldShowObjectData" class="empty-state">
        <n-empty description="暂无数据" size="small">
          <template #extra>
            <n-button size="small" @click="loadDemoData">
              加载演示数据
            </n-button>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebugInfo" class="debug-info">
      <n-collapse size="small">
        <n-collapse-item title="调试信息" name="debug">
          <div class="debug-content">
            <div class="debug-item">
              <strong>数据源数量:</strong> {{ dataSourceCount }}
            </div>
            <div class="debug-item">
              <strong>图表类型:</strong> {{ detectedChartType }}
            </div>
            <div class="debug-item">
              <strong>数据状态:</strong> {{ dataStatus }}
            </div>
            <div class="debug-item">
              <strong>原始 dataSources:</strong>
              <pre>{{ JSON.stringify(dataSources, null, 2) }}</pre>
            </div>
            <div class="debug-item">
              <strong>处理后的数据源:</strong>
              <pre>{{ JSON.stringify(processedDataSources, null, 2) }}</pre>
            </div>
            <div class="debug-item">
              <strong>数据源配置:</strong>
              <pre>{{ JSON.stringify(dataSourcesConfig, null, 2) }}</pre>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { NTag, NButton, NEmpty, NCollapse, NCollapseItem } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

// Props 接口
interface Props {
  /** 多数据源数据 */
  dataSources?: Record<string, any>
  /** 多数据源配置（包含路径映射等） */
  dataSourcesConfig?: any
  /** 单数据源数据（向下兼容） */
  data?: any
  /** 组件元数据 */
  metadata?: any
  /** 卡片标题 */
  title?: string
  /** 是否显示调试信息 */
  showDebugInfo?: boolean
  /** 图表高度 */
  chartHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => ({}),
  title: '数据可视化',
  showDebugInfo: true, // 默认显示调试信息以便验证
  chartHeight: 300
})

// 响应式状态
const loading = ref(false)
const chartRef = ref<HTMLElement>()
const chartInstance = ref<ECharts>()

// 演示数据
const demoData = {
  pieData: {
    cpu: 45,
    memory: 30,
    disk: 25,
    network: 15
  },
  lineData: [
    { time: '10:00', temperature: 22.5, humidity: 65 },
    { time: '11:00', temperature: 23.1, humidity: 62 },
    { time: '12:00', temperature: 24.0, humidity: 60 },
    { time: '13:00', temperature: 25.2, humidity: 58 },
    { time: '14:00', temperature: 26.1, humidity: 55 }
  ]
}

// 计算属性

/**
 * 处理后的数据源
 */
const processedDataSources = computed(() => {
  // 优先使用多数据源
  if (props.dataSources && Object.keys(props.dataSources).length > 0) {
    return props.dataSources
  }
  
  // 兜底使用单数据源（向下兼容）
  if (props.data) {
    return { primary: props.data }
  }
  
  // 如果没有数据，提供演示数据以便测试
  return {
    primary: demoData.lineData,
    comparison: demoData.lineData.map(item => ({
      ...item,
      humidity: item.humidity + Math.random() * 10 - 5 // 添加一些随机变化
    })),
    config: demoData.pieData
  }
})

/**
 * 数据源数量
 */
const dataSourceCount = computed(() => {
  return Object.keys(processedDataSources.value).length
})

/**
 * 自动检测图表类型
 */
const detectedChartType = computed(() => {
  const dataSources = processedDataSources.value
  const arraySourceCount = Object.values(dataSources).filter(data => Array.isArray(data)).length
  const objectSourceCount = Object.values(dataSources).filter(data => 
    data && typeof data === 'object' && !Array.isArray(data)
  ).length

  if (objectSourceCount > 0 && arraySourceCount === 0) {
    return 'object-display' // 纯对象数据 → 数据展示
  } else if (arraySourceCount >= 1) {
    return arraySourceCount === 1 ? 'single-line' : 'multi-line' // 数组数据 → 单/双曲线
  }
  
  return 'unknown'
})

/**
 * 图表类型信息
 */
const chartTypeInfo = computed(() => {
  switch (detectedChartType.value) {
    case 'object-display':
      return { type: 'success', label: '数据展示' }
    case 'single-line':
      return { type: 'info', label: '单曲线' }
    case 'multi-line':
      return { type: 'warning', label: '双曲线' }
    default:
      return { type: 'default', label: '未知' }
  }
})

/**
 * 数据状态
 */
const dataStatus = computed(() => {
  if (dataSourceCount.value === 0) return '无数据'
  if (detectedChartType.value === 'unknown') return '数据格式不支持'
  return '正常'
})

/**
 * 是否应该显示图表
 */
const shouldShowChart = computed(() => {
  return dataSourceCount.value > 0 && detectedChartType.value !== 'unknown' && detectedChartType.value !== 'object-display'
})

/**
 * 是否应该显示对象数据
 */
const shouldShowObjectData = computed(() => {
  return dataSourceCount.value > 0 && detectedChartType.value === 'object-display'
})

/**
 * 对象数据展示
 */
const objectDataDisplay = computed(() => {
  if (!shouldShowObjectData.value) return []
  return generateObjectDataDisplay(processedDataSources.value) || []
})

// 方法

/**
 * 刷新数据
 */
const refreshData = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟加载
    updateChart()
  } finally {
    loading.value = false
  }
}

/**
 * 加载演示数据
 */
const loadDemoData = () => {
  // 触发父组件更新数据（这里只是示例）
  console.log('🔄 [UniversalDataVizCard] 加载演示数据')
}

/**
 * 更新图表
 */
const updateChart = () => {
  if (!chartInstance.value || !shouldShowChart.value) return

  const option = generateChartOption()
  chartInstance.value.setOption(option, true)
}

/**
 * 生成图表配置
 */
const generateChartOption = () => {
  const chartType = detectedChartType.value
  const dataSources = processedDataSources.value

  switch (chartType) {
    case 'object-display':
      return {} // 对象数据不需要图表配置，直接显示在模板中
    case 'single-line':
    case 'multi-line':
      return generateLineOption(dataSources, chartType === 'multi-line')
    default:
      return {}
  }
}

/**
 * 生成对象数据展示
 */
const generateObjectDataDisplay = (dataSources: Record<string, any>) => {
  // 找到对象数据源
  const objectDataSource = Object.entries(dataSources).find(([_, data]) => 
    data && typeof data === 'object' && !Array.isArray(data)
  )

  if (!objectDataSource) return null

  const [sourceKey, objectData] = objectDataSource

  // 从配置中获取应该显示哪些字段
  const sourceConfig = props.dataSourcesConfig?.dataSources?.[sourceKey]
  const fieldSelection = sourceConfig?.fieldSelection || {}

  console.log(`🔧 [UniversalDataVizCard] 对象数据源 ${sourceKey} 字段选择:`, {
    fieldSelection,
    sourceConfig,
    objectData
  })

  // 如果有字段选择配置，只显示选中的字段
  if (fieldSelection && Object.keys(fieldSelection).length > 0) {
    return Object.entries(objectData)
      .filter(([key]) => fieldSelection[key] === true)
      .map(([key, value]) => ({
        key,
        value: typeof value === 'number' ? value.toFixed(2) : String(value)
      }))
  }

  // 否则显示所有字段
  return Object.entries(objectData).map(([key, value]) => ({
    key,
    value: typeof value === 'number' ? value.toFixed(2) : String(value)
  }))
}

/**
 * 生成折线图配置
 */
const generateLineOption = (dataSources: Record<string, any>, isMultiLine: boolean) => {
  const arrayDataSources = Object.entries(dataSources).filter(([_, data]) => Array.isArray(data))
  
  if (arrayDataSources.length === 0) return {}

  const series: any[] = []
  let xAxisData: string[] = []

  arrayDataSources.forEach(([sourceKey, data], index) => {
    if (!Array.isArray(data) || data.length === 0) return

    // 从配置中获取字段映射，否则使用默认值
    const sourceConfig = props.dataSourcesConfig?.dataSources?.[sourceKey]
    const pathMapping = sourceConfig?.pathMapping || {}
    
    const timeField = pathMapping.xField || pathMapping.x || 'timestamp'
    const valueField = pathMapping.yField || pathMapping.y || (index === 0 ? 'temperature' : 'humidity')

    console.log(`🔧 [UniversalDataVizCard] 数据源 ${sourceKey} 字段映射:`, {
      timeField,
      valueField,
      pathMapping,
      sourceConfig
    })

    if (index === 0) {
      xAxisData = data.map(item => item[timeField] || item.timestamp || `点${index}`)
    }

    const seriesData = data.map(item => item[valueField] || item.value || 0)

    // 显示最终用到的数据，用于调试
    console.log(`📊 [UniversalDataVizCard] 数据源 ${sourceKey} 最终使用的数据:`, {
      原始数据样本: data.slice(0, 2),
      时间轴字段: timeField,
      数值轴字段: valueField,
      提取的时间轴: xAxisData.slice(0, 2),
      提取的数值轴: seriesData.slice(0, 2),
      完整seriesData: seriesData
    })

    series.push({
      name: sourceKey === 'primary' ? '主数据' : '对比数据',
      type: 'line',
      data: seriesData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2
      }
    })
  })

  return {
    title: {
      text: isMultiLine ? '双曲线对比' : '趋势图',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      top: '10%',
      show: isMultiLine
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value'
    },
    series
  }
}

/**
 * 初始化图表
 */
const initChart = async () => {
  await nextTick()
  
  if (!chartRef.value) return

  chartInstance.value = echarts.init(chartRef.value)
  
  // 窗口大小变化时重新调整图表
  window.addEventListener('resize', () => {
    chartInstance.value?.resize()
  })

  updateChart()
}

// 监听数据变化
watch(() => processedDataSources.value, () => {
  console.log('🔄 [UniversalDataVizCard] 数据源变化，更新图表')
  updateChart()
}, { deep: true, immediate: true })

// 监听 dataSources prop 变化
watch(() => props.dataSources, (newDataSources) => {
  console.log('🔄 [UniversalDataVizCard] dataSources prop 变化:', newDataSources)
  updateChart()
}, { deep: true, immediate: true })

// 监听 dataSourcesConfig prop 变化
watch(() => props.dataSourcesConfig, (newConfig) => {
  console.log('🔄 [UniversalDataVizCard] dataSourcesConfig prop 变化:', newConfig)
  updateChart()
}, { deep: true, immediate: true })

// 组件挂载
onMounted(() => {
  if (shouldShowChart.value) {
    initChart()
  }
})
</script>

<style scoped>
.universal-data-viz-card {
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--divider-color);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

.chart-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-wrapper {
  width: 100%;
}

.object-data-display {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.data-key {
  font-weight: 500;
  color: var(--text-color);
}

.data-value {
  font-weight: 600;
  color: var(--primary-color);
}

.empty-state {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.debug-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
}

.debug-content {
  font-size: 12px;
  line-height: 1.5;
}

.debug-item {
  margin-bottom: 8px;
}

.debug-item strong {
  color: var(--primary-color);
  margin-right: 8px;
}

.debug-item pre {
  margin-top: 4px;
  padding: 8px;
  background: var(--code-color);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  max-height: 200px;
  overflow-y: auto;
}

/* 深色主题适配 */
[data-theme="dark"] .universal-data-viz-card {
  background: var(--card-color);
  border-color: var(--border-color);
}

[data-theme="dark"] .debug-item pre {
  background: var(--code-color);
}
</style>