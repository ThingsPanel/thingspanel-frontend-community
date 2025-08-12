/**
 * 数据处理器实现
 * 支持脚本处理、格式化、过滤、转换等多种数据处理方式
 */

import type { DataProcessor, DataMappingRule, DataMapper } from './types'

// ========== 基础数据处理器 ==========

/**
 * 脚本处理器 - 执行JavaScript代码处理数据
 */
export class ScriptProcessor implements DataProcessor {
  id: string
  name: string = '脚本处理器'
  type = 'script' as const
  config: {
    script: string
    timeout?: number
  }

  constructor(id: string, script: string, timeout = 5000) {
    this.id = id
    this.config = { script, timeout }
  }

  async process(input: any): Promise<any> {
    try {
      console.log(`🔧 [ScriptProcessor] 执行脚本处理: ${this.id}`)

      // 创建安全的执行环境
      const context = {
        data: input,
        console: {
          log: console.log,
          warn: console.warn,
          error: console.error
        },
        Math,
        Date,
        JSON,
        // 常用的数据处理函数
        utils: {
          round: (num: number, digits = 2) => Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits),
          formatNumber: (num: number) => new Intl.NumberFormat().format(num),
          formatDate: (date: Date | string) => new Date(date).toLocaleString()
        }
      }

      // 创建函数并执行
      const processFunction = new Function(
        'context',
        `
        with(context) {
          ${this.config.script}
        }
      `
      )

      const result = await Promise.race([
        Promise.resolve(processFunction(context)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('脚本执行超时')), this.config.timeout))
      ])

      console.log(`✅ [ScriptProcessor] 脚本处理完成: ${this.id}`)
      return result
    } catch (error) {
      console.error(`❌ [ScriptProcessor] 脚本处理失败: ${this.id}`, error)
      throw error
    }
  }

  validateConfig(): boolean {
    return typeof this.config.script === 'string' && this.config.script.trim() !== ''
  }
}

/**
 * 格式化处理器 - 格式化数据的显示
 */
export class FormatProcessor implements DataProcessor {
  id: string
  name: string = '格式化处理器'
  type = 'format' as const
  config: {
    formatType: 'number' | 'date' | 'currency' | 'percentage'
    options?: any
  }

  constructor(id: string, formatType: 'number' | 'date' | 'currency' | 'percentage', options?: any) {
    this.id = id
    this.config = { formatType, options }
  }

  async process(input: any): Promise<any> {
    try {
      console.log(`🎨 [FormatProcessor] 执行格式化处理: ${this.id}`)

      if (input === null || input === undefined) {
        return input
      }

      switch (this.config.formatType) {
        case 'number':
          return new Intl.NumberFormat('zh-CN', this.config.options).format(Number(input))

        case 'date':
          return new Intl.DateTimeFormat('zh-CN', this.config.options).format(new Date(input))

        case 'currency':
          return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            ...this.config.options
          }).format(Number(input))

        case 'percentage':
          return new Intl.NumberFormat('zh-CN', {
            style: 'percent',
            ...this.config.options
          }).format(Number(input))

        default:
          return input
      }
    } catch (error) {
      console.error(`❌ [FormatProcessor] 格式化处理失败: ${this.id}`, error)
      return input // 格式化失败时返回原值
    }
  }

  validateConfig(): boolean {
    return ['number', 'date', 'currency', 'percentage'].includes(this.config.formatType)
  }
}

/**
 * 过滤处理器 - 过滤数据
 */
export class FilterProcessor implements DataProcessor {
  id: string
  name: string = '过滤处理器'
  type = 'filter' as const
  config: {
    filterType: 'include' | 'exclude' | 'condition'
    criteria: any
  }

  constructor(id: string, filterType: 'include' | 'exclude' | 'condition', criteria: any) {
    this.id = id
    this.config = { filterType, criteria }
  }

  async process(input: any): Promise<any> {
    try {
      console.log(`🔍 [FilterProcessor] 执行过滤处理: ${this.id}`)

      if (!Array.isArray(input)) {
        return input
      }

      switch (this.config.filterType) {
        case 'include':
          return input.filter(item => this.matchesCriteria(item, this.config.criteria, true))

        case 'exclude':
          return input.filter(item => !this.matchesCriteria(item, this.config.criteria, true))

        case 'condition':
          // 使用函数字符串进行条件过滤
          if (typeof this.config.criteria === 'string') {
            const conditionFn = new Function('item', `return ${this.config.criteria}`)
            return input.filter(conditionFn)
          }
          return input

        default:
          return input
      }
    } catch (error) {
      console.error(`❌ [FilterProcessor] 过滤处理失败: ${this.id}`, error)
      return input
    }
  }

  private matchesCriteria(item: any, criteria: any, defaultResult: boolean): boolean {
    if (typeof criteria === 'object' && criteria !== null) {
      return Object.entries(criteria).every(([key, value]) => {
        return item && item[key] === value
      })
    }
    return defaultResult
  }

  validateConfig(): boolean {
    return ['include', 'exclude', 'condition'].includes(this.config.filterType)
  }
}

/**
 * 转换处理器 - 转换数据结构
 */
export class TransformProcessor implements DataProcessor {
  id: string
  name: string = '转换处理器'
  type = 'transform' as const
  config: {
    transformType: 'flatten' | 'group' | 'pivot' | 'custom'
    options?: any
  }

  constructor(id: string, transformType: 'flatten' | 'group' | 'pivot' | 'custom', options?: any) {
    this.id = id
    this.config = { transformType, options }
  }

  async process(input: any): Promise<any> {
    try {
      console.log(`🔄 [TransformProcessor] 执行转换处理: ${this.id}`)

      switch (this.config.transformType) {
        case 'flatten':
          return this.flatten(input)

        case 'group':
          return this.groupBy(input, this.config.options?.groupKey)

        case 'pivot':
          return this.pivot(input, this.config.options)

        case 'custom':
          // 自定义转换逻辑
          if (this.config.options?.transformer) {
            return this.config.options.transformer(input)
          }
          return input

        default:
          return input
      }
    } catch (error) {
      console.error(`❌ [TransformProcessor] 转换处理失败: ${this.id}`, error)
      return input
    }
  }

  private flatten(obj: any, prefix = ''): any {
    const result: any = {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, this.flatten(obj[key], newKey))
        } else {
          result[newKey] = obj[key]
        }
      }
    }

    return result
  }

  private groupBy(array: any[], key: string): any {
    if (!Array.isArray(array)) return array

    return array.reduce((groups, item) => {
      const groupKey = item[key]
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    }, {})
  }

  private pivot(array: any[], options: any): any {
    // 简化的透视表实现
    if (!Array.isArray(array) || !options) return array

    const { rowKey, colKey, valueKey } = options
    const result: any = {}

    array.forEach(item => {
      const row = item[rowKey]
      const col = item[colKey]
      const value = item[valueKey]

      if (!result[row]) result[row] = {}
      result[row][col] = value
    })

    return result
  }

  validateConfig(): boolean {
    return ['flatten', 'group', 'pivot', 'custom'].includes(this.config.transformType)
  }
}

// ========== 数据映射器实现 ==========

/**
 * 路径解析数据映射器
 */
export class PathDataMapper implements DataMapper {
  rules: DataMappingRule[]

  constructor(rules: DataMappingRule[]) {
    this.rules = rules
  }

  map(sourceData: any): Record<string, any> {
    console.log('🗺️ [PathDataMapper] 执行数据映射')
    console.log('📄 映射规则:', this.rules)
    console.log('📊 源数据:', sourceData)

    const result: Record<string, any> = {}

    this.rules.forEach(rule => {
      try {
        let value = this.extractValueByPath(sourceData, rule.sourcePath)

        // 应用转换
        if (rule.type === 'calculated' && rule.transformer) {
          value = rule.transformer(value)
        } else if (rule.type === 'conditional' && rule.condition) {
          if (!rule.condition(value)) {
            value = rule.defaultValue
          }
        }

        // 使用默认值
        if (value === undefined && rule.defaultValue !== undefined) {
          value = rule.defaultValue
        }

        result[rule.targetField] = value

        console.log(`✅ 映射字段 ${rule.targetField}: ${rule.sourcePath} → ${JSON.stringify(value)}`)
      } catch (error) {
        console.warn(`⚠️ 映射字段失败 ${rule.targetField}:`, error)
        result[rule.targetField] = rule.defaultValue
      }
    })

    console.log('🎯 [PathDataMapper] 映射结果:', result)
    return result
  }

  /**
   * 根据路径提取值，支持复杂路径如 'data[0].sensor.value'
   */
  private extractValueByPath(data: any, path: string): any {
    if (!path || path === '') return data

    try {
      // 解析路径
      const pathParts = this.parsePath(path)
      let current = data

      for (const part of pathParts) {
        if (current === null || current === undefined) {
          return undefined
        }

        if (typeof part === 'number') {
          // 数组索引
          if (Array.isArray(current)) {
            current = current[part]
          } else {
            return undefined
          }
        } else {
          // 对象属性
          if (typeof current === 'object' && part in current) {
            current = current[part]
          } else {
            return undefined
          }
        }
      }

      return current
    } catch (error) {
      console.error(`路径解析失败: ${path}`, error)
      return undefined
    }
  }

  /**
   * 解析路径字符串，支持数组索引和对象属性
   */
  private parsePath(path: string): (string | number)[] {
    const parts: (string | number)[] = []
    let current = ''
    let inBrackets = false
    let bracketContent = ''

    for (let i = 0; i < path.length; i++) {
      const char = path[i]

      if (char === '[') {
        if (current) {
          parts.push(current)
          current = ''
        }
        inBrackets = true
        bracketContent = ''
      } else if (char === ']') {
        inBrackets = false
        const index = parseInt(bracketContent, 10)
        if (!isNaN(index)) {
          parts.push(index)
        }
        bracketContent = ''
      } else if (char === '.') {
        if (inBrackets) {
          bracketContent += char
        } else {
          if (current) {
            parts.push(current)
            current = ''
          }
        }
      } else {
        if (inBrackets) {
          bracketContent += char
        } else {
          current += char
        }
      }
    }

    if (current) {
      parts.push(current)
    }

    return parts
  }

  validateRules(): boolean {
    return this.rules.every(rule => {
      return rule.sourcePath && rule.targetField && ['direct', 'calculated', 'conditional'].includes(rule.type)
    })
  }

  preview(sourceData: any): Record<string, any> {
    // 预览功能与实际映射相同，但不会抛出错误
    try {
      return this.map(sourceData)
    } catch (error) {
      console.error('映射预览失败:', error)
      return {}
    }
  }
}

// ========== 处理器工厂 ==========

/**
 * 数据处理器工厂
 */
export class DataProcessorFactory {
  /**
   * 创建脚本处理器
   */
  static createScriptProcessor(id: string, script: string, timeout?: number): ScriptProcessor {
    return new ScriptProcessor(id, script, timeout)
  }

  /**
   * 创建格式化处理器
   */
  static createFormatProcessor(
    id: string,
    formatType: 'number' | 'date' | 'currency' | 'percentage',
    options?: any
  ): FormatProcessor {
    return new FormatProcessor(id, formatType, options)
  }

  /**
   * 创建过滤处理器
   */
  static createFilterProcessor(
    id: string,
    filterType: 'include' | 'exclude' | 'condition',
    criteria: any
  ): FilterProcessor {
    return new FilterProcessor(id, filterType, criteria)
  }

  /**
   * 创建转换处理器
   */
  static createTransformProcessor(
    id: string,
    transformType: 'flatten' | 'group' | 'pivot' | 'custom',
    options?: any
  ): TransformProcessor {
    return new TransformProcessor(id, transformType, options)
  }

  /**
   * 根据配置创建处理器
   */
  static createFromConfig(config: any): DataProcessor {
    switch (config.type) {
      case 'script':
        return new ScriptProcessor(config.id, config.script, config.timeout)

      case 'format':
        return new FormatProcessor(config.id, config.formatType, config.options)

      case 'filter':
        return new FilterProcessor(config.id, config.filterType, config.criteria)

      case 'transform':
        return new TransformProcessor(config.id, config.transformType, config.options)

      default:
        throw new Error(`不支持的处理器类型: ${config.type}`)
    }
  }
}

export default DataProcessorFactory
