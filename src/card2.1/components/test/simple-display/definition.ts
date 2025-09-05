/**
 * simple-display 组件定义
 * 新三文件结构 - 标准组件模板
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import SimpleDisplayComponent from './index.vue'
import SimpleDisplaySetting from './setting.vue'
import { simpleDisplaySettingConfig } from './settingConfig'
import { componentRegistry } from '@/card2.1/core/component-registry'

/**
 * simple-display 组件定义
 * 基于新三文件架构的标准定义
 */
const simpleDisplayDefinition: ComponentDefinition = {
  // 基础信息
  type: 'simple-display',
  name: '简单展示',
  description: '静态内容展示组件，支持自定义文字、图标和样式，无需数据源',
  category: '数据展示',
  mainCategory: '测试',  // 对应test分类
  subCategory: '数据展示',  // 子分类
  icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h7v2H7v-2zm0 4h10v2H7v-2z"/></svg>`,
  version: '2.1.0',
  author: 'ThingsPanel',

  // 组件实现
  component: SimpleDisplayComponent,

  // 配置组件
  configComponent: SimpleDisplaySetting,

  // 默认配置 - 使用新的 CustomConfig 结构
  defaultConfig: simpleDisplaySettingConfig.customConfig,

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 300,
      height: 200,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 2,
      h: 2,
      x: 0,
      y: 0,
      minW: 2,
      minH: 1,
      maxW: 4,
      maxH: 3
    }
  },

  // 🔥 移除数据源配置 - simple-display 是纯静态展示组件
  // 不需要任何数据源，所有内容通过组件配置的 customize 属性设置

  // 标签
  tags: ['static', 'display', 'simple', 'basic', 'text'],

  // 🔥 静态组件无需示例数据 - 所有内容通过组件配置设置

  // 特性标记 - 静态组件特性
  features: {
    realtime: false, // 🔥 修改：静态组件无需实时数据
    dataBinding: false, // 🔥 修改：静态组件无需数据绑定
    themeable: true, // 保持：支持主题定制
    responsive: true, // 保持：支持响应式
    configurable: true, // 保持：支持配置定制
    simple: true, // 保持：简单组件标识
    static: true // 🔥 新增：明确标识为静态组件
  }
}

// 注册组件到组件注册中心（包含自动属性暴露）
componentRegistry.registerComponent(simpleDisplayDefinition)
componentRegistry.registerSettingConfig(simpleDisplaySettingConfig)
export default simpleDisplayDefinition
