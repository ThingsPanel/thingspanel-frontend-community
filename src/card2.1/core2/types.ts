/**
 * Card2.1 核心类型定义
 * 统一管理所有核心类型，避免类型分散
 */

import type { Component } from 'vue'

// ============ 组件定义相关类型 ============

/**
 * 组件定义接口
 */
export interface ComponentDefinition<TConfig = Record<string, any>> {
  type: string
  name: string
  description: string
  component: Component
  dataSources?: DataSourceRequirement[]
  propertyWhitelist?: ComponentPropertyWhitelist
  defaultConfig?: ComponentDefaultConfig<TConfig>
  staticParams?: Record<string, StaticParamDefinition>
  supportedDataSources?: string[]
  permission?: string
  version?: string
  tags?: string[]
  isRegistered?: boolean

  // 分类信息
  mainCategory?: string
  subCategory?: string
  category?: string
}

/**
 * 数据源需求定义
 */
export interface DataSourceRequirement {
  key: string
  type: 'static' | 'dynamic' | 'websocket'
  description?: string
  required?: boolean
  defaultValue?: any
}

/**
 * 组件属性白名单
 */
export interface ComponentPropertyWhitelist {
  [propName: string]: PropertyExposureConfig
}

/**
 * 属性暴露配置
 */
export interface PropertyExposureConfig {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  label: string
  description?: string
  required?: boolean
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  group?: string
  order?: number
  hidden?: boolean
  disabled?: boolean
}

/**
 * 组件默认配置
 */
export interface ComponentDefaultConfig<TConfig = Record<string, any>> {
  staticParams?: TConfig
  dataSources?: Record<string, any>
  interactions?: any[]
}

/**
 * 静态参数定义
 */
export interface StaticParamDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  label: string
  description?: string
  default?: any
  required?: boolean
  options?: Array<{ label: string; value: any }>
  group?: string
  order?: number
}

// ============ 分类系统类型 ============

/**
 * 分类配置接口
 */
export interface CategoryConfig {
  id: string
  displayName: string
  order: number
  icon?: string
  description?: string
  enabled?: boolean
  devOnly?: boolean
  parentId?: 'system' | 'chart'
}

/**
 * 组件分类
 */
export interface ComponentCategory {
  id: string
  name: string
  description?: string
  icon?: string
  children?: ComponentCategory[]
}

/**
 * 组件树结构
 */
export interface ComponentTree {
  categories: ComponentCategory[]
  components: ComponentDefinition[]
  totalCount: number
}

// ============ 数据源相关类型 ============

/**
 * 执行器数据格式
 */
export interface ExecutorData {
  [key: string]: unknown
  main?: {
    [dataSourceKey: string]: unknown
  }
  primaryData?: any
}

/**
 * 数据源映射结果
 */
export interface DataSourceMappingResult {
  [propName: string]: unknown
}

// ============ 交互系统类型 ============

/**
 * 交互配置
 */
export interface InteractionConfig {
  id: string
  name: string
  description?: string
  eventType: InteractionEventType
  conditions?: ConditionConfig[]
  responses: InteractionResponse[]
  enabled?: boolean
}

/**
 * 交互事件类型
 */
export type InteractionEventType = 'click' | 'hover' | 'focus' | 'blur' | 'change' | 'custom'

/**
 * 条件配置
 */
export interface ConditionConfig {
  property: string
  operator: ComparisonOperator
  value: any
}

/**
 * 比较操作符
 */
export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains'

/**
 * 交互响应
 */
export interface InteractionResponse {
  action: InteractionActionType
  [key: string]: any
}

/**
 * 交互动作类型
 */
export type InteractionActionType = 'jump' | 'modify' | 'showNotification' | 'changeVisibility'

/**
 * 跳转配置
 */
export interface JumpConfig {
  jumpType: 'internal' | 'external'
  target?: string
  url?: string
  internalPath?: string
}

/**
 * 修改配置
 */
export interface ModifyConfig {
  targetComponentId: string
  targetProperty: string
  updateValue: any
  updateMode: 'replace' | 'append' | 'increment'
}

/**
 * 组件交互状态
 */
export interface ComponentInteractionState {
  [interactionId: string]: any
}

// ============ 表单配置类型 ============

/**
 * TypeScript 配置
 */
export interface TSConfig {
  title?: string
  description?: string
  fields: FormField[]
  groups?: FormGroup[]
}

/**
 * 配置模式
 */
export type ConfigMode = 'standard' | 'vue-component' | 'hybrid'

/**
 * 表单字段
 */
export interface FormField {
  type: string
  label: string
  field: string
  group?: string
  placeholder?: string
  defaultValue?: any
  required?: boolean
  options?: Array<{ label: string; value: any }>
  description?: string
  hidden?: boolean
  disabled?: boolean
}

/**
 * 表单分组
 */
export interface FormGroup {
  name: string
  label: string
  description?: string
  fields: string[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============ 权限相关类型 ============

/**
 * 用户权限类型
 */
export type UserAuthority = 'SYS_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | '不限'

// ============ 注册表接口 ============

/**
 * 组件注册表接口
 */
export interface IComponentRegistry {
  register(definition: ComponentDefinition): void
  get(type: string): ComponentDefinition | undefined
  getAll(): ComponentDefinition[]
  has(type: string): boolean
  clear(): void
  getDataSourceKeys(type: string): string[]
  getStaticParamKeys(type: string): string[]
}

/**
 * 数据源映射器接口
 */
export interface IDataSourceMapper {
  mapDataSources(componentType: string, executorData: ExecutorData | null | undefined): DataSourceMappingResult
  mapStaticParams(componentType: string, staticParams: Record<string, any> | null | undefined): Record<string, any>
  validateMapping(
    componentType: string,
    mappingResult: DataSourceMappingResult
  ): {
    isValid: boolean
    missingKeys: string[]
    extraKeys: string[]
  }
}

/**
 * 属性暴露管理器接口
 */
export interface IPropertyExposureManager {
  registerPropertyWhitelist(componentType: string, whitelist: ComponentPropertyWhitelist): void
  getPropertyWhitelist(componentType: string): ComponentPropertyWhitelist | undefined
  getAllPropertyWhitelists(): Record<string, ComponentPropertyWhitelist>
  addGlobalBaseProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist
}

// ============ 导出所有类型 ============

export type {
  ComponentDefinition,
  DataSourceRequirement,
  ComponentPropertyWhitelist,
  PropertyExposureConfig,
  ComponentDefaultConfig,
  StaticParamDefinition,
  CategoryConfig,
  ComponentCategory,
  ComponentTree,
  ExecutorData,
  DataSourceMappingResult,
  InteractionConfig,
  InteractionEventType,
  ConditionConfig,
  ComparisonOperator,
  InteractionResponse,
  InteractionActionType,
  JumpConfig,
  ModifyConfig,
  ComponentInteractionState,
  TSConfig,
  ConfigMode,
  FormField,
  FormGroup,
  UserAuthority,
  IComponentRegistry,
  IDataSourceMapper,
  IPropertyExposureManager
}