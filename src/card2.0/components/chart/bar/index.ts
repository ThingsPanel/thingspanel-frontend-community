/**
 * Card 2.0 柱状图组件定义
 * 基于原有 chart-bar 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * Card 2.0 柱状图组件定义
 * 从 src/card/chart-card/bar 迁移而来
 */
export const barChartDefinition: IComponentDefinition = {
  // 组件元数据
  meta: {
    id: 'card2-bar-chart',
    name: $t('card.barChart'),
    version: '2.0.0',
    description: '柱状图组件，支持多设备数据展示和时间聚合',
    category: 'chart',
    tags: ['图表', '柱状图', '数据可视化', '时间序列'],
    author: 'ThingsPanel Team',
    icon: 'chart-bar',
    thumbnail: './poster.png',
    supportedRenderers: ['vue'],
    minSize: { width: 300, height: 200 },
    maxSize: { width: 1200, height: 800 },
    defaultSize: { width: 480, height: 320 },

    // 兼容性信息
    compatibility: {
      legacyId: 'chart-bar', // 原组件ID
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
     * 处理时间序列数据
     * 支持设备遥测数据的处理和聚合
     */
    async processData(rawData: any, config: any, context: any) {
      try {
        let processedData = rawData

        // 处理设备数据源
        if (context.dataSource?.type === 'device') {
          processedData = await this.processDeviceData(rawData, config, context)
        }
        // 处理API数据源
        else if (context.dataSource?.type === 'api') {
          processedData = await this.processApiData(rawData, config)
        }
        // 处理静态数据
        else if (Array.isArray(rawData)) {
          processedData = this.processStaticData(rawData, config)
        }

        // 数据验证
        if (!Array.isArray(processedData)) {
          console.warn('处理后的数据不是数组格式，使用默认数据')
          return this.getDefaultData()
        }

        return processedData
      } catch (error) {
        console.error('数据处理失败:', error)
        return this.getDefaultData()
      }
    },

    /**
     * 处理设备遥测数据
     */
    async processDeviceData(rawData: any, config: any, context: any) {
      const { deviceSource = [] } = context.dataSource || {}
      const seriesData = []

      for (let i = 0; i < deviceSource.length; i++) {
        const device = deviceSource[i]
        if (!device.deviceId || !device.metricsId) continue

        const deviceData = rawData?.[i] || []
        const seriesConfig = {
          name: device.metricsName || device.metricsId,
          type: 'bar',
          data: deviceData.map(item => [item.x || item.timestamp, item.y || item.value]),
          itemStyle: this.getSeriesStyle(i, config)
        }

        seriesData.push(seriesConfig)
      }

      return seriesData
    },

    /**
     * 处理API数据
     */
    async processApiData(rawData: any, config: any) {
      // 根据API响应格式处理数据
      if (rawData?.data && Array.isArray(rawData.data)) {
        return rawData.data.map(item => [item.timestamp || item.x, item.value || item.y])
      }
      return rawData || []
    },

    /**
     * 处理静态数据
     */
    processStaticData(rawData: any[], config: any) {
      return rawData.map(item => {
        if (Array.isArray(item) && item.length >= 2) {
          return item // [timestamp, value] 格式
        }
        if (item.timestamp && item.value !== undefined) {
          return [item.timestamp, item.value]
        }
        if (item.x !== undefined && item.y !== undefined) {
          return [item.x, item.y]
        }
        return [Date.now(), item.value || 0]
      })
    },

    /**
     * 获取系列样式
     */
    getSeriesStyle(index: number, config: any) {
      const colorScheme = config.theme?.colorScheme || 'colorGroups'
      const colors = this.getColorScheme(colorScheme)
      const color = colors[index % colors.length]

      return {
        opacity: 0.8,
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
    },

    /**
     * 获取配色方案
     */
    getColorScheme(schemeName: string) {
      const schemes = {
        colorGroups: [
          { top: '#2563EB', bottom: '#2563EB' },
          { top: 'rgb(214, 209, 250)', bottom: 'rgb(246, 243, 253)' },
          { top: 'rgb(182, 255, 187)', bottom: 'rgb(153, 255, 204)' },
          { top: 'rgb(255, 197, 157)', bottom: 'rgb(255, 159, 128)' },
          { top: 'rgb(206, 255, 157)', bottom: 'rgb(159, 255, 128)' },
          { top: 'rgb(255, 157, 224)', bottom: 'rgb(255, 128, 191)' },
          { top: 'rgb(197, 157, 255)', bottom: 'rgb(159, 128, 255)' },
          { top: 'rgb(255, 224, 157)', bottom: 'rgb(255, 204, 128)' },
          { top: 'rgb(157, 224, 255)', bottom: 'rgb(128, 204, 255)' }
        ],
        colorGroups2: [
          { top: 'rgb(235, 154, 88)', bottom: 'rgb(255, 221, 175)' },
          { top: 'rgb(33, 68, 115)', bottom: 'rgb(174, 198, 207)' },
          { top: 'rgb(199, 233, 192)', bottom: 'rgb(232, 240, 232)' },
          { top: 'rgb(255, 175, 95)', bottom: 'rgb(255, 204, 153)' },
          { top: 'rgb(155, 215, 112)', bottom: 'rgb(215, 255, 179)' },
          { top: 'rgb(217, 136, 128)', bottom: 'rgb(239, 187, 204)' },
          { top: 'rgb(193, 108, 61)', bottom: 'rgb(252, 204, 166)' },
          { top: 'rgb(62, 133, 145)', bottom: 'rgb(181, 222, 213)' },
          { top: 'rgb(255, 133, 102)', bottom: 'rgb(255, 226, 148)' }
        ]
      }
      return schemes[schemeName] || schemes.colorGroups
    },

    /**
     * 获取默认数据
     */
    getDefaultData() {
      const now = Date.now()
      return Array.from({ length: 10 }, (_, i) => [
        now - (9 - i) * 60000, // 每分钟一个数据点
        Math.floor(Math.random() * 100) + 10
      ])
    },

    /**
     * 聚合数据
     */
    aggregateData(data: any[], aggregation: any) {
      if (!aggregation.field || !aggregation.method) {
        return data
      }

      const grouped = data.reduce((acc, item) => {
        const key = item[aggregation.field]
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(item)
        return acc
      }, {})

      return Object.entries(grouped).map(([key, items]: [string, any[]]) => {
        let value: number
        const values = items.map(item => Number(item.value)).filter(v => !isNaN(v))

        switch (aggregation.method) {
          case 'sum':
            value = values.reduce((sum, v) => sum + v, 0)
            break
          case 'avg':
            value = values.reduce((sum, v) => sum + v, 0) / values.length
            break
          case 'max':
            value = Math.max(...values)
            break
          case 'min':
            value = Math.min(...values)
            break
          case 'count':
            value = values.length
            break
          default:
            value = values[0] || 0
        }

        return {
          name: key,
          value,
          count: items.length
        }
      })
    },

    /**
     * 排序数据
     */
    sortData(data: any[], sort: any) {
      const { field = 'value', order = 'desc' } = sort

      return [...data].sort((a, b) => {
        const aVal = a[field]
        const bVal = b[field]

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return order === 'asc' ? aVal - bVal : bVal - aVal
        } else {
          const aStr = String(aVal).toLowerCase()
          const bStr = String(bVal).toLowerCase()
          return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
        }
      })
    },

    /**
     * 组件挂载
     */
    async onMounted(context) {
      console.log(`柱状图组件 ${context.instance.id} 已挂载`)

      // 初始化图表
      if (context.instance.config.autoRefresh?.enabled) {
        this.startAutoRefresh(context)
      }
    },

    /**
     * 组件卸载
     */
    async onUnmounted(context) {
      console.log(`柱状图组件 ${context.instance.id} 已卸载`)

      // 清理定时器
      this.stopAutoRefresh(context)
    },

    /**
     * 配置变更
     */
    async onConfigChanged(newConfig, oldConfig, context) {
      console.log(`柱状图组件 ${context.instance.id} 配置已更新`)

      // 处理自动刷新配置变更
      if (newConfig.autoRefresh?.enabled !== oldConfig.autoRefresh?.enabled) {
        if (newConfig.autoRefresh?.enabled) {
          this.startAutoRefresh(context)
        } else {
          this.stopAutoRefresh(context)
        }
      }
    },

    /**
     * 数据变更
     */
    async onDataChanged(newData, oldData, context) {
      console.log(`柱状图组件 ${context.instance.id} 数据已更新`)

      // 处理数据并更新图表
      const processedData = await this.processData(newData, context.config)
      context.updateData(processedData)
    },

    /**
     * 错误处理
     */
    async onError(error, context) {
      console.error(`柱状图组件 ${context.instance.id} 发生错误:`, error)

      // 显示错误状态
      context.instance.setState({
        ...context.instance.getState(),
        error: {
          message: error.message,
          timestamp: Date.now()
        }
      })
    },

    /**
     * 开始自动刷新
     */
    startAutoRefresh(context: any) {
      const interval = context.config.autoRefresh?.interval || 30000

      const timerId = setInterval(() => {
        // 触发数据刷新事件
        context.emit('refresh-data')
      }, interval)

      context.instance.metadata = {
        ...context.instance.metadata,
        autoRefreshTimer: timerId
      }
    },

    /**
     * 停止自动刷新
     */
    stopAutoRefresh(context: any) {
      const timerId = context.instance.metadata?.autoRefreshTimer
      if (timerId) {
        clearInterval(timerId)
        delete context.instance.metadata.autoRefreshTimer
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
            stack: { type: 'boolean', title: '堆叠显示', default: true },
            smooth: { type: 'boolean', title: '平滑曲线', default: true },
            barWidth: { type: 'number', title: '柱子宽度', default: 40, minimum: 10, maximum: 100 }
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
              enum: ['avg', 'max', 'sum', 'diff'],
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
        stack: true,
        smooth: true,
        barWidth: 40
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

    // 配置验证器
    validator(config: any): boolean | string {
      if (config.chart?.barWidth < 10 || config.chart?.barWidth > 100) {
        return '柱子宽度必须在10-100之间'
      }

      if (config.animation?.duration < 0 || config.animation?.duration > 5000) {
        return '动画时长必须在0-5000ms之间'
      }

      if (config.autoRefresh?.enabled && config.autoRefresh?.interval < 1000) {
        return '自动刷新间隔不能小于1秒'
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

  // 布局配置
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
      w: 4,
      h: 3
    }
  },

  // 依赖项
  dependencies: ['vue@^3.0.0', 'echarts@^5.0.0'],

  // 样式文件
  styles: ['./BarChartView.vue']
}

// 默认导出
export default barChartDefinition
