/**
 * 数据转换管道实现
 * 整合数据源、处理器和映射器，提供完整的数据转换流程
 */

import type {
  DataSource,
  DataProcessor,
  DataMapper,
  DataValidator,
  DataTransformPipeline,
  ComponentDataRequirement,
  DataValidationResult
} from './types'

import { PathDataMapper } from './data-processors'

// ========== 数据验证器实现 ==========

export class ComponentDataValidator implements DataValidator {
  validate(data: any, requirement: ComponentDataRequirement): DataValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const details: Record<string, any> = {}

    console.log('🔍 [ComponentDataValidator] 开始验证数据')
    console.log('📊 验证数据:', data)
    console.log('📋 数据需求:', requirement)

    // 验证每个字段
    Object.entries(requirement.fields).forEach(([fieldName, fieldReq]) => {
      const fieldValue = data?.[fieldName]
      const fieldValidation = this.validateField(fieldValue, fieldReq)

      details[fieldName] = {
        value: fieldValue,
        required: fieldReq.required,
        valid: fieldValidation.valid,
        errors: fieldValidation.errors,
        warnings: fieldValidation.warnings
      }

      if (!fieldValidation.valid) {
        if (fieldReq.required) {
          errors.push(`必填字段 ${fieldName} 验证失败: ${fieldValidation.errors.join(', ')}`)
        } else {
          warnings.push(`可选字段 ${fieldName} 验证失败: ${fieldValidation.errors.join(', ')}`)
        }
      }
    })

    // 验证数据关系
    if (requirement.relationships) {
      Object.entries(requirement.relationships).forEach(([relationName, relation]) => {
        const inputsValid = relation.inputs.every(inputField => data?.[inputField] !== undefined)
        details[`relationship_${relationName}`] = {
          type: relation.type,
          inputs: relation.inputs,
          inputsValid
        }

        if (!inputsValid) {
          warnings.push(`数据关系 ${relationName} 的输入字段不完整`)
        }
      })
    }

    const result: DataValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      details
    }

    console.log('✅ [ComponentDataValidator] 验证完成:', result)
    return result
  }

  validateField(value: any, fieldRequirement: DataFieldRequirement): DataValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必填字段
    if (fieldRequirement.required && (value === undefined || value === null)) {
      errors.push('字段值不能为空')
      return { valid: false, errors, warnings, details: {} }
    }

    // 如果值为空且字段不是必填的，则验证通过
    if (value === undefined || value === null) {
      return { valid: true, errors: [], warnings: [], details: {} }
    }

    // 验证字段类型
    switch (fieldRequirement.type) {
      case 'value':
        this.validateValueType(value, fieldRequirement.valueType || 'any', errors, warnings)
        break

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push('字段值必须是对象类型')
        } else if (fieldRequirement.structure) {
          // 递归验证嵌套结构
          const nestedValidation = this.validate(value, fieldRequirement.structure)
          if (!nestedValidation.valid) {
            errors.push(...nestedValidation.errors.map(err => `嵌套对象: ${err}`))
          }
        }
        break

      case 'array':
        if (!Array.isArray(value)) {
          errors.push('字段值必须是数组类型')
        } else if (fieldRequirement.structure && value.length > 0) {
          // 验证数组元素结构
          const sampleElement = value[0]
          const elementValidation = this.validate(sampleElement, fieldRequirement.structure)
          if (!elementValidation.valid) {
            warnings.push(`数组元素结构不匹配: ${elementValidation.errors.join(', ')}`)
          }
        }
        break
    }

    // 验证自定义规则
    if (fieldRequirement.validation) {
      this.validateCustomRules(value, fieldRequirement.validation, errors, warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      details: { value, type: typeof value }
    }
  }

  private validateValueType(value: any, expectedType: string, errors: string[], warnings: string[]): void {
    const actualType = typeof value

    switch (expectedType) {
      case 'number':
        if (actualType !== 'number' || isNaN(value)) {
          errors.push(`期望数字类型，实际类型: ${actualType}`)
        }
        break

      case 'string':
        if (actualType !== 'string') {
          errors.push(`期望字符串类型，实际类型: ${actualType}`)
        }
        break

      case 'boolean':
        if (actualType !== 'boolean') {
          errors.push(`期望布尔类型，实际类型: ${actualType}`)
        }
        break

      case 'any':
        // 任何类型都可以
        break

      default:
        warnings.push(`未知的值类型要求: ${expectedType}`)
    }
  }

  private validateCustomRules(value: any, validation: any, errors: string[], warnings: string[]): void {
    if (validation.min !== undefined) {
      if (typeof value === 'number' && value < validation.min) {
        errors.push(`值 ${value} 小于最小值 ${validation.min}`)
      } else if (typeof value === 'string' && value.length < validation.min) {
        errors.push(`字符串长度 ${value.length} 小于最小长度 ${validation.min}`)
      }
    }

    if (validation.max !== undefined) {
      if (typeof value === 'number' && value > validation.max) {
        errors.push(`值 ${value} 大于最大值 ${validation.max}`)
      } else if (typeof value === 'string' && value.length > validation.max) {
        errors.push(`字符串长度 ${value.length} 大于最大长度 ${validation.max}`)
      }
    }

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        errors.push(`值不匹配正则表达式: ${validation.pattern}`)
      }
    }

    if (validation.enum && !validation.enum.includes(value)) {
      errors.push(`值不在允许的枚举值中: ${validation.enum.join(', ')}`)
    }

    if (validation.custom && typeof validation.custom === 'function') {
      try {
        const customResult = validation.custom(value)
        if (customResult === false) {
          errors.push('自定义验证失败')
        } else if (typeof customResult === 'string') {
          errors.push(customResult)
        }
      } catch (error) {
        warnings.push(`自定义验证执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }
}

// ========== 数据转换管道实现 ==========

export class DataTransformPipelineImpl implements DataTransformPipeline {
  id: string
  source: DataSource
  processors: DataProcessor[]
  mapper: DataMapper
  validator?: DataValidator

  private lastExecutionTime: Date | null = null
  private lastResult: any = null
  private executionCount = 0

  constructor(
    id: string,
    source: DataSource,
    processors: DataProcessor[] = [],
    mapper: DataMapper,
    validator?: DataValidator
  ) {
    this.id = id
    this.source = source
    this.processors = processors
    this.mapper = mapper
    this.validator = validator
  }

  async execute(): Promise<Record<string, any>> {
    const startTime = Date.now()
    this.executionCount++

    console.log(`🚀 [DataTransformPipeline] 开始执行管道: ${this.id} (第${this.executionCount}次)`)

    try {
      // 步骤1: 从数据源获取原始数据
      console.log(`📊 [步骤1/4] 获取数据源数据...`)
      let currentData = await this.source.fetchData()
      console.log(`✅ 数据源数据获取成功:`, currentData)

      // 步骤2: 通过处理器链处理数据
      console.log(`🔧 [步骤2/4] 执行数据处理器链 (${this.processors.length}个处理器)...`)
      for (let i = 0; i < this.processors.length; i++) {
        const processor = this.processors[i]
        console.log(`  🔧 执行处理器 ${i + 1}/${this.processors.length}: ${processor.name} (${processor.type})`)

        const beforeProcessing = JSON.stringify(currentData)
        currentData = await processor.process(currentData)
        const afterProcessing = JSON.stringify(currentData)

        console.log(`  ✅ 处理器 ${processor.name} 执行完成`)

        if (beforeProcessing !== afterProcessing) {
          console.log(`  📝 数据已被处理器修改`)
        }
      }

      // 步骤3: 执行字段映射
      console.log(`🗺️ [步骤3/4] 执行字段映射 (${this.mapper.rules.length}个映射规则)...`)
      const mappedData = this.mapper.map(currentData)
      console.log(`✅ 字段映射完成:`, mappedData)

      // 步骤4: 数据验证（如果有验证器）
      if (this.validator) {
        console.log(`🔍 [步骤4/4] 执行数据验证...`)
        // 注意：这里需要组件需求定义，暂时跳过验证
        console.log(`⚠️ 数据验证跳过（需要组件需求定义）`)
      } else {
        console.log(`⏭️ [步骤4/4] 跳过数据验证（未配置验证器）`)
      }

      // 记录执行结果
      this.lastExecutionTime = new Date()
      this.lastResult = mappedData

      const executionTime = Date.now() - startTime
      console.log(`🎉 [DataTransformPipeline] 管道执行成功: ${this.id}`)
      console.log(`⏱️ 执行时间: ${executionTime}ms`)
      console.log(`📊 最终结果:`, mappedData)

      return mappedData
    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error(`❌ [DataTransformPipeline] 管道执行失败: ${this.id}`)
      console.error(`⏱️ 失败时间: ${executionTime}ms`)
      console.error(`💥 错误详情:`, error)
      throw error
    }
  }

  validate(): boolean {
    const errors: string[] = []

    // 验证数据源
    if (!this.source.validateConfig()) {
      errors.push('数据源配置无效')
    }

    // 验证处理器
    this.processors.forEach((processor, index) => {
      if (!processor.validateConfig || !processor.validateConfig()) {
        errors.push(`处理器 ${index + 1} (${processor.name}) 配置无效`)
      }
    })

    // 验证映射器
    if (!this.mapper.validateRules()) {
      errors.push('数据映射规则无效')
    }

    if (errors.length > 0) {
      console.error(`❌ [DataTransformPipeline] 管道验证失败: ${this.id}`, errors)
      return false
    }

    console.log(`✅ [DataTransformPipeline] 管道验证通过: ${this.id}`)
    return true
  }

  /**
   * 获取管道统计信息
   */
  getStats(): {
    id: string
    executionCount: number
    lastExecutionTime: Date | null
    lastResult: any
    isValid: boolean
    sourceType: string
    processorCount: number
    mappingRulesCount: number
  } {
    return {
      id: this.id,
      executionCount: this.executionCount,
      lastExecutionTime: this.lastExecutionTime,
      lastResult: this.lastResult,
      isValid: this.validate(),
      sourceType: this.source.type,
      processorCount: this.processors.length,
      mappingRulesCount: this.mapper.rules.length
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.executionCount = 0
    this.lastExecutionTime = null
    this.lastResult = null
    console.log(`🔄 [DataTransformPipeline] 统计信息已重置: ${this.id}`)
  }

  /**
   * 预览管道执行结果（不更新统计信息）
   */
  async preview(): Promise<Record<string, any>> {
    console.log(`👀 [DataTransformPipeline] 预览管道执行: ${this.id}`)

    try {
      // 获取数据源数据
      let currentData = await this.source.fetchData()

      // 处理器链处理
      for (const processor of this.processors) {
        currentData = await processor.process(currentData)
      }

      // 字段映射
      const mappedData = this.mapper.map(currentData)

      console.log(`✅ [DataTransformPipeline] 预览完成: ${this.id}`, mappedData)
      return mappedData
    } catch (error) {
      console.error(`❌ [DataTransformPipeline] 预览失败: ${this.id}`, error)
      throw error
    }
  }
}

// ========== 管道工厂 ==========

export class DataTransformPipelineFactory {
  /**
   * 创建基础管道
   */
  static create(
    id: string,
    source: DataSource,
    mappingRules: any[],
    processors: DataProcessor[] = []
  ): DataTransformPipelineImpl {
    const mapper = new PathDataMapper(mappingRules)
    const validator = new ComponentDataValidator()

    return new DataTransformPipelineImpl(id, source, processors, mapper, validator)
  }

  /**
   * 根据配置创建管道
   */
  static createFromConfig(config: {
    id: string
    source: DataSource
    processors?: DataProcessor[]
    mappingRules: any[]
    enableValidation?: boolean
  }): DataTransformPipelineImpl {
    const mapper = new PathDataMapper(config.mappingRules)
    const validator = config.enableValidation ? new ComponentDataValidator() : undefined

    return new DataTransformPipelineImpl(config.id, config.source, config.processors || [], mapper, validator)
  }

  /**
   * 创建示例管道
   */
  static createSamplePipeline(): DataTransformPipelineImpl {
    // 这里可以创建一个示例管道用于测试
    // 具体实现会在测试组件中完成
    throw new Error('示例管道需要在具体使用时创建')
  }
}

export default DataTransformPipelineImpl
