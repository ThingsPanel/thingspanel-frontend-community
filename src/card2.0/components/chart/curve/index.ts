/**
 * Card 2.0 曲线图组件定义
 * 基于原有 chart-curve 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * Card 2.0 曲线图组件定义
 * 从 src/card/chart-card/curve 迁移而来
 */
export const curveChartDefinition: IComponentDefinition = {
  // 组件元数据
  meta: {
    id: 'card2-curve-chart',
    name: $t('card.curve'),
    version: '2.0.0',
    description: '曲线图组件，支持多设备数据展示和时间聚合',
    category: 'chart',
    tags: ['图表', '曲线图', '折线图', '数据可视化', '时间序列'],
    author: 'ThingsPanel Team',
    icon: 'chart-line',
    thumbnail: './poster.png',
    supportedRenderers: ['vue'],
    minSize: { width: 300, height: 200 },
    maxSize: { width: 1200, height: 800 },
    defaultSize: { width: 480, height: 320 },

    // 兼容性信息
    compatibility: {
      legacyId: 'chart-curve', // 原组件ID
      migrationVersion: '1.0.0',
      deprecatedProps: [],
      propMapping: {
        'card.config.colorGroups': 'theme.colorScheme',
        'card.config.selectedTheme': 'theme.colorScheme'
      }
    }
  },

  // 组件逻辑
  logic: {
    /**
     * 处理数据
     */
    async processData(rawData: any, config: any, context: any) {
      try {
        if (!rawData) return this.getDefaultData()

        if (config.dataSource?.type === 'device') {
          return await this.processDeviceData(rawData, config, context)
        } else if (config.dataSource?.type === 'api') {
          return await this.processApiData(rawData, config)
        } else if (config.dataSource?.type === 'static') {
          return this.processStaticData(rawData, config)
        }

        return this.getDefaultData()
      } catch (error) {
        console.error('数据处理失败:', error)
        return this.getDefaultData()
      }
    },

    /**
     * 处理设备数据
     */
    async processDeviceData(rawData: any, config: any, context: any) {
      try {
        const processedData = []

        if (Array.isArray(rawData)) {
          for (const item of rawData) {
            if (item.timestamp && item.value !== undefined) {
              processedData.push({
                timestamp: new Date(item.timestamp).getTime(),
                value: Number(item.value),
                name: item.name || item.key || 'Unknown'
              })
            }
          }
        }

        return processedData
      } catch (error) {
        console.error('设备数据处理失败:', error)
        return []
      }
    },

    /**
     * 处理API数据
     */
    async processApiData(rawData: any, config: any) {
      // API数据处理逻辑
      return Array.isArray(rawData) ? rawData : []
    },

    /**
     * 处理静态数据
     */
    processStaticData(rawData: any[], config: any) {
      if (!Array.isArray(rawData)) return []

      return rawData.map((item, index) => ({
        timestamp: item.timestamp || Date.now() - (rawData.length - index) * 60000,
        value: Number(item.value || 0),
        name: item.name || `数据${index + 1}`
      }))
    },

    /**
     * 获取系列样式
     */
    getSeriesStyle(index: number, config: any) {
      const colors = this.getColorScheme(config.theme?.colorScheme || 'colorGroups')
      const color = colors[index % colors.length]

      return {
        type: 'line',
        smooth: config.chart?.smooth !== false,
        symbol: config.chart?.showSymbol !== false ? 'circle' : 'none',
        symbolSize: config.chart?.symbolSize || 4,
        lineStyle: {
          width: config.chart?.lineWidth || 2,
          color: color.top
        },
        areaStyle: config.chart?.showArea
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: color.top },
                  { offset: 1, color: color.bottom }
                ]
              }
            }
          : undefined
      }
    },

    /**
     * 获取配色方案
     */
    getColorScheme(schemeName: string) {
      const colorGroups = [
        { top: '#409EFF', bottom: '#79bbff' },
        { top: '#67C23A', bottom: '#95d475' },
        { top: '#E6A23C', bottom: '#eebe77' },
        { top: '#F56C6C', bottom: '#f89898' },
        { top: '#909399', bottom: '#b1b3b8' }
      ]

      const colorGroups2 = [
        { top: '#1E40AF', bottom: '#3B82F6' },
        { top: '#059669', bottom: '#10B981' },
        { top: '#D97706', bottom: '#F59E0B' },
        { top: '#DC2626', bottom: '#EF4444' },
        { top: '#4B5563', bottom: '#6B7280' }
      ]

      return schemeName === 'colorGroups2' ? colorGroups2 : colorGroups
    },

    /**
     * 获取默认数据
     */
    getDefaultData() {
      const now = Date.now()
      return Array.from({ length: 10 }, (_, i) => ({
        timestamp: now - (10 - i) * 60000,
        value: Math.random() * 100,
        name: '示例数据'
      }))
    },

    /**
     * 数据聚合
     */
    aggregateData(data: any[], aggregation: any) {
      if (!aggregation.enabled || !Array.isArray(data)) return data

      const { method, field } = aggregation
      const grouped = new Map()

      // 按时间窗口分组
      data.forEach(item => {
        const key = Math.floor(item.timestamp / (aggregation.window || 60000))
        if (!grouped.has(key)) {
          grouped.set(key, [])
        }
        grouped.get(key).push(item)
      })

      // 聚合计算
      const result = []
      grouped.forEach((items, key) => {
        let value = 0
        switch (method) {
          case 'avg':
            value = items.reduce((sum, item) => sum + item.value, 0) / items.length
            break
          case 'max':
            value = Math.max(...items.map(item => item.value))
            break
          case 'min':
            value = Math.min(...items.map(item => item.value))
            break
          case 'sum':
            value = items.reduce((sum, item) => sum + item.value, 0)
            break
          case 'count':
            value = items.length
            break
          default:
            value = items[items.length - 1].value
        }

        result.push({
          timestamp: key * (aggregation.window || 60000),
          value,
          name: items[0].name
        })
      })

      return result.sort((a, b) => a.timestamp - b.timestamp)
    },

    /**
     * 数据排序
     */
    sortData(data: any[], sort: any) {
      if (!sort.enabled || !Array.isArray(data)) return data

      const { field, order } = sort
      return [...data].sort((a, b) => {
        const aVal = a[field]
        const bVal = b[field]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return order === 'desc' ? -comparison : comparison
      })
    },

    // 生命周期钩子
    async onMounted(context) {
      console.log('曲线图组件已挂载', context)
      // 初始化逻辑
      if (context.config?.autoRefresh?.enabled) {
        this.startAutoRefresh(context)
      }
    },

    async onUnmounted(context) {
      console.log('曲线图组件已卸载', context)
      this.stopAutoRefresh(context)
    },

    async onConfigChanged(newConfig, oldConfig, context) {
      console.log('曲线图配置已更改', { newConfig, oldConfig })

      // 如果自动刷新配置改变
      if (newConfig.autoRefresh?.enabled !== oldConfig.autoRefresh?.enabled) {
        if (newConfig.autoRefresh?.enabled) {
          this.startAutoRefresh(context)
        } else {
          this.stopAutoRefresh(context)
        }
      }
    },

    async onDataChanged(newData, oldData, context) {
      console.log('曲线图数据已更改', { newData, oldData })
      // 数据变化处理逻辑
    },

    async onError(error, context) {
      console.error('曲线图组件错误:', error)

      // 错误处理逻辑
      if (context.onError) {
        context.onError(error)
      }

      // 可以在这里实现错误恢复逻辑
      // 比如重试、降级处理等
    },

    // 自动刷新功能
    startAutoRefresh(context: any) {
      if (context._refreshTimer) {
        clearInterval(context._refreshTimer)
      }

      const interval = context.config?.autoRefresh?.interval || 30000
      context._refreshTimer = setInterval(() => {
        if (context.refresh) {
          context.refresh()
        }
      }, interval)
    },

    stopAutoRefresh(context: any) {
      if (context._refreshTimer) {
        clearInterval(context._refreshTimer)
        context._refreshTimer = null
      }
    }
  },

  // 组件视图
  views: {
    vue: defineAsyncComponent(() => import('./component.vue'))
  },

  // 组件配置
  config: {
    // 配置组件
    component: defineAsyncComponent(() => import('./config.vue')),

    // 配置模式
    schema: {
      type: 'object',
      properties: {
        // 图表基础设置
        chart: {
          type: 'object',
          title: '图表设置',
          properties: {
            showLegend: { type: 'boolean', title: '显示图例', default: true },
            showDataZoom: { type: 'boolean', title: '显示数据缩放', default: true },
            showTooltip: { type: 'boolean', title: '显示提示框', default: true },
            smooth: { type: 'boolean', title: '平滑曲线', default: true },
            showSymbol: { type: 'boolean', title: '显示数据点', default: true },
            symbolSize: { type: 'number', title: '数据点大小', default: 4, minimum: 2, maximum: 10 },
            lineWidth: { type: 'number', title: '线条宽度', default: 2, minimum: 1, maximum: 10 },
            showArea: { type: 'boolean', title: '显示面积', default: false }
          }
        },

        // 时间范围设置
        timeRange: {
          type: 'object',
          title: '时间范围',
          properties: {
            defaultRange: {
              type: 'string',
              title: '默认时间范围',
              enum: ['15m', '30m', '1h', '3h', '6h', '12h', '24h', '3d', '7d', '30d'],
              default: '1h'
            },
            allowCustomRange: { type: 'boolean', title: '允许自定义时间范围', default: true },
            showTimeSelector: { type: 'boolean', title: '显示时间选择器', default: true }
          }
        },

        // 数据聚合设置
        aggregation: {
          type: 'object',
          title: '数据聚合',
          properties: {
            enabled: { type: 'boolean', title: '启用聚合', default: false },
            defaultFunction: {
              type: 'string',
              title: '默认聚合函数',
              enum: ['avg', 'max', 'min', 'sum', 'count'],
              default: 'avg'
            },
            defaultWindow: {
              type: 'string',
              title: '默认聚合窗口',
              enum: ['no_aggregate', '30s', '1m', '2m', '5m', '10m', '30m', '1h', '3h', '6h', '1d', '7d', '1mo'],
              default: 'no_aggregate'
            },
            showAggregateSelector: { type: 'boolean', title: '显示聚合选择器', default: true }
          }
        },

        // 主题设置
        theme: {
          type: 'object',
          title: '主题设置',
          properties: {
            colorScheme: {
              type: 'string',
              title: '配色方案',
              enum: ['colorGroups', 'colorGroups2'],
              default: 'colorGroups'
            },
            customColors: {
              type: 'array',
              title: '自定义颜色',
              items: { type: 'string' },
              default: []
            },
            adaptiveTheme: { type: 'boolean', title: '自适应主题', default: true }
          }
        },

        // 坐标轴设置
        axis: {
          type: 'object',
          title: '坐标轴设置',
          properties: {
            showXAxis: { type: 'boolean', title: '显示X轴', default: true },
            showYAxis: { type: 'boolean', title: '显示Y轴', default: true },
            xAxisType: { type: 'string', title: 'X轴类型', enum: ['time', 'category'], default: 'time' },
            yAxisType: { type: 'string', title: 'Y轴类型', enum: ['value', 'log'], default: 'value' }
          }
        },

        // 网格设置
        grid: {
          type: 'object',
          title: '网格设置',
          properties: {
            left: { type: 'string', title: '左边距', default: '3%' },
            right: { type: 'string', title: '右边距', default: '4%' },
            bottom: { type: 'string', title: '下边距', default: '50px' },
            containLabel: { type: 'boolean', title: '包含标签', default: true }
          }
        },

        // 性能设置
        performance: {
          type: 'object',
          title: '性能设置',
          properties: {
            maxDataPoints: { type: 'number', title: '最大数据点数', default: 10000, minimum: 100, maximum: 50000 },
            updateThrottle: { type: 'number', title: '更新节流(ms)', default: 100, minimum: 50, maximum: 1000 },
            enableSampling: { type: 'boolean', title: '启用数据采样', default: false }
          }
        }
      }
    },

    // 默认配置
    defaultConfig: {
      chart: {
        showLegend: true,
        showDataZoom: true,
        showTooltip: true,
        smooth: true,
        showSymbol: true,
        symbolSize: 4,
        lineWidth: 2,
        showArea: false
      },
      timeRange: {
        defaultRange: '1h',
        allowCustomRange: true,
        showTimeSelector: true
      },
      aggregation: {
        enabled: false,
        defaultFunction: 'avg',
        defaultWindow: 'no_aggregate',
        showAggregateSelector: true
      },
      theme: {
        colorScheme: 'colorGroups',
        customColors: [],
        adaptiveTheme: true
      },
      axis: {
        showXAxis: true,
        showYAxis: true,
        xAxisType: 'time',
        yAxisType: 'value'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '50px',
        containLabel: true
      },
      performance: {
        maxDataPoints: 10000,
        updateThrottle: 100,
        enableSampling: false
      }
    },

    // 配置验证
    validator(config: any): boolean | string {
      if (!config) return '配置不能为空'

      // 验证时间范围
      if (
        config.timeRange?.defaultRange &&
        !['15m', '30m', '1h', '3h', '6h', '12h', '24h', '3d', '7d', '30d'].includes(config.timeRange.defaultRange)
      ) {
        return '无效的时间范围'
      }

      // 验证性能配置
      if (
        config.performance?.maxDataPoints &&
        (config.performance.maxDataPoints < 100 || config.performance.maxDataPoints > 50000)
      ) {
        return '最大数据点数必须在100-50000之间'
      }

      return true
    }
  },

  // 数据源配置
  dataSource: {
    supportedTypes: ['device', 'system', 'api', 'mock'],
    supportedFormats: ['timeseries', 'realtime', 'aggregated'],
    supportedAggregations: ['sum', 'avg', 'max', 'min', 'count'],
    timeRangeSupport: true,
    realtimeSupport: true,
    batchSupport: true
  },

  // 布局信息
  layout: {
    resizable: true,
    minWidth: 200,
    minHeight: 150,
    maxWidth: 1200,
    maxHeight: 800,
    aspectRatio: null,
    grid: {
      x: 0,
      y: 0,
      w: 6,
      h: 5
    }
  },

  // 依赖项
  dependencies: ['vue@^3.0.0', 'echarts@^5.0.0'],

  // 样式文件
  styles: ['./CurveChartView.vue']
}

export default curveChartDefinition
