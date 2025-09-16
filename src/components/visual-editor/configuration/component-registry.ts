/**
 * 组件配置显示逻辑 - 最终精准版本
 * 只有test目录下的3个测试组件才显示配置面板
 */

import type { Component } from 'vue'

// 导入各层级配置组件 - 使用动态导入避免循环依赖
import { defineAsyncComponent } from 'vue'

// 导入配置管理器用于检查组件数据源需求
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { getComponentDataRequirements } from '@/components/visual-editor/core/component-data-requirements'

// 动态导入组件避免循环依赖问题
const BaseConfigForm = defineAsyncComponent(() => import('@/components/visual-editor/renderers/base/BaseConfigForm.vue'))
const ComponentConfigForm = defineAsyncComponent(() => import('@/components/visual-editor/renderers/base/ComponentConfigForm.vue'))
const InteractionConfigWrapper = defineAsyncComponent(
  () => import('@/components/visual-editor/configuration/InteractionConfigWrapper.vue')
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
 * 精确控制组件配置显示逻辑
 * 只有4个有settingConfig.ts的组件才显示配置面板
 */
const shouldShowComponentConfig = (componentId: string, widget?: any): boolean => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }

    // 检查Card2.1组件是否有configComponent
    if (widget?.metadata?.card2Definition) {
      const hasConfigComponent = !!widget.metadata.card2Definition.configComponent
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ComponentRegistry] ${widget.type} configComponent检查:`, {
          hasConfigComponent,
          configComponent: widget.metadata.card2Definition.configComponent
        })
      }

      return hasConfigComponent
    }

    // 对于传统组件，暂时返回false（可以根据需要扩展）
    if (process.env.NODE_ENV === 'development') {
    }
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry] 配置检查出错`, { componentId, error })
    return false
  }
}

/**
 * 🎯 交互配置显示检查函数
 * 只有声明了交互能力的组件才显示交互配置
 */
const shouldShowInteractionConfig = (componentId: string, widget?: any): boolean => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ComponentRegistry] 检查交互配置显示: ${componentId}`, widget?.type)
    }

    // 检查Card2.1组件的交互能力声明
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      const hasInteractionCapabilities = !!(
        card2Definition.interactionCapabilities &&
        (card2Definition.interactionCapabilities.supportedEvents?.length > 0 ||
         card2Definition.interactionCapabilities.availableActions?.length > 0)
      )

      if (process.env.NODE_ENV === 'development') {
        console.log(`[ComponentRegistry] ${widget.type} 交互能力检查:`, {
          hasInteractionCapabilities,
          supportedEvents: card2Definition.interactionCapabilities?.supportedEvents,
          availableActions: card2Definition.interactionCapabilities?.availableActions
        })
      }

      return hasInteractionCapabilities
    }

    // 对于传统组件，暂时返回false
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ComponentRegistry] 传统组件 ${widget?.type} 不显示交互配置`)
    }
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry] 交互配置检查出错`, { componentId, error })
    return false
  }
}

/**
 * 最终精准的数据源配置显示检查函数
 * 🔥 修复：优先检查Card2.1组件定义，避免被硬编码列表过滤
 */
const shouldShowDataSourceConfig = (componentId: string, widget?: any): boolean => {
  try {
    console.log(`🔍 [shouldShowDataSourceConfig] 开始检查组件:`, {
      componentId,
      widgetType: widget?.type,
      hasWidget: !!widget,
      hasMetadata: !!widget?.metadata,
      hasCard2Definition: !!widget?.metadata?.card2Definition
    })
    
    if (process.env.NODE_ENV === 'development') {
    }

    // 🔥 第一优先级：检查Card2.1组件的数据源定义
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      const hasDataNeeds = !!(
        card2Definition.dataRequirements?.dataFields?.length > 0 ||
        card2Definition.dataRequirements?.primaryData ||
        card2Definition.dataSources?.length > 0
      )

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔥 [shouldShowDataSourceConfig] Card2.1组件 ${widget.type} 数据源检查:`, {
          hasDataRequirements: !!card2Definition.dataRequirements,
          hasDataSources: !!card2Definition.dataSources,
          dataSourcesLength: card2Definition.dataSources?.length || 0,
          hasDataNeeds
        })
      }

      if (hasDataNeeds) {
        return true // Card2.1组件有数据源定义，立即显示
      }
    }

    // 第二优先级：传统组件的硬编码判断
    if (widget?.type) {
      // 明确需要数据源的传统组件
      const dataSourceComponents = [
        'dual-data-display', // 需要2个数据源
        'triple-data-display' // 需要3个数据源
      ]

      if (dataSourceComponents.includes(widget.type)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔥 [shouldShowDataSourceConfig] 传统组件 ${widget.type} 在硬编码列表中，显示数据源配置`)
        }
        return true
      }

      // 明确不需要数据源的组件
      const noDataSourceComponents = [
        'simple-display', // 静态展示组件
        'access-num', // 统计组件
        'alarm-info', // 统计组件
        'alarm-count' // 统计组件
      ]

      if (noDataSourceComponents.includes(widget.type)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔥 [shouldShowDataSourceConfig] 组件 ${widget.type} 在不需要数据源列表中，隐藏数据源配置`)
        }
        return false
      }
    }

    // 默认不显示数据源配置
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔥 [shouldShowDataSourceConfig] 组件 ${widget?.type || 'unknown'} 默认不显示数据源配置`)
    }
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry] 数据源配置检查出错`, { componentId, error })
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
    description: '组件特有配置（只有test组件显示）'
  },
  dataSource: {
    name: 'dataSource',
    label: 'config.tabs.dataSource',
    component: SimpleConfigurationEditor,
    visible: true,
    order: 3,
    description: '数据源配置（只有多数据源test组件显示）'
  },
  interaction: {
    name: 'interaction',
    label: 'config.tabs.interaction',
    component: InteractionConfigWrapper,
    visible: true,
    order: 4,
    description: '组件交互配置（卡片式简洁界面，点击、悬停等交互效果）'
  }
}

/**
 * 最终精准的配置层级获取函数
 */
export const getVisibleConfigLayers = (componentId?: string, widget?: any): ConfigLayerDefinition[] => {
  let layers = Object.values(configLayerRegistry).filter(layer => layer.visible)

  if (process.env.NODE_ENV === 'development') {
  }

  if (componentId) {
    layers = layers.filter(layer => {
      if (layer.name === 'dataSource') {
        const shouldShow = shouldShowDataSourceConfig(componentId, widget)
        if (process.env.NODE_ENV === 'development') {
        }
        return shouldShow
      }
      if (layer.name === 'component') {
        const shouldShow = shouldShowComponentConfig(componentId, widget)
        if (process.env.NODE_ENV === 'development') {
        }
        return shouldShow
      }
      if (layer.name === 'interaction') {
        const shouldShow = shouldShowInteractionConfig(componentId, widget)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[getVisibleConfigLayers] 交互配置显示决策: ${componentId} -> ${shouldShow}`)
        }
        return shouldShow
      }
      return true
    })
  }

  if (process.env.NODE_ENV === 'development') {
  }

  return layers.sort((a, b) => a.order - b.order)
}

export const getConfigLayer = (layerName: string): ConfigLayerDefinition | undefined => {
  return configLayerRegistry[layerName]
}

/**
 * 🔥 手动刷新组件定义
 * 当配置面板打开时调用此函数确保组件定义是最新的
 */
export const refreshComponentDefinitions = async (widget?: any): Promise<boolean> => {
  try {
    if (!widget?.metadata?.card2Definition?.configComponent && widget?.type) {
      console.log(`🔄 [refreshComponentDefinitions] 手动刷新组件: ${widget.type}`)
      
      // 尝试从全局获取组件定义
      const getComponentDefinition = async (type: string) => {
        try {
          // 动态导入以避免循环依赖
          const { getComponentDefinition: getDef } = await import('@/card2.1/components/index')
          return await getDef(type)
        } catch (error) {
          console.error(`❌ [refreshComponentDefinitions] 导入组件定义函数失败:`, error)
          return undefined
        }
      }
      
      const definition = await getComponentDefinition(widget.type)
      if (definition?.configComponent) {
        // 更新widget的metadata（这需要与PanelEditorV2集成）
        console.log(`✅ [refreshComponentDefinitions] 成功刷新组件: ${widget.type}`)
        return true
      }
    }
    return false
  } catch (error) {
    console.error('❌ [refreshComponentDefinitions] 刷新失败:', error)
    return false
  }
}
