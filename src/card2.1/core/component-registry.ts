/**
 * Card2.1 组件注册表
 * 提供组件定义的统一管理和查询服务
 * 支持 settingConfig 的自动属性暴露注册
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import type { ComponentSettingConfig } from '@/card2.1/types/setting-config'
import { getUserAuthorityFromStorage, hasComponentPermission } from '@/card2.1/core/permission-utils'
// 🔥 简化：移除过度复杂的属性暴露系统

/**
 * 组件注册表类
 * 负责管理所有 Card2.1 组件的定义信息
 */
// 🔧 修复：端口隔离的状态管理
const getPortId = (): string => {
  try {
    return `${window.location.protocol}//${window.location.host}`
  } catch {
    // 在SSR或测试环境中的fallback
    return 'default'
  }
}

// 存储每个端口的组件定义
const portDefinitions = new Map<string, Map<string, ComponentDefinition>>()

/**
 * 获取当前端口的组件定义Map
 */
function getPortDefinitions(): Map<string, ComponentDefinition> {
  const portId = getPortId()

  if (!portDefinitions.has(portId)) {
    const definitions = new Map<string, ComponentDefinition>()
    portDefinitions.set(portId, definitions)
    if (process.env.NODE_ENV === 'development') {
    }
  }

  return portDefinitions.get(portId)!
}

export class ComponentRegistry {
  private static get definitions(): Map<string, ComponentDefinition> {
    return getPortDefinitions()
  }

  /**
   * 注册组件定义
   * @param definition 组件定义
   */
  static register(definition: ComponentDefinition): void {
    // 🔥 修复：同步权限检查，防止竞态条件
    const userAuthority = getUserAuthorityFromStorage()
    const permission = definition.permission || '不限'

    if (!hasComponentPermission(permission as any, userAuthority)) {
      console.warn(`🚫 [ComponentRegistry] 拦截未授权注册: ${definition.type} (需要${permission}, 用户${userAuthority})`)
      return // 直接返回，不注册
    }

    console.log(`📝 [ComponentRegistry] 注册组件: ${definition.type} (权限: ${definition.permission})`)

    if (process.env.NODE_ENV === 'development') {
    }

    this.definitions.set(definition.type, definition)

    // 🔥 修复：注册组件时同时注册属性暴露，确保基础配置属性可见
    this.registerComponentPropertyExposure(definition).catch(error => {
      console.error(`❌ [ComponentRegistry] 注册组件属性暴露失败`, { type: definition.type, error })
    })
  }

  /**
   * 🔒 注册组件的属性暴露白名单
   * 确保组件的属性暴露配置被正确注册到管理器中
   */
  private static async registerComponentPropertyExposure(definition: ComponentDefinition): Promise<void> {
    try {
      // 🔒 动态导入属性暴露管理器
      const { propertyExposureManager, createPropertyWhitelist } = await import('@/card2.1/core/PropertyExposureManager')

      // 如果组件定义包含属性白名单，则注册到管理器
      if (definition.propertyWhitelist) {
        propertyExposureManager.registerComponentWhitelist(definition.type, definition.propertyWhitelist)

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔒 [ComponentRegistry] 成功注册属性白名单: ${definition.type}`, {
            propertiesCount: Object.keys(definition.propertyWhitelist.properties).length,
            enabled: definition.propertyWhitelist.enabled
          })
        }
      } else {
        // 🔥 为没有配置属性白名单的组件创建默认白名单（包含全局基础属性）
        const defaultWhitelist = createPropertyWhitelist({
          // 空的组件特定属性，全局基础属性将由 PropertyExposureManager 自动添加
        })

        propertyExposureManager.registerComponentWhitelist(definition.type, defaultWhitelist)

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔒 [ComponentRegistry] 为组件 ${definition.type} 创建默认属性白名单（包含全局基础属性）`, {
            propertiesCount: Object.keys(defaultWhitelist.properties).length,
            包含全局基础属性: ['deviceId', 'metricsList'].every(prop => prop in defaultWhitelist.properties)
          })
        }
      }
    } catch (error) {
      console.error(`❌ [ComponentRegistry] 注册属性白名单失败: ${definition.type}`, error)
    }
  }

  /**
   * 获取组件定义
   * @param componentType 组件类型
   * @returns 组件定义或 undefined
   */
  static get(componentType: string): ComponentDefinition | undefined {
    const definition = this.definitions.get(componentType)

    if (!definition) {
      // 未找到组件定义
    }

    return definition
  }

  /**
   * 获取所有组件定义
   * @returns 所有组件定义数组
   */
  static getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values())
  }

  /**
   * 检查组件是否已注册
   * @param componentType 组件类型
   * @returns 是否已注册
   */
  static has(componentType: string): boolean {
    return this.definitions.has(componentType)
  }

  /**
   * 获取组件的数据源键列表
   * @param componentType 组件类型
   * @returns 数据源键数组
   */
  static getDataSourceKeys(componentType: string): string[] {
    const definition = this.get(componentType)
    let keys: string[] = []

    if (definition?.dataSources) {
      // 处理数组格式的 dataSources (新的三文件架构)
      if (Array.isArray(definition.dataSources)) {
        keys = definition.dataSources.map(ds => ds.key)
      }
      // 处理对象格式的 dataSources (旧的架构兼容)
      else if (typeof definition.dataSources === 'object') {
        keys = Object.keys(definition.dataSources)
      }
    }

    return keys
  }

  /**
   * 获取组件的静态参数键列表
   * @param componentType 组件类型
   * @returns 静态参数键数组
   */
  static getStaticParamKeys(componentType: string): string[] {
    const definition = this.get(componentType)
    const keys = definition?.staticParams ? Object.keys(definition.staticParams) : []
    return keys
  }

  /**
   * 获取组件的数据源配置
   * @param componentType 组件类型
   * @returns 数据源配置对象
   */
  static getDataSourcesConfig(componentType: string): Record<string, any> | undefined {
    const definition = this.get(componentType)
    return definition?.dataSources
  }

  /**
   * 检查组件是否支持多数据源
   * @param componentType 组件类型
   * @returns 是否支持多数据源
   */
  static isMultiDataSource(componentType: string): boolean {
    const dataSourceKeys = this.getDataSourceKeys(componentType)
    const isMulti = dataSourceKeys.length > 1
    return isMulti
  }

  /**
   * 获取注册表统计信息
   * @returns 统计信息
   */
  static getStats(): {
    totalComponents: number
    multiDataSourceComponents: number
    componentTypes: string[]
  } {
    const componentTypes = Array.from(this.definitions.keys())
    const multiDataSourceComponents = componentTypes.filter(type => this.isMultiDataSource(type))

    return {
      totalComponents: componentTypes.length,
      multiDataSourceComponents: multiDataSourceComponents.length,
      componentTypes
    }
  }

  /**
   * 清空注册表（主要用于测试）
   */
  static clear(): void {
    this.definitions.clear()
  }

  /**
   * 批量注册组件
   * @param definitions 组件定义数组
   */
  static registerBatch(definitions: ComponentDefinition[]): void {
    definitions.forEach(definition => {
      this.register(definition)
    })
  }

  /**
   * 🔥 简化：移除复杂的 settingConfig 注册逻辑
   * @param settingConfig 组件设置配置
   */
  static registerSettingConfig<T extends Record<string, any>>(settingConfig: ComponentSettingConfig<T>): void {
    try {
      // 🔥 简化：直接存储配置，移除复杂的属性暴露系统
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`❌ [ComponentRegistry] settingConfig 注册失败:`, error)
    }
  }

  /**
   * 🔥 新增：批量注册 settingConfig
   * @param settingConfigs settingConfig 数组
   */
  static registerSettingConfigs(settingConfigs: ComponentSettingConfig<any>[]): void {
    settingConfigs.forEach(config => {
      this.registerSettingConfig(config)
    })
  }

  /**
   * 🔥 新增：注册完整的组件（包括定义和 settingConfig）
   * 🚀 优化1：自动使用增强的属性注册机制
   * @param definition 组件定义
   * @param settingConfig 设置配置（可选）
   */
  static async registerComponent<T extends Record<string, any>>(
    definition: ComponentDefinition,
    settingConfig?: ComponentSettingConfig<T>
  ): Promise<void> {
    // 注册组件定义（已包含属性暴露注册）
    this.register(definition)

    // 🚀 如果提供了settingConfig，注册设置配置
    if (settingConfig) {
      try {
        // 🔥 简化：移除复杂的属性自动注册系统
        if (process.env.NODE_ENV === 'development') {
        }
      } catch (error) {
        console.error(`[ComponentRegistry] settingConfig属性注册失败`, {
          componentType: definition.type,
          error: error instanceof Error ? error.message : error
        })
      }
    }
  }
}

/**
 * 组件注册表接口（用于依赖注入等场景）
 */
export interface IComponentRegistry {
  register(definition: ComponentDefinition): void
  get(componentType: string): ComponentDefinition | undefined
  getAll(): ComponentDefinition[]
  has(componentType: string): boolean
  getDataSourceKeys(componentType: string): string[]
  getStaticParamKeys(componentType: string): string[]
  isMultiDataSource(componentType: string): boolean
  registerSettingConfig<T extends Record<string, any>>(settingConfig: ComponentSettingConfig<T>): void
  registerSettingConfigs(settingConfigs: ComponentSettingConfig<any>[]): void
  registerComponent<T extends Record<string, any>>(
    definition: ComponentDefinition,
    settingConfig?: ComponentSettingConfig<T>
  ): void
}

/**
 * 默认组件注册表实例
 */
export const componentRegistry: IComponentRegistry = ComponentRegistry

/**
 * 组件注册装饰器（可选，用于自动注册）
 */
export function RegisterComponent(definition: ComponentDefinition) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // 自动注册组件
    ComponentRegistry.register(definition)
    return constructor
  }
}

// 导出类型
export type { ComponentDefinition }
