/**
 * 数据源中心
 * 负责数据源的注册、管理和服务提供
 * 实现配置驱动的动态数据源重构方案的核心组件
 */

import type { DataSourceInfo } from './types'

export interface DataSourceSubscription {
  /** 取消订阅的方法 */
  unsubscribe: () => void
  /** 订阅ID */
  id: string
}

export interface DataSourceService {
  /** 获取数据源信息 */
  getInfo(): DataSourceInfo

  /** 获取当前数据 */
  getCurrentData(): Promise<any>

  /** 订阅数据变化 */
  subscribe(callback: (data: any) => void): DataSourceSubscription

  /** 验证数据源配置 */
  validateConfig(config: any): { valid: boolean; errors: string[] }

  /** 更新数据源配置 */
  updateConfig(config: any): void

  /** 销毁数据源 */
  destroy(): void
}

/**
 * 数据源中心管理器
 * 实现数据源的统一注册、发现和服务提供
 */
export class DataSourceCenter {
  private dataSources = new Map<string, DataSourceService>()
  private dataSourceTypes = new Map<string, new (...args: any[]) => DataSourceService>()

  /**
   * 注册数据源类型
   * @param type 数据源类型名称
   * @param serviceClass 数据源服务类
   */
  registerDataSourceType(type: string, serviceClass: new (...args: any[]) => DataSourceService) {
    this.dataSourceTypes.set(type, serviceClass)
    console.log(`📊 [DataSourceCenter] 注册数据源类型: ${type}`)
  }

  /**
   * 创建数据源实例
   * @param id 数据源ID
   * @param type 数据源类型
   * @param config 数据源配置
   */
  createDataSource(id: string, type: string, config: any): DataSourceService | null {
    const ServiceClass = this.dataSourceTypes.get(type)
    if (!ServiceClass) {
      console.error(`❌ [DataSourceCenter] 未知的数据源类型: ${type}`)
      return null
    }

    try {
      const service = new ServiceClass(id, config)
      this.dataSources.set(id, service)
      console.log(`✅ [DataSourceCenter] 创建数据源实例: ${id} (${type})`)
      return service
    } catch (error) {
      console.error(`❌ [DataSourceCenter] 创建数据源失败: ${id}`, error)
      return null
    }
  }

  /**
   * 获取数据源服务
   * @param id 数据源ID
   */
  getDataSource(id: string): DataSourceService | null {
    return this.dataSources.get(id) || null
  }

  /**
   * 移除数据源
   * @param id 数据源ID
   */
  removeDataSource(id: string): void {
    const service = this.dataSources.get(id)
    if (service) {
      try {
        service.destroy()
      } catch (error) {
        console.warn(`⚠️ [DataSourceCenter] 销毁数据源时出错: ${id}`, error)
      }
      this.dataSources.delete(id)
      console.log(`🗑️ [DataSourceCenter] 移除数据源: ${id}`)
    }
  }

  /**
   * 获取所有数据源信息
   */
  getAllDataSources(): DataSourceInfo[] {
    const result: DataSourceInfo[] = []

    for (const [id, service] of this.dataSources.entries()) {
      try {
        result.push(service.getInfo())
      } catch (error) {
        console.warn(`⚠️ [DataSourceCenter] 获取数据源信息失败: ${id}`, error)
      }
    }

    return result
  }

  /**
   * 获取支持的数据源类型
   */
  getSupportedTypes(): string[] {
    return Array.from(this.dataSourceTypes.keys())
  }

  /**
   * 订阅数据源变化
   * @param dataSourceId 数据源ID
   * @param callback 数据变化回调
   */
  subscribeToDataSource(dataSourceId: string, callback: (data: any) => void): DataSourceSubscription | null {
    const service = this.getDataSource(dataSourceId)
    if (!service) {
      console.error(`❌ [DataSourceCenter] 数据源不存在: ${dataSourceId}`)
      return null
    }

    try {
      return service.subscribe(callback)
    } catch (error) {
      console.error(`❌ [DataSourceCenter] 订阅数据源失败: ${dataSourceId}`, error)
      return null
    }
  }

  /**
   * 清理所有数据源
   */
  cleanup(): void {
    console.log(`🧹 [DataSourceCenter] 开始清理 ${this.dataSources.size} 个数据源`)

    for (const [id, service] of this.dataSources.entries()) {
      try {
        service.destroy()
      } catch (error) {
        console.warn(`⚠️ [DataSourceCenter] 清理数据源时出错: ${id}`, error)
      }
    }

    this.dataSources.clear()
    console.log(`✅ [DataSourceCenter] 数据源清理完成`)
  }

  /**
   * 验证数据源配置
   * @param type 数据源类型
   * @param config 配置信息
   */
  validateDataSourceConfig(type: string, config: any): { valid: boolean; errors: string[] } {
    const ServiceClass = this.dataSourceTypes.get(type)
    if (!ServiceClass) {
      return {
        valid: false,
        errors: [`未知的数据源类型: ${type}`]
      }
    }

    try {
      // 创建临时实例进行验证
      const tempService = new ServiceClass('temp', config)
      const result = tempService.validateConfig(config)
      tempService.destroy()
      return result
    } catch (error) {
      return {
        valid: false,
        errors: [`数据源配置验证失败: ${error.message}`]
      }
    }
  }
}

// 导出单例
export const dataSourceCenter = new DataSourceCenter()
export default dataSourceCenter
