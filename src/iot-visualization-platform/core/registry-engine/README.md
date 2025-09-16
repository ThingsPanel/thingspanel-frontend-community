# Registry Engine 注册引擎

## 概述

Registry Engine 是 ThingsPanel 物联网可视化平台的统一注册管理系统，提供了一个强大、灵活、类型安全的注册机制，用于管理组件、渲染器、数据源、模板等各种资源。

## 核心特性

- **🔄 100% 向后兼容** - 完全兼容现有的所有注册系统
- **🎯 统一的注册接口** - 为所有类型的资源提供统一的注册管理
- **🚀 自动发现和批量注册** - 支持自动组件发现和高效的批量操作
- **📊 完整的依赖关系管理** - 智能的依赖解析和循环依赖检测
- **🔍 强大的查询和过滤能力** - 多维度索引和复杂条件查询
- **🛡️ 类型安全和运行时验证** - 完整的TypeScript支持和运行时验证
- **⚡ 高性能的索引和缓存机制** - 优化的数据结构和查询性能
- **🎭 适配器系统** - 无缝集成现有的注册系统

## 快速开始

### 基础使用

```typescript
import { registryEngine, RegistryItemType } from '@/iot-visualization-platform/core/registry-engine'

// 1. 注册一个组件
const componentItem = {
  metadata: {
    id: 'my-weather-widget',
    name: '天气组件',
    type: RegistryItemType.CARD21_COMPONENT,
    version: '1.0.0',
    description: '显示天气信息的组件',
    category: 'weather',
    tags: ['weather', 'sensor'],
    enabled: true,
    priority: 10
  },
  content: {
    type: 'weather-widget',
    dataSources: [{ key: 'weather', type: 'api' }]
  },
  validate: () => true,
  initialize: async () => console.log('组件初始化'),
  cleanup: async () => console.log('组件清理')
}

await registryEngine.register(componentItem)

// 2. 查询组件
const component = registryEngine.get('my-weather-widget')
console.log('查询到的组件:', component?.metadata.name)

// 3. 复杂查询
const results = registryEngine.query({
  type: RegistryItemType.CARD21_COMPONENT,
  enabled: true,
  tags: ['weather']
})
console.log(`找到 ${results.length} 个天气组件`)
```

### 组件统一管理

```typescript
import { ComponentRegistryManager } from '@/iot-visualization-platform/core/registry-engine/component-registry'

// 1. 注册Card2.1组件
const card21Component = {
  type: 'temperature-sensor',
  dataSources: [
    {
      key: 'temperature',
      type: 'device',
      deviceId: '{{deviceId}}',
      metric: 'temperature'
    }
  ],
  staticParams: {
    unit: 'celsius',
    precision: 1
  }
}

await ComponentRegistryManager.registerComponent(card21Component)

// 2. 批量注册
const components = [
  { type: 'humidity-sensor', dataSources: [{ key: 'humidity', type: 'device' }] },
  { type: 'pressure-sensor', dataSources: [{ key: 'pressure', type: 'device' }] }
]

const batchResult = await ComponentRegistryManager.registerComponents(components)
console.log(`批量注册: 成功 ${batchResult.successCount}, 失败 ${batchResult.failedCount}`)

// 3. 智能查询
const multiDataSourceComponents = ComponentRegistryManager.queryComponents({
  hasDataSources: true,
  sourceSystem: 'card21',
  filter: (comp) => Array.isArray(comp.dataSources) && comp.dataSources.length > 1
})
```

### 适配器系统

```typescript
import { adapterManager } from '@/iot-visualization-platform/core/registry-engine/adapters'

// 1. 集成所有现有系统
const integrationResults = await adapterManager.integrateAll()
console.log('集成结果:', integrationResults)

// 2. 检查集成状态
const stats = adapterManager.getIntegrationStats()
console.log('适配器状态:', {
  总数: stats.total,
  可用: stats.available,
  已集成: stats.integrated
})

// 3. 获取特定适配器
const card21Adapter = adapterManager.getAdapter('Card21RegistryAdapter')
console.log('Card2.1适配器状态:', card21Adapter?.isAvailable())
```

## 架构设计

### 核心组件

```
Registry Engine
├── 核心引擎 (RegistryEngine)
│   ├── 主存储 (Map<string, RegistryItem>)
│   ├── 类型索引 (Map<RegistryItemType, Set<string>>)
│   ├── 分类索引 (Map<string, Set<string>>)
│   ├── 标签索引 (Map<string, Set<string>>)
│   ├── 依赖关系图 (Map<string, Set<string>>)
│   └── 反向依赖图 (Map<string, Set<string>>)
├── 组件管理器 (ComponentRegistryManager)
│   ├── 统一组件接口 (UnifiedComponentDefinition)
│   ├── 组件查询 (ComponentQuery)
│   ├── 组件统计 (ComponentStats)
│   └── 组件验证和转换
├── 适配器系统 (AdapterManager)
│   ├── Card2.1适配器 (Card21RegistryAdapter)
│   ├── 传统Card适配器 (LegacyCardRegistryAdapter)
│   ├── 渲染器适配器 (RendererRegistryAdapter)
│   └── 可视化编辑器适配器 (VisualEditorRegistryAdapter)
└── 工具和示例
    ├── 使用示例 (examples.ts)
    └── 文档和指南
```

### 数据流

```
现有系统 → 适配器 → Registry Engine → 统一接口 → 应用层
    ↓           ↓           ↓            ↓         ↓
Card2.1    Adapter    注册/查询     组件管理    业务逻辑
Legacy     适配器      索引/缓存     统计分析    用户界面
Renderer   转换器      依赖管理      验证校验    API接口
VE Config  集成器      事件通知      生命周期    ...
```

## 注册项类型

### 支持的注册项类型

```typescript
enum RegistryItemType {
  CARD21_COMPONENT = 'card21-component',           // Card2.1组件
  LEGACY_CARD_COMPONENT = 'legacy-card-component', // 传统卡片组件
  VISUAL_EDITOR_COMPONENT = 'visual-editor-component', // 可视化编辑器组件
  RENDERER = 'renderer',                           // 渲染器
  DATA_SOURCE = 'data-source',                     // 数据源
  TEMPLATE = 'template',                           // 模板
  PLUGIN = 'plugin',                              // 插件
  THEME = 'theme',                                // 主题
  LAYOUT = 'layout',                              // 布局
  INTERACTION_CONFIG = 'interaction-config'        // 交互配置
}
```

### 注册项元数据

```typescript
interface RegistryItemMetadata {
  id: string                    // 唯一标识符
  name: string                  // 显示名称
  type: RegistryItemType        // 项目类型
  version: string               // 版本号
  description?: string          // 描述信息
  tags?: string[]               // 标签
  category?: string             // 分类
  icon?: string                 // 图标
  author?: string               // 作者信息
  createdAt: number             // 创建时间
  updatedAt: number             // 更新时间
  enabled: boolean              // 是否启用
  priority: number              // 优先级
  dependencies?: string[]       // 依赖项
  compatibility?: {             // 兼容性信息
    minVersion?: string
    maxVersion?: string
    environment?: string[]
  }
}
```

## 查询和过滤

### 基础查询

```typescript
// 按类型查询
const card21Components = registryEngine.getByType(RegistryItemType.CARD21_COMPONENT)

// 按分类查询
const weatherComponents = registryEngine.getByCategory('weather')

// 按标签查询
const sensorComponents = registryEngine.getByTag('sensor')

// 检查存在性
const exists = registryEngine.has('component-id')
```

### 复杂查询

```typescript
// 多条件查询
const results = registryEngine.query({
  type: [RegistryItemType.CARD21_COMPONENT, RegistryItemType.LEGACY_CARD_COMPONENT],
  enabled: true,
  tags: ['sensor', 'data'],
  category: 'monitoring',
  filter: (item) => item.metadata.priority > 50
})

// 组件特定查询
const components = ComponentRegistryManager.queryComponents({
  sourceSystem: ['card21', 'legacy-card'],
  hasDataSources: true,
  hasInteractionCapabilities: true,
  name: /temperature|humidity/i,
  filter: (comp) => comp.dataSources.length > 1
})
```

### 依赖关系查询

```typescript
// 获取依赖链
const dependencies = registryEngine.getDependencies('component-id', true) // 递归
const dependents = registryEngine.getDependents('component-id', false)   // 直接

// 验证依赖完整性
const validation = ComponentRegistryManager.validateDependencies()
if (!validation.valid) {
  console.log('缺失依赖:', validation.missingDependencies)
}
```

## 批量操作

### 批量注册

```typescript
// 批量注册组件
const components = [
  { type: 'sensor-1', dataSources: [...] },
  { type: 'sensor-2', dataSources: [...] },
  { type: 'sensor-3', dataSources: [...] }
]

const results = await ComponentRegistryManager.registerComponents(components, {
  validate: true,
  overwrite: false
})

console.log(`成功: ${results.successCount}, 失败: ${results.failedCount}`)
```

### 批量查询和操作

```typescript
// 批量查询
const allSensors = ComponentRegistryManager.queryComponents({
  tags: ['sensor'],
  enabled: true
})

// 批量更新（通过重新注册）
for (const sensor of allSensors) {
  sensor.staticParams.version = '2.0.0'
  await ComponentRegistryManager.registerComponent(sensor.originalDefinition, {
    overwrite: true
  })
}
```

## 事件系统

### 监听注册表事件

```typescript
// 监听注册事件
registryEngine.on('register', (metadata) => {
  console.log(`组件已注册: ${metadata.name}`)
})

// 监听注销事件
registryEngine.on('unregister', (id) => {
  console.log(`组件已注销: ${id}`)
})

// 监听变更事件
registryEngine.on('change', ({ action, metadata }) => {
  console.log(`注册表变更: ${action}`, metadata)
})

// 监听错误事件
registryEngine.on('error', ({ action, error, metadata }) => {
  console.error(`操作失败: ${action}`, error)
})

// 监听验证失败事件
registryEngine.on('validation-failed', (failedItems) => {
  console.warn('验证失败的项目:', failedItems)
})
```

## 性能优化

### 查询优化

```typescript
// ✅ 优化的查询 - 使用索引字段
const optimizedQuery = registryEngine.query({
  type: RegistryItemType.CARD21_COMPONENT,  // 使用类型索引
  category: 'sensors',                      // 使用分类索引
  tags: ['temperature']                     // 使用标签索引
})

// ❌ 低效的查询 - 只使用filter函数
const inefficientQuery = registryEngine.query({
  filter: (item) =>
    item.metadata.type === RegistryItemType.CARD21_COMPONENT &&
    item.metadata.category === 'sensors' &&
    item.metadata.tags?.includes('temperature')
})
```

### 批量操作优化

```typescript
// ✅ 使用批量注册
const batchResult = await ComponentRegistryManager.registerComponents(components)

// ❌ 逐个注册
for (const component of components) {
  await ComponentRegistryManager.registerComponent(component)
}
```

### 缓存和索引

```typescript
// 注册表自动维护多级索引
// - 主索引: Map<id, RegistryItem>
// - 类型索引: Map<type, Set<id>>
// - 分类索引: Map<category, Set<id>>
// - 标签索引: Map<tag, Set<id>>
// - 依赖索引: Map<id, Set<dependencies>>

// 查询时自动使用最优索引
const results = registryEngine.getByType(RegistryItemType.CARD21_COMPONENT) // O(1)
const tagged = registryEngine.getByTag('sensor')                           // O(1)
```

## 适配器开发

### 创建自定义适配器

```typescript
class CustomSystemAdapter extends BaseRegistryAdapter {
  readonly name = 'CustomSystemAdapter'
  readonly version = '1.0.0'
  readonly supportedTypes = [RegistryItemType.CUSTOM_TYPE]

  isAvailable(): boolean {
    // 检查自定义系统是否可用
    return typeof window !== 'undefined' && window.customSystem
  }

  protected async performIntegration(): Promise<void> {
    // 获取现有组件
    const existingComponents = window.customSystem.getComponents()

    // 转换并注册到Registry Engine
    for (const component of existingComponents) {
      const registryItem = this.convertToRegistryItem(component)
      await getRegistryEngine().register(registryItem)
    }
  }

  protected async performDisconnection(): Promise<void> {
    // 清理注册的组件
    const items = getRegistryEngine().getByType(RegistryItemType.CUSTOM_TYPE)
    for (const item of items) {
      await getRegistryEngine().unregister(item.metadata.id)
    }
  }

  private convertToRegistryItem(component: any): RegistryItem {
    // 转换逻辑
    return {
      metadata: {
        id: component.id,
        name: component.name,
        type: RegistryItemType.CUSTOM_TYPE,
        // ...
      },
      content: component
    }
  }
}

// 注册适配器
adapterManager.registerAdapter(new CustomSystemAdapter())
```

## 统计和监控

### 获取统计信息

```typescript
// Registry Engine统计
const engineStats = registryEngine.getStats()
console.log('引擎统计:', {
  总注册项: engineStats.total,
  启用项目: engineStats.enabled,
  按类型分布: engineStats.byType,
  按分类分布: engineStats.byCategory
})

// 组件管理器统计
const componentStats = ComponentRegistryManager.getComponentStats()
console.log('组件统计:', {
  总组件数: componentStats.total,
  按来源系统: componentStats.bySourceSystem,
  有数据源: componentStats.withDataSources,
  有交互能力: componentStats.withInteractionCapabilities
})

// 适配器状态
const adapterStats = adapterManager.getIntegrationStats()
console.log('适配器状态:', {
  总适配器: adapterStats.total,
  可用适配器: adapterStats.available,
  已集成: adapterStats.integrated
})
```

### 性能监控

```typescript
// 操作性能监控
const startTime = performance.now()

const results = ComponentRegistryManager.queryComponents({
  hasDataSources: true,
  sourceSystem: 'card21'
})

const duration = performance.now() - startTime
console.log(`查询耗时: ${duration.toFixed(2)}ms, 结果数: ${results.length}`)

// 内存使用监控
const memoryUsage = {
  registryItems: registryEngine.getAll().length,
  typeIndexSize: Object.keys(registryEngine.getStats().byType).length,
  categoryIndexSize: Object.keys(registryEngine.getStats().byCategory).length
}
console.log('内存使用:', memoryUsage)
```

## 最佳实践

### 1. 组件命名规范

```typescript
// ✅ 好的命名
const componentId = 'temperature-sensor-v2'
const componentName = '温度传感器 V2'
const componentType = 'temperature-sensor'

// ❌ 避免的命名
const componentId = 'comp123'
const componentName = 'Temp'
const componentType = 'TempSensor'
```

### 2. 元数据最佳实践

```typescript
// ✅ 完整的元数据
const metadata = {
  id: 'weather-station-dashboard',
  name: '气象站仪表板',
  type: RegistryItemType.CARD21_COMPONENT,
  version: '1.2.0',
  description: '显示综合气象数据的仪表板组件，包含温度、湿度、气压等指标',
  category: 'weather',
  tags: ['weather', 'dashboard', 'multi-sensor', 'real-time'],
  author: 'ThingsPanel Team',
  dependencies: ['weather-api-client', 'chart-renderer'],
  compatibility: {
    minVersion: '2.1.0',
    environment: ['browser', 'mobile']
  }
}
```

### 3. 依赖管理

```typescript
// ✅ 明确的依赖声明
const componentWithDeps = {
  type: 'advanced-chart',
  dependencies: ['chart-engine', 'data-processor', 'theme-manager'],
  // ...
}

// 在注册前验证依赖
const validation = ComponentRegistryManager.validateDependencies()
if (!validation.valid) {
  console.warn('存在缺失依赖，请先注册依赖组件')
}
```

### 4. 错误处理

```typescript
// ✅ 完善的错误处理
try {
  const result = await ComponentRegistryManager.registerComponent(component, {
    validate: true,
    overwrite: false
  })

  if (!result) {
    console.warn('组件注册失败，可能已存在或验证失败')
  }
} catch (error) {
  console.error('组件注册异常:', error.message)
  // 记录错误日志
  // 通知用户
}
```

### 5. 生命周期管理

```typescript
// ✅ 完整的生命周期实现
const componentItem = {
  metadata: { /* ... */ },
  content: { /* ... */ },

  validate: async () => {
    // 验证组件配置
    // 检查依赖可用性
    // 验证数据源连接
    return true
  },

  initialize: async () => {
    // 初始化数据连接
    // 设置事件监听器
    // 启动定时任务
  },

  cleanup: async () => {
    // 清理定时器
    // 移除事件监听器
    // 关闭数据连接
  }
}
```

## 故障排除

### 常见问题

**Q: 组件注册失败？**
A: 检查组件ID是否唯一，元数据是否完整，依赖项是否存在。

**Q: 查询性能慢？**
A: 优先使用索引字段（type, category, tags），避免复杂的filter函数。

**Q: 适配器集成失败？**
A: 检查目标系统是否可用，模块是否正确导入。

**Q: 内存使用过高？**
A: 定期清理不需要的注册项，避免创建过多索引。

### 调试技巧

```typescript
// 启用调试日志
if (process.env.NODE_ENV === 'development') {
  registryEngine.on('register', console.log)
  registryEngine.on('unregister', console.log)
  registryEngine.on('error', console.error)
}

// 检查注册表状态
console.log('注册表状态:', registryEngine.getStats())
console.log('所有注册项:', registryEngine.getAll().map(item => ({
  id: item.metadata.id,
  type: item.metadata.type,
  enabled: item.metadata.enabled
})))

// 验证依赖完整性
const validation = ComponentRegistryManager.validateDependencies()
if (!validation.valid) {
  console.log('依赖问题:', validation.missingDependencies)
}
```

## API 参考

详细的API文档请参考TypeScript类型定义和源代码注释。

### 主要类和接口

- `RegistryEngine` - 核心注册引擎
- `ComponentRegistryManager` - 组件统一管理器
- `AdapterManager` - 适配器管理器
- `RegistryItem<T>` - 注册项接口
- `RegistryItemMetadata` - 元数据接口
- `UnifiedComponentDefinition` - 统一组件定义
- `ComponentQuery` - 组件查询条件

## 示例和测试

完整的使用示例请参考：
- `examples.ts` - 详细的使用示例
- `test-demo.html` - 交互式测试页面

运行示例：
```typescript
import { runAllRegistryExamples } from './examples'
await runAllRegistryExamples()
```

## 贡献指南

在修改Registry Engine时，请确保：
1. 保持向后兼容性
2. 添加详细的中文注释
3. 更新相关测试
4. 更新文档

## 许可证

遵循项目主许可证。