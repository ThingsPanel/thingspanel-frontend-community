/**
 * 第二层：数据项处理器 (DataItemProcessor)
 * 职责：对原始数据进行过滤和脚本处理
 * 已集成 script-engine 安全脚本执行系统
 */

import { defaultScriptEngine } from '../../script-engine'

export interface ProcessingConfig {
  /** JSONPath语法过滤路径，如: $.abc.bcd[0] */
  filterPath: string
  /** 自定义脚本处理 */
  customScript?: string
  /** 默认值配置 */
  defaultValue?: any
}

/**
 * 数据项处理器接口
 */
export interface IDataItemProcessor {
  /**
   * 处理原始数据：路径过滤 + 自定义脚本处理
   * @param rawData 原始数据
   * @param config 处理配置
   * @returns 处理后数据，出错时返回 {}
   */
  processData(rawData: any, config: ProcessingConfig): Promise<any>
}

/**
 * 数据项处理器实现类
 */
export class DataItemProcessor implements IDataItemProcessor {
  /**
   * 数据处理主方法
   */
  async processData(rawData: any, config: ProcessingConfig): Promise<any> {
    try {
      console.log('🔧 [DataItemProcessor] 开始数据处理')
      console.log('🔍 [DataItemProcessor] 原始数据:', JSON.stringify(rawData, null, 2))
      console.log('🔍 [DataItemProcessor] 处理配置:', {
        filterPath: config.filterPath,
        hasCustomScript: !!config.customScript,
        defaultValue: config.defaultValue
      })

      // 🔥 修复：改进空数据检查逻辑
      if (rawData === null || rawData === undefined) {
        console.warn('🚨 [DataItemProcessor] 原始数据为null/undefined，返回默认值')
        return config.defaultValue || {}
      }

      // 允许空数组、空字符串等"falsy but valid"的值
      if (typeof rawData === 'object' && Object.keys(rawData).length === 0 && !Array.isArray(rawData)) {
        console.warn('🚨 [DataItemProcessor] 原始数据为空对象，返回默认值')
        return config.defaultValue || {}
      }

      // 第一步：JSONPath路径过滤
      console.log('🔧 [DataItemProcessor] 开始路径过滤，路径:', config.filterPath)
      let filteredData = await this.applyPathFilter(rawData, config.filterPath)
      console.log('🔧 [DataItemProcessor] 路径过滤结果:', JSON.stringify(filteredData, null, 2))

      // 第二步：自定义脚本处理
      if (config.customScript) {
        console.log('🔧 [DataItemProcessor] 开始自定义脚本处理')
        filteredData = await this.applyCustomScript(filteredData, config.customScript)
        console.log('🔧 [DataItemProcessor] 脚本处理结果:', JSON.stringify(filteredData, null, 2))
      } else {
        console.log('ℹ️ [DataItemProcessor] 无自定义脚本，跳过脚本处理')
      }

      // 🔥 修复：允许falsy但有意义的值（如 0、false、[]、""）
      const finalResult = filteredData !== null && filteredData !== undefined 
        ? filteredData 
        : (config.defaultValue || {})
      
      console.log('✅ [DataItemProcessor] 数据处理完成，最终结果:', JSON.stringify(finalResult, null, 2))
      return finalResult
    } catch (error) {
      console.error('❌ [DataItemProcessor] 数据处理失败:', error)
      return config.defaultValue || {} // 统一错误处理：返回默认值或空对象
    }
  }

  /**
   * 应用JSONPath路径过滤
   * 简化版JSONPath实现，支持基本的$.abc.bcd[0]语法
   */
  private async applyPathFilter(data: any, filterPath: string): Promise<any> {
    try {
      // 如果路径为空或者是$，直接返回原数据
      if (!filterPath || filterPath === '$') {
        return data
      }

      // 移除开头的$符号
      let path = filterPath.startsWith('$') ? filterPath.substring(1) : filterPath
      if (path.startsWith('.')) {
        path = path.substring(1)
      }

      // 如果路径为空，返回原数据
      if (!path) {
        return data
      }

      // 按.分割路径
      const pathParts = path.split('.')
      let current = data

      for (const part of pathParts) {
        if (current == null) {
          console.log('🚨 [applyPathFilter] 路径访问中断，当前值为null/undefined')
          return null // 🔥 修复：返回null而不是{}，表示路径不存在
        }

        // 处理数组索引，如 abc[0]
        if (part.includes('[') && part.includes(']')) {
          const [key, indexPart] = part.split('[')
          const index = parseInt(indexPart.replace(']', ''))

          if (key) {
            current = current[key]
          }

          if (Array.isArray(current) && !isNaN(index)) {
            current = current[index]
          } else {
            console.log('🚨 [applyPathFilter] 数组索引访问失败')
            return null // 🔥 修复：返回null而不是{}
          }
        } else {
          // 普通属性访问
          current = current[part]
        }
      }

      // 🔥 修复：允许所有类型的值，包括false、0、""、[]等
      console.log('✅ [applyPathFilter] 路径过滤完成，结果:', current)
      return current // 直接返回结果，不判断undefined
    } catch (error) {
      console.error('DataItemProcessor: JSONPath过滤失败', error)
      return {}
    }
  }

  /**
   * 应用自定义脚本处理 (使用 script-engine 安全执行)
   */
  private async applyCustomScript(data: any, script: string): Promise<any> {
    try {
      console.log('🔧 [DataItemProcessor] 使用 script-engine 执行数据处理脚本')

      // 创建脚本执行上下文
      const scriptContext = {
        data
        // script-engine 已内置 JSON, console, Math, Date 等
      }

      // 使用 script-engine 安全执行脚本
      const result = await defaultScriptEngine.execute(script, scriptContext)

      if (result.success) {
        console.log('✅ [DataItemProcessor] 脚本处理成功:', result.executionTime + 'ms')
        return result.data !== undefined ? result.data : data
      } else {
        console.error('❌ [DataItemProcessor] 脚本处理失败:', result.error?.message)
        return data // 脚本失败时返回原数据
      }
    } catch (error) {
      console.error('DataItemProcessor: 脚本处理异常', error)
      return data // 脚本失败时返回原数据
    }
  }

  /**
   * 验证JSONPath语法的合法性
   */
  validateFilterPath(filterPath: string): boolean {
    if (!filterPath) return true

    // 基本语法验证：必须以$开头或者直接是属性名
    const validPattern = /^(\$\.?)?[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+\])*$/
    return validPattern.test(filterPath) || filterPath === '$'
  }
}
