/**
 * 配置到执行器适配器
 * 负责将不同格式的配置转换为执行器能理解的标准格式
 */

import type { SimpleDataSourceConfig } from '../types/simple-types'

/**
 * 配置适配器接口
 */
export interface IConfigToExecutorAdapter {
  /**
   * 检查是否支持此配置格式
   */
  canHandle(config: any): boolean

  /**
   * 转换配置为执行器格式
   */
  transform(componentId: string, config: any): SimpleDataSourceConfig | null

  /**
   * 获取适配器名称
   */
  getName(): string
}

/**
 * Visual Editor 数据源绑定适配器
 * 处理来自ConfigurationPanel的dataSourceBindings格式
 */
export class DataSourceBindingsAdapter implements IConfigToExecutorAdapter {
  canHandle(config: any): boolean {
    return !!(config && config.dataSourceBindings && typeof config.dataSourceBindings === 'object')
  }

  transform(componentId: string, config: any): SimpleDataSourceConfig | null {
    if (!this.canHandle(config)) {
      return null
    }

    console.log(`🔄 [DataSourceBindingsAdapter] 转换配置: ${componentId}`, config)

    const dataSources: any[] = []

    Object.entries(config.dataSourceBindings).forEach(([dataSourceKey, binding]: [string, any]) => {
      if (binding.rawData) {
        try {
          // 解析 JSON 数据
          const parsedData = typeof binding.rawData === 'string' ? JSON.parse(binding.rawData) : binding.rawData

          dataSources.push({
            id: dataSourceKey,
            type: 'static',
            config: {
              data: parsedData
            }
          })

          console.log(`✅ [DataSourceBindingsAdapter] 转换数据源: ${dataSourceKey}`, parsedData)
        } catch (error) {
          console.error(`❌ [DataSourceBindingsAdapter] 解析数据失败: ${dataSourceKey}`, error)

          // 提供错误时的默认数据
          dataSources.push({
            id: dataSourceKey,
            type: 'static',
            config: {
              data: { error: 'JSON解析失败', rawData: binding.rawData }
            }
          })
        }
      } else if (binding.config) {
        // 处理其他类型的数据源配置
        dataSources.push({
          id: dataSourceKey,
          type: binding.type || 'static',
          config: binding.config
        })
      }
    })

    if (dataSources.length === 0) {
      console.warn(`⚠️ [DataSourceBindingsAdapter] 没有有效的数据源: ${componentId}`)
      return null
    }

    return {
      id: `${componentId}-executor`,
      componentId,
      dataSources,
      triggers: [],
      enabled: true
    }
  }

  getName(): string {
    return 'DataSourceBindingsAdapter'
  }
}

/**
 * 标准数据源配置适配器
 * 处理标准的数据源系统配置格式
 */
export class StandardDataSourceAdapter implements IConfigToExecutorAdapter {
  canHandle(config: any): boolean {
    return !!(config && config.dataSources && Array.isArray(config.dataSources))
  }

  transform(componentId: string, config: any): SimpleDataSourceConfig | null {
    if (!this.canHandle(config)) {
      return null
    }

    console.log(`🔄 [StandardDataSourceAdapter] 转换配置: ${componentId}`, config)

    return {
      id: config.id || `${componentId}-executor`,
      componentId,
      dataSources: config.dataSources,
      triggers: config.triggers || [],
      enabled: config.enabled !== false
    }
  }

  getName(): string {
    return 'StandardDataSourceAdapter'
  }
}

/**
 * 简单JSON数据适配器
 * 处理简单的JSON对象数据
 */
export class SimpleJsonAdapter implements IConfigToExecutorAdapter {
  canHandle(config: any): boolean {
    return !!(
      config &&
      typeof config === 'object' &&
      !Array.isArray(config) &&
      !config.dataSourceBindings &&
      !config.dataSources
    )
  }

  transform(componentId: string, config: any): SimpleDataSourceConfig | null {
    if (!this.canHandle(config)) {
      return null
    }

    console.log(`🔄 [SimpleJsonAdapter] 转换配置: ${componentId}`, config)

    return {
      id: `${componentId}-executor`,
      componentId,
      dataSources: [
        {
          id: 'main',
          type: 'static',
          config: {
            data: config
          }
        }
      ],
      triggers: [],
      enabled: true
    }
  }

  getName(): string {
    return 'SimpleJsonAdapter'
  }
}

/**
 * Card2.1组件数据源适配器
 * 处理Card2.1组件的dataSources定义格式
 */
export class Card2DataSourceAdapter implements IConfigToExecutorAdapter {
  canHandle(config: any): boolean {
    // 检查是否是Card2.1组件的配置格式
    return !!(config && (config.staticParams || config.dataSources || config.defaultConfig))
  }

  transform(componentId: string, config: any): SimpleDataSourceConfig | null {
    if (!this.canHandle(config)) {
      return null
    }

    console.log(`🔄 [Card2DataSourceAdapter] 转换Card2.1配置: ${componentId}`, config)

    const dataSources: any[] = []

    // 处理 defaultConfig 中的数据源
    if (config.defaultConfig?.dataSources) {
      Object.entries(config.defaultConfig.dataSources).forEach(([key, dataSource]: [string, any]) => {
        dataSources.push({
          id: key,
          type: dataSource.type || 'static',
          config: dataSource.config || dataSource
        })
      })
    }

    // 处理直接的 dataSources 配置
    if (config.dataSources && typeof config.dataSources === 'object') {
      Object.entries(config.dataSources).forEach(([key, dataSource]: [string, any]) => {
        dataSources.push({
          id: key,
          type: dataSource.type || 'static',
          config: dataSource.config || dataSource
        })
      })
    }

    if (dataSources.length === 0) {
      console.warn(`⚠️ [Card2DataSourceAdapter] 没有找到有效的数据源配置: ${componentId}`)
      return null
    }

    return {
      id: `${componentId}-executor`,
      componentId,
      dataSources,
      triggers: [],
      enabled: true
    }
  }

  getName(): string {
    return 'Card2DataSourceAdapter'
  }
}

/**
 * 配置适配器管理器
 * 管理所有配置适配器，自动选择合适的适配器
 */
export class ConfigToExecutorAdapterManager {
  private adapters: IConfigToExecutorAdapter[] = []

  constructor() {
    // 注册默认适配器（优先级从高到低）
    this.registerAdapter(new DataSourceBindingsAdapter())
    this.registerAdapter(new StandardDataSourceAdapter())
    this.registerAdapter(new Card2DataSourceAdapter())
    this.registerAdapter(new SimpleJsonAdapter()) // 最后尝试简单JSON
  }

  /**
   * 注册适配器
   */
  registerAdapter(adapter: IConfigToExecutorAdapter): void {
    this.adapters.push(adapter)
    console.log(`📝 [ConfigAdapterManager] 注册适配器: ${adapter.getName()}`)
  }

  /**
   * 转换配置为执行器格式
   */
  transform(componentId: string, config: any): SimpleDataSourceConfig | null {
    console.log(`🔄 [ConfigAdapterManager] 开始转换配置: ${componentId}`, config)

    if (!config) {
      console.warn(`⚠️ [ConfigAdapterManager] 配置为空: ${componentId}`)
      return null
    }

    // 遍历所有适配器，找到第一个能处理的
    for (const adapter of this.adapters) {
      if (adapter.canHandle(config)) {
        console.log(`✅ [ConfigAdapterManager] 使用适配器: ${adapter.getName()}`)

        try {
          const result = adapter.transform(componentId, config)
          if (result) {
            console.log(`✅ [ConfigAdapterManager] 转换成功: ${componentId}`, result)
            return result
          }
        } catch (error) {
          console.error(`❌ [ConfigAdapterManager] 适配器转换失败: ${adapter.getName()}`, error)
        }
      }
    }

    console.warn(`⚠️ [ConfigAdapterManager] 没有找到合适的适配器: ${componentId}`, config)
    return null
  }

  /**
   * 获取所有注册的适配器信息
   */
  getAdapters(): Array<{ name: string; canHandle: boolean }> {
    return this.adapters.map(adapter => ({
      name: adapter.getName(),
      canHandle: true // 这里可以进一步完善
    }))
  }

  /**
   * 验证配置是否可以被处理
   */
  canHandle(config: any): boolean {
    return this.adapters.some(adapter => adapter.canHandle(config))
  }
}

// 导出全局适配器管理器实例
export const configToExecutorAdapter = new ConfigToExecutorAdapterManager()

export default configToExecutorAdapter
