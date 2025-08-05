/**
 * 综合数据测试组件定义
 * 展示新数据源系统的完整功能，包括复杂数据结构和关系计算
 */
import type { ComponentDefinition } from '../../core/types'
import ComprehensiveDataTestCard from './ComprehensiveDataTestCard.vue'

// SVG图标字符串
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <path d="M12 2v20"/>
  <path d="M2 12h20"/>
  <path d="M12 2a10 10 0 0 1 10 10"/>
  <path d="M12 22a10 10 0 0 1-10-10"/>
</svg>`

export const comprehensiveDataTestDefinition: ComponentDefinition = {
  type: 'comprehensive-data-test',
  name: '综合数据测试',
  description: '演示新数据源系统的完整功能，包括复杂数据结构、数据关系计算和响应式更新',
  category: 'development',
  component: ComprehensiveDataTestCard,
  icon: iconSvg,

  // 分类信息
  mainCategory: 'development',
  subCategory: 'testing',

  // 组件配置
  config: {
    // 完整的数据需求声明示例
    dataRequirements: {
      // 基础值类型
      temperature: {
        type: 'number',
        required: true,
        description: '环境温度，单位摄氏度',
        defaultValue: 0
      },
      humidity: {
        type: 'number',
        required: true,
        description: '环境湿度，百分比',
        defaultValue: 0
      },
      isOnline: {
        type: 'boolean',
        required: false,
        description: '设备在线状态',
        defaultValue: false
      },

      // 对象类型
      sensorInfo: {
        type: 'object',
        required: false,
        description: '传感器基本信息',
        defaultValue: {
          id: '',
          name: '',
          location: ''
        }
      },

      // 数组类型
      readings: {
        type: 'array',
        required: false,
        description: '历史读数数组',
        defaultValue: []
      }
    },

    // 数据关系定义
    dataRelationships: {
      comfortIndex: {
        type: 'calculated',
        inputs: ['temperature', 'humidity'],
        description: '舒适度指数计算'
      },
      sensorStatus: {
        type: 'derived',
        inputs: ['isOnline'],
        description: '传感器状态描述'
      }
    },

    // 默认样式配置
    style: {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 20
    },

    // 支持的数据源类型
    supportedDataSources: ['static', 'script', 'api', 'websocket'],

    // 支持的更新触发器
    supportedTriggers: ['timer', 'websocket', 'event', 'manual']
  },

  // 标签
  tags: ['测试', '开发', '数据源', '复杂数据', '关系计算', '响应式'],

  // 版本信息
  version: '1.0.0',
  author: 'Claude Code',

  // 示例配置
  examples: [
    {
      name: '静态数据测试',
      description: '使用静态数据演示所有数据类型和关系计算',
      config: {
        dataSource: {
          type: 'static',
          data: {
            temperature: 25.6,
            humidity: 68.2,
            isOnline: true,
            sensorInfo: {
              id: 'sensor-001',
              name: '环境传感器',
              location: '机房A区'
            },
            readings: [
              { time: '14:00', value: 24.5 },
              { time: '14:30', value: 25.1 }
            ]
          }
        }
      }
    },
    {
      name: '动态数据测试',
      description: '使用脚本生成动态随机数据',
      config: {
        dataSource: {
          type: 'script',
          script: 'return { temperature: mockData.randomNumber(18, 32), humidity: mockData.randomNumber(40, 80) }'
        }
      }
    },
    {
      name: '定时更新测试',
      description: '每5秒自动更新一次数据',
      config: {
        dataSource: {
          type: 'script',
          script: 'return { temperature: 20 + Math.sin(Date.now() / 60000) * 10 }'
        },
        updateTrigger: {
          type: 'timer',
          interval: 5000
        }
      }
    }
  ],

  // 开发文档
  documentation: {
    overview: '这是一个综合数据测试组件，展示了新数据源系统的所有核心功能',
    features: [
      '复杂数据结构支持（值、对象、数组）',
      '数据关系计算（独立、计算、派生）',
      '多种数据源类型（静态、脚本、API、WebSocket）',
      '响应式数据更新（定时器、事件、手动）',
      '实时数据验证和错误处理',
      '可视化配置界面'
    ],
    usage: {
      basic: '直接添加到面板中，使用默认的静态数据配置',
      advanced: '通过配置界面选择不同的数据源类型和更新策略',
      development: '用于测试和验证新数据源系统的功能完整性'
    }
  }
}

export default comprehensiveDataTestDefinition
