/**
 * 静态数据源提供者
 * 用于提供静态数据，不需要网络请求
 */

import type { StaticDataSourceConfig, IDataSourceInstance, ValidationResult } from '../../types'
import { BaseDataSourceInstance, BaseDataSourceProvider } from '../interface'

/**
 * 静态数据源实例
 */
class StaticDataSourceInstance extends BaseDataSourceInstance {
  constructor(id: string, config: StaticDataSourceConfig) {
    super(id, config)
  }

  protected async fetchData(): Promise<any> {
    // 静态数据直接返回配置的值
    const config = this.config as StaticDataSourceConfig
    return config.value
  }

  protected async cleanup(): Promise<void> {
    // 静态数据源无需清理资源
  }
}

/**
 * 静态数据源提供者
 */
export class StaticDataSourceProvider extends BaseDataSourceProvider<StaticDataSourceConfig> {
  readonly type = 'static' as const

  create(config: StaticDataSourceConfig): IDataSourceInstance {
    const id = `static-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    return new StaticDataSourceInstance(id, config)
  }

  validate(config: StaticDataSourceConfig): ValidationResult {
    const baseResult = super.validate(config)

    // 静态数据源必须有 value
    if (config.value === undefined) {
      baseResult.errors.push('静态数据源必须提供 value')
      baseResult.valid = false
    }

    return baseResult
  }
}
