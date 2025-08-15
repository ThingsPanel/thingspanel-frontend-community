/**
 * 主脚本引擎类
 * 整合所有组件，提供统一的脚本执行接口
 */

import type {
  IScriptEngine,
  IScriptExecutor,
  IScriptSandbox,
  IScriptTemplateManager,
  IScriptContextManager,
  ScriptEngineConfig,
  ScriptExecutionResult,
  ScriptConfig
} from './types'
import { ScriptExecutor, defaultScriptConfig } from './executor'
import { ScriptSandbox, defaultSandboxConfig } from './sandbox'
import { ScriptTemplateManager } from './template-manager'
import { ScriptContextManager } from './context-manager'

/**
 * 主脚本引擎实现类
 */
export class ScriptEngine implements IScriptEngine {
  public readonly executor: IScriptExecutor
  public readonly sandbox: IScriptSandbox
  public readonly templateManager: IScriptTemplateManager
  public readonly contextManager: IScriptContextManager

  private config: ScriptEngineConfig

  constructor(config?: Partial<ScriptEngineConfig>) {
    this.config = {
      defaultScriptConfig,
      sandboxConfig: defaultSandboxConfig,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟
      maxConcurrentExecutions: 10,
      enablePerformanceMonitoring: true,
      ...config
    }

    // 初始化各个组件
    this.executor = new ScriptExecutor()
    this.sandbox = new ScriptSandbox(this.config.sandboxConfig)
    this.templateManager = new ScriptTemplateManager()
    this.contextManager = new ScriptContextManager()

    console.log('🚀 [ScriptEngine] 脚本引擎初始化完成')
  }

  /**
   * 快速执行脚本
   */
  async execute<T = any>(code: string, context?: Record<string, any>): Promise<ScriptExecutionResult<T>> {
    console.log('🔧 [ScriptEngine] 执行脚本:', code.substring(0, 100) + (code.length > 100 ? '...' : ''))

    // 创建脚本配置
    const scriptConfig: ScriptConfig = {
      ...this.config.defaultScriptConfig,
      code
    }

    // 创建或获取执行上下文
    let executionContext = undefined
    if (context) {
      executionContext = this.contextManager.createContext('临时上下文', context)
    }

    try {
      const result = await this.executor.execute<T>(scriptConfig, executionContext)

      // 清理临时上下文
      if (executionContext) {
        this.contextManager.deleteContext(executionContext.id)
      }

      console.log('✅ [ScriptEngine] 脚本执行完成:', result.success ? '成功' : '失败')
      return result
    } catch (error) {
      // 清理临时上下文
      if (executionContext) {
        this.contextManager.deleteContext(executionContext.id)
      }

      console.error('❌ [ScriptEngine] 脚本执行异常:', error)
      throw error
    }
  }

  /**
   * 使用模板执行
   */
  async executeTemplate<T = any>(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<ScriptExecutionResult<T>> {
    console.log('📋 [ScriptEngine] 使用模板执行:', templateId, parameters)

    try {
      // 根据模板生成代码
      const code = this.templateManager.generateCode(templateId, parameters)

      // 执行生成的代码
      return await this.execute<T>(code)
    } catch (error) {
      console.error('❌ [ScriptEngine] 模板执行失败:', error)
      throw error
    }
  }

  /**
   * 批量执行脚本
   */
  async executeBatch<T = any>(
    scripts: Array<{ code: string; context?: Record<string, any> }>
  ): Promise<ScriptExecutionResult<T>[]> {
    console.log('📦 [ScriptEngine] 批量执行脚本:', scripts.length, '个')

    const promises = scripts.map(script => this.execute<T>(script.code, script.context))
    return await Promise.all(promises)
  }

  /**
   * 执行脚本并返回流式结果
   */
  async executeStream<T = any>(
    code: string,
    context?: Record<string, any>,
    onUpdate?: (result: Partial<ScriptExecutionResult<T>>) => void
  ): Promise<ScriptExecutionResult<T>> {
    console.log('🌊 [ScriptEngine] 流式执行脚本')

    // 创建脚本配置
    const scriptConfig: ScriptConfig = {
      ...this.config.defaultScriptConfig,
      code
    }

    // 创建执行上下文
    let executionContext = undefined
    if (context) {
      executionContext = this.contextManager.createContext('流式上下文', context)
    }

    try {
      // 如果提供了更新回调，先发送开始状态
      if (onUpdate) {
        onUpdate({
          success: false,
          executionTime: 0,
          logs: [
            {
              level: 'info',
              message: '脚本开始执行...',
              timestamp: Date.now()
            }
          ]
        })
      }

      const result = await this.executor.execute<T>(scriptConfig, executionContext)

      // 发送最终结果
      if (onUpdate) {
        onUpdate(result)
      }

      // 清理上下文
      if (executionContext) {
        this.contextManager.deleteContext(executionContext.id)
      }

      return result
    } catch (error) {
      // 清理上下文
      if (executionContext) {
        this.contextManager.deleteContext(executionContext.id)
      }

      throw error
    }
  }

  /**
   * 验证脚本语法
   */
  validateScript(code: string): { valid: boolean; error?: string } {
    return this.executor.validateSyntax(code)
  }

  /**
   * 检查脚本安全性
   */
  checkScriptSecurity(code: string): { safe: boolean; issues: string[] } {
    return this.sandbox.checkCodeSecurity(code)
  }

  /**
   * 获取执行统计信息
   */
  getExecutionStats() {
    return {
      executor: this.executor.getExecutionStats(),
      templates: {
        total: this.templateManager.getAllTemplates().length,
        byCategory: this.getTemplatesByCategory()
      },
      contexts: {
        total: this.contextManager.getAllContexts().length,
        active: this.contextManager.getAllContexts().filter(
          ctx => Date.now() - ctx.updatedAt < 24 * 60 * 60 * 1000 // 24小时内活跃
        ).length
      }
    }
  }

  /**
   * 获取按分类统计的模板数量
   */
  private getTemplatesByCategory(): Record<string, number> {
    const templates = this.templateManager.getAllTemplates()
    const stats: Record<string, number> = {}

    templates.forEach(template => {
      stats[template.category] = (stats[template.category] || 0) + 1
    })

    return stats
  }

  /**
   * 获取引擎配置
   */
  getConfig(): ScriptEngineConfig {
    return { ...this.config }
  }

  /**
   * 更新引擎配置
   */
  updateConfig(config: Partial<ScriptEngineConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('🔧 [ScriptEngine] 配置已更新')
  }

  /**
   * 预热引擎（执行一些初始化脚本以提高后续性能）
   */
  async warmup(): Promise<void> {
    console.log('🔥 [ScriptEngine] 引擎预热中...')

    const warmupScripts = [
      'return "Hello World"',
      'return Math.random()',
      'return new Date().toISOString()',
      'return [1, 2, 3].map(x => x * 2)'
    ]

    for (const script of warmupScripts) {
      try {
        await this.execute(script)
      } catch (error) {
        console.warn('⚠️ [ScriptEngine] 预热脚本执行失败:', error)
      }
    }

    console.log('✅ [ScriptEngine] 引擎预热完成')
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    console.log('🧹 [ScriptEngine] 清理引擎资源...')

    // 清理所有上下文
    const contexts = this.contextManager.getAllContexts()
    contexts.forEach(context => {
      this.contextManager.deleteContext(context.id)
    })

    console.log('✅ [ScriptEngine] 引擎资源清理完成')
  }

  /**
   * 导出引擎状态
   */
  exportState(): any {
    return {
      config: this.config,
      stats: this.getExecutionStats(),
      templates: this.templateManager.getAllTemplates(),
      contexts: this.contextManager.getAllContexts(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 导入引擎状态
   */
  importState(state: any): boolean {
    try {
      // 导入配置
      if (state.config) {
        this.updateConfig(state.config)
      }

      // 导入模板
      if (state.templates && Array.isArray(state.templates)) {
        state.templates.forEach((template: any) => {
          if (!template.isSystem) {
            // 只导入非系统模板
            this.templateManager.createTemplate(template)
          }
        })
      }

      // 导入上下文
      if (state.contexts && Array.isArray(state.contexts)) {
        state.contexts.forEach((context: any) => {
          this.contextManager.createContext(context.name, context.variables)
        })
      }

      console.log('✅ [ScriptEngine] 状态导入完成')
      return true
    } catch (error) {
      console.error('❌ [ScriptEngine] 状态导入失败:', error)
      return false
    }
  }
}

/**
 * 默认脚本引擎实例
 */
export const defaultScriptEngine = new ScriptEngine()

// 在开发环境下进行预热
if (process.env.NODE_ENV === 'development') {
  defaultScriptEngine.warmup().catch(console.error)
}
