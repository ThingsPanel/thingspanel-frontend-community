<template>
  <div class="universal-data-viz-card">
    <!-- 头部信息 -->
    <div class="card-header">
      <n-space justify="space-between" align="center">
        <div>
          <h3 class="card-title">通用数据可视化组件</h3>
          <p class="card-subtitle">统一支持对象数据和数组数据，智能路径映射</p>
        </div>
        <n-space>
          <n-tag :type="dataTypeInfo.type" size="small">{{ dataTypeInfo.label }}</n-tag>
          <n-button size="small" @click="refreshData" :loading="loading">
            <template #icon>
              <RefreshOutline />
            </template>
            刷新
          </n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 主内容区 -->
    <div class="card-content">
      <div v-if="hasData" class="data-display">
        <!-- 数据模式切换 -->
        <div class="mode-selector">
          <n-radio-group v-model:value="displayMode" size="small">
            <n-radio-button value="chart" :disabled="!canShowChart">
              <template #icon>
                <BarChartOutline />
              </template>
              图表
            </n-radio-button>
            <n-radio-button value="object" :disabled="!canShowObject">
              <template #icon>
                <GridOutline />
              </template>
              对象
            </n-radio-button>
            <n-radio-button value="table" :disabled="!canShowTable">
              <template #icon>
                <ListOutline />
              </template>
              表格
            </n-radio-button>
          </n-radio-group>
        </div>

        <!-- 图表展示模式 -->
        <div v-if="displayMode === 'chart'" class="chart-mode">
          <!-- 路径配置面板 -->
          <div v-if="isArrayData" class="path-config-panel">
            <n-card title="数组数据路径配置" size="small">
              <n-space>
                <div class="path-input">
                  <label>X轴路径:</label>
                  <n-input 
                    v-model:value="arrayXPath" 
                    size="small" 
                    placeholder="如: x 或 timestamp 或 [0]" 
                    @input="updateChartData"
                  />
                </div>
                <div class="path-input">
                  <label>Y轴路径:</label>
                  <n-input 
                    v-model:value="arrayYPath" 
                    size="small" 
                    placeholder="如: y 或 value 或 [1]" 
                    @input="updateChartData"
                  />
                </div>
                <n-button size="small" type="primary" @click="applyPathMapping">
                  应用映射
                </n-button>
              </n-space>
            </n-card>
          </div>
          
          <div class="chart-stats">
            <n-space>
              <n-statistic label="数据点数量" :value="chartDataPoints.length" />
              <n-statistic label="最大值" :value="chartStats.max" :precision="2" />
              <n-statistic label="最小值" :value="chartStats.min" :precision="2" />
              <n-statistic label="平均值" :value="chartStats.avg" :precision="2" />
            </n-space>
          </div>
          
          <div class="chart-container" ref="chartRef">
            <!-- ECharts 图表渲染区域 -->
          </div>
        </div>

        <!-- 对象展示模式 -->
        <div v-if="displayMode === 'object'" class="object-mode">
          <div class="object-stats">
            <n-space>
              <n-statistic label="对象字段" :value="objectFields.length" />
              <n-statistic label="数据状态" :value="objectDataStatus" />
            </n-space>
          </div>
          <div class="object-cards">
            <div v-for="field in objectFields" :key="field.key" class="field-card">
              <div class="field-header">
                <span class="field-name">{{ field.key }}</span>
                <n-tag :type="field.type === 'number' ? 'success' : 'info'" size="tiny">
                  {{ field.type }}
                </n-tag>
              </div>
              <div class="field-value">
                <span v-if="typeof field.value === 'object'">
                  {{ JSON.stringify(field.value) }}
                </span>
                <span v-else>{{ field.value }}</span>
              </div>
              <div class="field-path">{{ field.path || 'root' }}</div>
            </div>
          </div>
        </div>

        <!-- 表格展示模式 -->
        <div v-if="displayMode === 'table'" class="table-mode">
          <n-data-table
            :columns="tableColumns"
            :data="tableData"
            :pagination="tablePagination"
            size="small"
            :scroll-x="600"
          />
        </div>

        <!-- 调试信息 -->
        <div v-if="showDebugInfo" class="debug-section">
          <n-card title="数据处理调试" size="small">
            <n-space vertical>
              <div>
                <strong>接收数据类型:</strong> {{ dataType }}
              </div>
              <div>
                <strong>处理模式:</strong> {{ processingMode }}
              </div>
              <div v-if="isArrayData">
                <strong>数组长度:</strong> {{ Array.isArray(receivedData) ? receivedData.length : 0 }}
              </div>
              <div v-if="isObjectData">
                <strong>对象字段数:</strong> {{ objectFields.length }}
              </div>
              <div>
                <strong>原始数据预览:</strong>
                <n-code :code="debugDataPreview" language="json" />
              </div>
            </n-space>
          </n-card>
        </div>
      </div>

      <!-- 无数据状态（现在不会显示，因为有默认数据） -->
      <div v-else class="no-data">
        <n-empty description="正在加载数据..." size="small">
          <template #icon>
            <DocumentTextOutline />
          </template>
          <template #extra>
            <div class="status-info">
              <p class="hint-text">组件初始化中，将显示默认演示数据</p>
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
import { 
  RefreshOutline, 
  BarChartOutline, 
  GridOutline, 
  ListOutline,
  DocumentTextOutline 
} from '@vicons/ionicons5'
import * as echarts from 'echarts'

/**
 * 通用数据可视化组件属性接口
 */
interface Props {
  data?: any // 可以是对象、数组或其他类型
  metadata?: any // 组件元数据，包含dataConfig等配置信息
  title?: string
  showDebugInfo?: boolean
  chartType?: 'line' | 'bar' | 'scatter'
  autoDetectMode?: boolean // 是否自动检测数据模式
}

/**
 * 图表数据点接口
 */
interface ChartDataPoint {
  x: number | string
  y: number
  name?: string
  category?: string
  [key: string]: any
}

/**
 * 对象字段接口
 */
interface ObjectField {
  key: string
  value: any
  type: string
  path: string
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
  title: '通用数据可视化组件',
  showDebugInfo: true,
  chartType: 'line',
  autoDetectMode: true
})

// 默认演示数据（用于显示折线图）
const defaultDemoData = [
  { timestamp: '2024-01-01', temperature: 22.5, humidity: 65, label: '数据点1' },
  { timestamp: '2024-01-02', temperature: 23.2, humidity: 62, label: '数据点2' },
  { timestamp: '2024-01-03', temperature: 21.8, humidity: 68, label: '数据点3' },
  { timestamp: '2024-01-04', temperature: 24.1, humidity: 60, label: '数据点4' },
  { timestamp: '2024-01-05', temperature: 25.0, humidity: 58, label: '数据点5' },
  { timestamp: '2024-01-06', temperature: 23.7, humidity: 63, label: '数据点6' },
  { timestamp: '2024-01-07', temperature: 22.9, humidity: 66, label: '数据点7' }
]

// 数组数据路径配置
const arrayXPath = ref('timestamp') // 默认使用 timestamp
const arrayYPath = ref('temperature') // 默认使用 temperature
const pathMappingApplied = ref(false)

/**
 * 智能路径推断：使用数组第0个元素来自动推断字段路径
 */
const inferPathsFromFirstElement = (data: any[]) => {
  if (!Array.isArray(data) || data.length === 0) return
  
  const firstElement = data[0]
  if (!firstElement || typeof firstElement !== 'object') return
  
  const keys = Object.keys(firstElement)
  console.log('🔍 [UniversalDataViz] 检测到数组第0个元素的字段:', keys)
  
  // X轴候选字段（时间、索引类）
  const xCandidates = ['timestamp', 'time', 'date', 'x', 'index', 'id']
  // Y轴候选字段（数值类）
  const yCandidates = ['value', 'y', 'amount', 'count', 'price', 'temperature', 'humidity', 'pressure']
  
  // 找到最佳X轴字段
  const bestXField = xCandidates.find(candidate => keys.includes(candidate)) || keys[0]
  
  // 找到最佳Y轴字段（优先选择数值类型）
  const numericFields = keys.filter(key => typeof firstElement[key] === 'number')
  const bestYField = yCandidates.find(candidate => numericFields.includes(candidate)) || 
                    numericFields[0] || 
                    keys[1] || 
                    'value'
  
  // 更新路径配置
  arrayXPath.value = bestXField
  arrayYPath.value = bestYField
  
  console.log('🎯 [UniversalDataViz] 自动推断路径:', {
    bestXField,
    bestYField,
    numericFields,
    firstElementSample: firstElement
  })
}

const message = useMessage()
const loading = ref(false)
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 基础响应式数据
const receivedData = computed(() => {
  // 如果没有提供数据，使用默认演示数据
  return props.data || defaultDemoData
})
const displayMode = ref<'chart' | 'object' | 'table'>('chart') // 默认显示图表
const updateCount = ref(0)
const lastUpdateTime = ref('从未更新')

// 数据类型分析
const dataType = computed(() => {
  const data = receivedData.value
  if (data === null || data === undefined) return 'null'
  if (Array.isArray(data)) {
    if (data.length === 0) return 'array (empty)'
    const firstItem = data[0]
    return `array<${typeof firstItem}> (${data.length} items)`
  }
  if (typeof data === 'object') {
    const keys = Object.keys(data)
    return `object (${keys.length} fields)`
  }
  return typeof data
})

const isArrayData = computed(() => Array.isArray(receivedData.value))
const isObjectData = computed(() => {
  const data = receivedData.value
  return data && typeof data === 'object' && !Array.isArray(data)
})

const hasValidData = computed(() => {
  const data = receivedData.value
  return data !== null && data !== undefined && 
         (isArrayData.value && data.length > 0) || 
         (isObjectData.value && Object.keys(data).length > 0)
})

const canAutoDetectType = computed(() => hasValidData.value)

const processingMode = computed(() => {
  if (isArrayData.value) return 'array'
  if (isObjectData.value) return 'object'
  return 'unknown'
})

const hasData = computed(() => hasValidData.value)

// 数据类型信息
const dataTypeInfo = computed(() => {
  if (isArrayData.value) {
    return { type: 'success', label: '数组数据' }
  } else if (isObjectData.value) {
    return { type: 'info', label: '对象数据' }
  } else {
    return { type: 'warning', label: '未知类型' }
  }
})

// 显示模式可用性
const canShowChart = computed(() => {
  if (!hasData.value) return false
  
  if (isArrayData.value) {
    // 数组数据需要是数值型或包含数值字段的对象
    const data = receivedData.value
    if (!Array.isArray(data) || data.length === 0) return false
    
    const firstItem = data[0]
    if (typeof firstItem === 'number') {
      return true
    } else if (typeof firstItem === 'object' && firstItem !== null) {
      // 检查对象是否包含数值字段
      const hasNumericFields = Object.values(firstItem).some(value => typeof value === 'number')
      return hasNumericFields
    }
    return false
  } else if (isObjectData.value) {
    // 对象数据需要包含数值字段
    const data = receivedData.value
    const hasNumericFields = Object.values(data).some(value => typeof value === 'number')
    const hasNestedNumericFields = Object.values(data).some(value => 
      value && typeof value === 'object' && !Array.isArray(value) &&
      Object.values(value).some(nestedValue => typeof nestedValue === 'number')
    )
    return hasNumericFields || hasNestedNumericFields
  }
  
  return false
})

const canShowObject = computed(() => hasData.value)
const canShowTable = computed(() => isArrayData.value && hasData.value)

/**
 * 通过路径获取值的工具函数
 * 支持对象路径（如 'a.b.c'）和数组索引（如 '[0]' 或 '0'）
 */
const getValueByPath = (obj: any, path: string): any => {
  if (!obj || !path) return undefined
  
  try {
    // 处理数组索引形式 [0] 或直接数字 0
    if (path.match(/^\[\d+\]$/) || path.match(/^\d+$/)) {
      const index = parseInt(path.replace(/[\[\]]/g, ''))
      return Array.isArray(obj) ? obj[index] : obj
    }
    
    // 处理对象路径形式 a.b.c
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  } catch {
    return undefined
  }
}

// 图表数据处理
const chartDataPoints = computed((): ChartDataPoint[] => {
  if (!hasData.value) return []
  
  if (isArrayData.value) {
    // 数组数据处理 - 支持路径映射
    const data = receivedData.value
    return data.map((item: any, index: number) => {
      if (typeof item === 'number') {
        // 纯数值数组
        return { x: index, y: item, name: `点${index + 1}` }
      } else if (typeof item === 'object' && item !== null) {
        // 对象数组 - 使用路径映射
        const xValue = getValueByPath(item, arrayXPath.value)
        const yValue = getValueByPath(item, arrayYPath.value)
        
        return {
          x: xValue !== undefined ? xValue : index,
          y: typeof yValue === 'number' ? yValue : 0,
          name: item.name || item.label || `点${index + 1}`,
          category: item.category || 'default',
          originalIndex: index,
          ...item
        }
      } else {
        // 其他类型，尝试转换为数值
        const numValue = Number(item)
        return { 
          x: index, 
          y: isNaN(numValue) ? 0 : numValue, 
          name: `点${index + 1}` 
        }
      }
    }).filter(point => typeof point.y === 'number' && !isNaN(point.y))
  } else if (isObjectData.value) {
    // 对象数据处理 - 将数值字段转换为数据点
    const data = receivedData.value
    const points: ChartDataPoint[] = []
    
    const extractNumericFields = (obj: any, prefix = '') => {
      Object.entries(obj).forEach(([key, value], index) => {
        const fullPath = prefix ? `${prefix}.${key}` : key
        
        if (typeof value === 'number') {
          points.push({
            x: points.length,
            y: value,
            name: key,
            category: prefix || 'root',
            path: fullPath
          })
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          extractNumericFields(value, fullPath)
        }
      })
    }
    
    extractNumericFields(data)
    return points
  }
  
  return []
})

// 图表统计
const chartStats = computed(() => {
  const values = chartDataPoints.value.map(p => p.y)
  if (values.length === 0) return { max: 0, min: 0, avg: 0 }
  
  return {
    max: Math.max(...values),
    min: Math.min(...values),
    avg: values.reduce((sum, val) => sum + val, 0) / values.length
  }
})

// 对象数据处理
const objectFields = computed((): ObjectField[] => {
  const data = receivedData.value
  if (!isObjectData.value) return []
  
  const fields: ObjectField[] = []
  
  const extractFields = (obj: any, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // 递归处理嵌套对象
        extractFields(value, fullPath)
      } else {
        fields.push({
          key,
          value,
          type: typeof value,
          path: fullPath
        })
      }
    })
  }
  
  extractFields(data)
  return fields
})

const objectDataStatus = computed(() => {
  return objectFields.value.length > 0 ? '正常' : '无字段'
})

// 表格数据
const tableColumns = computed(() => {
  if (!isArrayData.value || !hasData.value) return []
  
  const firstItem = receivedData.value[0]
  if (typeof firstItem === 'object' && firstItem !== null) {
    return Object.keys(firstItem).map(key => ({
      title: key,
      key,
      width: 120,
      ellipsis: { tooltip: true }
    }))
  } else {
    return [
      { title: '索引', key: 'index', width: 80 },
      { title: '值', key: 'value', width: 120 }
    ]
  }
})

const tableData = computed(() => {
  if (!isArrayData.value) return []
  
  return receivedData.value.map((item: any, index: number) => {
    if (typeof item === 'object' && item !== null) {
      return { ...item, _index: index }
    } else {
      return { index, value: item, _index: index }
    }
  })
})

const tablePagination = { pageSize: 10 }

// 图表配置
const chartConfig = computed(() => {
  const points = chartDataPoints.value
  if (points.length === 0) return null
  
  return {
    title: {
      text: `${props.title} - ${isArrayData.value ? '数组' : '对象'}数据曲线图`,
      left: 'center',
      textStyle: { 
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50,50,50,0.9)',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const point = params[0]
        const dataPoint = points[point.dataIndex]
        return `
          <div style="padding: 8px;">
            <div><strong>${dataPoint.name || '数据点'}</strong></div>
            <div>X: ${dataPoint.x}</div>
            <div>Y: ${dataPoint.y}</div>
            ${dataPoint.category ? `<div>类别: ${dataPoint.category}</div>` : ''}
            ${dataPoint.path ? `<div>路径: ${dataPoint.path}</div>` : ''}
          </div>
        `
      }
    },
    xAxis: {
      type: 'category',
      data: points.map(p => String(p.x)),
      name: isArrayData.value ? `X轴 (${arrayXPath.value})` : 'X轴',
      nameLocation: 'middle',
      nameGap: 25,
      axisLine: {
        lineStyle: { color: '#999' }
      }
    },
    yAxis: {
      type: 'value',
      name: isArrayData.value ? `Y轴 (${arrayYPath.value})` : 'Y轴',
      nameLocation: 'middle',
      nameGap: 40,
      axisLine: {
        lineStyle: { color: '#999' }
      },
      splitLine: {
        lineStyle: { color: '#f0f0f0' }
      }
    },
    series: [{
      name: '数据系列',
      type: props.chartType,
      data: points.map(p => p.y),
      smooth: props.chartType === 'line',
      itemStyle: {
        color: '#1890ff',
        borderColor: '#1890ff',
        borderWidth: 2
      },
      lineStyle: props.chartType === 'line' ? {
        width: 3,
        color: '#1890ff'
      } : undefined,
      emphasis: {
        itemStyle: {
          color: '#ff7875',
          shadowBlur: 10,
          shadowColor: 'rgba(255, 120, 117, 0.5)'
        }
      }
    }],
    grid: {
      top: 80,
      left: 60,
      right: 40,
      bottom: 60,
      backgroundColor: '#fafafa',
      borderColor: '#ddd'
    },
    animation: true,
    animationDuration: 1000
  }
})

// 调试信息
const debugDataPreview = computed(() => {
  const data = receivedData.value
  if (data === null || data === undefined) return 'null'
  
  if (Array.isArray(data)) {
    return JSON.stringify(data.slice(0, 3), null, 2) + (data.length > 3 ? '\n... (更多数据)' : '')
  } else if (typeof data === 'object') {
    const keys = Object.keys(data)
    const preview = keys.slice(0, 5).reduce((obj: any, key) => {
      obj[key] = data[key]
      return obj
    }, {})
    return JSON.stringify(preview, null, 2) + (keys.length > 5 ? '\n... (更多字段)' : '')
  }
  
  return String(data)
})

/**
 * 初始化ECharts图表
 */
const initChart = async () => {
  if (!chartRef.value || !canShowChart.value) return
  
  try {
    // 销毁现有实例
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    
    await nextTick()
    
    // 确保容器尺寸
    const container = chartRef.value
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('📊 [UniversalDataViz] 图表容器尺寸为0，延迟初始化')
      setTimeout(() => initChart(), 100)
      return
    }
    
    // 创建新实例
    chartInstance = echarts.init(container, 'light', {
      width: container.offsetWidth,
      height: Math.max(container.offsetHeight, 300)
    })
    
    const config = chartConfig.value
    if (config) {
      chartInstance.setOption(config)
      console.log('📊 [UniversalDataViz] ECharts图表已初始化，数据点:', chartDataPoints.value.length)
    }
    
    // 监听窗口大小变化
    const handleResize = () => {
      if (chartInstance) {
        chartInstance.resize()
      }
    }
    
    window.addEventListener('resize', handleResize)
    
  } catch (error) {
    console.error('📊 [UniversalDataViz] 图表初始化失败:', error)
    message.error('图表初始化失败: ' + error.message)
  }
}

/**
 * 更新图表数据
 */
const updateChart = () => {
  if (!chartInstance || !canShowChart.value) return
  
  try {
    const config = chartConfig.value
    if (config) {
      chartInstance.setOption(config, true)
      console.log('📊 [UniversalDataViz] 图表数据已更新，数据点:', chartDataPoints.value.length)
    }
  } catch (error) {
    console.error('📊 [UniversalDataViz] 图表更新失败:', error)
    message.error('图表更新失败: ' + error.message)
  }
}

/**
 * 应用路径映射
 */
const applyPathMapping = () => {
  pathMappingApplied.value = true
  message.success(`路径映射已应用: X=${arrayXPath.value}, Y=${arrayYPath.value}`)
  
  nextTick(() => {
    if (displayMode.value === 'chart' && canShowChart.value) {
      updateChart()
    }
  })
}

/**
 * 更新图表数据（路径变化时调用）
 */
const updateChartData = () => {
  if (pathMappingApplied.value) {
    nextTick(() => {
      updateChart()
    })
  }
}

/**
 * 自动选择显示模式
 */
const autoSelectDisplayMode = () => {
  if (props.autoDetectMode) {
    if (canShowChart.value) {
      displayMode.value = 'chart'
    } else if (canShowObject.value) {
      displayMode.value = 'object'
    } else if (canShowTable.value) {
      displayMode.value = 'table'
    }
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
      message.success(`数据刷新完成，${processingMode.value}模式，${
        isArrayData.value ? `${receivedData.value.length}个数据项` : 
        `${objectFields.value.length}个字段`
      }`)
      
      if (displayMode.value === 'chart') {
        updateChart()
      }
    } else {
      message.info('请在右侧数据源面板配置数据源（支持对象和数组）')
    }
  }, 1000)
}

// 🎯 监听数据和配置变化
watch(() => [props.data, props.metadata], (newValues, oldValues) => {
  // 安全解构，防止undefined错误
  const [newData, newMetadata] = newValues || []
  const [oldData, oldMetadata] = oldValues || []
  
  console.log('🔍 [UniversalDataViz] 数据和配置变化:', { 
    newData, 
    oldData, 
    newMetadata,
    dataType: dataType.value,
    isArray: isArrayData.value,
    isObject: isObjectData.value
  })
  
  const dataChanged = JSON.stringify(newData) !== JSON.stringify(oldData)
  const metadataChanged = JSON.stringify(newMetadata) !== JSON.stringify(oldMetadata)
  
  if (dataChanged || metadataChanged) {
    lastUpdateTime.value = new Date().toLocaleString()
    updateCount.value++
    
    if (updateCount.value > 1) {
      message.success(`数据已更新 - ${dataTypeInfo.value.label}`)
    }
    
    // 🎯 优先使用DataSourceConfigForm传递的配置
    if (newMetadata?.dataConfig?.arrayConfig && isArrayData.value) {
      const config = newMetadata.dataConfig.arrayConfig
      arrayXPath.value = config.xField || 'timestamp'
      arrayYPath.value = config.yField || 'temperature'
      pathMappingApplied.value = true
      
      console.log('🎯 [UniversalDataViz] 使用DataSourceConfigForm的数组配置:', {
        xField: arrayXPath.value,
        yField: arrayYPath.value,
        config
      })
    } else if (isArrayData.value && newData && newData.length > 0) {
      // 降级到智能推断
      if (!pathMappingApplied.value) {
        inferPathsFromFirstElement(newData)
      }
    }
    
    // 自动选择显示模式
    autoSelectDisplayMode()
    
    // 延迟更新图表
    setTimeout(() => {
      if (displayMode.value === 'chart' && canShowChart.value) {
        initChart()
      }
    }, 100)
  }
}, { deep: true, immediate: true })

// 监听显示模式变化
watch(() => displayMode.value, (newMode) => {
  console.log('🔄 [UniversalDataViz] 显示模式切换:', newMode)
  
  if (newMode === 'chart' && canShowChart.value) {
    setTimeout(() => {
      initChart()
    }, 100)
  }
})

// 🎯 监听数组路径配置变化，重新渲染图表
watch([() => arrayXPath.value, () => arrayYPath.value], ([newXPath, newYPath], [oldXPath, oldYPath]) => {
  console.log('🔄 [UniversalDataViz] 数组路径配置变化:', {
    xPath: { old: oldXPath, new: newXPath },
    yPath: { old: oldYPath, new: newYPath }
  })
  
  // 路径变化时重新渲染图表
  if ((newXPath !== oldXPath || newYPath !== oldYPath) && isArrayData.value && receivedData.value) {
    console.log('🎯 [UniversalDataViz] 路径变化，重新渲染图表')
    setTimeout(() => {
      if (displayMode.value === 'chart' && canShowChart.value) {
        initChart()
      }
    }, 100)
  }
}, { deep: false })

// 监听图表数据点变化
watch(() => chartDataPoints.value, (newPoints) => {
  console.log('📈 [UniversalDataViz] 图表数据点变化:', newPoints.length)
  
  if (displayMode.value === 'chart' && canShowChart.value && newPoints.length > 0) {
    setTimeout(() => {
      updateChart()
    }, 100)
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  console.log('🚀 [UniversalDataViz] 通用数据可视化组件已挂载')
  console.log('🚀 [UniversalDataViz] 当前数据:', props.data)
  console.log('🚀 [UniversalDataViz] 默认数据:', defaultDemoData)
  console.log('🚀 [UniversalDataViz] 数据类型:', dataType.value)
  console.log('🚀 [UniversalDataViz] 处理模式:', processingMode.value)
  
  // 对初始数据进行路径推断
  if (isArrayData.value && receivedData.value && receivedData.value.length > 0) {
    inferPathsFromFirstElement(receivedData.value)
  }
  
  // 自动选择显示模式（优先显示图表）
  autoSelectDisplayMode()
  
  // 延迟初始化图表，确保DOM完全渲染
  setTimeout(() => {
    if (displayMode.value === 'chart' && canShowChart.value) {
      initChart()
    }
  }, 300)
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
.universal-data-viz-card {
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

.mode-selector {
  flex-shrink: 0;
  padding: 8px;
  background: var(--body-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.chart-mode,
.object-mode,
.table-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-stats {
  flex-shrink: 0;
}

.path-config-panel {
  flex-shrink: 0;
  margin-bottom: 12px;
}

.path-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.path-input label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
}

.chart-container {
  flex: 1;
  min-height: 350px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: #fafafa;
  overflow: hidden;
}

.object-stats {
  flex-shrink: 0;
}

.object-cards {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.field-card {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--body-color);
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.field-name {
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
}

.field-value {
  margin-bottom: 4px;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
  word-break: break-all;
}

.field-path {
  font-size: 10px;
  color: var(--text-color-3);
  font-family: monospace;
}

.table-mode {
  max-height: 400px;
  overflow: hidden;
}

.debug-section {
  flex-shrink: 0;
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
  max-width: 300px;
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