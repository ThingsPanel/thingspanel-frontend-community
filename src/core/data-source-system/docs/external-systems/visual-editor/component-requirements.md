# Visual Editor 组件需求声明机制

## 📋 核心文件分析

**主要文件**: `/src/components/visual-editor/core/component-data-requirements.ts`

## 🎯 核心设计思想

### 1. 组件主动声明数据需求
组件通过标准接口声明自己需要什么数据，而不是被动接收任意数据：

```typescript
interface ComponentDataRequirements {
  componentId: string
  componentName: string  
  dataSources: DataSourceRequirement[]
  maxDataSources?: number // 最大数据源数量
  minDataSources?: number // 最小数据源数量
}

interface DataSourceRequirement {
  id: string
  name: string
  type: DataSourceType // 'static' | 'device' | 'http' | 'websocket' | 'json' | 'array' | 'object'
  required: boolean
  description?: string
  usage?: string
  structureType?: 'object' | 'array'
  fields?: ComponentFieldRequirement[]
}
```

### 2. 字段级别的精确声明
组件可以声明每个字段的详细要求：

```typescript
interface ComponentFieldRequirement {
  name: string
  type: FieldType // 'string' | 'number' | 'boolean' | 'date' | 'any'
  description: string
  required: boolean
  example?: any
}
```

### 3. 预设模板系统
为常见场景提供预设模板：

```typescript
const DATA_SOURCE_TEMPLATES = {
  JSON_OBJECT: {
    id: 'json_object',
    name: 'JSON对象数据源',
    type: 'object',
    description: '静态JSON对象数据，适用于单一记录显示',
    fields: [
      { name: 'id', type: 'string', description: '唯一标识', required: true },
      { name: 'name', type: 'string', description: '显示名称', required: true },
      { name: 'value', type: 'number', description: '数值', required: true }
    ]
  },
  
  TIME_SERIES: {
    id: 'time_series', 
    name: '时间序列数据源',
    type: 'array',
    description: '时间序列数据，适用于趋势图表',
    fields: [
      { name: 'timestamp', type: 'string', description: '时间戳', required: true },
      { name: 'value', type: 'number', description: '数值', required: true }
    ]
  }
}
```

### 4. 构建器模式
提供链式API构建组件需求：

```typescript
const requirements = createComponentDataRequirements('chart-widget', '图表组件')
  .addTemplate('TIME_SERIES', { id: 'main_data', required: true })
  .addDetailedDataSource({
    id: 'config_data',
    name: '配置数据', 
    structureType: 'object',
    fields: [
      { name: 'title', type: 'string', description: '图表标题', required: false },
      { name: 'theme', type: 'string', description: '主题配置', required: false }
    ]
  })
  .setLimits(1, 2)
  .build()
```

### 5. 全局注册表
组件需求在全局注册表中管理：

```typescript
class ComponentDataRequirementsRegistry {
  register(componentId: string, requirements: ComponentDataRequirements): void
  get(componentId: string): ComponentDataRequirements | undefined  
  getAllComponentIds(): string[]
  registerPresets(): void // 批量注册预设
}
```

## 🔑 关键学习点

### 优势
1. **明确的契约** - 组件明确声明数据期望，减少集成错误
2. **灵活的数量控制** - 支持最小/最大数据源数量限制
3. **类型安全** - 字段级别的类型定义
4. **可复用模板** - 常见模式的预设模板
5. **开发友好** - 构建器模式提供优雅的API

### 适用场景
- 组件需要明确的数据结构时
- 需要支持多个数据源的组件
- 需要在设计时验证数据兼容性

### 在新系统中的应用
- 简化字段声明，只保留核心字段类型
- 保留模板机制，但减少预设数量
- 保留注册表模式，但简化管理逻辑
- 重点关注 `structureType` 和 `fields` 声明