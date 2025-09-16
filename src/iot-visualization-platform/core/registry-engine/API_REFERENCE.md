# Registry Engine API 参考手册

这是Registry Engine的完整API参考文档，包含所有类、接口、方法和类型定义。

## 📚 目录

- [核心类](#核心类)
- [适配器系统](#适配器系统)
- [组件管理](#组件管理)
- [类型定义](#类型定义)
- [事件系统](#事件系统)
- [工具函数](#工具函数)

## 🏗️ 核心类

### RegistryEngine

统一注册引擎的核心类，提供完整的注册管理功能。

#### 构造函数

```typescript
constructor()
```

创建一个新的Registry Engine实例。

#### 主要方法

##### register<T>(item: RegistryItem<T>): Promise<boolean>

注册一个项目到引擎。

**参数:**
- `item: RegistryItem<T>` - 要注册的项目

**返回值:**
- `Promise<boolean>` - 注册是否成功

**示例:**
```typescript
const item = {
  metadata: {
    id: 'my-component',
    name: '我的组件',
    type: RegistryItemType.CARD21_COMPONENT,
    version: '1.0.0'
  },
  content: { /* 组件内容 */ }
}

const success = await registryEngine.register(item)
```

##### unregister(id: string): Promise<boolean>

从引擎中注销一个项目。

**参数:**
- `id: string` - 项目ID

**返回值:**
- `Promise<boolean>` - 注销是否成功

##### get<T>(id: string): RegistryItem<T> | undefined

根据ID获取注册项。

**参数:**
- `id: string` - 项目ID

**返回值:**
- `RegistryItem<T> | undefined` - 注册项或undefined

##### has(id: string): boolean

检查项目是否已注册。

**参数:**
- `id: string` - 项目ID

**返回值:**
- `boolean` - 是否存在

##### query(query?: RegistryQuery): RegistryItem[]

根据条件查询注册项。

**参数:**
- `query?: RegistryQuery` - 查询条件

**返回值:**
- `RegistryItem[]` - 匹配的注册项数组

**示例:**
```typescript
// 基础查询
const components = registryEngine.query({
  type: RegistryItemType.CARD21_COMPONENT,
  enabled: true
})

// 复杂查询
const filtered = registryEngine.query({
  type: [RegistryItemType.CARD21_COMPONENT, RegistryItemType.VISUAL_EDITOR_COMPONENT],
  category: 'weather',
  tags: ['sensor'],
  filter: (item) => item.content.dataSources?.length > 0
})
```

##### registerBatch<T>(items: RegistryItem<T>[]): Promise<number>

批量注册多个项目。

**参数:**
- `items: RegistryItem<T>[]` - 要注册的项目数组

**返回值:**
- `Promise<number>` - 成功注册的数量

##### getByType<T>(type: RegistryItemType): RegistryItem<T>[]

根据类型获取所有注册项。

**参数:**
- `type: RegistryItemType` - 项目类型

**返回值:**
- `RegistryItem<T>[]` - 该类型的所有项目

##### getByCategory(category: string): RegistryItem[]

根据分类获取注册项。

**参数:**
- `category: string` - 分类名称

**返回值:**
- `RegistryItem[]` - 该分类的所有项目

##### getByTag(tag: string): RegistryItem[]

根据标签获取注册项。

**参数:**
- `tag: string` - 标签名称

**返回值:**
- `RegistryItem[]` - 包含该标签的所有项目

##### getDependencies(id: string, recursive?: boolean): string[]

获取项目的依赖项。

**参数:**
- `id: string` - 项目ID
- `recursive?: boolean` - 是否递归获取，默认false

**返回值:**
- `string[]` - 依赖项ID数组

##### getDependents(id: string, recursive?: boolean): string[]

获取依赖于指定项目的项目。

**参数:**
- `id: string` - 项目ID
- `recursive?: boolean` - 是否递归获取，默认false

**返回值:**
- `string[]` - 依赖者ID数组

##### getStats(): RegistryStats

获取注册表统计信息。

**返回值:**
- `RegistryStats` - 统计信息对象

##### clear(): Promise<void>

清空所有注册项。

##### revalidateAll(): Promise<string[]>

重新验证所有注册项。

**返回值:**
- `Promise<string[]>` - 验证失败的项目ID数组

#### 事件

Registry Engine继承自EventEmitter，支持以下事件：

- `register` - 项目注册时触发
- `unregister` - 项目注销时触发
- `change` - 任何变更时触发
- `error` - 发生错误时触发
- `batch-register-complete` - 批量注册完成时触发
- `validation-failed` - 验证失败时触发
- `clear` - 清空时触发

## 🔧 适配器系统

### BaseRegistryAdapter

所有适配器的基类。

#### 抽象属性

```typescript
abstract readonly name: string        // 适配器名称
abstract readonly version: string     // 适配器版本
abstract readonly supportedTypes: RegistryItemType[]  // 支持的类型
```

#### 主要方法

##### integrate(): Promise<boolean>

集成适配器到Registry Engine。

##### disconnect(): Promise<void>

断开适配器连接。

##### isAvailable(): boolean

检查适配器是否可用。

### 具体适配器

#### Card21RegistryAdapter

Card2.1系统适配器。

**支持类型:** `RegistryItemType.CARD21_COMPONENT`

#### LegacyCardRegistryAdapter

传统Card系统适配器。

**支持类型:** `RegistryItemType.LEGACY_CARD_COMPONENT`

#### VisualEditorRegistryAdapter

可视化编辑器适配器。

**支持类型:** `RegistryItemType.VISUAL_EDITOR_COMPONENT`

#### RendererRegistryAdapter

渲染器系统适配器。

**支持类型:** `RegistryItemType.RENDERER`

### AdapterManager

适配器管理器，统一管理所有适配器。

#### 主要方法

##### integrateAll(): Promise<void>

集成所有已注册的适配器。

##### getIntegrationStatus(): AdapterIntegrationStatus

获取适配器集成状态。

##### registerAdapter(adapter: BaseRegistryAdapter): void

注册一个新的适配器。

## 🎯 组件管理

### ComponentRegistryManager

专门的组件注册管理器。

#### 静态方法

##### registerComponent(definition, options?): Promise<boolean>

注册组件到Registry Engine。

**参数:**
- `definition: ComponentDefinition | IComponentDefinition | any` - 组件定义
- `options?: ComponentRegistrationOptions` - 注册选项

**返回值:**
- `Promise<boolean>` - 注册是否成功

##### registerComponents(definitions, options?): Promise<BatchRegistrationResult>

批量注册组件。

**参数:**
- `definitions: Array<ComponentDefinition | IComponentDefinition | any>` - 组件定义数组
- `options?: ComponentRegistrationOptions` - 注册选项

**返回值:**
- `Promise<BatchRegistrationResult>` - 批量注册结果

##### queryComponents(query?): UnifiedComponentDefinition[]

查询组件。

**参数:**
- `query?: ComponentQuery` - 查询条件

**返回值:**
- `UnifiedComponentDefinition[]` - 匹配的组件数组

##### getComponentById(id): UnifiedComponentDefinition | undefined

根据ID获取组件。

**参数:**
- `id: string` - 组件ID

**返回值:**
- `UnifiedComponentDefinition | undefined` - 组件定义或undefined

##### getComponentStats(): ComponentStats

获取组件统计信息。

**返回值:**
- `ComponentStats` - 组件统计信息

##### validateDependencies(): DependencyValidationResult

验证所有组件的依赖关系。

**返回值:**
- `DependencyValidationResult` - 依赖验证结果

## 📋 类型定义

### RegistryItemType

注册项类型枚举。

```typescript
enum RegistryItemType {
  CARD21_COMPONENT = 'card21-component',
  LEGACY_CARD_COMPONENT = 'legacy-card-component',
  VISUAL_EDITOR_COMPONENT = 'visual-editor-component',
  RENDERER = 'renderer',
  DATA_SOURCE = 'data-source',
  TEMPLATE = 'template',
  PLUGIN = 'plugin',
  THEME = 'theme',
  LAYOUT = 'layout',
  INTERACTION_CONFIG = 'interaction-config'
}
```

### RegistryItemMetadata

注册项元数据接口。

```typescript
interface RegistryItemMetadata {
  id: string                    // 唯一标识符
  name: string                  // 显示名称
  type: RegistryItemType        // 项目类型
  version: string               // 版本号
  description?: string          // 描述
  category?: string             // 分类
  tags?: string[]               // 标签
  dependencies?: string[]       // 依赖项
  createdAt?: number           // 创建时间
  updatedAt?: number           // 更新时间
  enabled?: boolean            // 是否启用
  priority?: number            // 优先级
}
```

### RegistryItem<T>

注册项接口。

```typescript
interface RegistryItem<T = any> {
  metadata: RegistryItemMetadata     // 元数据
  content: T                         // 实际内容
  validate?: () => boolean | Promise<boolean>    // 验证函数
  initialize?: () => void | Promise<void>        // 初始化函数
  cleanup?: () => void | Promise<void>           // 清理函数
}
```

### RegistryQuery

查询条件接口。

```typescript
interface RegistryQuery {
  type?: RegistryItemType | RegistryItemType[]   // 按类型过滤
  name?: string | RegExp                         // 按名称过滤
  category?: string                              // 按分类过滤
  tags?: string[]                               // 按标签过滤
  enabled?: boolean                             // 按启用状态过滤
  hasDependency?: string                        // 按依赖关系过滤
  filter?: (item: RegistryItem) => boolean      // 自定义过滤函数
}
```

### RegistryStats

统计信息接口。

```typescript
interface RegistryStats {
  total: number                              // 总注册项数量
  byType: Record<string, number>             // 按类型分组的数量
  byCategory: Record<string, number>         // 按分类分组的数量
  enabled: number                            // 启用的项目数量
  disabled: number                           // 禁用的项目数量
  withDependencies: number                   // 有依赖的项目数量
  lastUpdated: number                        // 最近更新时间
}
```

### UnifiedComponentDefinition

统一组件定义接口。

```typescript
interface UnifiedComponentDefinition {
  id: string                           // 组件唯一标识
  type: string                         // 组件类型
  name: string                         // 组件名称
  description?: string                 // 组件描述
  version: string                      // 组件版本
  category?: string                    // 组件分类
  tags?: string[]                      // 组件标签
  icon?: string                        // 组件图标
  dataSources?: any                    // 数据源配置
  staticParams?: any                   // 静态参数
  interactionCapabilities?: any        // 交互能力
  dependencies?: string[]              // 依赖项
  originalDefinition: ComponentDefinition | IComponentDefinition | any  // 原始定义
}
```

### ComponentRegistrationOptions

组件注册选项。

```typescript
interface ComponentRegistrationOptions {
  overwrite?: boolean                  // 是否覆盖已存在的组件
  validate?: boolean                   // 是否验证组件定义
  resolveDependencies?: boolean        // 是否自动解析依赖
  customMetadata?: Partial<RegistryItemMetadata>  // 自定义元数据
}
```

### ComponentQuery

组件查询条件。

```typescript
interface ComponentQuery {
  sourceSystem?: 'card21' | 'legacy' | 'visual-editor'  // 来源系统
  hasDataSources?: boolean                               // 是否有数据源
  hasStaticParams?: boolean                             // 是否有静态参数
  hasInteractionCapabilities?: boolean                  // 是否有交互能力
  filter?: (component: UnifiedComponentDefinition) => boolean  // 自定义过滤
}
```

### BatchRegistrationResult

批量注册结果。

```typescript
interface BatchRegistrationResult {
  total: number           // 总数量
  successCount: number    // 成功数量
  failedCount: number     // 失败数量
  details: Array<{        // 详细结果
    id: string
    success: boolean
    error?: string
  }>
}
```

### ComponentStats

组件统计信息。

```typescript
interface ComponentStats {
  total: number                                    // 总组件数
  bySourceSystem: Record<string, number>           // 按来源系统分组
  byType: Record<string, number>                   // 按类型分组
  withDataSources: number                          // 有数据源的组件数
  withInteractionCapabilities: number              // 有交互能力的组件数
  withDependencies: number                         // 有依赖的组件数
}
```

### DependencyValidationResult

依赖验证结果。

```typescript
interface DependencyValidationResult {
  valid: boolean                                   // 是否全部有效
  missingDependencies: Array<{                     // 缺失的依赖
    componentId: string
    missingDeps: string[]
  }>
  circularDependencies?: Array<{                   // 循环依赖
    cycle: string[]
  }>
}
```

## 🎧 事件系统

Registry Engine使用事件驱动架构，支持以下事件：

### 事件类型

```typescript
// 注册事件
registryEngine.on('register', (metadata: RegistryItemMetadata) => {
  console.log('项目已注册:', metadata.name)
})

// 注销事件
registryEngine.on('unregister', (id: string) => {
  console.log('项目已注销:', id)
})

// 变更事件
registryEngine.on('change', (changeInfo: { action: string, metadata: RegistryItemMetadata }) => {
  console.log('注册表发生变更:', changeInfo.action)
})

// 错误事件
registryEngine.on('error', (errorInfo: { action: string, error: Error, metadata?: RegistryItemMetadata }) => {
  console.error('注册表错误:', errorInfo.error.message)
})

// 批量操作完成事件
registryEngine.on('batch-register-complete', (result: { total: number, success: number, failed: number }) => {
  console.log('批量注册完成:', result)
})

// 验证失败事件
registryEngine.on('validation-failed', (failedItems: string[]) => {
  console.warn('验证失败的项目:', failedItems)
})

// 清空事件
registryEngine.on('clear', () => {
  console.log('注册表已清空')
})
```

## 🛠️ 工具函数

### 全局实例

```typescript
// 获取全局Registry Engine实例
import { registryEngine } from '@/iot-visualization-platform/core/registry-engine'

// 获取全局适配器管理器实例
import { adapterManager } from '@/iot-visualization-platform/core/registry-engine/adapters'
```

### 类型检查工具

```typescript
// 检查是否为有效的组件定义
function isValidComponentDefinition(obj: any): boolean {
  return obj && typeof obj === 'object' && typeof obj.type === 'string'
}

// 检查是否为Card2.1组件
function isCard21Component(item: RegistryItem): boolean {
  return item.metadata.type === RegistryItemType.CARD21_COMPONENT
}
```

### 查询辅助函数

```typescript
// 查询所有启用的组件
function getEnabledComponents(): RegistryItem[] {
  return registryEngine.query({ enabled: true })
}

// 按分类查询组件
function getComponentsByCategory(category: string): RegistryItem[] {
  return registryEngine.getByCategory(category)
}

// 查询有数据源的组件
function getDataSourceComponents(): RegistryItem[] {
  return registryEngine.query({
    filter: (item) => {
      const content = item.content as any
      return content.dataSources && Array.isArray(content.dataSources) && content.dataSources.length > 0
    }
  })
}
```

## 🚨 错误处理

### 常见错误类型

```typescript
// 重复注册错误
class DuplicateRegistrationError extends Error {
  constructor(id: string) {
    super(`注册项 ${id} 已存在`)
    this.name = 'DuplicateRegistrationError'
  }
}

// 依赖缺失错误
class MissingDependencyError extends Error {
  constructor(id: string, dependencies: string[]) {
    super(`注册项 ${id} 的依赖项缺失: ${dependencies.join(', ')}`)
    this.name = 'MissingDependencyError'
  }
}

// 循环依赖错误
class CircularDependencyError extends Error {
  constructor(cycle: string[]) {
    super(`检测到循环依赖: ${cycle.join(' -> ')}`)
    this.name = 'CircularDependencyError'
  }
}

// 验证失败错误
class ValidationError extends Error {
  constructor(id: string, reason: string) {
    super(`注册项 ${id} 验证失败: ${reason}`)
    this.name = 'ValidationError'
  }
}
```

### 错误处理最佳实践

```typescript
try {
  await registryEngine.register(item)
} catch (error) {
  if (error instanceof DuplicateRegistrationError) {
    console.warn('组件已存在，考虑使用overwrite选项')
  } else if (error instanceof MissingDependencyError) {
    console.error('依赖项缺失，请先注册依赖项')
  } else {
    console.error('注册失败:', error.message)
  }
}
```

## 📈 性能优化建议

### 查询优化

```typescript
// ✅ 优化：使用类型索引
const components = registryEngine.getByType(RegistryItemType.CARD21_COMPONENT)

// ❌ 低效：使用filter查询
const components = registryEngine.query({
  filter: (item) => item.metadata.type === RegistryItemType.CARD21_COMPONENT
})
```

### 批量操作

```typescript
// ✅ 优化：使用批量注册
await registryEngine.registerBatch(items)

// ❌ 低效：逐个注册
for (const item of items) {
  await registryEngine.register(item)
}
```

### 缓存利用

```typescript
// ✅ 优化：缓存查询结果
let cachedComponents: RegistryItem[] | null = null

function getCachedComponents(): RegistryItem[] {
  if (!cachedComponents) {
    cachedComponents = registryEngine.query({ enabled: true })
  }
  return cachedComponents
}

// 监听变更，清除缓存
registryEngine.on('change', () => {
  cachedComponents = null
})
```

这就是Registry Engine的完整API参考文档。每个API都经过精心设计，提供了强大而灵活的注册管理能力。