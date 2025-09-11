/**
 * Chart Bar 组件 - Card 2.0 Demo
 * 基于新架构的柱状图组件实现
 */

import type { IComponentDefinition } from '../../../core/types/component'
import type { IDataNode } from '../../../core/types/index'
import { dataTransform } from '../../../core/data/transform'

// 导入Vue视图组件
import BarChartView from './BarChartView.vue'

/**
 * 柱状图组件逻辑Hook
 */
const useBarChartLogic = () => {
  /**
   * 处理数据
   * @param rawData 原始数据
   * @param config 组件配置
   * @returns 处理后的数据
   */
  const processData = async (rawData: IDataNode | IDataNode[], config: any) => {
    try {
      // 统一数据格式
      const dataNodes = Array.isArray(rawData) ? rawData : [rawData]

      // 数据转换和聚合
      const chartData = dataNodes.map(node => {
        // 提取数值数据
        let value = node.value
        if (typeof value === 'object' && value !== null) {
          // 如果是对象，尝试提取数值字段
          const numericFields = Object.keys(value).filter(key => typeof value[key] === 'number')
          if (numericFields.length > 0) {
            value = value[numericFields[0]] // 取第一个数值字段
          }
        }

        return {
          name: node.metadata?.deviceName || node.metadata?.metric || node.id,
          value: typeof value === 'number' ? value : 0,
          timestamp: node.timestamp,
          unit: node.metadata?.unit || '',
          category: node.metadata?.category || 'default'
        }
      })

      // 根据配置进行数据处理
      if (config.aggregation?.enabled) {
        return aggregateData(chartData, config.aggregation)
      }

      // 数据排序
      if (config.sort?.enabled) {
        chartData.sort((a, b) => {
          const field = config.sort.field || 'value'
          const order = config.sort.order || 'desc'
          const aVal = a[field as keyof typeof a]
          const bVal = b[field as keyof typeof b]

          if (order === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }

      // 数据限制
      if (config.limit && config.limit > 0) {
        return chartData.slice(0, config.limit)
      }

      return chartData
    } catch (error) {
      console.error('[BarChart] 数据处理失败:', error)
      return []
    }
  }

  /**
   * 聚合数据
   * @param data 原始数据
   * @param aggregationConfig 聚合配置
   * @returns 聚合后的数据
   */
  const aggregateData = (data: any[], aggregationConfig: any) => {
    const { groupBy, method } = aggregationConfig

    if (!groupBy) return data

    const groups = data.reduce(
      (acc, item) => {
        const key = item[groupBy] || 'unknown'
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(item)
        return acc
      },
      {} as Record<string, any[]>
    )

    return Object.entries(groups).map(([key, items]) => {
      let value = 0

      switch (method) {
        case 'sum':
          value = items.reduce((sum, item) => sum + item.value, 0)
          break
        case 'avg':
          value = items.reduce((sum, item) => sum + item.value, 0) / items.length
          break
        case 'max':
          value = Math.max(...items.map(item => item.value))
          break
        case 'min':
          value = Math.min(...items.map(item => item.value))
          break
        case 'count':
          value = items.length
          break
        default:
          value = items[0]?.value || 0
      }

      return {
        name: key,
        value,
        count: items.length,
        unit: items[0]?.unit || '',
        category: groupBy
      }
    })
  }

  /**
   * 组件挂载时的处理
   * @param context 组件上下文
   */
  const onMounted = async (context: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BarChart] 组件已挂载', context.config)
    }

    // 初始化图表配置
    if (!context.config.chart) {
      context.updateConfig({
        ...context.config,
        chart: {
          type: 'bar',
          theme: 'default',
          animation: true,
          responsive: true
        }
      })
    }
  }

  /**
   * 组件卸载时的处理
   * @param context 组件上下文
   */
  const onUnmounted = async (context: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BarChart] 组件已卸载')
    }
    // 清理资源
  }

  /**
   * 配置变更处理
   * @param newConfig 新配置
   * @param oldConfig 旧配置
   */
  const onConfigChanged = async (newConfig: any, oldConfig: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BarChart] 配置已变更', { newConfig, oldConfig })
    }
    // 处理配置变更逻辑
  }

  return {
    processData,
    onMounted,
    onUnmounted,
    onConfigChanged
  }
}

/**
 * 柱状图组件定义
 */
export const barChartDefinition: IComponentDefinition = {
  meta: {
    id: 'chart-bar',
    name: '柱状图',
    description: '用于展示分类数据的柱状图组件',
    version: '2.0.0',
    author: 'Card 2.0',
    tags: ['chart', 'bar', 'visualization'],
    category: 'chart',
    icon: 'bar-chart',
    thumbnail: '/assets/thumbnails/bar-chart.png'
  },

  logic: useBarChartLogic(),

  views: {
    vue: BarChartView
  },

  config: {
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          title: '图表标题',
          default: '柱状图'
        },
        chart: {
          type: 'object',
          title: '图表配置',
          properties: {
            type: {
              type: 'string',
              title: '图表类型',
              enum: ['bar', 'column'],
              default: 'bar'
            },
            theme: {
              type: 'string',
              title: '主题',
              enum: ['default', 'dark', 'light'],
              default: 'default'
            },
            animation: {
              type: 'boolean',
              title: '启用动画',
              default: true
            },
            responsive: {
              type: 'boolean',
              title: '响应式',
              default: true
            }
          }
        },
        colors: {
          type: 'array',
          title: '颜色配置',
          items: {
            type: 'string'
          },
          default: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
        },
        aggregation: {
          type: 'object',
          title: '数据聚合',
          properties: {
            enabled: {
              type: 'boolean',
              title: '启用聚合',
              default: false
            },
            groupBy: {
              type: 'string',
              title: '分组字段',
              enum: ['category', 'name', 'unit'],
              default: 'category'
            },
            method: {
              type: 'string',
              title: '聚合方法',
              enum: ['sum', 'avg', 'max', 'min', 'count'],
              default: 'sum'
            }
          }
        },
        sort: {
          type: 'object',
          title: '排序配置',
          properties: {
            enabled: {
              type: 'boolean',
              title: '启用排序',
              default: true
            },
            field: {
              type: 'string',
              title: '排序字段',
              enum: ['name', 'value', 'timestamp'],
              default: 'value'
            },
            order: {
              type: 'string',
              title: '排序顺序',
              enum: ['asc', 'desc'],
              default: 'desc'
            }
          }
        },
        limit: {
          type: 'number',
          title: '数据限制',
          minimum: 0,
          maximum: 100,
          default: 10
        }
      }
    },

    defaultConfig: {
      title: '柱状图',
      chart: {
        type: 'bar',
        theme: 'default',
        animation: true,
        responsive: true
      },
      colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
      aggregation: {
        enabled: false,
        groupBy: 'category',
        method: 'sum'
      },
      sort: {
        enabled: true,
        field: 'value',
        order: 'desc'
      },
      limit: 10
    }
  },

  dataSource: {
    supportedTypes: ['device', 'system', 'api', 'mock'],
    requiredFields: ['value'],
    optionalFields: ['name', 'category', 'unit', 'timestamp'],
    aggregationSupport: true,
    realTimeSupport: true
  },

  layout: {
    defaultSize: {
      width: 6,
      height: 4
    },
    minSize: {
      width: 3,
      height: 2
    },
    maxSize: {
      width: 12,
      height: 8
    },
    resizable: true
  }
}

// 默认导出
export default barChartDefinition
