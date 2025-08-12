/**
 * Card2.1 测试组件注册文件
 * 将测试组件注册到组件注册表中，用于验证数据源配置系统
 */

import { componentRegistry } from '../core/registry'
import type { ComponentDefinition } from '../core/types'

// 导入组件
import SimpleDataDisplay from './SimpleDataDisplay.vue'
import TimeSeriesChart from './TimeSeriesChart.vue'
import StatisticsCard from './StatisticsCard.vue'
import { DataMappingTest } from './data-mapping-test'

// 组件定义
const testComponents: ComponentDefinition[] = [
  {
    type: 'simple-data-display',
    name: '简单数据展示',
    description: '展示单个JSON对象数据，支持字段映射和格式化显示',
    category: '数据展示',
    subCategory: '基础展示',
    mainCategory: '系统',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    component: SimpleDataDisplay,
    config: {
      title: '数据展示',
      showTitle: true,
      showDebugInfo: false,
      maxFields: 8,
      fieldLabels: {}
    },
    tags: ['数据展示', '测试组件', 'JSON'],
    version: '1.0.0',
    author: 'Claude Code',
    permission: '不限',
    isRegistered: true,
    supportedDataSources: ['json', 'object'],
    examples: [
      {
        name: '设备信息展示',
        description: '展示单个设备的基本信息',
        config: {
          title: '设备信息',
          fieldLabels: {
            id: '设备ID',
            name: '设备名称',
            status: '运行状态',
            temperature: '温度',
            humidity: '湿度'
          }
        }
      },
      {
        name: '用户资料卡',
        description: '展示用户的基本资料信息',
        config: {
          title: '用户资料',
          fieldLabels: {
            username: '用户名',
            email: '邮箱',
            role: '角色',
            lastLogin: '最后登录'
          }
        }
      }
    ],
    properties: {
      title: {
        type: 'string',
        default: '数据展示',
        description: '组件标题',
        label: '标题'
      },
      showTitle: {
        type: 'boolean',
        default: true,
        description: '是否显示标题',
        label: '显示标题'
      },
      maxFields: {
        type: 'number',
        default: 8,
        description: '最大显示字段数量',
        label: '最大字段数',
        min: 1,
        max: 20
      },
      showDebugInfo: {
        type: 'boolean',
        default: false,
        description: '是否显示调试信息',
        label: '调试模式'
      }
    }
  },
  {
    type: 'time-series-chart',
    name: '时间序列图表',
    description: '展示时间序列数据的趋势图表，支持数据点可视化',
    category: '图表',
    subCategory: '时间序列',
    mainCategory: '曲线',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3v18h18M7 12l4-4 4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    component: TimeSeriesChart,
    config: {
      title: '时间序列图表',
      showTitle: true,
      timeField: 'time',
      valueField: 'value',
      labelField: 'label',
      showDebugInfo: false,
      chartColors: {}
    },
    tags: ['图表', '时间序列', '趋势', '测试组件'],
    version: '1.0.0',
    author: 'Claude Code',
    permission: '不限',
    isRegistered: true,
    supportedDataSources: ['json', 'array'],
    examples: [
      {
        name: '温度趋势图',
        description: '展示温度传感器的历史数据趋势',
        config: {
          title: '温度趋势',
          timeField: 'timestamp',
          valueField: 'temperature',
          chartColors: {
            line: '#ff6b35',
            point: '#ff8c69'
          }
        }
      },
      {
        name: '用户访问量',
        description: '展示网站的用户访问量变化趋势',
        config: {
          title: '访问量趋势',
          timeField: 'date',
          valueField: 'visitors',
          chartColors: {
            line: '#4f46e5',
            point: '#818cf8'
          }
        }
      }
    ],
    properties: {
      title: {
        type: 'string',
        default: '时间序列图表',
        description: '图表标题',
        label: '标题'
      },
      showTitle: {
        type: 'boolean',
        default: true,
        description: '是否显示标题',
        label: '显示标题'
      },
      timeField: {
        type: 'string',
        default: 'time',
        description: '时间字段名',
        label: '时间字段',
        placeholder: '如: time, timestamp, date'
      },
      valueField: {
        type: 'string',
        default: 'value',
        description: '数值字段名',
        label: '数值字段',
        placeholder: '如: value, count, amount'
      },
      labelField: {
        type: 'string',
        default: 'label',
        description: '标签字段名',
        label: '标签字段',
        placeholder: '如: label, name, category'
      },
      showDebugInfo: {
        type: 'boolean',
        default: false,
        description: '是否显示调试信息',
        label: '调试模式'
      }
    }
  },
  {
    type: 'statistics-card',
    name: '统计卡片',
    description: '展示多数据源的汇总统计信息，包含数据概览和详细分析',
    category: '统计',
    subCategory: '概览卡片',
    mainCategory: '系统',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 17V7m0 0a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    component: StatisticsCard,
    config: {
      title: '统计概览',
      showTitle: true,
      showDebugInfo: false,
      statsConfig: {
        totalField: 'total',
        activeField: 'active',
        valueField: 'value'
      }
    },
    tags: ['统计', '概览', '多数据源', '测试组件'],
    version: '1.0.0',
    author: 'Claude Code',
    permission: '不限',
    isRegistered: true,
    supportedDataSources: ['json', 'array', 'object', 'multi-source'],
    examples: [
      {
        name: '设备状态概览',
        description: '展示设备群的整体运行状态统计',
        config: {
          title: '设备概览',
          statsConfig: {
            totalField: 'total',
            activeField: 'online',
            valueField: 'status'
          }
        }
      },
      {
        name: '业务数据统计',
        description: '展示业务相关的关键指标汇总',
        config: {
          title: '业务统计',
          statsConfig: {
            totalField: 'count',
            activeField: 'active',
            valueField: 'revenue'
          }
        }
      }
    ],
    properties: {
      title: {
        type: 'string',
        default: '统计概览',
        description: '组件标题',
        label: '标题'
      },
      showTitle: {
        type: 'boolean',
        default: true,
        description: '是否显示标题',
        label: '显示标题'
      },
      showDebugInfo: {
        type: 'boolean',
        default: false,
        description: '是否显示调试信息',
        label: '调试模式'
      }
    }
  },
  // 新增数据映射测试组件
  DataMappingTest
]

/**
 * 注册所有测试组件
 */
export function registerTestComponents() {
  console.log('🚀 [Card2.1] 开始注册测试组件...')

  testComponents.forEach(component => {
    try {
      componentRegistry.register(component.type, component)
      console.log(`✅ [Card2.1] 成功注册组件: ${component.name} (${component.type})`)
    } catch (error) {
      console.error(`❌ [Card2.1] 注册组件失败: ${component.name}`, error)
    }
  })

  console.log(`🎉 [Card2.1] 测试组件注册完成，共注册 ${testComponents.length} 个组件`)

  // 验证注册结果
  const registeredCount = componentRegistry.getAll().length
  console.log(`📊 [Card2.1] 组件注册表当前包含 ${registeredCount} 个组件`)

  return testComponents
}

/**
 * 获取所有测试组件定义
 */
export function getTestComponents(): ComponentDefinition[] {
  return testComponents
}

/**
 * 获取指定类型的组件定义
 */
export function getTestComponent(type: string): ComponentDefinition | undefined {
  return testComponents.find(comp => comp.type === type)
}

// 导出组件以供其他模块使用
export { SimpleDataDisplay, TimeSeriesChart, StatisticsCard, DataMappingTest }

// 默认导出注册函数
export default registerTestComponents
