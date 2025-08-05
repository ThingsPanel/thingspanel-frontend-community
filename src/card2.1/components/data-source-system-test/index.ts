/**
 * 数据源系统测试卡片组件定义
 */
import type { ComponentDefinition } from '../../core/types'
import DataSourceSystemTestCard from './DataSourceSystemTestCard.vue'
import { DataSourceSystemTestIcon } from './icon'

export const dataSourceSystemTestDefinition: ComponentDefinition = {
  type: 'data-source-system-test',
  name: '数据源系统测试',
  description: '测试新数据源系统的完整功能，包括静态数据源、设备API和响应式更新',
  component: DataSourceSystemTestCard,
  icon: DataSourceSystemTestIcon,

  // 分类信息
  mainCategory: 'development',
  subCategory: 'testing',

  // 组件配置
  config: {
    // 数据需求声明
    dataRequirements: {
      value: {
        type: 'number',
        required: false,
        description: '测试数值',
        defaultValue: 0
      },
      title: {
        type: 'string',
        required: false,
        description: '测试标题',
        defaultValue: '数据源测试'
      },
      unit: {
        type: 'string',
        required: false,
        description: '数值单位',
        defaultValue: ''
      },
      status: {
        type: 'string',
        required: false,
        description: '状态信息',
        defaultValue: 'ready'
      }
    },

    // 默认样式配置
    style: {
      width: 400,
      height: 500,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16
    },

    // 支持的数据源类型
    supportedDataSources: ['static', 'device-api']
  },

  // 标签
  tags: ['测试', '开发', '数据源', '系统'],

  // 版本信息
  version: '1.0.0',
  author: 'Claude Code',

  // 示例配置
  examples: [
    {
      name: '基础测试配置',
      description: '展示所有测试功能的基础配置',
      config: {
        dataSource: {
          type: 'static',
          data: {
            value: 42,
            title: '系统测试',
            unit: '%',
            status: 'normal'
          }
        }
      }
    }
  ]
}

export default dataSourceSystemTestDefinition
