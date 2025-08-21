import type { ComponentDefinition } from '../../core/types'
import type {
  ComponentInteractionDefinition,
  InteractionEventType,
  InteractionActionType,
  JumpConfig,
  ModifyConfig
} from '../../core/interaction-types'
import DataDisplayCard from './DataDisplayCard.vue'
import DataDisplayConfig from './config/DataDisplayConfig.vue'

const dataDisplayCardDefinition: ComponentDefinition = {
  type: 'data-display-card',
  name: '数据展示卡片',
  description: '功能丰富的数据展示卡片，支持指标展示、趋势分析和数据列表',
  category: 'display',
  mainCategory: '展示',
  subCategory: '数据',
  author: 'ThingsPanel Team',
  permission: '不限',
  icon: 'stats-chart-outline',
  version: '2.1.0',
  tags: ['数据', '统计', '图表', '指标', 'Card2.1', '实时'],

  // 组件状态
  isRegistered: true,

  // 数据源支持
  supportedDataSources: ['static', 'api', 'websocket', 'mqtt'],

  // 组件引用
  component: DataDisplayCard,
  configComponent: DataDisplayConfig,

  // 默认样式配置（用于编辑器布局）
  defaultLayout: {
    canvas: {
      width: 320,
      height: 240,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 4, // 栅格宽度
      h: 3, // 栅格高度
      minW: 3,
      minH: 2,
      maxW: 12,
      maxH: 8
    }
  },

  // ============ 编辑器集成配置 ============

  // 组件尺寸规范
  defaultSize: {
    width: 320,
    height: 240
  },
  minSize: {
    width: 280,
    height: 180
  },

  // 示例配置（编辑器预览用）
  examples: [
    {
      name: '温度监控卡片',
      description: '显示环境温度数据和变化趋势',
      config: {
        title: '环境温度',
        mainValue: '25.6',
        mainUnit: '°C',
        trendText: '较昨日 +2.3°C',
        trendDirection: 'up',
        iconType: 'stats-chart',
        showTrend: true
      }
    },
    {
      name: '设备状态统计',
      description: '展示设备在线数量和状态统计',
      config: {
        title: '设备在线状态',
        mainValue: '168',
        mainUnit: '台设备',
        showDataList: true,
        dataList: [
          { label: '在线设备', value: '156', unit: '台', color: '#18a058' },
          { label: '离线设备', value: '12', unit: '台', color: '#d03050' }
        ]
      }
    },
    {
      name: '数据统计仪表盘',
      description: '综合数据展示，包含多个指标',
      config: {
        title: '今日数据概览',
        description: '实时数据统计和分析',
        mainValue: '8,765',
        mainUnit: '次访问',
        showTrend: true,
        showDataList: true,
        layout: 'vertical'
      }
    }
  ],

  // 属性定义（供编辑器使用）
  properties: {
    title: {
      type: 'string',
      default: '数据展示卡片',
      description: '卡片标题文字',
      label: '标题',
      placeholder: '请输入卡片标题'
    },
    mainValue: {
      type: 'string',
      default: '8,765',
      description: '主要显示数值',
      label: '主数值',
      placeholder: '请输入数值'
    },
    mainUnit: {
      type: 'string',
      default: '次访问',
      description: '数值单位',
      label: '单位',
      placeholder: '请输入单位'
    },
    iconType: {
      type: 'string',
      default: 'stats-chart',
      description: '卡片图标类型',
      label: '图标',
      options: [
        { label: '统计图', value: 'stats-chart' },
        { label: '饼图', value: 'pie-chart' },
        { label: '柱状图', value: 'bar-chart' }
      ]
    },
    showTrend: {
      type: 'boolean',
      default: true,
      description: '是否显示趋势指示器',
      label: '显示趋势'
    },
    trendDirection: {
      type: 'string',
      default: 'up',
      description: '数据变化趋势方向',
      label: '趋势方向',
      options: [
        { label: '上升', value: 'up' },
        { label: '下降', value: 'down' },
        { label: '持平', value: 'neutral' }
      ]
    }
  },

  // 组件默认属性配置
  config: {
    // === 内容配置 ===
    title: '数据展示卡片',
    subtitle: '',
    description: '关键业务指标和数据趋势',
    showTitle: true,
    showSubtitle: false,
    showDescription: true,

    // === 主数值配置 ===
    mainValue: '8,765',
    mainUnit: '次访问',
    valueFormat: 'number', // number | currency | percentage
    showMainValue: true,

    // === 趋势配置 ===
    showTrend: true,
    trendDirection: 'up', // up | down | neutral
    trendText: '较昨日 +12.5%',
    trendColor: '#18a058',
    trendIcon: 'trending-up-outline',

    // === 图标配置 ===
    showIcon: true,
    iconType: 'stats-chart-outline',
    iconSize: 24,
    iconColor: '#18a058',
    iconPosition: 'left', // left | top | right

    // === 数据列表配置 ===
    showDataList: true,
    dataList: [
      { id: '1', label: '今日新增', value: '145', unit: '次', color: '#18a058', trend: '+5.2%' },
      { id: '2', label: '本周累计', value: '2,341', unit: '次', color: '#2080f0', trend: '+12.8%' },
      { id: '3', label: '活跃用户', value: '1,876', unit: '人', color: '#f0a020', trend: '-2.1%' }
    ],
    maxDataItems: 5,

    // === 样式配置 ===
    backgroundColor: 'var(--card-color)',
    borderColor: 'var(--border-color)',
    borderWidth: 1,
    borderRadius: 8,
    textColor: 'var(--text-color)',
    titleColor: 'var(--text-color)',
    subtitleColor: 'var(--text-color-2)',
    valueColor: 'var(--primary-color)',
    padding: 16,

    // === 布局配置 ===
    layout: 'vertical', // vertical | horizontal
    contentAlign: 'left', // left | center | right
    spacing: 12,

    // === 交互配置 ===
    clickable: false,
    hoverEffect: true,
    showActions: false,
    actions: []
  },

  // ============ 交互系统配置 ============
  interaction: {
    // 交互能力声明
    capability: {
      supportedEvents: ['click', 'hover', 'dataChange'] as InteractionEventType[],
      supportedActions: ['jump', 'modify'] as InteractionActionType[],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: [
        'title',
        'subtitle',
        'mainValue',
        'mainUnit',
        'trendDirection',
        'trendText',
        'showTrend',
        'backgroundColor',
        'textColor',
        'valueColor',
        'iconType',
        'showIcon',
        'layout',
        'visibility',
        'dataList'
      ]
    },

    // 交互示例配置
    examples: [
      {
        name: '点击查看数据详情',
        description: '点击卡片时跳转到数据详情页面',
        scenario: 'click-jump' as const,
        config: {
          event: 'click' as InteractionEventType,
          responses: [
            {
              action: 'jump' as InteractionActionType,
              jumpConfig: {
                jumpType: 'internal',
                internalPath: '/visualization/data-details',
                target: '_self'
              } as JumpConfig
            }
          ],
          enabled: true,
          name: '数据详情跳转'
        }
      },
      {
        name: '数值异常时告警',
        description: '当主数值超过阈值时显示告警组件',
        scenario: 'data-change-action' as const,
        config: {
          event: 'dataChange' as InteractionEventType,
          watchedProperty: 'mainValue',
          condition: {
            operator: 'greaterThan',
            value: 1000
          },
          responses: [
            {
              action: 'modify' as InteractionActionType,
              modifyConfig: {
                targetComponentId: 'alert-widget-id',
                targetProperty: 'visibility',
                updateValue: 'visible',
                updateMode: 'replace'
              } as ModifyConfig
            }
          ],
          enabled: true,
          name: '数值异常告警'
        }
      },
      {
        name: '趋势变化修改样式',
        description: '根据数据趋势方向动态修改卡片颜色',
        scenario: 'data-change-action' as const,
        config: {
          event: 'dataChange' as InteractionEventType,
          watchedProperty: 'trendDirection',
          condition: {
            operator: 'equals',
            value: 'down'
          },
          responses: [
            {
              action: 'modify' as InteractionActionType,
              modifyConfig: {
                targetComponentId: 'self', // 修改自身
                targetProperty: 'backgroundColor',
                updateValue: '#ffebee',
                updateMode: 'replace'
              } as ModifyConfig
            }
          ],
          enabled: true,
          name: '趋势颜色联动'
        }
      },
      {
        name: '悬停显示统计信息',
        description: '悬停时在其他组件中显示详细统计',
        scenario: 'hover-modify' as const,
        config: {
          event: 'hover' as InteractionEventType,
          responses: [
            {
              action: 'modify' as InteractionActionType,
              modifyConfig: {
                targetComponentId: 'stats-detail-id',
                targetProperty: 'dataList',
                updateValue: [
                  { label: '当前值', value: '8,765' },
                  { label: '增长率', value: '+12.5%' },
                  { label: '更新时间', value: '刚刚' }
                ],
                updateMode: 'replace'
              } as ModifyConfig
            }
          ],
          enabled: true,
          name: '悬停详情展示'
        }
      }
    ],

    // 属性暴露配置
    propertyExposure: {
      componentType: 'data-display-card',
      componentName: '数据展示卡片',
      listenableProperties: [
        {
          name: 'title',
          label: '标题',
          type: 'string',
          description: '卡片标题文字',
          group: '内容'
        },
        {
          name: 'subtitle',
          label: '副标题',
          type: 'string',
          description: '卡片副标题文字',
          group: '内容'
        },
        {
          name: 'mainValue',
          label: '主数值',
          type: 'string',
          description: '卡片显示的主要数值',
          group: '数据'
        },
        {
          name: 'mainUnit',
          label: '数值单位',
          type: 'string',
          description: '主数值的单位文字',
          group: '数据'
        },
        {
          name: 'trendDirection',
          label: '趋势方向',
          type: 'string',
          description: '数据趋势方向：up、down、neutral',
          group: '趋势'
        },
        {
          name: 'trendText',
          label: '趋势文字',
          type: 'string',
          description: '趋势描述文字',
          group: '趋势'
        },
        {
          name: 'showTrend',
          label: '显示趋势',
          type: 'boolean',
          description: '是否显示趋势指示器',
          group: '趋势'
        },
        {
          name: 'backgroundColor',
          label: '背景颜色',
          type: 'string',
          description: '卡片背景颜色',
          group: '样式'
        },
        {
          name: 'textColor',
          label: '文字颜色',
          type: 'string',
          description: '文字颜色',
          group: '样式'
        },
        {
          name: 'valueColor',
          label: '数值颜色',
          type: 'string',
          description: '主数值的显示颜色',
          group: '样式'
        },
        {
          name: 'iconType',
          label: '图标类型',
          type: 'string',
          description: '卡片图标类型',
          group: '图标'
        },
        {
          name: 'showIcon',
          label: '显示图标',
          type: 'boolean',
          description: '是否显示图标',
          group: '图标'
        },
        {
          name: 'layout',
          label: '布局方式',
          type: 'string',
          description: '卡片布局方式：vertical、horizontal',
          group: '布局'
        },
        {
          name: 'visibility',
          label: '可见性',
          type: 'string',
          description: '卡片显示状态：visible、hidden',
          group: '样式'
        },
        {
          name: 'dataList',
          label: '数据列表',
          type: 'object',
          description: '卡片中的数据项列表',
          group: '数据'
        }
      ]
    }
  } as ComponentInteractionDefinition
}

export default dataDisplayCardDefinition
