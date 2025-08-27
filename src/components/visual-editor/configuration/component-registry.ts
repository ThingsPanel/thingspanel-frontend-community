/**
 * 配置组件注册中心
 * 统一管理各层级的配置组件，告诉ConfigurationPanel使用哪个组件
 */

import type { Component } from 'vue'

// 导入各层级配置组件 - 使用动态导入避免循环依赖
import { defineAsyncComponent } from 'vue'

// 动态导入组件避免循环依赖问题
const BaseConfigForm = defineAsyncComponent(() => import('../renderers/base/BaseConfigForm.vue'))
const ComponentConfigForm = defineAsyncComponent(() => import('../renderers/base/ComponentConfigForm.vue'))
// 导入新的卡片式交互配置组件（来自核心交互系统）
const InteractionCardWizard = defineAsyncComponent(() => import('@/core/interaction-system/components/InteractionCardWizard.vue'))
// 导入简易配置编辑器 (SUBTASK-010)
const SimpleConfigurationEditor = defineAsyncComponent(() => import('@/core/data-architecture/components/SimpleConfigurationEditor.vue'))

console.log('🔍 [component-registry] 导入SimpleConfigurationEditor:', SimpleConfigurationEditor)

export interface ConfigLayerDefinition {
  /** 配置层级名称 */
  name: string
  /** 显示标签（国际化key） */
  label: string
  /** 对应的配置表单组件 */
  component: Component
  /** 是否显示该配置层级 */
  visible: boolean
  /** 排序权重 */
  order: number
  /** 描述（可选） */
  description?: string
}

/**
 * 配置层级注册表
 * 按order排序显示
 */
export const configLayerRegistry: Record<string, ConfigLayerDefinition> = {
  base: {
    name: 'base',
    label: 'config.tabs.base',
    component: BaseConfigForm,
    visible: true,
    order: 1,
    description: '节点基础属性配置（标题、样式、布局等）'
  },
  component: {
    name: 'component',
    label: 'config.tabs.component',
    component: ComponentConfigForm,
    visible: true, // 🔧 显示组件配置，测试简单测试组件
    order: 2,
    description: '组件特有配置（由各组件自定义）'
  },
  dataSource: {
    name: 'dataSource',
    label: 'config.tabs.dataSource',
    component: SimpleConfigurationEditor,
    visible: true,
    order: 3,
    description: '数据源配置（简易配置系统，支持JSON、HTTP、Script等数据源）'
  },
  interaction: {
    name: 'interaction',
    label: 'config.tabs.interaction',
    component: InteractionCardWizard,
    visible: true,
    order: 4,
    description: '组件交互配置（卡片式简洁界面，点击、悬停等交互效果）'
  }
}

console.log('📋 [component-registry] 注册表创建完成，dataSource配置:', configLayerRegistry.dataSource)

/**
 * 获取所有可见的配置层级（按order排序）
 */
export const getVisibleConfigLayers = (): ConfigLayerDefinition[] => {
  return Object.values(configLayerRegistry)
    .filter(layer => layer.visible)
    .sort((a, b) => a.order - b.order)
}

/**
 * 获取指定层级的配置定义
 */
export const getConfigLayer = (layerName: string): ConfigLayerDefinition | undefined => {
  return configLayerRegistry[layerName]
}

/**
 * 动态注册配置层级（用于扩展）
 */
export const registerConfigLayer = (layerName: string, definition: ConfigLayerDefinition) => {
  configLayerRegistry[layerName] = definition
}

/**
 * 隐藏指定配置层级
 */
export const hideConfigLayer = (layerName: string) => {
  const layer = configLayerRegistry[layerName]
  if (layer) {
    layer.visible = false
  }
}

/**
 * 显示指定配置层级
 */
export const showConfigLayer = (layerName: string) => {
  const layer = configLayerRegistry[layerName]
  if (layer) {
    layer.visible = true
  }
}
