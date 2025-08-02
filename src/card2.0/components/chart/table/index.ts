/**
 * Card 2.0 表格组件定义
 * 基于原有 chart-table 组件迁移而来，采用新的架构设计
 */

import { defineAsyncComponent } from 'vue'
import type { IComponentDefinition, RendererType, DataSourceType } from '../../../core/types/component'
import { $t } from '@/locales'

/**
 * 表格配置接口
 */
export interface TableConfig {
  /** 组件标题 */
  title?: string

  /** 表格设置 */
  table?: {
    /** 是否显示边框 */
    bordered?: boolean
    /** 是否显示斑马纹 */
    striped?: boolean
    /** 表格大小 */
    size?: 'small' | 'medium' | 'large'
    /** 最大高度 */
    maxHeight?: number
    /** 是否显示表头 */
    showHeader?: boolean
    /** 是否可排序 */
    sortable?: boolean
    /** 是否可筛选 */
    filterable?: boolean
  }

  /** 分页设置 */
  pagination?: {
    /** 是否启用分页 */
    enabled?: boolean
    /** 每页显示条数 */
    pageSize?: number
    /** 可选的每页条数 */
    pageSizes?: number[]
    /** 是否显示每页条数选择器 */
    showSizePicker?: boolean
    /** 是否显示快速跳转 */
    showQuickJumper?: boolean
    /** 分页位置 */
    position?: 'top' | 'bottom' | 'both'
  }

  /** 列配置 */
  columns?: {
    /** 时间列设置 */
    timeColumn?: {
      /** 是否显示 */
      show?: boolean
      /** 列标题 */
      title?: string
      /** 时间格式 */
      format?: string
      /** 列宽度 */
      width?: number
      /** 是否固定 */
      fixed?: 'left' | 'right' | false
    }
    /** 数据列设置 */
    dataColumns?: {
      /** 是否自动生成列 */
      autoGenerate?: boolean
      /** 默认列宽 */
      defaultWidth?: number
      /** 数值格式化 */
      numberFormat?: {
        /** 小数位数 */
        precision?: number
        /** 千分位分隔符 */
        thousandsSeparator?: boolean
        /** 单位 */
        unit?: string
      }
    }
  }

  /** 样式设置 */
  style?: {
    /** 表头背景色 */
    headerBgColor?: string
    /** 表头文字颜色 */
    headerTextColor?: string
    /** 行背景色 */
    rowBgColor?: string
    /** 行文字颜色 */
    rowTextColor?: string
    /** 斑马纹颜色 */
    stripedColor?: string
    /** 边框颜色 */
    borderColor?: string
    /** 字体大小 */
    fontSize?: number
    /** 行高 */
    rowHeight?: number
  }

  /** 数据设置 */
  data?: {
    /** 数据时间范围 */
    timeRange?: string
    /** 数据聚合方式 */
    aggregateFunction?: string
    /** 聚合时间窗口 */
    aggregateWindow?: string
    /** 最大显示行数 */
    maxRows?: number
    /** 数据排序 */
    sortOrder?: 'asc' | 'desc'
    /** 排序字段 */
    sortField?: string
  }

  /** 导出设置 */
  export?: {
    /** 是否启用导出 */
    enabled?: boolean
    /** 导出格式 */
    formats?: ('csv' | 'excel' | 'json')[]
    /** 导出文件名 */
    filename?: string
  }

  /** 自动刷新设置 */
  autoRefresh?: {
    /** 是否启用自动刷新 */
    enabled?: boolean
    /** 刷新间隔（秒） */
    interval?: number
  }
}

/**
 * Card 2.0 表格组件定义
 * 从 src/card/chart-card/table 迁移而来
 */
export const tableDefinition: IComponentDefinition = {
  // 组件元数据
  id: 'card2-table',
  name: $t('card.table.name') || '数据表格',
  version: '2.0.0',
  description: $t('card.table.description') || '用于展示设备遥测数据的表格组件，支持分页、排序、筛选等功能',
  category: 'chart',
  tags: ['table', 'data', 'grid', 'telemetry'],
  author: 'ThingsPanel',

  // 组件资源
  icon: 'mdi:table',
  thumbnail: '/src/card2.0/components/chart/table/poster.png',

  // 渲染器支持
  supportedRenderers: ['vue'] as RendererType[],

  // 组件尺寸
  size: {
    width: 400,
    height: 300,
    minWidth: 300,
    minHeight: 200,
    maxWidth: 1200,
    maxHeight: 800
  },

  // 兼容性配置
  compatibility: {
    legacy: {
      componentId: 'chart-table',
      configMigration: (oldConfig: any): TableConfig => {
        return {
          title: oldConfig.title || '数据表格',
          table: {
            bordered: oldConfig.bordered ?? true,
            striped: oldConfig.striped ?? true,
            size: oldConfig.size || 'medium',
            showHeader: oldConfig.showHeader ?? true,
            sortable: oldConfig.sortable ?? true
          },
          pagination: {
            enabled: oldConfig.pagination?.enabled ?? true,
            pageSize: oldConfig.pagination?.pageSize || 10,
            pageSizes: oldConfig.pagination?.pageSizes || [10, 15, 20],
            showSizePicker: oldConfig.pagination?.showSizePicker ?? true
          },
          columns: {
            timeColumn: {
              show: oldConfig.timeColumn?.show ?? true,
              title: oldConfig.timeColumn?.title || '时间',
              format: oldConfig.timeColumn?.format || 'YYYY-MM-DD HH:mm:ss'
            },
            dataColumns: {
              autoGenerate: oldConfig.dataColumns?.autoGenerate ?? true
            }
          },
          data: {
            timeRange: oldConfig.dataTimeRange || 'last_1h',
            aggregateFunction: oldConfig.aggregateFunction || 'avg',
            aggregateWindow: oldConfig.dataAggregateRange || 'no_aggregate',
            maxRows: oldConfig.maxRows || 1000,
            sortOrder: 'desc',
            sortField: 'time'
          },
          autoRefresh: {
            enabled: oldConfig.autoRefresh?.enabled ?? false,
            interval: oldConfig.autoRefresh?.interval || 30
          }
        }
      }
    }
  },

  // 数据处理
  dataProcessor: {
    // 处理设备遥测数据
    processDeviceData: (data: any[], config: TableConfig) => {
      if (!data || !Array.isArray(data)) return []

      // 按时间分组合并数据
      const timeMap = new Map()
      data.forEach(({ x, y, key }) => {
        if (!timeMap.has(x)) {
          timeMap.set(x, { time: x })
        }
        timeMap.get(x)[key] = y
      })

      // 转换为数组并排序
      let result = Array.from(timeMap.values())

      // 应用排序
      if (config.data?.sortField && config.data?.sortOrder) {
        result.sort((a, b) => {
          const aVal = a[config.data!.sortField!]
          const bVal = b[config.data!.sortField!]
          const order = config.data!.sortOrder === 'asc' ? 1 : -1
          return (aVal > bVal ? 1 : -1) * order
        })
      }

      // 限制最大行数
      if (config.data?.maxRows) {
        result = result.slice(0, config.data.maxRows)
      }

      return result
    },

    // 处理API数据
    processApiData: (data: any[], config: TableConfig) => {
      if (!data || !Array.isArray(data)) return []
      return data
    }
  },

  // 生命周期钩子
  lifecycle: {
    onInit: (config: TableConfig) => {
      console.log('Table component initialized with config:', config)
    },
    onDestroy: () => {
      console.log('Table component destroyed')
    }
  },

  // 自动刷新逻辑
  autoRefresh: {
    getInterval: (config: TableConfig) => {
      return config.autoRefresh?.enabled ? (config.autoRefresh.interval || 30) * 1000 : 0
    },
    onRefresh: (instance: any) => {
      if (instance && typeof instance.refreshData === 'function') {
        instance.refreshData()
      }
    }
  },

  // Vue组件
  component: defineAsyncComponent(() => import('./component.vue')),

  // 配置组件
  configComponent: defineAsyncComponent(() => import('./config.vue')),

  // 默认配置
  defaultConfig: {
    title: '数据表格',
    table: {
      bordered: true,
      striped: true,
      size: 'medium',
      maxHeight: 400,
      showHeader: true,
      sortable: true,
      filterable: false
    },
    pagination: {
      enabled: true,
      pageSize: 10,
      pageSizes: [10, 15, 20, 50],
      showSizePicker: true,
      showQuickJumper: false,
      position: 'bottom'
    },
    columns: {
      timeColumn: {
        show: true,
        title: '时间',
        format: 'YYYY-MM-DD HH:mm:ss',
        width: 180,
        fixed: false
      },
      dataColumns: {
        autoGenerate: true,
        defaultWidth: 120,
        numberFormat: {
          precision: 2,
          thousandsSeparator: false,
          unit: ''
        }
      }
    },
    style: {
      headerBgColor: '#f5f5f5',
      headerTextColor: '#333333',
      rowBgColor: '#ffffff',
      rowTextColor: '#333333',
      stripedColor: '#fafafa',
      borderColor: '#e0e0e0',
      fontSize: 14,
      rowHeight: 40
    },
    data: {
      timeRange: 'last_1h',
      aggregateFunction: 'avg',
      aggregateWindow: 'no_aggregate',
      maxRows: 1000,
      sortOrder: 'desc',
      sortField: 'time'
    },
    export: {
      enabled: false,
      formats: ['csv', 'excel'],
      filename: 'table_data'
    },
    autoRefresh: {
      enabled: false,
      interval: 30
    }
  } as TableConfig,

  // JSON Schema配置
  configSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: '组件标题',
        default: '数据表格'
      },
      table: {
        type: 'object',
        title: '表格设置',
        properties: {
          bordered: { type: 'boolean', title: '显示边框', default: true },
          striped: { type: 'boolean', title: '斑马纹', default: true },
          size: {
            type: 'string',
            title: '表格大小',
            enum: ['small', 'medium', 'large'],
            default: 'medium'
          },
          maxHeight: { type: 'number', title: '最大高度', default: 400 },
          showHeader: { type: 'boolean', title: '显示表头', default: true },
          sortable: { type: 'boolean', title: '可排序', default: true }
        }
      },
      pagination: {
        type: 'object',
        title: '分页设置',
        properties: {
          enabled: { type: 'boolean', title: '启用分页', default: true },
          pageSize: { type: 'number', title: '每页条数', default: 10 },
          showSizePicker: { type: 'boolean', title: '显示条数选择器', default: true }
        }
      }
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['device_telemetry', 'api', 'static'] as DataSourceType[],

  // 布局信息
  layout: {
    resizable: true,
    rotatable: false,
    aspectRatio: null
  },

  // 依赖项
  dependencies: {
    external: ['naive-ui', 'moment'],
    internal: ['@/service/api/device', '@/utils/logger']
  },

  // 样式文件
  styles: ['/src/card2.0/components/chart/table/styles.css']
}

export default tableDefinition
