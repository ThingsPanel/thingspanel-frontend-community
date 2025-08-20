/**
 * 配置组件注册中心
 * 统一管理各层级的配置组件，告诉ConfigurationPanel使用哪个组件
 */

import type { Component } from 'vue'

// 导入各层级配置组件
// 现在从 renderers/base 目录导入，实现真正的分离架构
import BaseConfigForm from '../renderers/base/BaseConfigForm.vue'
import ComponentConfigForm from '../renderers/base/ComponentConfigForm.vue'
// 导入新的卡片式交互配置组件（来自核心交互系统）
import InteractionCardWizard from '@/core/interaction-system/components/InteractionCardWizard.vue'

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
  interaction: {
    name: 'interaction',
    label: 'config.tabs.interaction',
    component: InteractionCardWizard,
    visible: true,
    order: 3,
    description: '组件交互配置（卡片式简洁界面，点击、悬停等交互效果）'
  }
}

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
