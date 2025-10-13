/**
 * 脚本数据源提供者
 * 允许用户通过自定义 JavaScript 代码获取数据
 */

import type { ScriptDataSourceConfig, IDataSourceInstance, ValidationResult } from '../../types'
import { BaseDataSourceInstance, BaseDataSourceProvider } from '../interface'

/**
 * 脚本数据源实例
 */
class ScriptDataSourceInstance extends BaseDataSourceInstance {
  private scriptFunction: (() => Promise<any>) | null = null

  constructor(id: string, config: ScriptDataSourceConfig) {
    super(id, config)
    this.compileScript()
  }

  protected async fetchData(): Promise<any> {
    if (!this.scriptFunction) {
      throw new Error('脚本未编译')
    }

    const config = this.config as ScriptDataSourceConfig

    try {
      // 执行脚本函数，传入参数
      const result = await this.scriptFunction.call(null, config.scriptParams || {})
      return result
    } catch (error) {
      throw new Error(`脚本执行失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected async cleanup(): Promise<void> {
    this.scriptFunction = null
  }

  /**
   * 编译脚本为函数
   */
  private compileScript(): void {
    const config = this.config as ScriptDataSourceConfig

    try {
      // 创建异步函数
      // 脚本中可以使用 params 变量访问参数
      this.scriptFunction = new Function(
        'params',
        `
        return (async function() {
          ${config.script}
        })();
      `
      ) as () => Promise<any>
    } catch (error) {
      throw new Error(`脚本编译失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * 脚本数据源提供者
 */
export class ScriptDataSourceProvider extends BaseDataSourceProvider<ScriptDataSourceConfig> {
  readonly type = 'script' as const

  create(config: ScriptDataSourceConfig): IDataSourceInstance {
    const id = `script-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    return new ScriptDataSourceInstance(id, config)
  }

  validate(config: ScriptDataSourceConfig): ValidationResult {
    const baseResult = super.validate(config)

    // 验证脚本
    if (!config.script || config.script.trim() === '') {
      baseResult.errors.push('脚本数据源必须提供 script')
      baseResult.valid = false
      return baseResult
    }

    // 尝试编译脚本
    try {
      new Function('params', config.script)
    } catch (error) {
      baseResult.errors.push(
        `脚本语法错误: ${error instanceof Error ? error.message : String(error)}`
      )
      baseResult.valid = false
    }

    return baseResult
  }
}
