import type { ComponentDefinition } from '../../core/types'
import SimpleCard from './SimpleCard.vue'
import SimpleCardConfigPanel from './SimpleCardConfigPanel.vue'
import { iconSvg } from './icon'

export const simpleCardDefinition: ComponentDefinition = {
  type: 'simple-card',
  name: '简单卡片',
  description: '一个简单的数据展示卡片组件，支持自定义标题、数值、单位和描述',
  category: 'display',
  component: SimpleCard,
  configComponent: SimpleCardConfigPanel,
  icon: iconSvg,

  // 权限设置 - 所有用户都可以访问
  permission: '不限',

  // 注册设置 - 默认注册，可在组件库中正常使用
  isRegistered: true,

  // 分类信息
  mainCategory: 'display',
  subCategory: 'basic',

  // 版本信息
  version: '1.0.0',
  author: 'ThingsPanel Team',

  // 组件属性定义
  properties: {
    title: {
      type: 'string',
      label: '标题',
      default: '简单卡片',
      description: '卡片标题'
    },
    value: {
      type: 'string',
      label: '数值',
      default: '0',
      description: '显示的数值'
    },
    unit: {
      type: 'string',
      label: '单位',
      default: '',
      description: '数值单位'
    },
    description: {
      type: 'string',
      label: '描述',
      default: '',
      description: '卡片描述文字'
    },
    backgroundColor: {
      type: 'color',
      label: '背景颜色',
      default: '#ffffff',
      description: '卡片背景颜色'
    },
    textColor: {
      type: 'color',
      label: '文字颜色',
      default: '#333333',
      description: '卡片文字颜色'
    },
    fontSize: {
      type: 'string',
      label: '字体大小',
      default: '16px',
      description: '卡片字体大小'
    }
  },

  // 默认配置
  config: {
    style: {
      width: 300,
      height: 200
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['static', 'script'],

  // 组件标签
  tags: ['简单', '展示', '数据', '基础'],

  // === 使用示例 ===
  examples: [
    {
      name: '温度显示',
      description: '显示温度数据的简单卡片',
      config: {
        title: '当前温度',
        value: '25.6',
        unit: '°C',
        description: '室内环境温度'
      }
    },
    {
      name: '湿度显示',
      description: '显示湿度数据的简单卡片',
      config: {
        title: '环境湿度',
        value: '68',
        unit: '%',
        description: '相对湿度',
        backgroundColor: '#e6f7ff'
      }
    },
    {
      name: '设备状态',
      description: '显示设备状态的简单卡片',
      config: {
        title: '设备状态',
        value: '在线',
        description: '设备运行正常',
        backgroundColor: '#f6ffed',
        textColor: '#52c41a'
      }
    },
    {
      name: '数据统计',
      description: '显示数据统计的简单卡片',
      config: {
        title: '今日访问',
        value: '1,234',
        unit: '次',
        description: '较昨日增长12%',
        backgroundColor: '#fff7e6',
        textColor: '#d46b08'
      }
    },
    {
      name: '自定义样式',
      description: '自定义样式的简单卡片',
      config: {
        title: '自定义卡片',
        value: '99.9',
        unit: '%',
        description: '高精度数据',
        backgroundColor: '#f0f0ff',
        textColor: '#722ed1',
        fontSize: '18px'
      }
    }
  ],

  // 组件文档
  documentation: {
    overview: '简单卡片是一个基础的数据展示组件，适合显示单个数值或状态信息',
    features: ['支持自定义标题、数值、单位', '可配置背景颜色和文字颜色', '响应式设计，适配不同尺寸', '简洁美观的界面'],
    usage: {
      basic: '配置标题和数值即可显示数据',
      advanced: '可自定义颜色、字体大小等样式属性'
    }
  }
}

export default simpleCardDefinition
