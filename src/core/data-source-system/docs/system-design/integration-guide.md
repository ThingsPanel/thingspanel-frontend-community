# 系统集成指南

## 🎯 集成目标

将简化的数据源系统与现有的 visual-editor 和 card2.1 系统进行无缝集成，确保向后兼容和平滑迁移。

## 🔧 集成策略

### 1. 适配器模式
使用适配器模式连接新旧系统，避免破坏性变更：

```typescript
// 新系统的标准输出
interface StandardComponentData {
  [dataSourceId: string]: {
    type: string
    data: any
  }
}

// Visual Editor适配器
class VisualEditorAdapter {
  adaptToVisualEditor(data: StandardComponentData): VisualEditorProps {
    return {
      widgetConfiguration: {
        dataSource: {
          config: {
            dataSourceBindings: this.convertToBindings(data)
          }
        }
      }
    }
  }

  private convertToBindings(data: StandardComponentData) {
    const bindings: any = {}
    Object.entries(data).forEach(([id, sourceData]) => {
      bindings[id] = {
        rawData: JSON.stringify(sourceData.data)
      }
    })
    return bindings
  }
}

// Card2.1适配器
class Card21Adapter {
  adaptToCard21(data: StandardComponentData): Card21Props {
    return {
      rawDataSources: {
        dataSourceBindings: this.convertToBindings(data)
      }
    }
  }
}
```

### 2. 渐进式迁移
支持新旧系统共存，允许逐步迁移：

```typescript
class ComponentDataProvider {
  // 优先使用新系统，回退到旧系统
  async getComponentData(componentId: string): Promise<any> {
    // 1. 尝试使用新数据源系统
    const newSystemConfig = await this.loadNewSystemConfig(componentId)
    if (newSystemConfig) {
      const executor = new SimpleDataExecutor()
      const data = await executor.execute(newSystemConfig)
      return this.adaptToComponentFormat(componentId, data)
    }

    // 2. 回退到现有系统
    const oldSystemData = await this.loadOldSystemData(componentId)
    return oldSystemData
  }

  private adaptToComponentFormat(componentId: string, data: StandardComponentData) {
    const componentType = this.getComponentType(componentId)
    
    switch (componentType) {
      case 'visual-editor':
        return new VisualEditorAdapter().adaptToVisualEditor(data)
      case 'card2.1':
        return new Card21Adapter().adaptToCard21(data)
      default:
        return data // 标准格式
    }
  }
}
```

## 📊 组件数据格式兼容

### 1. Visual Editor 格式
```typescript
// 现有格式 (保持兼容)
interface VisualEditorProps {
  widgetConfiguration?: {
    dataSource: {
      config: {
        dataSourceBindings: {
          [dataSourceId: string]: {
            rawData: string  // JSON字符串
          }
        }
      }
    }
  }
}

// 新系统适配
const adaptToVisualEditor = (data: StandardComponentData): VisualEditorProps => {
  const bindings: any = {}
  Object.entries(data).forEach(([id, sourceData]) => {
    bindings[id] = {
      rawData: JSON.stringify(sourceData.data),
      type: sourceData.type,
      updatedAt: new Date().toISOString()
    }
  })

  return {
    widgetConfiguration: {
      dataSource: {
        config: {
          dataSourceBindings: bindings
        }
      }
    }
  }
}
```

### 2. Card2.1 格式
```typescript
// 现有格式 (保持兼容)
interface Card21Props {
  rawDataSources?: {
    dataSourceBindings: {
      [dataSourceId: string]: {
        rawData: string
      }
    }
  }
}

// 新系统适配
const adaptToCard21 = (data: StandardComponentData): Card21Props => {
  const bindings: any = {}
  Object.entries(data).forEach(([id, sourceData]) => {
    bindings[id] = {
      rawData: JSON.stringify(sourceData.data),
      metadata: {
        type: sourceData.type,
        lastUpdated: Date.now()
      }
    }
  })

  return {
    rawDataSources: {
      dataSourceBindings: bindings
    }
  }
}
```

### 3. 标准格式 (新组件)
```typescript
// 新组件使用的标准格式
interface StandardComponentProps {
  dataSourceConfig?: {
    [dataSourceId: string]: {
      type: 'static' | 'api' | 'websocket' | 'script'
      data: any
      lastUpdated?: number
      metadata?: any
    }
  }
}

// 新组件使用方式
const MyNewComponent = (props: StandardComponentProps) => {
  const primaryData = props.dataSourceConfig?.primary?.data
  const secondaryData = props.dataSourceConfig?.secondary?.data
  
  return (
    <div>
      <div>主要数据: {JSON.stringify(primaryData)}</div>
      <div>次要数据: {JSON.stringify(secondaryData)}</div>
    </div>
  )
}
```

## 🔄 数据流集成

### 1. 配置阶段集成
```typescript
class IntegratedConfigurationManager {
  async configureComponent(componentId: string, requirement: ComponentDataRequirement) {
    // 1. 检查组件类型
    const componentType = await this.detectComponentType(componentId)
    
    // 2. 生成适合的配置
    const generator = new SimpleConfigGenerator()
    const config = await generator.generateConfig(requirement, userInputs)
    
    // 3. 保存到合适的存储位置
    switch (componentType) {
      case 'visual-editor':
        await this.saveToVisualEditorStorage(componentId, config)
        break
      case 'card2.1':
        await this.saveToCard21Storage(componentId, config)
        break
      default:
        await this.saveToStandardStorage(componentId, config)
    }
  }
}
```

### 2. 运行时集成
```typescript
class IntegratedRuntimeManager {
  async startComponentDataBinding(componentId: string) {
    const config = await this.loadComponentConfig(componentId)
    const executor = new SimpleDataExecutor()
    
    // 启动数据绑定
    const bindingId = executor.startPolling(config, (data) => {
      // 根据组件类型适配数据格式
      const adaptedData = this.adaptDataForComponent(componentId, data)
      
      // 通知组件更新
      this.notifyComponentUpdate(componentId, adaptedData)
    })
    
    // 记录绑定ID便于清理
    this.trackBinding(componentId, bindingId)
  }

  private adaptDataForComponent(componentId: string, data: StandardComponentData) {
    const componentType = this.getComponentType(componentId)
    
    switch (componentType) {
      case 'visual-editor':
        return new VisualEditorAdapter().adaptToVisualEditor(data)
      case 'card2.1':
        return new Card21Adapter().adaptToCard21(data)
      default:
        return data
    }
  }
}
```

## 🔍 现有组件检测机制

### 1. 组件类型检测
```typescript
class ComponentTypeDetector {
  detectComponentType(componentId: string): ComponentType {
    // 1. 检查组件注册信息
    if (this.visualEditorRegistry.has(componentId)) {
      return 'visual-editor'
    }
    
    if (this.card21Registry.has(componentId)) {
      return 'card2.1'
    }
    
    // 2. 检查组件文件路径
    const componentPath = this.getComponentPath(componentId)
    if (componentPath.includes('/visual-editor/')) {
      return 'visual-editor'
    }
    
    if (componentPath.includes('/card2.1/')) {
      return 'card2.1'
    }
    
    // 3. 默认为标准类型
    return 'standard'
  }

  // 检查组件是否支持新的数据格式
  supportsStandardFormat(componentId: string): boolean {
    const component = this.getComponentDefinition(componentId)
    return component?.metadata?.supportsStandardDataFormat === true
  }
}
```

### 2. 配置迁移工具
```typescript
class ConfigurationMigrator {
  // 从Visual Editor配置迁移到新系统
  migrateFromVisualEditor(componentId: string): SimpleDataSourceConfig {
    const oldConfig = this.loadVisualEditorConfig(componentId)
    
    return {
      id: `migrated_${componentId}`,
      componentId,
      dataSources: this.convertVisualEditorDataSources(oldConfig),
      triggers: this.convertVisualEditorTriggers(oldConfig),
      enabled: true
    }
  }

  // 从Card2.1配置迁移到新系统
  migrateFromCard21(componentId: string): SimpleDataSourceConfig {
    const oldBindings = this.loadCard21Bindings(componentId)
    
    return {
      id: `migrated_${componentId}`,
      componentId,
      dataSources: this.convertCard21DataSources(oldBindings),
      triggers: this.convertCard21Triggers(oldBindings),
      enabled: true
    }
  }
}
```

## 🛠️ 集成测试策略

### 1. 兼容性测试
```typescript
// 测试现有组件是否能正常工作
describe('Integration Compatibility Tests', () => {
  test('Visual Editor components work with new data system', async () => {
    const componentId = 'test-visual-editor-component'
    const requirement = createTestRequirement()
    
    // 使用新系统生成数据
    const config = await generator.generateConfig(requirement, testInputs)
    const data = await executor.execute(config)
    
    // 适配到Visual Editor格式
    const adaptedData = new VisualEditorAdapter().adaptToVisualEditor(data)
    
    // 验证组件能正常接收数据
    expect(adaptedData.widgetConfiguration.dataSource.config.dataSourceBindings).toBeDefined()
  })

  test('Card2.1 components work with new data system', async () => {
    // 类似的测试...
  })
})
```

### 2. 迁移测试
```typescript
describe('Migration Tests', () => {
  test('Visual Editor config migration', () => {
    const oldConfig = loadTestVisualEditorConfig()
    const newConfig = migrator.migrateFromVisualEditor('test-component')
    
    // 验证迁移后的配置能产生相同的数据
    const oldData = executeOldConfig(oldConfig)
    const newData = executor.execute(newConfig)
    
    expect(newData).toEqual(oldData)
  })
})
```

## 📚 使用示例

### 1. 创建新组件
```typescript
// 使用新系统创建组件
const MyComponent = (props: StandardComponentProps) => {
  const chartData = props.dataSourceConfig?.chartData?.data || []
  const configData = props.dataSourceConfig?.config?.data || {}
  
  return (
    <div>
      <Chart data={chartData} config={configData} />
    </div>
  )
}

// 注册组件数据需求
registerComponentDataRequirement('my-component', {
  componentId: 'my-component',
  componentName: '我的组件',
  dataSources: [
    {
      id: 'chartData',
      name: '图表数据',
      structureType: 'array',
      fields: [
        { name: 'x', type: 'string', required: true, description: 'X轴数据' },
        { name: 'y', type: 'number', required: true, description: 'Y轴数据' }
      ],
      required: true
    }
  ]
})
```

### 2. 迁移现有组件
```typescript
// 现有Card2.1组件保持不变
const ExistingCard21Component = (props: Card21Props) => {
  const objectData = computed(() => {
    const binding = props.rawDataSources?.dataSourceBindings?.objectData
    if (!binding?.rawData) return null
    try {
      return JSON.parse(binding.rawData)
    } catch {
      return null
    }
  })
  
  // 组件逻辑保持不变...
}

// 新系统会自动适配数据格式
```

## 🚀 部署策略

### 1. 分阶段部署
```
Phase 1: 新系统并行部署
- 新旧系统共存
- 新组件使用新系统
- 现有组件保持不变

Phase 2: 逐步迁移
- 选择性迁移高价值组件
- 提供迁移工具和指南
- 保持向后兼容

Phase 3: 完全迁移
- 所有组件使用新系统
- 移除旧系统代码
- 优化性能和体验
```

### 2. 回滚策略
```typescript
class RollbackManager {
  // 支持回滚到旧系统
  rollbackToOldSystem(componentId: string) {
    // 1. 停止新系统的数据绑定
    this.stopNewSystemBinding(componentId)
    
    // 2. 恢复旧系统配置
    this.restoreOldSystemConfig(componentId)
    
    // 3. 重新启动旧系统
    this.startOldSystemBinding(componentId)
  }
}
```

通过这个集成指南，我们可以确保新系统与现有系统的平滑集成，既保持了向后兼容，又为未来的发展奠定了基础。