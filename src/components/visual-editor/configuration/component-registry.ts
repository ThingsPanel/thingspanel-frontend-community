/**
 * 配置组件注册中心
 * 统一管理各层级的配置组件，告诉ConfigurationPanel使用哪个组件
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
// 导入新的卡片式交互配置组件（来自核心交互系统）
const InteractionCardWizard = defineAsyncComponent(
  () => import('@/core/interaction-system/components/InteractionCardWizard.vue')
)
// 导入简易配置编辑器 (SUBTASK-010)
const SimpleConfigurationEditor = defineAsyncComponent(
  () => import('@/core/data-architecture/components/SimpleConfigurationEditor.vue')
)

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
 * 检查组件是否应该显示数据源配置
 * 如果组件没有定义数据需求，则不显示数据源配置
 */
const shouldShowDataSourceConfig = (componentId: string, widget?: any): boolean => {
  try {
    // 🔥 检查方法0：从widget实例直接获取数据需求信息
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      const hasDataNeeds = !!(
        card2Definition.dataRequirements?.dataFields?.length > 0 ||
        card2Definition.dataRequirements?.primaryData ||
        card2Definition.dataSources?.length > 0
      )

      console.log('🔍 [component-registry] 从widget检查Card2.1组件数据需求:', {
        componentId,
        widgetType: widget.type,
        hasDataFields: !!card2Definition.dataRequirements?.dataFields?.length,
        primaryData: !!card2Definition.dataRequirements?.primaryData,
        hasDataSources: !!card2Definition.dataSources?.length,
        结果: hasDataNeeds
      })

      return hasDataNeeds
    }

    // 🔥 检查方法0.5：从widget类型直接判断
    if (widget?.type) {
      // 已知不需要数据源的组件类型
      const noDataSourceComponents = ['simple-display']
      if (noDataSourceComponents.includes(widget.type)) {
        console.log('🔍 [component-registry] 静态组件不需要数据源:', widget.type)
        return false
      }

      // 已知需要数据源的组件类型
      const dataSourceComponents = ['dual-data-display', 'triple-data-display']
      if (dataSourceComponents.includes(widget.type)) {
        console.log('🔍 [component-registry] 数据组件需要数据源:', widget.type)
        return true
      }
    }

    // 尝试从配置管理器获取组件信息
    const config = configurationManager.getConfiguration(componentId)

    // 🔥 检查方法1：从配置中的组件元数据获取
    if (config?.metadata) {
      // Card2.1 组件的数据需求定义
      const card2Definition = config.metadata.card2Definition
      if (card2Definition?.dataRequirements) {
        const dataRequirements = card2Definition.dataRequirements
        const hasDataNeeds = !!(
          dataRequirements.dataFields?.length > 0 ||
          dataRequirements.primaryData ||
          card2Definition.dataSources?.length > 0
        )

        console.log('🔍 [component-registry] 检查Card2.1组件数据需求:', {
          componentId,
          hasDataFields: !!dataRequirements.dataFields?.length,
          primaryData: !!dataRequirements.primaryData,
          hasDataSources: !!card2Definition.dataSources?.length,
          结果: hasDataNeeds
        })

        return hasDataNeeds
      }

      // 检查组件类型
      const componentType = config.metadata.componentType
      if (componentType) {
        // 已知不需要数据源的组件类型
        const noDataSourceComponents = ['simple-display']
        if (noDataSourceComponents.includes(componentType)) {
          console.log('🔍 [component-registry] 静态组件不需要数据源:', componentType)
          return false
        }

        // 已知需要数据源的组件类型
        const dataSourceComponents = ['dual-data-display', 'triple-data-display']
        if (dataSourceComponents.includes(componentType)) {
          console.log('🔍 [component-registry] 数据组件需要数据源:', componentType)
          return true
        }
      }
    }

    // 🔥 检查方法2：尝试从全局组件注册表获取组件定义（如果可用）
    try {
      // 这需要导入组件注册表
      // import { componentRegistry } from '@/card2.1/core/component-registry'
      // const componentDef = componentRegistry.getComponent(componentType)
      // 但这可能会造成循环依赖，暂时跳过
    } catch (error) {
      // 忽略错误
    }

    // 🔥 检查方法3：传统组件数据需求检查
    const componentType = config?.metadata?.componentType || 'unknown'
    const traditionalDataRequirements = getComponentDataRequirements(componentType)

    if (traditionalDataRequirements) {
      const hasDataSources = !!(traditionalDataRequirements.dataSources?.length > 0)
      console.log('🔍 [component-registry] 检查传统组件数据需求:', {
        componentId,
        componentType,
        hasDataSources,
        dataSources: traditionalDataRequirements.dataSources
      })
      return hasDataSources
    }

    // 🔥 默认策略：如果无法确定，检查是否已有数据源配置
    const hasExistingDataSourceConfig = !!(config?.dataSource?.dataSources?.length > 0 || config?.dataSource?.config)

    if (hasExistingDataSourceConfig) {
      console.log('🔍 [component-registry] 发现已有数据源配置，显示配置面板:', componentId)
      return true
    }

    console.log('⚠️ [component-registry] 无法确定数据需求，默认不显示数据源配置:', {
      componentId,
      componentType: config?.metadata?.componentType
    })
    return false
  } catch (error) {
    console.error('❌ [component-registry] 检查数据源配置失败:', error)
    // 出错时默认不显示，避免不必要的配置面板
    return false
  }
}

/**
 * 获取所有可见的配置层级（按order排序）
 * @param componentId 可选的组件ID，用于检查组件是否有数据源需求
 * @param widget 可选的widget实例，包含更多组件信息
 */
export const getVisibleConfigLayers = (componentId?: string, widget?: any): ConfigLayerDefinition[] => {
  let layers = Object.values(configLayerRegistry).filter(layer => layer.visible)

  // 如果传入了组件ID，检查数据源配置的可见性
  if (componentId) {
    layers = layers.filter(layer => {
      if (layer.name === 'dataSource') {
        return shouldShowDataSourceConfig(componentId, widget)
      }
      return true
    })
  }

  // 如果数据源配置可见且存在，调整顺序使其成为第一个
  const hasDataSource = layers.some(layer => layer.name === 'dataSource')
  if (hasDataSource) {
    layers = layers.sort((a, b) => {
      // 数据源配置排在第一位
      if (a.name === 'dataSource') return -1
      if (b.name === 'dataSource') return 1
      // 其他配置按原有顺序排列
      return a.order - b.order
    })
  } else {
    layers = layers.sort((a, b) => a.order - b.order)
  }

  return layers
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
