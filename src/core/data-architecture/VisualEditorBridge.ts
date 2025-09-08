/**
 * Visual Editor 数据桥接器
 * 为 Visual Editor 组件提供新架构的数据执行能力
 * 替代原有的 ComponentExecutorManager 直接依赖
 */

import { simpleDataBridge, type ComponentDataRequirement, type DataResult } from './SimpleDataBridge'
import type { DataSourceDefinition } from './interfaces/IComponentDataManager'

/**
 * Visual Editor 专用的数据桥接器
 * 封装 SimpleDataBridge，提供与旧API兼容的接口
 */
export class VisualEditorBridge {
  private dataUpdateCallbacks = new Map<string, (componentId: string, data: any) => void>()

  /**
   * 更新组件执行器（兼容旧API）
   * @param componentId 组件ID
   * @param componentType 组件类型
   * @param config 数据源配置
   */
  async updateComponentExecutor(componentId: string, componentType: string, config: any): Promise<DataResult> {
    // 将旧配置格式转换为新的数据需求格式
    const requirement = this.convertConfigToRequirement(componentId, componentType, config)

    // 使用 SimpleDataBridge 执行数据获取
    const result = await simpleDataBridge.executeComponent(requirement)
    // 通知数据更新回调
    this.notifyDataUpdate(componentId, result.data)

    return result
  }

  /**
   * 监听数据更新（兼容旧API）
   * @param callback 数据更新回调函数
   */
  onDataUpdate(callback: (componentId: string, data: any) => void): () => void {
    const callbackId = Math.random().toString(36).substring(2, 15)
    this.dataUpdateCallbacks.set(callbackId, callback)

    return () => {
      this.dataUpdateCallbacks.delete(callbackId)
    }
  }

  /**
   * 获取组件当前数据
   * @param componentId 组件ID
   */
  getComponentData(componentId: string): Record<string, any> | null {
    return simpleDataBridge.getComponentData(componentId)
  }

  /**
   * 清除组件数据缓存
   * @param componentId 组件ID
   */
  clearComponentCache(componentId: string): void {
    simpleDataBridge.clearComponentCache(componentId)
  }

  /**
   * 通知数据更新
   * @param componentId 组件ID
   * @param data 数据
   */
  private notifyDataUpdate(componentId: string, data: any): void {
    this.dataUpdateCallbacks.forEach(callback => {
      try {
        callback(componentId, data)
      } catch (error) {}
    })
  }

  /**
   * 将旧的配置格式转换为新的数据需求格式
   * @param componentId 组件ID
   * @param componentType 组件类型
   * @param config 配置对象
   */
  private convertConfigToRequirement(
    componentId: string,
    componentType: string,
    config: any
  ): ComponentDataRequirement {
    const dataSources: DataSourceDefinition[] = []

    // 🔥 关键修复：提取基础配置属性
    let resolvedConfig = config
    let baseConfig: any = null
    
    // 如果配置是 WidgetConfiguration 格式，提取相关部分
    if (config && typeof config === 'object') {
      // 检查是否是新的分层配置格式
      if (config.base || config.dataSource) {
        baseConfig = config.base || {}
        resolvedConfig = {
          // 合并基础配置中的设备属性到主配置中，用于数据源解析
          ...config.dataSource,
          // 将基础配置中的设备属性暴露给数据源使用
          deviceId: baseConfig.deviceId,
          metricsList: baseConfig.metricsList,
          // 保持原有的数据源配置
          ...(config.dataSource || {})
        }
        
        console.log(`🔧 [VisualEditorBridge] 检测到分层配置，提取基础配置`, {
          componentId,
          baseConfig,
          resolvedConfig,
          originalConfig: config
        })
      }
    }

    // 处理配置中的数据源
    if (resolvedConfig && typeof resolvedConfig === 'object') {
      // 🆕 处理新的 DataSourceConfiguration 格式
      if (resolvedConfig.dataSources && Array.isArray(resolvedConfig.dataSources)) {
        resolvedConfig.dataSources.forEach((dataSource: any) => {
          if (dataSource.sourceId && dataSource.dataItems && Array.isArray(dataSource.dataItems)) {
            // 🔥 关键修复：保持数据源的完整性，不要拆分成独立数据源
            // 保持原有的数据源结构，让 MultiLayerExecutorChain 处理多数据项合并
            const processedDataItems = dataSource.dataItems
              .map((dataItem: any, itemIndex: number) => {
                if (dataItem && dataItem.item) {
                  return {
                    item: {
                      type: dataItem.item.type,
                      config: this.convertItemConfig(dataItem.item)
                    },
                    processing: {
                      filterPath: dataItem.processing?.filterPath || '$',
                      customScript: dataItem.processing?.customScript,
                      defaultValue: {}
                    }
                  }
                }
                return null
              })
              .filter(Boolean)

            // 创建单一数据源配置，包含所有数据项和合并策略
            dataSources.push({
              sourceId: dataSource.sourceId,
              dataItems: processedDataItems,
              mergeStrategy: dataSource.mergeStrategy || { type: 'object' }
            })
          }
        })
      }

      // 🆕 处理 rawDataList 结构（来自数据源配置表单）
      else if (resolvedConfig.rawDataList && Array.isArray(resolvedConfig.rawDataList)) {
        resolvedConfig.rawDataList.forEach((item: any, index: number) => {
          if (item && item.type && item.enabled !== false) {
            dataSources.push({
              id: `dataSource${index + 1}`,
              type: item.type as any,
              config: item.config || {},
              filterPath: item.filterPath,
              processScript: item.processScript
            })
          }
        })
      }

      // 处理多个数据源的情况（如 dataSource1, dataSource2, dataSource3）
      if (dataSources.length === 0) {
        for (const [key, value] of Object.entries(resolvedConfig)) {
          if (key.startsWith('dataSource') && value && typeof value === 'object') {
            // 🔥 关键修复：在数据源配置中注入基础配置属性
            const enhancedDataSourceConfig = this.injectBaseConfigToDataSource(value as any, baseConfig)
            const dataSourceConfig = value as any

            if (enhancedDataSourceConfig.type && enhancedDataSourceConfig.enabled !== false) {
              dataSources.push({
                id: key,
                type: enhancedDataSourceConfig.type as any,
                config: enhancedDataSourceConfig.config || {},
                filterPath: enhancedDataSourceConfig.filterPath,
                processScript: enhancedDataSourceConfig.processScript
              })
            }
          }
        }
      }

      // 处理单一数据源的情况
      if (dataSources.length === 0 && resolvedConfig.type && resolvedConfig.enabled !== false) {
        // 🔥 特殊处理 data-source-bindings 类型
        if (resolvedConfig.type === 'data-source-bindings') {
          // 对于data-source-bindings，数据在config的各个dataSourceX字段中
          for (const [key, value] of Object.entries(resolvedConfig)) {
            if (key.startsWith('dataSource') && value && typeof value === 'object') {
              dataSources.push({
                id: key,
                type: resolvedConfig.type as any,
                config: { dataSourceBindings: { [key]: value } }, // 🔥 关键：正确包装数据
                filterPath: undefined,
                processScript: undefined
              })
            }
          }
        } else {
          // 🔥 关键修复：注入基础配置到单一数据源
          const enhancedConfig = this.injectBaseConfigToDataSource(resolvedConfig, baseConfig)
          dataSources.push({
            id: 'dataSource1',
            type: enhancedConfig.type as any,
            config: enhancedConfig.config || enhancedConfig,
            filterPath: enhancedConfig.filterPath,
            processScript: enhancedConfig.processScript
          })
        }
      }
    }

    return {
      componentId,
      componentType,
      dataSources,
      enabled: true
    }
  }

  /**
   * 🔥 关键新增：将基础配置属性注入到数据源配置中
   * 确保 deviceId 和 metricsList 等基础配置能被数据源正确使用
   * @param dataSourceConfig 数据源配置
   * @param baseConfig 基础配置
   */
  private injectBaseConfigToDataSource(dataSourceConfig: any, baseConfig: any): any {
    if (!baseConfig) {
      return dataSourceConfig
    }

    // 创建增强的配置对象
    const enhanced = { ...dataSourceConfig }
    
    // 如果数据源配置中有 config 对象，则注入到 config 中
    if (enhanced.config && typeof enhanced.config === 'object') {
      enhanced.config = {
        ...enhanced.config,
        // 注入基础配置中的设备属性
        ...(baseConfig.deviceId && { deviceId: baseConfig.deviceId }),
        ...(baseConfig.metricsList && { metricsList: baseConfig.metricsList })
      }
    } else {
      // 如果没有 config 对象，直接在顶层注入
      enhanced.deviceId = enhanced.deviceId || baseConfig.deviceId
      enhanced.metricsList = enhanced.metricsList || baseConfig.metricsList
    }

    console.log(`🔧 [VisualEditorBridge] 注入基础配置到数据源`, {
      原始配置: dataSourceConfig,
      基础配置: baseConfig,
      增强配置: enhanced
    })

    return enhanced
  }

  /**
   * 转换数据项配置，处理字段映射
   */
  private convertItemConfig(item: any): any {
    const { type, config } = item

    switch (type) {
      case 'json':
        // JSON类型：jsonString → jsonContent
        return {
          ...config,
          jsonContent: config.jsonString || config.jsonContent
        }

      case 'http':
        // HTTP类型：保持原有字段
        return config

      case 'script':
        // Script类型：script → scriptContent
        return {
          ...config,
          scriptContent: config.script || config.scriptContent
        }

      default:
        return config
    }
  }
}

// 端口隔离的VisualEditorBridge实例管理
const bridgeInstances = new Map<string, VisualEditorBridge>()

/**
 * 获取端口ID（用于多端口开发环境的实例隔离）
 */
function getPortId(): string {
  if (typeof window !== 'undefined') {
    return window.location.port || 'default'
  }
  return 'default'
}

/**
 * 获取当前端口的VisualEditorBridge实例
 * 确保不同端口使用独立的桥接器实例，避免数据回调干扰
 */
export function getVisualEditorBridge(): VisualEditorBridge {
  const portId = getPortId()

  if (!bridgeInstances.has(portId)) {
    bridgeInstances.set(portId, new VisualEditorBridge())
  }

  return bridgeInstances.get(portId)!
}

/**
 * Visual Editor 桥接器单例实例
 * 用于替代原有的 componentExecutorManager
 * @deprecated 使用 getVisualEditorBridge() 替代，以支持端口隔离
 */
export const visualEditorBridge = getVisualEditorBridge()
