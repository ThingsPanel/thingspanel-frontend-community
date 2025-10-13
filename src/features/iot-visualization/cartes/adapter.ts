/**
 * Card2.1 适配器
 * 将 Card2.1 的 ComponentDefinition 转换为 ICardManifest
 * 实现新旧系统的无缝对接
 */

import type { ComponentDefinition } from '@/card2.1/types'
import type { ICardManifest, StaticParamDefinition, PropertyDefinition } from './interface'
import type { DataSourceRequirement } from '../noyau/types'

/**
 * 将 Card2.1 ComponentDefinition 转换为 ICardManifest
 */
export function adaptCard21ToManifest(definition: ComponentDefinition): ICardManifest {
  return {
    // 基础信息
    type: definition.type,
    name: definition.name,
    description: definition.description,
    icon: definition.icon,
    version: definition.version,
    author: definition.author,

    // 分类和标签
    category: inferCategory(definition),
    tags: definition.tags || [],

    // 数据源需求（直接复用 Card2.1 的定义）
    dataSources: adaptDataSources(definition.dataSources),

    // 静态参数（从 settingConfig 提取）
    staticParams: extractStaticParams(definition),

    // 交互能力
    interactionCapabilities: definition.interactionCapabilities
      ? {
          supportedEvents: definition.interactionCapabilities.supportedEvents,
          availableActions: definition.interactionCapabilities.availableActions,
          watchableProperties: adaptWatchableProperties(
            definition.interactionCapabilities.watchableProperties
          )
        }
      : undefined,

    // 渲染实现
    component: {
      vue: definition.component, // 直接使用 Card2.1 的 Vue 组件
      canvas: undefined, // 未来扩展
      webgl: undefined // 未来扩展
    },

    // 配置组件
    configComponent: definition.configComponent,

    // 默认配置
    defaultConfig: definition.defaultConfig,

    // 默认布局
    defaultLayout: adaptLayout(definition),

    // 权限
    permission: definition.permission,

    // 特性
    features: definition.features || {
      realtime: true,
      dataBinding: true,
      configurable: true,
      resizable: true
    }
  }
}

/**
 * 推断卡片分类
 */
function inferCategory(definition: ComponentDefinition): string {
  // 从路径推断分类（如果有）
  if (definition.type.includes('/')) {
    const parts = definition.type.split('/')
    return parts[0]
  }

  // 从标签推断
  if (definition.tags && definition.tags.length > 0) {
    return definition.tags[0]
  }

  return '通用'
}

/**
 * 适配数据源需求
 */
function adaptDataSources(
  dataSources: ComponentDefinition['dataSources']
): DataSourceRequirement[] | undefined {
  if (!dataSources) return undefined

  if (Array.isArray(dataSources)) {
    // 已经是新格式，直接返回
    return dataSources as DataSourceRequirement[]
  }

  // 如果是旧格式（对象格式），转换为数组格式
  if (typeof dataSources === 'object') {
    return Object.entries(dataSources).map(([key, config]: [string, any]) => ({
      key,
      name: config.name || key,
      description: config.description || '',
      supportedTypes: config.supportedTypes || ['static', 'http', 'websocket'],
      required: config.required !== false,
      example: config.example
    }))
  }

  return undefined
}

/**
 * 提取静态参数（从 settingConfig 中提取非数据源参数）
 */
function extractStaticParams(
  definition: ComponentDefinition
): Record<string, StaticParamDefinition> | undefined {
  const settingConfig = definition.settingConfig

  if (!settingConfig || !Array.isArray(settingConfig)) {
    return undefined
  }

  const staticParams: Record<string, StaticParamDefinition> = {}

  // 过滤出非数据源设置项
  const nonDataSourceSettings = settingConfig.filter(
    setting => setting.type !== 'data-source' && setting.type !== 'data-binding'
  )

  nonDataSourceSettings.forEach(setting => {
    staticParams[setting.field] = {
      name: setting.label,
      description: setting.description,
      type: mapSettingTypeToParamType(setting.type),
      defaultValue: setting.defaultValue,
      required: setting.required !== false,
      options: setting.options
    }
  })

  return Object.keys(staticParams).length > 0 ? staticParams : undefined
}

/**
 * 映射 Setting 类型到参数类型
 */
function mapSettingTypeToParamType(
  settingType: string
): StaticParamDefinition['type'] {
  const typeMap: Record<string, StaticParamDefinition['type']> = {
    input: 'string',
    'input-number': 'number',
    switch: 'boolean',
    'color-picker': 'color',
    select: 'select',
    'select-multiple': 'array',
    slider: 'number',
    textarea: 'string'
  }

  return typeMap[settingType] || 'string'
}

/**
 * 适配可监听属性
 */
function adaptWatchableProperties(
  watchableProperties?: Record<string, any>
): Record<string, PropertyDefinition> | undefined {
  if (!watchableProperties) return undefined

  const result: Record<string, PropertyDefinition> = {}

  Object.entries(watchableProperties).forEach(([key, prop]) => {
    result[key] = {
      type: prop.type || 'string',
      description: prop.description,
      defaultValue: prop.defaultValue,
      readonly: prop.readonly !== false
    }
  })

  return result
}

/**
 * 适配布局信息
 */
function adaptLayout(definition: ComponentDefinition): ICardManifest['defaultLayout'] {
  // 优先使用新的 layout 配置
  if (definition.layout) {
    return {
      width: definition.layout.defaultSize?.width || 200,
      height: definition.layout.defaultSize?.height || 150,
      minWidth: definition.layout.minSize?.width,
      minHeight: definition.layout.minSize?.height,
      maxWidth: definition.layout.maxSize?.width,
      maxHeight: definition.layout.maxSize?.height
    }
  }

  // 兼容旧的 defaultLayout 配置
  if (definition.defaultLayout && 'gridstack' in definition.defaultLayout) {
    const gridstack = definition.defaultLayout.gridstack as any
    return {
      width: (gridstack.w || 3) * 100, // 假设每个网格单位 100px
      height: (gridstack.h || 2) * 100,
      minWidth: gridstack.minW ? gridstack.minW * 100 : undefined,
      minHeight: gridstack.minH ? gridstack.minH * 100 : undefined,
      maxWidth: gridstack.maxW ? gridstack.maxW * 100 : undefined,
      maxHeight: gridstack.maxH ? gridstack.maxH * 100 : undefined
    }
  }

  // 默认值
  return {
    width: 300,
    height: 200,
    minWidth: 100,
    minHeight: 100
  }
}

/**
 * 批量转换 Card2.1 组件定义
 */
export function batchAdaptCard21ToManifest(
  definitions: ComponentDefinition[]
): ICardManifest[] {
  return definitions.map(adaptCard21ToManifest)
}
