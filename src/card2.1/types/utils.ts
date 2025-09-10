/**
 * Card2.1 类型工具函数集合
 * 提供类型操作、转换和辅助功能
 */

import type {
  ComponentDefinition,
  DataSourceRequirement,
  StaticParamRequirement,
  Setting,
  CustomConfig,
  DataConfig,
  SettingControlType,
  ComponentSettingConfig,
  SettingGroup,
  DataFieldType,
  InteractionEventType,
  InteractionActionType
} from './index'

// ============ 类型转换工具 ============

/**
 * 从设置项列表生成默认配置对象
 * @param settings 设置项列表
 * @returns 默认配置对象
 */
export function generateDefaultConfigFromSettings<T = Record<string, any>>(settings: Setting[]): T {
  const config = {} as T
  
  settings.forEach(setting => {
    const keys = setting.field.split('.')
    let current = config as any
    
    // 处理嵌套字段路径，如 'customize.title'
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    }
    
    const finalKey = keys[keys.length - 1]
    current[finalKey] = setting.defaultValue
  })
  
  return config
}

/**
 * 将设置项按分组组织
 * @param settings 设置项列表
 * @returns 按分组组织的设置项
 */
export function groupSettingsByGroup(settings: Setting[]): Record<string, Setting[]> {
  const groups: Record<string, Setting[]> = {}
  
  settings.forEach(setting => {
    const group = setting.group || '默认分组'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(setting)
  })
  
  return groups
}

/**
 * 根据控件类型推断TypeScript类型
 * @param controlType 控件类型
 * @returns TypeScript类型字符串
 */
export function inferTSTypeFromControlType(controlType: SettingControlType | string): string {
  switch (controlType) {
    case SettingControlType.INPUT:
    case SettingControlType.TEXTAREA:
    case SettingControlType.SELECT:
    case SettingControlType.RADIO_GROUP:
    case SettingControlType.COLOR_PICKER:
      return 'string'
    
    case SettingControlType.INPUT_NUMBER:
    case SettingControlType.SLIDER:
      return 'number'
    
    case SettingControlType.SWITCH:
    case SettingControlType.CHECKBOX:
      return 'boolean'
    
    case SettingControlType.DATE_PICKER:
      return 'Date'
    
    case SettingControlType.DYNAMIC_TAGS:
      return 'string[]'
    
    case SettingControlType.VUE_COMPONENT:
      return 'any'
    
    default:
      return 'any'
  }
}

/**
 * 从数据字段类型推断默认值
 * @param fieldType 数据字段类型
 * @returns 默认值
 */
export function getDefaultValueForFieldType(fieldType: DataFieldType): any {
  switch (fieldType) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'date':
      return new Date()
    case 'array':
      return []
    case 'object':
      return {}
    case 'value':
      return null
    default:
      return undefined
  }
}

// ============ 配置对象操作工具 ============

/**
 * 深度合并配置对象
 * @param target 目标配置对象
 * @param source 源配置对象
 * @returns 合并后的配置对象
 */
export function deepMergeConfig<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key]
      const targetValue = result[key]
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
          targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        result[key] = deepMergeConfig(targetValue, sourceValue)
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
  }
  
  return result
}

/**
 * 从配置对象中提取字段值
 * @param config 配置对象
 * @param fieldPath 字段路径，如 'customize.title'
 * @returns 字段值
 */
export function extractFieldValue(config: any, fieldPath: string): any {
  const keys = fieldPath.split('.')
  let current = config
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }
  
  return current
}

/**
 * 向配置对象设置字段值
 * @param config 配置对象
 * @param fieldPath 字段路径，如 'customize.title'
 * @param value 要设置的值
 * @returns 更新后的配置对象
 */
export function setFieldValue<T extends Record<string, any>>(config: T, fieldPath: string, value: any): T {
  const keys = fieldPath.split('.')
  const result = { ...config }
  let current = result as any
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    } else {
      current[key] = { ...current[key] }
    }
    current = current[key]
  }
  
  const finalKey = keys[keys.length - 1]
  current[finalKey] = value
  
  return result
}

// ============ 组件定义操作工具 ============

/**
 * 创建组件配置模板
 * @param componentType 组件类型
 * @param settings 设置项列表
 * @returns 组件设置配置
 */
export function createComponentSettingConfig<T = Record<string, any>>(
  componentType: string,
  settings: Setting[],
  customConfig?: CustomConfig<T>
): ComponentSettingConfig<T> {
  const defaultCustomConfig: CustomConfig<T> = customConfig || {
    type: componentType,
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: generateDefaultConfigFromSettings<T>(settings)
  }

  return {
    componentType,
    settings,
    customConfig: defaultCustomConfig
  }
}

/**
 * 提取组件的数据源需求
 * @param definition 组件定义
 * @returns 数据源需求列表
 */
export function extractDataSourceRequirements(definition: ComponentDefinition): DataSourceRequirement[] {
  return definition.dataSources || []
}

/**
 * 提取组件的静态参数需求
 * @param definition 组件定义
 * @returns 静态参数需求列表
 */
export function extractStaticParamRequirements(definition: ComponentDefinition): StaticParamRequirement[] {
  return definition.staticParams || []
}

/**
 * 检查组件是否支持特定数据源类型
 * @param definition 组件定义
 * @param dataSourceType 数据源类型
 * @returns 是否支持
 */
export function supportsDataSourceType(
  definition: ComponentDefinition,
  dataSourceType: 'static' | 'api' | 'websocket' | 'mqtt' | 'database' | 'script'
): boolean {
  const dataSources = definition.dataSources || []
  return dataSources.some(ds => ds.supportedTypes.includes(dataSourceType))
}

// ============ 数据源和字段映射工具 ============

/**
 * 创建字段映射配置
 * @param sourceField 源字段名
 * @param targetField 目标字段名
 * @param fieldType 字段类型
 * @param options 可选配置
 * @returns 字段映射配置
 */
export function createFieldMapping(
  sourceField: string,
  targetField: string,
  fieldType: DataFieldType,
  options: {
    required?: boolean
    defaultValue?: any
    transform?: string
  } = {}
): Record<string, any> {
  return {
    [sourceField]: {
      targetField,
      type: fieldType,
      required: options.required ?? false,
      defaultValue: options.defaultValue ?? getDefaultValueForFieldType(fieldType),
      transform: options.transform
    }
  }
}

/**
 * 合并多个字段映射配置
 * @param mappings 字段映射配置数组
 * @returns 合并后的字段映射配置
 */
export function mergeFieldMappings(...mappings: Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...mappings)
}

// ============ 交互配置工具 ============

/**
 * 创建简单的点击跳转交互配置
 * @param url 跳转URL
 * @param external 是否外部链接
 * @returns 交互配置
 */
export function createClickJumpInteraction(url: string, external: boolean = true) {
  return {
    event: 'click' as InteractionEventType,
    responses: [{
      action: 'jump' as InteractionActionType,
      jumpConfig: {
        jumpType: external ? 'external' : 'internal',
        url: external ? url : undefined,
        internalPath: !external ? url : undefined,
        target: external ? '_blank' : '_self'
      }
    }],
    enabled: true
  }
}

/**
 * 创建属性修改交互配置
 * @param targetComponentId 目标组件ID
 * @param targetProperty 目标属性
 * @param updateValue 更新值
 * @returns 交互配置
 */
export function createModifyInteraction(
  targetComponentId: string,
  targetProperty: string,
  updateValue: any
) {
  return {
    event: 'click' as InteractionEventType,
    responses: [{
      action: 'modify' as InteractionActionType,
      modifyConfig: {
        targetComponentId,
        targetProperty,
        updateValue,
        updateMode: 'replace'
      }
    }],
    enabled: true
  }
}

// ============ 分组和分类工具 ============

/**
 * 根据文件路径推断组件分类
 * @param filePath 组件文件路径
 * @returns 分类信息
 */
export function inferCategoryFromPath(filePath: string): {
  mainCategory: string
  subCategory?: string
  category: string
} {
  const pathParts = filePath.split('/').filter(part => part && part !== '.')
  
  // 查找components目录后的路径部分
  const componentsIndex = pathParts.findIndex(part => part === 'components')
  if (componentsIndex === -1 || componentsIndex >= pathParts.length - 1) {
    return {
      mainCategory: '其他',
      category: '其他'
    }
  }
  
  const categoryParts = pathParts.slice(componentsIndex + 1)
  const mainCategory = categoryParts[0] || '其他'
  const subCategory = categoryParts.length > 2 ? categoryParts[1] : undefined
  
  return {
    mainCategory,
    subCategory,
    category: subCategory ? `${mainCategory}/${subCategory}` : mainCategory
  }
}

/**
 * 创建设置分组
 * @param name 分组名称
 * @param label 分组标签
 * @param fields 字段列表
 * @param options 可选配置
 * @returns 设置分组配置
 */
export function createSettingGroup(
  name: string,
  label: string,
  fields: string[],
  options: {
    description?: string
    collapsible?: boolean
    defaultExpanded?: boolean
  } = {}
): SettingGroup {
  return {
    name,
    label,
    fields,
    description: options.description,
    collapsible: options.collapsible ?? true,
    defaultExpanded: options.defaultExpanded ?? true
  }
}

// ============ 开发辅助工具 ============

/**
 * 生成组件定义的TypeScript接口代码
 * @param definition 组件定义
 * @returns TypeScript接口代码字符串
 */
export function generateTSInterfaceFromDefinition(definition: ComponentDefinition): string {
  const interfaceName = `${pascalCase(definition.type)}Config`
  const staticParams = definition.staticParams || []
  const dataSources = definition.dataSources || []
  
  let interfaceCode = `interface ${interfaceName} {\n`
  
  // 生成静态参数字段
  staticParams.forEach(param => {
    const tsType = param.type === 'array' ? 'any[]' : 
                   param.type === 'object' ? 'Record<string, any>' : param.type
    interfaceCode += `  /** ${param.description} */\n`
    interfaceCode += `  ${param.key}${param.required === false ? '?' : ''}: ${tsType}\n`
  })
  
  // 生成数据源字段
  dataSources.forEach(ds => {
    if (ds.fieldMappings) {
      Object.entries(ds.fieldMappings).forEach(([_, mapping]) => {
        const tsType = mapping.type === 'array' ? 'any[]' :
                       mapping.type === 'object' ? 'Record<string, any>' : 
                       mapping.type === 'number' ? 'number' :
                       mapping.type === 'boolean' ? 'boolean' : 'string'
        interfaceCode += `  /** ${ds.description} - ${mapping.targetField} */\n`
        interfaceCode += `  ${mapping.targetField}${!mapping.required ? '?' : ''}: ${tsType}\n`
      })
    }
  })
  
  interfaceCode += '}'
  
  return interfaceCode
}

/**
 * 将字符串转换为PascalCase
 * @param str 输入字符串
 * @returns PascalCase字符串
 */
function pascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

/**
 * 验证组件配置的完整性
 * @param definition 组件定义
 * @param config 组件配置
 * @returns 验证结果
 */
export function validateComponentConfig(
  definition: ComponentDefinition,
  config: any
): {
  valid: boolean
  missingFields: string[]
  invalidFields: string[]
  warnings: string[]
} {
  const result = {
    valid: true,
    missingFields: [] as string[],
    invalidFields: [] as string[],
    warnings: [] as string[]
  }
  
  // 检查静态参数
  const staticParams = definition.staticParams || []
  staticParams.forEach(param => {
    const value = extractFieldValue(config, param.key)
    
    if (param.required && (value === undefined || value === null)) {
      result.missingFields.push(param.key)
    }
    
    if (value !== undefined && value !== null) {
      // 简单类型检查
      const expectedType = param.type
      const actualType = Array.isArray(value) ? 'array' : typeof value
      
      if (expectedType !== actualType && expectedType !== 'object') {
        result.invalidFields.push(`${param.key}: 期望 ${expectedType}, 实际 ${actualType}`)
      }
    }
  })
  
  result.valid = result.missingFields.length === 0 && result.invalidFields.length === 0
  return result
}

// ============ 导出所有工具函数 ============

export const TypeUtils = {
  // 类型转换
  generateDefaultConfigFromSettings,
  groupSettingsByGroup,
  inferTSTypeFromControlType,
  getDefaultValueForFieldType,
  
  // 配置操作
  deepMergeConfig,
  extractFieldValue,
  setFieldValue,
  
  // 组件定义
  createComponentSettingConfig,
  extractDataSourceRequirements,
  extractStaticParamRequirements,
  supportsDataSourceType,
  
  // 字段映射
  createFieldMapping,
  mergeFieldMappings,
  
  // 交互配置
  createClickJumpInteraction,
  createModifyInteraction,
  
  // 分组分类
  inferCategoryFromPath,
  createSettingGroup,
  
  // 开发工具
  generateTSInterfaceFromDefinition,
  validateComponentConfig
}