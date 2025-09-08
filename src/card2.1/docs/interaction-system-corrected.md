# Card 2.1 交互系统（修正版）

## 系统概述

Card 2.1 交互系统是一个基于事件驱动的组件交互框架，支持组件间的动态交互和响应式属性绑定。系统采用单例模式的 `InteractionManager` 作为核心，管理所有组件的交互配置和状态。

## 核心架构

### 交互管理器 (InteractionManager)

交互系统的核心是 `InteractionManager` 单例，提供以下核心功能：

```typescript
import { interactionManager } from '@/card2.1/core/interaction-manager'

// 注册组件交互配置
interactionManager.registerComponent(componentId, configs)

// 触发交互事件
interactionManager.triggerEvent(componentId, 'click', data)

// 获取组件状态
const state = interactionManager.getComponentState(componentId)

// 属性绑定解析
const value = interactionManager.resolvePropertyBinding('comp-123.customize.title')
```

### 核心类型定义

```typescript
// 交互事件类型
export type InteractionEventType =
  | 'click'      // 点击事件
  | 'hover'      // 悬停事件
  | 'dataChange' // 数据变化事件（属性改变时）

// 交互动作类型
export type InteractionActionType =
  | 'jump'   // URL跳转（包含外部URL和内部菜单）
  | 'modify' // 修改目标组件属性
```

## 交互配置系统

### 基础交互配置

```typescript
export interface InteractionConfig {
  event: InteractionEventType                // 触发事件
  responses: InteractionResponse[]           // 响应动作列表
  enabled?: boolean                         // 是否启用
  priority?: number                         // 优先级
  name?: string                            // 配置名称
  
  // dataChange事件专用配置
  watchedProperty?: string                  // 被监听的属性名
  condition?: DataChangeCondition          // 条件配置
}
```

### 交互响应配置

```typescript
export interface InteractionResponse {
  action: InteractionActionType
  
  // 动作特定配置
  jumpConfig?: JumpConfig       // jump动作配置
  modifyConfig?: ModifyConfig   // modify动作配置
  
  // 通用属性
  delay?: number               // 延迟时间（毫秒）
}
```

## 具体动作类型

### 1. Jump 动作（URL跳转）

支持外部URL跳转和内部菜单跳转：

```typescript
// 外部URL跳转配置
const jumpConfig: JumpConfig = {
  jumpType: 'external',
  url: 'https://example.com',
  target: '_blank',
  windowFeatures: 'width=800,height=600'
}

// 内部菜单跳转配置
const jumpConfig: JumpConfig = {
  jumpType: 'internal',
  internalPath: '/dashboard/panel',
  target: '_self'
}

// 完整交互配置示例
const interactionConfig: InteractionConfig = {
  event: 'click',
  responses: [{
    action: 'jump',
    jumpConfig: jumpConfig
  }]
}
```

### 2. Modify 动作（组件属性修改）

支持跨组件的属性修改：

```typescript
// 属性修改配置
const modifyConfig: ModifyConfig = {
  targetComponentId: 'target-component-123',
  targetProperty: 'customize.title',
  updateValue: '新标题内容',
  updateMode: 'replace'  // 'replace' | 'append' | 'prepend'
}

// 完整交互配置示例
const interactionConfig: InteractionConfig = {
  event: 'click',
  responses: [{
    action: 'modify',
    modifyConfig: modifyConfig
  }]
}
```

## 数据变化事件系统

### DataChange 事件处理

`dataChange` 事件是响应组件属性变化的核心机制：

```typescript
// 数据变化条件配置
const condition: DataChangeCondition = {
  property: 'customize.value',     // 监听的属性
  operator: 'equals',              // 比较操作符
  value: 'target-value'           // 目标值
}

// 数据变化交互配置
const dataChangeConfig: InteractionConfig = {
  event: 'dataChange',
  watchedProperty: 'customize.value',
  condition: condition,
  responses: [{
    action: 'modify',
    modifyConfig: {
      targetComponentId: 'other-component',
      targetProperty: 'customize.backgroundColor',
      updateValue: '#ff0000'
    }
  }]
}
```

### 支持的比较操作符

```typescript
export type ComparisonOperator =
  | 'equals'              // 等于
  | 'notEquals'           // 不等于
  | 'greaterThan'         // 大于
  | 'lessThan'            // 小于
  | 'greaterThanOrEqual'  // 大于等于
  | 'lessThanOrEqual'     // 小于等于
  | 'contains'            // 包含
  | 'startsWith'          // 以...开始
  | 'endsWith'            // 以...结束
```

## 属性绑定系统

### 属性路径解析

交互系统支持通过路径表达式访问其他组件的属性：

```typescript
// 属性绑定表达式格式: componentInstanceId.propertyPath
const bindingExpression = 'comp-123.customize.title'

// 解析属性值
const value = interactionManager.resolvePropertyBinding(bindingExpression)

// 批量解析多个绑定
const bindingMap = {
  'title': 'comp-123.customize.title',
  'value': 'comp-456.customize.value'
}
const resolved = interactionManager.resolveMultipleBindings(bindingMap)
```

### 动态参数解析

用于HTTP配置等场景的参数绑定：

```typescript
// 简单绑定表达式
const parameter = interactionManager.resolveDynamicParameter('comp-123.customize.deviceId')

// 复杂参数配置对象
const parameterConfig = {
  type: 'component-property-binding',
  componentId: 'comp-123',
  propertyPath: 'customize.deviceId'
}
const resolved = interactionManager.resolveDynamicParameter(parameterConfig)
```

## 组件状态管理

### 组件交互状态

```typescript
export interface ComponentInteractionState {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  width?: string | number
  height?: string | number
  opacity?: number
  transform?: string
  visibility?: 'visible' | 'hidden'
  content?: any
  isAnimating?: boolean
}
```

### 状态更新和通知

```typescript
// 设置组件属性
interactionManager.setComponentProperty(
  'comp-123', 
  'customize.title', 
  '新标题'
)

// 批量属性更新
interactionManager.batchPropertyUpdate('comp-123', [
  { propertyPath: 'customize.title', newValue: '新标题' },
  { propertyPath: 'customize.color', newValue: '#ff0000' }
])

// 监听属性变化
const unwatch = interactionManager.watchComponentProperty(
  'comp-123',
  'customize.title',
  (newValue, oldValue) => {
    console.log('标题变化:', oldValue, '->', newValue)
  }
)
```

## 在组件中的集成

### 在组件定义中声明交互能力

```typescript
// src/card2.1/components/my-widget/definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'

export const myWidgetDefinition: ComponentDefinition = {
  type: 'my-widget',
  name: '我的组件',
  // ... 其他配置
  
  // 组件交互能力声明
  interactionCapability: {
    supportedEvents: ['click', 'hover', 'dataChange'],
    supportedActions: ['jump', 'modify'],
    defaultPermissions: {
      allowExternalControl: true,
      requirePermissionCheck: false
    },
    listenableProperties: ['customize.title', 'customize.value']
  }
}
```

### 在组件中响应交互事件

```vue
<!-- src/card2.1/components/my-widget/index.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { interactionManager } from '@/card2.1/core/interaction-manager'

const props = defineProps<{
  componentId: string
  // ... 其他props
}>()

// 注册交互配置
const interactionConfigs = [
  {
    event: 'click' as const,
    responses: [{
      action: 'jump' as const,
      jumpConfig: {
        jumpType: 'external' as const,
        url: 'https://example.com',
        target: '_blank'
      }
    }]
  }
]

onMounted(() => {
  // 注册组件交互
  interactionManager.registerComponent(props.componentId, interactionConfigs)
  
  // 监听DOM事件并响应状态变化
  const element = document.querySelector(`[data-component-id="${props.componentId}"]`)
  if (element) {
    element.addEventListener('componentStateUpdate', handleStateUpdate)
    element.addEventListener('componentPropertyUpdate', handlePropertyUpdate)
  }
})

onUnmounted(() => {
  // 清理注册
  interactionManager.unregisterComponent(props.componentId, interactionConfigs)
})

const handleStateUpdate = (event: CustomEvent) => {
  const { updates } = event.detail
  // 应用状态更新到组件UI
  console.log('组件状态更新:', updates)
}

const handlePropertyUpdate = (event: CustomEvent) => {
  const { propertyPath, value } = event.detail
  // 应用属性更新
  console.log('属性更新:', propertyPath, value)
}

const handleClick = () => {
  // 触发点击交互事件
  interactionManager.triggerEvent(props.componentId, 'click')
}
</script>

<template>
  <div 
    :data-component-id="componentId"
    @click="handleClick"
    class="my-widget"
  >
    <!-- 组件内容 -->
  </div>
</template>
```

## HTTP数据源集成

### 注册HTTP数据源映射

当组件使用HTTP数据源时，需要注册映射以支持属性变化响应：

```typescript
// 在组件中注册HTTP数据源
interactionManager.registerHttpDataSource(
  componentId,
  componentType,
  httpConfig
)

// 组件销毁时清理
onUnmounted(() => {
  interactionManager.unregisterHttpDataSource(componentId)
})
```

### HTTP参数属性绑定

HTTP配置中可以使用属性绑定表达式：

```typescript
const httpConfig = {
  url: 'https://api.example.com/data',
  method: 'GET',
  params: {
    // 绑定到其他组件的属性
    deviceId: 'device-selector-123.customize.selectedDeviceId',
    startTime: 'time-picker-456.customize.startTime'
  }
}
```

当被绑定的属性发生变化时，HTTP数据源会自动刷新。

## 最佳实践

### 1. 交互配置命名

```typescript
const interactionConfigs = [
  {
    name: '点击跳转到详情页面',
    event: 'click',
    responses: [/* ... */]
  },
  {
    name: '数值超阈值时变红',
    event: 'dataChange',
    watchedProperty: 'customize.value',
    condition: { operator: 'greaterThan', value: 100 },
    responses: [/* ... */]
  }
]
```

### 2. 错误处理

```typescript
try {
  const results = interactionManager.triggerEvent(componentId, 'click')
  results.forEach(result => {
    if (!result.success) {
      console.error('交互执行失败:', result.error)
    }
  })
} catch (error) {
  console.error('交互系统错误:', error)
}
```

### 3. 性能优化

```typescript
// 使用优先级控制执行顺序
const highPriorityConfig = {
  event: 'click',
  priority: 100,  // 高优先级
  responses: [/* ... */]
}

// 条件判断避免不必要的执行
const conditionalConfig = {
  event: 'dataChange',
  condition: {
    property: 'customize.enabled',
    operator: 'equals',
    value: true
  },
  responses: [/* ... */]
}
```

## 调试和监控

### 获取系统状态

```typescript
// 获取所有已注册的组件
const registeredComponents = interactionManager.getRegisteredComponents()

// 获取所有组件的属性状态
const allProperties = interactionManager.getAllComponentProperties()

// 获取特定组件的交互配置
const configs = interactionManager.getComponentConfigs(componentId)
```

### 调试日志

交互管理器内置了详细的调试日志，在开发环境中会输出：

- 组件注册/注销信息
- 交互事件触发详情
- 属性绑定解析过程
- HTTP数据源刷新状态

## 向后兼容性

系统保持与旧版本API的兼容性：

```typescript
// 新版本推荐用法
{
  action: 'jump',
  jumpConfig: { jumpType: 'external', url: 'https://example.com' }
}

// 旧版本格式仍然支持
{
  action: 'navigateToUrl',
  value: 'https://example.com',
  target: '_blank'
}
```

通过 `InteractionAdapter` 自动处理格式转换，确保平滑升级。

## 总结

Card 2.1 交互系统提供了一套完整的组件间交互解决方案：

1. **事件驱动**：基于标准的点击、悬停、数据变化事件
2. **类型安全**：完整的TypeScript类型定义
3. **属性绑定**：支持组件间的响应式属性绑定
4. **灵活配置**：支持条件判断、优先级、延迟等高级配置
5. **性能优化**：单例管理、批量更新、智能刷新
6. **向后兼容**：保持与旧版本API的兼容性

通过合理使用交互系统，可以构建出功能丰富、响应灵敏的动态仪表板应用。