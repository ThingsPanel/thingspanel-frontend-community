/**
 * 组件配置显示逻辑修复
 * 临时修复文件 - 用于修复配置表单不显示的问题
 */

import type { Component } from 'vue'

// 导入各层级配置组件 - 使用动态导入避免循环依赖
import { defineAsyncComponent } from 'vue'

// 导入配置管理器用于检查组件数据源需求
import { configurationIntegrationBridge as configurationManager } from './ConfigurationIntegrationBridge'
import { getComponentDataRequirements } from '../core/component-data-requirements'

// 动态导入组件避免循环依赖问题
const BaseConfigForm = defineAsyncComponent(() => import('../renderers/base/BaseConfigForm.vue'))
const ComponentConfigForm = defineAsyncComponent(() => import('../renderers/base/ComponentConfigForm.vue'))
const InteractionCardWizard = defineAsyncComponent(
  () => import('@/core/interaction-system/components/InteractionCardWizard.vue')
)
const SimpleConfigurationEditor = defineAsyncComponent(
  () => import('@/core/data-architecture/components/SimpleConfigurationEditor.vue')
)

export interface ConfigLayerDefinition {
  name: string
  label: string
  component: Component
  visible: boolean
  order: number
  description?: string
}

/**
 * 修复后的组件配置显示检查函数
 */
const shouldShowComponentConfig = (componentId: string, widget?: any): boolean => {
  try {
    console.log(`🔍 [ComponentRegistry-Fix] 检查组件配置显示条件`, {
      componentId,
      widgetType: widget?.type,
      hasMetadata: !!widget?.metadata,
      hasCard2Definition: !!widget?.metadata?.card2Definition
    })

    // 修复1：更宽松的策略 - 默认显示配置面板
    // 只有明确确认组件没有配置需求时才隐藏

    // 检查Card2.1组件定义
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      const hasConfigProps = !!(
        card2Definition.config?.properties && 
        Object.keys(card2Definition.config.properties).length > 0
      )
      
      console.log(`📋 [ComponentRegistry-Fix] Card2定义检查结果`, {
        componentType: widget.type,
        hasConfig: !!card2Definition.config,
        hasProperties: !!card2Definition.config?.properties,
        propertiesCount: Object.keys(card2Definition.config?.properties || {}).length,
        决策: hasConfigProps ? '显示配置' : '仍显示配置(宽松策略)'
      })
      
      // 修复：即使没有config.properties，也可能有其他配置需求
      // 采用宽松策略，只要是Card2.1组件就显示配置面板
      return true
    }

    // 对于已知组件类型，都显示配置面板
    if (widget?.type) {
      console.log(`✅ [ComponentRegistry-Fix] 所有组件都显示配置面板: ${widget.type}`)
      return true
    }

    // 默认显示配置面板
    console.log(`🔧 [ComponentRegistry-Fix] 默认策略: 显示配置面板`)
    return true
  } catch (error) {
    console.error(`❌ [ComponentRegistry-Fix] 配置检查出错`, { componentId, error })
    return true
  }
}

/**
 * 修复后的数据源配置显示检查函数
 */
const shouldShowDataSourceConfig = (componentId: string, widget?: any): boolean => {
  try {
    console.log(`🔍 [ComponentRegistry-Fix] 检查数据源配置显示条件`, {
      componentId,
      widgetType: widget?.type,
      hasCard2Definition: !!widget?.metadata?.card2Definition
    })

    // 检查Card2.1组件的数据需求
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      const hasDataNeeds = !!(
        card2Definition.dataRequirements?.dataFields?.length > 0 ||
        card2Definition.dataRequirements?.primaryData ||
        card2Definition.dataSources?.length > 0
      )
      
      console.log(`📊 [ComponentRegistry-Fix] Card2数据需求检查结果`, {
        componentType: widget.type,
        hasDataFields: !!card2Definition.dataRequirements?.dataFields?.length,
        hasPrimaryData: !!card2Definition.dataRequirements?.primaryData,
        hasDataSources: !!card2Definition.dataSources?.length,
        决策: hasDataNeeds ? '显示数据源' : '隐藏数据源'
      })
      
      return hasDataNeeds
    }

    // 基于组件类型判断
    if (widget?.type) {
      // 已知不需要数据源的组件
      const noDataSourceComponents = ['simple-display', 'access-num', 'alarm-info']
      if (noDataSourceComponents.includes(widget.type)) {
        console.log(`❌ [ComponentRegistry-Fix] 已知无数据源组件: ${widget.type}`)
        return false
      }

      // 已知需要数据源的组件
      const dataSourceComponents = ['dual-data-display', 'triple-data-display']
      if (dataSourceComponents.includes(widget.type)) {
        console.log(`✅ [ComponentRegistry-Fix] 已知需数据源组件: ${widget.type}`)
        return true
      }
    }

    // 默认不显示数据源配置
    console.log(`❌ [ComponentRegistry-Fix] 未知组件，默认隐藏数据源`)
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry-Fix] 数据源配置检查出错`, { componentId, error })
    return false
  }
}

/**
 * 配置层级注册表
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
    visible: true,
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

/**
 * 修复后的配置层级获取函数
 */
export const getVisibleConfigLayers = (componentId?: string, widget?: any): ConfigLayerDefinition[] => {
  let layers = Object.values(configLayerRegistry).filter(layer => layer.visible)

  console.log(`🔧 [ComponentRegistry-Fix] 开始配置层级检查`, {
    componentId,
    widgetType: widget?.type,
    totalLayers: layers.length
  })

  if (componentId) {
    layers = layers.filter(layer => {
      if (layer.name === 'dataSource') {
        const shouldShow = shouldShowDataSourceConfig(componentId, widget)
        console.log(`📊 [ComponentRegistry-Fix] 数据源层级检查: ${shouldShow}`)
        return shouldShow
      }
      if (layer.name === 'component') {
        const shouldShow = shouldShowComponentConfig(componentId, widget)
        console.log(`🔧 [ComponentRegistry-Fix] 组件层级检查: ${shouldShow}`)
        return shouldShow
      }
      return true
    })
  }

  console.log(`✅ [ComponentRegistry-Fix] 最终可见层级`, {
    layerNames: layers.map(l => l.name),
    layerCount: layers.length
  })

  return layers.sort((a, b) => a.order - b.order)
}

export const getConfigLayer = (layerName: string): ConfigLayerDefinition | undefined => {
  return configLayerRegistry[layerName]
}