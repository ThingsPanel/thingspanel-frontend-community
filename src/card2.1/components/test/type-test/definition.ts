/**
 * Card2.1 类型测试组件定义（简化版本）
 * 
 * 基于简化后的类型系统重新设计，展示了精简的核心特性：
 * - 极简化的组件定义结构
 * - 简化的数据源需求（无字段映射）
 * - 简洁的静态参数配置
 * - 实用的交互能力定义
 * 
 * 该组件主要用于：
 * 1. 演示简化后的类型系统
 * 2. 作为极简组件开发模板
 * 3. 验证类型系统的实用性
 */

import type { 
  ComponentDefinition,
  DataSourceRequirement,
  StaticParamRequirement,
  ComponentInteractionCapability
} from '@/card2.1/types'
import TypeTestComponent from './index.vue'

/**
 * 组件自定义配置类型定义
 * 这个接口定义了组件特有的配置选项，会被设置配置系统使用
 */
export interface TypeTestConfig {
  // === 基础显示配置 ===
  /** 组件标题 */
  title: string
  /** 副标题 */
  subtitle?: string
  /** 是否显示边框 */
  showBorder: boolean
  /** 背景颜色主题 */
  backgroundTheme: 'light' | 'dark' | 'auto'
  
  // === 数据显示配置 ===
  /** 主要数值 */
  primaryValue: number
  /** 次要数值 */
  secondaryValue?: number
  /** 数值单位 */
  unit: string
  /** 数值精度（小数位数） */
  precision: number
  
  // === 样式配置 ===
  /** 组件尺寸 */
  size: 'small' | 'medium' | 'large'
  /** 字体大小 */
  fontSize: number
  /** 内边距 */
  padding: number
  /** 圆角半径 */
  borderRadius: number
  
  // === 高级配置 ===
  /** 是否启用动画 */
  enableAnimation: boolean
  /** 动画持续时间（毫秒） */
  animationDuration: number
  /** 自定义样式类名 */
  customClassName?: string
  /** 扩展属性（支持任意键值对） */
  extraProps: Record<string, any>
}

/**
 * 数据源需求定义（简化版本）
 * 只定义组件需要什么数据，数据映射由数据架构系统处理
 */
const dataSourceRequirements: DataSourceRequirement[] = [
  {
    key: 'realtime-data',
    name: '实时数据源',
    description: '组件主要的实时数据来源，用于显示当前数值和状态',
    supportedTypes: ['api', 'websocket', 'mqtt', 'static'],
    required: true,
    example: {
      '模拟在线数据': {
        primaryValue: 77.7,
        status: 'normal',
        trend: 'up'
      },
      '模拟离线数据': {
        primaryValue: 0,
        status: 'offline',
        trend: 'stable'
      }
    }
  },
  
  {
    key: 'history-data',
    name: '历史数据源',
    description: '可选的历史数据，用于显示趋势信息',
    supportedTypes: ['api', 'database', 'static'],
    required: false,
    example: {
      '最近一小时趋势': [
        { time: '2023-10-27T10:00:00Z', value: 15 },
        { time: '2023-10-27T10:15:00Z', value: 18 },
        { time: '2023-10-27T10:30:00Z', value: 16 },
        { time: '2023-10-27T10:45:00Z', value: 20 },
        { time: '2023-10-27T11:00:00Z', value: 22 }
      ]
    }
  }
]

/**
 * 静态参数需求定义（简化版本）
 * 只定义核心的配置参数
 */
const staticParamRequirements: StaticParamRequirement[] = [
  {
    key: 'title',
    name: '组件标题',
    type: 'string',
    description: '显示在组件顶部的标题文字',
    required: true,
    defaultValue: '类型测试组件'
  },
  
  {
    key: 'showBorder',
    name: '显示边框',
    type: 'boolean',
    description: '是否显示组件外边框',
    required: false,
    defaultValue: true
  },
  
  {
    key: 'size',
    name: '组件尺寸',
    type: 'string',
    description: '组件的显示尺寸规格',
    required: false,
    defaultValue: 'medium'
  }
]

/**
 * 组件交互能力定义（简化版本）
 * 只定义组件的基本交互能力，移除冗余的示例和重复配置
 */
const interactionCapability: ComponentInteractionCapability = {
  // 支持的事件类型
  supportedEvents: ['click', 'hover', 'dataChange'],
  
  // 支持的动作类型
  supportedActions: ['jump', 'modify'],
  
  // 可被其他组件监听的属性列表（统一定义）
  listenableProperties: {
    title: {
      type: 'string',
      description: '组件标题'
    },
    primaryValue: {
      type: 'number', 
      description: '主要数值'
    },
    status: {
      type: 'string',
      description: '组件状态'
    },
    showBorder: {
      type: 'boolean',
      description: '是否显示边框'
    }
  }
}

/**
 * 完整的组件定义导出（极简版本）
 * 只包含运行时真正需要的核心信息
 */
export const typeTestDefinition: ComponentDefinition<TypeTestConfig> = {
  // === 核心标识信息 ===
  type: 'type-test',
  name: 'Card2.1 类型测试组件',
  description: '展示简化后Card2.1类型系统的测试组件',
  component: TypeTestComponent,

  // === 可选分类信息 ===
  category: '测试组件',
  version: '2.1.0',
  tags: ['测试', '类型系统', 'Card2.1'],

  // === 数据需求声明 ===
  dataSources: dataSourceRequirements,
  staticParams: staticParamRequirements,

  // === 权限控制 ===
  permission: '不限'
}

// 默认导出组件定义
export default typeTestDefinition