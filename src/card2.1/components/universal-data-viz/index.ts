/**
 * 通用数据可视化组件
 * 统一支持对象数据和数组数据的可视化展示
 */

import type { ComponentDefinition } from '../../core/types'
import UniversalDataVizCard from './UniversalDataVizCard.vue'
import UniversalDataVizConfigPanel from './UniversalDataVizConfigPanel.vue'
import { iconSvg } from './icon'

// 组件定义
export const universalDataVizComponentDefinition: ComponentDefinition = {
  type: 'universal-data-viz',
  name: '通用数据可视化',
  description: '统一支持对象数据和数组数据的智能可视化组件，支持图表、表格、对象模式',
  category: 'chart',
  version: '1.0.0',
  author: 'Card2.1 System',
  
  // 组件实现
  component: UniversalDataVizCard,
  
  // 配置面板
  configComponent: UniversalDataVizConfigPanel,
  
  // 图标配置
  icon: iconSvg,
  
  // === 注册和权限配置 ===
  // 权限设置 - 所有用户都可以访问
  permission: '不限',
  
  // 注册设置 - 默认注册，可在组件库中正常使用
  isRegistered: true,
  
  // === 分类信息 ===
  mainCategory: '数据展示',
  subCategory: '图表组件',
  
  // 支持的数据源类型
  supportedDataSources: ['static', 'api', 'websocket', 'script'],
  
  // === 组件属性定义 ===
  properties: {
    title: {
      type: 'string',
      label: '标题',
      default: '通用数据可视化',
      description: '组件标题'
    },
    chartType: {
      type: 'string',
      label: '图表类型',
      default: 'line',
      options: [
        { label: '线形图', value: 'line' },
        { label: '柱状图', value: 'bar' },
        { label: '散点图', value: 'scatter' }
      ],
      description: '选择图表类型'
    },
    showDebugInfo: {
      type: 'boolean',
      label: '显示调试信息',
      default: false,
      description: '是否显示调试信息'
    },
    autoDetectMode: {
      type: 'boolean',
      label: '自动检测模式',
      default: true,
      description: '自动检测数据类型并选择最佳显示模式'
    }
  },
  
  // 默认配置
  config: {
    style: {
      width: 400,
      height: 300
    },
    dataSourceType: 'array', // 默认使用数组模式
    objectConfig: {
      key1Path: 'key1',
      key2Path: 'key2',
      key3Path: 'key3'
    },
    arrayConfig: {
      xPath: 'timestamp',
      yPath: 'temperature',
      labelPath: 'label'
    }
  },
  
  // 组件标签
  tags: ['数据可视化', '图表', '通用组件', 'ECharts', '对象数据', '数组数据'],
  
  // === 使用示例 ===
  examples: [
    {
      name: '温度趋势图',
      description: '显示温度随时间变化的折线图',
      config: {
        title: '温度趋势',
        chartType: 'line',
        dataSourceType: 'array',
        arrayConfig: {
          xPath: 'timestamp',
          yPath: 'temperature',
          labelPath: 'label'
        }
      }
    },
    {
      name: '数据统计对象',
      description: '展示多个关键指标的对象数据',
      config: {
        title: '系统数据统计',
        dataSourceType: 'object',
        objectConfig: {
          key1Path: 'cpu_usage',
          key2Path: 'memory_usage',
          key3Path: 'disk_usage'
        }
      }
    }
  ],
  
  // 组件文档
  documentation: {
    overview: '通用数据可视化组件支持对象和数组两种数据格式，可智能显示为图表、表格或对象模式',
    features: ['智能数据类型检测', '多种显示模式', 'ECharts图表集成', '灵活的路径映射', '实时数据更新'],
    usage: {
      basic: '选择数据源类型（对象/数组），配置字段路径即可使用',
      advanced: '支持复杂路径映射（如 nested.field 或 [0]）和多种图表类型'
    }
  }
}

// 导出组件和配置
// 导出组件和配置
export { UniversalDataVizCard, UniversalDataVizConfigPanel }
export default universalDataVizComponentDefinition