/**
 * 简化数据桥接器 (SimpleDataBridge)
 * 替代复杂的ComponentExecutorManager，提供轻量级的配置→数据转换
 * 
 * Task 2.1 重构：集成 UnifiedDataExecutor，移除重复的执行逻辑
 * 
 * 设计原则：
 * 1. 职责单一：只做配置到数据的转换
 * 2. 无状态管理：不跟踪执行历史、统计信息
 * 3. 简单直接：移除企业级功能（轮询、连接池等）
 * 4. 事件驱动：通过回调函数与外部系统通信
 * 5. 执行器委托：使用UnifiedDataExecutor进行实际数据获取
 */

// 🆕 Task 2.1: 导入统一数据执行器
import { unifiedDataExecutor, type UnifiedDataConfig, type UnifiedDataResult } from './UnifiedDataExecutor'

// 🧪 Task 2.1: 导入测试文件以确保测试函数在开发环境中可用
if (process.env.NODE_ENV === 'development') {
  import('./UnifiedDataExecutor.test').catch(() => {
    // 忽略导入错误，测试文件是可选的
  })
}

/**
 * 简化的数据源配置
 */
export interface SimpleDataSourceConfig {
  /** 数据源ID */
  id: string
  /** 数据源类型 */
  type: 'static' | 'http'
  /** 配置选项 */
  config: {
    // 静态数据
    data?: any
    // HTTP配置  
    url?: string
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    timeout?: number
    [key: string]: any
  }
}

/**
 * 数据执行结果
 */
export interface DataResult {
  /** 是否成功 */
  success: boolean
  /** 数据内容 */
  data?: any
  /** 错误信息 */
  error?: string
  /** 执行时间戳 */
  timestamp: number
}

/**
 * 组件数据需求
 */
export interface ComponentDataRequirement {
  /** 组件ID */
  componentId: string
  /** 数据源配置列表 */
  dataSources: SimpleDataSourceConfig[]
}

/**
 * 数据更新回调类型
 */
export type DataUpdateCallback = (componentId: string, data: Record<string, any>) => void

/**
 * 简化数据桥接器类
 * 只提供最基本的配置→数据转换功能
 */
export class SimpleDataBridge {
  /** 数据更新回调列表 */
  private callbacks = new Set<DataUpdateCallback>()

  /**
   * 执行组件数据获取
   * @param requirement 组件数据需求
   * @returns 执行结果
   */
  async executeComponent(requirement: ComponentDataRequirement): Promise<DataResult> {
    const startTime = Date.now()

    try {
      console.log(`🚀 [SimpleDataBridge] 开始执行组件数据获取: ${requirement.componentId}`)

      const componentData: Record<string, any> = {}

      // 并行执行所有数据源
      const promises = requirement.dataSources.map(async dataSource => {
        try {
          const result = await this.executeDataSource(dataSource)
          componentData[dataSource.id] = result
          console.log(`✅ [SimpleDataBridge] 数据源执行成功: ${dataSource.id}`)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          componentData[dataSource.id] = null
          console.warn(`⚠️ [SimpleDataBridge] 数据源执行失败: ${dataSource.id} - ${errorMsg}`)
        }
      })

      await Promise.allSettled(promises)

      // 通知数据更新
      this.notifyDataUpdate(requirement.componentId, componentData)

      return {
        success: true,
        data: componentData,
        timestamp: Date.now()
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`❌ [SimpleDataBridge] 组件执行失败: ${requirement.componentId} - ${errorMsg}`)

      return {
        success: false,
        error: errorMsg,
        timestamp: Date.now()
      }
    }
  }

  /**
   * 执行单个数据源
   * Task 2.1 重构：使用 UnifiedDataExecutor 替代重复的执行逻辑
   * @param dataSource 数据源配置
   * @returns 数据结果
   */
  private async executeDataSource(dataSource: SimpleDataSourceConfig): Promise<any> {
    // 转换配置格式到统一执行器格式
    const unifiedConfig: UnifiedDataConfig = this.convertToUnifiedConfig(dataSource)
    
    console.log(`🔄 [SimpleDataBridge] 委托给统一执行器: ${dataSource.id} (${dataSource.type})`)
    
    // 使用统一执行器执行
    const result: UnifiedDataResult = await unifiedDataExecutor.execute(unifiedConfig)
    
    if (result.success) {
      console.log(`✅ [SimpleDataBridge] 统一执行器执行成功: ${dataSource.id}`)
      return result.data
    } else {
      console.error(`❌ [SimpleDataBridge] 统一执行器执行失败: ${dataSource.id} - ${result.error}`)
      throw new Error(result.error || '数据源执行失败')
    }
  }

  /**
   * 🆕 Task 2.1: 转换配置格式到统一执行器格式
   * @param dataSource SimpleDataBridge 的数据源配置
   * @returns UnifiedDataExecutor 的配置格式
   */
  private convertToUnifiedConfig(dataSource: SimpleDataSourceConfig): UnifiedDataConfig {
    const baseConfig: UnifiedDataConfig = {
      id: dataSource.id,
      type: dataSource.type as any, // 类型映射
      enabled: true,
      config: { ...dataSource.config }
    }

    // 根据类型进行特殊处理
    switch (dataSource.type) {
      case 'static':
        // 静态数据：直接使用 data 字段
        break
        
      case 'http':
        // HTTP数据：确保有正确的字段映射
        if (dataSource.config.method) {
          baseConfig.config.method = dataSource.config.method.toUpperCase() as any
        }
        break
        
      default:
        console.warn(`[SimpleDataBridge] 未知数据源类型: ${dataSource.type}，使用默认配置`)
    }

    return baseConfig
  }

  // 🗑️ Task 2.1: 移除重复的执行器实现
  // executeStaticDataSource 和 executeHttpDataSource 已由 UnifiedDataExecutor 统一处理

  /**
   * 通知数据更新
   * @param componentId 组件ID
   * @param data 数据
   */
  private notifyDataUpdate(componentId: string, data: Record<string, any>): void {
    console.log(`📡 [SimpleDataBridge] 通知数据更新: ${componentId}`)
    
    this.callbacks.forEach(callback => {
      try {
        callback(componentId, data)
      } catch (error) {
        console.error(`❌ [SimpleDataBridge] 数据更新回调执行失败:`, error)
      }
    })
  }

  /**
   * 注册数据更新回调
   * @param callback 回调函数
   * @returns 取消注册的函数
   */
  onDataUpdate(callback: DataUpdateCallback): () => void {
    this.callbacks.add(callback)
    console.log(`📝 [SimpleDataBridge] 注册数据更新回调，当前回调数量: ${this.callbacks.size}`)

    return () => {
      this.callbacks.delete(callback)
      console.log(`🗑️ [SimpleDataBridge] 移除数据更新回调，当前回调数量: ${this.callbacks.size}`)
    }
  }

  /**
   * 获取简单统计信息
   */
  getStats() {
    return {
      activeCallbacks: this.callbacks.size,
      timestamp: Date.now()
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.callbacks.clear()
    console.log('🧹 [SimpleDataBridge] 数据桥接器已销毁')
  }
}

/**
 * 导出全局单例实例
 */
export const simpleDataBridge = new SimpleDataBridge()

/**
 * 创建新的数据桥接器实例
 */
export function createSimpleDataBridge(): SimpleDataBridge {
  return new SimpleDataBridge()
}

/**
 * 开发环境自动验证
 * 在控制台输出 Phase 2 架构状态信息
 */
if (import.meta.env.DEV) {
  setTimeout(() => {
    console.log('🚀 [Phase2] SimpleDataBridge 已加载')
    console.log('📊 [Phase2] 架构统计:', simpleDataBridge.getStats())
    console.log('💡 [Phase2] 验证方法: 访问菜单 → 测试 → 编辑器集成测试')
  }, 2000)
}