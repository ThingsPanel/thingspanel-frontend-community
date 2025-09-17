# Config Engine API 参考文档

## 📖 API 概览

本文档详细介绍了 ThingsPanel Config Engine 的所有 API 接口、类型定义和使用示例。

## 🎯 核心 API

### ConfigEngine (核心配置引擎)

#### 基础配置操作

```typescript
// 创建配置
async createConfiguration<T>(item: ConfigurationItem<T>): Promise<boolean>

// 获取配置
getConfiguration<T>(id: string): ConfigurationItem<T> | null

// 更新配置
async updateConfiguration<T>(id: string, updates: Partial<ConfigurationItem<T>>): Promise<boolean>

// 删除配置
async deleteConfiguration(id: string): Promise<boolean>

// 获取所有配置
getAllConfigurations(): ConfigurationItem[]

// 查询配置
queryConfigurations(query: ConfigurationQuery): ConfigurationItem[]
```

#### 配置索引和查找

```typescript
// 按类型查找
getConfigurationsByType(type: ConfigurationType): ConfigurationItem[]

// 按状态查找
getConfigurationsByStatus(status: ConfigurationStatus): ConfigurationItem[]

// 按优先级查找
getConfigurationsByPriority(priority: ConfigurationPriority): ConfigurationItem[]

// 按标签查找
getConfigurationsByTags(tags: string[]): ConfigurationItem[]

// 按目标环境查找
getConfigurationsByTarget(target: string): ConfigurationItem[]
```

#### 配置依赖管理

```typescript
// 添加依赖关系
addDependency(sourceId: string, targetId: string, type: DependencyType): boolean

// 移除依赖关系
removeDependency(sourceId: string, targetId: string): boolean

// 获取依赖项
getDependencies(configId: string): string[]

// 获取依赖者
getDependents(configId: string): string[]

// 检查循环依赖
hasCyclicDependency(): boolean

// 获取依赖图
getDependencyGraph(): ConfigurationDependencyGraph
```

### ConfigurationAPIManager (API 管理器)

#### CRUD 操作

```typescript
// 创建配置
async createConfiguration<T>(
  item: ConfigurationItem<T>,
  options?: APIOperationOptions
): Promise<ConfigurationOperationResult>

// 查询配置
async queryConfigurations(
  query?: ConfigurationQuery,
  options?: APIOperationOptions
): Promise<EnhancedQueryResult>

// 更新配置
async updateConfiguration<T>(
  id: string,
  updates: Partial<ConfigurationItem<T>>,
  options?: APIOperationOptions
): Promise<ConfigurationOperationResult>

// 删除配置
async deleteConfiguration(
  id: string,
  options?: APIOperationOptions
): Promise<ConfigurationOperationResult>
```

#### 批量操作

```typescript
// 批量操作
async bulkOperations(
  operations: ConfigurationBulkOperation[],
  options?: APIOperationOptions
): Promise<Map<string, ConfigurationOperationResult>>
```

#### 中间件和权限

```typescript
// 注册中间件
registerMiddleware(middleware: ConfigurationMiddleware): void

// 设置权限管理器
setPermissionManager(
  permissionManager: (operation: string, configId: string, userId?: string) => Promise<boolean>
): void

// 获取统计信息
getAPIStatistics(): ConfigurationAPIStatistics

// 清除缓存
clearAPICache(pattern?: string): void
```

### ConfigurationValidator (配置验证器)

#### 验证操作

```typescript
// 单个配置验证
async validateConfiguration(
  item: ConfigurationItem,
  context?: Partial<ValidationContext>
): Promise<ConfigurationValidationResult>

// 批量配置验证
async validateConfigurations(
  items: ConfigurationItem[],
  context?: Partial<ValidationContext>
): Promise<Map<string, ConfigurationValidationResult>>
```

#### 验证规则管理

```typescript
// 注册验证规则
registerValidationRule(rule: ValidationRule): void

// 注册 Schema 验证器
registerSchemaValidator(type: ConfigurationType, validator: JsonSchemaValidator): void

// 清除验证缓存
clearValidationCache(configurationId?: string): void

// 获取验证统计
getValidationStatistics(): ValidationStatistics
```

### ConfigurationVersionManager (版本管理器)

#### 版本操作

```typescript
// 创建版本
async createVersion(
  configItem: ConfigurationItem,
  changelog: string,
  changeType: 'major' | 'minor' | 'patch' | 'hotfix',
  author: string
): Promise<ConfigurationOperationResult<ConfigurationVersion>>

// 获取版本历史
getVersionHistory(
  configId: string,
  options?: {
    limit?: number
    offset?: number
    sortOrder?: 'asc' | 'desc'
    includeChangeTypes?: Array<'major' | 'minor' | 'patch' | 'hotfix'>
    timeRange?: { start: Date; end: Date }
  }
): ConfigurationVersion[]

// 获取指定版本
getVersion(configId: string, version: string): ConfigurationVersion | null
```

#### 版本回滚

```typescript
// 回滚到指定版本
async rollbackToVersion(
  configId: string,
  targetVersion: string,
  options: VersionRollbackOptions
): Promise<ConfigurationOperationResult<ConfigurationItem>>
```

#### 版本比较

```typescript
// 比较版本
compareVersions(
  configId: string,
  sourceVersion: string,
  targetVersion: string
): VersionComparisonResult | null
```

#### 版本标签

```typescript
// 添加版本标签
tagVersion(configId: string, version: string, tag: string): boolean

// 通过标签获取版本
getVersionByTag(configId: string, tag: string): string | null

// 获取版本统计
getVersionStatistics(): VersionStatistics
```

### ConfigurationTemplateManager (模板管理器)

#### 模板操作

```typescript
// 创建模板
async createTemplate(
  template: ConfigurationTemplate
): Promise<ConfigurationOperationResult<ConfigurationTemplate>>

// 从模板创建配置
async createConfigurationFromTemplate(
  templateId: string,
  context: TemplateRenderContext
): Promise<ConfigurationOperationResult<ConfigurationItem>>

// 获取可用模板
getAvailableTemplates(
  type?: ConfigurationType,
  category?: string
): ConfigurationTemplate[]
```

#### 导入导出

```typescript
// 导入配置
async importConfigurations(
  data: string | Buffer | any,
  options: ConfigurationImportOptions
): Promise<ImportResult>

// 导出配置
async exportConfigurations(
  configurations: ConfigurationItem[],
  options: ConfigurationExportOptions
): Promise<ExportResult>
```

#### 格式转换

```typescript
// 注册转换器
registerConverter(converter: ConfigurationConverter): void

// 格式转换
async convertFormat(
  data: any,
  sourceFormat: ConfigurationExportFormat,
  targetFormat: ConfigurationExportFormat,
  options?: any
): Promise<any>

// 获取统计信息
getStatistics(): any
```

### VisualEditorConfigurationIntegration (编辑器集成)

#### 配置操作

```typescript
interface EditorConfigurationActions {
  // 加载配置
  loadConfiguration: (id: string) => Promise<void>

  // 创建配置
  createConfiguration: (type: ConfigurationType, template?: string) => Promise<void>

  // 保存配置
  saveConfiguration: () => Promise<void>

  // 保存为新版本
  saveAsNewVersion: (changelog: string) => Promise<void>

  // 验证配置
  validateConfiguration: () => Promise<void>

  // 重置配置
  resetConfiguration: () => void

  // 应用模板
  applyTemplate: (templateId: string, parameters: Record<string, any>) => Promise<void>

  // 导出配置
  exportConfiguration: () => Promise<void>

  // 导入配置
  importConfiguration: (data: any) => Promise<void>
}
```

#### 面板管理

```typescript
// 显示配置面板
showConfigurationPanel(): void

// 隐藏配置面板
hideConfigurationPanel(): void

// 切换配置面板
toggleConfigurationPanel(): void

// 设置活跃标签
setActiveTab(tab: 'basic' | 'advanced' | 'validation' | 'history' | 'templates'): void
```

#### 历史记录

```typescript
// 撤销操作
undo(): void

// 重做操作
redo(): void
```

## 🏗️ 类型定义

### 核心类型

#### ConfigurationItem

```typescript
interface ConfigurationItem<T = any> {
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
  /** 配置标签 */
  tags: string[]
  /** 目标环境 */
  target: string[]
  /** 配置数据主体 */
  data: T
  /** 配置元数据 */
  metadata: {
    creator: string
    lastModifier?: string
    source: string
    group?: string
    isSystemConfig: boolean
    [key: string]: any
  }
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 过期时间 */
  expiresAt?: Date
}
```

#### ConfigurationQuery

```typescript
interface ConfigurationQuery {
  /** 按ID查询 */
  id?: string
  /** 按ID列表查询 */
  ids?: string[]
  /** 按名称查询 */
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
    start: Date
    end: Date
    field: 'createdAt' | 'updatedAt' | 'expiresAt'
  }
  /** 自定义查询条件 */
  customFilters?: Record<string, any>
  /** 排序条件 */
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }[]
  /** 分页条件 */
  pagination?: {
    page: number
    pageSize: number
  }
}
```

### 枚举类型

#### ConfigurationType

```typescript
enum ConfigurationType {
  DEVICE_TEMPLATE = 'device-template',
  DASHBOARD = 'dashboard',
  VISUAL_EDITOR = 'visual-editor',
  COMPONENT = 'component',
  DATA_SOURCE = 'data-source',
  UI_SETTINGS = 'ui-settings',
  SYSTEM = 'system',
  ALARM_RULE = 'alarm-rule',
  SCENE_LINKAGE = 'scene-linkage',
  PLUGIN = 'plugin',
  THEME = 'theme',
  I18N = 'i18n',
  GENERAL = 'general'
}
```

#### ConfigurationStatus

```typescript
enum ConfigurationStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}
```

#### ConfigurationPriority

```typescript
enum ConfigurationPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  URGENT = 20,
  SYSTEM = 100
}
```

## 🎨 Vue 组合式函数

### useEditorConfigurationIntegration

```typescript
function useEditorConfigurationIntegration() {
  return {
    // 响应式状态
    state: EditorConfigurationState,
    panelState: ConfigurationPanelState,
    history: EditorHistory,
    availableTemplates: Ref<ConfigurationTemplate[]>,

    // 计算属性
    isConfigurationLoaded: ComputedRef<boolean>,
    canSave: ComputedRef<boolean>,
    isValidConfiguration: ComputedRef<boolean>,

    // 操作方法
    actions: EditorConfigurationActions,

    // 面板管理
    showConfigurationPanel: () => void,
    hideConfigurationPanel: () => void,
    toggleConfigurationPanel: () => void,
    setActiveTab: (tab: string) => void,

    // 历史记录
    undo: () => void,
    redo: () => void,

    // 设置
    realtimeValidation: Ref<boolean>,
    autoSave: Ref<boolean>,
    autoSaveInterval: Ref<number>
  }
}
```

## 🔧 配置选项

### APIOperationOptions

```typescript
interface APIOperationOptions {
  /** 是否跳过验证 */
  skipValidation?: boolean
  /** 是否触发事件 */
  triggerEvents?: boolean
  /** 操作来源标识 */
  source?: string
  /** 操作上下文 */
  context?: Record<string, any>
  /** 操作超时时间（毫秒） */
  timeout?: number
  /** 是否使用缓存 */
  useCache?: boolean
}
```

### ValidationContext

```typescript
interface ValidationContext {
  /** 当前用户ID */
  userId?: string
  /** 操作环境 */
  environment: string
  /** 验证级别 */
  level: 'strict' | 'normal' | 'loose'
  /** 额外的上下文数据 */
  data?: Record<string, any>
}
```

### TemplateRenderContext

```typescript
interface TemplateRenderContext {
  /** 模板参数值 */
  parameters: Record<string, any>
  /** 渲染环境 */
  environment: 'development' | 'test' | 'production'
  /** 用户上下文 */
  user?: {
    id: string
    name: string
    roles: string[]
  }
  /** 时间上下文 */
  timestamp: Date
  /** 自定义上下文 */
  custom?: Record<string, any>
}
```

## 🔄 事件系统

### 配置引擎事件

```typescript
// 配置创建事件
configEngine.on('configuration-created', (event: {
  item: ConfigurationItem
  timestamp: Date
}) => void)

// 配置更新事件
configEngine.on('configuration-updated', (event: {
  id: string
  oldConfig: ConfigurationItem
  newConfig: ConfigurationItem
  timestamp: Date
}) => void)

// 配置删除事件
configEngine.on('configuration-deleted', (event: {
  id: string
  deletedConfig: ConfigurationItem
  timestamp: Date
}) => void)
```

### API 管理器事件

```typescript
// 批量操作事件
configurationAPIManager.on('configurations-bulk-operation', (event: {
  operations: ConfigurationBulkOperation[]
  results: Map<string, ConfigurationOperationResult>
  timestamp: Date
}) => void)
```

### 版本管理器事件

```typescript
// 版本创建事件
configurationVersionManager.on('version-created', (event: {
  configurationId: string
  version: ConfigurationVersion
  author: string
  timestamp: Date
}) => void)

// 版本回滚事件
configurationVersionManager.on('version-rollback', (event: {
  configurationId: string
  targetVersion: string
  rolledBackConfig: ConfigurationItem
  operator: string
  reason?: string
  timestamp: Date
}) => void)
```

### 编辑器集成事件

```typescript
// 配置保存事件
visualEditorConfigurationIntegration.on('configuration-saved', (event: {
  config: ConfigurationItem
  timestamp: Date
}) => void)

// 外部配置变更事件
visualEditorConfigurationIntegration.on('external-configuration-change', (event: {
  configId: string
  timestamp: Date
}) => void)

// 撤销/重做事件
visualEditorConfigurationIntegration.on('configuration-undo', (event: {
  config: ConfigurationItem
  timestamp: Date
}) => void)
```

## 🚀 初始化函数

### initializeConfigEngine

```typescript
async function initializeConfigEngine(options: {
  /** 是否启用 Visual Editor 集成 */
  enableVisualEditorIntegration?: boolean
  /** 是否启用实时验证 */
  enableRealtimeValidation?: boolean
  /** 是否启用自动保存 */
  enableAutoSave?: boolean
  /** 默认语言 */
  defaultLanguage?: string
} = {}): Promise<{
  success: boolean
  message: string
  timestamp: Date
}>
```

### getConfigEngineSystemStatus

```typescript
function getConfigEngineSystemStatus(): {
  core: {
    name: string
    status: string
    configCount: number
    lastActivity: Date
  }
  validator: {
    name: string
    status: string
    statistics: ValidationStatistics
  }
  apiManager: {
    name: string
    status: string
    statistics: ConfigurationAPIStatistics
  }
  versionManager: {
    name: string
    status: string
    statistics: VersionStatistics
  }
  templateManager: {
    name: string
    status: string
    statistics: any
  }
  visualEditorIntegration: {
    name: string
    status: string
    currentConfig: string | null
  }
  system: {
    timestamp: Date
    uptime: number
    version: string
  }
}
```

## 📝 使用示例

### 完整的配置管理流程

```typescript
import {
  initializeConfigEngine,
  configurationAPIManager,
  configurationTemplateManager,
  configurationVersionManager,
  useEditorConfigurationIntegration
} from '@/iot-visualization-platform/core/config-engine'

// 1. 初始化系统
await initializeConfigEngine({
  enableVisualEditorIntegration: true,
  enableRealtimeValidation: true,
  enableAutoSave: true
})

// 2. 创建配置模板
const templateResult = await configurationTemplateManager.createTemplate({
  id: 'mqtt-device-template',
  name: 'MQTT设备模板',
  description: '用于MQTT设备的标准配置模板',
  type: ConfigurationType.DEVICE_TEMPLATE,
  category: '设备管理',
  tags: ['mqtt', '设备', '模板'],
  template: {
    name: '{{deviceName}}',
    type: ConfigurationType.DEVICE_TEMPLATE,
    data: {
      protocol: 'mqtt',
      broker: '{{brokerUrl}}',
      port: '{{port | default:1883}}',
      topic: '{{topicPrefix}}/{{deviceId}}'
    }
  },
  parameters: [
    {
      name: 'deviceName',
      type: 'string',
      description: '设备名称',
      required: true
    },
    {
      name: 'brokerUrl',
      type: 'string',
      description: 'MQTT代理地址',
      required: true
    },
    {
      name: 'port',
      type: 'number',
      description: 'MQTT端口',
      defaultValue: 1883,
      required: false
    }
  ],
  version: '1.0.0',
  author: '系统',
  createdAt: new Date()
})

// 3. 使用模板创建配置
const configResult = await configurationTemplateManager.createConfigurationFromTemplate(
  'mqtt-device-template',
  {
    parameters: {
      deviceName: '温度传感器01',
      brokerUrl: 'mqtt.example.com',
      port: 1883,
      topicPrefix: 'sensors',
      deviceId: 'temp_01'
    },
    environment: 'production',
    timestamp: new Date()
  }
)

// 4. 保存配置
if (configResult.success && configResult.data) {
  const saveResult = await configurationAPIManager.createConfiguration(configResult.data)

  if (saveResult.success) {
    // 5. 创建版本
    await configurationVersionManager.createVersion(
      configResult.data,
      '初始版本创建',
      'major',
      '开发者'
    )

    console.log('配置创建成功:', configResult.data.id)
  }
}

// 6. 在 Vue 组件中使用
const {
  state,
  actions,
  canSave,
  isValidConfiguration
} = useEditorConfigurationIntegration()

// 加载配置到编辑器
await actions.loadConfiguration(configResult.data.id)

// 监听配置变更
watch(() => state.currentConfig, (newConfig) => {
  if (newConfig && !isValidConfiguration.value) {
    console.warn('当前配置验证失败')
  }
})
```

## 🔍 故障排查

### 常见错误代码

- `CONFIG_NOT_FOUND` - 配置不存在
- `VALIDATION_FAILED` - 配置验证失败
- `VERSION_NOT_FOUND` - 版本不存在
- `TEMPLATE_NOT_FOUND` - 模板不存在
- `PERMISSION_DENIED` - 权限不足
- `CIRCULAR_DEPENDENCY` - 循环依赖
- `IMPORT_FORMAT_ERROR` - 导入格式错误

### 调试技巧

```typescript
// 查看系统状态
const status = getConfigEngineSystemStatus()
console.log('系统状态:', status)

// 查看验证统计
const validationStats = configurationValidator.getValidationStatistics()
console.log('验证统计:', validationStats)

// 查看 API 统计
const apiStats = configurationAPIManager.getAPIStatistics()
console.log('API统计:', apiStats)

// 清除缓存进行故障排查
configurationAPIManager.clearAPICache()
configurationValidator.clearValidationCache()
```

---

更多详细信息请参考源代码中的详细注释和类型定义。