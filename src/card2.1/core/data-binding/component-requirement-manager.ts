/**
 * 组件数据需求管理器
 * 负责组件数据需求的注册、验证和查询
 */

import type { ComponentDataRequirement, DataFieldRequirement, DataRelationship } from './types'

export class ComponentRequirementManager {
  private requirements = new Map<string, ComponentDataRequirement>()
  private relationshipCache = new Map<string, Map<string, any>>()

  /**
   * 注册组件的数据需求
   */
  registerRequirement(componentId: string, requirement: ComponentDataRequirement): void {
    try {
      // 对于残留数据或无效数据，尝试修复或使用默认值
      if (!requirement || typeof requirement !== 'object') {
        requirement = this.createDefaultRequirement(componentId)
      }

      // 验证需求定义
      const validation = this.validateRequirement(requirement)
      if (!validation.valid) {
        requirement = this.createDefaultRequirement(componentId)
      }

      this.requirements.set(componentId, requirement)

      // 🔥 性能优化：只在需求真正改变时清除缓存
      const existingRequirement = this.requirements.get(componentId)
      const requirementChanged =
        !existingRequirement || JSON.stringify(existingRequirement) !== JSON.stringify(requirement)

      if (requirementChanged) {
        this.relationshipCache.delete(componentId)
      }
    } catch (error) {
      // 使用默认需求避免系统崩溃
      const defaultRequirement = this.createDefaultRequirement(componentId)
      this.requirements.set(componentId, defaultRequirement)
    }
  }

  /**
   * 创建默认数据需求（用于处理残留数据）
   */
  private createDefaultRequirement(componentId: string): ComponentDataRequirement {
    return {
      componentType: 'unknown',
      displayName: '未知组件',
      description: '由于残留数据导致的默认配置',
      category: 'default',
      version: '1.0.0',
      primaryData: {
        name: 'data',
        label: '数据',
        description: '组件数据',
        type: 'object',
        required: false,
        defaultValue: {},
        validation: {},
        example: {},
        tags: ['default']
      },
      fields: {
        data: {
          name: 'data',
          label: '数据',
          description: '组件默认数据字段',
          type: 'object',
          required: false,
          defaultValue: {},
          validation: {},
          example: {},
          tags: ['default']
        }
      },
      relationships: {},
      updateConfig: {
        supportedTriggers: ['manual'],
        recommendedInterval: 5000,
        minInterval: 1000
      }
    }
  }

  /**
   * 获取组件的数据需求
   */
  getRequirement(componentId: string): ComponentDataRequirement | null {
    return this.requirements.get(componentId) || null
  }

  /**
   * 获取所有已注册的组件需求
   */
  getAllRequirements(): Record<string, ComponentDataRequirement> {
    const result: Record<string, ComponentDataRequirement> = {}
    this.requirements.forEach((requirement, componentId) => {
      result[componentId] = requirement
    })
    return result
  }

  /**
   * 获取组件的字段需求
   */
  getFieldRequirement(componentId: string, fieldName: string): DataFieldRequirement | null {
    const requirement = this.requirements.get(componentId)
    if (!requirement) return null

    return requirement.fields[fieldName] || null
  }

  /**
   * 获取组件的所有字段名
   */
  getFieldNames(componentId: string): string[] {
    const requirement = this.requirements.get(componentId)
    if (!requirement) return []

    return Object.keys(requirement.fields)
  }

  /**
   * 获取组件的必填字段
   */
  getRequiredFields(componentId: string): string[] {
    const requirement = this.requirements.get(componentId)
    if (!requirement) return []

    return Object.entries(requirement.fields)
      .filter(([_, fieldReq]) => fieldReq.required)
      .map(([fieldName, _]) => fieldName)
  }

  /**
   * 获取组件的可选字段
   */
  getOptionalFields(componentId: string): string[] {
    const requirement = this.requirements.get(componentId)
    if (!requirement) return []

    return Object.entries(requirement.fields)
      .filter(([_, fieldReq]) => !fieldReq.required)
      .map(([fieldName, _]) => fieldName)
  }

  /**
   * 获取组件的数据关系
   */
  getRelationships(componentId: string): Record<string, DataRelationship> {
    const requirement = this.requirements.get(componentId)
    if (!requirement || !requirement.relationships) return {}

    return requirement.relationships
  }

  /**
   * 计算字段的数据关系值
   */
  calculateRelationshipValue(componentId: string, relationshipName: string, inputData: Record<string, any>): any {
    const relationships = this.getRelationships(componentId)
    const relationship = relationships[relationshipName]

    if (!relationship) {
      throw new Error(`未找到数据关系: ${relationshipName}`)
    }

    if (relationship.type === 'independent') {
      // 独立字段，直接返回对应的输入值
      const inputField = relationship.inputs[0]
      return inputData[inputField]
    }

    if (relationship.type === 'calculated' && relationship.calculator) {
      // 计算字段，执行计算函数
      const inputs: Record<string, any> = {}
      relationship.inputs.forEach(inputField => {
        inputs[inputField] = inputData[inputField]
      })

      try {
        return relationship.calculator(inputs)
      } catch (error) {
        return undefined
      }
    }

    if (relationship.type === 'derived') {
      // 派生字段，基于其他字段的简单映射
      const inputField = relationship.inputs[0]
      return inputData[inputField]
    }

    return undefined
  }

  /**
   * 验证数据需求定义
   */
  validateRequirement(requirement: ComponentDataRequirement): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 对于残留数据，如果 requirement 为 null 或 undefined，返回默认有效状态
    if (!requirement || typeof requirement !== 'object') {
      return { valid: true, errors: [] }
    }

    // 验证字段定义
    if (!requirement.fields || Object.keys(requirement.fields).length === 0) {
      errors.push('组件必须定义至少一个数据字段')
    }

    // 验证每个字段
    if (requirement.fields && typeof requirement.fields === 'object') {
      Object.entries(requirement.fields).forEach(([fieldName, fieldReq]) => {
        const fieldErrors = this.validateFieldRequirement(fieldName, fieldReq)
        errors.push(...fieldErrors)
      })
    }

    // 验证数据关系
    if (requirement.relationships && typeof requirement.relationships === 'object') {
      Object.entries(requirement.relationships).forEach(([relationName, relation]) => {
        const relationErrors = this.validateRelationship(relationName, relation, requirement.fields || {})
        errors.push(...relationErrors)
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证字段需求定义
   */
  private validateFieldRequirement(fieldName: string, fieldReq: DataFieldRequirement): string[] {
    const errors: string[] = []

    // 验证字段类型
    if (!['value', 'object', 'array'].includes(fieldReq.type)) {
      errors.push(`字段 ${fieldName} 的类型无效: ${fieldReq.type}`)
    }

    // 验证值类型
    if (fieldReq.type === 'value' && fieldReq.valueType) {
      if (!['number', 'string', 'boolean', 'any'].includes(fieldReq.valueType)) {
        errors.push(`字段 ${fieldName} 的值类型无效: ${fieldReq.valueType}`)
      }
    }

    // 验证嵌套结构
    if ((fieldReq.type === 'object' || fieldReq.type === 'array') && fieldReq.structure) {
      const structureValidation = this.validateRequirement(fieldReq.structure)
      if (!structureValidation.valid) {
        errors.push(`字段 ${fieldName} 的嵌套结构无效: ${structureValidation.errors.join(', ')}`)
      }
    }

    // 验证描述
    if (!fieldReq.description || fieldReq.description.trim() === '') {
      errors.push(`字段 ${fieldName} 必须提供描述`)
    }

    return errors
  }

  /**
   * 验证数据关系定义
   */
  private validateRelationship(
    relationName: string,
    relation: DataRelationship,
    fields: Record<string, DataFieldRequirement>
  ): string[] {
    const errors: string[] = []

    // 验证关系类型
    if (!['independent', 'calculated', 'derived'].includes(relation.type)) {
      errors.push(`关系 ${relationName} 的类型无效: ${relation.type}`)
    }

    // 验证输入字段
    if (!relation.inputs || relation.inputs.length === 0) {
      errors.push(`关系 ${relationName} 必须定义输入字段`)
    } else {
      relation.inputs.forEach(inputField => {
        if (!fields[inputField]) {
          errors.push(`关系 ${relationName} 引用了不存在的字段: ${inputField}`)
        }
      })
    }

    // 验证计算函数
    if (relation.type === 'calculated' && !relation.calculator) {
      errors.push(`计算关系 ${relationName} 必须提供计算函数`)
    }

    return errors
  }

  /**
   * 生成组件数据需求的示例数据
   */
  generateSampleData(componentId: string): Record<string, any> {
    const requirement = this.requirements.get(componentId)
    if (!requirement) return {}

    const sampleData: Record<string, any> = {}

    // 生成字段示例数据
    Object.entries(requirement.fields).forEach(([fieldName, fieldReq]) => {
      sampleData[fieldName] = this.generateFieldSampleData(fieldReq)
    })

    // 计算关系字段的值
    if (requirement.relationships) {
      Object.entries(requirement.relationships).forEach(([relationName, relation]) => {
        try {
          const calculatedValue = this.calculateRelationshipValue(componentId, relationName, sampleData)
          sampleData[relationName] = calculatedValue
        } catch (error) {
        }
      })
    }

    return sampleData
  }

  /**
   * 生成字段示例数据
   */
  private generateFieldSampleData(fieldReq: DataFieldRequirement): any {
    // 如果有示例数据，直接使用
    if (fieldReq.example !== undefined) {
      return fieldReq.example
    }

    // 如果有默认值，使用默认值
    if (fieldReq.defaultValue !== undefined) {
      return fieldReq.defaultValue
    }

    // 根据类型生成示例数据
    switch (fieldReq.type) {
      case 'value':
        return this.generateValueSampleData(fieldReq.valueType || 'any')

      case 'object':
        if (fieldReq.structure) {
          const objectSample: Record<string, any> = {}
          Object.entries(fieldReq.structure.fields).forEach(([key, subFieldReq]) => {
            objectSample[key] = this.generateFieldSampleData(subFieldReq)
          })
          return objectSample
        }
        return {}

      case 'array':
        if (fieldReq.structure) {
          // 生成包含2个示例元素的数组
          return [this.generateSampleData('temp'), this.generateSampleData('temp')].map((_, index) => {
            const elementSample: Record<string, any> = {}
            Object.entries(fieldReq.structure!.fields).forEach(([key, subFieldReq]) => {
              elementSample[key] = this.generateFieldSampleData(subFieldReq)
            })
            return elementSample
          })
        }
        return []

      default:
        return null
    }
  }

  /**
   * 生成值类型示例数据
   */
  private generateValueSampleData(valueType: string): any {
    switch (valueType) {
      case 'number':
        return Math.round(Math.random() * 100)
      case 'string':
        return '示例文本'
      case 'boolean':
        return Math.random() > 0.5
      case 'any':
      default:
        return '示例数据'
    }
  }

  /**
   * 获取已注册组件数量
   */
  getRegisteredCount(): number {
    return this.requirements.size
  }

  /**
   * 清空所有需求
   */
  clear(): void {
    this.requirements.clear()
    this.relationshipCache.clear()
  }

  /**
   * 导出所有需求
   */
  exportRequirements(): Record<string, ComponentDataRequirement> {
    const exported: Record<string, ComponentDataRequirement> = {}
    this.requirements.forEach((requirement, componentId) => {
      exported[componentId] = { ...requirement }
    })
    return exported
  }

  /**
   * 导入需求
   */
  importRequirements(requirements: Record<string, ComponentDataRequirement>): void {
    Object.entries(requirements).forEach(([componentId, requirement]) => {
      try {
        this.registerRequirement(componentId, requirement)
      } catch (error) {
      }
    })
  }
}

// 创建全局实例
export const componentRequirementManager = new ComponentRequirementManager()

export default componentRequirementManager
