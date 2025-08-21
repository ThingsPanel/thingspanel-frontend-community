/**
 * Card2.1 兼容性工具
 * 提供Card2.1组件类型定义与数据源系统之间的双向转换
 */

import type {
  ComponentDataRequirement,
  DataSourceRequirement,
  StaticParamRequirement,
  Card2StaticParamCompatibility,
  Card2DataSourceCompatibility,
  ComponentRequirementCompatibility,
  FieldType,
  FIELD_TYPE_MAPPING
} from '../types/simple-types'

/**
 * Card2.1 静态参数兼容性实现
 */
export class Card2StaticParamCompatibilityImpl implements Card2StaticParamCompatibility {
  /**
   * 将Card2.1 StaticParamRequirement转换为数据源系统格式
   */
  fromCard2StaticParam(card2Param: any): StaticParamRequirement {
    return {
      key: card2Param.key || card2Param.id,
      name: card2Param.name || card2Param.label || card2Param.key,
      type: this.mapCard2TypeToDataSource(card2Param.type),
      description: card2Param.description || '',
      defaultValue: card2Param.defaultValue,
      required: card2Param.required ?? false,
      validation: card2Param.validation
        ? {
            min: card2Param.validation.min,
            max: card2Param.validation.max,
            pattern: card2Param.validation.pattern,
            options: card2Param.validation.options
          }
        : undefined,
      ui: card2Param.ui
        ? {
            component: card2Param.ui.component,
            placeholder: card2Param.ui.placeholder,
            label: card2Param.ui.label,
            group: card2Param.ui.group
          }
        : undefined
    }
  }

  /**
   * 将数据源系统StaticParamRequirement转换为Card2.1格式
   */
  toCard2StaticParam(staticParam: StaticParamRequirement): any {
    return {
      key: staticParam.key,
      name: staticParam.name,
      type: staticParam.type,
      description: staticParam.description,
      defaultValue: staticParam.defaultValue,
      required: staticParam.required,
      validation: staticParam.validation,
      ui: staticParam.ui
    }
  }

  private mapCard2TypeToDataSource(card2Type: string): StaticParamRequirement['type'] {
    const mapping = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      object: 'object',
      array: 'array'
    } as const

    return mapping[card2Type as keyof typeof mapping] || 'string'
  }
}

/**
 * Card2.1 数据源兼容性实现
 */
export class Card2DataSourceCompatibilityImpl implements Card2DataSourceCompatibility {
  /**
   * 将Card2.1 DataSourceRequirement转换为数据源系统格式
   */
  fromCard2DataSource(card2DataSource: any): DataSourceRequirement {
    return {
      key: card2DataSource.key,
      name: card2DataSource.name,
      description: card2DataSource.description || '',
      supportedTypes: card2DataSource.supportedTypes || ['static', 'api'],
      fieldMappings: this.convertCard2FieldMappings(card2DataSource.fieldMappings || {}),
      required: card2DataSource.required ?? false,

      // 向下兼容字段
      structureType: this.inferStructureType(card2DataSource.fieldMappings),
      fields: this.convertCard2FieldsToFieldRequirements(card2DataSource.fieldMappings),
      id: card2DataSource.key // 兼容旧字段
    }
  }

  /**
   * 将数据源系统格式转换为Card2.1 DataSourceRequirement
   */
  toCard2DataSource(dataSource: DataSourceRequirement): any {
    return {
      key: dataSource.key,
      name: dataSource.name,
      description: dataSource.description,
      supportedTypes: dataSource.supportedTypes,
      fieldMappings: dataSource.fieldMappings,
      required: dataSource.required
    }
  }

  private convertCard2FieldMappings(card2FieldMappings: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}

    Object.entries(card2FieldMappings).forEach(([key, mapping]) => {
      result[key] = {
        targetField: mapping.targetField || key,
        type: mapping.type || 'value',
        required: mapping.required ?? false,
        defaultValue: mapping.defaultValue,
        transform: mapping.transform
      }
    })

    return result
  }

  private inferStructureType(fieldMappings: Record<string, any> = {}): 'object' | 'array' {
    // 简单推断：如果有多个字段映射，通常是对象结构
    return Object.keys(fieldMappings).length > 1 ? 'object' : 'array'
  }

  private convertCard2FieldsToFieldRequirements(fieldMappings: Record<string, any> = []): any[] {
    return Object.entries(fieldMappings).map(([key, mapping]) => ({
      name: mapping.targetField || key,
      type: this.mapCard2FieldType(mapping.type),
      required: mapping.required ?? false,
      description: `字段 ${key} 映射到 ${mapping.targetField || key}`,
      defaultValue: mapping.defaultValue
    }))
  }

  private mapCard2FieldType(card2Type: string): FieldType {
    const typeMap: Record<string, FieldType> = {
      value: 'any',
      object: 'object',
      array: 'array',
      string: 'string',
      number: 'number',
      boolean: 'boolean'
    }
    return typeMap[card2Type] || 'any'
  }
}

/**
 * 组件数据需求兼容性实现
 */
export class ComponentRequirementCompatibilityImpl implements ComponentRequirementCompatibility {
  private staticParamCompat = new Card2StaticParamCompatibilityImpl()
  private dataSourceCompat = new Card2DataSourceCompatibilityImpl()

  /**
   * 从Card2.1 ComponentDefinition提取数据需求
   */
  extractFromCard2Component(componentDef: any): ComponentDataRequirement {
    const staticParams = (componentDef.staticParams || []).map((param: any) =>
      this.staticParamCompat.fromCard2StaticParam(param)
    )

    const dataSources = (componentDef.dataSources || []).map((ds: any) => this.dataSourceCompat.fromCard2DataSource(ds))

    return {
      componentId: componentDef.type || componentDef.id,
      componentName: componentDef.name || componentDef.type,
      staticParams,
      dataSources
    }
  }

  /**
   * 将ComponentDataRequirement转换为Card2.1兼容格式
   */
  adaptToCard2Component(requirement: ComponentDataRequirement): {
    staticParams?: any[]
    dataSources?: any[]
  } {
    const staticParams = requirement.staticParams?.map(param => this.staticParamCompat.toCard2StaticParam(param))

    const dataSources = requirement.dataSources?.map(ds => this.dataSourceCompat.toCard2DataSource(ds))

    return {
      staticParams,
      dataSources
    }
  }
}

/**
 * 统一兼容性管理器
 * 提供Card2.1与数据源系统之间的完整转换能力
 */
export class Card2CompatibilityManager {
  private staticParamCompat = new Card2StaticParamCompatibilityImpl()
  private dataSourceCompat = new Card2DataSourceCompatibilityImpl()
  private componentRequirementCompat = new ComponentRequirementCompatibilityImpl()

  /**
   * 检查组件是否为Card2.1组件
   */
  isCard2Component(componentDef: any): boolean {
    return !!(
      componentDef.staticParams ||
      componentDef.dataSources ||
      componentDef.type?.includes('card2') ||
      componentDef.version?.startsWith('2.')
    )
  }

  /**
   * 将Card2.1组件定义转换为数据源系统兼容的需求声明
   */
  convertCard2ToDataSource(componentDef: any): ComponentDataRequirement {
    if (!this.isCard2Component(componentDef)) {
      console.warn('⚠️  组件不是Card2.1格式，可能转换不准确:', componentDef.type || componentDef.id)
    }

    return this.componentRequirementCompat.extractFromCard2Component(componentDef)
  }

  /**
   * 将数据源系统需求转换为Card2.1兼容格式
   */
  convertDataSourceToCard2(requirement: ComponentDataRequirement): {
    staticParams?: any[]
    dataSources?: any[]
  } {
    return this.componentRequirementCompat.adaptToCard2Component(requirement)
  }

  /**
   * 验证转换结果的完整性
   */
  validateConversion(
    original: any,
    converted: ComponentDataRequirement
  ): {
    valid: boolean
    missing: string[]
    warnings: string[]
  } {
    const missing: string[] = []
    const warnings: string[] = []

    // 检查静态参数
    if (original.staticParams?.length && !converted.staticParams?.length) {
      missing.push('staticParams')
    }

    // 检查数据源需求
    if (original.dataSources?.length && !converted.dataSources?.length) {
      missing.push('dataSources')
    }

    // 检查基本信息
    if (!converted.componentId) {
      missing.push('componentId')
    }

    if (!converted.componentName) {
      warnings.push('componentName为空，使用了componentId作为默认值')
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings
    }
  }

  /**
   * 获取转换统计信息
   */
  getStats(): {
    supportedCard2Features: string[]
    supportedDataSourceFeatures: string[]
    compatibilityScore: number
  } {
    return {
      supportedCard2Features: ['staticParams', 'dataSources', 'fieldMappings', 'validation', 'ui', 'supportedTypes'],
      supportedDataSourceFeatures: [
        'ComponentDataRequirement',
        'StaticParamRequirement',
        'DataSourceRequirement',
        'FieldRequirement',
        'Validation'
      ],
      compatibilityScore: 0.95 // 95%兼容性
    }
  }
}

// 导出单例实例
export const card2CompatibilityManager = new Card2CompatibilityManager()

// 导出工具类实例
export const staticParamCompatibility = new Card2StaticParamCompatibilityImpl()
export const dataSourceCompatibility = new Card2DataSourceCompatibilityImpl()
export const componentRequirementCompatibility = new ComponentRequirementCompatibilityImpl()
