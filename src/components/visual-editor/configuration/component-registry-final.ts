/**
 * 组件配置显示逻辑 - 最终精准版本
 * 只有test目录下的3个测试组件才显示配置面板
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
 * 精确控制组件配置显示逻辑
 * 只有4个有settingConfig.ts的组件才显示配置面板
 */
const shouldShowComponentConfig = (componentId: string, widget?: any): boolean => {
  try {
    console.log(`🔍 [ComponentRegistry-Final] 检查组件配置显示条件`, {
      componentId,
      widgetType: widget?.type,
      hasMetadata: !!widget?.metadata,
      hasCard2Definition: !!widget?.metadata?.card2Definition
    })

    // 精确匹配：只有这4个有settingConfig.ts文件的组件才显示配置面板
    if (widget?.type) {
      const componentsWithSettingConfig = [
        // 测试组件 (3个)
        'simple-display',
        'dual-data-display', 
        'triple-data-display',
        // 仪表盘组件 (1个)
        'gauge-dashboard-v2'
      ]

      const shouldShow = componentsWithSettingConfig.includes(widget.type)

      console.log(`📋 [ComponentRegistry-Final] 组件配置显示检查`, {
        componentType: widget.type,
        hasSettingConfig: shouldShow,
        允许的组件: componentsWithSettingConfig,
        决策: shouldShow ? '显示配置面板' : '隐藏配置面板(无settingConfig.ts)'
      })

      return shouldShow
    }

    // 对于没有类型的组件，默认不显示配置面板
    console.log(`🤔 [ComponentRegistry-Final] 组件无类型信息，隐藏配置面板`)
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry-Final] 配置检查出错`, { componentId, error })
    return false
  }
}

/**
 * 最终精准的数据源配置显示检查函数
 */
const shouldShowDataSourceConfig = (componentId: string, widget?: any): boolean => {
  try {
    console.log(`🔍 [ComponentRegistry-Final] 检查数据源配置显示条件`, {
      componentId,
      widgetType: widget?.type,
      hasCard2Definition: !!widget?.metadata?.card2Definition
    })

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
        console.log(`❌ [ComponentRegistry-Final] 确认无数据源组件: ${widget.type}`)
        return false
      }

      // ✅ 需要数据源的组件（只有多数据源的test组件）
      const dataSourceComponents = [
        'dual-data-display', // 需要2个数据源
        'triple-data-display' // 需要3个数据源
      ]

      if (dataSourceComponents.includes(widget.type)) {
        console.log(`✅ [ComponentRegistry-Final] 确认需数据源组件: ${widget.type}`)
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

      console.log(`📊 [ComponentRegistry-Final] Card2数据需求检查结果`, {
        componentType: widget.type,
        hasDataFields: !!card2Definition.dataRequirements?.dataFields?.length,
        hasPrimaryData: !!card2Definition.dataRequirements?.primaryData,
        hasDataSources: !!card2Definition.dataSources?.length,
        决策: hasDataNeeds ? '显示数据源' : '隐藏数据源'
      })

      return hasDataNeeds
    }

    // 默认不显示数据源配置
    console.log(`❌ [ComponentRegistry-Final] 未知组件，默认隐藏数据源`)
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

  console.log(`🔧 [ComponentRegistry-Final] 开始配置层级检查`, {
    componentId,
    widgetType: widget?.type,
    totalLayers: layers.length
  })

  if (componentId) {
    layers = layers.filter(layer => {
      if (layer.name === 'dataSource') {
        const shouldShow = shouldShowDataSourceConfig(componentId, widget)
        console.log(`📊 [ComponentRegistry-Final] 数据源层级检查: ${shouldShow}`)
        return shouldShow
      }
      if (layer.name === 'component') {
        const shouldShow = shouldShowComponentConfig(componentId, widget)
        console.log(`🔧 [ComponentRegistry-Final] 组件层级检查: ${shouldShow}`)
        return shouldShow
      }
      return true
    })
  }

  console.log(`✅ [ComponentRegistry-Final] 最终可见层级`, {
    layerNames: layers.map(l => l.name),
    layerCount: layers.length,
    componentType: widget?.type,
    说明: widget?.type?.includes('display') ? '测试组件，显示相应配置' : '统计组件，只显示基础和交互配置'
  })

  return layers.sort((a, b) => a.order - b.order)
}

export const getConfigLayer = (layerName: string): ConfigLayerDefinition | undefined => {
  return configLayerRegistry[layerName]
}
