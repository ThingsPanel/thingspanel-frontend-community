/**
 * JSON数据执行器
 * 负责处理静态JSON数据，直接返回解析后的结果
 */

import type { DataExecutor, ExecutionConfig, ExecutionResult, JsonExecutionConfig } from './DataExecutorFactory'
import type { ParamContext } from '../types/dynamic-params'

/**
 * JSON数据执行器实现
 */
export class JsonDataExecutor implements DataExecutor {
  readonly type = 'json' as const

  /**
   * 执行JSON数据处理
   * @param config 执行配置
   * @param context 参数上下文（可选，JSON执行器通常不需要）
   * @returns 执行结果
   */
  async execute(config: ExecutionConfig, context?: ParamContext): Promise<ExecutionResult> {
    // 类型检查
    if (config.type !== 'json') {
      throw new Error(`JSON执行器只能处理json类型配置，当前类型: ${config.type}`)
    }

    const jsonConfig = config as JsonExecutionConfig
    const startTime = Date.now()

    try {
      console.log('📄 [JsonDataExecutor] 开始处理JSON数据:', jsonConfig)

      // 处理JSON数据
      const result = await this.processJsonData(jsonConfig.data)

      const executionTime = Date.now() - startTime

      console.log('✅ [JsonDataExecutor] JSON数据处理成功', {
        executionTime,
        dataType: typeof result,
        dataSize: JSON.stringify(result).length
      })

      return {
        success: true,
        data: result,
        executionTime,
        timestamp: Date.now(),
        type: 'json'
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime

      console.error('❌ [JsonDataExecutor] JSON数据处理失败:', error)

      return {
        success: false,
        error: error.message || 'JSON数据处理失败',
        executionTime,
        timestamp: Date.now(),
        type: 'json'
      }
    }
  }

  /**
   * 处理JSON数据的核心逻辑
   * @param data 输入数据
   * @returns 处理后的数据
   */
  private async processJsonData(data: any): Promise<any> {
    // 如果数据是字符串，尝试解析为JSON
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        console.log('🔄 [JsonDataExecutor] 成功解析JSON字符串')
        return parsed
      } catch (error) {
        console.warn('⚠️ [JsonDataExecutor] JSON字符串解析失败，返回原始字符串:', error)
        // 如果解析失败，返回原始字符串
        return data
      }
    }

    // 如果数据已经是对象或其他类型，直接返回
    console.log(`📝 [JsonDataExecutor] 直接返回 ${typeof data} 类型数据`)
    return data
  }

  /**
   * 验证JSON数据
   * @param data 待验证的数据
   * @returns 验证结果
   */
  static validateJsonData(data: any): { valid: boolean; errors: string[]; parsedData?: any } {
    const errors: string[] = []
    let parsedData: any = data

    // 如果是字符串，尝试解析
    if (typeof data === 'string') {
      if (!data.trim()) {
        errors.push('JSON字符串不能为空')
        return { valid: false, errors }
      }

      try {
        parsedData = JSON.parse(data)
      } catch (error: any) {
        errors.push(`JSON格式错误: ${error.message}`)
        return { valid: false, errors }
      }
    }

    // 检查数据类型
    if (parsedData === null) {
      // null是有效的JSON值
      console.log('ℹ️ [JsonDataExecutor] 数据为null值')
    } else if (typeof parsedData === 'undefined') {
      errors.push('数据不能为undefined')
    }

    return {
      valid: errors.length === 0,
      errors,
      parsedData
    }
  }

  /**
   * 格式化JSON数据用于显示
   * @param data 数据
   * @param indent 缩进空格数
   * @returns 格式化后的JSON字符串
   */
  static formatJsonData(data: any, indent: number = 2): string {
    try {
      return JSON.stringify(data, null, indent)
    } catch (error) {
      console.warn('⚠️ [JsonDataExecutor] JSON格式化失败:', error)
      return String(data)
    }
  }

  /**
   * 压缩JSON数据
   * @param data 数据
   * @returns 压缩后的JSON字符串
   */
  static compressJsonData(data: any): string {
    try {
      return JSON.stringify(data)
    } catch (error) {
      console.warn('⚠️ [JsonDataExecutor] JSON压缩失败:', error)
      return String(data)
    }
  }

  /**
   * 获取JSON数据的统计信息
   * @param data 数据
   * @returns 统计信息
   */
  static getJsonStats(data: any): {
    type: string
    size: number
    keys?: number
    length?: number
    formatted: string
  } {
    const type = Array.isArray(data) ? 'array' : typeof data
    const formatted = this.formatJsonData(data)
    const size = formatted.length

    const stats: any = {
      type,
      size,
      formatted
    }

    if (Array.isArray(data)) {
      stats.length = data.length
    } else if (data && typeof data === 'object') {
      stats.keys = Object.keys(data).length
    }

    return stats
  }

  /**
   * 创建示例JSON数据
   * @param type 数据类型
   * @returns 示例数据
   */
  static createExampleData(type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' = 'object'): any {
    switch (type) {
      case 'object':
        return {
          name: '张三',
          age: 25,
          email: 'zhangsan@example.com',
          active: true,
          created_at: new Date().toISOString()
        }

      case 'array':
        return [
          { id: 1, name: '项目A', status: 'active' },
          { id: 2, name: '项目B', status: 'completed' },
          { id: 3, name: '项目C', status: 'pending' }
        ]

      case 'string':
        return '这是一个示例字符串'

      case 'number':
        return 42

      case 'boolean':
        return true

      case 'null':
        return null

      default:
        return {}
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // JSON执行器没有需要清理的资源
    console.log('🧹 [JsonDataExecutor] 资源清理完成（无需清理）')
  }
}
