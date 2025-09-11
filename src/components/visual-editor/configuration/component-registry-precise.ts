/**
 * 组件配置显示逻辑 - 精准模式
 * 基于实际settingConfig.ts存在情况的精确判断
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
 * 精准的组件配置显示检查函数
 * 基于实际settingConfig.ts文件存在情况
 */
const shouldShowComponentConfig = (componentId: string, widget?: any): boolean => {
  try {
    console.log(`🔍 [ComponentRegistry-Precise] 检查组件配置显示条件`, {
      componentId,
      widgetType: widget?.type,
      hasMetadata: !!widget?.metadata,
      hasCard2Definition: !!widget?.metadata?.card2Definition
    })

    // 精准策略：基于实际settingConfig.ts文件存在情况
    if (widget?.type) {
      // ✅ 确认有settingConfig.ts的组件（应该显示配置）
      const testComponentsWithConfig = [
        'simple-display',      // /card2.1/components/test/simple-display/settingConfig.ts - 7个配置项
        'dual-data-display',   // /card2.1/components/test/dual-data-display/settingConfig.ts - 9个配置项  
        'triple-data-display', // /card2.1/components/test/triple-data-display/settingConfig.ts - 11个配置项
      ]
      
      if (testComponentsWithConfig.includes(widget.type)) {
        console.log(`✅ [ComponentRegistry-Precise] 确认有settingConfig的组件: ${widget.type}`)
        return true
      }

      // ❌ 确认没有settingConfig.ts的组件（不应该显示配置）
      const componentsWithoutSettingConfig = [
        'access-num',    // 只有AccessNumCard.vue，无settingConfig.ts
        'alarm-info'     // 只有AlarmInfoCard.vue，无settingConfig.ts
      ]
      
      if (componentsWithoutSettingConfig.includes(widget.type)) {
        console.log(`❌ [ComponentRegistry-Precise] 确认无settingConfig的组件: ${widget.type}`)
        return false
      }
    }

    // 检查Card2.1组件定义中的配置信息
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      
      // 检查是否有defaultConfig（来自settingConfig）
      const hasDefaultConfig = !!card2Definition.defaultConfig
      
      // 检查是否有config.properties
      const hasConfigProps = !!(
        card2Definition.config?.properties && 
        Object.keys(card2Definition.config.properties).length > 0
      )
      
      const shouldShow = hasDefaultConfig || hasConfigProps
      
      console.log(`📋 [ComponentRegistry-Precise] Card2定义检查结果`, {
        componentType: widget.type,
        hasDefaultConfig,
        hasConfig: !!card2Definition.config,
        hasProperties: hasConfigProps,
        propertiesCount: Object.keys(card2Definition.config?.properties || {}).length,
        决策: shouldShow ? '显示配置' : '隐藏配置(精准策略)'
      })
      
      return shouldShow
    }

    // 对于未知组件，采用保守策略 - 默认不显示
    console.log(`🤔 [ComponentRegistry-Precise] 未知组件类型，默认不显示配置: ${widget?.type || 'unknown'}`)
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry-Precise] 配置检查出错`, { componentId, error })
    return false
  }
}

/**
 * 精准的数据源配置显示检查函数
 */
const shouldShowDataSourceConfig = (componentId: string, widget?: any): boolean => {
  try {
    console.log(`🔍 [ComponentRegistry-Precise] 检查数据源配置显示条件`, {
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
      
      console.log(`📊 [ComponentRegistry-Precise] Card2数据需求检查结果`, {
        componentType: widget.type,
        hasDataFields: !!card2Definition.dataRequirements?.dataFields?.length,
        hasPrimaryData: !!card2Definition.dataRequirements?.primaryData,
        hasDataSources: !!card2Definition.dataSources?.length,
        决策: hasDataNeeds ? '显示数据源' : '隐藏数据源'
      })
      
      return hasDataNeeds
    }

    // 基于组件类型的精准判断
    if (widget?.type) {
      // 已知不需要数据源的组件
      const noDataSourceComponents = ['simple-display', 'access-num,    // 只有AccessNumCard.vue，无settingConfig.ts
        alarm-info,     // 只有AlarmInfoCard.vue，无settingConfig.ts
        alarm-count     // 统计组件，不需要用户配置']
      if (noDataSourceComponents.includes(widget.type)) {
        console.log(`❌ [ComponentRegistry-Precise] 确认无数据源组件: ${widget.type}`)
        return false
      }

      // 已知需要数据源的组件
      if (dataSourceComponents.includes(widget.type)) {
        console.log(`✅ [ComponentRegistry-Precise] 确认需数据源组件: ${widget.type}`)
        return true
      }
    }

    // 检查传统组件数据需求
    const componentType = widget?.type || 'unknown'
    const traditionalDataRequirements = getComponentDataRequirements(componentType)

    if (traditionalDataRequirements) {
      const hasDataSources = !!(traditionalDataRequirements.dataSources?.length > 0)
      console.log(`🔍 [ComponentRegistry-Precise] 传统数据需求检查`, {
        componentType,
        hasDataSources,
        dataSources: traditionalDataRequirements.dataSources
      })
      return hasDataSources
    }

    // 默认不显示数据源配置
    console.log(`❌ [ComponentRegistry-Precise] 未知组件，默认隐藏数据源`)
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry-Precise] 数据源配置检查出错`, { componentId, error })
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
 * 精准的配置层级获取函数
 */
export const getVisibleConfigLayers = (componentId?: string, widget?: any): ConfigLayerDefinition[] => {
  let layers = Object.values(configLayerRegistry).filter(layer => layer.visible)

  console.log(`🔧 [ComponentRegistry-Precise] 开始配置层级检查`, {
    componentId,
    widgetType: widget?.type,
    totalLayers: layers.length
  })

  if (componentId) {
    layers = layers.filter(layer => {
      if (layer.name === 'dataSource') {
        const shouldShow = shouldShowDataSourceConfig(componentId, widget)
        console.log(`📊 [ComponentRegistry-Precise] 数据源层级检查: ${shouldShow}`)
        return shouldShow
      }
      if (layer.name === 'component') {
        const shouldShow = shouldShowComponentConfig(componentId, widget)
        console.log(`🔧 [ComponentRegistry-Precise] 组件层级检查: ${shouldShow}`)
        return shouldShow
      }
      return true
    })
  }

  console.log(`✅ [ComponentRegistry-Precise] 最终可见层级`, {
    layerNames: layers.map(l => l.name),
    layerCount: layers.length,
    componentType: widget?.type
  })

  return layers.sort((a, b) => a.order - b.order)
}

export const getConfigLayer = (layerName: string): ConfigLayerDefinition | undefined => {
  return configLayerRegistry[layerName]
}