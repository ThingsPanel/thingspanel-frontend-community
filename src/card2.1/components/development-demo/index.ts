import type { ComponentDefinition } from '../../core/types'
import DevelopmentDemoCard from './DevelopmentDemoCard.vue'
import DevelopmentDemoConfigPanel from './DevelopmentDemoConfigPanel.vue'
import { iconSvg } from './icon'

/**
 * 开发演示组件定义
 *
 * 这是一个专门为开发者设计的演示组件，用于帮助开发者快速开发新组件。
 * 该组件设置为注册（isRegistered: true），会在组件库中显示，
 * 供开发参考和学习使用。
 *
 * 组件特点：
 * - 包含丰富的功能演示
 * - 详细的中文注释
 * - 完整的TypeScript类型定义
 * - 响应式设计和动画效果
 * - 事件处理和状态管理
 */
export const developmentDemoDefinition: ComponentDefinition = {
  // === 基本信息 ===
  type: 'development-demo', // 组件类型标识
  name: '开发演示组件', // 组件显示名称
  description: '这是一个用于开发演示的组件，帮助开发者快速开发新组件。包含丰富的功能演示和详细的中文注释。', // 组件描述
  category: 'development', // 组件分类
  component: DevelopmentDemoCard, // Vue组件引用
  configComponent: DevelopmentDemoConfigPanel, // 配置面板组件
  icon: iconSvg, // 组件图标

  // === 权限设置 ===
  permission: '不限', // 所有用户都可以访问

  // === 注册设置 ===
  isRegistered: true, // 注册 - 会在组件库中显示

  // === 分类信息 ===
  mainCategory: 'development', // 主分类：开发工具
  subCategory: 'demo', // 子分类：演示组件

  // === 版本信息 ===
  version: '1.0.0', // 组件版本
  author: 'ThingsPanel Development Team', // 组件作者

  // === 组件属性定义 ===
  properties: {
    // 基础属性
    title: {
      type: 'string',
      label: '标题',
      default: '开发演示',
      description: '组件标题'
    },
    value: {
      type: 'string',
      label: '数值',
      default: '42',
      description: '显示的数值'
    },
    description: {
      type: 'string',
      label: '描述',
      default: '这是一个简单的开发演示组件',
      description: '组件描述'
    },

    // 样式属性
    backgroundColor: {
      type: 'color',
      label: '背景颜色',
      default: '#f8f9fa',
      description: '背景颜色'
    },

    // 功能开关
    showDevInfo: {
      type: 'boolean',
      label: '显示开发信息',
      default: true,
      description: '是否显示开发信息'
    }
  },

  // === 默认配置 ===
  config: {
    // 样式配置
    style: {
      width: 400, // 默认宽度
      height: 300, // 默认高度
      backgroundColor: '#f8f9fa', // 默认背景色
      textColor: '#333333' // 默认文字色
    },

    // 功能配置
    features: {
      showDevBadge: true, // 默认显示开发标识
      showTrend: true, // 默认显示趋势指示器
      showDevInfo: true, // 默认显示开发信息
      showActions: true, // 默认显示操作按钮
      showFooter: true // 默认显示底部信息
    }
  },

  // === 支持的数据源类型 ===
  supportedDataSources: ['static', 'script'], // 支持静态数据和脚本数据源

  // === 组件标签 ===
  tags: ['开发', '演示', '学习', '参考', '模板'], // 组件标签，用于分类和搜索

  // === 使用示例 ===
  examples: [
    {
      name: '基础演示',
      description: '基础的开发演示组件',
      config: {
        title: '开发演示',
        value: '42',
        description: '这是一个简单的开发演示组件',
        backgroundColor: '#f0f9ff',
        showDevInfo: true
      }
    },
    {
      name: '简洁模式',
      description: '简洁的演示模式',
      config: {
        title: '简洁演示',
        value: '100',
        description: '简洁模式下的演示组件',
        showDevInfo: false,
        backgroundColor: '#f6ffed'
      }
    },
    {
      name: '自定义样式',
      description: '自定义样式的演示',
      config: {
        title: '自定义演示',
        value: '75.5',
        description: '自定义样式的演示组件',
        backgroundColor: '#fff7e6'
      }
    }
  ],

  // === 开发文档 ===
  documentation: {
    // 组件概述
    overview: '开发演示组件是一个简单的演示组件，用于帮助开发者快速开发新组件。',

    // 功能特性
    features: ['简单的属性配置', '详细的中文注释', '完整的TypeScript类型', '响应式设计'],

    // 使用说明
    usage: {
      basic: '直接使用默认配置即可显示演示组件',
      advanced: '可以通过属性配置来自定义组件',
      development: '开发者可以基于此组件快速开发新的组件'
    },

    // 注意事项
    notes: ['此组件设置为注册，会在组件库中显示', '供开发参考和学习使用', '包含详细的中文注释，适合新手学习']
  }
}

// 默认导出组件定义
export default developmentDemoDefinition
