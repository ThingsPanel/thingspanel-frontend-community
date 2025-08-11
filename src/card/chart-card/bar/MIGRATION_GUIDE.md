# Bar Chart 组件迁移指南

## 📋 组件概述

**bar** 是一个基于 ECharts 的柱状图组件，用于显示设备的遥测数据。支持时间范围选择、数据聚合、多设备数据对比等高级功能，是数据可视化的核心组件之一。

## 🔍 技术架构分析

### 当前实现结构
```
bar/
├── index.ts                  # 组件定义
├── component.vue             # 组件入口（33 行）
├── card-config.vue           # 配置界面
├── modules/
│   └── bar-chart.vue         # 核心图表逻辑（674 行）
├── theme.ts                  # 主题配置
└── poster.png                # 组件预览图
```

### 核心功能特性
1. **ECharts 集成**: 基于 Vue-ECharts 的专业图表渲染
2. **时间范围控制**: 支持15+种预设时间范围和自定义时间选择
3. **数据聚合**: 支持多种聚合窗口和聚合函数（平均值、最大值、求和、差值）
4. **多设备支持**: 最多支持9个设备数据源同时显示
5. **实时更新**: 支持 WebSocket 实时数据推送和图表更新
6. **主题适配**: 支持明暗主题切换和颜色自定义
7. **交互功能**: 缩放、拖拽、图例控制等丰富交互

### 数据流程
```
设备数据源配置 → API 获取历史数据 → 数据聚合处理 → ECharts 渲染 → WebSocket 实时更新
```

## ❗ 现有问题识别

### 1. 🎨 **图表类型固化问题**
```javascript
// 硬编码为柱状图类型
const sampleObj = {
  name: metricName,
  type: 'bar',        // 固定为bar类型
  stack: 'Total',     // 固定堆叠模式
  smooth: true,       // 对bar图无效的属性
  showSymbol: false   // bar图不需要的属性
}
```
**影响**: 与curve组件代码95%重复，只有type不同，造成严重代码冗余。

### 2. ⚡ **性能优化问题**
```javascript
// 每次更新都重新渲染整个图表
<VChart :key="uuid4()" ref="chartRef" class="chart flex-1" :option="option" autoresize />
```
**影响**: 强制重新创建图表实例，性能较差。

### 3. 🔧 **代码复用率低**
```javascript
// 与curve组件几乎完全相同的逻辑
const getTelemetryData = async (device_id, key, index, metricName) => {
  // 674行代码中约640行与curve组件完全重复
  const sampleObj = {
    // 仅此处有差异
    type: 'bar' // vs curve的'line'
  }
}
```
**影响**: 维护成本高，bug修复需要在两个地方同步。

### 4. 🌐 **国际化处理问题**
```javascript
// 部分文本硬编码，部分使用国际化
{ label: '1月', value: '1mo', disabled: false } // 硬编码中文
// vs
{ label: $t('common.average'), value: 'avg' }    // 使用国际化
```

### 5. 📱 **响应式设计不完善**
```css
/* 布局依赖绝对定位 */
.button-container {
  position: absolute;
  right: 0;
  z-index: 99;
}
```
**影响**: 在小屏幕设备上可能出现布局问题。

### 6. 🔒 **数据处理边界问题**
```javascript
// 缺少数据验证和错误处理
const seriesData = data ? data.map(item => [item.x, item.y]) : sampleData
// 如果item.x或item.y为null/undefined，会导致图表异常
```

## 🎯 Card 2.1 迁移策略

### 组件合并重新设计

#### 1. 统一图表组件定义
```typescript
// src/card2.1/components/chart-display/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const ChartDisplayDefinition: ComponentDefinition = {
  type: 'chart-display',
  name: '图表展示',
  category: '数据可视化',
  description: '多功能图表组件，支持柱状图、折线图、面积图等多种图表类型',
  
  // 数据需求声明
  dataRequirements: {
    timeSeriesData: {
      type: 'array',
      description: '时间序列数据',
      required: true,
      structure: {
        timestamp: { type: 'number', description: '时间戳' },
        value: { type: 'number', description: '数值' },
        deviceId: { type: 'string', description: '设备ID' },
        metricsId: { type: 'string', description: '指标ID' }
      }
    },
    
    metricsInfo: {
      type: 'array',
      description: '指标信息列表',
      structure: {
        deviceId: { type: 'string', description: '设备ID' },
        metricsId: { type: 'string', description: '指标ID' },
        metricsName: { type: 'string', description: '指标名称' },
        metricsType: { type: 'string', description: '指标类型' },
        unit: { type: 'string', description: '数值单位' },
        aggregate_function: { type: 'string', description: '聚合函数' }
      }
    },
    
    timeRange: {
      type: 'object',
      description: '时间范围信息',
      structure: {
        startTime: { type: 'number', description: '开始时间' },
        endTime: { type: 'number', description: '结束时间' },
        timeRangeType: { type: 'string', description: '时间范围类型' },
        aggregateWindow: { type: 'string', description: '聚合窗口' }
      }
    }
  },
  
  // 配置结构
  config: {
    // 图表类型配置
    chartConfig: {
      type: 'object',
      label: '图表配置',
      structure: {
        chartType: {
          type: 'select',
          label: '图表类型',
          options: [
            { label: '柱状图', value: 'bar' },
            { label: '折线图', value: 'line' },
            { label: '面积图', value: 'area' },
            { label: '堆叠柱状图', value: 'stacked-bar' },
            { label: '堆叠面积图', value: 'stacked-area' },
            { label: '平滑曲线', value: 'smooth-line' }
          ],
          default: 'line',
          description: '选择图表的展示类型'
        },
        
        showDataZoom: {
          type: 'boolean',
          label: '显示缩放控件',
          default: true,
          description: '是否显示图表缩放和拖拽控件'
        },
        
        showLegend: {
          type: 'boolean',
          label: '显示图例',
          default: true,
          description: '是否显示图表图例'
        },
        
        legendPosition: {
          type: 'select',
          label: '图例位置',
          options: [
            { label: '顶部', value: 'top' },
            { label: '底部', value: 'bottom' },
            { label: '左侧', value: 'left' },
            { label: '右侧', value: 'right' }
          ],
          default: 'top',
          condition: { field: 'chartConfig.showLegend', value: true }
        },
        
        smooth: {
          type: 'boolean',
          label: '平滑曲线',
          default: false,
          condition: { field: 'chartConfig.chartType', operator: 'in', value: ['line', 'area'] },
          description: '线性图表是否使用平滑曲线'
        },
        
        stack: {
          type: 'boolean',
          label: '堆叠显示',
          default: false,
          condition: { field: 'chartConfig.chartType', operator: 'in', value: ['bar', 'area'] },
          description: '多系列数据是否堆叠显示'
        }
      }
    },
    
    // 时间轴配置
    timeAxisConfig: {
      type: 'object',
      label: '时间轴配置',
      structure: {
        enableTimeRange: {
          type: 'boolean',
          label: '启用时间范围选择',
          default: true,
          description: '是否显示时间范围选择器'
        },
        
        defaultTimeRange: {
          type: 'select',
          label: '默认时间范围',
          options: [
            { label: '最近15分钟', value: 'last_15m' },
            { label: '最近30分钟', value: 'last_30m' },
            { label: '最近1小时', value: 'last_1h' },
            { label: '最近3小时', value: 'last_3h' },
            { label: '最近6小时', value: 'last_6h' },
            { label: '最近12小时', value: 'last_12h' },
            { label: '最近24小时', value: 'last_24h' },
            { label: '最近3天', value: 'last_3d' },
            { label: '最近7天', value: 'last_7d' },
            { label: '最近30天', value: 'last_30d' },
            { label: '自定义', value: 'custom' }
          ],
          default: 'last_1h',
          condition: { field: 'timeAxisConfig.enableTimeRange', value: true }
        },
        
        timeFormat: {
          type: 'select',
          label: '时间显示格式',
          options: [
            { label: 'MM-dd HH:mm', value: 'MM-dd HH:mm' },
            { label: 'HH:mm:ss', value: 'HH:mm:ss' },
            { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
            { label: 'yyyy-MM-dd HH:mm', value: 'yyyy-MM-dd HH:mm' }
          ],
          default: 'MM-dd HH:mm'
        }
      }
    },
    
    // 数据聚合配置
    aggregateConfig: {
      type: 'object',
      label: '数据聚合',
      structure: {
        enableAggregate: {
          type: 'boolean',
          label: '启用数据聚合',
          default: true,
          description: '大时间范围时启用数据聚合以提升性能'
        },
        
        defaultAggregate: {
          type: 'select',
          label: '默认聚合窗口',
          options: [
            { label: '不聚合', value: 'no_aggregate' },
            { label: '30秒', value: '30s' },
            { label: '1分钟', value: '1m' },
            { label: '5分钟', value: '5m' },
            { label: '10分钟', value: '10m' },
            { label: '30分钟', value: '30m' },
            { label: '1小时', value: '1h' },
            { label: '3小时', value: '3h' },
            { label: '6小时', value: '6h' },
            { label: '1天', value: '1d' },
            { label: '1周', value: '7d' }
          ],
          default: 'no_aggregate',
          condition: { field: 'aggregateConfig.enableAggregate', value: true }
        },
        
        aggregateFunction: {
          type: 'select',
          label: '聚合函数',
          options: [
            { label: '平均值', value: 'avg' },
            { label: '最大值', value: 'max' },
            { label: '最小值', value: 'min' },
            { label: '求和', value: 'sum' },
            { label: '计数', value: 'count' },
            { label: '差值', value: 'diff' }
          ],
          default: 'avg',
          condition: { 
            field: 'aggregateConfig.defaultAggregate', 
            operator: '!=', 
            value: 'no_aggregate' 
          }
        },
        
        autoAggregateThreshold: {
          type: 'number',
          label: '自动聚合阈值',
          default: 1000,
          min: 100,
          max: 10000,
          description: '数据点超过此阈值时自动启用聚合',
          condition: { field: 'aggregateConfig.enableAggregate', value: true }
        }
      }
    },
    
    // 样式配置
    styleConfig: {
      type: 'object',
      label: '样式配置',
      structure: {
        colorTheme: {
          type: 'select',
          label: '颜色主题',
          options: [
            { label: '默认主题', value: 'default' },
            { label: '蓝色系', value: 'blue' },
            { label: '绿色系', value: 'green' },
            { label: '暖色系', value: 'warm' },
            { label: '冷色系', value: 'cool' },
            { label: '自定义', value: 'custom' }
          ],
          default: 'default'
        },
        
        customColors: {
          type: 'array',
          label: '自定义颜色',
          itemType: 'color',
          default: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'],
          condition: { field: 'styleConfig.colorTheme', value: 'custom' },
          description: '自定义图表颜色序列'
        },
        
        gridConfig: {
          type: 'object',
          label: '网格配置',
          structure: {
            top: { type: 'string', label: '上边距', default: '60px' },
            right: { type: 'string', label: '右边距', default: '20px' },
            bottom: { type: 'string', label: '下边距', default: '60px' },
            left: { type: 'string', label: '左边距', default: '60px' }
          }
        }
      }
    },
    
    // 交互配置
    interactionConfig: {
      type: 'object',
      label: '交互配置',
      structure: {
        enableBrush: {
          type: 'boolean',
          label: '启用框选',
          default: false,
          description: '启用图表框选功能'
        },
        
        enableTooltip: {
          type: 'boolean',
          label: '显示提示框',
          default: true,
          description: '鼠标悬停时显示数据提示'
        },
        
        tooltipTrigger: {
          type: 'select',
          label: '提示触发方式',
          options: [
            { label: '数据项', value: 'item' },
            { label: '坐标轴', value: 'axis' },
            { label: '无', value: 'none' }
          ],
          default: 'axis',
          condition: { field: 'interactionConfig.enableTooltip', value: true }
        },
        
        enableAnimation: {
          type: 'boolean',
          label: '启用动画',
          default: true,
          description: '图表更新时的动画效果'
        },
        
        animationDuration: {
          type: 'number',
          label: '动画时长(ms)',
          default: 1000,
          min: 0,
          max: 5000,
          condition: { field: 'interactionConfig.enableAnimation', value: true }
        }
      }
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 500, height: 300 },
    gridstack: { w: 6, h: 5, minW: 4, minH: 3 }
  }
}
```

#### 2. 统一图表组件实现
```vue
<!-- src/card2.1/components/chart-display/ChartDisplay.vue -->
<script setup lang="ts">
/**
 * 统一图表展示组件
 * 合并原bar和curve组件功能，支持多种图表类型
 */
import { computed, ref, onMounted, onBeforeUnmount, watch, reactive, nextTick } from 'vue'
import { 
  NCard, NIcon, NPopselect, NDatePicker, NButton, NSpace,
  useMessage, type SelectOption 
} from 'naive-ui'
import {
  TimeOutline, OptionsOutline, RefreshOutline, 
  BarChartOutline, StatsChartOutline
} from '@vicons/ionicons5'
import { debounce } from 'lodash-es'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent, 
  GridComponent, DataZoomComponent, ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { EChartsOption, SeriesOption } from 'echarts'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import type { ChartDisplayAPI } from './api/chart-display-api'

// ECharts 组件注册
use([
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  DataZoomComponent, ToolboxComponent, LineChart, BarChart, CanvasRenderer
])

interface ChartDisplayConfig {
  chartConfig?: {
    chartType?: 'bar' | 'line' | 'area' | 'stacked-bar' | 'stacked-area' | 'smooth-line'
    showDataZoom?: boolean
    showLegend?: boolean
    legendPosition?: 'top' | 'bottom' | 'left' | 'right'
    smooth?: boolean
    stack?: boolean
  }
  timeAxisConfig?: {
    enableTimeRange?: boolean
    defaultTimeRange?: string
    timeFormat?: string
  }
  aggregateConfig?: {
    enableAggregate?: boolean
    defaultAggregate?: string
    aggregateFunction?: string
    autoAggregateThreshold?: number
  }
  styleConfig?: {
    colorTheme?: string
    customColors?: string[]
    gridConfig?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
  }
  interactionConfig?: {
    enableBrush?: boolean
    enableTooltip?: boolean
    tooltipTrigger?: 'item' | 'axis' | 'none'
    enableAnimation?: boolean
    animationDuration?: number
  }
}

interface Props {
  config: ChartDisplayConfig
  data?: {
    timeSeriesData?: Array<{
      timestamp: number
      value: number
      deviceId: string
      metricsId: string
    }>
    metricsInfo?: Array<{
      deviceId: string
      metricsId: string
      metricsName: string
      metricsType: string
      unit?: string
      aggregate_function?: string
    }>
    timeRange?: {
      startTime: number
      endTime: number
      timeRangeType: string
      aggregateWindow: string
    }
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()
const themeStore = useThemeStore()
const message = useMessage()

// API 集成
const api = new ChartDisplayAPI()

// 组件状态
const chartRef = ref()
const containerRef = ref<HTMLElement>()
const isTimeSelectMode = ref(false)
const currentTimeRange = ref<[number, number] | null>(null)

// 配置计算属性
const chartConfig = computed(() => ({
  chartType: 'line' as const,
  showDataZoom: true,
  showLegend: true,
  legendPosition: 'top' as const,
  smooth: false,
  stack: false,
  ...props.config.chartConfig
}))

const styleConfig = computed(() => ({
  colorTheme: 'default',
  customColors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'],
  gridConfig: {
    top: '60px',
    right: '20px', 
    bottom: '60px',
    left: '60px'
  },
  ...props.config.styleConfig
}))

const interactionConfig = computed(() => ({
  enableBrush: false,
  enableTooltip: true,
  tooltipTrigger: 'axis' as const,
  enableAnimation: true,
  animationDuration: 1000,
  ...props.config.interactionConfig
}))

// 颜色主题
const getColorPalette = (): string[] => {
  const themeColors = {
    default: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'],
    blue: ['#1890ff', '#36cfc9', '#40a9ff', '#096dd9', '#0050b3', '#003a8c'],
    green: ['#52c41a', '#73d13d', '#95de64', '#b7eb8f', '#d9f7be', '#f6ffed'],
    warm: ['#ff4d4f', '#ff7875', '#ffa39e', '#ffccc7', '#fff1f0', '#fff2e8'],
    cool: ['#13c2c2', '#36cfc9', '#5cdbd3', '#87e8de', '#b5f5ec', '#e6fffb'],
    custom: styleConfig.value.customColors
  }
  
  return themeColors[styleConfig.value.colorTheme] || themeColors.default
}

// ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  const colors = getColorPalette()
  const isDarkMode = themeStore.darkMode
  
  return {
    color: colors,
    backgroundColor: 'transparent',
    
    // 提示框配置
    tooltip: {
      show: interactionConfig.value.enableTooltip,
      trigger: interactionConfig.value.tooltipTrigger,
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderColor: isDarkMode ? '#555' : '#ddd',
      textStyle: {
        color: isDarkMode ? '#fff' : '#333'
      },
      formatter: (params: any) => {
        if (Array.isArray(params)) {
          let result = `<div style="margin-bottom:4px">${new Date(params[0].axisValue).toLocaleString()}</div>`
          params.forEach((param: any) => {
            const unit = getMetricsUnit(param.seriesName)
            result += `<div style="margin:2px 0">
              <span style="display:inline-block;margin-right:5px;width:10px;height:10px;background-color:${param.color};border-radius:50%"></span>
              ${param.seriesName}: ${param.value[1]}${unit}
            </div>`
          })
          return result
        } else {
          const unit = getMetricsUnit(params.seriesName)
          return `${new Date(params.axisValue).toLocaleString()}<br/>
                  ${params.seriesName}: ${params.value[1]}${unit}`
        }
      }
    },
    
    // 图例配置
    legend: {
      show: chartConfig.value.showLegend,
      [chartConfig.value.legendPosition]: 10,
      textStyle: {
        color: isDarkMode ? '#fff' : '#333'
      }
    },
    
    // 网格配置
    grid: {
      ...styleConfig.value.gridConfig,
      containLabel: true
    },
    
    // X轴配置
    xAxis: {
      type: 'time',
      boundaryGap: chartConfig.value.chartType === 'bar',
      axisLine: {
        lineStyle: {
          color: isDarkMode ? '#555' : '#ddd'
        }
      },
      axisLabel: {
        color: isDarkMode ? '#ccc' : '#666',
        formatter: (value: number) => {
          return new Date(value).toLocaleString(undefined, {
            month: '2-digit',
            day: '2-digit', 
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: isDarkMode ? '#333' : '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    
    // Y轴配置
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: isDarkMode ? '#555' : '#ddd'
        }
      },
      axisLabel: {
        color: isDarkMode ? '#ccc' : '#666'
      },
      splitLine: {
        lineStyle: {
          color: isDarkMode ? '#333' : '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    
    // 数据缩放配置
    dataZoom: chartConfig.value.showDataZoom ? [
      {
        type: 'slider',
        show: true,
        start: 0,
        end: 100,
        bottom: 10,
        height: 20,
        textStyle: {
          color: isDarkMode ? '#ccc' : '#666'
        },
        borderColor: isDarkMode ? '#555' : '#ddd',
        fillerColor: isDarkMode ? '#444' : '#f0f0f0'
      },
      {
        type: 'inside',
        start: 0,
        end: 100
      }
    ] : [],
    
    // 系列配置
    series: generateSeriesConfig(),
    
    // 动画配置
    animation: interactionConfig.value.enableAnimation,
    animationDuration: interactionConfig.value.animationDuration,
    animationEasing: 'cubicOut'
  }
})

// 生成系列配置
const generateSeriesConfig = (): SeriesOption[] => {
  if (!props.data?.metricsInfo) return []
  
  return props.data.metricsInfo.map((metric, index) => {
    const seriesData = getSeriesData(metric.deviceId, metric.metricsId)
    const colors = getColorPalette()
    
    const baseConfig = {
      name: metric.metricsName,
      data: seriesData,
      itemStyle: {
        color: colors[index % colors.length]
      },
      emphasis: {
        focus: 'series'
      }
    }
    
    // 根据图表类型设置不同的系列配置
    switch (chartConfig.value.chartType) {
      case 'bar':
      case 'stacked-bar':
        return {
          ...baseConfig,
          type: 'bar',
          stack: chartConfig.value.stack || chartConfig.value.chartType === 'stacked-bar' ? 'Total' : undefined,
          barMaxWidth: 40
        }
        
      case 'line':
      case 'smooth-line':
        return {
          ...baseConfig,
          type: 'line',
          smooth: chartConfig.value.smooth || chartConfig.value.chartType === 'smooth-line',
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            width: 2
          }
        }
        
      case 'area':
      case 'stacked-area':
        return {
          ...baseConfig,
          type: 'line',
          smooth: chartConfig.value.smooth,
          stack: chartConfig.value.stack || chartConfig.value.chartType === 'stacked-area' ? 'Total' : undefined,
          areaStyle: {
            opacity: 0.6
          },
          symbol: 'none',
          lineStyle: {
            width: 1
          }
        }
        
      default:
        return {
          ...baseConfig,
          type: 'line'
        }
    }
  })
}

// 获取系列数据
const getSeriesData = (deviceId: string, metricsId: string): Array<[number, number]> => {
  if (!props.data?.timeSeriesData) return []
  
  return props.data.timeSeriesData
    .filter(item => item.deviceId === deviceId && item.metricsId === metricsId)
    .map(item => [item.timestamp, item.value])
    .sort((a, b) => a[0] - b[0])
}

// 获取指标单位
const getMetricsUnit = (metricsName: string): string => {
  const metric = props.data?.metricsInfo?.find(m => m.metricsName === metricsName)
  return metric?.unit ? ` ${metric.unit}` : ''
}

// 时间范围选项
const timeRangeOptions: SelectOption[] = [
  { label: t('common.last_15m'), value: 'last_15m' },
  { label: t('common.last_30m'), value: 'last_30m' },
  { label: t('common.lastHours1'), value: 'last_1h' },
  { label: t('common.lastHours3'), value: 'last_3h' },
  { label: t('common.lastHours6'), value: 'last_6h' },
  { label: t('common.lastHours12'), value: 'last_12h' },
  { label: t('common.lastHours24'), value: 'last_24h' },
  { label: t('common.lastDays3'), value: 'last_3d' },
  { label: t('common.lastDays7'), value: 'last_7d' },
  { label: t('common.lastDays30'), value: 'last_30d' },
  { label: t('common.custom'), value: 'custom' }
]

// 聚合选项
const aggregateOptions: SelectOption[] = [
  { label: t('common.notAggre'), value: 'no_aggregate' },
  { label: t('common.seconds30'), value: '30s' },
  { label: t('common.minute1'), value: '1m' },
  { label: t('common.minutes5'), value: '5m' },
  { label: t('common.minutes10'), value: '10m' },
  { label: t('common.minutes30'), value: '30m' },
  { label: t('common.hours1'), value: '1h' },
  { label: t('common.hours3'), value: '3h' },
  { label: t('common.days1'), value: '1d' }
]

const aggregateFunctionOptions: SelectOption[] = [
  { label: t('common.average'), value: 'avg' },
  { label: t('generate.max-value'), value: 'max' },
  { label: t('generate.min-value'), value: 'min' },
  { label: t('common.sum'), value: 'sum' }
]

// 当前选择状态
const selectedTimeRange = ref('last_1h')
const selectedAggregate = ref('no_aggregate') 
const selectedAggregateFunction = ref('avg')

// 事件处理
const handleTimeRangeChange = (value: string) => {
  selectedTimeRange.value = value
  if (value === 'custom') {
    isTimeSelectMode.value = true
  } else {
    isTimeSelectMode.value = false
    // 触发数据更新
    emitDataRequest()
  }
}

const handleCustomTimeRange = (range: [number, number] | null) => {
  currentTimeRange.value = range
  if (range) {
    emitDataRequest()
  }
}

const handleAggregateChange = (value: string) => {
  selectedAggregate.value = value
  emitDataRequest()
}

const handleAggregateFunctionChange = (value: string) => {
  selectedAggregateFunction.value = value
  emitDataRequest()
}

const handleRefresh = () => {
  emitDataRequest()
  message.success(t('common.refreshSuccess'))
}

// 发送数据请求事件
const emitDataRequest = () => {
  // 这里应该发送事件到父组件或数据管理系统
  console.log('Request data update:', {
    timeRange: selectedTimeRange.value,
    customTimeRange: currentTimeRange.value,
    aggregate: selectedAggregate.value,
    aggregateFunction: selectedAggregateFunction.value
  })
}

// 暴露组件接口
defineExpose({
  getChartInstance: () => chartRef.value?.getEchartsInstance(),
  refresh: handleRefresh,
  exportImage: () => {
    const instance = chartRef.value?.getEchartsInstance()
    if (instance) {
      return instance.getDataURL({
        type: 'png',
        backgroundColor: '#fff'
      })
    }
  },
  getCurrentConfig: () => ({
    timeRange: selectedTimeRange.value,
    aggregate: selectedAggregate.value,
    aggregateFunction: selectedAggregateFunction.value
  })
})
</script>

<template>
  <div ref="containerRef" class="chart-display">
    <NCard :bordered="false" class="chart-card">
      <!-- 工具栏 -->
      <div class="chart-toolbar">
        <NSpace align="center" justify="end" :wrap="false">
          <!-- 时间范围选择 -->
          <NPopselect
            v-model:value="selectedTimeRange"
            :options="timeRangeOptions"
            trigger="hover"
            scrollable
            @update:value="handleTimeRangeChange"
          >
            <NButton text>
              <template #icon>
                <NIcon><TimeOutline /></NIcon>
              </template>
            </NButton>
          </NPopselect>
          
          <!-- 自定义时间选择 -->
          <NDatePicker
            v-if="isTimeSelectMode"
            v-model:value="currentTimeRange"
            type="datetimerange"
            style="width: 300px"
            @update:value="handleCustomTimeRange"
          />
          
          <!-- 聚合配置 -->
          <NPopselect
            v-model:value="selectedAggregate"
            :options="aggregateOptions"
            trigger="hover"
            scrollable
            @update:value="handleAggregateChange"
          >
            <NButton text>
              <template #icon>
                <NIcon><StatsChartOutline /></NIcon>
              </template>
            </NButton>
          </NPopselect>
          
          <!-- 聚合函数 -->
          <NPopselect
            v-if="selectedAggregate !== 'no_aggregate'"
            v-model:value="selectedAggregateFunction"
            :options="aggregateFunctionOptions"
            trigger="hover"
            scrollable
            @update:value="handleAggregateFunctionChange"
          >
            <NButton text>
              <template #icon>
                <NIcon><OptionsOutline /></NIcon>
              </template>
            </NButton>
          </NPopselect>
          
          <!-- 刷新按钮 -->
          <NButton text @click="handleRefresh">
            <template #icon>
              <NIcon><RefreshOutline /></NIcon>
            </template>
          </NButton>
        </NSpace>
      </div>
      
      <!-- 图表容器 -->
      <div class="chart-container">
        <VChart
          ref="chartRef"
          :option="chartOption"
          :loading="loading"
          autoresize
          class="chart"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.chart-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--card-color);
  border-radius: var(--border-radius);
}

.chart-toolbar {
  padding: 8px 16px;
  border-bottom: 1px solid var(--divider-color);
  background-color: var(--body-color);
}

.chart-container {
  flex: 1;
  padding: 16px;
  min-height: 200px;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-toolbar {
    padding: 4px 8px;
  }
  
  .chart-container {
    padding: 8px;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .chart-card {
  background-color: var(--card-color-dark);
}

[data-theme="dark"] .chart-toolbar {
  background-color: var(--body-color-dark);
  border-bottom-color: var(--divider-color-dark);
}
</style>
```

## 💻 具体实现步骤

### Phase 1: 组件合并（第1周）

1. **创建统一组件结构**
```bash
src/card2.1/components/chart-display/
├── index.ts                          # 组件定义
├── ChartDisplay.vue                  # 统一图表组件
├── ConfigPanel.vue                   # 配置面板
├── types.ts                          # 类型定义
├── api/
│   └── chart-display-api.ts          # API 服务层
├── hooks/
│   ├── useChartData.ts               # 数据管理 hook
│   ├── useTimeRange.ts               # 时间范围 hook
│   └── useChartTheme.ts              # 主题管理 hook
└── utils/
    ├── chart-type-converter.ts       # 图表类型转换
    ├── data-aggregator.ts            # 数据聚合工具
    └── color-theme-manager.ts        # 颜色主题管理
```

2. **核心功能迁移**
- 合并bar和curve的核心逻辑
- 实现图表类型动态切换
- 保持原有的时间范围和聚合功能

### Phase 2: 功能增强（第2周）

1. **新增图表类型**
- 面积图 (area chart)
- 堆叠图 (stacked chart)
- 平滑曲线 (smooth line)

2. **配置系统完善**
- 可视化配置界面
- 预设主题和自定义颜色
- 布局和交互选项

### Phase 3: 性能优化（第3周）

1. **渲染性能优化**
- 移除强制重新渲染的uuid4()
- 实现增量更新机制
- 大数据集的虚拟化处理

2. **数据处理优化**
- 智能数据聚合策略
- 实时数据更新防抖
- 内存使用优化

### Phase 4: 测试和完善（第4周）

1. **功能测试**
- 各种图表类型切换测试
- 时间范围和聚合功能测试
- 多设备数据展示测试

2. **性能和兼容性**
- 大数据量性能测试
- 移动端响应式测试
- 跨浏览器兼容性验证

## ✅ 测试验证方案

### 功能测试
- [ ] 柱状图、折线图、面积图等类型正常切换
- [ ] 时间范围选择和自定义时间功能
- [ ] 数据聚合和聚合函数配置
- [ ] 多设备数据同时显示
- [ ] 实时数据更新和WebSocket推送

### 性能测试
- [ ] 大数据量(10000+点)渲染性能
- [ ] 图表类型切换的响应速度
- [ ] 内存使用情况监控
- [ ] 移动设备性能表现

### 兼容性测试
- [ ] Chrome、Firefox、Safari、Edge浏览器
- [ ] 不同屏幕尺寸的响应式显示
- [ ] 明暗主题切换的视觉一致性
- [ ] 触摸设备的交互体验

## 📈 迁移收益

### 代码优化
- **代码减少**: 674行x2 → 约800行，减少40%代码量
- **维护成本**: 双重维护 → 单一维护点，降低50%维护工作量
- **功能统一**: 分散功能 → 统一图表解决方案

### 功能增强
- **图表类型**: 2种基础类型 → 6种图表类型及组合
- **配置选项**: 基础配置 → 完整的可视化配置系统
- **主题支持**: 固定主题 → 多主题+自定义颜色系统

### 性能提升
- **渲染优化**: 强制重新渲染 → 智能增量更新
- **数据处理**: 简单聚合 → 智能聚合策略
- **内存管理**: 基础管理 → 优化的生命周期管理

### 用户体验
- **交互体验**: 基础交互 → 丰富的图表交互功能
- **响应式**: 固定布局 → 完全响应式设计
- **主题适配**: 主题不一致 → 完整的明暗主题支持

---

**总结**: Bar Chart组件通过与Curve组件合并重构为统一的Chart Display组件，将显著减少代码冗余，提升功能完整性和用户体验，同时为数据可视化提供更专业和灵活的解决方案。