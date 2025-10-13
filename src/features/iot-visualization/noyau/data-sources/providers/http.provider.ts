/**
 * HTTP 数据源提供者
 * 用于从 HTTP API 获取数据
 */

import type { HttpDataSourceConfig, IDataSourceInstance, ValidationResult } from '../../types'
import { BaseDataSourceInstance, BaseDataSourceProvider } from '../interface'
import { createFlatRequest } from '@sa/axios'
import _ from 'lodash-es'

// 创建一个简单的 request 实例
const request = createFlatRequest()

/**
 * HTTP 数据源实例
 */
class HttpDataSourceInstance extends BaseDataSourceInstance {
  private abortController: AbortController | null = null

  constructor(id: string, config: HttpDataSourceConfig) {
    super(id, config)
  }

  protected async fetchData(): Promise<any> {
    const config = this.config as HttpDataSourceConfig

    // 创建新的 AbortController
    this.abortController = new AbortController()

    try {
      // 构建请求
      const { data, error } = await request({
        url: config.url,
        method: config.method,
        headers: config.headers,
        params: config.params,
        data: config.body,
        timeout: config.timeout || 30000
      })

      // 检查错误
      if (error) {
        throw new Error(error.message || '请求失败')
      }

      // 提取数据路径
      if (config.dataPath && data) {
        return _.get(data, config.dataPath)
      }

      return data
    } finally {
      this.abortController = null
    }
  }

  protected async cleanup(): Promise<void> {
    // 取消进行中的请求
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}

/**
 * HTTP 数据源提供者
 */
export class HttpDataSourceProvider extends BaseDataSourceProvider<HttpDataSourceConfig> {
  readonly type = 'http' as const

  create(config: HttpDataSourceConfig): IDataSourceInstance {
    const id = `http-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    return new HttpDataSourceInstance(id, config)
  }

  validate(config: HttpDataSourceConfig): ValidationResult {
    const baseResult = super.validate(config)

    // 验证 URL
    if (!config.url) {
      baseResult.errors.push('HTTP 数据源必须提供 URL')
      baseResult.valid = false
    } else {
      try {
        new URL(config.url, window.location.origin)
      } catch {
        baseResult.errors.push('URL 格式不正确')
        baseResult.valid = false
      }
    }

    // 验证请求方法
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    if (!validMethods.includes(config.method)) {
      baseResult.errors.push(`请求方法必须是 ${validMethods.join(', ')} 之一`)
      baseResult.valid = false
    }

    return baseResult
  }
}
