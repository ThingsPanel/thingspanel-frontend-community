# Card2.1 数据源架构优化方案

## 🚨 当前问题分析

### 硬编码依赖问题

当前 `Card2Wrapper` 中的数据处理逻辑存在严重的硬编码问题：

```typescript
// ❌ 当前硬编码方式 - 缺乏扩展性
const getComponentSpecificProps = () => {
  if (props.componentType === 'dual-data-display') {
    // 硬编码处理双数据源
    specificProps.dataSource1 = executorData.value.dataSource1
    specificProps.dataSource2 = executorData.value.dataSource2
  }
  
  if (props.componentType === 'triple-data-display') {
    // 硬编码处理三数据源
    specificProps.dataSource1 = executorData.value.dataSource1
    specificProps.dataSource2 = executorData.value.dataSource2
    specificProps.dataSource3 = executorData.value.dataSource3
  }
  
  // 每增加一个新组件都需要修改这里！
}
```

### 问题根源

1. **组件定义与数据处理分离**：组件定义中已经有标准化的 `dataSources` 配置，但 Card2Wrapper 没有利用这些信息
2. **缺乏通用机制**：没有通用的数据源映射机制，每个组件都需要单独处理
3. **维护成本高**：每增加一个新的多数据源组件，都需要修改 Card2Wrapper
4. **容易出错**：手动维护映射关系容易遗漏或出错

## 🎯 优化方案设计

### 方案一：基于组件定义的动态数据源映射

#### 核心思路
利用组件定义中的 `dataSources` 配置，动态生成数据源映射关系。

```typescript
// ✅ 优化后的通用方式
const getComponentSpecificProps = () => {
  const specificProps: Record<string, any> = {}
  
  // 🔥 通用数据源处理逻辑
  const componentDefinition = getComponentDefinition(props.componentType)
  if (componentDefinition?.dataSources) {
    // 根据组件定义动态映射数据源
    Object.keys(componentDefinition.dataSources).forEach(dataSourceKey => {
      if (executorData.value[dataSourceKey]) {
        specificProps[dataSourceKey] = executorData.value[dataSourceKey]
      }
    })
  }
  
  // 处理兜底情况（main字段等）
  handleFallbackDataMapping(specificProps, executorData.value, componentDefinition)
  
  return specificProps
}
```

#### 实现步骤

1. **创建组件定义查询服务**
```typescript
// src/card2.1/core/component-registry.ts
export class ComponentRegistry {
  private static definitions = new Map<string, ComponentDefinition>()
  
  static register(definition: ComponentDefinition) {
    this.definitions.set(definition.type, definition)
  }
  
  static get(componentType: string): ComponentDefinition | undefined {
    return this.definitions.get(componentType)
  }
  
  static getDataSourceKeys(componentType: string): string[] {
    const definition = this.get(componentType)
    return definition?.dataSources ? Object.keys(definition.dataSources) : []
  }
}
```

2. **创建通用数据源映射器**
```typescript
// src/components/visual-editor/renderers/canvas/DataSourceMapper.ts
export class DataSourceMapper {
  /**
   * 根据组件定义动态映射数据源
   */
  static mapDataSources(
    componentType: string,
    executorData: Record<string, any>
  ): Record<string, any> {
    const specificProps: Record<string, any> = {}
    
    // 获取组件定义
    const definition = ComponentRegistry.get(componentType)
    if (!definition?.dataSources) {
      console.warn(`⚠️ 组件 ${componentType} 没有数据源定义`)
      return specificProps
    }
    
    // 动态映射数据源
    Object.keys(definition.dataSources).forEach(dataSourceKey => {
      const dataSourceConfig = definition.dataSources![dataSourceKey]
      
      // 直接映射
      if (executorData[dataSourceKey]) {
        specificProps[dataSourceKey] = executorData[dataSourceKey]
        console.log(`🔥 [DataSourceMapper] 映射数据源 ${dataSourceKey}:`, executorData[dataSourceKey])
      }
      // 设置默认值
      else if (dataSourceConfig.required === false) {
        specificProps[dataSourceKey] = null
        console.log(`🔥 [DataSourceMapper] 设置默认值 ${dataSourceKey}: null`)
      }
    })
    
    // 处理兜底情况
    this.handleFallbackMapping(specificProps, executorData, definition)
    
    return specificProps
  }
  
  /**
   * 处理兜底数据映射（main字段等）
   */
  private static handleFallbackMapping(
    specificProps: Record<string, any>,
    executorData: Record<string, any>,
    definition: ComponentDefinition
  ) {
    const dataSourceKeys = Object.keys(definition.dataSources || {})
    const hasAnyMappedData = dataSourceKeys.some(key => specificProps[key] !== null && specificProps[key] !== undefined)
    
    // 如果没有任何映射数据，尝试从main字段提取
    if (!hasAnyMappedData && executorData.main) {
      console.log('🔥 [DataSourceMapper] 检测到main数据格式，进行兜底映射:', executorData.main)
      
      const mainData = executorData.main
      
      if (Array.isArray(mainData)) {
        // 数组格式：按索引分配给数据源
        dataSourceKeys.forEach((key, index) => {
          specificProps[key] = mainData[index] || null
        })
      } else if (typeof mainData === 'object' && mainData !== null) {
        // 对象格式：检查是否包含数据源键
        if (dataSourceKeys.some(key => mainData[key] !== undefined)) {
          dataSourceKeys.forEach(key => {
            specificProps[key] = mainData[key]
          })
        } else {
          // 将整个对象分配给所有数据源
          dataSourceKeys.forEach(key => {
            specificProps[key] = mainData
          })
        }
      } else {
        // 基础类型：分配给所有数据源
        dataSourceKeys.forEach(key => {
          specificProps[key] = mainData
        })
      }
    }
  }
}
```

3. **修改 Card2Wrapper 使用通用映射器**
```typescript
// Card2Wrapper.vue 中的修改
import { DataSourceMapper } from './DataSourceMapper'
import { ComponentRegistry } from '@/card2.1/core/component-registry'

const getComponentSpecificProps = () => {
  console.log('🔥 [Card2Wrapper] 开始通用数据源映射，组件类型:', props.componentType)
  console.log('🔥 [Card2Wrapper] 执行器数据:', executorData.value)
  
  // 🔥 使用通用数据源映射器
  const specificProps = DataSourceMapper.mapDataSources(
    props.componentType,
    executorData.value
  )
  
  console.log('🔥 [Card2Wrapper] 映射结果:', specificProps)
  return specificProps
}
```

### 方案二：基于约定的数据源命名规范

#### 核心思路
建立数据源命名约定，让组件自动识别和处理数据源。

```typescript
// ✅ 约定式数据源处理
const getComponentSpecificProps = () => {
  const specificProps: Record<string, any> = {}
  
  // 🔥 约定：所有以 dataSource 开头的字段都是数据源
  Object.keys(executorData.value).forEach(key => {
    if (key.startsWith('dataSource')) {
      specificProps[key] = executorData.value[key]
    }
  })
  
  // 如果没有找到约定格式的数据源，使用兜底逻辑
  if (Object.keys(specificProps).length === 0) {
    handleFallbackDataMapping(specificProps, executorData.value)
  }
  
  return specificProps
}
```

### 方案三：混合方案（推荐）

结合方案一和方案二的优点：

1. **优先使用组件定义**：如果能找到组件定义，使用定义中的数据源配置
2. **兜底使用约定**：如果找不到组件定义，使用命名约定
3. **最后使用兜底**：处理历史数据和特殊情况

```typescript
const getComponentSpecificProps = () => {
  console.log('🔥 [Card2Wrapper] 开始智能数据源映射')
  
  // 方案1：基于组件定义的映射
  let specificProps = DataSourceMapper.mapDataSources(
    props.componentType,
    executorData.value
  )
  
  // 方案2：如果组件定义映射失败，使用约定式映射
  if (Object.keys(specificProps).length === 0) {
    console.log('🔥 [Card2Wrapper] 组件定义映射失败，使用约定式映射')
    specificProps = ConventionMapper.mapByConvention(executorData.value)
  }
  
  // 方案3：最后的兜底处理
  if (Object.keys(specificProps).length === 0) {
    console.log('🔥 [Card2Wrapper] 约定式映射失败，使用兜底映射')
    specificProps = FallbackMapper.mapFallback(executorData.value)
  }
  
  return specificProps
}
```

## 🚀 实施计划

### ✅ 阶段一：基础设施建设（已完成）
1. ✅ 创建 `ComponentRegistry` 组件注册表
2. ✅ 创建 `DataSourceMapper` 通用映射器
3. ✅ 修改组件注册流程，自动注册到 Registry

### ✅ 阶段二：Card2Wrapper 重构（已完成）
1. ✅ 移除硬编码的组件类型判断
2. ✅ 集成通用数据源映射器
3. ✅ 保留兜底处理逻辑确保向后兼容

### 🔄 阶段三：测试和验证（进行中）
1. ✅ 测试现有组件（dual-data-display, triple-data-display）
2. 🔄 创建新的多数据源组件验证扩展性
3. 🔄 性能测试和优化

### ✅ 阶段四：文档和规范（已完成）
1. ✅ 更新组件开发指南
2. ✅ 建立数据源配置规范
3. ✅ 提供最佳实践示例

## 🎉 实现状态

### 已完成的功能
- ✅ **ComponentRegistry**: 统一组件定义管理
- ✅ **DataSourceMapper**: 通用数据源映射
- ✅ **Card2Wrapper集成**: 移除硬编码逻辑
- ✅ **自动组件注册**: 启动时自动注册所有组件
- ✅ **类型安全**: 完整的TypeScript类型支持
- ✅ **测试框架**: 完整的测试用例
- ✅ **向后兼容**: 保持现有API不变

### 核心文件
- `src/card2.1/core/component-registry.ts` - 组件注册表
- `src/card2.1/core/data-source-mapper.ts` - 数据源映射器
- `src/card2.1/core/test-data-source-mapper.ts` - 测试文件
- `src/components/visual-editor/renderers/canvas/Card2Wrapper.vue` - 集成实现
- `src/card2.1/index.ts` - 组件自动注册
- `src/card2.1/core/index.ts` - 核心模块导出

## 🚀 使用指南

### 1. 添加新组件

```typescript
// 1. 在组件定义中声明数据源
const newComponentDefinition: ComponentDefinition = {
  type: 'my-new-component',
  name: '我的新组件',
  dataSources: {
    primaryData: { type: 'api', name: '主数据', required: true },
    secondaryData: { type: 'static', name: '辅助数据', required: false }
  },
  staticParams: {
    title: { type: 'string', name: '标题', default: '默认标题' }
  }
}

// 2. 注册组件（通常在index.ts中自动完成）
ComponentRegistry.register(newComponentDefinition)
```

### 2. 组件自动获得数据

```vue
<!-- 组件会自动接收映射后的数据 -->
<template>
  <div>
    <h3>{{ title }}</h3>
    <div>主数据: {{ primaryData }}</div>
    <div>辅助数据: {{ secondaryData }}</div>
  </div>
</template>

<script setup lang="ts">
// 无需手动处理数据映射，Card2Wrapper会自动处理
defineProps<{
  primaryData?: any
  secondaryData?: any
  title?: string
}>()
</script>
```

### 3. 系统状态检查

```typescript
import { getCard2CoreStatus, validateCard2Core } from '@/card2.1/core'

// 检查系统状态
const status = getCard2CoreStatus()
console.log('组件数量:', status.componentCount)
console.log('已注册组件:', status.registeredComponents)

// 验证系统完整性
const validation = validateCard2Core()
if (!validation.isValid) {
  console.error('系统验证失败:', validation.errors)
}
```

### 4. 测试新组件

```typescript
import { testDataSourceMapper } from '@/card2.1/core/test-data-source-mapper'

// 运行完整测试
testDataSourceMapper()

// 或运行特定测试
import { testComponentRegistration } from '@/card2.1/core/test-data-source-mapper'
testComponentRegistration()
```

## 🎯 预期收益

### 开发效率提升
- **新组件开发**：只需定义 `dataSources` 配置，无需修改 Card2Wrapper
- **维护成本降低**：通用逻辑减少重复代码和维护工作
- **错误减少**：自动化映射减少人为错误

### 架构质量改善
- **扩展性增强**：支持任意数量的数据源组件
- **一致性保证**：统一的数据源处理逻辑
- **可测试性**：独立的映射器便于单元测试

### 向后兼容性
- **平滑迁移**：保留兜底逻辑确保现有组件正常工作
- **渐进式改进**：可以逐步迁移现有组件到新架构
- **零破坏性**：不影响现有功能和用户体验

## 📋 总结

通过引入通用的数据源映射机制，我们可以彻底解决当前硬编码依赖的问题，建立一个可扩展、可维护的数据源处理架构。这个方案不仅解决了当前的技术债务，还为未来的组件开发提供了坚实的基础。