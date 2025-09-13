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
 * 最终精准的数据源配置显示检查函数
 */
const shouldShowDataSourceConfig = (componentId: string, widget?: any): boolean => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }

    // 基于组件类型的精准判断
    if (widget?.type) {
      // ❌ 不需要数据源的组件（所有静态组件和统计组件）
      const noDataSourceComponents = [
        'simple-display', // 静态展示组件
        'access-num', // 统计组件
        'alarm-info', // 统计组件
        'alarm-count' // 统计组件
      ]

      if (noDataSourceComponents.includes(widget.type)) {
        if (process.env.NODE_ENV === 'development') {
        }
        return false
      }

      // ✅ 需要数据源的组件（只有多数据源的test组件）
      const dataSourceComponents = [
        'dual-data-display', // 需要2个数据源
        'triple-data-display' // 需要3个数据源
      ]

      if (dataSourceComponents.includes(widget.type)) {
        if (process.env.NODE_ENV === 'development') {
        }
        return true
      }
    }

    // 检查Card2.1组件的数据需求
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      const hasDataNeeds = !!(
        card2Definition.dataRequirements?.dataFields?.length > 0 ||
        card2Definition.dataRequirements?.primaryData ||
        card2Definition.dataSources?.length > 0
      )

      if (process.env.NODE_ENV === 'development') {
      }

      return hasDataNeeds
    }

    // 默认不显示数据源配置
    if (process.env.NODE_ENV === 'development') {
    }
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry-Final] 数据源配置检查出错`, { componentId, error })
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
    component: InteractionCardWizard,
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
