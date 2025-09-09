# 组件架构详解 - Card 2.1 系统架构深入理解

本章深入介绍Card 2.1组件系统的整体架构设计、核心模块和工作原理。

## 🏗️ 系统架构概览

### 整体架构图
```
┌─────────────────────────────────────────────────────────┐
│                    Visual Editor                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Canvas    │  │  GridStack  │  │  Renderer   │     │
│  │  Renderer   │  │   Renderer  │  │   System    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                   Card 2.1 System                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Component  │  │    Data     │  │ Interaction │     │
│  │  Registry   │  │   Binding   │  │   System    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Property    │  │ Auto        │  │ Category    │     │
│  │ Exposure    │  │ Registry    │  │ Management  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Component Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │    Vue      │  │  Setting    │  │ Definition  │     │
│  │ Components  │  │  Config     │  │   Files     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 🧩 核心模块详解

### 1. 组件注册系统 (Component Registry)

**职责**：管理所有Card 2.1组件的注册、发现和元数据维护。

```typescript
/**
 * 组件注册器核心类
 */
export class ComponentRegistry {
  private static instance: ComponentRegistry
  private components: Map<string, ComponentDefinition> = new Map()
  
  /**
   * 注册单个组件
   */
  register(definition: ComponentDefinition): void {
    // 验证组件定义
    this.validateDefinition(definition)
    
    // 注册组件
    this.components.set(definition.type, definition)
    
    // 触发注册事件
    this.emitRegistryEvent('component:registered', definition)
  }
  
  /**
   * 批量自动注册组件
   */
  async autoRegister(): Promise<void> {
    const componentFiles = import.meta.glob(
      '/src/card2.1/components/*/*/definition.ts'
    )
    
    for (const [path, moduleLoader] of Object.entries(componentFiles)) {
      try {
        const module = await moduleLoader()
        const definition = (module as any).default
        
        if (this.isValidDefinition(definition)) {
          this.register(definition)
        }
      } catch (error) {
        console.error(`Failed to load component from ${path}:`, error)
      }
    }
  }
}
```

### 2. 数据绑定系统 (Data Binding System)

**职责**：处理组件数据需求、数据源配置和响应式数据更新。

```typescript
/**
 * 数据绑定管理器
 */
export class DataBindingManager {
  private componentDataSources: Map<string, DataSourceBinding[]> = new Map()
  private dataTransformPipeline: DataTransformPipeline
  
  /**
   * 绑定组件数据源
   */
  bindDataSource(
    componentId: string,
    dataSourceKey: string,
    config: DataSourceConfig
  ): void {
    const binding: DataSourceBinding = {
      componentId,
      dataSourceKey,
      config,
      transform: this.createTransformFunction(config),
      reactive: this.createReactiveData(config)
    }
    
    const bindings = this.componentDataSources.get(componentId) || []
    bindings.push(binding)
    this.componentDataSources.set(componentId, bindings)
    
    // 启动数据获取
    this.startDataFetching(binding)
  }
  
  /**
   * 创建数据转换函数
   */
  private createTransformFunction(config: DataSourceConfig): TransformFunction {
    return (rawData: any) => {
      const transformed = {}
      
      for (const [sourceField, mapping] of Object.entries(config.fieldMappings)) {
        const value = this.extractFieldValue(rawData, sourceField)
        const transformedValue = this.applyTransform(value, mapping)
        transformed[mapping.targetField] = transformedValue
      }
      
      return transformed
    }
  }
}
```

### 3. 交互系统 (Interaction System)

**职责**：管理组件间的事件通信、交互配置和响应动作执行。

```typescript
/**
 * 交互管理器
 */
export class InteractionManager {
  private eventBus: EventBus = new EventBus()
  private interactionConfigs: Map<string, InteractionConfig[]> = new Map()
  
  /**
   * 注册组件交互能力
   */
  registerInteractionCapability(
    componentId: string,
    capability: InteractionCapability
  ): void {
    // 注册可监听属性
    this.registerListenableProperties(componentId, capability.listenableProperties)
    
    // 注册支持的事件类型
    this.registerSupportedEvents(componentId, capability.supportedEvents)
    
    // 注册支持的动作类型
    this.registerSupportedActions(componentId, capability.supportedActions)
  }
  
  /**
   * 配置组件交互规则
   */
  configureInteraction(
    sourceComponentId: string,
    targetComponentId: string,
    config: InteractionConfig
  ): void {
    const configs = this.interactionConfigs.get(sourceComponentId) || []
    configs.push({
      ...config,
      sourceComponentId,
      targetComponentId
    })
    
    this.interactionConfigs.set(sourceComponentId, configs)
    this.setupEventListeners(config)
  }
}
```

### 4. 属性暴露系统 (Property Exposure System)

**职责**：管理组件属性的对外暴露，支持交互配置和监听。

```typescript
/**
 * 属性暴露管理器
 */
export class PropertyExposureManager {
  private exposedProperties: Map<string, ExposedPropertySet> = new Map()
  private propertyWatchers: Map<string, WatcherSet> = new Map()
  
  /**
   * 暴露组件属性
   */
  exposeProperties(
    componentId: string,
    componentType: string,
    properties: Record<string, any>
  ): void {
    const exposedSet: ExposedPropertySet = {
      componentId,
      componentType,
      properties: new Map(),
      metadata: this.getPropertyMetadata(componentType)
    }
    
    // 处理响应式属性
    for (const [name, value] of Object.entries(properties)) {
      if (this.isReactiveProperty(value)) {
        exposedSet.properties.set(name, value)
        this.setupPropertyWatcher(componentId, name, value)
      } else {
        exposedSet.properties.set(name, ref(value))
      }
    }
    
    this.exposedProperties.set(componentId, exposedSet)
  }
  
  /**
   * 监听属性变化
   */
  watchProperty(
    componentId: string,
    propertyName: string,
    handler: (newValue: any, oldValue?: any) => void
  ): () => void {
    const watchers = this.propertyWatchers.get(componentId) || new Map()
    const watcherList = watchers.get(propertyName) || []
    
    watcherList.push(handler)
    watchers.set(propertyName, watcherList)
    this.propertyWatchers.set(componentId, watchers)
    
    // 返回取消监听函数
    return () => {
      const index = watcherList.indexOf(handler)
      if (index > -1) {
        watcherList.splice(index, 1)
      }
    }
  }
}
```

## 🔄 组件生命周期

### 1. 组件注册阶段
```
组件定义文件加载 → 验证定义格式 → 注册到Registry → 分类管理器处理 → 可用于Visual Editor
```

### 2. 组件实例化阶段
```
用户拖拽组件 → 创建组件实例 → 应用默认配置 → 绑定数据源 → 暴露属性 → 激活交互
```

### 3. 组件运行阶段
```
接收Props → 响应数据变化 → 处理用户交互 → 触发事件 → 更新暴露属性 → 通知其他组件
```

### 4. 组件销毁阶段
```
取消数据绑定 → 清理事件监听 → 移除暴露属性 → 释放交互配置 → 销毁Vue实例
```

## 🎯 核心设计原则

### 1. 单一职责原则
每个核心模块只负责特定的功能域：
- **Registry** - 组件注册和管理
- **DataBinding** - 数据处理和绑定
- **Interaction** - 组件间交互
- **PropertyExposure** - 属性暴露和监听

### 2. 开放封闭原则
系统对扩展开放，对修改封闭：
- 支持自定义数据源类型
- 支持自定义交互动作
- 支持自定义配置控件
- 支持自定义渲染器

### 3. 依赖注入原则
模块间通过接口交互，降低耦合：
```typescript
// 组件不直接依赖具体实现
interface DataSourceProvider {
  getData(config: DataSourceConfig): Promise<any>
}

// 通过依赖注入使用
class ComponentInstance {
  constructor(
    private dataProvider: DataSourceProvider,
    private interactionManager: InteractionManager
  ) {}
}
```

### 4. 响应式设计
基于Vue 3响应式系统构建：
```typescript
// 响应式数据流
const componentData = reactive({
  props: {},
  state: {},
  computed: {}
})

// 自动响应变化
watch(() => componentData.props, (newProps) => {
  // 自动更新组件
  updateComponent(newProps)
}, { deep: true })
```

## 📊 数据流架构

### 1. 组件数据流
```
Data Source → Transform Pipeline → Component Props → Vue Component → Exposed Properties
```

### 2. 交互数据流
```
User Interaction → Event Emission → Interaction Manager → Action Execution → Target Component Update
```

### 3. 配置数据流
```
Setting Config → Auto Form Generator → User Configuration → Component Props → Re-render
```

## 🔧 扩展机制

### 1. 自定义数据源类型
```typescript
// 注册新的数据源类型
DataSourceTypeRegistry.register('mqtt', {
  name: 'MQTT消息队列',
  configSchema: MQTTConfigSchema,
  provider: MQTTDataProvider,
  supportedFeatures: ['realtime', 'subscribe']
})
```

### 2. 自定义交互动作
```typescript
// 注册新的交互动作
InteractionActionRegistry.register('export', {
  name: '导出数据',
  configSchema: ExportActionSchema,
  executor: ExportActionExecutor,
  permissions: ['DATA_EXPORT']
})
```

### 3. 自定义配置控件
```typescript
// 注册新的配置控件
SettingControlRegistry.register('file-upload', {
  name: '文件上传',
  component: FileUploadControl,
  validator: FileUploadValidator,
  defaultValue: null
})
```

## 🚀 性能优化架构

### 1. 组件懒加载
```typescript
// 动态导入组件
const componentModules = import.meta.glob(
  '/src/card2.1/components/*/*/index.vue',
  { eager: false }
)

// 按需加载
const loadComponent = async (componentType: string) => {
  const modulePath = getComponentPath(componentType)
  const module = await componentModules[modulePath]()
  return module.default
}
```

### 2. 数据缓存机制
```typescript
// 数据源结果缓存
class DataSourceCache {
  private cache: Map<string, CacheEntry> = new Map()
  
  get(key: string, ttl: number = 300000): any {
    const entry = this.cache.get(key)
    if (entry && Date.now() - entry.timestamp < ttl) {
      return entry.data
    }
    return null
  }
}
```

### 3. 虚拟化渲染
```typescript
// 大量组件时使用虚拟滚动
const VirtualComponentList = defineComponent({
  setup(props) {
    const { list, containerRef, wrapperRef } = useVirtualList(
      props.components,
      { itemHeight: 200, overscan: 5 }
    )
    
    return { list, containerRef, wrapperRef }
  }
})
```

## 🔒 安全性架构

### 1. 权限控制
```typescript
// 组件访问权限检查
const hasComponentPermission = (
  user: User,
  component: ComponentDefinition
): boolean => {
  return PermissionChecker.check(
    user.permissions,
    component.permission
  )
}
```

### 2. 脚本安全
```typescript
// 安全的脚本执行环境
const SafeScriptExecutor = {
  execute(script: string, context: any): any {
    // 创建受限执行环境
    const sandbox = vm.createContext({
      ...context,
      // 禁用危险函数
      eval: undefined,
      Function: undefined,
      process: undefined
    })
    
    return vm.runInContext(script, sandbox, {
      timeout: 5000  // 5秒超时
    })
  }
}
```

## ✅ 架构优势

### 1. 可维护性
- **模块化设计** - 清晰的职责分离
- **标准化接口** - 统一的组件协议
- **完善文档** - 详细的架构文档

### 2. 可扩展性
- **插件化架构** - 支持功能扩展
- **开放接口** - 支持自定义实现
- **版本兼容** - 向前兼容保证

### 3. 可测试性
- **单元测试** - 每个模块可独立测试
- **集成测试** - 模块间交互测试
- **端到端测试** - 完整用户流程测试

## 🔗 相关文档

- [开发环境](./02-development-environment.md) - 环境配置
- [组件定义](./04-component-definition.md) - 组件定义详解
- [数据源系统](./06-data-sources.md) - 数据绑定架构
- [交互系统](./08-interaction-system.md) - 交互架构设计

---

**深入理解架构是高质量开发的基础！** 🏗️