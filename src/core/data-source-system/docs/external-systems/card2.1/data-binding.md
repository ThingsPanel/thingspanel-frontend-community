# Card2.1 数据绑定机制

## 📋 核心文件分析

**主要文件**: 
- `/src/card2.1/core/data-binding/component-requirement-manager.ts`
- `/src/card2.1/core/data-binding/reactive-binding.ts`
- `/src/card2.1/core/data-binding/data-transform-pipeline.ts`

## 🎯 核心设计思想

### 1. 组件数据需求注册系统
组件通过管理器注册自己的数据需求：

```typescript
interface ComponentDataRequirement {
  fields: Record<string, DataFieldRequirement>
  relationships?: Record<string, DataRelationship>
}

interface DataFieldRequirement {
  type: 'value' | 'object' | 'array'
  valueType?: 'number' | 'string' | 'boolean' | 'any'
  required: boolean
  description: string
  example?: any
  defaultValue?: any
  structure?: ComponentDataRequirement // 嵌套结构支持
}
```

### 2. 响应式数据绑定
完整的响应式数据绑定生命周期：

```typescript
interface ReactiveDataBinding {
  id: string
  componentId: string
  pipeline: DataTransformPipeline
  triggers: UpdateTrigger[]
  
  start(): void
  stop(): void
  refresh(): Promise<void>
  getCurrentData(): any
  isActive(): boolean
}
```

### 3. 多种触发器支持
支持多种数据更新触发机制：

```typescript
// 定时器触发器
class TimerTrigger implements UpdateTrigger {
  constructor(interval: number, immediate = false)
  start(callback: () => void): void
  stop(): void
}

// WebSocket触发器
class WebSocketTrigger implements UpdateTrigger {
  constructor(url: string, protocols?: string[])
  // 支持自动重连
}

// 事件触发器
class EventTrigger implements UpdateTrigger {
  constructor(eventName: string, target: EventTarget = window)
}

// 手动触发器
class ManualTrigger implements UpdateTrigger {
  trigger(): void // 手动触发更新
}
```

### 4. 数据关系处理
支持字段间的关系和计算：

```typescript
interface DataRelationship {
  type: 'independent' | 'calculated' | 'derived'
  inputs: string[] // 依赖的输入字段
  calculator?: (inputs: Record<string, any>) => any // 计算函数
}

// 示例：温度转换
const temperatureRelationship: DataRelationship = {
  type: 'calculated',
  inputs: ['celsius'],
  calculator: (inputs) => inputs.celsius * 9/5 + 32
}
```

## 🔧 组件需求管理器

### 1. 需求注册和查询
```typescript
class ComponentRequirementManager {
  /** 注册组件的数据需求 */
  registerRequirement(componentId: string, requirement: ComponentDataRequirement): void
  
  /** 获取组件的数据需求 */
  getRequirement(componentId: string): ComponentDataRequirement | null
  
  /** 获取组件的字段需求 */
  getFieldRequirement(componentId: string, fieldName: string): DataFieldRequirement | null
  
  /** 获取必填字段列表 */
  getRequiredFields(componentId: string): string[]
  
  /** 计算字段关系值 */
  calculateRelationshipValue(componentId: string, relationshipName: string, inputData: Record<string, any>): any
}
```

### 2. 自动验证和示例生成
```typescript
// 验证数据需求定义的合法性
validateRequirement(requirement: ComponentDataRequirement): { valid: boolean; errors: string[] }

// 自动生成示例数据
generateSampleData(componentId: string): Record<string, any>
```

## 🔄 响应式绑定实现

### 1. 数据变化检测
```typescript
class ReactiveDataBindingImpl {
  private async updateData(triggerType: string): Promise<void> {
    const oldData = this.currentData
    const newData = await this.pipeline.execute()
    
    // JSON字符串比较检测变化
    const dataChanged = JSON.stringify(oldData) !== JSON.stringify(newData)
    
    if (dataChanged) {
      this.currentData = newData
      this.onDataChange(newData, oldData)
    }
  }
}
```

### 2. 绑定管理器
```typescript
class DataBindingManagerImpl {
  /** 注册数据绑定 */
  registerBinding(binding: ReactiveDataBinding): void
  
  /** 获取组件的所有绑定 */
  getComponentBindings(componentId: string): ReactiveDataBinding[]
  
  /** 获取活跃的绑定 */
  getActiveBindings(): ReactiveDataBinding[]
  
  /** 清理所有绑定 */
  cleanup(): void
}
```

## 🔍 数据验证器

### 1. 字段级验证
```typescript
class ComponentDataValidator {
  validate(data: any, requirement: ComponentDataRequirement): DataValidationResult
  
  validateField(value: any, fieldRequirement: DataFieldRequirement): DataValidationResult
}

interface DataValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  details: Record<string, any>
}
```

### 2. 验证策略
- **必填字段检查** - 确保必需数据存在
- **类型验证** - 验证值类型、对象结构、数组元素
- **嵌套结构验证** - 递归验证复杂数据结构
- **数据关系验证** - 检查关系字段的输入完整性

## 🔑 关键学习点

### 设计优势
1. **类型安全的数据契约** - 组件明确声明数据结构需求
2. **完整的生命周期管理** - 启动、停止、清理机制完善
3. **多样化触发机制** - 支持定时、事件、手动等多种触发方式
4. **自动数据验证** - 运行时验证数据是否符合需求
5. **嵌套结构支持** - 支持复杂的对象和数组嵌套
6. **计算关系处理** - 支持字段间的计算和派生关系

### 核心模式
1. **注册式需求声明** - 组件主动注册数据需求
2. **管道式数据处理** - 数据源 → 处理器 → 验证器 → 组件
3. **响应式更新机制** - 数据变化自动触发组件更新
4. **分层验证策略** - 字段级、结构级、关系级验证

## 🚀 在新系统中的应用

### 保留的核心机制
1. **触发器系统** - 保留所有触发器类型，这部分设计很好
2. **生命周期管理** - 保留启动、停止、清理机制
3. **数据变化检测** - 保留JSON比较的变化检测策略
4. **字段类型系统** - 简化但保留value/object/array分类

### 简化的设计
```typescript
// 简化的组件需求
interface SimpleComponentRequirement {
  componentId: string
  dataSources: {
    id: string
    structureType: 'object' | 'array'  
    fields: { name: string, type: string, required: boolean }[]
  }[]
}

// 简化的响应式绑定
interface SimpleReactiveBinding {
  id: string
  componentId: string
  triggers: UpdateTrigger[] // 复用现有触发器
  onDataChange: (newData: any) => void
}
```

Card2.1的数据绑定系统提供了完整的响应式数据处理能力，是整个架构的核心价值所在。