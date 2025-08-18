/**
 * JSON数据项执行器
 * 处理静态JSON数据，支持数据验证和格式化
 */

import { DataItemExecutor } from './DataItemExecutor'
import type { JsonExecutorConfig, ExecutorConfig, DataItemType, ExecutorError, ExecutorErrorType } from './types'

/**
 * JSON数据项执行器
 * 负责处理静态JSON数据的解析、验证和提供
 */
export class JsonItemExecutor extends DataItemExecutor {
  readonly type: DataItemType = 'json'

  /** JSON执行器专用配置 */
  private jsonConfig: JsonExecutorConfig

  /** 解析后的JSON数据缓存 */
  private parsedJsonCache?: any

  /** JSON数据是否已验证 */
  private isJsonValidated = false

  constructor(config: JsonExecutorConfig, callbacks?: any) {
    super(config, callbacks)
    this.jsonConfig = config
  }

  // ========== 抽象方法实现 ==========

  /**
   * 验证JSON执行器配置
   */
  protected validateConfig(config: ExecutorConfig): boolean {
    if (config.type !== 'json') {
      console.error(`❌ [JsonItemExecutor] 配置类型错误: ${config.type}, 期望: json`)
      return false
    }

    const jsonConfig = config as JsonExecutorConfig

    // 检查必要字段
    if (!jsonConfig.jsonData && jsonConfig.jsonData !== '') {
      console.error(`❌ [JsonItemExecutor] 缺少jsonData配置`)
      return false
    }

    // 验证JSON格式
    try {
      if (jsonConfig.jsonData.trim()) {
        JSON.parse(jsonConfig.jsonData)
      }
    } catch (error) {
      console.error(`❌ [JsonItemExecutor] JSON格式无效:`, error)
      return false
    }

    return true
  }

  /**
   * 执行JSON数据获取
   */
  protected async executeInternal(): Promise<any> {
    console.log(`📄 [JsonItemExecutor] 执行JSON数据解析: ${this.getId()}`)

    const jsonData = this.jsonConfig.jsonData?.trim()

    // 处理空数据情况
    if (!jsonData) {
      console.log(`📄 [JsonItemExecutor] JSON数据为空，返回空对象`)
      return {}
    }

    try {
      // 使用缓存来避免重复解析
      if (!this.isJsonValidated || !this.parsedJsonCache) {
        this.parsedJsonCache = JSON.parse(jsonData)
        this.isJsonValidated = true
        console.log(`📄 [JsonItemExecutor] JSON数据解析成功，缓存已更新`)
      }

      // 返回深拷贝，避免外部修改影响缓存
      return JSON.parse(JSON.stringify(this.parsedJsonCache))
    } catch (error) {
      this.isJsonValidated = false
      this.parsedJsonCache = undefined

      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ [JsonItemExecutor] JSON解析失败: ${this.getId()}`, errorMessage)

      throw new Error(`JSON解析失败: ${errorMessage}`)
    }
  }

  // ========== JSON特有方法 ==========

  /**
   * 更新JSON数据
   * @param jsonData 新的JSON数据字符串
   */
  updateJsonData(jsonData: string): void {
    const oldJsonData = this.jsonConfig.jsonData

    // 验证新的JSON数据
    try {
      if (jsonData.trim()) {
        JSON.parse(jsonData)
      }
    } catch (error) {
      throw new Error(`新的JSON数据格式无效: ${error instanceof Error ? error.message : String(error)}`)
    }

    // 更新配置
    this.jsonConfig.jsonData = jsonData
    this.updateConfig({
      ...this.jsonConfig,
      jsonData,
      updatedAt: new Date().toISOString()
    })

    // 清除缓存，强制重新解析
    this.invalidateCache()

    console.log(`📄 [JsonItemExecutor] JSON数据已更新: ${this.getId()}`)
  }

  /**
   * 获取当前JSON数据字符串
   */
  getJsonData(): string {
    return this.jsonConfig.jsonData || ''
  }

  /**
   * 格式化JSON数据
   * @param indent 缩进空格数，默认为2
   */
  formatJsonData(indent: number = 2): string {
    const jsonData = this.jsonConfig.jsonData?.trim()

    if (!jsonData) {
      return ''
    }

    try {
      const parsed = JSON.parse(jsonData)
      return JSON.stringify(parsed, null, indent)
    } catch (error) {
      console.warn(`⚠️ [JsonItemExecutor] JSON格式化失败: ${this.getId()}`, error)
      return jsonData
    }
  }

  /**
   * 压缩JSON数据（移除空白字符）
   */
  compressJsonData(): string {
    const jsonData = this.jsonConfig.jsonData?.trim()

    if (!jsonData) {
      return ''
    }

    try {
      const parsed = JSON.parse(jsonData)
      return JSON.stringify(parsed)
    } catch (error) {
      console.warn(`⚠️ [JsonItemExecutor] JSON压缩失败: ${this.getId()}`, error)
      return jsonData
    }
  }

  /**
   * 验证JSON数据格式
   */
  validateJsonData(): { isValid: boolean; error?: string; details?: any } {
    const jsonData = this.jsonConfig.jsonData?.trim()

    if (!jsonData) {
      return {
        isValid: true,
        details: { message: '空JSON数据，将返回空对象' }
      }
    }

    try {
      const parsed = JSON.parse(jsonData)
      return {
        isValid: true,
        details: {
          type: Array.isArray(parsed) ? 'array' : typeof parsed,
          keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0,
          size: jsonData.length
        }
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 获取JSON数据统计信息
   */
  getJsonDataStats(): {
    isEmpty: boolean
    isValid: boolean
    type: string
    size: number
    keyCount?: number
    arrayLength?: number
  } {
    const jsonData = this.jsonConfig.jsonData?.trim()

    if (!jsonData) {
      return {
        isEmpty: true,
        isValid: true,
        type: 'empty',
        size: 0
      }
    }

    try {
      const parsed = JSON.parse(jsonData)
      const stats = {
        isEmpty: false,
        isValid: true,
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
        size: jsonData.length
      }

      if (Array.isArray(parsed)) {
        return { ...stats, arrayLength: parsed.length }
      } else if (typeof parsed === 'object' && parsed !== null) {
        return { ...stats, keyCount: Object.keys(parsed).length }
      }

      return stats
    } catch (error) {
      return {
        isEmpty: false,
        isValid: false,
        type: 'invalid',
        size: jsonData.length
      }
    }
  }

  /**
   * 从对象更新JSON数据
   * @param data 要设置的数据对象
   * @param indent 缩进空格数，默认为2
   */
  setJsonDataFromObject(data: any, indent: number = 2): void {
    try {
      const jsonString = JSON.stringify(data, null, indent)
      this.updateJsonData(jsonString)
    } catch (error) {
      throw new Error(`无法将对象序列化为JSON: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 获取解析后的JSON对象
   */
  async getParsedJsonData(): Promise<any> {
    if (!this.isJsonValidated || !this.parsedJsonCache) {
      // 执行一次来更新缓存
      await this.executeInternal()
    }

    return this.parsedJsonCache ? JSON.parse(JSON.stringify(this.parsedJsonCache)) : {}
  }

  // ========== 生命周期重写 ==========

  /**
   * JSON执行器初始化
   */
  protected async performInitialization(): Promise<void> {
    console.log(`📄 [JsonItemExecutor] 初始化JSON执行器: ${this.getId()}`)

    // 预验证JSON数据
    const validation = this.validateJsonData()
    if (!validation.isValid) {
      throw new Error(`JSON数据验证失败: ${validation.error}`)
    }

    // 预解析JSON数据到缓存
    if (this.jsonConfig.jsonData?.trim()) {
      try {
        await this.executeInternal()
        console.log(`📄 [JsonItemExecutor] JSON数据预解析完成: ${this.getId()}`)
      } catch (error) {
        console.error(`❌ [JsonItemExecutor] JSON数据预解析失败: ${this.getId()}`, error)
        throw error
      }
    }
  }

  // ========== 私有方法 ==========

  /**
   * 清除JSON缓存
   */
  private invalidateCache(): void {
    this.isJsonValidated = false
    this.parsedJsonCache = undefined
    console.log(`📄 [JsonItemExecutor] JSON缓存已清除: ${this.getId()}`)
  }

  /**
   * 获取专用配置（类型安全）
   */
  getJsonConfig(): Readonly<JsonExecutorConfig> {
    return { ...this.jsonConfig }
  }
}
