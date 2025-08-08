<template>
  <div class="array-chart-test-card">
    <!-- 头部信息 -->
    <div class="card-header">
      <n-space justify="space-between" align="center">
        <div>
          <h3 class="card-title">数组图表测试组件</h3>
          <p class="card-subtitle">展示数组数据驱动的图表渲染</p>
        </div>
        <n-button size="small" @click="refreshData" :loading="loading">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
          刷新
        </n-button>
      </n-space>
    </div>

    <!-- 主内容区 -->
    <div class="card-content">
      <div v-if="hasData" class="data-display">
        <!-- 数据统计 -->
        <div class="stats-section">
          <n-space>
            <n-statistic label="数据点数量" :value="dataPoints.length" />
            <n-statistic label="最大值" :value="maxValue" :precision="2" />
            <n-statistic label="最小值" :value="minValue" :precision="2" />
            <n-statistic label="平均值" :value="avgValue" :precision="2" />
          </n-space>
        </div>

        <!-- 图表展示区 -->
        <div class="chart-section">
          <div class="chart-container" ref="chartRef">
            <!-- 这里会渲染ECharts图表 -->
          </div>
        </div>

        <!-- 数据表格 -->
        <div class="table-section">
          <n-data-table
            :columns="tableColumns"
            :data="tableData"
            :pagination="{ pageSize: 10 }"
            size="small"
          />
        </div>

        <!-- 调试信息 -->
        <div v-if="showDebugInfo" class="debug-section">
          <n-card title="数据调试信息" size="small">
            <n-space vertical>
              <div>
                <strong>接收的原始数据类型:</strong> {{ dataType }}
              </div>
              <div>
                <strong>数组长度:</strong> {{ Array.isArray(receivedData) ? receivedData.length : '非数组' }}
              </div>
              <div>
                <strong>处理后的数据点:</strong>
                <n-code :code="JSON.stringify(dataPoints.slice(0, 3), null, 2)" language="json" />
                <span v-if="dataPoints.length > 3">... (显示前3个)</span>
              </div>
              <div>
                <strong>图表配置:</strong>
                <n-code :code="JSON.stringify(chartConfig, null, 2)" language="json" />
              </div>
            </n-space>
          </n-card>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="no-data">
        <n-empty description="暂无数组数据" size="small">
          <template #icon>
            <n-icon><BarChartOutline /></n-icon>
          </template>
          <template #extra>
            <div class="status-info">
              <p class="hint-text">数组数据源配置状态：</p>
              <ul class="status-list">
                <li>✓ 组件已正确挂载和初始化</li>
                <li>{{ props.data ? '✓ 接收到props.data' : '✗ 未接收到props.data' }}</li>
                <li>{{ Array.isArray(receivedData) ? '✓ 数据为数组格式' : '✗ 数据非数组格式' }}</li>
                <li>{{ hasValidDataStructure ? '✓ 数据结构有效' : '✗ 数据结构无效' }}</li>
                <li class="help-text">👆 请配置数组数据源：时间序列数据、坐标点等</li>
              </ul>
            </div>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { RefreshOutline, BarChartOutline } from '@vicons/ionicons5'
import * as echarts from 'echarts'

/**
 * 数组图表测试组件属性接口
 */
interface Props {
  data?: any[] // 期望接收数组数据
  title?: string
  showDebugInfo?: boolean
  chartType?: 'line' | 'bar' | 'scatter'
  xAxisKey?: string // x轴对应的数据字段
  yAxisKey?: string // y轴对应的数据字段
}

/**
 * 数据点接口（用于图表）
 */
interface DataPoint {
  x: number | string
  y: number
  timestamp?: number
  label?: string
  [key: string]: any
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  title: '数组图表测试组件',
  showDebugInfo: true,
  chartType: 'line',
  xAxisKey: 'x',
  yAxisKey: 'y'
})

const message = useMessage()
const loading = ref(false)
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 基础响应式数据
const receivedData = computed(() => props.data || [])
const updateCount = ref(0)
const lastUpdateTime = ref('从未更新')

// 数据类型分析
const dataType = computed(() => {
  const data = receivedData.value
  if (Array.isArray(data)) {
    if (data.length === 0) return 'array (empty)'
    const firstItem = data[0]
    if (typeof firstItem === 'object' && firstItem !== null) {
      return `array<object> (${data.length} items)`
    }
    return `array<${typeof firstItem}> (${data.length} items)`
  }
  return typeof data
})

// 数据有效性检查
const hasValidDataStructure = computed(() => {
  const data = receivedData.value
  if (!Array.isArray(data) || data.length === 0) return false
  
  // 检查数组中的对象是否包含需要的字段
  const firstItem = data[0]
  if (typeof firstItem === 'object' && firstItem !== null) {
    return props.xAxisKey in firstItem || props.yAxisKey in firstItem
  }
  
  // 如果是数值数组，也认为是有效的
  return typeof firstItem === 'number'
})

const hasData = computed(() => {
  return Array.isArray(receivedData.value) && receivedData.value.length > 0 && hasValidDataStructure.value
})

// 处理数据点
const dataPoints = computed((): DataPoint[] => {
  const data = receivedData.value
  if (!Array.isArray(data)) return []
  
  return data.map((item, index) => {
    if (typeof item === 'number') {
      // 如果是纯数值数组，使用索引作为x轴
      return { x: index, y: item }
    } else if (typeof item === 'object' && item !== null) {
      // 如果是对象数组，提取指定字段
      return {
        x: item[props.xAxisKey] ?? index,
        y: Number(item[props.yAxisKey]) || 0,
        ...item // 保留原始数据
      }
    }
    return { x: index, y: 0 }
  })
})

// 统计计算
const maxValue = computed(() => Math.max(...dataPoints.value.map(p => p.y)))
const minValue = computed(() => Math.min(...dataPoints.value.map(p => p.y)))
const avgValue = computed(() => {
  const values = dataPoints.value.map(p => p.y)
  return values.reduce((sum, val) => sum + val, 0) / values.length || 0
})

// 表格数据
const tableColumns = [
  { title: 'X轴', key: 'x', width: 100 },
  { title: 'Y轴', key: 'y', width: 100 },
  { title: '标签', key: 'label', width: 120 },
  { title: '原始数据', key: 'raw', ellipsis: { tooltip: true } }
]

const tableData = computed(() => {
  return dataPoints.value.map((point, index) => ({
    x: point.x,
    y: point.y,
    label: point.label || `点${index + 1}`,
    raw: JSON.stringify(receivedData.value[index])
  }))
})

// 图表配置
const chartConfig = computed(() => {
  return {
    title: {
      text: props.title,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0]
        return `X: ${point.name}<br/>Y: ${point.value}`
      }
    },
    xAxis: {
      type: 'category',
      data: dataPoints.value.map(p => p.x),
      name: props.xAxisKey
    },
    yAxis: {
      type: 'value',
      name: props.yAxisKey
    },
    series: [{
      name: props.title,
      type: props.chartType,
      data: dataPoints.value.map(p => p.y),
      smooth: props.chartType === 'line',
      itemStyle: {
        color: '#1890ff'
      }
    }]
  }
})

/**
 * 初始化ECharts图表
 */
const initChart = async () => {
  if (!chartRef.value) return
  
  try {
    // 销毁现有实例
    if (chartInstance) {
      chartInstance.dispose()
    }
    
    // 创建新实例
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(chartConfig.value)
    
    // 监听窗口大小变化
    const handleResize = () => chartInstance?.resize()
    window.addEventListener('resize', handleResize)
    
    console.log('📊 [ArrayChartTestCard] ECharts图表已初始化')
  } catch (error) {
    console.error('📊 [ArrayChartTestCard] 图表初始化失败:', error)
  }
}

/**
 * 更新图表数据
 */
const updateChart = () => {
  if (chartInstance && hasData.value) {
    chartInstance.setOption(chartConfig.value, true)
    console.log('📊 [ArrayChartTestCard] 图表数据已更新')
  }
}

/**
 * 刷新数据
 */
const refreshData = () => {
  loading.value = true
  
  setTimeout(() => {
    loading.value = false
    if (hasData.value) {
      message.success(`数据刷新完成，当前有${dataPoints.value.length}个数据点`)
      updateChart()
    } else {
      message.info('请在右侧数据源面板配置数组数据源')
    }
  }, 1000)
}

// 监听数据变化
watch(() => props.data, (newData, oldData) => {
  console.log('🔍 [ArrayChartTestCard] 数据变化:', { newData, oldData })
  
  if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
    lastUpdateTime.value = new Date().toLocaleString()
    updateCount.value++
    
    if (updateCount.value > 1) {
      message.success('数组数据已更新')
    }
    
    // 更新图表
    nextTick(() => {
      updateChart()
    })
  }
}, { deep: true, immediate: true })

// 监听图表配置变化
watch(() => chartConfig.value, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

// 组件挂载
onMounted(() => {
  console.log('🚀 [ArrayChartTestCard] 数组图表组件已挂载')
  console.log('🚀 [ArrayChartTestCard] 当前props.data:', props.data)
  console.log('🚀 [ArrayChartTestCard] 数据类型:', dataType.value)
  console.log('🚀 [ArrayChartTestCard] 处理后数据点:', dataPoints.value)
  
  // 延迟初始化图表，确保DOM已渲染
  nextTick(() => {
    if (hasData.value) {
      initChart()
    }
  })
})

// 组件卸载清理
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.array-chart-test-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--body-color);
}

.card-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.card-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--text-color-2);
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.data-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.stats-section {
  flex-shrink: 0;
}

.chart-section {
  flex: 1;
  min-height: 300px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.table-section {
  flex-shrink: 0;
  max-height: 200px;
  overflow: auto;
}

.debug-section {
  flex-shrink: 0;
  margin-top: 16px;
}

.no-data {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.status-info {
  text-align: left;
  max-width: 280px;
}

.status-list {
  margin: 8px 0 0 0;
  padding: 0 0 0 16px;
  list-style: none;
  font-size: 12px;
  line-height: 1.6;
}

.status-list li {
  margin: 4px 0;
  color: var(--text-color-2);
}

.help-text {
  color: var(--primary-color);
  font-weight: 500;
  margin-top: 8px !important;
}

.hint-text {
  color: var(--text-color-2);
  font-size: 14px;
  margin-bottom: 8px;
}
</style>