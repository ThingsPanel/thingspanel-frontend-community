/**
 * Card2.1 组件注册表
 * 提供组件定义的统一管理和查询服务
 */

import type { ComponentDefinition } from './types'

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
    console.log(`📝 [ComponentRegistry] 注册组件: ${definition.type}`, {
      name: definition.name,
      dataSources: definition.dataSources ? Object.keys(definition.dataSources) : [],
      staticParams: definition.staticParams ? Object.keys(definition.staticParams) : []
    })
    
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
      console.warn(`⚠️ [ComponentRegistry] 未找到组件定义: ${componentType}`)
      console.log(`📋 [ComponentRegistry] 已注册的组件:`, Array.from(this.definitions.keys()))
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
    const keys = definition?.dataSources ? Object.keys(definition.dataSources) : []
    
    console.log(`🔍 [ComponentRegistry] 组件 ${componentType} 的数据源键:`, keys)
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
    
    console.log(`🔍 [ComponentRegistry] 组件 ${componentType} 的静态参数键:`, keys)
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
    
    console.log(`🔍 [ComponentRegistry] 组件 ${componentType} 是否多数据源: ${isMulti} (${dataSourceKeys.length}个数据源)`)
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
    console.log(`🧹 [ComponentRegistry] 清空注册表`)
    this.definitions.clear()
  }
  
  /**
   * 批量注册组件
   * @param definitions 组件定义数组
   */
  static registerBatch(definitions: ComponentDefinition[]): void {
    console.log(`📝 [ComponentRegistry] 批量注册 ${definitions.length} 个组件`)
    
    definitions.forEach(definition => {
      this.register(definition)
    })
    
    console.log(`✅ [ComponentRegistry] 批量注册完成，当前统计:`, this.getStats())
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