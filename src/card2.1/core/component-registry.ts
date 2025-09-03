/**
 * Card2.1 组件注册表
 * 提供组件定义的统一管理和查询服务
 * 支持 settingConfig 的自动属性暴露注册
 */

import type { ComponentDefinition } from './types'
import type { ComponentSettingConfig } from '../types/setting-config'
import { autoRegisterFromSettingConfig } from './property-exposure'

/**
 * 组件注册表类
 * 负责管理所有 Card2.1 组件的定义信息
 */
export class ComponentRegistry {
  private static definitions = new Map<string, ComponentDefinition>()

  /**
   * 注册组件定义
   * @param definition 组件定义
   */
  static register(definition: ComponentDefinition): void {
    this.definitions.set(definition.type, definition)
  }

  /**
   * 获取组件定义
   * @param componentType 组件类型
   * @returns 组件定义或 undefined
   */
  static get(componentType: string): ComponentDefinition | undefined {
    const definition = this.definitions.get(componentType)

    if (!definition) {
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
   * 🔥 新增：从 settingConfig 注册组件的属性暴露配置
   * @param settingConfig 组件设置配置
   */
  static registerSettingConfig<T extends Record<string, any>>(settingConfig: ComponentSettingConfig<T>): void {
    try {
      // 自动注册到属性暴露系统
      autoRegisterFromSettingConfig(settingConfig)
    } catch (error) {}
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
   * @param definition 组件定义
   * @param settingConfig 设置配置（可选）
   */
  static registerComponent<T extends Record<string, any>>(
    definition: ComponentDefinition,
    settingConfig?: ComponentSettingConfig<T>
  ): void {
    // 注册组件定义
    this.register(definition)

    // 如果有 settingConfig，同时注册属性暴露
    if (settingConfig) {
      // 验证组件类型一致性

      this.registerSettingConfig(settingConfig)
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
