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
  async updateComponentExecutor(
    componentId: string, 
    componentType: string, 
    config: any
  ): Promise<DataResult> {
    console.log(`[VisualEditorBridge] 更新组件执行器: ${componentId}`, config)

    // 将旧配置格式转换为新的数据需求格式
    const requirement = this.convertConfigToRequirement(componentId, componentType, config)
    
    // 使用 SimpleDataBridge 执行数据获取
    const result = await simpleDataBridge.executeComponent(requirement)
    
    console.log(`[VisualEditorBridge] 执行结果:`, result)
    
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
      } catch (error) {
        console.error('[VisualEditorBridge] 数据更新回调执行失败:', error)
      }
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
    console.log(`[VisualEditorBridge] 配置转换:`, { componentId, componentType, config })

    const dataSources: DataSourceDefinition[] = []

    // 处理配置中的数据源
    if (config && typeof config === 'object') {
      // 处理多个数据源的情况（如 dataSource1, dataSource2, dataSource3）
      for (const [key, value] of Object.entries(config)) {
        if (key.startsWith('dataSource') && value && typeof value === 'object') {
          const dataSourceConfig = value as any
          
          if (dataSourceConfig.type && dataSourceConfig.enabled !== false) {
            dataSources.push({
              id: key,
              type: dataSourceConfig.type as any,
              config: dataSourceConfig.config || {},
              filterPath: dataSourceConfig.filterPath,
              processScript: dataSourceConfig.processScript
            })
          }
        }
      }

      // 处理单一数据源的情况
      if (dataSources.length === 0 && config.type && config.enabled !== false) {
        dataSources.push({
          id: 'dataSource1',
          type: config.type as any,
          config: config.config || config,
          filterPath: config.filterPath,
          processScript: config.processScript
        })
      }
    }

    console.log(`[VisualEditorBridge] 转换后的数据源:`, dataSources)

    return {
      componentId,
      componentType,
      dataSources,
      enabled: true
    }
  }
}

/**
 * Visual Editor 桥接器单例实例
 * 用于替代原有的 componentExecutorManager
 */
export const visualEditorBridge = new VisualEditorBridge()