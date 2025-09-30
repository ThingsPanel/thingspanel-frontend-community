/**
 * Config Engine 核心类型定义
 *
 * 包含所有配置管理系统所需的核心类型定义：
 * 1. 配置项核心类型 - ConfigurationItem 及相关类型
 * 2. 配置查询和操作类型 - 查询条件、操作结果等
 * 3. 配置验证相关类型 - 验证规则、验证结果等
 * 4. 配置生命周期类型 - 版本管理、历史记录等
 * 5. 配置关系和权限类型 - 依赖关系、权限控制等
 * 6. 配置模板和插件类型 - 模板系统、插件扩展等
 * 7. 配置导入导出类型 - 数据交换格式等
 * 8. 配置系统扩展类型 - 中间件、钩子等
 *
 * 设计原则：
 * - 类型安全：严格的 TypeScript 类型检查
 * - 可扩展：泛型和接口扩展支持
 * - 向后兼容：保持与现有系统的兼容性
 * - 文档化：详细的类型注释和说明
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

/**
 * 配置类型枚举
 * 定义 ThingsPanel 中所有支持的配置类型
 */
export enum ConfigurationType {
  /** 设备模板配置 */
  DEVICE_TEMPLATE = 'device-template',
  /** 仪表板配置 */
  DASHBOARD = 'dashboard',
  /** 可视化编辑器配置 */
  VISUAL_EDITOR = 'visual-editor',
  /** 组件配置 */
  COMPONENT = 'component',
  /** 数据源配置 */
  DATA_SOURCE = 'data-source',
  /** 用户界面配置 */
  UI_SETTINGS = 'ui-settings',
  /** 系统配置 */
  SYSTEM = 'system',
  /** 告警规则配置 */
  ALARM_RULE = 'alarm-rule',
  /** 场景联动配置 */
  SCENE_LINKAGE = 'scene-linkage',
  /** 插件配置 */
  PLUGIN = 'plugin',
  /** 主题配置 */
  THEME = 'theme',
  /** 国际化配置 */
  I18N = 'i18n',
  /** 通用配置 */
  GENERAL = 'general'
}

/**
 * 配置状态枚举
 * 表示配置项的当前状态
 */
export enum ConfigurationStatus {
  /** 草稿状态 - 正在编辑中 */
  DRAFT = 'draft',
  /** 活跃状态 - 正在使用中 */
  ACTIVE = 'active',
  /** 已发布状态 - 已正式发布 */
  PUBLISHED = 'published',
  /** 已弃用状态 - 不再推荐使用 */
  DEPRECATED = 'deprecated',
  /** 已归档状态 - 已停用但保留 */
  ARCHIVED = 'archived'
}

/**
 * 配置优先级枚举
 * 用于配置加载和应用的优先级控制
 */
export enum ConfigurationPriority {
  /** 低优先级 */
  LOW = 1,
  /** 普通优先级 */
  NORMAL = 5,
  /** 高优先级 */
  HIGH = 10,
  /** 紧急优先级 */
  URGENT = 20,
  /** 系统优先级 */
  SYSTEM = 100
}

/**
 * 📋 配置项核心接口
 *
 * 所有配置项的基础数据结构
 *
 * @template T - 配置数据的具体类型
 */
export interface ConfigurationItem<T = any> {
  /** 配置项唯一标识符 */
  id: string
  /** 配置项名称 */
  name: string
  /** 配置项描述 */
  description?: string
  /** 配置类型 */
  type: ConfigurationType
  /** 配置版本号 */
  version: string
  /** 配置状态 */
  status: ConfigurationStatus
  /** 配置优先级 */
  priority: ConfigurationPriority
  /** 配置标签（用于分类和筛选） */
  tags: string[]
  /** 目标环境（开发、测试、生产等） */
  target: string[]
  /** 配置数据主体 */
  data: T
  /** 配置元数据 */
  metadata: {
    /** 创建者 */
    creator: string
    /** 最后修改者 */
    lastModifier?: string
    /** 配置来源 */
    source: string
    /** 配置分组 */
    group?: string
    /** 是否为系统配置 */
    isSystemConfig: boolean
    /** 自定义元数据 */
    [key: string]: any
  }
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 过期时间（可选） */
  expiresAt?: Date
}

/**
 * 🔍 配置查询条件接口
 *
 * 支持复杂的配置查询需求
 */
export interface ConfigurationQuery {
  /** 按ID查询 */
  id?: string
  /** 按ID列表查询 */
  ids?: string[]
  /** 按名称查询（支持模糊匹配） */
  name?: string
  /** 按类型查询 */
  type?: ConfigurationType | ConfigurationType[]
  /** 按状态查询 */
  status?: ConfigurationStatus | ConfigurationStatus[]
  /** 按优先级查询 */
  priority?: ConfigurationPriority | ConfigurationPriority[]
  /** 按标签查询 */
  tags?: string[]
  /** 按目标环境查询 */
  target?: string[]
  /** 按创建者查询 */
  creator?: string
  /** 按时间范围查询 */
  timeRange?: {
    /** 开始时间 */
    start: Date
    /** 结束时间 */
    end: Date
    /** 时间字段类型 */
    field: 'createdAt' | 'updatedAt' | 'expiresAt'
  }
  /** 自定义查询条件 */
  customFilters?: Record<string, any>
  /** 排序条件 */
  sort?: {
    /** 排序字段 */
    field: string
    /** 排序方向 */
    order: 'asc' | 'desc'
  }[]
  /** 分页条件 */
  pagination?: {
    /** 页码（从1开始） */
    page: number
    /** 每页大小 */
    pageSize: number
  }
}

/**
 * 📊 配置操作结果接口
 *
 * 标准化的操作结果格式
 */
export interface ConfigurationOperationResult<T = any> {
  /** 操作是否成功 */
  success: boolean
  /** 错误信息（如果失败） */
  error?: string
  /** 操作结果数据 */
  data: T | null
  /** 操作类型 */
  operationType: 'create' | 'update' | 'delete' | 'query' | 'bulk'
  /** 操作时间戳 */
  timestamp: Date
  /** 操作耗时（毫秒） */
  duration: number
  /** 额外的元数据 */
  metadata?: Record<string, any>
}

// ===== 🔍 配置验证相关类型 =====

/**
 * 验证上下文接口
 * 提供验证过程中的环境信息
 */
export interface ValidationContext {
  /** 当前用户ID */
  userId?: string
  /** 操作环境 */
  environment: string
  /** 验证级别 */
  level: 'strict' | 'normal' | 'loose'
  /** 额外的上下文数据 */
  data?: Record<string, any>
}

/**
 * 验证错误接口
 * 详细的验证错误信息
 */
export interface ValidationError {
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误路径 */
  path: string
  /** 期望值 */
  expected?: any
  /** 实际值 */
  actual?: any
  /** 修复建议 */
  suggestion?: string
  /** 严重程度 */
  severity: 'error' | 'warning' | 'info'
}

/**
 * 配置验证结果接口
 * 包含完整的验证结果信息
 */
export interface ConfigurationValidationResult {
  /** 验证是否通过 */
  isValid: boolean
  /** 验证错误列表 */
  errors: ValidationError[]
  /** 验证警告列表 */
  warnings: ValidationError[]
  /** 验证时间 */
  validatedAt: Date
  /** 验证耗时（毫秒） */
  validationDuration: number
  /** 验证上下文 */
  context: Partial<ValidationContext>
}

/**
 * 验证规则接口
 * 自定义验证规则的定义
 */
export interface ValidationRule {
  /** 规则名称 */
  name: string
  /** 规则描述 */
  description: string
  /** 验证函数 */
  validate: (
    item: ConfigurationItem,
    context?: ValidationContext
  ) => Promise<ValidationError[]>
  /** 规则优先级 */
  priority?: number
  /** 规则是否启用 */
  enabled?: boolean
}

/**
 * JSON Schema 验证器接口
 * 用于结构化数据验证
 */
export interface JsonSchemaValidator {
  /** 验证数据 */
  validate: (data: any) => Promise<boolean>
  /** 获取验证错误 */
  getErrors?: () => Array<{
    message?: string
    instancePath?: string
    schema?: any
    data?: any
  }>
  /** Schema 定义 */
  schema: any
}

/**
 * 验证缓存条目接口
 * 验证结果缓存的数据结构
 */
export interface ValidationCacheEntry {
  /** 验证结果 */
  result: ConfigurationValidationResult
  /** 缓存时间戳 */
  timestamp: number
}

// ===== 📚 配置版本和历史管理类型 =====

/**
 * 配置版本接口
 * 配置版本控制的核心数据结构
 */
export interface ConfigurationVersion {
  /** 版本号 */
  version: string
  /** 配置快照 */
  snapshot: ConfigurationItem
  /** 变更描述 */
  changelog: string
  /** 变更类型 */
  changeType: 'major' | 'minor' | 'patch' | 'hotfix'
  /** 变更者 */
  author: string
  /** 版本标签 */
  tags: string[]
  /** 创建时间 */
  createdAt: Date
  /** 父版本号 */
  parentVersion?: string
}

/**
 * 配置历史记录接口
 * 配置变更历史的详细记录
 */
export interface ConfigurationHistory {
  /** 历史记录ID */
  id: string
  /** 配置ID */
  configurationId: string
  /** 操作类型 */
  operation: 'create' | 'update' | 'delete' | 'restore'
  /** 变更前状态 */
  before?: ConfigurationItem
  /** 变更后状态 */
  after?: ConfigurationItem
  /** 变更详情 */
  changes: {
    /** 变更字段路径 */
    path: string
    /** 旧值 */
    oldValue: any
    /** 新值 */
    newValue: any
  }[]
  /** 操作时间 */
  timestamp: Date
  /** 操作者 */
  operator: string
  /** 操作原因 */
  reason?: string
}

// ===== 🔗 配置关系和依赖类型 =====

/**
 * 配置关系接口
 * 描述配置项之间的关系
 */
export interface ConfigurationRelationship {
  /** 关系ID */
  id: string
  /** 源配置ID */
  sourceId: string
  /** 目标配置ID */
  targetId: string
  /** 关系类型 */
  type: 'depends_on' | 'extends' | 'overrides' | 'includes' | 'references'
  /** 关系描述 */
  description?: string
  /** 关系权重（用于排序和优先级） */
  weight?: number
  /** 是否为必需关系 */
  required: boolean
  /** 关系元数据 */
  metadata?: Record<string, any>
}

/**
 * 配置依赖图接口
 * 配置依赖关系的图形表示
 */
export interface ConfigurationDependencyGraph {
  /** 节点（配置项） */
  nodes: Map<string, ConfigurationItem>
  /** 边（依赖关系） */
  edges: Map<string, ConfigurationRelationship>
  /** 获取依赖项 */
  getDependencies: (configId: string) => string[]
  /** 获取依赖者 */
  getDependents: (configId: string) => string[]
  /** 检查循环依赖 */
  hasCyclicDependency: () => boolean
}

// ===== 🔒 配置权限和安全类型 =====

/**
 * 配置权限接口
 * 基于角色的配置访问控制
 */
export interface ConfigurationPermission {
  /** 权限ID */
  id: string
  /** 用户或角色ID */
  principal: string
  /** 权限类型 */
  type: 'user' | 'role' | 'group'
  /** 配置资源（ID或模式） */
  resource: string
  /** 操作权限 */
  actions: Array<'create' | 'read' | 'update' | 'delete' | 'execute'>
  /** 权限范围 */
  scope: 'global' | 'type' | 'instance'
  /** 权限条件 */
  conditions?: Record<string, any>
  /** 权限过期时间 */
  expiresAt?: Date
}

// ===== 🎨 配置模板和预设类型 =====

/**
 * 配置模板接口
 * 预定义的配置模板
 */
export interface ConfigurationTemplate {
  /** 模板ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 适用的配置类型 */
  type: ConfigurationType
  /** 模板类别 */
  category: string
  /** 模板标签 */
  tags: string[]
  /** 模板数据 */
  template: Partial<ConfigurationItem>
  /** 可配置参数 */
  parameters: {
    /** 参数名称 */
    name: string
    /** 参数类型 */
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    /** 参数描述 */
    description: string
    /** 默认值 */
    defaultValue?: any
    /** 是否必需 */
    required: boolean
    /** 验证规则 */
    validation?: any
  }[]
  /** 模板版本 */
  version: string
  /** 创建者 */
  author: string
  /** 创建时间 */
  createdAt: Date
}

// ===== 📤 配置导入导出类型 =====

/**
 * 配置导出格式枚举
 * 支持的导出格式
 */
export enum ConfigurationExportFormat {
  /** JSON 格式 */
  JSON = 'json',
  /** YAML 格式 */
  YAML = 'yaml',
  /** XML 格式 */
  XML = 'xml',
  /** 压缩包格式 */
  ZIP = 'zip',
  /** Excel 格式 */
  EXCEL = 'excel'
}

/**
 * 配置导入选项接口
 * 配置导入的选项和策略
 */
export interface ConfigurationImportOptions {
  /** 导入格式 */
  format: ConfigurationExportFormat
  /** 冲突解决策略 */
  conflictResolution: 'overwrite' | 'skip' | 'merge' | 'ask'
  /** 是否验证导入数据 */
  validate: boolean
  /** 是否创建备份 */
  createBackup: boolean
  /** 导入范围 */
  scope?: {
    /** 包含的配置类型 */
    includeTypes?: ConfigurationType[]
    /** 排除的配置类型 */
    excludeTypes?: ConfigurationType[]
    /** 包含的标签 */
    includeTags?: string[]
    /** 排除的标签 */
    excludeTags?: string[]
  }
  /** 映射规则 */
  mapping?: Record<string, string>
  /** 自定义处理器 */
  customProcessor?: (data: any) => any
}

/**
 * 配置导出选项接口
 * 配置导出的选项和格式
 */
export interface ConfigurationExportOptions {
  /** 导出格式 */
  format: ConfigurationExportFormat
  /** 导出范围 */
  scope: ConfigurationQuery
  /** 是否包含元数据 */
  includeMetadata: boolean
  /** 是否包含历史版本 */
  includeHistory: boolean
  /** 是否压缩导出 */
  compress: boolean
  /** 导出文件名 */
  filename?: string
  /** 自定义序列化器 */
  customSerializer?: (data: ConfigurationItem[]) => any
}

// ===== 🔧 系统扩展类型 =====

/**
 * 配置中间件接口
 * 用于扩展配置操作的中间件
 */
export interface ConfigurationMiddleware {
  /** 中间件名称 */
  name: string
  /** 中间件描述 */
  description: string
  /** 优先级（数字越大越早执行） */
  priority?: number
  /** 中间件执行函数 */
  execute: (
    hook: string,
    data: any,
    options: any
  ) => Promise<any>
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 配置插件选项接口
 * 配置系统插件的选项
 */
export interface ConfigurationPluginOptions {
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description: string
  /** 插件配置 */
  config?: Record<string, any>
  /** 插件钩子 */
  hooks?: Record<string, Function>
  /** 插件是否启用 */
  enabled: boolean
}

/**
 * 批量操作接口
 * 用于批量配置操作
 */
export interface ConfigurationBulkOperation {
  /** 操作类型 */
  operation: 'create' | 'update' | 'delete'
  /** 配置ID */
  configurationId: string
  /** 操作数据 */
  data?: any
  /** 操作选项 */
  options?: Record<string, any>
}

// ===== 🎯 配置事件类型 =====

/**
 * 配置事件接口
 * 配置系统的事件定义
 */
export interface ConfigurationEvent {
  /** 事件类型 */
  type: string
  /** 事件数据 */
  data: any
  /** 事件时间戳 */
  timestamp: Date
  /** 事件来源 */
  source: string
  /** 事件目标 */
  target?: string
  /** 事件元数据 */
  metadata?: Record<string, any>
}

// ===== 🔄 兼容性类型别名 =====

/**
 * 配置项类型别名（兼容性）
 * 为了保持向后兼容性而定义的类型别名
 */
export type Configuration = ConfigurationItem
export type ConfigQuery = ConfigurationQuery
export type ConfigOperationResult = ConfigurationOperationResult
export type ConfigTemplate = ConfigurationTemplate
export type ConfigPermission = ConfigurationPermission

// ===== 🎨 工具类型 =====

/**
 * 部分配置项类型
 * 用于更新操作的部分配置项类型
 */
export type PartialConfigurationItem<T = any> = Partial<ConfigurationItem<T>>

/**
 * 配置项键类型
 * 配置项的所有键名联合类型
 */
export type ConfigurationItemKey = keyof ConfigurationItem

/**
 * 配置数据提取类型
 * 提取配置项中的数据类型
 */
export type ExtractConfigurationData<T> = T extends ConfigurationItem<infer U> ? U : never

/**
 * 配置类型映射
 * 配置类型到具体配置数据的映射
 */
export type ConfigurationTypeMap = {
  [ConfigurationType.DEVICE_TEMPLATE]: any // 可以具体定义设备模板数据类型
  [ConfigurationType.DASHBOARD]: any // 可以具体定义仪表板数据类型
  [ConfigurationType.VISUAL_EDITOR]: any // 可以具体定义可视化编辑器数据类型
  [ConfigurationType.COMPONENT]: any // 可以具体定义组件数据类型
  [ConfigurationType.DATA_SOURCE]: any // 可以具体定义数据源数据类型
  // ... 其他配置类型
}

/**
 * 类型化的配置项
 * 根据配置类型提供类型化的配置项
 */
export type TypedConfigurationItem<T extends ConfigurationType> = ConfigurationItem<ConfigurationTypeMap[T]>

