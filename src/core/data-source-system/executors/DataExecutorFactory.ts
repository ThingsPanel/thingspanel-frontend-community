/**
 * 数据执行器工厂
 * 负责根据配置类型创建对应的执行器实例
 */

import type { HttpConfiguration, HttpExecutionResult } from '../types'
import type { ParamContext } from '../types/dynamic-params'
import { HttpDataExecutor } from './HttpDataExecutor'
import { JsonDataExecutor } from './JsonDataExecutor'

/**
 * 数据执行器类型
 */
export type DataExecutorType = 'http' | 'json' | 'websocket'

/**
 * 通用执行配置接口
 */
export interface BaseExecutionConfig {
  type: DataExecutorType
  id?: string
  name?: string
}

/**
 * JSON执行配置
 */
export interface JsonExecutionConfig extends BaseExecutionConfig {
  type: 'json'
  data: any
}

/**
 * HTTP执行配置
 */
export interface HttpExecutionConfig extends BaseExecutionConfig {
  type: 'http'
  config: HttpConfiguration
}

/**
 * WebSocket执行配置（暂不实现）
 */
export interface WebSocketExecutionConfig extends BaseExecutionConfig {
  type: 'websocket'
  url: string
  protocols?: string[]
}

/**
 * 联合执行配置类型
 */
export type ExecutionConfig = JsonExecutionConfig | HttpExecutionConfig | WebSocketExecutionConfig

/**
 * 通用执行结果接口
 */
export interface ExecutionResult {
  success: boolean
  data?: any
  error?: string
  executionTime: number
  timestamp: number
  type: DataExecutorType
}

/**
 * 通用数据执行器接口
 */
export interface DataExecutor {
  readonly type: DataExecutorType
  execute(config: ExecutionConfig, context?: ParamContext): Promise<ExecutionResult>
}

/**
 * 数据执行器工厂类
 */
export class DataExecutorFactory {
  private static executors: Map<DataExecutorType, DataExecutor> = new Map()

  /**
   * 注册执行器
   * @param type 执行器类型
   * @param executor 执行器实例
   */
  static register(type: DataExecutorType, executor: DataExecutor): void {
    this.executors.set(type, executor)
    console.log(`✅ [DataExecutorFactory] 注册执行器: ${type}`)
  }

  /**
   * 创建执行器实例
   * @param type 执行器类型
   * @returns 执行器实例
   */
  static create(type: DataExecutorType): DataExecutor | null {
    const executor = this.executors.get(type)

    if (!executor) {
      console.error(`❌ [DataExecutorFactory] 未找到类型为 ${type} 的执行器`)
      return null
    }

    return executor
  }

  /**
   * 直接执行配置
   * @param config 执行配置
   * @param context 参数上下文（可选）
   * @returns 执行结果
   */
  static async execute(config: ExecutionConfig, context?: ParamContext): Promise<ExecutionResult> {
    const executor = this.create(config.type)

    if (!executor) {
      return {
        success: false,
        error: `不支持的执行器类型: ${config.type}`,
        executionTime: 0,
        timestamp: Date.now(),
        type: config.type
      }
    }

    try {
      const result = await executor.execute(config, context)
      console.log(`✅ [DataExecutorFactory] 执行成功: ${config.type}`, result)
      return result
    } catch (error: any) {
      console.error(`❌ [DataExecutorFactory] 执行失败: ${config.type}`, error)
      return {
        success: false,
        error: error.message || '执行失败',
        executionTime: 0,
        timestamp: Date.now(),
        type: config.type
      }
    }
  }

  /**
   * 获取所有已注册的执行器类型
   * @returns 执行器类型列表
   */
  static getSupportedTypes(): DataExecutorType[] {
    return Array.from(this.executors.keys())
  }

  /**
   * 检查是否支持指定类型的执行器
   * @param type 执行器类型
   * @returns 是否支持
   */
  static isSupported(type: DataExecutorType): boolean {
    return this.executors.has(type)
  }

  /**
   * 清空所有已注册的执行器
   */
  static clear(): void {
    this.executors.clear()
    console.log('🧹 [DataExecutorFactory] 清空所有执行器')
  }

  /**
   * 初始化默认执行器
   */
  static initialize(): void {
    console.log('🚀 [DataExecutorFactory] 初始化默认执行器')

    // 注册HTTP执行器
    this.register('http', new HttpDataExecutor())

    // 注册JSON执行器
    this.register('json', new JsonDataExecutor())

    // WebSocket执行器暂不实现
    // this.register('websocket', new WebSocketDataExecutor())

    console.log(`📊 [DataExecutorFactory] 已注册 ${this.executors.size} 个执行器`)
  }
}

// 自动初始化默认执行器
DataExecutorFactory.initialize()
