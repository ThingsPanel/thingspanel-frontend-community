/**
 * 数据项执行器模块导出
 * 提供统一的执行器访问接口
 */

// 基础类型和抽象类
export type * from './types'
export { DataItemExecutor } from './DataItemExecutor'

// 具体执行器实现
export { JsonItemExecutor } from './JsonItemExecutor'
export { HttpItemExecutor } from './HttpItemExecutor'
export { WebSocketItemExecutor } from './WebSocketItemExecutor'

// 执行器工厂
import { DataItemExecutor } from './DataItemExecutor'
import { JsonItemExecutor } from './JsonItemExecutor'
import { HttpItemExecutor } from './HttpItemExecutor'
import { WebSocketItemExecutor } from './WebSocketItemExecutor'
import type {
  DataItemType,
  ExecutorConfig,
  JsonExecutorConfig,
  HttpExecutorConfig,
  WebSocketExecutorConfig,
  LifecycleCallbacks
} from './types'

/**
 * 执行器工厂类
 * 负责根据配置创建对应的执行器实例
 */
export class ExecutorFactory {
  /**
   * 创建数据项执行器
   * @param config 执行器配置
   * @param callbacks 生命周期回调
   * @returns 执行器实例
   */
  static createExecutor(config: ExecutorConfig, callbacks?: LifecycleCallbacks): DataItemExecutor {
    switch (config.type) {
      case 'json':
        return new JsonItemExecutor(config as JsonExecutorConfig, callbacks)

      case 'http':
        return new HttpItemExecutor(config as HttpExecutorConfig, callbacks)

      case 'websocket':
        return new WebSocketItemExecutor(config as WebSocketExecutorConfig, callbacks)

      default:
        throw new Error(`不支持的执行器类型: ${(config as any).type}`)
    }
  }

  /**
   * 验证执行器配置
   * @param config 执行器配置
   * @returns 是否有效
   */
  static validateConfig(config: ExecutorConfig): boolean {
    try {
      // 基础验证
      if (!config.id || !config.type || !config.name) {
        return false
      }

      // 创建临时执行器进行配置验证
      const tempExecutor = ExecutorFactory.createExecutor(config)
      const isValid = (tempExecutor as any).validateConfig(config)

      // 立即销毁临时执行器
      tempExecutor.dispose()

      return isValid
    } catch (error) {
      console.error('❌ [ExecutorFactory] 配置验证失败:', error)
      return false
    }
  }

  /**
   * 获取支持的执行器类型列表
   */
  static getSupportedTypes(): DataItemType[] {
    return ['json', 'http', 'websocket']
  }

  /**
   * 检查是否支持指定类型
   * @param type 执行器类型
   */
  static isTypeSupported(type: string): type is DataItemType {
    return ExecutorFactory.getSupportedTypes().includes(type as DataItemType)
  }

  /**
   * 创建默认配置
   * @param type 执行器类型
   * @param id 执行器ID
   * @param name 执行器名称
   */
  static createDefaultConfig(type: DataItemType, id: string, name: string): ExecutorConfig {
    const baseConfig = {
      id,
      name,
      type,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    switch (type) {
      case 'json':
        return {
          ...baseConfig,
          type: 'json',
          jsonData: '{}'
        } as JsonExecutorConfig

      case 'http':
        return {
          ...baseConfig,
          type: 'http',
          url: '',
          method: 'GET' as const,
          timeout: 10000,
          retryCount: 3,
          retryInterval: 1000
        } as HttpExecutorConfig

      case 'websocket':
        return {
          ...baseConfig,
          type: 'websocket',
          url: '',
          reconnectInterval: 5000,
          maxReconnectAttempts: 5,
          heartbeatInterval: 30000
        } as WebSocketExecutorConfig

      default:
        throw new Error(`不支持的执行器类型: ${type}`)
    }
  }
}

/**
 * 执行器管理器
 * 负责管理多个执行器实例的生命周期
 */
export class ExecutorManager {
  private executors = new Map<string, DataItemExecutor>()

  /**
   * 添加执行器
   * @param executor 执行器实例
   */
  addExecutor(executor: DataItemExecutor): void {
    const id = executor.getId()

    if (this.executors.has(id)) {
      throw new Error(`执行器ID已存在: ${id}`)
    }

    this.executors.set(id, executor)
    console.log(`📦 [ExecutorManager] 添加执行器: ${id} (${executor.getType()})`)
  }

  /**
   * 移除执行器
   * @param id 执行器ID
   */
  removeExecutor(id: string): boolean {
    const executor = this.executors.get(id)
    if (executor) {
      executor.dispose()
      this.executors.delete(id)
      console.log(`📦 [ExecutorManager] 移除执行器: ${id}`)
      return true
    }
    return false
  }

  /**
   * 获取执行器
   * @param id 执行器ID
   */
  getExecutor(id: string): DataItemExecutor | undefined {
    return this.executors.get(id)
  }

  /**
   * 获取所有执行器
   */
  getAllExecutors(): DataItemExecutor[] {
    return Array.from(this.executors.values())
  }

  /**
   * 根据类型获取执行器
   * @param type 执行器类型
   */
  getExecutorsByType(type: DataItemType): DataItemExecutor[] {
    return this.getAllExecutors().filter(executor => executor.getType() === type)
  }

  /**
   * 启动所有执行器
   */
  async startAll(): Promise<void> {
    const executors = this.getAllExecutors()
    console.log(`🚀 [ExecutorManager] 启动所有执行器 (${executors.length}个)`)

    await Promise.allSettled(executors.map(executor => executor.start()))
  }

  /**
   * 停止所有执行器
   */
  stopAll(): void {
    const executors = this.getAllExecutors()
    console.log(`⏹️ [ExecutorManager] 停止所有执行器 (${executors.length}个)`)

    executors.forEach(executor => {
      try {
        executor.stop()
      } catch (error) {
        console.error(`❌ [ExecutorManager] 停止执行器失败: ${executor.getId()}`, error)
      }
    })
  }

  /**
   * 销毁所有执行器
   */
  dispose(): void {
    const executors = this.getAllExecutors()
    console.log(`🗑️ [ExecutorManager] 销毁所有执行器 (${executors.length}个)`)

    executors.forEach(executor => {
      try {
        executor.dispose()
      } catch (error) {
        console.error(`❌ [ExecutorManager] 销毁执行器失败: ${executor.getId()}`, error)
      }
    })

    this.executors.clear()
  }

  /**
   * 获取管理器统计信息
   */
  getStats(): {
    total: number
    byType: Record<DataItemType, number>
    running: number
    stopped: number
    error: number
  } {
    const executors = this.getAllExecutors()
    const stats = {
      total: executors.length,
      byType: {} as Record<DataItemType, number>,
      running: 0,
      stopped: 0,
      error: 0
    }

    // 初始化类型统计
    ExecutorFactory.getSupportedTypes().forEach(type => {
      stats.byType[type] = 0
    })

    // 统计各种状态
    executors.forEach(executor => {
      const type = executor.getType()
      stats.byType[type]++

      const state = executor.getState().state
      switch (state) {
        case 'running':
          stats.running++
          break
        case 'stopped':
          stats.stopped++
          break
        case 'error':
          stats.error++
          break
      }
    })

    return stats
  }
}
