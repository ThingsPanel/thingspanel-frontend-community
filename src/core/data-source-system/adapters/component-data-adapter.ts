/**
 * 组件数据适配器 - 增强Card2.1兼容性
 * 将简化数据源系统的标准输出适配到现有组件格式
 * 支持 visual-editor 和 card2.1 组件的向后兼容
 * 新增：支持Card2.1的复杂数据需求声明和统一字段映射
 */

import type {
  ComponentData,
  VisualEditorCompatibleProps,
  Card21CompatibleProps,
  StandardComponentProps,
  ComponentType,
  ComponentDataRequirement,
  DataSourceRequirement,
  StaticParamRequirement
} from '../types/simple-types'

// 引入Card2.1兼容性工具
import { card2CompatibilityManager } from '../utils/card2-compatibility'

/**
 * Visual Editor 适配器
 * 将标准组件数据转换为 Visual Editor 组件期望的格式
 */
export class VisualEditorAdapter {
  /**
   * 适配到 Visual Editor 格式
   * 学习自现有组件的 props 结构
   */
  adaptToVisualEditor(componentData: ComponentData): VisualEditorCompatibleProps {
    const dataSourceBindings: { [dataSourceId: string]: { rawData: string } } = {}

    // 将每个数据源转换为 rawData 字符串格式
    Object.entries(componentData).forEach(([dataSourceId, sourceData]) => {
      dataSourceBindings[dataSourceId] = {
        rawData: JSON.stringify(sourceData.data)
      }
    })

    return {
      widgetConfiguration: {
        dataSource: {
          config: {
            dataSourceBindings
          }
        }
      }
    }
  }

  /**
   * 从 Visual Editor 格式提取数据
   * 用于反向解析现有组件的数据
   */
  extractFromVisualEditor(props: VisualEditorCompatibleProps): ComponentData {
    const componentData: ComponentData = {}
    const bindings = props.widgetConfiguration?.dataSource?.config?.dataSourceBindings

    if (bindings) {
      Object.entries(bindings).forEach(([dataSourceId, binding]) => {
        try {
          const data = JSON.parse(binding.rawData)
          componentData[dataSourceId] = {
            type: 'unknown',
            data,
            lastUpdated: Date.now()
          }
        } catch (error) {
          console.warn(`❌ Visual Editor 数据解析失败: ${dataSourceId}`, error)
          componentData[dataSourceId] = {
            type: 'unknown',
            data: null,
            lastUpdated: Date.now(),
            metadata: { error: '数据解析失败' }
          }
        }
      })
    }

    return componentData
  }
}

/**
 * Card2.1 适配器 - 增强版
 * 将标准组件数据转换为 Card2.1 组件期望的格式
 * 支持复杂数据需求声明和字段映射
 */
export class Card21Adapter {
  /**
   * 适配到 Card2.1 格式
   * 学习自 DualDataTest.vue 的数据接收模式
   */
  adaptToCard21(componentData: ComponentData): Card21CompatibleProps {
    const dataSourceBindings: { [dataSourceId: string]: { rawData: string } } = {}

    // 将每个数据源转换为 rawData 字符串格式
    Object.entries(componentData).forEach(([dataSourceId, sourceData]) => {
      dataSourceBindings[dataSourceId] = {
        rawData: JSON.stringify(sourceData.data)
      }
    })

    return {
      rawDataSources: {
        dataSourceBindings
      }
    }
  }

  /**
   * 适配组件数据需求到Card2.1格式
   * 支持复杂数据需求声明的转换
   */
  adaptDataRequirement(requirement: ComponentDataRequirement): {
    staticParams?: any[]
    dataSources?: any[]
    supportedDataSources?: string[]
  } {
    console.log(`🔄 [Card21Adapter] 转换组件数据需求: ${requirement.componentId}`)

    // 使用兼容性管理器转换
    const converted = card2CompatibilityManager.convertDataSourceToCard2(requirement)

    // 提取支持的数据源类型
    const supportedDataSources = this.extractSupportedDataSources(requirement.dataSources)

    return {
      ...converted,
      supportedDataSources
    }
  }

  /**
   * 从数据源需求中提取支持的数据源类型
   */
  private extractSupportedDataSources(dataSources: DataSourceRequirement[]): string[] {
    const allTypes = new Set<string>()

    dataSources.forEach(ds => {
      if (ds.supportedTypes) {
        ds.supportedTypes.forEach(type => allTypes.add(type))
      }
    })

    return Array.from(allTypes)
  }

  /**
   * 适配组件配置数据 - 支持复杂字段映射
   */
  adaptComponentConfig(componentData: ComponentData, requirements?: ComponentDataRequirement): any {
    const adaptedData: any = {}

    if (!requirements) {
      // 简单模式：直接转换数据
      Object.entries(componentData).forEach(([dataSourceId, sourceData]) => {
        adaptedData[dataSourceId] = sourceData.data
      })
      return adaptedData
    }

    // 复杂模式：根据需求声明进行字段映射
    requirements.dataSources?.forEach(dataSourceReq => {
      const sourceData = componentData[dataSourceReq.key]
      if (!sourceData) {
        console.warn(`⚠️  [Card21Adapter] 未找到数据源: ${dataSourceReq.key}`)
        return
      }

      // 按照fieldMappings进行字段映射
      if (dataSourceReq.fieldMappings) {
        const mappedData: any = {}

        Object.entries(dataSourceReq.fieldMappings).forEach(([sourceField, mapping]) => {
          const sourceValue = this.extractFieldValue(sourceData.data, sourceField)
          const mappedValue = this.applyFieldMapping(sourceValue, mapping)
          mappedData[mapping.targetField] = mappedValue
        })

        adaptedData[dataSourceReq.key] = mappedData
      } else {
        // 没有映射规则，直接使用原始数据
        adaptedData[dataSourceReq.key] = sourceData.data
      }
    })

    return adaptedData
  }

  /**
   * 提取字段值，支持嵌套路径
   */
  private extractFieldValue(data: any, fieldPath: string): any {
    const keys = fieldPath.split('.')
    let value = data

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * 应用字段映射规则
   */
  private applyFieldMapping(sourceValue: any, mapping: any): any {
    // 处理默认值
    if (sourceValue === undefined || sourceValue === null) {
      return mapping.defaultValue
    }

    // 处理转换函数
    if (mapping.transform && typeof mapping.transform === 'string') {
      try {
        // 简单的转换函数执行（生产环境中需要更安全的实现）
        const transformFn = new Function('value', `return ${mapping.transform}`)
        return transformFn(sourceValue)
      } catch (error) {
        console.warn(`⚠️  [Card21Adapter] 字段转换失败:`, error)
        return sourceValue
      }
    }

    return sourceValue
  }

  /**
   * 从 Card2.1 格式提取数据
   * 用于反向解析现有组件的数据
   */
  extractFromCard21(props: Card21CompatibleProps): ComponentData {
    const componentData: ComponentData = {}
    const bindings = props.rawDataSources?.dataSourceBindings

    if (bindings) {
      Object.entries(bindings).forEach(([dataSourceId, binding]) => {
        try {
          const data = JSON.parse(binding.rawData)
          componentData[dataSourceId] = {
            type: 'unknown',
            data,
            lastUpdated: Date.now()
          }
        } catch (error) {
          console.warn(`❌ Card2.1 数据解析失败: ${dataSourceId}`, error)
          componentData[dataSourceId] = {
            type: 'unknown',
            data: null,
            lastUpdated: Date.now(),
            metadata: { error: '数据解析失败' }
          }
        }
      })
    }

    return componentData
  }

  /**
   * 从 Card2.1 组件定义提取数据需求
   * 支持复杂的staticParams和dataSources结构
   */
  extractRequirementFromCard2Definition(componentDef: any): ComponentDataRequirement | null {
    try {
      return card2CompatibilityManager.convertCard2ToDataSource(componentDef)
    } catch (error) {
      console.error(`❌ [Card21Adapter] 提取Card2.1组件需求失败:`, error)
      return null
    }
  }

  /**
   * 验证Card2.1组件数据是否符合需求
   */
  validateCard2Data(
    data: ComponentData,
    requirement: ComponentDataRequirement
  ): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证数据源需求
    requirement.dataSources?.forEach(dsReq => {
      if (dsReq.required && !data[dsReq.key]) {
        errors.push(`缺少必需的数据源: ${dsReq.key}`)
      }

      const sourceData = data[dsReq.key]
      if (sourceData && dsReq.fieldMappings) {
        // 验证字段映射
        Object.entries(dsReq.fieldMappings).forEach(([sourceField, mapping]) => {
          if (mapping.required) {
            const fieldValue = this.extractFieldValue(sourceData.data, sourceField)
            if (fieldValue === undefined || fieldValue === null) {
              errors.push(`数据源 ${dsReq.key} 缺少必需字段: ${sourceField}`)
            }
          }
        })
      }
    })

    // 验证静态参数
    requirement.staticParams?.forEach(param => {
      if (param.required && !data[param.key]) {
        errors.push(`缺少必需的静态参数: ${param.key}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * 标准组件适配器
 * 用于新组件的标准数据格式
 */
export class StandardComponentAdapter {
  /**
   * 适配到标准格式
   * 新组件使用的简洁数据格式
   */
  adaptToStandard(componentData: ComponentData): StandardComponentProps {
    const dataSourceConfig: { [dataSourceId: string]: any } = {}

    Object.entries(componentData).forEach(([dataSourceId, sourceData]) => {
      dataSourceConfig[dataSourceId] = {
        type: sourceData.type,
        data: sourceData.data,
        lastUpdated: sourceData.lastUpdated,
        metadata: sourceData.metadata
      }
    })

    return {
      dataSourceConfig
    }
  }

  /**
   * 从标准格式提取数据
   */
  extractFromStandard(props: StandardComponentProps): ComponentData {
    const componentData: ComponentData = {}

    if (props.dataSourceConfig) {
      Object.entries(props.dataSourceConfig).forEach(([dataSourceId, sourceData]) => {
        componentData[dataSourceId] = {
          type: sourceData.type || 'unknown',
          data: sourceData.data,
          lastUpdated: sourceData.lastUpdated || Date.now(),
          metadata: sourceData.metadata
        }
      })
    }

    return componentData
  }
}

/**
 * 统一组件数据适配器
 * 智能检测组件类型并应用对应的适配器
 */
export class UnifiedComponentDataAdapter {
  private visualEditorAdapter = new VisualEditorAdapter()
  private card21Adapter = new Card21Adapter()
  private standardAdapter = new StandardComponentAdapter()

  /**
   * 根据组件类型适配数据
   */
  adaptForComponent(
    componentData: ComponentData,
    componentType: ComponentType
  ): VisualEditorCompatibleProps | Card21CompatibleProps | StandardComponentProps {
    console.log(`🔄 [Adapter] 为组件类型 "${componentType}" 适配数据`)

    switch (componentType) {
      case 'visual-editor':
        return this.visualEditorAdapter.adaptToVisualEditor(componentData)

      case 'card2.1':
        return this.card21Adapter.adaptToCard21(componentData)

      case 'standard':
      default:
        return this.standardAdapter.adaptToStandard(componentData)
    }
  }

  /**
   * 智能检测组件类型
   * 根据组件ID、路径或注册信息推断组件类型
   */
  detectComponentType(componentId: string): ComponentType {
    // 1. 检查组件ID模式
    if (componentId.includes('visual-editor') || componentId.includes('widget')) {
      return 'visual-editor'
    }

    if (componentId.includes('card2') || componentId.includes('dual-data')) {
      return 'card2.1'
    }

    // 2. 检查是否有已知的Visual Editor组件
    const visualEditorComponents = ['bar-chart-widget', 'digit-indicator-widget', 'text-widget', 'image-widget']

    if (visualEditorComponents.some(comp => componentId.includes(comp))) {
      return 'visual-editor'
    }

    // 3. 检查是否有已知的Card2.1组件
    const card21Components = ['dual-data-test', 'user-info-card']

    if (card21Components.some(comp => componentId.includes(comp))) {
      return 'card2.1'
    }

    // 4. 检查是否有Card2.1特有属性
    if (componentId.includes('card2') || componentId.includes('dual-data') || componentId.includes('test-component')) {
      return 'card2.1'
    }

    // 5. 默认为标准组件
    return 'standard'
  }

  /**
   * 便捷方法：自动检测并适配
   */
  autoAdapt(componentData: ComponentData, componentId: string): any {
    const componentType = this.detectComponentType(componentId)
    return this.adaptForComponent(componentData, componentType)
  }

  /**
   * 从任意格式提取标准数据
   */
  extractToStandardData(props: any, componentType?: ComponentType): ComponentData {
    if (!componentType) {
      // 尝试从props结构推断类型
      if (props.widgetConfiguration?.dataSource?.config?.dataSourceBindings) {
        componentType = 'visual-editor'
      } else if (props.rawDataSources?.dataSourceBindings) {
        componentType = 'card2.1'
      } else if (props.dataSourceConfig) {
        componentType = 'standard'
      } else {
        console.warn('❌ 无法识别组件数据格式，返回空数据')
        return {}
      }
    }

    switch (componentType) {
      case 'visual-editor':
        return this.visualEditorAdapter.extractFromVisualEditor(props)

      case 'card2.1':
        return this.card21Adapter.extractFromCard21(props)

      case 'standard':
        return this.standardAdapter.extractFromStandard(props)

      default:
        return {}
    }
  }

  /**
   * 获取适配器统计信息
   */
  getAdapterStats(): {
    visualEditorAdaptations: number
    card21Adaptations: number
    standardAdaptations: number
  } {
    // 这里可以添加统计逻辑
    return {
      visualEditorAdaptations: 0,
      card21Adaptations: 0,
      standardAdaptations: 0
    }
  }
}

/**
 * 导出单例实例，简化使用
 */
export const componentDataAdapter = new UnifiedComponentDataAdapter()

/**
 * 导出个别适配器实例
 */
export const visualEditorAdapter = new VisualEditorAdapter()
export const card21Adapter = new Card21Adapter()
export const standardComponentAdapter = new StandardComponentAdapter()
